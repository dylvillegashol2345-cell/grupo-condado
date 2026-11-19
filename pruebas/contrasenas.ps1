# Pruebas de contraseñas (CP-11, CP-28): PBKDF2 con sal y migración de las contraseñas viejas.
# Requisitos: la API corriendo, sqlcmd y el reCAPTCHA desactivado en el entorno de prueba.
# Uso:  powershell -ExecutionPolicy Bypass -File pruebas\contrasenas.ps1 [-Base http://localhost:56153/api] [-Servidor Dylan]
param([string]$Base = "http://localhost:56153/api", [string]$Servidor = "Dylan")

$fallas = 0
function Esperar($nombre, $ok) {
    if (-not $ok) { $script:fallas++ }
    "{0,-5} {1}" -f ($(if ($ok) { "OK" } else { "FALLA" })), $nombre
}
function Ingresar($usuario, $clave) {
    $cuerpo = [Text.Encoding]::UTF8.GetBytes((@{ Nombre = $usuario; Contrasena = $clave; CaptchaToken = "" } | ConvertTo-Json -Compress))
    $r = Invoke-RestMethod "$Base/Login" -Method Post -ContentType "application/json" -Body $cuerpo
    return @($r)[0]
}
function Guardada($nombreUsuario) {
    (sqlcmd -S $Servidor -E -I -d GestionPropiedadesCondado -h -1 -W -Q "SET NOCOUNT ON; SELECT Contrasena FROM Usuario WHERE NombreUsuario = N'$nombreUsuario'" | Select-Object -First 1).Trim()
}
function Registrar($nombre, $clave) {
    $cuerpo = [Text.Encoding]::UTF8.GetBytes((@{ Nombre = $nombre; Email = "$nombre@correo.com"; Telefono = "+5493510000000"; Contrasena = $clave; IdRol = 3 } | ConvertTo-Json -Compress))
    Invoke-RestMethod "$Base/Usuario" -Method Post -ContentType "application/json" -Body $cuerpo | Out-Null
}

$sufijo = [guid]::NewGuid().ToString("N").Substring(0, 6)
$a = "prueba.pbkdf2.a$sufijo"; $b = "prueba.pbkdf2.b$sufijo"
Registrar $a "MismaClave123"
Registrar $b "MismaClave123"
$ha = Guardada $a; $hb = Guardada $b
"--- CP-28: misma contraseña, valores distintos"
Esperar "Se guarda en formato PBKDF2 ($($ha.Length) caracteres)" ($ha.StartsWith('PBKDF2$600000$') -and $hb.StartsWith('PBKDF2$600000$'))
Esperar "Los dos valores son distintos (sal aleatoria)" ($ha -ne $hb)
Esperar "Ingresa el primero" ([bool](Ingresar $a "MismaClave123").Token)
Esperar "Ingresa el segundo" ([bool](Ingresar $b "MismaClave123").Token)
Esperar "Con la contraseña equivocada no ingresa" (-not (Ingresar $a "OtraClave123"))

"--- Cambio de contraseña desde Mi perfil"
$t = (Ingresar $a "MismaClave123").Token
$cambio = [Text.Encoding]::UTF8.GetBytes((@{ Actual = "MismaClave123"; Nueva = "ClaveNueva456" } | ConvertTo-Json -Compress))
Invoke-RestMethod "$Base/Usuario/Contrasena" -Method Post -ContentType "application/json" -Headers @{ Authorization = "Bearer $t" } -Body $cambio | Out-Null
Esperar "Ingresa con la contraseña nueva" ([bool](Ingresar $a "ClaveNueva456").Token)
Esperar "Ya no ingresa con la anterior" (-not (Ingresar $a "MismaClave123"))
$mal = [Text.Encoding]::UTF8.GetBytes((@{ Actual = "NoEsLaActual1"; Nueva = "OtraMas789" } | ConvertTo-Json -Compress))
$rechazo = try { Invoke-RestMethod "$Base/Usuario/Contrasena" -Method Post -ContentType "application/json" -Headers @{ Authorization = "Bearer $t" } -Body $mal; 200 } catch { [int]$_.Exception.Response.StatusCode }
Esperar "Si la actual es incorrecta responde 400 ($rechazo)" ($rechazo -eq 400)

"--- Migración de una contraseña vieja (usuario cliente de los datos de demostración)"
$antes = Guardada "cliente"
if ($antes.StartsWith('PBKDF2$')) { "      (ya estaba migrada: se prueba solo el ingreso)" }
$reloj = [Diagnostics.Stopwatch]::StartNew()
$fila = Ingresar "cliente" "cliente123"
$reloj.Stop()
Esperar "Ingresa con su contraseña de siempre" ([bool]$fila.Token)
Esperar "Después del ingreso queda en PBKDF2" ((Guardada "cliente").StartsWith('PBKDF2$'))
"      Tiempo del ingreso: $($reloj.ElapsedMilliseconds) ms"

# Limpieza
sqlcmd -S $Servidor -E -I -d GestionPropiedadesCondado -Q "SET NOCOUNT ON; DELETE FROM Usuario WHERE NombreUsuario IN (N'$a', N'$b');" | Out-Null

""
if ($fallas -eq 0) { "Todas las pruebas de contraseñas pasaron." } else { "$fallas prueba(s) fallaron."; exit 1 }
