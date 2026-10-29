using System;
using System.Data;
using System.Data.SqlClient;

namespace WebApi.Models
{
    public class Consulta
    {
        #region Atributo
        string connectionString = @"Data Source=Dylan;Initial Catalog=GestionPropiedadesCondado ;Integrated Security=True";
        #endregion

        #region Propiedades
        public int IdConsulta { get; set; }
        public string Nombre { get; set; }
        public string Telefono { get; set; }
        public string Mensaje { get; set; }
        public string PropiedadInteres { get; set; }
        public DateTime Fecha { get; set; }
        #endregion

        #region Métodos

        public DataTable ListarTodos()
        {
            string sql = "SP_Consulta_GetAll";
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

        public void Guardar()
        {
            string sql = "SP_Consulta_Insert";
            using (SqlConnection cnn = new SqlConnection(connectionString))
            {
                SqlCommand cmd = new SqlCommand(sql, cnn);
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.Add("@Nombre", SqlDbType.NVarChar).Value = Nombre;
                cmd.Parameters.Add("@Telefono", SqlDbType.NVarChar).Value = Telefono;
                cmd.Parameters.Add("@Mensaje", SqlDbType.NVarChar).Value = Mensaje;
                cmd.Parameters.Add("@PropiedadInteres", SqlDbType.NVarChar).Value = (object)PropiedadInteres ?? DBNull.Value;
                cmd.Parameters.Add("@Fecha", SqlDbType.DateTime).Value = Fecha;
                cnn.Open();
                cmd.ExecuteNonQuery();
            }
        }

        #endregion
    }
}