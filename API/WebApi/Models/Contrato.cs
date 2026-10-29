using System;
using System.Data;
using System.Data.SqlClient;

namespace WebApi.Models
{
    public class Contrato
    {
        #region Atributo
        string connectionString = @"Data Source=Dylan;Initial Catalog=GestionPropiedadesCondado ;Integrated Security=True";
        #endregion

        #region Propiedades
        public int IdContrato { get; set; }
        public string FechaInicio { get; set; }
        public string FechaFin { get; set; }
        public int IdOperacion { get; set; }
        public string LocadorNombre { get; set; }
        public string LocadorDni { get; set; }
        public string LocadorDomicilio { get; set; }
        public string LocatarioNombre { get; set; }
        public string LocatarioDni { get; set; }
        public string LocatarioDomicilio { get; set; }
        public string InmuebleDireccion { get; set; }
        public string InmuebleLocalidad { get; set; }
        public string Destino { get; set; }
        public string Moneda { get; set; }
        public decimal CanonMensual { get; set; }
        public decimal Deposito { get; set; }
        public string IndiceActualizacion { get; set; }
        public string Banco { get; set; }
        public string Cbu { get; set; }
        public string Cuit { get; set; }
        public string ExpOrd { get; set; }
        public string ExpExt { get; set; }
        public string Municipalidad { get; set; }
        public string Servicios { get; set; }
        public decimal ComisionPct { get; set; }
        public string ComisionCargo { get; set; }
        public string Documentacion { get; set; }
        public string Deuda { get; set; }
        public string DeudaDetalle { get; set; }
        public string Observaciones { get; set; }

        public string TipoContrato { get; set; }
        public string VendedorCuit { get; set; }
        public string VendedorEstadoCivil { get; set; }
        public string CompradorEstadoCivil { get; set; }
        public string Matricula { get; set; }
        public decimal SuperficieM2 { get; set; }
        public decimal PrecioTotal { get; set; }
        public decimal Sena { get; set; }
        public string TipoSena { get; set; }
        public string FechaPosesion { get; set; }
        public string EstadoInmueble { get; set; }
        public string GastosEscritura { get; set; }
        public string Impuestos { get; set; }
        public string Penalidades { get; set; }
        #endregion

        #region Métodos
        public DataTable ListarTodos()
        {
            using (var cnn = new SqlConnection(connectionString))
            {
                var cmd = new SqlCommand("SP_Contrato_GetAll", cnn);
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
                var cmd = new SqlCommand("SP_Contrato_GetId", cnn);
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.Add("@IdContrato", SqlDbType.Int).Value = IdContrato;
                var da = new SqlDataAdapter(cmd);
                var ds = new DataSet();
                da.Fill(ds);
                return ds.Tables[0];
            }
        }

        private void _agregarParametros(SqlCommand cmd)
        {
            cmd.Parameters.Add("@FechaInicio", SqlDbType.Date).Value = string.IsNullOrEmpty(FechaInicio) ? (object)DBNull.Value : DateTime.Parse(FechaInicio);
            cmd.Parameters.Add("@FechaFin", SqlDbType.Date).Value = string.IsNullOrEmpty(FechaFin) ? (object)DBNull.Value : DateTime.Parse(FechaFin);
            cmd.Parameters.Add("@IdOperacion", SqlDbType.Int).Value = IdOperacion;
            cmd.Parameters.Add("@LocadorNombre", SqlDbType.NVarChar).Value = (object)LocadorNombre ?? DBNull.Value;
            cmd.Parameters.Add("@LocadorDni", SqlDbType.NVarChar).Value = (object)LocadorDni ?? DBNull.Value;
            cmd.Parameters.Add("@LocadorDomicilio", SqlDbType.NVarChar).Value = (object)LocadorDomicilio ?? DBNull.Value;
            cmd.Parameters.Add("@LocatarioNombre", SqlDbType.NVarChar).Value = (object)LocatarioNombre ?? DBNull.Value;
            cmd.Parameters.Add("@LocatarioDni", SqlDbType.NVarChar).Value = (object)LocatarioDni ?? DBNull.Value;
            cmd.Parameters.Add("@LocatarioDomicilio", SqlDbType.NVarChar).Value = (object)LocatarioDomicilio ?? DBNull.Value;
            cmd.Parameters.Add("@InmuebleDireccion", SqlDbType.NVarChar).Value = (object)InmuebleDireccion ?? DBNull.Value;
            cmd.Parameters.Add("@InmuebleLocalidad", SqlDbType.NVarChar).Value = (object)InmuebleLocalidad ?? DBNull.Value;
            cmd.Parameters.Add("@Destino", SqlDbType.NVarChar).Value = Destino ?? "Vivienda familiar";
            cmd.Parameters.Add("@Moneda", SqlDbType.NVarChar).Value = Moneda ?? "ARS";
            cmd.Parameters.Add("@CanonMensual", SqlDbType.Decimal).Value = CanonMensual;
            cmd.Parameters.Add("@Deposito", SqlDbType.Decimal).Value = Deposito;
            cmd.Parameters.Add("@IndiceActualizacion", SqlDbType.NVarChar).Value = IndiceActualizacion ?? "ICL";
            cmd.Parameters.Add("@Banco", SqlDbType.NVarChar).Value = (object)Banco ?? DBNull.Value;
            cmd.Parameters.Add("@Cbu", SqlDbType.NVarChar).Value = (object)Cbu ?? DBNull.Value;
            cmd.Parameters.Add("@Cuit", SqlDbType.NVarChar).Value = (object)Cuit ?? DBNull.Value;
            cmd.Parameters.Add("@ExpOrd", SqlDbType.NVarChar).Value = ExpOrd ?? "Locatario";
            cmd.Parameters.Add("@ExpExt", SqlDbType.NVarChar).Value = ExpExt ?? "Locador";
            cmd.Parameters.Add("@Municipalidad", SqlDbType.NVarChar).Value = Municipalidad ?? "Locatario";
            cmd.Parameters.Add("@Servicios", SqlDbType.NVarChar).Value = Servicios ?? "Locatario";
            cmd.Parameters.Add("@ComisionPct", SqlDbType.Decimal).Value = ComisionPct;
            cmd.Parameters.Add("@ComisionCargo", SqlDbType.NVarChar).Value = ComisionCargo ?? "Locatario";
            cmd.Parameters.Add("@Documentacion", SqlDbType.NVarChar).Value = (object)Documentacion ?? DBNull.Value;
            cmd.Parameters.Add("@Deuda", SqlDbType.NVarChar).Value = Deuda ?? "No";
            cmd.Parameters.Add("@DeudaDetalle", SqlDbType.NVarChar).Value = (object)DeudaDetalle ?? DBNull.Value;
            cmd.Parameters.Add("@Observaciones", SqlDbType.NVarChar).Value = (object)Observaciones ?? DBNull.Value;

            cmd.Parameters.Add("@TipoContrato", SqlDbType.NVarChar).Value = TipoContrato ?? "Alquiler";
            cmd.Parameters.Add("@VendedorCuit", SqlDbType.NVarChar).Value = (object)VendedorCuit ?? DBNull.Value;
            cmd.Parameters.Add("@VendedorEstadoCivil", SqlDbType.NVarChar).Value = (object)VendedorEstadoCivil ?? DBNull.Value;
            cmd.Parameters.Add("@CompradorEstadoCivil", SqlDbType.NVarChar).Value = (object)CompradorEstadoCivil ?? DBNull.Value;
            cmd.Parameters.Add("@Matricula", SqlDbType.NVarChar).Value = (object)Matricula ?? DBNull.Value;
            cmd.Parameters.Add("@SuperficieM2", SqlDbType.Decimal).Value = SuperficieM2;
            cmd.Parameters.Add("@PrecioTotal", SqlDbType.Decimal).Value = PrecioTotal;
            cmd.Parameters.Add("@Sena", SqlDbType.Decimal).Value = Sena;
            cmd.Parameters.Add("@TipoSena", SqlDbType.NVarChar).Value = (object)TipoSena ?? DBNull.Value;
            cmd.Parameters.Add("@FechaPosesion", SqlDbType.Date).Value = string.IsNullOrEmpty(FechaPosesion) ? (object)DBNull.Value : DateTime.Parse(FechaPosesion);
            cmd.Parameters.Add("@EstadoInmueble", SqlDbType.NVarChar).Value = (object)EstadoInmueble ?? DBNull.Value;
            cmd.Parameters.Add("@GastosEscritura", SqlDbType.NVarChar).Value = (object)GastosEscritura ?? DBNull.Value;
            cmd.Parameters.Add("@Impuestos", SqlDbType.NVarChar).Value = (object)Impuestos ?? DBNull.Value;
            cmd.Parameters.Add("@Penalidades", SqlDbType.NVarChar).Value = (object)Penalidades ?? DBNull.Value;
        }

        public void Guardar()
        {
            using (var cnn = new SqlConnection(connectionString))
            {
                var cmd = new SqlCommand("SP_Contrato_Insert", cnn);
                cmd.CommandType = CommandType.StoredProcedure;
                _agregarParametros(cmd);
                cnn.Open();
                cmd.ExecuteNonQuery();
            }
        }

        public void Editar()
        {
            using (var cnn = new SqlConnection(connectionString))
            {
                var cmd = new SqlCommand("SP_Contrato_Update", cnn);
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.Add("@IdContrato", SqlDbType.Int).Value = IdContrato;
                _agregarParametros(cmd);
                cnn.Open();
                cmd.ExecuteNonQuery();
            }
        }

        public void Eliminar()
        {
            using (var cnn = new SqlConnection(connectionString))
            {
                var cmd = new SqlCommand("SP_Contrato_Delete", cnn);
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.Add("@IdContrato", SqlDbType.Int).Value = IdContrato;
                cnn.Open();
                cmd.ExecuteNonQuery();
            }
        }
        #endregion
    }
}
