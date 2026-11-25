using System.Security.Cryptography;
using System.Text;

namespace QLCD.Shared.Security;

public static class PasswordHasher
{
    public const string InitialPassword = "123456aA@";
    private const string Version = "pbkdf2-sha256-v1";
    private const int Iterations = 600_000;
    private static readonly string DummyHash = Hash(Convert.ToHexString(RandomNumberGenerator.GetBytes(32)));

    public static bool IsAcceptable(string? password)
    {
        if (password is null || password.Length is < 8 or > 128 || password == InitialPassword)
            return false;

        bool upper = false, lower = false, digit = false, special = false;
        foreach (var character in password.EnumerateRunes())
        {
            upper |= Rune.IsUpper(character);
            lower |= Rune.IsLower(character);
            digit |= Rune.IsDigit(character);
            special |= Rune.IsPunctuation(character) || Rune.IsSymbol(character);
        }
        return upper && lower && digit && special;
    }

    public static string Hash(string password)
    {
        var salt = RandomNumberGenerator.GetBytes(16);
        var hash = Rfc2898DeriveBytes.Pbkdf2(password, salt, Iterations, HashAlgorithmName.SHA256, 32);
        return $"{Version}${Convert.ToBase64String(salt)}${Convert.ToBase64String(hash)}";
    }

    public static bool Verify(string password, string? storedHash)
    {
        if (password.Length > 128)
            return false;

        Span<byte> salt = stackalloc byte[16];
        Span<byte> reference = stackalloc byte[32];
        var valid = storedHash is not null && TryRead(storedHash, salt, reference);
        // Perform the same KDF for unknown, disabled and legacy accounts.
        if (!valid)
            TryRead(DummyHash, salt, reference);

        Span<byte> actual = stackalloc byte[32];
        Rfc2898DeriveBytes.Pbkdf2(password, salt, actual, Iterations, HashAlgorithmName.SHA256);
        var matches = CryptographicOperations.FixedTimeEquals(actual, reference);
        return valid && matches;
    }

    private static bool TryRead(string input, Span<byte> salt, Span<byte> hash)
    {
        var fields = input.Split('$');
        return fields.Length == 3 && fields[0] == Version
            && Convert.TryFromBase64String(fields[1], salt, out var saltLength) && saltLength == salt.Length
            && Convert.TryFromBase64String(fields[2], hash, out var hashLength) && hashLength == hash.Length;
    }
}
