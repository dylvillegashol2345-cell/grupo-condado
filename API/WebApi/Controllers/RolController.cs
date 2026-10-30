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
    public class RolController : ApiController
    {
        // GET: api/Rol
        public DataTable Get()
        {
            Rol oRol = new Rol();
            return oRol.ListarTodos();
        }

        // GET: api/Rol/5
        public DataTable Get(int id)
        {
            Rol oRol = new Rol();
            oRol.IdRol = id;
            return oRol.ListarPorId();
        }
    }
}