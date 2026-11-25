using System.Reflection;
using FluentValidation;
using Microsoft.Extensions.DependencyInjection;

namespace QLCD.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services, string? mediatRLicenseKey = null)
    {
        var assembly = Assembly.GetExecutingAssembly();

        services.AddValidatorsFromAssembly(assembly);
        services.AddScoped<QLCD.Application.Common.EvidenceLinks>();
        
        services.AddMediatR(cfg =>
        {
            if (!string.IsNullOrWhiteSpace(mediatRLicenseKey))
                cfg.LicenseKey = mediatRLicenseKey;
            cfg.RegisterServicesFromAssembly(assembly);
            cfg.AddOpenBehavior(typeof(QLCD.Application.Common.ValidationBehavior<,>));
        });

        return services;
    }
}
