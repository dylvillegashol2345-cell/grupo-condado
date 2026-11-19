using System.Data;
using System.Web.Http;
using WebApi.Models;

namespace WebApi.Controllers
{
    public class ClienteController : ApiController
    {
        [Rol(Roles = Permisos.Todos)]
        public DataTable Get()
        {
            Cliente o = new Cliente();
            DataTable t = o.ListarTodos();
            if (Permisos.EsPersonal(User)) return t;
            int propio = Permisos.IdCliente(User);
            return Permisos.Filtrar(t, f => Permisos.Entero(f, "IdCliente") == propio);
        }

        [Rol(Roles = Permisos.Todos)]
        public DataTable Get(int id)
        {
            if (!Permisos.EsPersonal(User) && Permisos.IdCliente(User) != id) throw Permisos.SinPermiso();
            Cliente o = new Cliente();
            o.IdCliente = id;
            return o.ListarPorId();
        }

        [Rol(Roles = Permisos.Personal)]
        public IHttpActionResult Post([FromBody] Cliente value)
        {
            try
            {
                Cliente o = new Cliente();
                o.Nombre = value.Nombre;
                o.Apellido = value.Apellido;
                o.DNI = value.DNI;
                o.Email = value.Email;
                o.Telefono = value.Telefono;
                o.Localidad = value.Localidad;
                o.Guardar();
                return Ok();
            }
            catch (System.Exception ex) { return ErroresSql.Respuesta(this, ex); }
        }

        [Rol(Roles = Permisos.Personal)]
        public IHttpActionResult Put(int id, [FromBody] Cliente value)
        {
            try
            {
                Cliente o = new Cliente();
                o.IdCliente = id;
                o.Nombre = value.Nombre;
                o.Apellido = value.Apellido;
                o.DNI = value.DNI;
                o.Email = value.Email;
                o.Telefono = value.Telefono;
                o.Localidad = value.Localidad;
                o.Editar();
                return Ok();
            }
            catch (System.Exception ex) { return ErroresSql.Respuesta(this, ex); }
        }

        [Rol(Roles = Permisos.Personal)]
        public IHttpActionResult Delete(int id)
        {
            try
            {
                Cliente o = new Cliente();
                o.IdCliente = id;
                o.Eliminar();
                return Ok();
            }
            catch (System.Exception ex) { return ErroresSql.Respuesta(this, ex); }
        }
    }
}