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
    public class CitaController : ApiController
    {
        // GET: api/Cita
        public DataTable Get()
        {
            Cita oCita = new Cita();
            return oCita.ListarTodos();
        }

        // GET: api/Cita/5
        public DataTable Get(int id)
        {
            Cita oCita = new Cita();
            oCita.IdCita = id;
            return oCita.ListarPorId();
        }

        // POST: api/Cita — devuelve el IdCita nuevo.
        public IHttpActionResult Post([FromBody] Cita value)
        {
            try
            {
                return Ok(new { IdCita = value.Guardar() });
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        // PUT: api/Cita/5
        public IHttpActionResult Put(int id, [FromBody] Cita value)
        {
            try
            {
                value.IdCita = id;
                value.Editar();
                return Ok();
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        // DELETE: api/Cita/5
        public void Delete(int id)
        {
            Cita oCita = new Cita();
            oCita.IdCita = id;
            oCita.Eliminar();
        }
    }
}
