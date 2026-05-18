namespace HotelAPI.DTOs;

// ─────────────────────────────────────────────────────────────────────────────
// AUTH DTOs
// ─────────────────────────────────────────────────────────────────────────────

// What the admin sends when registering a new hotel
public class RegisterDto
{
    public string HotelName { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int Stars { get; set; } = 4;
}

// What the admin sends to log in
public class LoginDto
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

// What the API sends back after login/register (the JWT token)
public class AuthResponseDto
{
    public string Token { get; set; } = string.Empty;
    public int HotelId { get; set; }
    public string HotelName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public int Stars { get; set; }
    public string Message { get; set; } = "Success";
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOM DTOs
// ─────────────────────────────────────────────────────────────────────────────

// What admin sends to CREATE a room
public class CreateRoomDto
{
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = "Standard";
    public int Floor { get; set; }
    public int Capacity { get; set; } = 2;
    public decimal PricePerNight { get; set; }
    public string Description { get; set; } = string.Empty;
    public string Amenities { get; set; } = string.Empty;   // "WiFi,AC,TV"
}

// What admin sends to UPDATE a room
public class UpdateRoomDto
{
    public string? Name { get; set; }
    public string? Type { get; set; }
    public int? Floor { get; set; }
    public int? Capacity { get; set; }
    public decimal? PricePerNight { get; set; }
    public string? Description { get; set; }
    public string? Amenities { get; set; }
}

// What the API sends back when returning room data
public class RoomDto
{
    public int Id { get; set; }
    public int HotelId { get; set; }
    public string HotelName { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public int Floor { get; set; }
    public int Capacity { get; set; }
    public decimal PricePerNight { get; set; }
    public string Description { get; set; } = string.Empty;
    public string Amenities { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }                   // Full URL to image
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

// ─────────────────────────────────────────────────────────────────────────────
// BOOKING DTOs
// ─────────────────────────────────────────────────────────────────────────────

// What the guest sends to make a booking
public class CreateBookingDto
{
    public int RoomId { get; set; }
    public string GuestName { get; set; } = string.Empty;
    public string GuestEmail { get; set; } = string.Empty;
    public string GuestPhone { get; set; } = string.Empty;
    public int NumberOfGuests { get; set; } = 1;
    public DateTime CheckIn { get; set; }
    public DateTime CheckOut { get; set; }
    public string? SpecialRequests { get; set; }
}

// What the API sends back for a booking
public class BookingDto
{
    public int Id { get; set; }
    public int RoomId { get; set; }
    public string RoomName { get; set; } = string.Empty;
    public string HotelName { get; set; } = string.Empty;
    public string? RoomImageUrl { get; set; }
    public string GuestName { get; set; } = string.Empty;
    public string GuestEmail { get; set; } = string.Empty;
    public string GuestPhone { get; set; } = string.Empty;
    public int NumberOfGuests { get; set; }
    public DateTime CheckIn { get; set; }
    public DateTime CheckOut { get; set; }
    public int Nights { get; set; }
    public decimal TotalPrice { get; set; }
    public string? SpecialRequests { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
