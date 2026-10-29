using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;

using System.Data;
using WebApi.Models;


namespace WebApi.Controllers
{
    public class PropietarioController : ApiController
    {
        // GET: api/Propietario
        public DataTable Get()
        {
            Propietario oPropietario = new Propietario();
            return oPropietario.ListarTodos();
        }

        // GET: api/Propietario/5
        public DataTable Get(int id)
        {
            Propietario oPropietario = new Propietario();
            oPropietario.IdPropietario = id;
            return oPropietario.ListarPorId();
        }

        // POST: api/Propietario
        public void Post([FromBody] Propietario value)
        {
            Propietario oPropietario = new Propietario();
            oPropietario.DNI = value.DNI;
            oPropietario.TipoDocumento = value.TipoDocumento;
            oPropietario.Apellido = value.Apellido;
            oPropietario.Nombre = value.Nombre;
            oPropietario.Email = value.Email;
            oPropietario.Calle = value.Calle;
            oPropietario.Numeracion = value.Numeracion;
            oPropietario.Localidad = value.Localidad;
            oPropietario.Guardar();
        }

        // PUT: api/Propietario/5
        public void Put(int id, [FromBody] Propietario value)
        {
            Propietario oPropietario = new Propietario();
            oPropietario.IdPropietario = value.IdPropietario;
            oPropietario.DNI = value.DNI;
            oPropietario.TipoDocumento = value.TipoDocumento;
            oPropietario.Apellido = value.Apellido;
            oPropietario.Nombre = value.Nombre;
            oPropietario.Email = value.Email;
            oPropietario.Calle = value.Calle;
            oPropietario.Numeracion = value.Numeracion;
            oPropietario.Localidad = value.Localidad;
            oPropietario.Editar();
        }

        // DELETE: api/Propietario/5
        public void Delete(int id)
        {
            Propietario oPropietario = new Propietario();
            oPropietario.IdPropietario = id;
            oPropietario.Eliminar();
        }
    }
}