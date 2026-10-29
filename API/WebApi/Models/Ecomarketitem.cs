using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

using System.Data;
using System.Data.SqlClient;

namespace WebApi.Models
{
    public class EcoMarketItem
    {
        #region Atributo
        string connectionString = @"Data Source=Dylan;Initial Catalog=GestionPropiedadesCondado ;Integrated Security=True";
        #endregion

        #region Propiedades
        public int IdItem { get; set; }
        public int IdUsuario { get; set; }
        public string Titulo { get; set; }
        public string Descripcion { get; set; }
        public string Categoria { get; set; }
        public decimal? Precio { get; set; }
        public bool EsGratis { get; set; }
        public string Estado { get; set; }
        public string Imagen { get; set; }
        public DateTime Fecha { get; set; }
        public string NombrePublicador { get; set; }
        #endregion

        #region Métodos
        public DataTable ListarTodos()
        {
            string sql = "SP_EcoMarket_GetAll";
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
            string sql = "SP_EcoMarket_GetById";
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

        public DataTable ListarPorUsuario()
        {
            string sql = "SP_EcoMarket_GetByUsuario";
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
            string sql = "SP_EcoMarket_Insert";
            try
            {
                using (SqlConnection cnn = new SqlConnection(connectionString))
                {
                    SqlCommand cmd = new SqlCommand(sql, cnn);
                    cmd.CommandType = CommandType.StoredProcedure;
                    cmd.Parameters.Add("@IdUsuario", SqlDbType.Int).Value = IdUsuario;
                    cmd.Parameters.Add("@Titulo", SqlDbType.NVarChar).Value = Titulo;
                    cmd.Parameters.Add("@Descripcion", SqlDbType.NVarChar, -1).Value = (object)Descripcion ?? DBNull.Value;
                    cmd.Parameters.Add("@Categoria", SqlDbType.NVarChar).Value = (object)Categoria ?? DBNull.Value;
                    cmd.Parameters.Add("@Precio", SqlDbType.Decimal).Value = (object)Precio ?? DBNull.Value;
                    cmd.Parameters.Add("@EsGratis", SqlDbType.Bit).Value = EsGratis;
                    cmd.Parameters.Add("@Imagen", SqlDbType.NVarChar, -1).Value = (object)Imagen ?? DBNull.Value;

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

        public string ActualizarEstado()
        {
            string sql = "SP_EcoMarket_UpdateEstado";
            try
            {
                using (SqlConnection cnn = new SqlConnection(connectionString))
                {
                    SqlCommand cmd = new SqlCommand(sql, cnn);
                    cmd.CommandType = CommandType.StoredProcedure;
                    cmd.Parameters.Add("@IdItem", SqlDbType.Int).Value = IdItem;
                    cmd.Parameters.Add("@Estado", SqlDbType.NVarChar).Value = Estado;

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

        public string Eliminar()
        {
            string sql = "SP_EcoMarket_Delete";
            try
            {
                using (SqlConnection cnn = new SqlConnection(connectionString))
                {
                    SqlCommand cmd = new SqlCommand(sql, cnn);
                    cmd.CommandType = CommandType.StoredProcedure;
                    cmd.Parameters.Add("@IdItem", SqlDbType.Int).Value = IdItem;

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