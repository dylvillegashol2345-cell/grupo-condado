# Grupo Condado — Sistema de gestión inmobiliaria

Sistema web de gestión para la inmobiliaria Grupo Condado, con eje en la sustentabilidad: cada
propiedad tiene una clase energética (A, B o C) según sus paneles solares y su aislación térmica,
y las de clase A acceden a una bonificación del 15%.

Es el Trabajo Final del grupo. Lo usa el personal de la inmobiliaria (propiedades, clientes,
operaciones, contratos, cobros, consultas y citas) y también los clientes (catálogo, consultas,
sus contratos y EcoMarket).

La app móvil para clientes, **Condado Móvil**, usa esta misma API y esta misma base:
[condado-movil](https://github.com/dylvillegashol2345-cell/condado-movil).

## Integrantes

- Bustos, Tomás
- Díaz, Bruno
- Escudero, Mauricio
- Heredia, Máximo
- Villegas, Dylan

## Sobre este repositorio

El sistema se desarrolló de forma local durante las Prácticas Profesionales y el Trabajo Final, y
se subió a GitHub en octubre de 2026. Por eso el historial arranca en esa fecha, con un commit por
cada parte del sistema. Los cambios posteriores se registran commit a commit.

## Estructura

| Carpeta | Qué contiene |
|---|---|
| `Grupo-condado-react/` | Frontend: React 19 + Vite + React Router |
| `API/` | Backend: ASP.NET Web API 2 sobre .NET Framework 4.7.2, acceso a datos con ADO.NET y stored procedures |
| `GrupoCondado_BaseCompleta.sql` | Script que crea la base `GestionPropiedadesCondado` con tablas, procedimientos y datos de prueba |

## Módulos

| Módulo | Qué permite |
|---|---|
| Inicio y Dashboard | Indicadores, gráficos y reportes de la inmobiliaria |
| Propiedades | Alta, edición, fotos, recorrido 360 y ficha en PDF |
| Catálogo | Búsqueda de propiedades para clientes, con filtros y mapa |
| Propietarios y Clientes | Gestión de las personas vinculadas a cada operación |
| Operaciones | Ventas y alquileres, con las reglas de disponibilidad |
| Contratos y Pagos | Contrato de locación y boleto de compraventa en PDF, y registro de cobros |
| Consultas y Citas | Consultas que llegan desde la web y la app móvil, y agenda de visitas |
| EcoMarket | Publicaciones de productos sustentables y mensajes entre usuarios |
| Impacto ambiental | Indicadores: propiedades con paneles y aislamiento, CO₂ estimado ahorrado y artículos donados |
| Usuarios y Perfil | Cuentas, roles y datos personales |

## Cómo levantarlo

Tienen que estar corriendo las tres partes: base de datos, API y frontend.

### 1. Base de datos

Abrir `GrupoCondado_BaseCompleta.sql` en SQL Server Management Studio y ejecutarlo (F5). Crea la
base `GestionPropiedadesCondado` con todas las tablas, los procedimientos y los datos.

Si la base ya existe, el script se detiene sin tocar nada. Para actualizar una base que ya existe
a la versión 1.0 se ejecuta `Parche_v1.0_correcciones.sql`: se puede correr más de una vez y deja
la fila `1.0` en la tabla `VersionBase`. Antes conviene hacer una copia de seguridad.

Desde `sqlcmd` hay que agregar `-I` (`QUOTED_IDENTIFIER ON`, que exige el índice filtrado de
citas); SQL Server Management Studio ya la usa por defecto.

### 2. API

Abrir `API/GestionPropiedades.sln` en Visual Studio y ejecutar con IIS Express (F5). Queda en
`http://localhost:56153/`.

- **Cadena de conexión:** está en `API/WebApi/Web.config`, en `<connectionStrings>`. Hay que cambiar
  `Data Source=Dylan` por el nombre de la instancia de SQL Server de cada uno.
- **Clave secreta de reCAPTCHA:** copiar `API/WebApi/secrets.config.example` como
  `secrets.config` y completar la clave. Ese archivo no se sube al repositorio. Si queda vacía,
  el login funciona sin verificar el captcha de Google.
- **Fotos para la app móvil:** la base guarda rutas como `/img/propiedades/casa-01.jpg`. Para que
  la app las vea, el sitio de IIS Express tiene que servir la carpeta `Grupo-condado-react/public/img`
  como directorio virtual `/img` (en `applicationhost.config`).

### 3. Frontend

```bash
cd Grupo-condado-react
npm install
npm run dev
```

Se abre en `http://localhost:5173`. Antes, copiar `.env.example` como `.env` (tiene la clave
pública del sitio de reCAPTCHA). Si la API está en otra dirección, se indica ahí mismo con
`VITE_API_URL`; si no se define, el frontend usa `http://localhost:56153/api`.

Para compilar: `npm run build`. Para revisar el código: `npm run lint`.

### 4. Entrar al sistema

El script de la base crea una cuenta de cada rol, para poder probar los permisos:

| Rol | Usuario | Contraseña |
|---|---|---|
| Administrador | `admin` | `admin123` |
| Agente | `martin` | `martin123` |
| Cliente | `cliente` | `cliente123` |

El usuario `juan.garcia` (contraseña `juan123`) es un Cliente con contratos y cobros cargados.

Sin cuenta se puede entrar con **Entrar como invitado**, que solo ve el catálogo. Desde
**Crear cuenta** cualquiera se registra, y esas cuentas quedan siempre con rol Cliente; para
darle otro rol, un administrador lo hace desde Usuarios.

## Carpetas del frontend

- `src/pages`: una pantalla por sección
- `src/components`: partes que se reutilizan (formularios, modales, tarjetas, el visor 360)
- `src/utils`: cálculos y validaciones sin interfaz (cuotas, citas, reglas de negocio, PDF)
- `src/services`: las llamadas a la API
- `src/context` y `src/hooks`: sesión, permisos por rol, avisos y carga de datos
- `src/routes`: las rutas y qué rol puede entrar a cada una

## Roles

| Sección | Administrador | Agente | Cliente | Invitado |
|---|---|---|---|---|
| Buscar propiedades | Sí | Sí | Sí, desde el Catálogo | |
| Catálogo | | | Sí | Sí |
| Dashboard y reportes | Sí | Sí | | |
| Propiedades y propietarios | Sí | Sí | | |
| Clientes | Sí | Sí | | |
| Operaciones | Sí | Sí | | |
| Contratos y cobros | Sí | Sí | Solo los suyos | |
| Consultas y citas | Sí | Sí | | |
| Hacer consulta | | | Sí | |
| EcoMarket | Sí | Sí | Sí | |
| Impacto ambiental | Sí | Sí | | |
| Usuarios | Sí | | | |
| Mi perfil | Sí | Sí | Sí | |

Si alguien escribe a mano la dirección de una sección que no le corresponde, lo manda a su inicio.

Los permisos también los valida la API: el ingreso entrega un token de 8 horas (en la base se guarda
solo su SHA-256) y cada solicitud lo manda en `Authorization: Bearer`. Sin sesión la API responde
401, y con un rol sin permiso, 403. Son públicos solo el ingreso, el registro, el catálogo publicado y
el alta de consultas, que usa la app móvil. El Cliente recibe únicamente sus propios contratos, cobros
y operaciones. Las contraseñas se guardan con PBKDF2-SHA256 (600.000 iteraciones y sal); las viejas
se migran en el próximo ingreso.

## Reglas de negocio

Están en `Grupo-condado-react/src/utils/reglas.js`, y las que modifican datos también se validan en
los procedimientos almacenados:

- RN1: la clase energética sale de paneles solares y aislamiento (los dos: A, uno: B, ninguno: C).
- RN2: las propiedades clase A tienen 15% de bonificación.
- RN3: una propiedad se publica solo si tiene matrícula y título; si falta alguno, queda guardada sin publicar.
- RN4: no se puede registrar una operación sobre una propiedad que no está disponible.
- RN5: al registrar la operación, la propiedad pasa a Vendida o Alquilada, en la misma transacción.
- RN8: hasta 3 consultas por día (se cuentan por teléfono).
- RN9: no se agendan citas en fechas pasadas, y una visita ocupa al agente una hora.

Las comisiones salen de parámetros que cambia el Administrador desde **Mi perfil → Porcentajes de
comisión**: venta 3% a cargo del comprador y 2% del vendedor, y alquiler 3% del total del contrato.
Cada comisión guarda el porcentaje con el que se calculó. Operaciones, contratos y cobros no se borran:
se dan de baja (Resolución UIF 43/2024).

## Chequeos

La lógica que hace cálculos tiene su chequeo en `Grupo-condado-react/src/utils/*.check.mjs`.
Se corren así:

```bash
node src/utils/citas.check.mjs
```

En `pruebas/` están las pruebas contra la API y la base (PowerShell). Necesitan el reCAPTCHA
desactivado en el entorno de prueba (`RecaptchaSecret` vacío en `secrets.config`):

| Archivo | Qué prueba |
|---|---|
| `permisos.ps1` | 401 y 403, datos propios del Cliente, registro sin elegir rol (CP-25, CP-26, CP-27) |
| `contrasenas.ps1` | PBKDF2 con sal y migración de las contraseñas viejas (CP-11, CP-28) |
| `rn3.ps1` | No se publica sin matrícula y título (CP-01) |
| `operaciones.ps1` | Transacción de la operación y dos agentes a la vez (CP-15, CP-29, CP-30, CP-35) |
| `reglas.ps1` | RN8 y RN9 llamando a la API directamente (CP-06, CP-07, CP-13) |
| `comisiones.ps1` | Comisiones parametrizadas (CP-24) |
| `baja-logica.ps1` | Bajas lógicas de operaciones, contratos y cobros |
| `actualizacion.ps1` | El parche sobre una copia restaurada de un respaldo (CP-34) |
| `consistencia.sql` | Consultas de integridad: todas tienen que dar 0 |

## Notas

- Bootstrap y Font Awesome van dentro del paquete del frontend. Chart.js, Leaflet y Pannellum se
  cargan por CDN, así que los gráficos, los mapas y el recorrido 360 necesitan internet.
- Las fotos y los documentos se mandan a la API en base64.
- Los contratos, la ficha de la propiedad y los reportes se descargan en PDF con html2pdf.
