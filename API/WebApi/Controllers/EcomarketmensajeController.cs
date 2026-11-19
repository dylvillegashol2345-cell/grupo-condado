using System;
using System.Collections.Generic;
using System.Data;
using System.Web.Http;
using WebApi.Models;

namespace WebApi.Controllers
{
    public class EcoMarketMensajeController : ApiController
    {
        // Participan de una conversación quien hizo el contacto y quien publicó el artículo
        bool Participa(int idContacto)
        {
            if (Permisos.EsAdmin(User)) return true;
            int yo = Permisos.IdUsuario(User);
            foreach (DataRow c in new EcoMarketContacto().Listar().Rows)
            {
                if (Permisos.Entero(c, "IdContacto") != idContacto) continue;
                if (Permisos.Entero(c, "IdUsuarioRemitente") == yo) return true;
                EcoMarketItem item = new EcoMarketItem();
                item.IdItem = Permisos.Entero(c, "IdItem");
                DataTable fila = item.ListarPorId();
                return fila.Rows.Count > 0 && Permisos.Entero(fila.Rows[0], "IdUsuario") == yo;
            }
            return false;
        }

        // GET: api/EcoMarketMensaje/Conversacion/{idContacto}
        [HttpGet]
        [Route("api/EcoMarketMensaje/Conversacion/{idContacto}")]
        public DataTable GetPorContacto(int idContacto)
        {
            if (!Participa(idContacto)) throw Permisos.SinPermiso();
            EcoMarketMensaje oMensaje = new EcoMarketMensaje();
            oMensaje.IdContacto = idContacto;
            return oMensaje.ListarPorContacto();
        }

        // POST: api/EcoMarketMensaje
        public IHttpActionResult Post([FromBody] EcoMarketMensaje value)
        {
            if (!Participa(value.IdContacto)) throw Permisos.SinPermiso();
            EcoMarketMensaje oMensaje = new EcoMarketMensaje();
            oMensaje.IdContacto = value.IdContacto;
            oMensaje.IdUsuario = Permisos.IdUsuario(User);
            oMensaje.Texto = value.Texto;
            string resultado = oMensaje.Guardar();
            if (resultado != "OK")
                return ErroresSql.Fallo(this, resultado);
            return Ok();
        }

        // PUT: api/EcoMarketMensaje/MarcarLeido
        [HttpPut]
        [Route("api/EcoMarketMensaje/MarcarLeido")]
        public IHttpActionResult MarcarLeido([FromBody] EcoMarketMensaje value)
        {
            EcoMarketMensaje oMensaje = new EcoMarketMensaje();
            oMensaje.IdContacto = value.IdContacto;
            oMensaje.IdUsuario = Permisos.IdUsuario(User);
            string resultado = oMensaje.MarcarLeido();
            if (resultado != "OK")
                return ErroresSql.Fallo(this, resultado);
            return Ok();
        }
    }
}