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

    /// <summary>
    /// Static ERM form definitions — maps menu items to FormIDs for ReadNewERM.
    /// FormIDs are ObjNo values from the obj table (ObjTypeNo=826).
    /// </summary>
    private static readonly List<object> ErmForms =
    [
        new { id = 3002443, name = "Stakeholder", code = "Stakeholder", icon = "👥" },
        new { id = 3003751, name = "Product", code = "Product", icon = "📦" },
        new { id = 3004196, name = "Business Process", code = "BusinessProcess", icon = "⚙️" },
        new { id = 3000825, name = "Resource", code = "Resource", icon = "🔧" },
        new { id = 3001603, name = "Look-ups", code = "LookUps", icon = "🔍" },
        new { id = 3003754, name = "Share Register", code = "ShareRegister", icon = "📋" },
        new { id = 3003752, name = "Related Party", code = "RelatedParty", icon = "🤝" },
        new { id = 3000650, name = "Addresses", code = "Addresses", icon = "📍" },
        new { id = 3001488, name = "Documents", code = "Documents", icon = "📄" },
        new { id = 3000743, name = "Account", code = "Account", icon = "💳" },
        new { id = 3003725, name = "Account Setup", code = "AccountSetUp", icon = "🔧" },
        new { id = 3004095, name = "Specific Fees", code = "SpecificFees", icon = "💰" },
        new { id = 3000152, name = "Bank Transaction", code = "BankTransaction", icon = "🏦" },
        new { id = 3000214, name = "Journals", code = "Journals", icon = "📓" },
        new { id = 3003744, name = "General Ledgers", code = "GeneralLedgers", icon = "📊" },
        new { id = 3003756, name = "Sub-Product", code = "SubProduct", icon = "📦" },
        new { id = 3004120, name = "Sub-Product Detail", code = "SubProductDetail", icon = "📋" },
        new { id = 3003745, name = "Global Fees", code = "GlobalFees", icon = "🌐" },
        new { id = 3000908, name = "Equipment", code = "Equipment", icon = "🖥️" },
        new { id = 3001231, name = "Master Tasks", code = "MasterTasks", icon = "✅" },
    ];

    public ErmController(DatabaseService db, ILogger<ErmController> logger)
    {
        _db = db;
        _logger = logger;
    }

    /// <summary>
    /// Returns the list of available ERM forms for the sidebar navigation.
    /// </summary>
    [HttpGet("forms")]
    public IActionResult GetForms()
    {
        return Ok(ApiResponse<object>.Ok(ErmForms));
    }

    /// <summary>
    /// Calls ReadNewERM stored procedure and returns dynamic column data.
    /// </summary>
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
