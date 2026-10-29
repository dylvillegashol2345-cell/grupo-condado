using System;
using System.Data;
using System.Data.SqlClient;

namespace WebApi.Models
{
    public class Propiedad
    {
        #region Atributo
        string connectionString = @"Data Source=Dylan;Initial Catalog=GestionPropiedadesCondado ;Integrated Security=True";
        #endregion

        #region Propiedades
        public int IdPropiedad { get; set; }
        public int? IdPropietario { get; set; }
        public string Barrio { get; set; }
        public string Calle { get; set; }
        public string Numeracion { get; set; }
        public string Piso { get; set; }
        public string NroDepto { get; set; }
        public int IdTipo { get; set; }
        public int IdLocalidad { get; set; }
        public decimal Precio { get; set; }
        public decimal Superficie { get; set; }
        public string Descripcion { get; set; }
        public string Estado { get; set; }
        public bool PanelesSolares { get; set; }
        public bool AislamientoTermico { get; set; }
        public string CategoriaEco { get; set; }
        public decimal Bonificacion { get; set; }
        public bool MatriculaVerificada { get; set; }
        public bool TituloPropiedad { get; set; }
        public string ArchivoMatricula { get; set; }
        public string ArchivoTitulo { get; set; }
        public bool Publicada { get; set; }
        public string Imagen { get; set; }
        public string Servicios { get; set; }
        public string Moneda { get; set; } = "ARS";
        // Imagen equirectangular para el recorrido virtual 360
        public string Tour360 { get; set; }
        #endregion

        #region Métodos
        public DataTable ListarTodos()
        {
            using (var cnn = new SqlConnection(connectionString))
            {
                var cmd = new SqlCommand("SP_Propiedad_GetAll", cnn);
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
                var cmd = new SqlCommand("SP_Propiedad_GetId", cnn);
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.Add("@IdPropiedad", SqlDbType.Int).Value = IdPropiedad;
                var da = new SqlDataAdapter(cmd);
                var ds = new DataSet();
                da.Fill(ds);
                return ds.Tables[0];
            }
        }

        public int Guardar()
        {
            using (var cnn = new SqlConnection(connectionString))
            {
                var cmd = new SqlCommand("SP_Propiedad_Insert", cnn);
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.Add("@IdPropietario", SqlDbType.Int).Value = (IdPropietario.HasValue && IdPropietario.Value > 0) ? (object)IdPropietario.Value : DBNull.Value;
                cmd.Parameters.Add("@Barrio", SqlDbType.NVarChar).Value = Barrio ?? "";
                cmd.Parameters.Add("@Calle", SqlDbType.NVarChar).Value = Calle ?? "";
                cmd.Parameters.Add("@Numeracion", SqlDbType.NVarChar).Value = Numeracion ?? "";
                cmd.Parameters.Add("@Piso", SqlDbType.NVarChar).Value = (object)Piso ?? DBNull.Value;
                cmd.Parameters.Add("@NroDepto", SqlDbType.NVarChar).Value = (object)NroDepto ?? DBNull.Value;
                cmd.Parameters.Add("@IdTipo", SqlDbType.Int).Value = IdTipo;
                cmd.Parameters.Add("@IdLocalidad", SqlDbType.Int).Value = IdLocalidad;
                cmd.Parameters.Add("@Precio", SqlDbType.Decimal).Value = Precio;
                cmd.Parameters.Add("@Superficie", SqlDbType.Decimal).Value = Superficie;
                cmd.Parameters.Add("@Descripcion", SqlDbType.NVarChar).Value = Descripcion ?? "";
                cmd.Parameters.Add("@Estado", SqlDbType.NVarChar).Value = Estado ?? "Disponible";
                cmd.Parameters.Add("@PanelesSolares", SqlDbType.Bit).Value = PanelesSolares;
                cmd.Parameters.Add("@AislamientoTermico", SqlDbType.Bit).Value = AislamientoTermico;
                cmd.Parameters.Add("@CategoriaEco", SqlDbType.NVarChar).Value = CategoriaEco ?? "C";
                cmd.Parameters.Add("@Bonificacion", SqlDbType.Decimal).Value = Bonificacion;
                cmd.Parameters.Add("@MatriculaVerificada", SqlDbType.Bit).Value = MatriculaVerificada;
                cmd.Parameters.Add("@TituloPropiedad", SqlDbType.Bit).Value = TituloPropiedad;
                cmd.Parameters.Add("@ArchivoMatricula", SqlDbType.NVarChar, -1).Value = (object)ArchivoMatricula ?? DBNull.Value;
                cmd.Parameters.Add("@ArchivoTitulo", SqlDbType.NVarChar, -1).Value = (object)ArchivoTitulo ?? DBNull.Value;
                cmd.Parameters.Add("@Publicada", SqlDbType.Bit).Value = Publicada;
                cmd.Parameters.Add("@Imagen", SqlDbType.NVarChar, -1).Value = (object)Imagen ?? DBNull.Value;
                cmd.Parameters.Add("@Servicios", SqlDbType.NVarChar).Value = (object)Servicios ?? DBNull.Value;
                cmd.Parameters.Add("@Moneda", SqlDbType.NVarChar).Value = Moneda ?? "ARS";
                cmd.Parameters.Add("@Tour360", SqlDbType.NVarChar, -1).Value = (object)Tour360 ?? DBNull.Value;
                cnn.Open();
                var resultado = cmd.ExecuteScalar();
                return resultado != null ? Convert.ToInt32(resultado) : 0;
            }
        }

        public void Editar()
        {
            using (var cnn = new SqlConnection(connectionString))
            {
                var cmd = new SqlCommand("SP_Propiedad_Update", cnn);
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.Add("@IdPropiedad", SqlDbType.Int).Value = IdPropiedad;
                cmd.Parameters.Add("@IdPropietario", SqlDbType.Int).Value = (IdPropietario.HasValue && IdPropietario.Value > 0) ? (object)IdPropietario.Value : DBNull.Value;
                cmd.Parameters.Add("@Barrio", SqlDbType.NVarChar).Value = Barrio ?? "";
                cmd.Parameters.Add("@Calle", SqlDbType.NVarChar).Value = Calle ?? "";
                cmd.Parameters.Add("@Numeracion", SqlDbType.NVarChar).Value = Numeracion ?? "";
                cmd.Parameters.Add("@Piso", SqlDbType.NVarChar).Value = (object)Piso ?? DBNull.Value;
                cmd.Parameters.Add("@NroDepto", SqlDbType.NVarChar).Value = (object)NroDepto ?? DBNull.Value;
                cmd.Parameters.Add("@IdTipo", SqlDbType.Int).Value = IdTipo;
                cmd.Parameters.Add("@IdLocalidad", SqlDbType.Int).Value = IdLocalidad;
                cmd.Parameters.Add("@Precio", SqlDbType.Decimal).Value = Precio;
                cmd.Parameters.Add("@Superficie", SqlDbType.Decimal).Value = Superficie;
                cmd.Parameters.Add("@Descripcion", SqlDbType.NVarChar).Value = Descripcion ?? "";
                cmd.Parameters.Add("@Estado", SqlDbType.NVarChar).Value = Estado ?? "Disponible";
                cmd.Parameters.Add("@PanelesSolares", SqlDbType.Bit).Value = PanelesSolares;
                cmd.Parameters.Add("@AislamientoTermico", SqlDbType.Bit).Value = AislamientoTermico;
                cmd.Parameters.Add("@CategoriaEco", SqlDbType.NVarChar).Value = CategoriaEco ?? "C";
                cmd.Parameters.Add("@Bonificacion", SqlDbType.Decimal).Value = Bonificacion;
                cmd.Parameters.Add("@MatriculaVerificada", SqlDbType.Bit).Value = MatriculaVerificada;
                cmd.Parameters.Add("@TituloPropiedad", SqlDbType.Bit).Value = TituloPropiedad;
                cmd.Parameters.Add("@ArchivoMatricula", SqlDbType.NVarChar, -1).Value = (object)ArchivoMatricula ?? DBNull.Value;
                cmd.Parameters.Add("@ArchivoTitulo", SqlDbType.NVarChar, -1).Value = (object)ArchivoTitulo ?? DBNull.Value;
                cmd.Parameters.Add("@Publicada", SqlDbType.Bit).Value = Publicada;
                cmd.Parameters.Add("@Imagen", SqlDbType.NVarChar, -1).Value = (object)Imagen ?? DBNull.Value;
                cmd.Parameters.Add("@Servicios", SqlDbType.NVarChar).Value = (object)Servicios ?? DBNull.Value;
                cmd.Parameters.Add("@Moneda", SqlDbType.NVarChar).Value = Moneda ?? "ARS";
                cmd.Parameters.Add("@Tour360", SqlDbType.NVarChar, -1).Value = (object)Tour360 ?? DBNull.Value;
                cnn.Open();
                cmd.ExecuteNonQuery();
            }
        }

        public void Eliminar()
        {
            using (var cnn = new SqlConnection(connectionString))
            {
                var cmd = new SqlCommand("SP_Propiedad_Delete", cnn);
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.Add("@IdPropiedad", SqlDbType.Int).Value = IdPropiedad;
                cnn.Open();
                cmd.ExecuteNonQuery();
            }
        }
        #endregion
    }
}
