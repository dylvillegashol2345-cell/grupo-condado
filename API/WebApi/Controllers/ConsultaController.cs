using System;
using System.Linq;
using System.Data;
using System.Web.Http;
using WebApi.Models;

namespace WebApi.Controllers
{
    public class ConsultaController : ApiController
    {
        // GET: api/Consulta — Admin ve todas las consultas
        [Rol(Roles = Permisos.Todos)]
        public DataTable Get()
        {
            Consulta oConsulta = new Consulta();
            DataTable t = oConsulta.ListarTodos();
            if (Permisos.EsPersonal(User)) return t;
            // Consulta no guarda el usuario: el Cliente ve las que coinciden con su nombre o su teléfono
            Usuario u = new Usuario();
            u.IdUsuario = Permisos.IdUsuario(User);
            DataTable fila = u.ListarPorId();
            if (fila.Rows.Count == 0) return t.Clone();
            string nombre = Convert.ToString(fila.Rows[0]["Nombre"]).Trim().ToLower();
            string tel = Digitos(Convert.ToString(fila.Rows[0]["Telefono"]));
            return Permisos.Filtrar(t, f =>
                (nombre != "" && Convert.ToString(f["Nombre"]).ToLower().Contains(nombre)) ||
                (tel.Length >= 10 && Digitos(Convert.ToString(f["Telefono"])).EndsWith(tel.Substring(tel.Length - 10))));
        }

        static string Digitos(string s) => new string((s ?? "").Where(char.IsDigit).ToArray());

        // POST: api/Consulta — Cliente envía una consulta
        [AllowAnonymous]
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