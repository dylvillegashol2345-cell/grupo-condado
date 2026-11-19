using System.Net.Http;
using System.Security.Principal;
using System.Threading;
using System.Threading.Tasks;
using WebApi.Models;

namespace WebApi
{
    // Identifica al usuario de cada solicitud a partir del encabezado Authorization: Bearer <token>
    public class TokenAuthHandler : DelegatingHandler
    {
        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage req, CancellationToken ct)
        {
            var auth = req.Headers.Authorization;
            if (auth != null && auth.Scheme == "Bearer" && !string.IsNullOrEmpty(auth.Parameter))
            {
                Sesion s = new Sesion().Validar(auth.Parameter);
                if (s != null)
                    req.GetRequestContext().Principal =
                        new GenericPrincipal(new GenericIdentity(s.IdUsuario.ToString(), "Bearer"), new[] { s.Rol });
            }
            return await base.SendAsync(req, ct);
        }
    }
}
