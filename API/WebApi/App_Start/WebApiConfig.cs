using System.Web.Http;
using System.Web.Http.Cors;

namespace WebApi
{
    public static class WebApiConfig
    {
        public static void Register(HttpConfiguration config)
        {
            // CORS: permitir cualquier origen local (Live Server, IIS Express, etc.)
            var cors = new EnableCorsAttribute("*", "*", "GET,POST,PUT,DELETE,OPTIONS");
            cors.SupportsCredentials = false;
            config.EnableCors(cors);

            // Permisos validados en el servidor: el handler identifica al usuario por su token
            // y el filtro exige sesión en toda la API, salvo las acciones marcadas [AllowAnonymous]
            config.MessageHandlers.Add(new TokenAuthHandler());
            config.Filters.Add(new RolAttribute());
            config.Filters.Add(new ErroresFilter());

            // Rutas de API web
            config.MapHttpAttributeRoutes();

            config.Routes.MapHttpRoute(
                name: "DefaultApi",
                routeTemplate: "api/{controller}/{id}",
                defaults: new { id = RouteParameter.Optional }
            );
        }
    }
}