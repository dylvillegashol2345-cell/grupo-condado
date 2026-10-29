using System;
using System.Data;
using System.Data.SqlClient;

namespace WebApi.Models
{
    public class Pago
    {
        #region Atributo
        string connectionString = @"Data Source=Dylan;Initial Catalog=GestionPropiedadesCondado ;Integrated Security=True";
        #endregion

        #region Propiedades
        public int IdPago { get; set; }
        public decimal Monto { get; set; }
        public string Fecha { get; set; }
        public int IdContrato { get; set; }
        public string Moneda { get; set; } = "ARS";
        #endregion

        #region Métodos
        public DataTable ListarTodos()
        {
            using (var cnn = new SqlConnection(connectionString))
            {
                var cmd = new SqlCommand("SP_Pago_GetAll", cnn);
                cmd.CommandType = CommandType.StoredProcedure;
                var da = new SqlDataAdapter(cmd);
                var ds = new DataSet();
                da.Fill(ds);
                return ds.Tables[0];
            }
        }

        public DataTable ListarPorId()
        {
            using (var cnn = new SqlConnection(connectionString))
            {
                var cmd = new SqlCommand("SP_Pago_GetId", cnn);
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.Add("@IdPago", SqlDbType.Int).Value = IdPago;
                var da = new SqlDataAdapter(cmd);
                var ds = new DataSet();
                da.Fill(ds);
                return ds.Tables[0];
            }
        }

        public void Guardar()
        {
            using (var cnn = new SqlConnection(connectionString))
            {
                var cmd = new SqlCommand("SP_Pago_Insert", cnn);
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.Add("@Monto", SqlDbType.Decimal).Value = Monto;
                cmd.Parameters.Add("@Fecha", SqlDbType.Date).Value = DateTime.Parse(Fecha);
                cmd.Parameters.Add("@IdContrato", SqlDbType.Int).Value = IdContrato;
                cmd.Parameters.Add("@Moneda", SqlDbType.NVarChar).Value = Moneda ?? "ARS";
                cnn.Open();
                cmd.ExecuteNonQuery();
            }
        }

        public void Editar()
        {
            using (var cnn = new SqlConnection(connectionString))
            {
                var cmd = new SqlCommand("SP_Pago_Update", cnn);
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.Add("@IdPago", SqlDbType.Int).Value = IdPago;
                cmd.Parameters.Add("@Monto", SqlDbType.Decimal).Value = Monto;
                cmd.Parameters.Add("@Fecha", SqlDbType.Date).Value = DateTime.Parse(Fecha);
                cmd.Parameters.Add("@IdContrato", SqlDbType.Int).Value = IdContrato;
                cmd.Parameters.Add("@Moneda", SqlDbType.NVarChar).Value = Moneda ?? "ARS";
                cnn.Open();
                cmd.ExecuteNonQuery();
            }
        }

        public void Eliminar()
        {
            using (var cnn = new SqlConnection(connectionString))
            {
                var cmd = new SqlCommand("SP_Pago_Delete", cnn);
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.Add("@IdPago", SqlDbType.Int).Value = IdPago;
                cnn.Open();
                cmd.ExecuteNonQuery();
            }
        }
        #endregion
    }
}