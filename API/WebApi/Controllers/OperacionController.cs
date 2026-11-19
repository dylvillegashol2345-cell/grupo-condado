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
        [Rol(Roles = Permisos.Todos)]
        public DataTable Get()
        {
            Operacion oOperacion = new Operacion();
            DataTable t = oOperacion.ListarTodos();
            if (Permisos.EsPersonal(User)) return t;
            int propio = Permisos.IdCliente(User);
            return Permisos.Filtrar(t, f => propio != 0 && Permisos.Entero(f, "IdCliente") == propio);
        }

        // GET: api/Operacion/5
        [Rol(Roles = Permisos.Todos)]
        public DataTable Get(int id)
        {
            Operacion oOperacion = new Operacion();
            oOperacion.IdOperacion = id;
            DataTable t = oOperacion.ListarPorId();
            if (Permisos.EsPersonal(User)) return t;
            int propio = Permisos.IdCliente(User);
            foreach (DataRow f in t.Rows)
                if (propio == 0 || Permisos.Entero(f, "IdCliente") != propio) throw Permisos.SinPermiso();
            return t;
        }

        // POST: api/Operacion
        [Rol(Roles = Permisos.Personal)]
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
        [Rol(Roles = Permisos.Personal)]
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
        [Rol(Roles = Permisos.Personal)]
        public void Delete(int id)
        {
            Operacion oOperacion = new Operacion();
            oOperacion.IdOperacion = id;
            oOperacion.Eliminar();
        }
    }
}