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
| Contratos y Pagos | Generación de contratos de locación y compraventa, cuotas y cobros |
| Consultas y Citas | Consultas que llegan desde la web y la app móvil, y agenda de visitas |
| EcoMarket | Publicaciones de productos sustentables y mensajes entre usuarios |
| Impacto ambiental | Indicadores: propiedades con paneles y aislamiento, CO₂ estimado ahorrado y artículos donados |
| Usuarios y Perfil | Cuentas, roles y datos personales |

## Cómo levantarlo

Tienen que estar corriendo las tres partes: base de datos, API y frontend.

### 1. Base de datos

Abrir `GrupoCondado_BaseCompleta.sql` en SQL Server Management Studio y ejecutarlo (F5). Crea la
base `GestionPropiedadesCondado` con todas las tablas, los procedimientos y los datos.

Ojo: si ya existe una base con ese nombre, el script la borra y la crea de nuevo.

### 2. API

Abrir `API/GestionPropiedades.sln` en Visual Studio y ejecutar con IIS Express (F5). Queda en
`http://localhost:56153/`.

- **Cadena de conexión:** está en cada archivo de `API/WebApi/Models/` con `Data Source=Dylan`.
  Hay que cambiarlo por el nombre de la instancia de SQL Server de cada uno.
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
pública del sitio de reCAPTCHA). Si la API está en otra dirección, se cambia en
`src/services/api.js`.

Para compilar: `npm run build`. Para revisar el código: `npm run lint`.

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
| Buscar propiedades | Sí | Sí | | |
| Catálogo | | | Sí | Sí |
| Dashboard y reportes | Sí | Sí | | |
| Propiedades y propietarios | Sí | Sí | | |
| Clientes | Sí | | | |
| Operaciones | Sí | Sí | | |
| Contratos y cobros | Sí | Sí | Solo los suyos | |
| Consultas y citas | Sí | Sí | | |
| Hacer consulta | | | Sí | |
| EcoMarket | Sí | Sí | Sí | |
| Impacto ambiental | Sí | Sí | | |
| Usuarios | Sí | | | |
| Mi perfil | Sí | Sí | Sí | |

Si alguien escribe a mano la dirección de una sección que no le corresponde, lo manda a su inicio.

## Reglas de negocio

Están en `Grupo-condado-react/src/utils/reglas.js`:

- RN1: la clase energética sale de paneles solares y aislamiento (los dos: A, uno: B, ninguno: C).
- RN2: las propiedades clase A tienen 15% de bonificación.
- RN3: el formulario avisa si falta la matrícula o el título.
- RN4: no se puede registrar una operación sobre una propiedad que no está disponible.
- RN5: al registrar la operación, la propiedad pasa a Vendida o Alquilada.

## Chequeos

La lógica que hace cálculos tiene su chequeo en `Grupo-condado-react/src/utils/*.check.mjs`.
Se corren así:

```bash
node src/utils/citas.check.mjs
```

## Notas

- Bootstrap, Font Awesome, Chart.js, Leaflet y Pannellum se cargan por CDN, así que los gráficos,
  los mapas y el recorrido 360 necesitan internet.
- Las fotos y los documentos se mandan a la API en base64.
- Los contratos, la ficha de la propiedad y los reportes se descargan en PDF con html2pdf.
