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
        public DataTable Post([FromBody] Usuario value)
        {
            var vacio = new DataTable();
            if (value == null) return vacio;

            if (!CaptchaValido(value.CaptchaToken)) return vacio;

            Usuario oUsuario = new Usuario();
            return oUsuario.Login(
                value.Nombre,
                value.Contrasena
            );
        }
    }
}
