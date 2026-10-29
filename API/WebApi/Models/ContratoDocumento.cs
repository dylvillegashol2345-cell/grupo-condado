using System.Data;
using System.Data.SqlClient;

namespace WebApi.Models
{
    public class ContratoDocumento
    {
        #region Atributo
        string connectionString = @"Data Source=Dylan;Initial Catalog=GestionPropiedadesCondado ;Integrated Security=True";
        #endregion

        #region Propiedades
        public int IdContrato { get; set; }
        public string Datos { get; set; }
        #endregion

        #region Metodos

        public DataTable ListarPorId()
        {
            using (SqlConnection cnn = new SqlConnection(connectionString))
            {
                SqlCommand cmd = new SqlCommand("SP_ContratoDocumento_GetId", cnn);
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.Add("@IdContrato", SqlDbType.Int).Value = IdContrato;

                SqlDataAdapter da = new SqlDataAdapter(cmd);
                DataSet ds = new DataSet();
                da.Fill(ds);
                return ds.Tables[0];
            }
        }

        public void Guardar()
        {
            using (SqlConnection cnn = new SqlConnection(connectionString))
            {
                SqlCommand cmd = new SqlCommand("SP_ContratoDocumento_Guardar", cnn);
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.Add("@IdContrato", SqlDbType.Int).Value = IdContrato;
                cmd.Parameters.Add("@Datos", SqlDbType.NVarChar, -1).Value = Datos;

                cnn.Open();
                cmd.ExecuteNonQuery();
            }
        }

        #endregion
    }
}
