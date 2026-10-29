using System.Data;
using System.Web.Http;
using WebApi.Models;

namespace WebApi.Controllers
{
    public class ClienteController : ApiController
    {
        public DataTable Get()
        {
            Cliente o = new Cliente();
            return o.ListarTodos();
        }

        public DataTable Get(int id)
        {
            Cliente o = new Cliente();
            o.IdCliente = id;
            return o.ListarPorId();
        }

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
            catch (System.Exception ex) { return InternalServerError(ex); }
        }

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
            catch (System.Exception ex) { return InternalServerError(ex); }
        }

        public IHttpActionResult Delete(int id)
        {
            try
            {
                Cliente o = new Cliente();
                o.IdCliente = id;
                o.Eliminar();
                return Ok();
            }
            catch (System.Exception ex) { return InternalServerError(ex); }
        }
    }
}