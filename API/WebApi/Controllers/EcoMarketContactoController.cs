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
            return oContacto.Listar();
        }

        // GET: api/EcoMarketContacto/Item/5
        [HttpGet]
        [Route("api/EcoMarketContacto/Item/{idItem}")]
        public DataTable GetPorItem(int idItem)
        {
            EcoMarketContacto oContacto = new EcoMarketContacto();
            oContacto.IdItem = idItem;
            return oContacto.ListarPorItem();
        }

        // POST: api/EcoMarketContacto
        public IHttpActionResult Post([FromBody] EcoMarketContacto value)
        {
            EcoMarketContacto oContacto = new EcoMarketContacto();
            oContacto.IdItem = value.IdItem;
            oContacto.Nombre = value.Nombre;
            oContacto.Telefono = value.Telefono;
            oContacto.Mensaje = value.Mensaje;
            oContacto.IdUsuarioRemitente = value.IdUsuarioRemitente;

            string resultado = oContacto.Guardar();
            if (resultado != "OK")
                return InternalServerError(new Exception(resultado));

            return Ok();
        }
    }
}
