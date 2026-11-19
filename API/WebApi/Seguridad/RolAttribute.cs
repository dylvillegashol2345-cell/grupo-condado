using System.Net;
using System.Net.Http;
using System.Web.Http;
using System.Web.Http.Controllers;

namespace WebApi
{
    // Como [Authorize], pero distingue: sin sesión responde 401 y con un rol sin permiso, 403
    public class RolAttribute : AuthorizeAttribute
    {
        protected override void HandleUnauthorizedRequest(HttpActionContext ctx)
        {
            var principal = ctx.RequestContext.Principal;
            bool identificado = principal != null && principal.Identity != null && principal.Identity.IsAuthenticated;
            ctx.Response = ctx.Request.CreateResponse(identificado ? HttpStatusCode.Forbidden : HttpStatusCode.Unauthorized);
        }
    }
}
