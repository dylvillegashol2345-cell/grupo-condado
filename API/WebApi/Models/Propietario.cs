using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

using System.Data;
using System.Data.SqlClient;

namespace WebApi.Models
{
    public class Propietario
    {
        #region Atributo
        string connectionString = @"Data Source=Dylan;Initial Catalog=GestionPropiedadesCondado ;Integrated Security=True";
        #endregion

        #region Propiedades
        public int IdPropietario { get; set; }
        // Documento como texto: la tabla lo guarda NVARCHAR(20) y un CUIT (11 dígitos)
        // no entra en un int. TipoDocumento: DNI / CUIL / CUIT / Pasaporte.
        public string DNI { get; set; }
        public string TipoDocumento { get; set; }
        public string Apellido { get; set; }
        public string Nombre { get; set; }
        public string Email { get; set; }
        public string Calle { get; set; }
        public string Numeracion { get; set; }
        public string Localidad { get; set; }
        #endregion

        #region Métodos

        public DataTable ListarTodos()
        {
            string sql = "SP_Propietario_GetAll";
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
            string sql = "SP_Propietario_GetId";
            using (SqlConnection cnn = new SqlConnection(connectionString))
            {
                SqlCommand cmd = new SqlCommand(sql, cnn);
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.Add("@IdPropietario", SqlDbType.Int).Value = IdPropietario;

                SqlDataAdapter da = new SqlDataAdapter(cmd);
                DataSet ds = new DataSet();
                da.Fill(ds);
                return ds.Tables[0];
            }
        }

        public void Guardar()
        {
            string sql = "SP_Propietario_Insert";
            using (SqlConnection cnn = new SqlConnection(connectionString))
            {
                SqlCommand cmd = new SqlCommand(sql, cnn);
                cmd.CommandType = CommandType.StoredProcedure;

                cmd.Parameters.Add("@DNI", SqlDbType.NVarChar, 20).Value = (object)DNI ?? DBNull.Value;
                cmd.Parameters.Add("@TipoDocumento", SqlDbType.NVarChar, 20).Value = string.IsNullOrEmpty(TipoDocumento) ? "DNI" : TipoDocumento;
                cmd.Parameters.Add("@Apellido", SqlDbType.NVarChar).Value = Apellido;
                cmd.Parameters.Add("@Nombre", SqlDbType.NVarChar).Value = Nombre;
                cmd.Parameters.Add("@Email", SqlDbType.NVarChar).Value = Email;
                cmd.Parameters.Add("@Calle", SqlDbType.NVarChar).Value = Calle;
                cmd.Parameters.Add("@Numeracion", SqlDbType.NVarChar).Value = Numeracion;
                cmd.Parameters.Add("@Localidad", SqlDbType.NVarChar).Value = Localidad;

                cnn.Open();
                cmd.ExecuteNonQuery();
            }
        }


        public void Editar()
        {
            string sql = "SP_Propietario_Update";
            using (SqlConnection cnn = new SqlConnection(connectionString))
            {
                SqlCommand cmd = new SqlCommand(sql, cnn);
                cmd.CommandType = CommandType.StoredProcedure;

                cmd.Parameters.Add("@IdPropietario", SqlDbType.Int).Value = IdPropietario;
                cmd.Parameters.Add("@DNI", SqlDbType.NVarChar, 20).Value = (object)DNI ?? DBNull.Value;
                cmd.Parameters.Add("@TipoDocumento", SqlDbType.NVarChar, 20).Value = string.IsNullOrEmpty(TipoDocumento) ? "DNI" : TipoDocumento;
                cmd.Parameters.Add("@Apellido", SqlDbType.NVarChar).Value = Apellido;
                cmd.Parameters.Add("@Nombre", SqlDbType.NVarChar).Value = Nombre;
                cmd.Parameters.Add("@Email", SqlDbType.NVarChar).Value = Email;
                cmd.Parameters.Add("@Calle", SqlDbType.NVarChar).Value = Calle;
                cmd.Parameters.Add("@Numeracion", SqlDbType.NVarChar).Value = Numeracion;
                cmd.Parameters.Add("@Localidad", SqlDbType.NVarChar).Value = Localidad;

                cnn.Open();
                cmd.ExecuteNonQuery();
            }
        }

        public void Eliminar()
        {
            string sql = "SP_Propietario_Delete";
            using (SqlConnection cnn = new SqlConnection(connectionString))
            {
                SqlCommand cmd = new SqlCommand(sql, cnn);
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.Add("@IdPropietario", SqlDbType.Int).Value = IdPropietario;
                cnn.Open();
                cmd.ExecuteNonQuery();
            }
        }

        #endregion
    }
}