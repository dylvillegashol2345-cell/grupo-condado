using System;
using System.Data.SqlClient;
using System.Diagnostics;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using System.Web.Http.Filters;
using System.Web.Http.Results;

namespace WebApi
{
    // Traduce los errores de la base a respuestas claras, sin detalles técnicos para el usuario.
    // El detalle queda solo en el registro del servidor (Trace).
    public static class ErroresSql
    {
        public const string Generico = "Ocurrió un error. Intentá de nuevo.";

        public static HttpResponseMessage Crear(HttpRequestMessage req, Exception ex)
        {
            var sql = ex as SqlException ?? ex.InnerException as SqlException;
            if (sql != null)
            {
                // Los THROW de los procedimientos (50000 en adelante) ya traen el texto para el usuario
                if (sql.Number == 50001) return req.CreateErrorResponse(HttpStatusCode.Conflict, sql.Message);
                if (sql.Number >= 50000) return req.CreateErrorResponse(HttpStatusCode.BadRequest, sql.Message);
                if (sql.Number == 547)
                    return req.CreateErrorResponse(HttpStatusCode.BadRequest,
                        "No se puede guardar ni borrar: los datos no cumplen las reglas del sistema o hay otros registros que dependen de este.");
                if (sql.Number == 2601 || sql.Number == 2627)
                    return req.CreateErrorResponse(HttpStatusCode.BadRequest, "Ya existe un registro con esos datos.");
            }
            Trace.TraceError(ex.ToString());
            return req.CreateErrorResponse(HttpStatusCode.InternalServerError, Generico);
        }

        public static IHttpActionResult Respuesta(ApiController c, Exception ex)
        {
            return new ResponseMessageResult(Crear(c.Request, ex));
        }

        // Para los modelos que devuelven el error como texto en lugar de lanzarlo
        public static IHttpActionResult Fallo(ApiController c, string detalle)
        {
            Trace.TraceError(detalle);
            return new ResponseMessageResult(c.Request.CreateErrorResponse(HttpStatusCode.InternalServerError, Generico));
        }
    }

    // Cubre las acciones que no atrapan sus errores (por ejemplo, las que devuelven void)
    public class ErroresFilter : ExceptionFilterAttribute
    {
        public override void OnException(HttpActionExecutedContext ctx)
        {
            ctx.Response = ErroresSql.Crear(ctx.Request, ctx.Exception);
        }
    }
}
