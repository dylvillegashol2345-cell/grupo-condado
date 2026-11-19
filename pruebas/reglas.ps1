# Pruebas de RN8 (3 consultas por día) y RN9 (citas) llamando a la API directamente, sin pasar por React.
# Requisitos: la API corriendo, sqlcmd y el reCAPTCHA desactivado en el entorno de prueba (inicia sesión como admin).
# Uso:  powershell -ExecutionPolicy Bypass -File pruebas\reglas.ps1 [-Base http://localhost:56153/api] [-Servidor Dylan]
param([string]$Base = "http://localhost:56153/api", [string]$Servidor = "Dylan")

$fallas = 0
function Esperar($nombre, $ok) {
    if (-not $ok) { $script:fallas++ }
    "{0,-5} {1}" -f ($(if ($ok) { "OK" } else { "FALLA" })), $nombre
}
function Llamar($metodo, $ruta, $token, $cuerpo = $null) {
    $p = @{ Uri = "$Base$ruta"; Method = $metodo; Headers = @{}; ContentType = "application/json" }
    if ($token) { $p.Headers.Authorization = "Bearer $token" }
    if ($null -ne $cuerpo) { $p.Body = [Text.Encoding]::UTF8.GetBytes(($cuerpo | ConvertTo-Json -Compress)) }
    try { return @{ Codigo = 200; Datos = (Invoke-RestMethod @p) } }
    catch { return @{ Codigo = [int]$_.Exception.Response.StatusCode; Mensaje = "$($_.ErrorDetails.Message)" } }
}
function Sql($consulta) { sqlcmd -S $Servidor -E -I -d GestionPropiedadesCondado -h -1 -W -Q "SET NOCOUNT ON; $consulta" }

"--- CP-13 (RN8): hasta 3 consultas por día, sin sesión como la app móvil"
$tel = "+54935199" + (Get-Random -Minimum 10000 -Maximum 99999)
$consulta = @{ Nombre = "PRUEBA RN8"; Telefono = $tel; Mensaje = "prueba"; PropiedadInteres = "Propiedad #5" }
$codigos = foreach ($i in 1..3) { (Llamar POST "/Consulta" $null $consulta).Codigo }
Esperar "Las tres primeras se aceptan ($($codigos -join ', '))" (@($codigos | Where-Object { $_ -ne 200 }).Count -eq 0)
$cuarta = Llamar POST "/Consulta" $null $consulta
Esperar "La cuarta se rechaza con 400 ($($cuarta.Codigo))" ($cuarta.Codigo -eq 400)
Esperar "...con el mensaje de RN8" ($cuarta.Mensaje -match "3 consultas hoy")
$consulta.Telefono = $tel.Replace("+549", "+54 9 ")
Esperar "Con el mismo número escrito distinto también se rechaza" ((Llamar POST "/Consulta" $null $consulta).Codigo -eq 400)

"--- CP-06 y CP-07 (RN9): citas"
$login = Invoke-RestMethod "$Base/Login" -Method Post -ContentType "application/json" -Body '{"Nombre":"admin","Contrasena":"admin123","CaptchaToken":""}'
$token = @($login)[0].Token
if (-not $token) { throw "No se pudo iniciar sesión como admin (¿reCAPTCHA activo?)" }
$dia = (Get-Date).AddDays(400).ToString("yyyy-MM-dd")
$cita = @{ Fecha = (Get-Date).AddDays(-1).ToString("yyyy-MM-dd"); Hora = "10:00"; IdUsuario = 2; IdPropiedad = 5; Estado = "Pendiente"; Notas = "PRUEBA RN9" }
$r = Llamar POST "/Cita" $token $cita
Esperar "CP-06: una cita en fecha pasada se rechaza ($($r.Codigo))" ($r.Codigo -eq 400 -and $r.Mensaje -match "fecha pasada")
$cita.Fecha = $dia
$primera = Llamar POST "/Cita" $token $cita
Esperar "Una cita futura del agente se acepta" ($primera.Codigo -eq 200)
$cita.Hora = "10:45"
$r = Llamar POST "/Cita" $token $cita
Esperar "CP-07: otra del mismo agente 45 minutos después se rechaza ($($r.Codigo))" ($r.Codigo -eq 400 -and $r.Mensaje -match "una hora")
$cita.Hora = "11:00"
Esperar "Una hora después se acepta" ((Llamar POST "/Cita" $token $cita).Codigo -eq 200)
$cita.IdUsuario = 1; $cita.Hora = "10:15"
Esperar "Otro agente a la misma hora se acepta" ((Llamar POST "/Cita" $token $cita).Codigo -eq 200)
$cita.IdUsuario = 2; $cita.Hora = "10:15"; $cita.Estado = "Cancelada"
Esperar "Una cancelada no ocupa el horario" ((Llamar POST "/Cita" $token $cita).Codigo -eq 200)

# Una cita que ya pasó se puede seguir editando (marcarla Realizada)
$ayer = (Get-Date).AddDays(-1).ToString("yyyy-MM-dd")
$idVieja = (Sql "INSERT INTO Cita (Fecha, Hora, Estado, IdUsuario, IdPropiedad, Notas) VALUES ('$ayer', '09:00', 'Pendiente', 2, 5, 'PRUEBA RN9'); SELECT SCOPE_IDENTITY();" | Select-Object -Last 1).Trim()
$r = Llamar PUT "/Cita/$idVieja" $token @{ Fecha = $ayer; Hora = "09:00"; IdUsuario = 2; IdPropiedad = 5; Estado = "Realizada"; Notas = "PRUEBA RN9" }
Esperar "Una cita de ayer se puede marcar Realizada ($($r.Codigo))" ($r.Codigo -eq 200)

# Limpieza
Sql "DELETE FROM Consulta WHERE Nombre = N'PRUEBA RN8'; DELETE FROM Cita WHERE Notas = N'PRUEBA RN9';" | Out-Null
Llamar POST "/Login/Logout" $token | Out-Null
Esperar "Limpieza: no quedan datos de prueba" ((Sql "SELECT (SELECT COUNT(*) FROM Consulta WHERE Nombre = N'PRUEBA RN8') + (SELECT COUNT(*) FROM Cita WHERE Notas = N'PRUEBA RN9')").Trim() -eq "0")

""
if ($fallas -eq 0) { "Todas las pruebas de RN8 y RN9 pasaron." } else { "$fallas prueba(s) fallaron."; exit 1 }
