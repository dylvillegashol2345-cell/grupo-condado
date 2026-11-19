# Pruebas de la baja lógica (tarea 11): operaciones, contratos y cobros se conservan.
# Crea una propiedad con su operación, contrato y cobro de prueba; al final los borra físicamente.
# Uso:  powershell -ExecutionPolicy Bypass -File pruebas\baja-logica.ps1 [-Servidor Dylan]
param([string]$Servidor = "Dylan")

$fallas = 0
function Sql($consulta) { (sqlcmd -S $Servidor -E -I -d GestionPropiedadesCondado -h -1 -W -b -Q "SET NOCOUNT ON; $consulta" 2>&1) | Where-Object { $_ -ne "" } }
function Esperar($nombre, $ok) {
    if (-not $ok) { $script:fallas++ }
    "{0,-5} {1}" -f ($(if ($ok) { "OK" } else { "FALLA" })), $nombre
}

$crear = "DECLARE @cols NVARCHAR(MAX) = (SELECT STRING_AGG(QUOTENAME(name), ',') FROM sys.columns WHERE object_id = OBJECT_ID('Propiedad') AND is_identity = 0 AND name NOT IN ('Barrio', 'Estado'));
EXEC (N'INSERT INTO Propiedad (Barrio, Estado, ' + @cols + N') SELECT N''PRUEBA BAJA'', N''Disponible'', ' + @cols + N' FROM Propiedad WHERE IdPropiedad = 1');
SELECT MAX(IdPropiedad) FROM Propiedad WHERE Barrio = N'PRUEBA BAJA';"
$p = [int](Sql $crear | Select-Object -Last 1)
$o = [int](Sql "EXEC SP_Operacion_Insert 'Alquiler', '$(Get-Date -Format yyyy-MM-dd)', 1, $p, 2" | Select-Object -Last 1)
$c = [int](Sql "EXEC SP_Contrato_Insert @FechaInicio = '2026-12-01', @FechaFin = '2027-12-01', @IdOperacion = $o, @CanonMensual = 100000" | Select-Object -Last 1)
Sql "EXEC SP_Pago_Insert 100000, '2026-12-05', $c, 'ARS'" | Out-Null
$pago = [int](Sql "SELECT MAX(IdPago) FROM Pago WHERE IdContrato = $c")
"Datos de prueba: propiedad $p, operación $o, contrato $c, cobro $pago"

"--- La propiedad con operaciones no se puede borrar"
Esperar "SP_Propiedad_Delete lo rechaza (Resolución UIF 43/2024)" ("$(Sql "EXEC SP_Propiedad_Delete $p")" -match "UIF")
Esperar "...y no borró la operación ni el contrato" ((Sql "SELECT (SELECT COUNT(*) FROM Operacion WHERE IdOperacion = $o) + (SELECT COUNT(*) FROM Contrato WHERE IdContrato = $c)") -eq "2")

"--- Bajas lógicas"
Esperar "No se da de baja un contrato con cobros activos" ("$(Sql "EXEC SP_Contrato_Delete $c")" -match "cobros registrados")
Sql "EXEC SP_Pago_Delete $pago" | Out-Null
Esperar "El cobro dado de baja sigue en la base (Activo = 0)" ((Sql "SELECT Activo FROM Pago WHERE IdPago = $pago") -eq "0")
Esperar "...y ya no aparece en el listado" ((Sql "CREATE TABLE #l (IdPago INT, Monto DECIMAL(18,2), Fecha DATE, IdContrato INT, Moneda NVARCHAR(10)); INSERT #l EXEC SP_Pago_GetAll; SELECT COUNT(*) FROM #l WHERE IdPago = $pago") -eq "0")
Sql "EXEC SP_Contrato_Delete $c" | Out-Null
Esperar "Sin cobros activos, el contrato se da de baja y se conserva" ((Sql "SELECT Activo FROM Contrato WHERE IdContrato = $c") -eq "0")
Sql "EXEC SP_Operacion_Delete $o" | Out-Null
Esperar "La operación se da de baja y se conserva, con su comisión" ((Sql "SELECT CAST(Activo AS VARCHAR) + ' ' + CAST((SELECT COUNT(*) FROM Comision WHERE IdOperacion = $o) AS VARCHAR) FROM Operacion WHERE IdOperacion = $o") -eq "0 1")
Esperar "La operación dada de baja no aparece por id" ((Sql "SELECT COUNT(*) FROM (SELECT 1 x FROM Operacion WHERE IdOperacion = $o AND Activo = 1) t") -eq "0")
Esperar "La propiedad sigue sin poder borrarse: su historial se conserva" ("$(Sql "EXEC SP_Propiedad_Delete $p")" -match "UIF")

# Limpieza física de los datos de prueba
Sql "DELETE FROM Pago WHERE IdContrato = $c; DELETE FROM Contrato WHERE IdContrato = $c; DELETE FROM Comision WHERE IdOperacion = $o; DELETE FROM Operacion WHERE IdOperacion = $o; DELETE FROM Propiedad WHERE IdPropiedad = $p;" | Out-Null
Esperar "Limpieza: no quedan datos de prueba" ((Sql "SELECT COUNT(*) FROM Propiedad WHERE Barrio = N'PRUEBA BAJA'") -eq "0")

""
if ($fallas -eq 0) { "Todas las pruebas de baja lógica pasaron." } else { "$fallas prueba(s) fallaron."; exit 1 }
