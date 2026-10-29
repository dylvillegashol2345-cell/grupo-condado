using System;
using System.Data;
using System.Data.SqlClient;

namespace WebApi.Models
{
    public class Cliente
    {
        #region Atributo
        string connectionString = @"Data Source=Dylan;Initial Catalog=GestionPropiedadesCondado ;Integrated Security=True";
        #endregion

        #region Propiedades
        public int IdCliente { get; set; }
        public string Nombre { get; set; }
        public string Apellido { get; set; }
        public string DNI { get; set; }
        public string Email { get; set; }
        public string Telefono { get; set; }
        public string Localidad { get; set; }
        #endregion

        #region Métodos
        public DataTable ListarTodos()
        {
            using (var cnn = new SqlConnection(connectionString))
            {
                var cmd = new SqlCommand("SP_Cliente_GetAll", cnn);
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
                var cmd = new SqlCommand("SP_Cliente_GetId", cnn);
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.Add("@IdCliente", SqlDbType.Int).Value = IdCliente;
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
                var cmd = new SqlCommand("SP_Cliente_Insert", cnn);
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.Add("@Nombre", SqlDbType.NVarChar).Value = Nombre ?? (object)DBNull.Value;
                cmd.Parameters.Add("@Apellido", SqlDbType.NVarChar).Value = Apellido ?? (object)DBNull.Value;
                cmd.Parameters.Add("@DNI", SqlDbType.NVarChar).Value = DNI ?? (object)DBNull.Value;
                cmd.Parameters.Add("@Email", SqlDbType.NVarChar).Value = Email ?? (object)DBNull.Value;
                cmd.Parameters.Add("@Telefono", SqlDbType.NVarChar).Value = Telefono ?? (object)DBNull.Value;
                cmd.Parameters.Add("@Localidad", SqlDbType.NVarChar).Value = Localidad ?? (object)DBNull.Value;
                cnn.Open();
                cmd.ExecuteNonQuery();
            }
        }

        public void Editar()
        {
            using (var cnn = new SqlConnection(connectionString))
            {
                var cmd = new SqlCommand("SP_Cliente_Update", cnn);
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.Add("@IdCliente", SqlDbType.Int).Value = IdCliente;
                cmd.Parameters.Add("@Nombre", SqlDbType.NVarChar).Value = Nombre ?? (object)DBNull.Value;
                cmd.Parameters.Add("@Apellido", SqlDbType.NVarChar).Value = Apellido ?? (object)DBNull.Value;
                cmd.Parameters.Add("@DNI", SqlDbType.NVarChar).Value = DNI ?? (object)DBNull.Value;
                cmd.Parameters.Add("@Email", SqlDbType.NVarChar).Value = Email ?? (object)DBNull.Value;
                cmd.Parameters.Add("@Telefono", SqlDbType.NVarChar).Value = Telefono ?? (object)DBNull.Value;
                cmd.Parameters.Add("@Localidad", SqlDbType.NVarChar).Value = Localidad ?? (object)DBNull.Value;
                cnn.Open();
                cmd.ExecuteNonQuery();
            }
        }

        public void Eliminar()
        {
            using (var cnn = new SqlConnection(connectionString))
            {
                var cmd = new SqlCommand("SP_Cliente_Delete", cnn);
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.Add("@IdCliente", SqlDbType.Int).Value = IdCliente;
                cnn.Open();
                cmd.ExecuteNonQuery();
            }
        }
        #endregion
    }
}