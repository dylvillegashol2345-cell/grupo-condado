using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

using System.Data;
using System.Data.SqlClient;

namespace WebApi.Models
{
    public class Cita
    {
        #region Atributo
        string connectionString = @"Data Source=Dylan;Initial Catalog=GestionPropiedadesCondado ;Integrated Security=True";
        #endregion

        #region Propiedades
        public int IdCita { get; set; }
        public DateTime Fecha { get; set; }
        // "HH:mm"; SQL Server lo convierte solo a TIME.
        public string Hora { get; set; }
        public string Estado { get; set; }
        public string Notas { get; set; }
        // Nombre y teléfono de quien viene a la cita (de la consulta o cargado a mano).
        public string Contacto { get; set; }
        public string Telefono { get; set; }
        public int? IdCliente { get; set; }
        public int? IdUsuario { get; set; }
        public int? IdPropiedad { get; set; }
        public int? IdConsulta { get; set; }

        #endregion

        #region Métodos

        public DataTable ListarTodos()
        {
            string sql = "SP_Cita_GetAll";
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
            string sql = "SP_Cita_GetId";
            using (SqlConnection cnn = new SqlConnection(connectionString))
            {
                SqlCommand cmd = new SqlCommand(sql, cnn);
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.Add("@IdCita", SqlDbType.Int).Value = IdCita;

                SqlDataAdapter da = new SqlDataAdapter(cmd);
                DataSet ds = new DataSet();
                da.Fill(ds);
                return ds.Tables[0];
            }
        }

        // Los mismos parámetros para alta y edición.
        void CargarParametros(SqlCommand cmd)
        {
            cmd.Parameters.Add("@Fecha", SqlDbType.Date).Value = Fecha.Date;
            cmd.Parameters.Add("@Hora", SqlDbType.NVarChar, 8).Value = (object)Hora ?? DBNull.Value;
            cmd.Parameters.Add("@Estado", SqlDbType.NVarChar, 20).Value = (object)Estado ?? "Pendiente";
            cmd.Parameters.Add("@Notas", SqlDbType.NVarChar, 500).Value = (object)Notas ?? DBNull.Value;
            cmd.Parameters.Add("@Contacto", SqlDbType.NVarChar, 150).Value = (object)Contacto ?? DBNull.Value;
            cmd.Parameters.Add("@Telefono", SqlDbType.NVarChar, 30).Value = (object)Telefono ?? DBNull.Value;
            cmd.Parameters.Add("@IdCliente", SqlDbType.Int).Value = (object)IdCliente ?? DBNull.Value;
            cmd.Parameters.Add("@IdUsuario", SqlDbType.Int).Value = (object)IdUsuario ?? DBNull.Value;
            cmd.Parameters.Add("@IdPropiedad", SqlDbType.Int).Value = (object)IdPropiedad ?? DBNull.Value;
            cmd.Parameters.Add("@IdConsulta", SqlDbType.Int).Value = (object)IdConsulta ?? DBNull.Value;
        }

        public int Guardar()
        {
            string sql = "SP_Cita_Insert";
            using (SqlConnection cnn = new SqlConnection(connectionString))
            {
                SqlCommand cmd = new SqlCommand(sql, cnn);
                cmd.CommandType = CommandType.StoredProcedure;
                CargarParametros(cmd);

                cnn.Open();
                return Convert.ToInt32(cmd.ExecuteScalar());
            }
        }


        public void Editar()
        {
            string sql = "SP_Cita_Update";
            using (SqlConnection cnn = new SqlConnection(connectionString))
            {
                SqlCommand cmd = new SqlCommand(sql, cnn);
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.Add("@IdCita", SqlDbType.Int).Value = IdCita;
                CargarParametros(cmd);

                cnn.Open();
                cmd.ExecuteNonQuery();
            }
        }

        public void Eliminar()
        {
            string sql = "SP_Cita_Delete";
            using (SqlConnection cnn = new SqlConnection(connectionString))
            {
                SqlCommand cmd = new SqlCommand(sql, cnn);
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.Add("@IdCita", SqlDbType.Int).Value = IdCita;
                cnn.Open();
                cmd.ExecuteNonQuery();
            }
        }
        #endregion
    }
}
