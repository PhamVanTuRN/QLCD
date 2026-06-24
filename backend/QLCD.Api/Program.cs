using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Threading.Tasks;
using System.Security.Claims;
using System;
using QLCD.Application;
using QLCD.Infrastructure;
using QLCD.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Nạp thêm cấu hình từ file appsettings.Local.json (file này sẽ bị Git bỏ qua để bảo mật)
builder.Configuration.AddJsonFile("appsettings.Local.json", optional: true, reloadOnChange: true);

// 1. Đăng ký JWT Bearer Authentication
var jwtSecret = builder.Configuration["JwtSettings:Secret"];
if (string.IsNullOrEmpty(jwtSecret) || jwtSecret == "YOUR_JWT_SECRET_KEY_MINIMUM_32_CHARACTERS")
{
    throw new InvalidOperationException("JWT Secret key is not properly configured. Please set a secure key for 'JwtSettings:Secret'.");
}
var key = Encoding.ASCII.GetBytes(jwtSecret);
builder.Services.AddAuthentication(x =>
{
    x.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    x.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(x =>
{
    x.RequireHttpsMetadata = false;
    x.SaveToken = true;
    x.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = false,
        ValidateAudience = false
    };
    x.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) && 
                path.StartsWithSegments("/api/v1/evidence-files/download"))
            {
                context.Token = accessToken;
            }
            return Task.CompletedTask;
        },
        OnTokenValidated = async context =>
        {
            var dbContext = context.HttpContext.RequestServices.GetRequiredService<QLCDDbContext>();
            var userIdClaim = context.Principal?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (Guid.TryParse(userIdClaim, out Guid userId))
            {
                var userExists = await dbContext.TaiKhoans.AnyAsync(u => u.Id == userId && u.TrangThai);
                if (!userExists)
                {
                    context.Fail("User no longer exists or is disabled.");
                }
            }
            else
            {
                context.Fail("Invalid user ID in token.");
            }
        }
    };
});

// 2. Đăng ký các dịch vụ ở các lớp
builder.Services.AddApplicationServices();
builder.Services.AddInfrastructureServices(builder.Configuration);

// 3. Thêm hỗ trợ Controllers
builder.Services.AddControllers()
    .AddJsonOptions(opts =>
    {
        opts.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// 4. CORS cho Next.js frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.SetIsOriginAllowed(origin => true)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

// Cấu hình HTTP Pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Seed dữ liệu
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<QLCDDbContext>();
        if (context.Database.ProviderName != "Microsoft.EntityFrameworkCore.InMemory")
        {
            await context.Database.MigrateAsync();
        }
        await DbInitializer.SeedAsync(context);
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Lỗi xảy ra khi chạy migrations hoặc seed dữ liệu.");
    }
}

app.Run();

