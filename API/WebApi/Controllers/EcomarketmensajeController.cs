using System;
using System.Collections.Generic;
using System.Data;
using System.Web.Http;
using WebApi.Models;

namespace WebApi.Controllers
{
    public class EcoMarketMensajeController : ApiController
    {
        // GET: api/EcoMarketMensaje/Conversacion/{idContacto}
        [HttpGet]
        [Route("api/EcoMarketMensaje/Conversacion/{idContacto}")]
        public DataTable GetPorContacto(int idContacto)
        {
            EcoMarketMensaje oMensaje = new EcoMarketMensaje();
            oMensaje.IdContacto = idContacto;
            return oMensaje.ListarPorContacto();
        }

        // POST: api/EcoMarketMensaje
        public IHttpActionResult Post([FromBody] EcoMarketMensaje value)
        {
            EcoMarketMensaje oMensaje = new EcoMarketMensaje();
            oMensaje.IdContacto = value.IdContacto;
            oMensaje.IdUsuario = value.IdUsuario;
            oMensaje.Texto = value.Texto;
            string resultado = oMensaje.Guardar();
            if (resultado != "OK")
                return InternalServerError(new Exception(resultado));
            return Ok();
        }

        // PUT: api/EcoMarketMensaje/MarcarLeido
        [HttpPut]
        [Route("api/EcoMarketMensaje/MarcarLeido")]
        public IHttpActionResult MarcarLeido([FromBody] EcoMarketMensaje value)
        {
            EcoMarketMensaje oMensaje = new EcoMarketMensaje();
            oMensaje.IdContacto = value.IdContacto;
            oMensaje.IdUsuario = value.IdUsuario;
            string resultado = oMensaje.MarcarLeido();
            if (resultado != "OK")
                return InternalServerError(new Exception(resultado));
            return Ok();
        }
    }
}