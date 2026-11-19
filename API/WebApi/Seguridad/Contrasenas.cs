using System;
using System.Security.Cryptography;

namespace WebApi
{
    // PBKDF2-SHA256 con sal aleatoria. Se guarda como PBKDF2$iteraciones$sal$hash (en base64)
    public static class Contrasenas
    {
        const int Iteraciones = 600000, LargoSal = 16, LargoHash = 32;
        public const string Prefijo = "PBKDF2$";

        public static string Hashear(string contrasena)
        {
            var sal = new byte[LargoSal];
            using (var rng = RandomNumberGenerator.Create()) rng.GetBytes(sal);
            byte[] hash;
            using (var kdf = new Rfc2898DeriveBytes(contrasena, sal, Iteraciones, HashAlgorithmName.SHA256))
                hash = kdf.GetBytes(LargoHash);
            return $"PBKDF2${Iteraciones}${Convert.ToBase64String(sal)}${Convert.ToBase64String(hash)}";
        }

        public static bool Verificar(string contrasena, string guardado)
        {
            var p = guardado?.Split('$');
            if (p == null || p.Length != 4 || p[0] != "PBKDF2") return false;
            var sal = Convert.FromBase64String(p[2]);
            var esperado = Convert.FromBase64String(p[3]);
            byte[] actual;
            using (var kdf = new Rfc2898DeriveBytes(contrasena, sal, int.Parse(p[1]), HashAlgorithmName.SHA256))
                actual = kdf.GetBytes(esperado.Length);
            int dif = 0;                                   // comparación en tiempo constante
            for (int i = 0; i < esperado.Length; i++) dif |= esperado[i] ^ actual[i];
            return dif == 0;
        }
    }
}
