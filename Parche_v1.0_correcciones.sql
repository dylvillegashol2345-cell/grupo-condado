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

COMMIT;
GO
