/* ============================================================
   Parche v1.0 - Correcciones del sistema Grupo Condado
   Para bases que ya existen. Es idempotente: se puede ejecutar más de una vez.
   Ejecutar con:  sqlcmd -S <servidor> -E -b -f 65001 -i Parche_v1.0_correcciones.sql
   (-b corta en el primer error; con XACT_ABORT la transacción se deshace entera)
   ============================================================ */
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
COMMIT;
GO
