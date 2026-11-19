using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

using System.Data;
using System.Data.SqlClient;
using System.Configuration;

namespace WebApi.Models
{
    public class Usuario
    {
        #region Atributo
        string connectionString = ConfigurationManager.ConnectionStrings["GestionPropiedadesCondado"].ConnectionString;
        #endregion

        #region Propiedades
        public int IdUsuario { get; set; }
        public string Nombre { get; set; }
        public int IdRol { get; set; }
        public string Email { get; set; }
        public string Telefono { get; set; }
        public string Contrasena { get; set; }
        public string Rol { get; set; }
        // Token del reCAPTCHA que manda el login. No se guarda en la base.
        public string CaptchaToken { get; set; }
        #endregion

        #region Métodos

        public DataTable ListarTodos()
        {
            string sql = "SP_Usuario_GetAll";
            using (SqlConnection cnn = new SqlConnection(connectionString))
            {
                SqlCommand cmd = new SqlCommand(sql, cnn);
                cmd.CommandType = CommandType.StoredProcedure;

                SqlDataAdapter da = new SqlDataAdapter(cmd);
                DataSet ds = new DataSet();
                da.Fill(ds);
                return ds.Tables[0];
            }
        }

        public DataTable ListarPorId()
        {
            string sql = "SP_Usuario_GetId";
            using (SqlConnection cnn = new SqlConnection(connectionString))
            {
                SqlCommand cmd = new SqlCommand(sql, cnn);
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.Add("@IdUsuario", SqlDbType.Int).Value = IdUsuario;

                SqlDataAdapter da = new SqlDataAdapter(cmd);
                DataSet ds = new DataSet();
                da.Fill(ds);
                return ds.Tables[0];
            }
        }

        public string Guardar()
        {
            string sql = "SP_Usuario_Insert";
            try
            {
                using (SqlConnection cnn = new SqlConnection(connectionString))
                {
                    SqlCommand cmd = new SqlCommand(sql, cnn);
                    cmd.CommandType = CommandType.StoredProcedure;

                    cmd.Parameters.Add("@Nombre", SqlDbType.NVarChar).Value = Nombre;
                    cmd.Parameters.Add("@Email", SqlDbType.NVarChar).Value = Email;
                    cmd.Parameters.Add("@Telefono", SqlDbType.NVarChar).Value = (object)Telefono ?? DBNull.Value;
                    cmd.Parameters.Add("@Contrasena", SqlDbType.NVarChar).Value = Contrasena;
                    cmd.Parameters.Add("@IdRol", SqlDbType.Int).Value = IdRol;

                    cnn.Open();
                    cmd.ExecuteNonQuery();
                    return "OK";
                }
            }
            catch (Exception ex)
            {
                if (ex.Message.Contains("EMAIL_DUPLICADO"))
                    return "EMAIL_DUPLICADO";
                return "ERROR: " + ex.Message;
            }
        }


        public void Editar()
        {
            string sql = "SP_Usuario_Update";
            using (SqlConnection cnn = new SqlConnection(connectionString))
            {
                SqlCommand cmd = new SqlCommand(sql, cnn);
                cmd.CommandType = CommandType.StoredProcedure;

                cmd.Parameters.Add("@IdUsuario", SqlDbType.Int).Value = IdUsuario;
                cmd.Parameters.Add("@Nombre", SqlDbType.NVarChar).Value = Nombre;
                cmd.Parameters.Add("@IdRol", SqlDbType.Int).Value = IdRol;
                cmd.Parameters.Add("@Email", SqlDbType.NVarChar).Value = Email;
                cmd.Parameters.Add("@Contrasena", SqlDbType.NVarChar).Value = Contrasena;

                cnn.Open();
                cmd.ExecuteNonQuery();
            }
        }

        public void Eliminar()
        {
            string sql = "SP_Usuario_Delete";
            using (SqlConnection cnn = new SqlConnection(connectionString))
            {
                SqlCommand cmd = new SqlCommand(sql, cnn);
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.Add("@IdUsuario", SqlDbType.Int).Value = IdUsuario;
                cnn.Open();
                cmd.ExecuteNonQuery();
            }
        }

        // Ingreso: devuelve la fila del usuario (sin la contraseña) o una tabla vacía
        public DataTable Ingresar(string nombre, string contrasena)
        {
            DataTable candidatos = BuscarParaIngreso(nombre, null);
            foreach (DataRow f in candidatos.Rows)
            {
                if (!Coincide(f, contrasena)) continue;
                DataTable r = candidatos.Clone();
                r.ImportRow(f);
                r.Columns.Remove("Contrasena");
                return r;
            }
            // Sin usuario con ese nombre se calcula igual un hash, para que la demora no lo delate
            if (candidatos.Rows.Count == 0) Contrasenas.Hashear(contrasena ?? "");
            candidatos.Clear();
            candidatos.Columns.Remove("Contrasena");
            return candidatos;
        }

        public bool VerificarContrasena(int idUsuario, string contrasena)
        {
            DataTable t = BuscarParaIngreso(null, idUsuario);
            return t.Rows.Count > 0 && Coincide(t.Rows[0], contrasena);
        }

        bool Coincide(DataRow f, string contrasena)
        {
            if (string.IsNullOrEmpty(contrasena)) return false;
            string guardada = Convert.ToString(f["Contrasena"]);
            if (guardada.StartsWith(Contrasenas.Prefijo)) return Contrasenas.Verificar(contrasena, guardada);

            // Contraseña vieja (SHA-256 sin sal): la valida el SP de siempre y, si es correcta, se migra a PBKDF2
            int id = Convert.ToInt32(f["IdUsuario"]);
            string nombre = f["NombreUsuario"] == DBNull.Value ? Convert.ToString(f["Nombre"]) : Convert.ToString(f["NombreUsuario"]);
            foreach (DataRow r in Login(nombre, contrasena).Rows)
            {
                if (Convert.ToInt32(r["IdUsuario"]) != id) continue;
                ActualizarContrasena(id, Contrasenas.Hashear(contrasena));
                return true;
            }
            return false;
        }

        DataTable BuscarParaIngreso(string nombre, int? idUsuario)
        {
            using (SqlConnection cnn = new SqlConnection(connectionString))
            {
                SqlCommand cmd = new SqlCommand("SP_Usuario_GetLogin", cnn);
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.Add("@Nombre", SqlDbType.NVarChar).Value = (object)nombre ?? DBNull.Value;
                cmd.Parameters.Add("@IdUsuario", SqlDbType.Int).Value = (object)idUsuario ?? DBNull.Value;
                SqlDataAdapter da = new SqlDataAdapter(cmd);
                DataSet ds = new DataSet();
                da.Fill(ds);
                return ds.Tables[0];
            }
        }

        public void ActualizarContrasena(int idUsuario, string hash)
        {
            using (SqlConnection cnn = new SqlConnection(connectionString))
            {
                SqlCommand cmd = new SqlCommand("SP_Usuario_UpdateContrasena", cnn);
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.Add("@IdUsuario", SqlDbType.Int).Value = idUsuario;
                cmd.Parameters.Add("@Contrasena", SqlDbType.NVarChar).Value = hash;
                cnn.Open();
                cmd.ExecuteNonQuery();
            }
        }

        // SHA-256 en SQL: solo se usa para validar y migrar contraseñas viejas
        public DataTable Login(string nombre, string contrasena)
        {
            string sql = "SP_Usuario_Login";

            using (SqlConnection cnn = new SqlConnection(connectionString))
            {
                SqlCommand cmd = new SqlCommand(sql, cnn);

                cmd.CommandType = CommandType.StoredProcedure;

                cmd.Parameters.Add("@Nombre", SqlDbType.NVarChar).Value = nombre;
                cmd.Parameters.Add("@Contrasena", SqlDbType.NVarChar).Value = contrasena;

                SqlDataAdapter da = new SqlDataAdapter(cmd);

                DataSet ds = new DataSet();

                da.Fill(ds);

                return ds.Tables[0];
            }
        }

        #endregion
    }
}