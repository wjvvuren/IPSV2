using IpsApi.Models;
using IpsApi.Services;
using Microsoft.AspNetCore.Mvc;

namespace IpsApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class NavigationController : ControllerBase
{
    private readonly DatabaseService _db;
    private readonly ILogger<NavigationController> _logger;

    public NavigationController(DatabaseService db, ILogger<NavigationController> logger)
    {
        _db = db;
        _logger = logger;
    }

    /// <summary>
    /// Returns the full navigation tree — top-level modules + all children.
    /// Calls ReadNavigation() which returns two result sets.
    /// </summary>
    /// <remarks>
    /// TODO(backend-003): ReadNavigation's LEFT JOIN on ObjCode+ObjTypeNo=826 returns WRONG FormIDs
    /// for ERM children (duplicates + incorrect values). The Angular frontend has a hardcoded
    /// override map as a workaround. Theo needs to fix the JOIN in the stored procedure.
    /// See docs/backend-requests/003-application-navigation.md
    /// </remarks>
    [HttpGet]
    public async Task<IActionResult> GetNavigation()
    {
        try
        {
            _logger.LogInformation("Calling ReadNavigation");

            var resultSets = await _db.CallProcedureMultiResultAsync("ReadNavigation");

            // Result Set 0 = top-level modules, Result Set 1 = children
            var modules = resultSets.Count > 0 ? resultSets[0] : [];
            var children = resultSets.Count > 1 ? resultSets[1] : [];

            var result = new
            {
                modules,
                children
            };

            return Ok(ApiResponse<object>.Ok(result));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calling ReadNavigation");
            return StatusCode(500, ApiResponse<object>.Fail($"Database error: {ex.Message}"));
        }
    }
}
