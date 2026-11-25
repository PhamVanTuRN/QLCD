namespace QLCD.Application.Common;

public static class PageBounds
{
    public const int DefaultSize = 50;
    private const int MaxSize = 200;

    public static int Offset(int page, int pageSize)
    {
        if (page is < 1 or > 10_000 || pageSize is < 1 or > MaxSize)
            throw new ArgumentException("Invalid pagination.");
        return (page - 1) * pageSize;
    }

    public static string? Search(string? value)
    {
        var term = value?.Trim();
        if (term?.Length > 100)
            throw new ArgumentException("Search text is too long.");
        return string.IsNullOrEmpty(term) ? null : term.ToLowerInvariant();
    }
}
