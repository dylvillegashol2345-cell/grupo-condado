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
    public class EcoMarketContactoController : ApiController
    {
        // GET: api/EcoMarketContacto
        // Lo usa la bandeja "Mis mensajes" del interesado para encontrar las
        // conversaciones en las que participó (requiere SP_EcoMarketContacto_GetAll).
        public DataTable Get()
        {
            EcoMarketContacto oContacto = new EcoMarketContacto();
            DataTable t = oContacto.Listar();
            if (Permisos.EsAdmin(User)) return t;
            // Cada uno ve los contactos que hizo y los que recibieron sus publicaciones
            int yo = Permisos.IdUsuario(User);
            EcoMarketItem items = new EcoMarketItem();
            items.IdUsuario = yo;
            var mios = new HashSet<int>();
            foreach (DataRow f in items.ListarPorUsuario().Rows) mios.Add(Permisos.Entero(f, "IdItem"));
            return Permisos.Filtrar(t, f => Permisos.Entero(f, "IdUsuarioRemitente") == yo || mios.Contains(Permisos.Entero(f, "IdItem")));
        }

        // GET: api/EcoMarketContacto/Item/5
        [HttpGet]
        [Route("api/EcoMarketContacto/Item/{idItem}")]
        public DataTable GetPorItem(int idItem)
        {
            EcoMarketContacto oContacto = new EcoMarketContacto();
            oContacto.IdItem = idItem;
            DataTable t = oContacto.ListarPorItem();
            if (Permisos.EsAdmin(User)) return t;
            int yo = Permisos.IdUsuario(User);
            EcoMarketItem item = new EcoMarketItem();
            item.IdItem = idItem;
            DataTable fila = item.ListarPorId();
            if (fila.Rows.Count > 0 && Permisos.Entero(fila.Rows[0], "IdUsuario") == yo) return t;
            return Permisos.Filtrar(t, f => Permisos.Entero(f, "IdUsuarioRemitente") == yo);
        }

        // POST: api/EcoMarketContacto
        public IHttpActionResult Post([FromBody] EcoMarketContacto value)
        {
            EcoMarketContacto oContacto = new EcoMarketContacto();
            oContacto.IdItem = value.IdItem;
            oContacto.Nombre = value.Nombre;
            oContacto.Telefono = value.Telefono;
            oContacto.Mensaje = value.Mensaje;
            oContacto.IdUsuarioRemitente = Permisos.IdUsuario(User);

            string resultado = oContacto.Guardar();
            if (resultado != "OK")
                return ErroresSql.Fallo(this, resultado);

            return Ok();
        }
    }
}
