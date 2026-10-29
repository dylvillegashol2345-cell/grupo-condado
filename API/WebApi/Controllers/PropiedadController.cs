using System;
using System.Collections.Generic;
using System.Data;
using System.Web.Http;
using WebApi.Models;

namespace WebApi.Controllers
{
    public class PropiedadController : ApiController
    {
        // GET: api/Propiedad
        public DataTable Get()
        {
            Propiedad oPropiedad = new Propiedad();
            return oPropiedad.ListarTodos();
        }

        // GET: api/Propiedad/5
        public DataTable Get(int id)
        {
            Propiedad oPropiedad = new Propiedad();
            oPropiedad.IdPropiedad = id;
            return oPropiedad.ListarPorId();
        }

        // POST: api/Propiedad — devuelve el IdPropiedad creado
        public IHttpActionResult Post([FromBody] Propiedad value)
        {
            try
            {
                Propiedad oPropiedad = new Propiedad();
                oPropiedad.IdPropietario = (value.IdPropietario.HasValue && value.IdPropietario.Value > 0) ? value.IdPropietario : null;
                oPropiedad.Barrio = value.Barrio;
                oPropiedad.Calle = value.Calle;
                oPropiedad.Numeracion = value.Numeracion;
                oPropiedad.Piso = value.Piso;
                oPropiedad.NroDepto = value.NroDepto;
                oPropiedad.IdTipo = value.IdTipo;
                oPropiedad.IdLocalidad = value.IdLocalidad;
                oPropiedad.Precio = value.Precio;
                oPropiedad.Superficie = value.Superficie;
                oPropiedad.Descripcion = value.Descripcion;
                oPropiedad.Estado = value.Estado;
                oPropiedad.PanelesSolares = value.PanelesSolares;
                oPropiedad.AislamientoTermico = value.AislamientoTermico;
                oPropiedad.CategoriaEco = value.CategoriaEco;
                oPropiedad.Bonificacion = value.Bonificacion;
                oPropiedad.MatriculaVerificada = value.MatriculaVerificada;
                oPropiedad.TituloPropiedad = value.TituloPropiedad;
                oPropiedad.ArchivoMatricula = value.ArchivoMatricula;
                oPropiedad.ArchivoTitulo = value.ArchivoTitulo;
                oPropiedad.Publicada = value.Publicada;
                oPropiedad.Imagen = value.Imagen;
                oPropiedad.Servicios = value.Servicios;
                oPropiedad.Moneda = value.Moneda ?? "ARS";
                oPropiedad.Tour360 = value.Tour360;

                int idNuevo = oPropiedad.Guardar();
                return Ok(new { IdPropiedad = idNuevo });
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        // PUT: api/Propiedad/5
        public IHttpActionResult Put(int id, [FromBody] Propiedad value)
        {
            try
            {
                Propiedad oPropiedad = new Propiedad();
                oPropiedad.IdPropiedad = id;
                oPropiedad.IdPropietario = (value.IdPropietario.HasValue && value.IdPropietario.Value > 0) ? value.IdPropietario : null;
                oPropiedad.Barrio = value.Barrio;
                oPropiedad.Calle = value.Calle;
                oPropiedad.Numeracion = value.Numeracion;
                oPropiedad.Piso = value.Piso;
                oPropiedad.NroDepto = value.NroDepto;
                oPropiedad.IdTipo = value.IdTipo;
                oPropiedad.IdLocalidad = value.IdLocalidad;
                oPropiedad.Precio = value.Precio;
                oPropiedad.Superficie = value.Superficie;
                oPropiedad.Descripcion = value.Descripcion;
                oPropiedad.Estado = value.Estado;
                oPropiedad.PanelesSolares = value.PanelesSolares;
                oPropiedad.AislamientoTermico = value.AislamientoTermico;
                oPropiedad.CategoriaEco = value.CategoriaEco;
                oPropiedad.Bonificacion = value.Bonificacion;
                oPropiedad.MatriculaVerificada = value.MatriculaVerificada;
                oPropiedad.TituloPropiedad = value.TituloPropiedad;
                oPropiedad.ArchivoMatricula = value.ArchivoMatricula;
                oPropiedad.ArchivoTitulo = value.ArchivoTitulo;
                oPropiedad.Publicada = value.Publicada;
                oPropiedad.Imagen = value.Imagen;
                oPropiedad.Servicios = value.Servicios;
                oPropiedad.Moneda = value.Moneda ?? "ARS";
                oPropiedad.Tour360 = value.Tour360;
                oPropiedad.Editar();
                return Ok();
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        // DELETE: api/Propiedad/5
        public IHttpActionResult Delete(int id)
        {
            try
            {
                Propiedad oPropiedad = new Propiedad();
                oPropiedad.IdPropiedad = id;
                oPropiedad.Eliminar();
                return Ok();
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }
    }
}