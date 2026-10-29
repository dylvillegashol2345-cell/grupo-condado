using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

using System.Data;
using System.Data.SqlClient;

namespace WebApi.Models
{
    public class Usuario
    {
        #region Atributo
        string connectionString = @"Data Source=Dylan;Initial Catalog=GestionPropiedadesCondado ;Integrated Security=True";
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
            string sql = "SP_Propietario_Delete";
            using (SqlConnection cnn = new SqlConnection(connectionString))
            {
                SqlCommand cmd = new SqlCommand(sql, cnn);
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.Add("@IdUsuario", SqlDbType.Int).Value = IdUsuario;
                cnn.Open();
                cmd.ExecuteNonQuery();
            }
        }

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