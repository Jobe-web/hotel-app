using Microsoft.EntityFrameworkCore;
using HotelAPI.Data;
using HotelAPI.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        // Create a CORS policy named "AllowAll"
        options.AddPolicy("AllowAll", policy =>
            policy
                // Allow requests from ANY website (React frontend, etc.)
                .AllowAnyOrigin()

                // Allow all HTTP methods (GET, POST, PUT, DELETE, etc.)
                .AllowAnyMethod()

                // Allow all headers (Content-Type, Authorization, etc.)
                .AllowAnyHeader());
    });
});

// ── Database (SQLite - no install needed) ──────────────────────────────────
builder.Services.AddDbContext<HotelDbContext>(options =>
    options.UseSqlite("Data Source=hotel.db"));

// ── JWT Authentication ─────────────────────────────────────────────────────
var jwtKey = builder.Configuration["Jwt:Key"] ?? "LuxeStaySecretKey2026!SuperSecure";
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ValidateIssuer = false,
            ValidateAudience = false,
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddAuthorization();

// ── Services ──────────────────────────────────────────────────────────────
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IRoomService, RoomService>();
builder.Services.AddScoped<IBookingService, BookingService>();

// ── CORS (allow frontend to call API) ─────────────────────────────────────
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();
app.UseCors("AllowAll");

// ── Auto-create database on startup ──────────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<HotelDbContext>();
    db.Database.EnsureCreated();
}

// ── Middleware ────────────────────────────────────────────────────────────
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();

// ── Serve uploaded images as static files ─────────────────────────────────
app.UseStaticFiles();

app.MapControllers();

Console.WriteLine("✅ LuxeStay Hotel API is running!");
Console.WriteLine("📖 Swagger UI:https://localhost:57650/swagger/index.html");

app.Run();
