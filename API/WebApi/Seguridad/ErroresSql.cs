using System;
using System.Data.SqlClient;
using System.Diagnostics;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using System.Web.Http.Results;

namespace WebApi
{
    // Traduce los errores de la base a respuestas claras, sin detalles técnicos para el usuario
    public static class ErroresSql
    {
        public static IHttpActionResult Respuesta(ApiController c, Exception ex)
        {
            var sql = ex as SqlException ?? ex.InnerException as SqlException;
            if (sql != null)
            {
                // Los THROW de los procedimientos (50000 en adelante) ya traen el texto para el usuario
                if (sql.Number == 50001) return Error(c, HttpStatusCode.Conflict, sql.Message);
                if (sql.Number >= 50000) return Error(c, HttpStatusCode.BadRequest, sql.Message);
                if (sql.Number == 547)
                    return Error(c, HttpStatusCode.BadRequest, "Los datos no cumplen las reglas del sistema: revisá que lo relacionado exista y que los valores sean válidos.");
                if (sql.Number == 2601 || sql.Number == 2627)
                    return Error(c, HttpStatusCode.BadRequest, "Ya existe un registro con esos datos.");
            }
            Trace.TraceError(ex.ToString());
            return Error(c, HttpStatusCode.InternalServerError, "Ocurrió un error. Intentá de nuevo.");
        }

        static IHttpActionResult Error(ApiController c, HttpStatusCode codigo, string mensaje)
        {
            return new ResponseMessageResult(c.Request.CreateErrorResponse(codigo, mensaje));
        }
    }
}
