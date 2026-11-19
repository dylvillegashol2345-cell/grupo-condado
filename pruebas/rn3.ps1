# Prueba de RN3 (CP-01): no se publica una propiedad sin matrícula y título.
# Requisitos: la API corriendo y el reCAPTCHA desactivado en el entorno de prueba (inicia sesión como admin).
# Uso:  powershell -ExecutionPolicy Bypass -File pruebas\rn3.ps1 [-Base http://localhost:56153/api]
param([string]$Base = "http://localhost:56153/api")

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
    catch { return @{ Codigo = [int]$_.Exception.Response.StatusCode; Mensaje = $_.ErrorDetails.Message } }
}

$login = Invoke-RestMethod "$Base/Login" -Method Post -ContentType "application/json" -Body '{"Nombre":"admin","Contrasena":"admin123","CaptchaToken":""}'
$token = @($login)[0].Token
if (-not $token) { throw "No se pudo iniciar sesión como admin (¿reCAPTCHA activo?)" }

$prop = @{ IdPropietario = 1; Barrio = "PRUEBA RN3"; Calle = "Calle de prueba"; Numeracion = "1"; IdTipo = 1; IdLocalidad = 1
           Precio = 1000; Superficie = 50; Descripcion = ""; Estado = "Disponible"; PanelesSolares = $false; AislamientoTermico = $false
           CategoriaEco = "C"; Bonificacion = 0; MatriculaVerificada = $false; TituloPropiedad = $false; Publicada = $true; Moneda = "ARS" }

$r = Llamar POST "/Propiedad" $token $prop
Esperar "Sin documentos, publicar se rechaza con 400 ($($r.Codigo))" ($r.Codigo -eq 400)
Esperar "...con el mensaje de RN3: $($r.Mensaje)" ("$($r.Mensaje)" -match "sin matr")

$prop.Publicada = $false
$r = Llamar POST "/Propiedad" $token $prop
$id = [int]@($r.Datos)[0].IdPropiedad
Esperar "Sin documentos se guarda sin publicar (IdPropiedad $id)" ($r.Codigo -eq 200 -and $id -gt 0)
$catalogo = @((Llamar GET "/Propiedad" $null).Datos)
Esperar "...y no aparece en el catálogo público" (-not ($catalogo | Where-Object { $_.IdPropiedad -eq $id }))

$prop.MatriculaVerificada = $true; $prop.TituloPropiedad = $true; $prop.Publicada = $true
$r = Llamar PUT "/Propiedad/$id" $token $prop
Esperar "Con matrícula y título se publica ($($r.Codigo))" ($r.Codigo -eq 200)
$catalogo = @((Llamar GET "/Propiedad" $null).Datos)
Esperar "...y aparece en el catálogo público" ([bool]($catalogo | Where-Object { $_.IdPropiedad -eq $id }))

$prop.TituloPropiedad = $false
$r = Llamar PUT "/Propiedad/$id" $token $prop
Esperar "Quitar el título dejándola publicada se rechaza ($($r.Codigo))" ($r.Codigo -eq 400)

Llamar DELETE "/Propiedad/$id" $token | Out-Null
Llamar POST "/Login/Logout" $token | Out-Null
Esperar "Limpieza: la propiedad de prueba se borró" ((Llamar GET "/Propiedad/$id" $null).Datos.Count -eq 0)

""
if ($fallas -eq 0) { "La prueba de RN3 pasó." } else { "$fallas prueba(s) fallaron."; exit 1 }
