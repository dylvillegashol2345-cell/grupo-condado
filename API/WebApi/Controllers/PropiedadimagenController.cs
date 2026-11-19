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
        [AllowAnonymous]
        public DataTable GetPorPropiedad(int idPropiedad)
        {
            PropiedadImagen o = new PropiedadImagen();
            o.IdPropiedad = idPropiedad;
            DataTable t = o.ListarPorPropiedad();
            if (Permisos.EsPersonal(User)) return t;
            Propiedad p = new Propiedad();
            p.IdPropiedad = idPropiedad;
            DataTable prop = p.ListarPorId();
            bool publicada = prop.Rows.Count > 0 && Permisos.Verdadero(prop.Rows[0], "Publicada");
            return publicada ? t : t.Clone();
        }

        // POST: api/PropiedadImagen
        [HttpPost]
        [Route("api/PropiedadImagen")]
        [Rol(Roles = Permisos.Personal)]
        public IHttpActionResult Post([FromBody] PropiedadImagen value)
        {
            PropiedadImagen o = new PropiedadImagen();
            o.IdPropiedad = value.IdPropiedad;
            o.Url = value.Url;
            o.Orden = value.Orden;
            o.EsPrincipal = value.EsPrincipal;
            string r = o.Guardar();
            if (r != "OK") return ErroresSql.Fallo(this, r);
            return Ok();
        }

        // DELETE: api/PropiedadImagen/{idImagen}
        [HttpDelete]
        [Route("api/PropiedadImagen/{idImagen}")]
        [Rol(Roles = Permisos.Personal)]
        public IHttpActionResult Delete(int idImagen)
        {
            PropiedadImagen o = new PropiedadImagen();
            o.IdImagen = idImagen;
            string r = o.Eliminar();
            if (r != "OK") return ErroresSql.Fallo(this, r);
            return Ok();
        }

        // DELETE: api/PropiedadImagen/Todas/{idPropiedad}
        [HttpDelete]
        [Route("api/PropiedadImagen/Todas/{idPropiedad}")]
        [Rol(Roles = Permisos.Personal)]
        public IHttpActionResult DeleteTodas(int idPropiedad)
        {
            PropiedadImagen o = new PropiedadImagen();
            o.IdPropiedad = idPropiedad;
            string r = o.EliminarTodas();
            if (r != "OK") return ErroresSql.Fallo(this, r);
            return Ok();
        }

        // PUT: api/PropiedadImagen/SetPrincipal
        [HttpPut]
        [Route("api/PropiedadImagen/SetPrincipal")]
        [Rol(Roles = Permisos.Personal)]
        public IHttpActionResult SetPrincipal([FromBody] PropiedadImagen value)
        {
            PropiedadImagen o = new PropiedadImagen();
            o.IdImagen = value.IdImagen;
            o.IdPropiedad = value.IdPropiedad;
            string r = o.SetPrincipal();
            if (r != "OK") return ErroresSql.Fallo(this, r);
            return Ok();
        }
    }
}