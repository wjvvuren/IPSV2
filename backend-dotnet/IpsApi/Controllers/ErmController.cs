using IpsApi.Models;
using IpsApi.Services;
using Microsoft.AspNetCore.Mvc;

namespace IpsApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ErmController : ControllerBase
{
    private readonly DatabaseService _db;
    private readonly ILogger<ErmController> _logger;

    public ErmController(DatabaseService db, ILogger<ErmController> logger)
    {
        _db = db;
        _logger = logger;
    }

    /// <summary>
    /// Calls ReadNewERM stored procedure and returns dynamic column data.
    /// </summary>
    /// <remarks>
    /// TODO(backend-002): 5 FormIDs (3000825, 3000275, 3000152, 3000214, 3000908) return 500
    /// because ReadNewERM generates invalid dynamic SQL with bare NULL.
    /// Also needs: server-side pagination (LIMIT/OFFSET + total count).
    /// See docs/backend-requests/002-readnewerm-fixes-pagination.md
    /// </remarks>
    [HttpGet]
    public async Task<IActionResult> GetErm(
        [FromQuery] int formId,
        [FromQuery] string? objTypeList = "",
        [FromQuery] string? requiredDate = null)
    {
        try
        {
            _logger.LogInformation("Calling ReadNewERM with FormID={FormId}, ObjTypeList={ObjTypeList}, RequiredDate={RequiredDate}",
                formId, objTypeList, requiredDate);

            // Parse the date if provided
            object? dateParam = null;
            if (!string.IsNullOrEmpty(requiredDate) && DateTime.TryParse(requiredDate, out var parsedDate))
            {
                dateParam = parsedDate;
            }

            var parameters = new Dictionary<string, object?>
            {
                { "FormID", formId },
                { "ObjTypeList", objTypeList ?? "" },
                { "RequiredDate", dateParam }
            };

            var rows = await _db.CallProcedureAsync("ReadNewERM", parameters);

            // Extract column names from the first row (dynamic columns)
            var columns = rows.Count > 0
                ? rows[0].Keys.ToList()
                : new List<string>();

            var result = new
            {
                columns,
                rows,
                totalRows = rows.Count,
                formId,
                procedureName = "ReadNewERM"
            };

            return Ok(ApiResponse<object>.Ok(result));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calling ReadNewERM for FormID={FormId}", formId);
            return StatusCode(500, ApiResponse<object>.Fail($"Database error: {ex.Message}"));
        }
    }
}
