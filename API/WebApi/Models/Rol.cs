using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

using System.Data;
using System.Data.SqlClient;

namespace WebApi.Models
{
    public class Rol
    {
        #region Atributo
        string connectionString = @"Data Source=Dylan;Initial Catalog=GestionPropiedadesCondado ;Integrated Security=True";
        #endregion

        #region Propiedades
        public int IdRol { get; set; }
        public string Nombre { get; set; }
        #endregion

        #region Métodos

        public DataTable ListarTodos()
        {
            string sql = "SP_Rol_GetAll";
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
            string sql = "SP_Rol_GetId";
            using (SqlConnection cnn = new SqlConnection(connectionString))
            {
                SqlCommand cmd = new SqlCommand(sql, cnn);
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.Add("@IdPropietario", SqlDbType.Int).Value = IdRol;

                SqlDataAdapter da = new SqlDataAdapter(cmd);
                DataSet ds = new DataSet();
                da.Fill(ds);
                return ds.Tables[0];
            }
        }

        public void Guardar()
        {
            string sql = "SP_Rol_Insert";
            using (SqlConnection cnn = new SqlConnection(connectionString))
            {
                SqlCommand cmd = new SqlCommand(sql, cnn);
                cmd.CommandType = CommandType.StoredProcedure;

                cmd.Parameters.Add("@Nombre", SqlDbType.NVarChar).Value = Nombre;

                cnn.Open();
                cmd.ExecuteNonQuery();
            }
        }


        public void Editar()
        {
            string sql = "SP_Rol_Update";
            using (SqlConnection cnn = new SqlConnection(connectionString))
            {
                SqlCommand cmd = new SqlCommand(sql, cnn);
                cmd.CommandType = CommandType.StoredProcedure;

                cmd.Parameters.Add("@IdUsuario", SqlDbType.Int).Value = IdRol;
                cmd.Parameters.Add("@Nombre", SqlDbType.NVarChar).Value = Nombre;

                cnn.Open();
                cmd.ExecuteNonQuery();
            }
        }

        public void Eliminar()
        {
            string sql = "SP_Rol_Delete";
            using (SqlConnection cnn = new SqlConnection(connectionString))
            {
                SqlCommand cmd = new SqlCommand(sql, cnn);
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.Add("@IdRol", SqlDbType.Int).Value = IdRol;
                cnn.Open();
                cmd.ExecuteNonQuery();
            }
        }

        #endregion
    }
}