using System;
using System.Collections.Generic;
using System.Data;
using System.Net;
using System.Security.Principal;
using System.Web.Http;
using WebApi.Models;

namespace WebApi
{
    // Roles de la matriz de permisos (carpeta 5.10) y ayudas para filtrar los datos propios
    public static class Permisos
    {
        public const string Admin = "Administrador";
        public const string Personal = "Administrador,Agente";
        public const string Todos = "Administrador,Agente,Cliente";

        // El usuario sale siempre del token, nunca de lo que manda el navegador
        public static int IdUsuario(IPrincipal u)
        {
            int id;
            return u != null && u.Identity != null && int.TryParse(u.Identity.Name, out id) ? id : 0;
        }

        public static bool EsAdmin(IPrincipal u) => u != null && u.IsInRole("Administrador");
        public static bool EsPersonal(IPrincipal u) => u != null && (u.IsInRole("Administrador") || u.IsInRole("Agente"));

        public static int IdCliente(IPrincipal u) => new Sesion().IdClienteDelUsuario(IdUsuario(u));

        public static HttpResponseException SinPermiso() => new HttpResponseException(HttpStatusCode.Forbidden);

        public static int Entero(DataRow f, string columna)
        {
            if (!f.Table.Columns.Contains(columna) || f[columna] == DBNull.Value) return 0;
            return Convert.ToInt32(f[columna]);
        }

        public static bool Verdadero(DataRow f, string columna)
        {
            return f.Table.Columns.Contains(columna) && f[columna] != DBNull.Value && Convert.ToBoolean(f[columna]);
        }

        public static DataTable Filtrar(DataTable t, Func<DataRow, bool> condicion)
        {
            DataTable r = t.Clone();
            foreach (DataRow f in t.Rows)
                if (condicion(f)) r.ImportRow(f);
            return r;
        }

        // Contratos del cliente: Contrato cuelga de Operacion, y SP_Contrato_GetAll ya trae el IdCliente
        public static HashSet<int> ContratosDelCliente(int idCliente)
        {
            var ids = new HashSet<int>();
            if (idCliente == 0) return ids;
            foreach (DataRow f in new Contrato().ListarTodos().Rows)
                if (Entero(f, "IdCliente") == idCliente) ids.Add(Entero(f, "IdContrato"));
            return ids;
        }
    }
}
