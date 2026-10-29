using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

using System.Data;
using System.Data.SqlClient;

namespace WebApi.Models
{
    public class Operacion
    {
        #region Atributo
        string connectionString = @"Data Source=Dylan;Initial Catalog=GestionPropiedadesCondado ;Integrated Security=True";
        #endregion

        #region Propiedades
        public int IdOperacion { get; set; }
        public string Tipo { get; set; }
        public DateTime Fecha { get; set; }
        public int IdCliente { get; set; }
        public int IdPropiedad { get; set; }
        public int IdUsuario { get; set; }
        #endregion

        #region Métodos
        public DataTable ListarTodos()
        {
            string sql = "SP_Operacion_GetAll";
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
            string sql = "SP_Operacion_GetId";
            using (SqlConnection cnn = new SqlConnection(connectionString))
            {
                SqlCommand cmd = new SqlCommand(sql, cnn);
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.Add("@IdOperacion", SqlDbType.Int).Value = IdOperacion;

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
                string sql = "SP_Operacion_Insert";
                using (SqlConnection cnn = new SqlConnection(connectionString))
                {
                    SqlCommand cmd = new SqlCommand(sql, cnn);
                    cmd.CommandType = CommandType.StoredProcedure;

                    cmd.Parameters.Add("@Tipo", SqlDbType.NVarChar).Value = Tipo;
                    cmd.Parameters.Add("@Fecha", SqlDbType.DateTime).Value = Fecha;
                    cmd.Parameters.Add("@IdCliente", SqlDbType.Int).Value = IdCliente;
                    cmd.Parameters.Add("@IdPropiedad", SqlDbType.Int).Value = IdPropiedad;
                    cmd.Parameters.Add("@IdUsuario", SqlDbType.Int).Value = IdUsuario;

                    cnn.Open();
                    cmd.ExecuteNonQuery();
                    return "OK";
                }
            }
            catch (Exception ex)
            {
                return ex.Message;

            }
        }

    public string RegistrarOperacion()
        {
            string resultado = "";

            string sql = "SP_Operacion_Registrar";

            using (SqlConnection cnn = new SqlConnection(connectionString))
            {
                SqlCommand cmd = new SqlCommand(sql, cnn);

                cmd.CommandType = CommandType.StoredProcedure;

                cmd.Parameters.Add("@Tipo", SqlDbType.NVarChar).Value = Tipo;
                cmd.Parameters.Add("@IdCliente", SqlDbType.Int).Value = IdCliente;
                cmd.Parameters.Add("@IdPropiedad", SqlDbType.Int).Value = IdPropiedad;
                cmd.Parameters.Add("@IdUsuario", SqlDbType.Int).Value = IdUsuario;

                SqlParameter output =
                    new SqlParameter("@Resultado", SqlDbType.NVarChar, 200);

                output.Direction = ParameterDirection.Output;

                cmd.Parameters.Add(output);

                cnn.Open();

                cmd.ExecuteNonQuery();

                resultado = output.Value.ToString();
            }

            return resultado;
        }

        public void Editar()
        {
            string sql = "SP_Operacion_Update";
            using (SqlConnection cnn = new SqlConnection(connectionString))
            {
                SqlCommand cmd = new SqlCommand(sql, cnn);
                cmd.CommandType = CommandType.StoredProcedure;

                cmd.Parameters.Add("@IdOperacion", SqlDbType.Int).Value = IdOperacion;
                cmd.Parameters.Add("@Tipo", SqlDbType.NVarChar).Value = Tipo;
                cmd.Parameters.Add("@Fecha", SqlDbType.DateTime).Value = Fecha;
                cmd.Parameters.Add("@IdCliente", SqlDbType.Int).Value = IdCliente;
                cmd.Parameters.Add("@IdPropiedad", SqlDbType.Int).Value = IdPropiedad;
                cmd.Parameters.Add("@IdUsuario", SqlDbType.Int).Value = IdUsuario;

                cnn.Open();
                cmd.ExecuteNonQuery();
            }
        }

        public void Eliminar()
        {
            string sql = "SP_Operacion_Delete";
            using (SqlConnection cnn = new SqlConnection(connectionString))
            {
                SqlCommand cmd = new SqlCommand(sql, cnn);
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.Add("@IdOperacion", SqlDbType.Int).Value = IdOperacion;

                cnn.Open();
                cmd.ExecuteNonQuery();
            }
        }
        #endregion
    }
}