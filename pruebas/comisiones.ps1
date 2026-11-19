# Pruebas de comisiones parametrizadas (CP-24) y de quién puede cambiar los porcentajes.
# Requisitos: la API corriendo, sqlcmd y el reCAPTCHA desactivado en el entorno de prueba.
# Usa dos propiedades de prueba y al final borra todo lo que creó.
# Uso:  powershell -ExecutionPolicy Bypass -File pruebas\comisiones.ps1 [-Base http://localhost:56153/api] [-Servidor Dylan]
param([string]$Base = "http://localhost:56153/api", [string]$Servidor = "Dylan")

$fallas = 0
function Sql($consulta) { (sqlcmd -S $Servidor -E -I -d GestionPropiedadesCondado -h -1 -W -b -Q "SET NOCOUNT ON; $consulta" 2>&1) | Where-Object { $_ -ne "" } }
function Esperar($nombre, $ok) {
    if (-not $ok) { $script:fallas++ }
    "{0,-5} {1}" -f ($(if ($ok) { "OK" } else { "FALLA" })), $nombre
}
function Ingresar($u, $c) { @(Invoke-RestMethod "$Base/Login" -Method Post -ContentType "application/json" -Body "{`"Nombre`":`"$u`",`"Contrasena`":`"$c`",`"CaptchaToken`":`"`"}")[0].Token }
function Codigo($metodo, $ruta, $token, $cuerpo) {
    $p = @{ Uri = "$Base$ruta"; Method = $metodo; Headers = @{ Authorization = "Bearer $token" }; ContentType = "application/json" }
    if ($cuerpo) { $p.Body = [Text.Encoding]::UTF8.GetBytes($cuerpo) }
    try { Invoke-RestMethod @p | Out-Null; 200 } catch { [int]$_.Exception.Response.StatusCode }
}

$hist0 = [int](Sql "SELECT ISNULL(MAX(IdHistorial), 0) FROM ParametroHistorial")
$crear = "DECLARE @cols NVARCHAR(MAX) = (SELECT STRING_AGG(QUOTENAME(name), ',') FROM sys.columns WHERE object_id = OBJECT_ID('Propiedad') AND is_identity = 0 AND name NOT IN ('Barrio', 'Estado', 'Precio', 'Moneda'));
EXEC (N'INSERT INTO Propiedad (Barrio, Estado, Precio, Moneda, ' + @cols + N') SELECT N''PRUEBA COMISION'', N''Disponible'', 100000000, N''ARS'', ' + @cols + N' FROM Propiedad WHERE IdPropiedad = 1');
SELECT MAX(IdPropiedad) FROM Propiedad WHERE Barrio = N'PRUEBA COMISION';"
$pv = [int](Sql $crear | Select-Object -Last 1)
$pa = [int](Sql $crear | Select-Object -Last 1)
$hoy = Get-Date -Format "yyyy-MM-dd"

"--- CP-24: venta de `$100.000.000"
$ov = [int](Sql "EXEC SP_Operacion_Insert 'Venta', '$hoy', 1, $pv, 2" | Select-Object -Last 1)
$c = Sql "SELECT Concepto + '=' + CAST(CAST(Monto AS BIGINT) AS VARCHAR) + ' (' + CAST(Porcentaje AS VARCHAR) + ')' FROM Comision WHERE IdOperacion = $ov ORDER BY Concepto"
"      $($c -join ' | ')"
Esperar "Comprador: `$3.000.000 (3%)" ($c -contains "Venta - comprador=3000000 (0.0300)")
Esperar "Vendedor: `$2.000.000 (2%)" ($c -contains "Venta - vendedor=2000000 (0.0200)")

"--- CP-24: alquiler con valor total de `$12.000.000 (500.000 x 24 meses)"
$oa = [int](Sql "EXEC SP_Operacion_Insert 'Alquiler', '$hoy', 1, $pa, 2" | Select-Object -Last 1)
Esperar "La operación de alquiler no genera comisión todavía" ((Sql "SELECT COUNT(*) FROM Comision WHERE IdOperacion = $oa") -eq "0")
Sql "EXEC SP_Contrato_Insert @FechaInicio = '2026-12-01', @FechaFin = '2028-12-01', @IdOperacion = $oa, @CanonMensual = 500000" | Out-Null
Esperar "Al cargar el contrato se registra `$360.000 (3%)" ((Sql "SELECT CAST(CAST(Monto AS BIGINT) AS VARCHAR) + ' ' + CAST(Porcentaje AS VARCHAR) FROM Comision WHERE IdOperacion = $oa AND Concepto = 'Alquiler'") -eq "360000 0.0300")

"--- Cambiar un parámetro no toca las comisiones anteriores"
$admin = Ingresar "admin" "admin123"; $agente = Ingresar "martin" "martin123"; $cliente = Ingresar "cliente" "cliente123"
if (-not $admin) { throw "No se pudo iniciar sesión (¿reCAPTCHA activo?)" }
Esperar "El Cliente puede leer los porcentajes (la calculadora los usa)" ((Codigo GET "/Parametro" $cliente) -eq 200)
Esperar "El Agente no puede cambiarlos (403)" ((Codigo PUT "/Parametro" $agente '[{"Clave":"COMISION_ALQUILER","Valor":0.05}]') -eq 403)
Esperar "El Administrador sí" ((Codigo PUT "/Parametro" $admin '[{"Clave":"COMISION_ALQUILER","Valor":0.05}]') -eq 200)
Esperar "Un porcentaje inválido se rechaza (400)" ((Codigo PUT "/Parametro" $admin '[{"Clave":"COMISION_ALQUILER","Valor":1.5}]') -eq 400)
Esperar "El cambio quedó en el historial (de 0.0300 a 0.0500, por el admin)" ((Sql "SELECT CAST(ValorAnterior AS VARCHAR) + '>' + CAST(ValorNuevo AS VARCHAR) + ' ' + CAST(IdUsuario AS VARCHAR) FROM ParametroHistorial WHERE IdHistorial > $hist0") -eq "0.0300>0.0500 1")
Esperar "La comisión de alquiler ya registrada sigue en `$360.000" ((Sql "SELECT CAST(CAST(Monto AS BIGINT) AS VARCHAR) FROM Comision WHERE IdOperacion = $oa AND Concepto = 'Alquiler'") -eq "360000")
Esperar "Las de venta siguen igual" (@(Sql "SELECT CAST(CAST(Monto AS BIGINT) AS VARCHAR) FROM Comision WHERE IdOperacion = $ov ORDER BY Monto") -join "," -eq "2000000,3000000")

# Limpieza: se vuelve al 3% y se borra todo lo de la prueba
Codigo PUT "/Parametro" $admin '[{"Clave":"COMISION_ALQUILER","Valor":0.03}]' | Out-Null
foreach ($t in $admin, $agente, $cliente) { Codigo POST "/Login/Logout" $t | Out-Null }
Sql "DELETE FROM ParametroHistorial WHERE IdHistorial > $hist0;
UPDATE Parametro SET ModificadoPor = NULL WHERE Clave = 'COMISION_ALQUILER';
DELETE FROM Comision WHERE IdOperacion IN ($ov, $oa);
DELETE FROM Contrato WHERE IdOperacion IN ($ov, $oa);
DELETE FROM Operacion WHERE IdOperacion IN ($ov, $oa);
DELETE FROM Propiedad WHERE IdPropiedad IN ($pv, $pa);" | Out-Null
Esperar "Limpieza: el alquiler volvió a 3% y no quedan datos de prueba" ((Sql "SELECT CAST(Valor AS VARCHAR) + ' ' + CAST((SELECT COUNT(*) FROM Propiedad WHERE Barrio = N'PRUEBA COMISION') AS VARCHAR) FROM Parametro WHERE Clave = 'COMISION_ALQUILER'") -eq "0.0300 0")

""
if ($fallas -eq 0) { "Todas las pruebas de comisiones pasaron." } else { "$fallas prueba(s) fallaron."; exit 1 }
