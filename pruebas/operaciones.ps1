# Pruebas de la transacción de operaciones (CP-15, CP-29, CP-30, CP-35), directo contra la base.
# Crea dos propiedades de prueba, las usa y al final las borra junto con sus operaciones.
# Uso:  powershell -ExecutionPolicy Bypass -File pruebas\operaciones.ps1 [-Servidor Dylan]
param([string]$Servidor = "Dylan")

$fallas = 0
function Sql($consulta) { sqlcmd -S $Servidor -E -I -d GestionPropiedadesCondado -h -1 -W -b -Q "SET NOCOUNT ON; $consulta" 2>&1 }
function Esperar($nombre, $ok) {
    if (-not $ok) { $script:fallas++ }
    "{0,-5} {1}" -f ($(if ($ok) { "OK" } else { "FALLA" })), $nombre
}

# Copia de la propiedad 1 como Disponible, para no tocar datos reales
$crear = @"
DECLARE @cols NVARCHAR(MAX) = (SELECT STRING_AGG(QUOTENAME(name), ',') FROM sys.columns
    WHERE object_id = OBJECT_ID('Propiedad') AND is_identity = 0 AND name NOT IN ('Barrio', 'Estado'));
EXEC (N'INSERT INTO Propiedad (Barrio, Estado, ' + @cols + N') SELECT N''PRUEBA TRANSACCION'', N''Disponible'', ' + @cols + N' FROM Propiedad WHERE IdPropiedad = 1');
SELECT SCOPE_IDENTITY();
"@
$p1 = [int](Sql "$crear; SELECT MAX(IdPropiedad) FROM Propiedad WHERE Barrio = N'PRUEBA TRANSACCION'" | Select-Object -Last 1)
$p2 = [int](Sql "$crear; SELECT MAX(IdPropiedad) FROM Propiedad WHERE Barrio = N'PRUEBA TRANSACCION'" | Select-Object -Last 1)
$hoy = Get-Date -Format "yyyy-MM-dd"
"Propiedades de prueba: $p1 y $p2"

"--- CP-29: si falla a mitad de camino no queda nada"
# El cliente -999 no existe: el INSERT de la operación falla por la clave foránea DESPUÉS de cambiar el estado
$r = Sql "EXEC SP_Operacion_Insert 'Venta', '$hoy', -999, $p1, 2"
Esperar "El procedimiento informa el error (FK_Operacion_Cliente)" ("$r" -match "FK_Operacion_Cliente")
Esperar "La propiedad sigue Disponible (se deshizo el cambio de estado)" ((Sql "SELECT Estado FROM Propiedad WHERE IdPropiedad = $p1") -eq "Disponible")
Esperar "No quedó ninguna operación" ((Sql "SELECT COUNT(*) FROM Operacion WHERE IdPropiedad = $p1") -eq "0")

"--- CP-30: dos agentes registran la misma propiedad a la vez"
$a = Start-Job -ScriptBlock { param($s, $p, $f) sqlcmd -S $s -E -I -d GestionPropiedadesCondado -h -1 -W -Q "SET NOCOUNT ON; BEGIN TRAN; EXEC SP_Operacion_Insert 'Venta', '$f', 1, $p, 2; WAITFOR DELAY '00:00:04'; COMMIT;" 2>&1 } -ArgumentList $Servidor, $p1, $hoy
Start-Sleep -Seconds 1
$b = Start-Job -ScriptBlock { param($s, $p, $f) sqlcmd -S $s -E -I -d GestionPropiedadesCondado -h -1 -W -Q "SET NOCOUNT ON; EXEC SP_Operacion_Insert 'Alquiler', '$f', 2, $p, 2;" 2>&1 } -ArgumentList $Servidor, $p1, $hoy
$ra = Receive-Job $a -Wait; $rb = Receive-Job $b -Wait
Remove-Job $a, $b
Esperar "La segunda sesión recibe 'La propiedad ya no está disponible.'" ("$rb" -match "ya no est")
Esperar "Se registró una sola operación" ((Sql "SELECT COUNT(*) FROM Operacion WHERE IdPropiedad = $p1") -eq "1")
Esperar "CP-15: Venta -> Vendida" ((Sql "SELECT Estado FROM Propiedad WHERE IdPropiedad = $p1") -eq "Vendida")

"--- CP-35: Alquiler -> Alquilada"
Sql "EXEC SP_Operacion_Insert 'Alquiler', '$hoy', 1, $p2, 2" | Out-Null
Esperar "La propiedad quedó Alquilada" ((Sql "SELECT Estado FROM Propiedad WHERE IdPropiedad = $p2") -eq "Alquilada")
Esperar "Volver a operarla da 'ya no está disponible'" ("$(Sql "EXEC SP_Operacion_Insert 'Venta', '$hoy', 1, $p2, 2")" -match "ya no est")

# Limpieza
Sql "DELETE FROM Comision WHERE IdOperacion IN (SELECT IdOperacion FROM Operacion WHERE IdPropiedad IN ($p1, $p2)); DELETE FROM Operacion WHERE IdPropiedad IN ($p1, $p2); DELETE FROM Propiedad WHERE IdPropiedad IN ($p1, $p2);" | Out-Null
Esperar "Limpieza: no quedan propiedades de prueba" ((Sql "SELECT COUNT(*) FROM Propiedad WHERE Barrio = N'PRUEBA TRANSACCION'") -eq "0")

""
if ($fallas -eq 0) { "Todas las pruebas de operaciones pasaron." } else { "$fallas prueba(s) fallaron."; exit 1 }
