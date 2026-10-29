using System;
using System.Data;
using System.Web.Http;
using WebApi.Models;

namespace WebApi.Controllers
{
    public class ConsultaController : ApiController
    {
        // GET: api/Consulta — Admin ve todas las consultas
        public DataTable Get()
        {
            Consulta oConsulta = new Consulta();
            return oConsulta.ListarTodos();
        }

        // POST: api/Consulta — Cliente envía una consulta
        public void Post([FromBody] Consulta value)
        {
            Consulta oConsulta = new Consulta();
            oConsulta.Nombre = value.Nombre;
            oConsulta.Telefono = value.Telefono;
            oConsulta.Mensaje = value.Mensaje;
            oConsulta.PropiedadInteres = value.PropiedadInteres;
            oConsulta.Fecha = DateTime.Now;
            oConsulta.Guardar();
        }
    }
}