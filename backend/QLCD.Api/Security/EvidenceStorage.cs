using System.Buffers.Binary;
using System.Net.Sockets;
using System.Text;
using QLCD.Domain.Entities;

namespace QLCD.Api.Security;

public sealed class EvidenceStorage
{
    public const long MaxFileBytes = 20L * 1024 * 1024;
    public const long MaxRequestBytes = 21L * 1024 * 1024;
    private readonly string root;
    private readonly string? legacyRoot;
    private readonly string? scannerHost;
    private readonly int scannerPort;

    public EvidenceStorage(IConfiguration config, IWebHostEnvironment environment)
    {
        var local = environment.IsDevelopment() || environment.IsEnvironment("Testing");
        var configuredRoot = config["Storage:Root"];
        if (configuredRoot is null && local)
            configuredRoot = Path.Combine(Path.GetTempPath(), "qlcd-private-evidence", Environment.ProcessId.ToString());
        root = ResolveRoot(configuredRoot);
        legacyRoot = config["Storage:LegacyRoot"] is string legacy ? ResolveRoot(legacy) : null;
        scannerHost = config["Storage:MalwareScannerHost"];
        scannerPort = config.GetValue("Storage:MalwareScannerPort", 3310);
        if (!local && string.IsNullOrWhiteSpace(scannerHost))
            throw new InvalidOperationException("Configure the private evidence malware scanner.");
        if (scannerPort is < 1 or > 65535)
            throw new InvalidOperationException("Invalid malware scanner port.");

        var webRoot = environment.WebRootPath ?? Path.Combine(environment.ContentRootPath, "wwwroot");
        if (IsWithin(webRoot, root) || IsWithin(root, webRoot)
            || (legacyRoot is not null && (IsWithin(webRoot, legacyRoot) || IsWithin(legacyRoot, webRoot))))
            throw new InvalidOperationException("Evidence storage must be separate from the web root.");

        Directory.CreateDirectory(root);
        EnsureNoLinks(root, root);
    }

    public async Task StoreAsync(Guid id, IFormFile file, CancellationToken cancellationToken)
    {
        var path = NewPath(id);
        var created = false;
        try
        {
            await using var stream = new FileStream(path, FileMode.CreateNew, FileAccess.ReadWrite, FileShare.None,
                64 * 1024, FileOptions.Asynchronous);
            created = true;
            await file.CopyToAsync(stream, cancellationToken);
            await ValidateAsync(stream, cancellationToken);
        }
        catch
        {
            if (created)
                TryDelete(id);
            throw;
        }
    }

    public async Task<FileStream?> OpenAsync(EvidenceFile file, CancellationToken cancellationToken)
    {
        var path = file.ContentValidated ? NewPath(file.Id) : ResolveLegacy(file);
        if (path is null || !File.Exists(path))
            return null;

        EnsureNoLinks(file.ContentValidated ? root : legacyRoot!, path);
        var stream = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.Read,
            64 * 1024, FileOptions.Asynchronous);
        try
        {
            if (!file.ContentValidated)
                await ValidateAsync(stream, cancellationToken);
            return stream;
        }
        catch
        {
            await stream.DisposeAsync();
            throw;
        }
    }

    public void TryDelete(Guid id)
    {
        var path = NewPath(id);
        if (File.Exists(path))
            File.Delete(path);
    }

    private string NewPath(Guid id) => Path.Combine(root, id.ToString("N") + ".pdf");

    private string? ResolveLegacy(EvidenceFile file)
    {
        if (legacyRoot is null || !Path.IsPathFullyQualified(file.StoragePath))
            return null;

        var path = Path.GetFullPath(file.StoragePath);
        var expectedName = file.Id.ToString() + ".pdf";
        return IsWithin(legacyRoot, path)
            && string.Equals(Path.GetFileName(path), expectedName, StringComparison.OrdinalIgnoreCase) ? path : null;
    }

    private async Task ValidateAsync(FileStream stream, CancellationToken cancellationToken)
    {
        if (stream.Length is < 16 or > MaxFileBytes)
            throw new InvalidEvidenceException();

        var header = new byte[8];
        stream.Position = 0;
        await stream.ReadExactlyAsync(header, cancellationToken);
        if (!header.AsSpan(0, 5).SequenceEqual("%PDF-"u8) || header[5] is not ((byte)'1' or (byte)'2')
            || header[6] != '.' || header[7] is < ((byte)'0') or > ((byte)'9'))
            throw new InvalidEvidenceException();

        var trailer = new byte[(int)Math.Min(stream.Length, 2048)];
        stream.Position = stream.Length - trailer.Length;
        await stream.ReadExactlyAsync(trailer, cancellationToken);
        if (!Encoding.ASCII.GetString(trailer).TrimEnd().EndsWith("%%EOF", StringComparison.Ordinal))
            throw new InvalidEvidenceException();

        stream.Position = 0;
        if (!string.IsNullOrWhiteSpace(scannerHost))
            await ScanAsync(stream, cancellationToken);
        stream.Position = 0;
    }

    private async Task ScanAsync(Stream contents, CancellationToken cancellationToken)
    {
        using var timeout = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        timeout.CancelAfter(TimeSpan.FromSeconds(20));
        var token = timeout.Token;
        try
        {
            using var client = new TcpClient();
            await client.ConnectAsync(scannerHost!, scannerPort, token);
            await using var wire = client.GetStream();
            await wire.WriteAsync("zINSTREAM\0"u8.ToArray(), token);

            var chunk = new byte[64 * 1024];
            var size = new byte[4];
            int read;
            while ((read = await contents.ReadAsync(chunk, token)) > 0)
            {
                BinaryPrimitives.WriteInt32BigEndian(size, read);
                await wire.WriteAsync(size, token);
                await wire.WriteAsync(chunk.AsMemory(0, read), token);
            }
            Array.Clear(size);
            await wire.WriteAsync(size, token);
            using var reader = new StreamReader(wire, Encoding.ASCII, leaveOpen: true);
            var result = new char[256];
            var count = 0;
            while (count < result.Length)
            {
                if (await reader.ReadAsync(result.AsMemory(count, 1), token) == 0 || result[count] == '\0')
                    break;
                count++;
            }
            var message = new string(result, 0, count);
            if (message.EndsWith(" FOUND", StringComparison.Ordinal))
                throw new InvalidEvidenceException();
            if (!string.Equals(message, "stream: OK", StringComparison.Ordinal))
                throw new SecurityStoreUnavailableException();
        }
        catch (Exception exception) when (exception is SocketException or IOException
            || (exception is OperationCanceledException && !cancellationToken.IsCancellationRequested))
        {
            throw new SecurityStoreUnavailableException();
        }
    }

    private static string ResolveRoot(string? value) => string.IsNullOrWhiteSpace(value) || !Path.IsPathFullyQualified(value)
        ? throw new InvalidOperationException("An absolute path is required for private evidence storage.")
        : Path.GetFullPath(value);

    private static bool IsWithin(string parent, string child)
    {
        var relative = Path.GetRelativePath(parent, child);
        return relative != ".." && !relative.StartsWith(".." + Path.DirectorySeparatorChar, StringComparison.Ordinal)
            && !Path.IsPathFullyQualified(relative);
    }

    private static void EnsureNoLinks(string parent, string path)
    {
        var current = path;
        while (true)
        {
            if ((File.GetAttributes(current) & FileAttributes.ReparsePoint) != 0)
                throw new InvalidEvidenceException();
            if (Path.GetRelativePath(parent, current) == ".")
                return;
            current = Path.GetDirectoryName(current) ?? throw new InvalidEvidenceException();
        }
    }
}

public sealed class InvalidEvidenceException : Exception;
