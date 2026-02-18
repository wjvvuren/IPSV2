using IpsApi.Models;
using Microsoft.AspNetCore.Mvc;

namespace IpsApi.Controllers;

[ApiController]
[Route("[controller]")]
public class HealthController : ControllerBase
{
    [HttpGet("/health")]
    public IActionResult Check()
    {
        return Ok(ApiResponse<object>.Ok(new { status = "healthy" }));
    }
}
