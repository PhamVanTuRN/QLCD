using Microsoft.AspNetCore.Mvc;

namespace QLCD.Api.Security;

internal static class AuthLoginResponse
{
    public const string InvalidCredentials = "Thông tin xác thực không hợp lệ. Vui lòng kiểm tra và thử lại.";

    public static IActionResult Locked(ControllerBase controller, int seconds)
    {
        controller.Response.Headers.RetryAfter = seconds.ToString(System.Globalization.CultureInfo.InvariantCulture);
        return controller.StatusCode(429, new
        {
            success = false, code = "login_locked", retryAfterSeconds = seconds,
            message = "Bạn đã vượt quá số lần xác thực cho phép. Vui lòng thử lại sau 10 phút."
        });
    }
}
