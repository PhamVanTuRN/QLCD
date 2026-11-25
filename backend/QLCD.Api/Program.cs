using System.Net;
using System.Security.Claims;
using System.Security.Cryptography.X509Certificates;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.EntityFrameworkCore;
using QLCD.Api.Security;
using QLCD.Application;
using QLCD.Application.Features.Accounts.Commands;
using QLCD.Application.Features.Auth.Commands.Login;
using QLCD.Domain.Security;
using QLCD.Infrastructure;
using QLCD.Infrastructure.Data;

var builder = WebApplication.CreateBuilder(args);
var local = builder.Environment.IsDevelopment() || builder.Environment.IsEnvironment("Testing");
var migrate = args.Contains("--migrate", StringComparer.Ordinal);
var initialize = args.Contains("--initialize-data", StringComparer.Ordinal);
var bootstrap = args.Contains("--bootstrap-admin", StringComparer.Ordinal);
var provision = args.Contains("--provision-account", StringComparer.Ordinal);
var issueEnrollment = args.Contains("--issue-mfa-enrollment", StringComparer.Ordinal);
var expireSessions = args.Contains("--expire-sessions", StringComparer.Ordinal);
var expireEvidence = args.Contains("--expire-pending-evidence", StringComparer.Ordinal);
if (new[] { migrate, initialize, bootstrap, provision, issueEnrollment, expireSessions, expireEvidence }.Count(value => value) > 1)
    throw new InvalidOperationException("Choose one maintenance operation.");

builder.Services.AddApplicationServices(builder.Configuration["MediatR:LicenseKey"]);
builder.Services.AddInfrastructureServices(builder.Configuration, builder.Environment, migrate);
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddScoped<TotpVerifier>();
builder.Services.AddScoped<IMfaVerifier>(provider => provider.GetRequiredService<TotpVerifier>());
var credentialResetPermission = new CredentialResetPermission(builder.Configuration.GetValue<Guid?>("Security:CredentialResetAccountId"));
builder.Services.AddSingleton(credentialResetPermission);

var dataProtection = builder.Services.AddDataProtection().SetApplicationName("QLCD.Api");
if (builder.Environment.IsEnvironment("Testing"))
    dataProtection.UseEphemeralDataProtectionProvider();
if (!local && !migrate && !initialize && !expireSessions && !expireEvidence)
{
    var keyPath = builder.Configuration["Security:DataProtectionKeyPath"];
    var certificatePath = builder.Configuration["Security:DataProtectionCertificatePath"];
    if (string.IsNullOrWhiteSpace(keyPath) || !Path.IsPathFullyQualified(keyPath)
        || string.IsNullOrWhiteSpace(certificatePath) || !Path.IsPathFullyQualified(certificatePath))
        throw new InvalidOperationException("Configure the protected key ring path and key encryption certificate.");

    var certificate = X509CertificateLoader.LoadPkcs12FromFile(
        certificatePath, builder.Configuration["Security:DataProtectionCertificatePassword"]);
    dataProtection.PersistKeysToFileSystem(new DirectoryInfo(keyPath)).ProtectKeysWithCertificate(certificate);
}

builder.Services.AddAntiforgery(options =>
{
    options.HeaderName = "X-CSRF-Token";
    options.Cookie.Name = local ? "QLCD-CSRF" : "__Host-QLCD-CSRF";
    options.Cookie.Path = "/";
    options.Cookie.HttpOnly = true;
    options.Cookie.SecurePolicy = local ? CookieSecurePolicy.SameAsRequest : CookieSecurePolicy.Always;
    options.Cookie.SameSite = SameSiteMode.Strict;
});
builder.Services.AddAuthentication(SessionAuthenticationHandler.SchemeName)
    .AddScheme<AuthenticationSchemeOptions, SessionAuthenticationHandler>(SessionAuthenticationHandler.SchemeName, _ => { });
builder.Services.AddAuthorization(options =>
{
    var staff = new AuthorizationPolicyBuilder().RequireAuthenticatedUser().RequireRole(SecurityRoles.Staff.Split(',')).Build();
    options.DefaultPolicy = staff;
    options.FallbackPolicy = staff;
    options.AddPolicy("Session", policy => policy.RequireAuthenticatedUser());
    options.AddPolicy(CredentialResetPermission.Policy, policy => policy.RequireAuthenticatedUser().RequireRole(SecurityRoles.Admin)
        .RequireAssertion(context => Guid.TryParse(context.User.FindFirstValue(ClaimTypes.NameIdentifier), out var id)
            && credentialResetPermission.Allows(id, context.User.FindFirstValue(ClaimTypes.Name), SecurityRoles.Admin)));
});

builder.Services.AddSingleton<LoginThrottle>();
builder.Services.AddSingleton<EvidenceStorage>();
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(
        context => RateLimitPartition.GetFixedWindowLimiter(
            context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions { PermitLimit = 240, Window = TimeSpan.FromMinutes(1) }));
    options.AddPolicy(LoginThrottle.Policy, context => RateLimitPartition.GetFixedWindowLimiter(
        context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions { PermitLimit = 20, Window = TimeSpan.FromMinutes(1) }));
    options.AddPolicy(LoginThrottle.FactorPolicy, context => RateLimitPartition.GetFixedWindowLimiter(
        context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions { PermitLimit = 20, Window = TimeSpan.FromMinutes(1) }));
    options.AddPolicy("evidence", context => RateLimitPartition.GetConcurrencyLimiter(
        context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new ConcurrencyLimiterOptions { PermitLimit = 3, QueueLimit = 0 }));
    options.OnRejected = (context, cancellationToken) =>
        new ValueTask(ApiErrors.WriteAsync(context.HttpContext, 429, "Vui lòng thử lại sau.", cancellationToken));
});
builder.Services.AddExceptionHandler<ApiErrors>();
builder.Services.AddProblemDetails();
builder.Services.AddHealthChecks().AddCheck<DatabaseReadiness>("database", tags: ["ready"], timeout: TimeSpan.FromSeconds(5));
builder.Services.AddControllers()
    .AddJsonOptions(options => options.JsonSerializerOptions.Converters.Add(
        new System.Text.Json.Serialization.JsonStringEnumConverter(allowIntegerValues: false)));
builder.Services.Configure<Microsoft.AspNetCore.Mvc.ApiBehaviorOptions>(options =>
{
    options.InvalidModelStateResponseFactory = context =>
    {
        var details = new Microsoft.AspNetCore.Mvc.ProblemDetails
        {
            Status = 400,
            Title = "Dữ liệu gửi lên không hợp lệ."
        };
        details.Extensions["message"] = details.Title;
        details.Extensions["success"] = false;
        details.Extensions["traceId"] = context.HttpContext.TraceIdentifier;
        return new Microsoft.AspNetCore.Mvc.BadRequestObjectResult(details);
    };
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.WebHost.ConfigureKestrel(options => options.Limits.MaxRequestBodySize = 1024 * 1024);

builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedProto | ForwardedHeaders.XForwardedFor;
    options.ForwardLimit = 1;
    foreach (var address in builder.Configuration.GetSection("Security:TrustedProxies").Get<string[]>() ?? [])
        options.KnownProxies.Add(IPAddress.Parse(address));
});

var app = builder.Build();
if (migrate || initialize || bootstrap || provision || issueEnrollment || expireSessions || expireEvidence)
{
    await using var scope = app.Services.CreateAsyncScope();
    var services = scope.ServiceProvider;
    if (migrate)
        await services.GetRequiredService<QLCDDbContext>().Database.MigrateAsync();
    else if (initialize)
        await DbInitializer.SeedAsync(services.GetRequiredService<QLCDDbContext>());
    else if (expireSessions)
    {
        var database = services.GetRequiredService<QLCDDbContext>();
        var now = TimeProvider.System.GetUtcNow().UtcDateTime;
        var count = await database.AuthSessions.Where(session => session.ExpiresAtUtc <= now).ExecuteDeleteAsync();
        app.Logger.LogInformation("Expired sessions removed: {Count}", count);
    }
    else if (expireEvidence)
    {
        var count = await SecurityMaintenance.ExpirePendingEvidenceAsync(services, app.Configuration);
        app.Logger.LogInformation("Expired, unattached evidence files removed: {Count}", count);
    }
    else
        await SecurityMaintenance.ProvisionAccountAsync(services, app.Configuration, bootstrap, issueEnrollment);
    return;
}

if (local && app.Configuration.GetValue<bool>("Bootstrap:OnDevelopmentStart"))
{
    if (!app.Configuration.GetValue<bool>("Data:UseInMemory"))
        throw new InvalidOperationException("Development startup bootstrap requires in-memory data.");
    await using var scope = app.Services.CreateAsyncScope();
    await DbInitializer.SeedAsync(scope.ServiceProvider.GetRequiredService<QLCDDbContext>());
    await SecurityMaintenance.ProvisionAccountAsync(scope.ServiceProvider, app.Configuration, true);
}

_ = app.Services.GetRequiredService<EvidenceStorage>();
app.UseForwardedHeaders();
app.UseExceptionHandler();
if (!local)
    app.UseHsts();

app.Use(async (context, next) =>
{
    var path = context.Request.Path;
    var response = context.Response;
    response.Headers.XContentTypeOptions = "nosniff";
    response.Headers.XFrameOptions = "DENY";
    response.Headers["Referrer-Policy"] = "no-referrer";
    if (path.StartsWithSegments("/api"))
        response.Headers.CacheControl = "no-store";
    if (!local && !context.Request.IsHttps && !path.StartsWithSegments("/health"))
    {
        await ApiErrors.WriteAsync(context, 400, "HTTPS is required.", context.RequestAborted);
        return;
    }
    await next(context);
});
app.UseStatusCodePages(async statusContext =>
{
    var context = statusContext.HttpContext;
    var status = context.Response.StatusCode;
    var message = status switch
    {
        401 => "Bạn cần đăng nhập.",
        403 => "Bạn không có quyền thực hiện thao tác này.",
        404 => "Không tìm thấy tài nguyên.",
        _ => "Yêu cầu chưa được xử lý."
    };
    await ApiErrors.WriteAsync(context, status, message, context.RequestAborted);
});
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
app.UseRouting();
app.UseRateLimiter();
app.UseAuthentication();
app.Use(async (context, next) =>
{
    var action = context.GetEndpoint()?.Metadata.GetMetadata<ControllerActionDescriptor>();
    if (action is null)
    {
        await next(context);
        return;
    }

    var method = context.Request.Method;
    var read = HttpMethods.IsGet(method) || HttpMethods.IsHead(method) || HttpMethods.IsOptions(method);
    context.Response.OnCompleted(() =>
    {
        var actor = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
        var target = Guid.TryParse(context.GetRouteValue("id")?.ToString(), out var id) ? (Guid?)id : null;
        app.Logger.LogInformation("API {Controller}.{Action} {Method} {Status} actor {Actor} target {Target} trace {Trace}",
            action.ControllerName, action.ActionName, method, context.Response.StatusCode, actor, target, context.TraceIdentifier);
        return Task.CompletedTask;
    });
    if (!read)
    {
        if (!context.Request.Headers.ContainsKey("X-CSRF-Token"))
        {
            await ApiErrors.WriteAsync(context, 403, "Không xác nhận được yêu cầu từ trình duyệt.", context.RequestAborted);
            return;
        }
        try
        {
            await context.RequestServices.GetRequiredService<IAntiforgery>().ValidateRequestAsync(context);
        }
        catch (AntiforgeryValidationException)
        {
            await ApiErrors.WriteAsync(context, 403, "Không xác nhận được yêu cầu từ trình duyệt.", context.RequestAborted);
            return;
        }
    }
    await next(context);
});
app.UseAuthorization();

app.MapControllers();
app.MapHealthChecks("/health/live", new HealthCheckOptions { Predicate = _ => false }).AllowAnonymous();
app.MapHealthChecks("/health/ready", new HealthCheckOptions { Predicate = check => check.Tags.Contains("ready") }).AllowAnonymous();
app.Run();

public partial class Program;
