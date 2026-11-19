using System;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.Security.Cryptography;
using System.Text;

namespace WebApi.Models
{
    public class Sesion
    {
        #region Atributo
        string connectionString = ConfigurationManager.ConnectionStrings["GestionPropiedadesCondado"].ConnectionString;
        public const int HorasDeVigencia = 8;
        #endregion

        #region Propiedades
        public int IdUsuario { get; set; }
        public string Rol { get; set; }
        #endregion

        #region Métodos

        // En la base se guarda solo el SHA-256 del token
        static byte[] Hash(string token)
        {
            using (var sha = SHA256.Create())
                return sha.ComputeHash(Encoding.UTF8.GetBytes(token));
        }

        public string Crear(int idUsuario)
        {
            var bytes = new byte[32];
            using (var rng = RandomNumberGenerator.Create()) rng.GetBytes(bytes);
            string token = Convert.ToBase64String(bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_');

            using (SqlConnection cnn = new SqlConnection(connectionString))
            {
                SqlCommand cmd = new SqlCommand("SP_Sesion_Insert", cnn);
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.Add("@IdUsuario", SqlDbType.Int).Value = idUsuario;
                cmd.Parameters.Add("@TokenHash", SqlDbType.VarBinary, 32).Value = Hash(token);
                cmd.Parameters.Add("@Horas", SqlDbType.Int).Value = HorasDeVigencia;
                cnn.Open();
                cmd.ExecuteNonQuery();
            }
            return token;
        }

        // Devuelve el usuario y su rol actual, o null si el token no existe, venció o se revocó
        public Sesion Validar(string token)
        {
            using (SqlConnection cnn = new SqlConnection(connectionString))
            {
                SqlCommand cmd = new SqlCommand("SP_Sesion_Validar", cnn);
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.Add("@TokenHash", SqlDbType.VarBinary, 32).Value = Hash(token);
                cnn.Open();
                using (SqlDataReader dr = cmd.ExecuteReader())
                {
                    if (!dr.Read()) return null;
                    return new Sesion { IdUsuario = dr.GetInt32(0), Rol = dr.GetString(1) };
                }
            }
        }

        public void Revocar(string token)
        {
            using (SqlConnection cnn = new SqlConnection(connectionString))
            {
                SqlCommand cmd = new SqlCommand("SP_Sesion_Revocar", cnn);
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.Add("@TokenHash", SqlDbType.VarBinary, 32).Value = Hash(token);
                cnn.Open();
                cmd.ExecuteNonQuery();
            }
        }

        // 0 si el usuario no tiene un cliente con su email
        public int IdClienteDelUsuario(int idUsuario)
        {
            using (SqlConnection cnn = new SqlConnection(connectionString))
            {
                SqlCommand cmd = new SqlCommand("SP_Cliente_DelUsuario", cnn);
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.Add("@IdUsuario", SqlDbType.Int).Value = idUsuario;
                cnn.Open();
                object id = cmd.ExecuteScalar();
                return id == null || id == DBNull.Value ? 0 : Convert.ToInt32(id);
            }
        }

        #endregion
    }
}
