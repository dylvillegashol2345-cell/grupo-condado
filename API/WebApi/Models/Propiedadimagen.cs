using System;
using System.Data;
using System.Data.SqlClient;

namespace WebApi.Models
{
    public class PropiedadImagen
    {
        string connectionString = @"Data Source=Dylan;Initial Catalog=GestionPropiedadesCondado ;Integrated Security=True";

        public int IdImagen { get; set; }
        public int IdPropiedad { get; set; }
        public string Url { get; set; }
        public int Orden { get; set; }
        public bool EsPrincipal { get; set; }

        public DataTable ListarPorPropiedad()
        {
            using (var cnn = new SqlConnection(connectionString))
            {
                var cmd = new SqlCommand("SP_PropiedadImagen_GetAll", cnn);
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.Add("@IdPropiedad", SqlDbType.Int).Value = IdPropiedad;
                var da = new SqlDataAdapter(cmd);
                var ds = new DataSet();
                da.Fill(ds);
                return ds.Tables[0];
            }
        }

        public string Guardar()
        {
            try
            {
                using (var cnn = new SqlConnection(connectionString))
                {
                    var cmd = new SqlCommand("SP_PropiedadImagen_Insert", cnn);
                    cmd.CommandType = CommandType.StoredProcedure;
                    cmd.Parameters.Add("@IdPropiedad", SqlDbType.Int).Value = IdPropiedad;
                    cmd.Parameters.Add("@Url", SqlDbType.NVarChar, -1).Value = Url ?? "";
                    cmd.Parameters.Add("@Orden", SqlDbType.Int).Value = Orden;
                    cmd.Parameters.Add("@EsPrincipal", SqlDbType.Bit).Value = EsPrincipal;
                    cnn.Open();
                    cmd.ExecuteNonQuery();
                    return "OK";
                }
            }
            catch (Exception ex) { return "ERROR: " + ex.Message; }
        }

        public string Eliminar()
        {
            try
            {
                using (var cnn = new SqlConnection(connectionString))
                {
                    var cmd = new SqlCommand("SP_PropiedadImagen_Delete", cnn);
                    cmd.CommandType = CommandType.StoredProcedure;
                    cmd.Parameters.Add("@IdImagen", SqlDbType.Int).Value = IdImagen;
                    cnn.Open();
                    cmd.ExecuteNonQuery();
                    return "OK";
                }
            }
            catch (Exception ex) { return "ERROR: " + ex.Message; }
        }

        public string EliminarTodas()
        {
            try
            {
                using (var cnn = new SqlConnection(connectionString))
                {
                    var cmd = new SqlCommand("SP_PropiedadImagen_DeleteAll", cnn);
                    cmd.CommandType = CommandType.StoredProcedure;
                    cmd.Parameters.Add("@IdPropiedad", SqlDbType.Int).Value = IdPropiedad;
                    cnn.Open();
                    cmd.ExecuteNonQuery();
                    return "OK";
                }
            }
            catch (Exception ex) { return "ERROR: " + ex.Message; }
        }

        public string SetPrincipal()
        {
            try
            {
                using (var cnn = new SqlConnection(connectionString))
                {
                    var cmd = new SqlCommand("SP_PropiedadImagen_SetPrincipal", cnn);
                    cmd.CommandType = CommandType.StoredProcedure;
                    cmd.Parameters.Add("@IdImagen", SqlDbType.Int).Value = IdImagen;
                    cmd.Parameters.Add("@IdPropiedad", SqlDbType.Int).Value = IdPropiedad;
                    cnn.Open();
                    cmd.ExecuteNonQuery();
                    return "OK";
                }
            }
            catch (Exception ex) { return "ERROR: " + ex.Message; }
        }
    }
}