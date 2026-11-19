using System.Configuration;
using System.Data;
using System.Data.SqlClient;

namespace WebApi.Models
{
    public class Parametro
    {
        #region Atributo
        string connectionString = ConfigurationManager.ConnectionStrings["GestionPropiedadesCondado"].ConnectionString;
        #endregion

        #region Propiedades
        public string Clave { get; set; }
        public decimal Valor { get; set; }
        #endregion

        #region Métodos

        public DataTable ListarTodos()
        {
            using (SqlConnection cnn = new SqlConnection(connectionString))
            {
                SqlCommand cmd = new SqlCommand("SP_Parametro_GetAll", cnn);
                cmd.CommandType = CommandType.StoredProcedure;
                SqlDataAdapter da = new SqlDataAdapter(cmd);
                DataSet ds = new DataSet();
                da.Fill(ds);
                return ds.Tables[0];
            }
        }

        // El procedimiento deja el valor anterior en ParametroHistorial
        public void Actualizar(int idUsuario)
        {
            using (SqlConnection cnn = new SqlConnection(connectionString))
            {
                SqlCommand cmd = new SqlCommand("SP_Parametro_Update", cnn);
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.Add("@Clave", SqlDbType.NVarChar).Value = Clave;
                cmd.Parameters.Add("@Valor", SqlDbType.Decimal).Value = Valor;
                cmd.Parameters["@Valor"].Precision = 9;
                cmd.Parameters["@Valor"].Scale = 4;
                cmd.Parameters.Add("@IdUsuario", SqlDbType.Int).Value = idUsuario;
                cnn.Open();
                cmd.ExecuteNonQuery();
            }
        }

        #endregion
    }
}
