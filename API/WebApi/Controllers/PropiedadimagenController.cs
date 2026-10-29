using System;
using System.Data;
using System.Web.Http;
using WebApi.Models;

namespace WebApi.Controllers
{
    public class PropiedadImagenController : ApiController
    {
        // GET: api/PropiedadImagen/{idPropiedad}
        [HttpGet]
        [Route("api/PropiedadImagen/{idPropiedad}")]
        public DataTable GetPorPropiedad(int idPropiedad)
        {
            PropiedadImagen o = new PropiedadImagen();
            o.IdPropiedad = idPropiedad;
            return o.ListarPorPropiedad();
        }

        // POST: api/PropiedadImagen
        [HttpPost]
        [Route("api/PropiedadImagen")]
        public IHttpActionResult Post([FromBody] PropiedadImagen value)
        {
            PropiedadImagen o = new PropiedadImagen();
            o.IdPropiedad = value.IdPropiedad;
            o.Url = value.Url;
            o.Orden = value.Orden;
            o.EsPrincipal = value.EsPrincipal;
            string r = o.Guardar();
            if (r != "OK") return InternalServerError(new Exception(r));
            return Ok();
        }

        // DELETE: api/PropiedadImagen/{idImagen}
        [HttpDelete]
        [Route("api/PropiedadImagen/{idImagen}")]
        public IHttpActionResult Delete(int idImagen)
        {
            PropiedadImagen o = new PropiedadImagen();
            o.IdImagen = idImagen;
            string r = o.Eliminar();
            if (r != "OK") return InternalServerError(new Exception(r));
            return Ok();
        }

        // DELETE: api/PropiedadImagen/Todas/{idPropiedad}
        [HttpDelete]
        [Route("api/PropiedadImagen/Todas/{idPropiedad}")]
        public IHttpActionResult DeleteTodas(int idPropiedad)
        {
            PropiedadImagen o = new PropiedadImagen();
            o.IdPropiedad = idPropiedad;
            string r = o.EliminarTodas();
            if (r != "OK") return InternalServerError(new Exception(r));
            return Ok();
        }

        // PUT: api/PropiedadImagen/SetPrincipal
        [HttpPut]
        [Route("api/PropiedadImagen/SetPrincipal")]
        public IHttpActionResult SetPrincipal([FromBody] PropiedadImagen value)
        {
            PropiedadImagen o = new PropiedadImagen();
            o.IdImagen = value.IdImagen;
            o.IdPropiedad = value.IdPropiedad;
            string r = o.SetPrincipal();
            if (r != "OK") return InternalServerError(new Exception(r));
            return Ok();
        }
    }
}