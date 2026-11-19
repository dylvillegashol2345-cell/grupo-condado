/* Consultas de consistencia de la base (tarea 8 y sección 3 de las correcciones v1.0).
   Cada una tiene que devolver 0 o ninguna fila.
   Uso:  sqlcmd -S <servidor> -E -I -f 65001 -d GestionPropiedadesCondado -i pruebas\consistencia.sql */
SET NOCOUNT ON;

SELECT N'Propiedades sin propietario válido' AS Control, COUNT(*) AS Filas
FROM Propiedad p LEFT JOIN Propietario o ON o.IdPropietario = p.IdPropietario WHERE o.IdPropietario IS NULL
UNION ALL
SELECT N'Propiedades con estado inválido', COUNT(*)
FROM Propiedad WHERE Estado NOT IN ('Disponible', 'Reservada', 'Alquilada', 'Vendida')
UNION ALL
SELECT N'Publicadas sin matrícula o título (RN3)', COUNT(*)
FROM Propiedad WHERE Publicada = 1 AND (MatriculaVerificada = 0 OR TituloPropiedad = 0)
UNION ALL
SELECT N'Contratos con fin anterior o igual al inicio', COUNT(*)
FROM Contrato WHERE FechaFin <= FechaInicio
UNION ALL
SELECT N'Pagos con monto cero o negativo', COUNT(*)
FROM Pago WHERE Monto <= 0
UNION ALL
SELECT N'Emails de usuario repetidos', COUNT(*)
FROM (SELECT Email FROM Usuario GROUP BY Email HAVING COUNT(*) > 1) d
UNION ALL
SELECT N'Citas del mismo agente a la misma hora', COUNT(*)
FROM (SELECT IdUsuario, Fecha, Hora FROM Cita WHERE Estado <> 'Cancelada' GROUP BY IdUsuario, Fecha, Hora HAVING COUNT(*) > 1) d
UNION ALL
-- Operaciones cuyo estado de propiedad no corresponde (RN5); las dadas de baja no cuentan
SELECT N'Operaciones con la propiedad en un estado que no corresponde', COUNT(*)
FROM Operacion o JOIN Propiedad p ON p.IdPropiedad = o.IdPropiedad
WHERE o.Activo = 1
  AND ((o.Tipo = 'Venta' AND p.Estado <> 'Vendida')
    OR (o.Tipo = 'Alquiler' AND p.Estado NOT IN ('Alquilada', 'Disponible')));
