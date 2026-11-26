using QLCD.Application.Common;
using QLCD.Application.Features.Accounts.Commands;
using FluentValidation;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace QLCD.Api.Security;

public sealed class ApiErrors(ILogger<ApiErrors> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext context, Exception error, CancellationToken cancellationToken)
    {
        var (status, message) = error switch
        {
            AdminUnlockAuthenticationException => (403, "Không xác thực được admin. Kiểm tra mật khẩu và dùng mã Authenticator mới."),
            OrganizationStateException => (409, error.Message),
            ValidationException => (400, "Dữ liệu gửi lên không hợp lệ."),
            InvalidEvidenceException => (400, "Tệp không phải PDF hợp lệ hoặc không đạt kiểm tra an toàn."),
            ArgumentException => (400, "Dữ liệu hoặc thao tác không hợp lệ."),
            UnauthorizedAccessException => (403, "Bạn không có quyền thực hiện thao tác này."),
            KeyNotFoundException => (404, "Không tìm thấy tài nguyên."),
            DbUpdateException => (409, "Dữ liệu đã thay đổi hoặc xung đột với bản ghi hiện có."),
            SecurityStoreUnavailableException or System.Data.Common.DbException => (503, "Dịch vụ dữ liệu tạm thời gián đoạn."),
            _ => (500, "Đã xảy ra lỗi hệ thống.")
        };
        logger.Log(status >= 500 ? LogLevel.Error : LogLevel.Information,
            "API error {Type} status {Status} trace {Trace}", error.GetType().Name, status, context.TraceIdentifier);
        await WriteAsync(context, status, message, cancellationToken);
        return true;
    }

    public static async Task WriteAsync(HttpContext context, int status, string message, CancellationToken cancellationToken)
    {
        context.Response.StatusCode = status;
        var details = new ProblemDetails { Status = status, Title = message };
        details.Extensions["message"] = message;
        details.Extensions["success"] = false;
        details.Extensions["traceId"] = context.TraceIdentifier;
        await context.Response.WriteAsJsonAsync(details, options: null, contentType: "application/problem+json", cancellationToken);
    }
}
