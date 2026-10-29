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
    public class OperacionController : ApiController
    {
        // GET: api/Operacion
        public DataTable Get()
        {
            Operacion oOperacion = new Operacion();
            return oOperacion.ListarTodos();
        }

        // GET: api/Operacion/5
        public DataTable Get(int id)
        {
            Operacion oOperacion = new Operacion();
            oOperacion.IdOperacion = id;
            return oOperacion.ListarPorId();
        }

        // POST: api/Operacion
        public string Post([FromBody] Operacion value)
        {
            Operacion oOperacion = new Operacion();

            oOperacion.Tipo = value.Tipo;
            oOperacion.Fecha = value.Fecha;
            oOperacion.IdCliente = value.IdCliente;
            oOperacion.IdPropiedad = value.IdPropiedad;
            oOperacion.IdUsuario = value.IdUsuario;

            return oOperacion.Guardar();
        }

        // PUT: api/Operacion/5
        public void Put(int id, [FromBody] Operacion value)
        {
            Operacion oOperacion = new Operacion();
            oOperacion.IdOperacion = id;
            oOperacion.Tipo = value.Tipo;
            oOperacion.Fecha = value.Fecha;
            oOperacion.IdCliente = value.IdCliente;
            oOperacion.IdPropiedad = value.IdPropiedad;
            oOperacion.IdUsuario = value.IdUsuario;
            oOperacion.Editar();
        }

        // DELETE: api/Operacion/5
        public void Delete(int id)
        {
            Operacion oOperacion = new Operacion();
            oOperacion.IdOperacion = id;
            oOperacion.Eliminar();
        }
    }
}