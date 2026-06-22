using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QLCD.Application.Common.Interfaces;
using QLCD.Domain.Entities;

namespace QLCD.Api.Controllers;

[ApiController]
[Route("api/v1/evidence-files")]
[Authorize]
public class EvidenceFilesController : ControllerBase
{
    private readonly IQLCDDbContext _context;
    private readonly IOrganizationScopeService _scopeService;
    private readonly ICurrentUserService _currentUserService;

    public EvidenceFilesController(
        IQLCDDbContext context,
        IOrganizationScopeService scopeService,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _scopeService = scopeService;
        _currentUserService = currentUserService;
    }

    [HttpPost("upload")]
    [RequestSizeLimit(20971520)] // 20 MB
    public async Task<IActionResult> Upload([FromForm] IFormFile file, [FromQuery] string moduleName, [FromQuery] Guid organizationId)
    {
        try
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(new { success = false, message = "Không tìm thấy file tải lên." });
            }

            // Limit check: <= 20MB
            if (file.Length > 20 * 1024 * 1024)
            {
                return BadRequest(new { success = false, message = "Dung lượng file vượt quá giới hạn cho phép (tối đa 20MB)." });
            }

            // Extension check: PDF only
            var ext = Path.GetExtension(file.FileName).ToLower();
            if (ext != ".pdf")
            {
                return BadRequest(new { success = false, message = "Chỉ cho phép tải lên file định dạng PDF." });
            }

            // Scope Check: Target organization must be in scope
            if (!await _scopeService.IsInScopeAsync(organizationId))
            {
                return StatusCode(403, new { success = false, message = "Không có quyền tải lên minh chứng cho đơn vị ngoài phạm vi quản lý." });
            }

            // Physical path
            var uploadDir = Path.Combine(Directory.GetCurrentDirectory(), "uploads", "evidence", moduleName, DateTime.UtcNow.ToString("yyyy"), DateTime.UtcNow.ToString("MM"));
            if (!Directory.Exists(uploadDir))
            {
                Directory.CreateDirectory(uploadDir);
            }

            var fileId = Guid.NewGuid();
            var storedName = fileId.ToString() + ".pdf";
            var filePath = Path.Combine(uploadDir, storedName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Create Db record
            var evidenceFile = new EvidenceFile
            {
                Id = fileId,
                OriginalFileName = file.FileName,
                StoredFileName = storedName,
                FileExtension = ext,
                ContentType = "application/pdf",
                FileSize = file.Length,
                StoragePath = filePath,
                ModuleName = moduleName,
                OrganizationId = organizationId,
                UploadedByUserId = _currentUserService.UserId ?? Guid.Empty,
                UploadedAt = DateTime.UtcNow
            };

            _context.EvidenceFiles.Add(evidenceFile);
            await _context.SaveChangesAsync(default);

            var downloadUrl = $"/api/v1/evidence-files/download/{fileId}";

            return Ok(new
            {
                success = true,
                data = new
                {
                    id = fileId,
                    originalFileName = file.FileName,
                    downloadUrl = downloadUrl
                }
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = "Lỗi tải lên file: " + ex.Message });
        }
    }

    [HttpGet("download/{id}")]
    [Authorize]
    public async Task<IActionResult> Download(Guid id)
    {
        try
        {
            var file = await _context.EvidenceFiles
                .FirstOrDefaultAsync(f => f.Id == id && !f.IsDeleted);

            if (file == null)
            {
                return NotFound(new { success = false, message = "Tập tin không tồn tại hoặc đã bị xóa." });
            }

            // Scope check: the organization that owns this file must be in scope
            if (!await _scopeService.IsInScopeAsync(file.OrganizationId))
            {
                return StatusCode(403, new { success = false, message = "Không có quyền truy cập minh chứng của đơn vị này." });
            }

            if (!System.IO.File.Exists(file.StoragePath))
            {
                return NotFound(new { success = false, message = "Tập tin vật lý không được tìm thấy trên máy chủ." });
            }

            var fileBytes = await System.IO.File.ReadAllBytesAsync(file.StoragePath);
            return File(fileBytes, file.ContentType, file.OriginalFileName);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { success = false, message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = "Lỗi tải file: " + ex.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        try
        {
            var file = await _context.EvidenceFiles
                .FirstOrDefaultAsync(f => f.Id == id && !f.IsDeleted);

            if (file == null)
            {
                return NotFound(new { success = false, message = "Tập tin không tồn tại hoặc đã bị xóa." });
            }

            // Scope check
            if (!await _scopeService.IsInScopeAsync(file.OrganizationId))
            {
                return StatusCode(403, new { success = false, message = "Không có quyền xóa minh chứng của đơn vị này." });
            }

            file.IsDeleted = true;
            await _context.SaveChangesAsync(default);

            return Ok(new { success = true, message = "Xóa minh chứng thành công." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = "Lỗi xóa file: " + ex.Message });
        }
    }
}
