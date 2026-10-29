using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

using System.Data;
using System.Data.SqlClient;

namespace WebApi.Models
{
    public class EcoMarketContacto
    {
        #region Atributo
        string connectionString = @"Data Source=Dylan;Initial Catalog=GestionPropiedadesCondado ;Integrated Security=True";
        #endregion

        #region Propiedades
        public int IdContacto { get; set; }
        public int IdItem { get; set; }
        public string Nombre { get; set; }
        public string Telefono { get; set; }
        public string Mensaje { get; set; }
        public DateTime Fecha { get; set; }
        // Usuario logueado que envió el contacto (NULL si fue anónimo).
        // Permite armar la bandeja "Mis mensajes" del interesado.
        public int? IdUsuarioRemitente { get; set; }
        #endregion

        #region Métodos
        public DataTable Listar()
        {
            string sql = "SP_EcoMarketContacto_GetAll";
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

        public DataTable ListarPorItem()
        {
            string sql = "SP_EcoMarketContacto_GetByItem";
            using (SqlConnection cnn = new SqlConnection(connectionString))
            {
                SqlCommand cmd = new SqlCommand(sql, cnn);
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.Add("@IdItem", SqlDbType.Int).Value = IdItem;

                SqlDataAdapter da = new SqlDataAdapter(cmd);
                DataSet ds = new DataSet();
                da.Fill(ds);
                return ds.Tables[0];
            }
        }

        public string Guardar()
        {
            string sql = "SP_EcoMarketContacto_Insert";
            try
            {
                using (SqlConnection cnn = new SqlConnection(connectionString))
                {
                    SqlCommand cmd = new SqlCommand(sql, cnn);
                    cmd.CommandType = CommandType.StoredProcedure;
                    cmd.Parameters.Add("@IdItem", SqlDbType.Int).Value = IdItem;
                    cmd.Parameters.Add("@Nombre", SqlDbType.NVarChar).Value = Nombre;
                    cmd.Parameters.Add("@Telefono", SqlDbType.NVarChar).Value = (object)Telefono ?? DBNull.Value;
                    cmd.Parameters.Add("@Mensaje", SqlDbType.NVarChar, -1).Value = (object)Mensaje ?? DBNull.Value;
                    cmd.Parameters.Add("@IdUsuarioRemitente", SqlDbType.Int).Value =
                        (IdUsuarioRemitente.HasValue && IdUsuarioRemitente.Value > 0) ? (object)IdUsuarioRemitente.Value : DBNull.Value;

                    cnn.Open();
                    cmd.ExecuteNonQuery();
                    return "OK";
                }
            }
            catch (Exception ex)
            {
                return "ERROR: " + ex.Message;
            }
        }
        #endregion
    }
}
