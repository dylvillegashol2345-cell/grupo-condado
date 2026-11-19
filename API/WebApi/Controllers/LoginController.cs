using System;
using System.Collections.Generic;
using System.Collections.Specialized;
using System.Configuration;
using System.Data;
using System.Net;
using System.Text;
using System.Web.Http;
using Newtonsoft.Json.Linq;
using WebApi.Models;

namespace WebApi.Controllers
{
    public class LoginController : ApiController
    {
        private const string URL_VERIFICACION = "https://www.google.com/recaptcha/api/siteverify";

        private static bool CaptchaValido(string token)
        {
            string secreto = ConfigurationManager.AppSettings["RecaptchaSecret"];
            if (string.IsNullOrWhiteSpace(secreto)) return true;

            if (string.IsNullOrWhiteSpace(token)) return false;

            try
            {
                using (var cliente = new WebClient())
                {
                    cliente.Encoding = Encoding.UTF8;
                    var datos = new NameValueCollection
                    {
                        { "secret", secreto },
                        { "response", token }
                    };
                    byte[] respuesta = cliente.UploadValues(URL_VERIFICACION, datos);
                    var json = JObject.Parse(Encoding.UTF8.GetString(respuesta));
                    return json.Value<bool?>("success") == true;
                }
            }
            catch (Exception)
            {
                return true;
            }
        }

        // POST: api/Login
        [AllowAnonymous]
        public DataTable Post([FromBody] Usuario value)
        {
            var vacio = new DataTable();
            if (value == null) return vacio;

            if (!CaptchaValido(value.CaptchaToken)) return vacio;

            Usuario oUsuario = new Usuario();
            DataTable t = oUsuario.Login(value.Nombre, value.Contrasena);
            if (t.Rows.Count == 0) return t;

            // Token de 8 horas que el navegador manda en cada solicitud
            t.Columns.Add("Token", typeof(string));
            t.Rows[0]["Token"] = new Sesion().Crear(Convert.ToInt32(t.Rows[0]["IdUsuario"]));
            return t;
        }

        // POST: api/Login/Logout
        [AllowAnonymous]
        [HttpPost]
        [Route("api/Login/Logout")]
        public IHttpActionResult Logout()
        {
            var auth = Request.Headers.Authorization;
            if (auth != null && auth.Scheme == "Bearer" && !string.IsNullOrEmpty(auth.Parameter))
                new Sesion().Revocar(auth.Parameter);
            return Ok();
        }
    }
}
