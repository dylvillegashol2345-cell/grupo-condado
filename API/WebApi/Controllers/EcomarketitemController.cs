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
    public class EcoMarketItemController : ApiController
    {
        // GET: api/EcoMarketItem
        public DataTable Get()
        {
            EcoMarketItem oItem = new EcoMarketItem();
            return oItem.ListarTodos();
        }

        // GET: api/EcoMarketItem/5
        public DataTable Get(int id)
        {
            EcoMarketItem oItem = new EcoMarketItem();
            oItem.IdItem = id;
            return oItem.ListarPorId();
        }

        // GET: api/EcoMarketItem/Usuario/5
        [HttpGet]
        [Route("api/EcoMarketItem/Usuario/{idUsuario}")]
        public DataTable GetPorUsuario(int idUsuario)
        {
            EcoMarketItem oItem = new EcoMarketItem();
            oItem.IdUsuario = idUsuario;
            return oItem.ListarPorUsuario();
        }

        // POST: api/EcoMarketItem
        public IHttpActionResult Post([FromBody] EcoMarketItem value)
        {
            EcoMarketItem oItem = new EcoMarketItem();
            oItem.IdUsuario = value.IdUsuario;
            oItem.Titulo = value.Titulo;
            oItem.Descripcion = value.Descripcion;
            oItem.Categoria = value.Categoria;
            oItem.Precio = value.EsGratis ? null : value.Precio;
            oItem.EsGratis = value.EsGratis;
            oItem.Imagen = value.Imagen;

            string resultado = oItem.Guardar();
            if (resultado != "OK")
                return InternalServerError(new Exception(resultado));

            return Ok();
        }

        // PUT: api/EcoMarketItem/5  (cambiar Estado: Disponible / Reservado / Entregado)
        public IHttpActionResult Put(int id, [FromBody] EcoMarketItem value)
        {
            EcoMarketItem oItem = new EcoMarketItem();
            oItem.IdItem = id;
            oItem.Estado = value.Estado;

            string resultado = oItem.ActualizarEstado();
            if (resultado != "OK")
                return InternalServerError(new Exception(resultado));

            return Ok();
        }

        // DELETE: api/EcoMarketItem/5
        public IHttpActionResult Delete(int id)
        {
            EcoMarketItem oItem = new EcoMarketItem();
            oItem.IdItem = id;

            string resultado = oItem.Eliminar();
            if (resultado != "OK")
                return InternalServerError(new Exception(resultado));

            return Ok();
        }
    }
}