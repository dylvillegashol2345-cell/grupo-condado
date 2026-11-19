/* ============================================================
   Parche v1.0 - Correcciones del sistema Grupo Condado
   Para bases que ya existen. Es idempotente: se puede ejecutar más de una vez.
   Ejecutar con:  sqlcmd -S <servidor> -E -b -f 65001 -i Parche_v1.0_correcciones.sql
   (-b corta en el primer error; con XACT_ABORT la transacción se deshace entera)
   ============================================================ */
-- Con estas opciones se crean los procedimientos: el índice filtrado de Cita las exige
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO
USE [GestionPropiedadesCondado];
GO
SET XACT_ABORT ON;
BEGIN TRAN;
GO

/* ----------------------------------------------------------
   CORRECCIONES v1.0 - Tarea 1: sesiones para validar permisos en la API
   ---------------------------------------------------------- */
IF OBJECT_ID(N'dbo.Sesion', N'U') IS NULL
CREATE TABLE [Sesion] (
    [IdSesion]  INT IDENTITY(1,1) NOT NULL,
    [IdUsuario] INT NOT NULL,
    [TokenHash] VARBINARY(32) NOT NULL,
    [Vence]     DATETIME2 NOT NULL,
    [Revocada]  BIT NOT NULL CONSTRAINT [DF_Sesion_Revocada] DEFAULT (0),
    CONSTRAINT [PK_Sesion] PRIMARY KEY ([IdSesion]),
    CONSTRAINT [UQ_Sesion_TokenHash] UNIQUE ([TokenHash]),
    -- Al borrar un usuario se borran sus sesiones; sin esto la FK impediría borrar a quien ya ingresó
    CONSTRAINT [FK_Sesion_Usuario] FOREIGN KEY ([IdUsuario]) REFERENCES [Usuario] ([IdUsuario]) ON DELETE CASCADE
);
GO

-- Se guarda el SHA-256 del token, nunca el token
CREATE OR ALTER PROCEDURE SP_Sesion_Insert @IdUsuario INT, @TokenHash VARBINARY(32), @Horas INT = 8 AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO Sesion (IdUsuario, TokenHash, Vence)
    VALUES (@IdUsuario, @TokenHash, DATEADD(HOUR, @Horas, SYSDATETIME()));
END;
GO

-- El rol se lee en cada solicitud, así un cambio de rol vale enseguida
CREATE OR ALTER PROCEDURE SP_Sesion_Validar @TokenHash VARBINARY(32) AS
BEGIN
    SET NOCOUNT ON;
    SELECT s.IdUsuario, r.Nombre AS Rol
    FROM Sesion s
    JOIN Usuario u ON u.IdUsuario = s.IdUsuario
    JOIN Rol r ON r.IdRol = u.IdRol
    WHERE s.TokenHash = @TokenHash AND s.Revocada = 0 AND s.Vence > SYSDATETIME();
END;
GO

CREATE OR ALTER PROCEDURE SP_Sesion_Revocar @TokenHash VARBINARY(32) AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Sesion SET Revocada = 1 WHERE TokenHash = @TokenHash;
END;
GO

-- Cliente de un usuario: el del mismo email, igual que utils/privacidad.js del front
CREATE OR ALTER PROCEDURE SP_Cliente_DelUsuario @IdUsuario INT AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP 1 c.IdCliente
    FROM Cliente c
    JOIN Usuario u ON u.IdUsuario = @IdUsuario
    WHERE (ISNULL(u.Email, '') <> '' AND LOWER(LTRIM(RTRIM(c.Email))) = LOWER(LTRIM(RTRIM(u.Email))))
       OR (ISNULL(u.NombreUsuario, '') <> '' AND c.Email LIKE u.NombreUsuario + '%')
    ORDER BY CASE WHEN LOWER(LTRIM(RTRIM(c.Email))) = LOWER(LTRIM(RTRIM(u.Email))) THEN 0 ELSE 1 END, c.IdCliente;
END;
GO


/* ----------------------------------------------------------
   CORRECCIONES v1.0 - Tarea 2: contraseñas con PBKDF2 y sal
   El hash lo calcula la API (texto PBKDF2$iteraciones$sal$hash); la base lo guarda tal cual.
   SP_Usuario_Login (SHA-256 en SQL) queda solo para validar y migrar las contraseñas viejas.
   ---------------------------------------------------------- */
CREATE OR ALTER PROCEDURE SP_Usuario_Insert
    @NombreUsuario NVARCHAR(100)=NULL,@Nombre NVARCHAR(100),@Email NVARCHAR(100),
    @Telefono NVARCHAR(20)=NULL,@Contrasena NVARCHAR(256),@IdRol INT
AS BEGIN
    IF EXISTS(SELECT 1 FROM Usuario WHERE Email=@Email) BEGIN RAISERROR('EMAIL_DUPLICADO',16,1); RETURN; END
    INSERT INTO Usuario(NombreUsuario,Nombre,Email,Telefono,Contrasena,IdRol)
    VALUES(ISNULL(@NombreUsuario,@Nombre),@Nombre,@Email,@Telefono,@Contrasena,@IdRol);
END;
GO

CREATE OR ALTER PROCEDURE SP_Usuario_Update
    @IdUsuario INT,@Nombre NVARCHAR(100),@Email NVARCHAR(100),
    @Contrasena NVARCHAR(256)=NULL,@IdRol INT
AS BEGIN
    IF @Contrasena IS NULL OR @Contrasena='' OR @Contrasena='___NOCHANGE___'
        UPDATE Usuario SET Nombre=@Nombre,Email=@Email,IdRol=@IdRol WHERE IdUsuario=@IdUsuario;
    ELSE
        UPDATE Usuario SET Nombre=@Nombre,Email=@Email,IdRol=@IdRol,Contrasena=@Contrasena WHERE IdUsuario=@IdUsuario;
END;
GO

-- Candidatos para ingresar: por nombre de usuario o nombre, o por id (cambio de contraseña)
CREATE OR ALTER PROCEDURE SP_Usuario_GetLogin @Nombre NVARCHAR(100)=NULL,@IdUsuario INT=NULL AS
BEGIN
    SET NOCOUNT ON;
    SELECT u.IdUsuario,u.NombreUsuario,u.Nombre,u.Email,r.Nombre AS Rol,u.Contrasena
    FROM Usuario u INNER JOIN Rol r ON u.IdRol=r.IdRol
    WHERE (@IdUsuario IS NOT NULL AND u.IdUsuario=@IdUsuario)
       OR (@IdUsuario IS NULL AND (u.Nombre=@Nombre OR u.NombreUsuario=@Nombre));
END;
GO

CREATE OR ALTER PROCEDURE SP_Usuario_UpdateContrasena @IdUsuario INT,@Contrasena NVARCHAR(256) AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Usuario SET Contrasena=@Contrasena WHERE IdUsuario=@IdUsuario;
END;
GO

/* ----------------------------------------------------------
   CORRECCIONES v1.0 - Tarea 4: operación y cambio de estado en una sola transacción
   ---------------------------------------------------------- */
CREATE OR ALTER PROCEDURE SP_Operacion_Insert @Tipo NVARCHAR(100),@Fecha DATE,@IdCliente INT,@IdPropiedad INT,@IdUsuario INT AS
BEGIN
    SET NOCOUNT ON; SET XACT_ABORT ON;
    IF @Tipo NOT IN ('Venta', 'Alquiler')
        THROW 50004, 'El tipo de operación tiene que ser Venta o Alquiler.', 1;
    BEGIN TRAN;
        -- RN4 y RN5. El UPDATE condicional bloquea la fila: si dos agentes registran a la vez,
        -- el segundo espera, encuentra la propiedad ya vendida o alquilada y no actualiza nada.
        UPDATE Propiedad
           SET Estado = CASE @Tipo WHEN 'Venta' THEN 'Vendida' ELSE 'Alquilada' END
         WHERE IdPropiedad = @IdPropiedad AND Estado = 'Disponible';
        IF @@ROWCOUNT = 0
        BEGIN
            ROLLBACK;
            THROW 50001, 'La propiedad ya no está disponible.', 1;
        END
        INSERT INTO Operacion (Tipo, Fecha, IdCliente, IdPropiedad, IdUsuario)
        VALUES (@Tipo, @Fecha, @IdCliente, @IdPropiedad, @IdUsuario);
        DECLARE @IdOperacion INT = SCOPE_IDENTITY();
    COMMIT;
    SELECT @IdOperacion AS IdOperacion;
END;
GO

/* ----------------------------------------------------------
   CORRECCIONES v1.0 - Tarea 3: RN3, no se publica sin matrícula y título
   ---------------------------------------------------------- */
CREATE OR ALTER PROCEDURE SP_Propiedad_Insert
    @IdPropietario INT,@Barrio NVARCHAR(100),@Calle NVARCHAR(100),
    @Numeracion NVARCHAR(100),@Piso NVARCHAR(10)=NULL,@NroDepto NVARCHAR(10)=NULL,
    @IdTipo INT,@IdLocalidad INT,@Precio DECIMAL(18,2),@Superficie DECIMAL(10,2),
    @Descripcion NVARCHAR(1000),@Estado NVARCHAR(50),@PanelesSolares BIT,
    @AislamientoTermico BIT,@CategoriaEco NVARCHAR(50),@Bonificacion DECIMAL(10,2),
    @MatriculaVerificada BIT,@TituloPropiedad BIT,
    @ArchivoMatricula NVARCHAR(MAX)=NULL,@ArchivoTitulo NVARCHAR(MAX)=NULL,
    @Publicada BIT,@Imagen NVARCHAR(MAX)=NULL,@Servicios NVARCHAR(200)=NULL,@Moneda NVARCHAR(10)='ARS',
    @Tour360 NVARCHAR(MAX)=NULL
AS BEGIN
    IF @Publicada = 1 AND (ISNULL(@MatriculaVerificada, 0) = 0 OR ISNULL(@TituloPropiedad, 0) = 0)
        THROW 50002, 'No se puede publicar la propiedad sin matrícula y título.', 1;
    INSERT INTO Propiedad(IdPropietario,Barrio,Calle,Numeracion,Piso,NroDepto,IdTipo,IdLocalidad,
        Precio,Superficie,Descripcion,Estado,PanelesSolares,AislamientoTermico,
        CategoriaEco,Bonificacion,MatriculaVerificada,TituloPropiedad,
        ArchivoMatricula,ArchivoTitulo,Publicada,Imagen,Servicios,Moneda,Tour360)
    VALUES(@IdPropietario,@Barrio,@Calle,@Numeracion,@Piso,@NroDepto,@IdTipo,@IdLocalidad,
        @Precio,@Superficie,@Descripcion,@Estado,@PanelesSolares,@AislamientoTermico,
        @CategoriaEco,@Bonificacion,@MatriculaVerificada,@TituloPropiedad,
        @ArchivoMatricula,@ArchivoTitulo,@Publicada,@Imagen,@Servicios,@Moneda,@Tour360);
    SELECT SCOPE_IDENTITY() AS IdPropiedad;
END;
GO

CREATE OR ALTER PROCEDURE SP_Propiedad_Update
    @IdPropiedad INT,@IdPropietario INT,@Barrio NVARCHAR(100),@Calle NVARCHAR(100),
    @Numeracion NVARCHAR(100),@Piso NVARCHAR(10)=NULL,@NroDepto NVARCHAR(10)=NULL,
    @IdTipo INT,@IdLocalidad INT,@Precio DECIMAL(18,2),@Superficie DECIMAL(10,2),
    @Descripcion NVARCHAR(1000),@Estado NVARCHAR(50),@PanelesSolares BIT,
    @AislamientoTermico BIT,@CategoriaEco NVARCHAR(50),@Bonificacion DECIMAL(10,2),
    @MatriculaVerificada BIT,@TituloPropiedad BIT,
    @ArchivoMatricula NVARCHAR(MAX)=NULL,@ArchivoTitulo NVARCHAR(MAX)=NULL,
    @Publicada BIT,@Imagen NVARCHAR(MAX)=NULL,@Servicios NVARCHAR(200)=NULL,@Moneda NVARCHAR(10)='ARS',
    @Tour360 NVARCHAR(MAX)=NULL
AS BEGIN
    IF @Publicada = 1 AND (ISNULL(@MatriculaVerificada, 0) = 0 OR ISNULL(@TituloPropiedad, 0) = 0)
        THROW 50002, 'No se puede publicar la propiedad sin matrícula y título.', 1;
    UPDATE Propiedad SET IdPropietario=@IdPropietario,Barrio=@Barrio,Calle=@Calle,
        Numeracion=@Numeracion,Piso=@Piso,NroDepto=@NroDepto,IdTipo=@IdTipo,
        IdLocalidad=@IdLocalidad,Precio=@Precio,Superficie=@Superficie,
        Descripcion=@Descripcion,Estado=@Estado,PanelesSolares=@PanelesSolares,
        AislamientoTermico=@AislamientoTermico,CategoriaEco=@CategoriaEco,
        Bonificacion=@Bonificacion,MatriculaVerificada=@MatriculaVerificada,
        TituloPropiedad=@TituloPropiedad,ArchivoMatricula=@ArchivoMatricula,
        ArchivoTitulo=@ArchivoTitulo,Publicada=@Publicada,Imagen=@Imagen,Servicios=@Servicios,Moneda=@Moneda,Tour360=@Tour360
    WHERE IdPropiedad=@IdPropiedad;
END;
GO

-- Datos existentes: las publicadas sin documentación pasan a no publicadas
UPDATE Propiedad SET Publicada = 0
WHERE Publicada = 1 AND (ISNULL(MatriculaVerificada, 0) = 0 OR ISNULL(TituloPropiedad, 0) = 0);
GO

/* ----------------------------------------------------------
   CORRECCIONES v1.0 - Tarea 8: restricciones de integridad (Anexo C.3)
   Primero se corrigen los datos de demostración que no las cumplen.
   ---------------------------------------------------------- */

-- Propiedades sin propietario.
-- a) Si el contrato de la propiedad ya nombra al dueño, ese es el propietario (se lo carga si no existía)
INSERT INTO Propietario (Nombre, Apellido, DNI, TipoDocumento)
SELECT DISTINCT
    LEFT(LTRIM(c.LocadorNombre), CHARINDEX(' ', LTRIM(c.LocadorNombre) + ' ') - 1),
    LTRIM(SUBSTRING(LTRIM(c.LocadorNombre), CHARINDEX(' ', LTRIM(c.LocadorNombre) + ' ') + 1, 100)),
    c.LocadorDni, N'DNI'
FROM Contrato c
JOIN Operacion o ON o.IdOperacion = c.IdOperacion
JOIN Propiedad p ON p.IdPropiedad = o.IdPropiedad
WHERE p.IdPropietario IS NULL AND ISNULL(c.LocadorDni, '') <> ''
  AND NOT EXISTS (SELECT 1 FROM Propietario pr WHERE pr.DNI = c.LocadorDni);

UPDATE p SET IdPropietario = pr.IdPropietario
FROM Propiedad p
JOIN Operacion o ON o.IdPropiedad = p.IdPropiedad
JOIN Contrato c ON c.IdOperacion = o.IdOperacion
JOIN Propietario pr ON pr.DNI = c.LocadorDni
WHERE p.IdPropietario IS NULL AND ISNULL(c.LocadorDni, '') <> '';

-- b) El resto se reparte entre los propietarios que tienen menos propiedades
WITH sin AS (
    SELECT IdPropiedad, ROW_NUMBER() OVER (ORDER BY IdPropiedad) - 1 AS n
    FROM Propiedad WHERE IdPropietario IS NULL
), duenios AS (
    SELECT pr.IdPropietario, COUNT(*) OVER () AS total,
           ROW_NUMBER() OVER (ORDER BY (SELECT COUNT(*) FROM Propiedad x WHERE x.IdPropietario = pr.IdPropietario), pr.IdPropietario) - 1 AS n
    FROM Propietario pr
)
UPDATE p SET IdPropietario = d.IdPropietario
FROM Propiedad p
JOIN sin s ON s.IdPropiedad = p.IdPropiedad
JOIN duenios d ON d.n = s.n % d.total;

-- c) Los contratos sin locador cargado toman los datos del propietario
UPDATE c SET LocadorNombre = LTRIM(RTRIM(ISNULL(pr.Nombre, '') + ' ' + ISNULL(pr.Apellido, ''))),
             LocadorDni = pr.DNI,
             LocadorDomicilio = LTRIM(RTRIM(ISNULL(pr.Calle, '') + ' ' + ISNULL(pr.Numeracion, '')))
FROM Contrato c
JOIN Operacion o ON o.IdOperacion = c.IdOperacion
JOIN Propiedad p ON p.IdPropiedad = o.IdPropiedad
JOIN Propietario pr ON pr.IdPropietario = p.IdPropietario
WHERE ISNULL(c.LocadorNombre, '') = '';

-- Piso y número de depto: vacío es "sin dato", igual que NULL
UPDATE Propiedad SET Piso = NULL WHERE Piso = '';
UPDATE Propiedad SET NroDepto = NULL WHERE NroDepto = '';
GO

IF OBJECT_ID(N'FK_Propiedad_Propietario', N'F') IS NULL
    ALTER TABLE Propiedad ADD CONSTRAINT FK_Propiedad_Propietario
        FOREIGN KEY (IdPropietario) REFERENCES Propietario (IdPropietario);
IF OBJECT_ID(N'CK_Propiedad_Estado', N'C') IS NULL
    ALTER TABLE Propiedad ADD CONSTRAINT CK_Propiedad_Estado
        CHECK (Estado IN ('Disponible', 'Reservada', 'Alquilada', 'Vendida'));
IF OBJECT_ID(N'CK_Propiedad_Publicada', N'C') IS NULL
    ALTER TABLE Propiedad ADD CONSTRAINT CK_Propiedad_Publicada
        CHECK (Publicada = 0 OR (MatriculaVerificada = 1 AND TituloPropiedad = 1));
IF OBJECT_ID(N'CK_Contrato_Fechas', N'C') IS NULL
    ALTER TABLE Contrato ADD CONSTRAINT CK_Contrato_Fechas CHECK (FechaFin > FechaInicio);
IF OBJECT_ID(N'CK_Pago_Monto', N'C') IS NULL
    ALTER TABLE Pago ADD CONSTRAINT CK_Pago_Monto CHECK (Monto > 0);
IF OBJECT_ID(N'UQ_Usuario_Email', N'UQ') IS NULL
    ALTER TABLE Usuario ADD CONSTRAINT UQ_Usuario_Email UNIQUE (Email);
-- Las citas sin agente quedan afuera: no se pisan entre sí
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UX_Cita_Agenda' AND object_id = OBJECT_ID(N'Cita'))
    CREATE UNIQUE INDEX UX_Cita_Agenda ON Cita (IdUsuario, Fecha, Hora)
        WHERE Estado <> 'Cancelada' AND IdUsuario IS NOT NULL;
GO
COMMIT;
GO
