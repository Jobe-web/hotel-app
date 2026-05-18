using Microsoft.AspNetCore.Mvc;
using HotelAPI.DTOs;
using HotelAPI.Services;

namespace HotelAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    // ─────────────────────────────────────────────────────────────────────
    // POST /api/auth/register
    // Register a new hotel admin account
    // ─────────────────────────────────────────────────────────────────────
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.HotelName) ||
            string.IsNullOrWhiteSpace(dto.Email) ||
            string.IsNullOrWhiteSpace(dto.Password))
        {
            return BadRequest(new { message = "Hotel name, email, and password are required." });
        }

        if (dto.Password.Length < 6)
            return BadRequest(new { message = "Password must be at least 6 characters." });

        var result = await _authService.RegisterAsync(dto);

        if (result == null)
            return Conflict(new { message = "An account with this email already exists." });

        return Ok(result);
    }

    // ─────────────────────────────────────────────────────────────────────
    // POST /api/auth/login
    // Login an existing hotel admin
    // ─────────────────────────────────────────────────────────────────────
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Password))
            return BadRequest(new { message = "Email and password are required." });

        var result = await _authService.LoginAsync(dto);

        if (result == null)
            return Unauthorized(new { message = "Invalid email or password." });

        return Ok(result);
    }
}
