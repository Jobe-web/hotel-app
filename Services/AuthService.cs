using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using HotelAPI.Data;
using HotelAPI.DTOs;
using HotelAPI.Models;

namespace HotelAPI.Services;

// ── Interface (contract) ───────────────────────────────────────────────────
public interface IAuthService
{
    Task<AuthResponseDto?> RegisterAsync(RegisterDto dto);
    Task<AuthResponseDto?> LoginAsync(LoginDto dto);
}

// ── Implementation ─────────────────────────────────────────────────────────
public class AuthService : IAuthService
{
    private readonly HotelDbContext _db;
    private readonly IConfiguration _config;

    public AuthService(HotelDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    // REGISTER a new hotel admin account
    public async Task<AuthResponseDto?> RegisterAsync(RegisterDto dto)
    {
        // Check if email already used
        bool emailExists = await _db.Hotels.AnyAsync(h => h.Email == dto.Email);
        if (emailExists) return null;   // caller will return 409 Conflict

        // Hash the password using BCrypt (never store plain text passwords!)
        string passwordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password);

        var hotel = new Hotel
        {
            HotelName  = dto.HotelName,
            Address    = dto.Address,
            Email      = dto.Email,
            PasswordHash = passwordHash,
            Phone      = dto.Phone,
            Description = dto.Description,
            Stars      = dto.Stars,
            CreatedAt  = DateTime.UtcNow
        };

        _db.Hotels.Add(hotel);
        await _db.SaveChangesAsync();

        return BuildResponse(hotel);
    }

    // LOGIN an existing hotel admin
    public async Task<AuthResponseDto?> LoginAsync(LoginDto dto)
    {
        var hotel = await _db.Hotels
            .FirstOrDefaultAsync(h => h.Email == dto.Email);

        if (hotel == null) return null;

        // Verify the password against the stored BCrypt hash
        bool passwordValid = BCrypt.Net.BCrypt.Verify(dto.Password, hotel.PasswordHash);
        if (!passwordValid) return null;

        return BuildResponse(hotel);
    }

    // Build JWT token and response object
    private AuthResponseDto BuildResponse(Hotel hotel)
    {
        var token = GenerateJwtToken(hotel);
        return new AuthResponseDto
        {
            Token     = token,
            HotelId   = hotel.Id,
            HotelName = hotel.HotelName,
            Email     = hotel.Email,
            Stars     = hotel.Stars,
            Message   = "Success"
        };
    }

    // Generate a signed JWT token
    private string GenerateJwtToken(Hotel hotel)
    {
        var jwtKey = _config["Jwt:Key"] ?? "LuxeStaySecretKey2026!SuperSecure";
        var key    = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var creds  = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        // Claims are pieces of info stored inside the token
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, hotel.Id.ToString()),
            new Claim(ClaimTypes.Email, hotel.Email),
            new Claim("HotelName", hotel.HotelName),
            new Claim(ClaimTypes.Role, "Admin")
        };

        var token = new JwtSecurityToken(
            claims:  claims,
            expires: DateTime.UtcNow.AddDays(7),   // Token valid for 7 days
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
