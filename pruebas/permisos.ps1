# Pruebas de permisos de la API (CP-25, CP-26, CP-27 y controles extra).
# Requisitos: la API corriendo y el reCAPTCHA desactivado en el entorno de prueba
# (RecaptchaSecret vacío en API\WebApi\secrets.config), porque el script inicia sesión sin navegador.
# Uso:  powershell -ExecutionPolicy Bypass -File pruebas\permisos.ps1 [-Base http://localhost:56153/api]
param([string]$Base = "http://localhost:56153/api")

$fallas = 0

function Llamar($metodo, $ruta, $token = $null, $cuerpo = $null) {
    $h = @{}
    if ($token) { $h.Authorization = "Bearer $token" }
    $p = @{ Uri = "$Base$ruta"; Method = $metodo; Headers = $h; UseBasicParsing = $true }
    if ($null -ne $cuerpo) { $p.ContentType = "application/json"; $p.Body = [Text.Encoding]::UTF8.GetBytes(($cuerpo | ConvertTo-Json -Compress)) }
    try {
        $r = Invoke-WebRequest @p
        $datos = if ($r.Content) { $r.Content | ConvertFrom-Json } else { $null }
        return @{ Codigo = [int]$r.StatusCode; Datos = $datos }
    } catch {
        if ($_.Exception.Response) { return @{ Codigo = [int]$_.Exception.Response.StatusCode; Datos = $null } }
        throw
    }
}

function Esperar($nombre, $obtenido, $esperado) {
    $ok = @($esperado) -contains $obtenido
    if (-not $ok) { $script:fallas++ }
    "{0,-4} {1}  ->  obtenido {2}, esperado {3}" -f ($(if ($ok) { "OK" } else { "FALLA" })), $nombre, $obtenido, ($esperado -join " o ")
}

function Ingresar($usuario, $clave) {
    $r = Llamar POST "/Login" $null @{ Nombre = $usuario; Contrasena = $clave; CaptchaToken = "" }
    $fila = @($r.Datos)[0]
    if (-not $fila -or -not $fila.Token) { throw "No se pudo iniciar sesión con $usuario (¿reCAPTCHA activo o contraseña distinta?)" }
    return $fila.Token
}

$admin  = Ingresar "admin" "admin123"
$agente = Ingresar "martin" "martin123"
$client = Ingresar "cliente" "cliente123"
$juan   = Ingresar "juan.garcia" "juan123"

"--- CP-25: sin token no se puede borrar un usuario"
$correo = "prueba.permisos.$([guid]::NewGuid().ToString('N').Substring(0,8))@correo.com"
# El registro público no puede elegir rol: aunque pida Administrador, queda Cliente
Esperar "Registro público pidiendo rol Administrador" (Llamar POST "/Usuario" $null @{ Nombre = "Prueba Permisos"; Email = $correo; Telefono = "+5493510000000"; Contrasena = "Prueba123"; IdRol = 1 }).Codigo 200
$nuevo = @((Llamar GET "/Usuario" $admin).Datos) | Where-Object { $_.Email -eq $correo } | Select-Object -First 1
Esperar "El usuario registrado quedó con rol Cliente" $nuevo.Rol "Cliente"
Esperar "DELETE /Usuario/$($nuevo.IdUsuario) sin token" (Llamar DELETE "/Usuario/$($nuevo.IdUsuario)").Codigo 401
Esperar "...y el usuario sigue existiendo" (Llamar GET "/Usuario/$($nuevo.IdUsuario)" $admin).Codigo 200
Esperar "DELETE /Usuario con token de Agente" (Llamar DELETE "/Usuario/$($nuevo.IdUsuario)" $agente).Codigo 403
Esperar "DELETE /Usuario con token de Administrador (limpieza)" (Llamar DELETE "/Usuario/$($nuevo.IdUsuario)" $admin).Codigo @(200, 204)

"--- CP-26: un Cliente no registra operaciones"
$op = @{ Tipo = "Venta"; Fecha = (Get-Date -Format "yyyy-MM-dd"); IdCliente = 1; IdPropiedad = 1; IdUsuario = 2 }
Esperar "POST /Operacion con token de Cliente" (Llamar POST "/Operacion" $client $op).Codigo 403
Esperar "POST /Operacion sin token" (Llamar POST "/Operacion" $null $op).Codigo 401

"--- CP-27: Juan García no ve cobros ajenos"
$contratos = @((Llamar GET "/Contrato" $admin).Datos)
$deJuan = @($contratos | Where-Object { $_.IdCliente -eq 3 } | ForEach-Object { $_.IdContrato })
$pagos = @((Llamar GET "/Pago" $admin).Datos)
$ajeno = $pagos | Where-Object { $deJuan -notcontains $_.IdContrato } | Select-Object -First 1
Esperar "GET /Pago/$($ajeno.IdPago) (de otro cliente) con token de Juan" (Llamar GET "/Pago/$($ajeno.IdPago)" $juan).Codigo 403
$suyos = @((Llamar GET "/Pago" $juan).Datos)
$intrusos = @($suyos | Where-Object { $deJuan -notcontains $_.IdContrato }).Count
Esperar "GET /Pago con token de Juan trae solo los suyos ($($suyos.Count) cobros)" $intrusos 0
$contratoAjeno = $contratos | Where-Object { $_.IdCliente -ne 3 } | Select-Object -First 1
Esperar "GET /Contrato/$($contratoAjeno.IdContrato) (ajeno) con token de Juan" (Llamar GET "/Contrato/$($contratoAjeno.IdContrato)" $juan).Codigo 403

"--- Otros controles"
Esperar "GET /Cliente sin token" (Llamar GET "/Cliente").Codigo 401
Esperar "GET /Rol con token de Agente" (Llamar GET "/Rol" $agente).Codigo 403
Esperar "GET /Operacion con token de Agente" (Llamar GET "/Operacion" $agente).Codigo 200
Esperar "PUT /Usuario/1 (otro usuario) con token de Cliente" (Llamar PUT "/Usuario/1" $client @{ IdUsuario = 1; Nombre = "x"; Email = "x@x.com"; Contrasena = "___NOCHANGE___"; IdRol = 3 }).Codigo 403
$todas = @((Llamar GET "/Propiedad" $admin).Datos).Count
$publicas = @((Llamar GET "/Propiedad").Datos)
Esperar "GET /Propiedad sin token trae solo publicadas ($($publicas.Count) de $todas)" (@($publicas | Where-Object { -not $_.Publicada }).Count) 0
Esperar "POST /Login/Logout" (Llamar POST "/Login/Logout" $client).Codigo 200
Esperar "El token cerrado ya no sirve" (Llamar GET "/Contrato" $client).Codigo 401
foreach ($t in $admin, $agente, $juan) { Llamar POST "/Login/Logout" $t | Out-Null }

""
if ($fallas -eq 0) { "Todas las pruebas de permisos pasaron." } else { "$fallas prueba(s) fallaron."; exit 1 }
