# Prueba del procedimiento de actualización (CP-34).
# Restaura un respaldo como GestionPropiedadesCondado_Prueba (nunca toca la base real), le aplica el parche
# dos veces (tiene que ser idempotente) y compara la cantidad de filas por tabla antes y después.
# Uso:  powershell -ExecutionPolicy Bypass -File pruebas\actualizacion.ps1 -Respaldo C:\Respaldos\GPC_antes_v1.0.bak [-Servidor Dylan] [-Conservar]
param([Parameter(Mandatory)][string]$Respaldo, [string]$Servidor = "Dylan", [switch]$Conservar)

$ErrorActionPreference = "Stop"
$prueba = "GestionPropiedadesCondado_Prueba"
$parche = Join-Path $PSScriptRoot "..\Parche_v1.0_correcciones.sql"
$fallas = 0
function Esperar($nombre, $ok) {
    if (-not $ok) { $script:fallas++ }
    "{0,-5} {1}" -f ($(if ($ok) { "OK" } else { "FALLA" })), $nombre
}
function Filas($base) {
    $q = "SET NOCOUNT ON; SELECT t.name + '=' + CAST(SUM(p.rows) AS VARCHAR) FROM sys.tables t JOIN sys.partitions p ON p.object_id = t.object_id AND p.index_id IN (0, 1) GROUP BY t.name ORDER BY t.name;"
    $r = @{}
    sqlcmd -S $Servidor -E -I -d $base -h -1 -W -Q $q | Where-Object { $_ -match "=" } | ForEach-Object { $k, $v = $_ -split "="; $r[$k] = [int]$v }
    return $r
}

"--- 1. Restaurar el respaldo como $prueba"
$datos = (sqlcmd -S $Servidor -E -h -1 -W -Q "SET NOCOUNT ON; SELECT CAST(SERVERPROPERTY('InstanceDefaultDataPath') AS NVARCHAR(400))" | Select-Object -First 1).Trim()
$logicos = sqlcmd -S $Servidor -E -h -1 -W -s "|" -Q "SET NOCOUNT ON; RESTORE FILELISTONLY FROM DISK = N'$Respaldo'" | Where-Object { $_ -match "\|" } | ForEach-Object { ($_ -split "\|")[0..2] -join "|" }
$mover = ($logicos | ForEach-Object { $n, $f, $tipo = $_ -split "\|"; $ext = if ($tipo -eq "L") { "_log.ldf" } else { ".mdf" }; "MOVE N'$n' TO N'$datos$prueba$ext'" }) -join ", "
sqlcmd -S $Servidor -E -b -Q "RESTORE DATABASE [$prueba] FROM DISK = N'$Respaldo' WITH $mover, REPLACE, RECOVERY;" | Out-Null
Esperar "Respaldo restaurado" ($LASTEXITCODE -eq 0)
$antes = Filas $prueba

"--- 2. Aplicar el parche dos veces"
$copia = Join-Path $env:TEMP "parche_prueba_actualizacion.sql"
(Get-Content $parche -Raw -Encoding UTF8).Replace("USE [GestionPropiedadesCondado];", "USE [$prueba];") | Set-Content $copia -Encoding UTF8
foreach ($vez in 1, 2) {
    $salida = sqlcmd -S $Servidor -E -I -b -f 65001 -i $copia 2>&1
    Esperar "Corrida $vez del parche sin errores" ($LASTEXITCODE -eq 0)
    if ($LASTEXITCODE -ne 0) { $salida | Select-Object -Last 5 }
}
Remove-Item $copia
$despues = Filas $prueba

"--- 3. Filas por tabla, antes y después"
$tablas = @($antes.Keys) + @($despues.Keys) | Sort-Object -Unique
foreach ($t in $tablas) {
    $a = $antes[$t]; $d = $despues[$t]
    if ($a -ne $d) { "      {0,-20} {1,6} -> {2}" -f $t, $(if ($null -eq $a) { "(nueva)" } else { $a }), $d }
}
$perdidas = @($tablas | Where-Object { $null -ne $antes[$_] -and $despues[$_] -lt $antes[$_] })
Esperar "Ninguna tabla perdió filas" ($perdidas.Count -eq 0)
Esperar "VersionBase tiene la versión 1.0" ((sqlcmd -S $Servidor -E -d $prueba -h -1 -W -Q "SET NOCOUNT ON; SELECT Version FROM VersionBase" | Select-Object -First 1).Trim() -eq "1.0")
$controles = sqlcmd -S $Servidor -E -I -f 65001 -d $prueba -h -1 -W -s "|" -i (Join-Path $PSScriptRoot "consistencia.sql") | Where-Object { $_ -match "\|" }
Esperar "Las consultas de consistencia dan 0" (@($controles | Where-Object { ($_ -split "\|")[1] -ne "0" }).Count -eq 0)

if (-not $Conservar) { sqlcmd -S $Servidor -E -Q "DROP DATABASE [$prueba];" | Out-Null; "      (se borró $prueba; con -Conservar queda para revisarla)" }

""
if ($fallas -eq 0) { "La prueba de actualización pasó." } else { "$fallas prueba(s) fallaron."; exit 1 }
