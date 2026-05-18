namespace HotelAPI.Models;

// ─────────────────────────────────────────────────────────────────────────────
// HOTEL (Admin Account)
// Each hotel registers with their own account and manages their own rooms.
// ─────────────────────────────────────────────────────────────────────────────
public class Hotel
{
    public int Id { get; set; }
    public string HotelName { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;   // BCrypt hash
    public string Phone { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int Stars { get; set; } = 4;                        // 3, 4, or 5
    public string? LogoImagePath { get; set; }                 // optional hotel logo
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation property (one hotel has many rooms)
    public List<Room> Rooms { get; set; } = new();
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOM
// ─────────────────────────────────────────────────────────────────────────────
public class Room
{
    public int Id { get; set; }
    public int HotelId { get; set; }                           // Foreign key
    public string Name { get; set; } = string.Empty;          // e.g. "Room 101"
    public string Type { get; set; } = "Standard";            // Standard / Deluxe / Suite / Presidential
    public int Floor { get; set; }
    public int Capacity { get; set; } = 2;                    // Max guests
    public decimal PricePerNight { get; set; }
    public string Description { get; set; } = string.Empty;
    public string Amenities { get; set; } = string.Empty;     // Stored as comma-separated
    public string? ImagePath { get; set; }                    // Uploaded image filename
    public RoomStatus Status { get; set; } = RoomStatus.Available;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Hotel Hotel { get; set; } = null!;
    public List<Booking> Bookings { get; set; } = new();
}

public enum RoomStatus
{
    Available,
    Booked,
    Maintenance
}

// ─────────────────────────────────────────────────────────────────────────────
// BOOKING
// ─────────────────────────────────────────────────────────────────────────────
public class Booking
{
    public int Id { get; set; }
    public int RoomId { get; set; }                           // Foreign key
    public string GuestName { get; set; } = string.Empty;
    public string GuestEmail { get; set; } = string.Empty;
    public string GuestPhone { get; set; } = string.Empty;
    public int NumberOfGuests { get; set; } = 1;
    public DateTime CheckIn { get; set; }
    public DateTime CheckOut { get; set; }
    public int Nights { get; set; }
    public decimal TotalPrice { get; set; }
    public string? SpecialRequests { get; set; }
    public BookingStatus Status { get; set; } = BookingStatus.Confirmed;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CancelledAt { get; set; }

    // Navigation property
    public Room Room { get; set; } = null!;
}

public enum BookingStatus
{
    Confirmed,
    Cancelled,
    CheckedIn,
    CheckedOut
}
