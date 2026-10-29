using System;
using System.Data;
using System.Data.SqlClient;

namespace WebApi.Models
{
    public class EcoMarketMensaje
    {
        #region Atributos
        string connectionString = @"Data Source=Dylan;Initial Catalog=GestionPropiedadesCondado ;Integrated Security=True";
        #endregion

        #region Propiedades
        public int IdMensaje { get; set; }
        public int IdContacto { get; set; }
        public int IdUsuario { get; set; }
        public string Texto { get; set; }
        public DateTime Fecha { get; set; }
        public bool Leido { get; set; }
        public string NombreUsuario { get; set; }
        #endregion

        #region Métodos

        public DataTable ListarPorContacto()
        {
            using (SqlConnection cnn = new SqlConnection(connectionString))
            {
                SqlCommand cmd = new SqlCommand("SP_EcoMarketMensaje_GetByContacto", cnn);
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.Add("@IdContacto", SqlDbType.Int).Value = IdContacto;
                SqlDataAdapter da = new SqlDataAdapter(cmd);
                DataSet ds = new DataSet();
                da.Fill(ds);
                return ds.Tables[0];
            }
        }

        public string Guardar()
        {
            try
            {
                using (SqlConnection cnn = new SqlConnection(connectionString))
                {
                    SqlCommand cmd = new SqlCommand("SP_EcoMarketMensaje_Insert", cnn);
                    cmd.CommandType = CommandType.StoredProcedure;
                    cmd.Parameters.Add("@IdContacto", SqlDbType.Int).Value = IdContacto;
                    cmd.Parameters.Add("@IdUsuario", SqlDbType.Int).Value = IdUsuario;
                    cmd.Parameters.Add("@Texto", SqlDbType.NVarChar, 1000).Value = Texto;
                    cnn.Open();
                    cmd.ExecuteNonQuery();
                    return "OK";
                }
            }
            catch (Exception ex) { return "ERROR: " + ex.Message; }
        }

        public string MarcarLeido()
        {
            try
            {
                using (SqlConnection cnn = new SqlConnection(connectionString))
                {
                    SqlCommand cmd = new SqlCommand("SP_EcoMarketMensaje_MarcarLeido", cnn);
                    cmd.CommandType = CommandType.StoredProcedure;
                    cmd.Parameters.Add("@IdContacto", SqlDbType.Int).Value = IdContacto;
                    cmd.Parameters.Add("@IdUsuario", SqlDbType.Int).Value = IdUsuario;
                    cnn.Open();
                    cmd.ExecuteNonQuery();
                    return "OK";
                }
            }
            catch (Exception ex) { return "ERROR: " + ex.Message; }
        }

        #endregion
    }
}