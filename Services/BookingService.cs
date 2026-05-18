using Microsoft.EntityFrameworkCore;
using HotelAPI.Data;
using HotelAPI.DTOs;
using HotelAPI.Models;

namespace HotelAPI.Services;

// ── Interface ──────────────────────────────────────────────────────────────
public interface IBookingService
{
    Task<(BookingDto? Booking, string Error)> CreateBookingAsync(CreateBookingDto dto, string baseUrl);
    Task<List<BookingDto>> GetBookingsByEmailAsync(string email, string baseUrl);
    Task<List<BookingDto>> GetBookingsByHotelAsync(int hotelId, string baseUrl);
    Task<BookingDto?> GetBookingByIdAsync(int id, string baseUrl);
    Task<(bool Success, string Message)> CancelBookingAsync(int id, string guestEmail);
    Task<(bool Success, string Message)> CancelBookingByAdminAsync(int id, int hotelId);
}

// ── Implementation ─────────────────────────────────────────────────────────
public class BookingService : IBookingService
{
    private readonly HotelDbContext _db;

    public BookingService(HotelDbContext db) => _db = db;

    // CREATE a booking (guests call this)
    public async Task<(BookingDto? Booking, string Error)> CreateBookingAsync(
        CreateBookingDto dto, string baseUrl)
    {
        // 1. Find the room
        var room = await _db.Rooms
            .Include(r => r.Hotel)
            .FirstOrDefaultAsync(r => r.Id == dto.RoomId);

        if (room == null)
            return (null, "Room not found.");

        // 2. Check if room is available
        if (room.Status != RoomStatus.Available)
            return (null, "Room is not available.");

        // 3. Validate dates
        if (dto.CheckIn.Date < DateTime.Today)
            return (null, "Check-in date cannot be in the past.");

        if (dto.CheckOut <= dto.CheckIn)
            return (null, "Check-out must be after check-in.");

        // 4. Check guest count
        if (dto.NumberOfGuests > room.Capacity)
            return (null, $"Room capacity is {room.Capacity} guests maximum.");

        // 5. Check no overlapping bookings for this room
        bool overlap = await _db.Bookings.AnyAsync(b =>
            b.RoomId == dto.RoomId &&
            b.Status == BookingStatus.Confirmed &&
            b.CheckIn < dto.CheckOut &&
            b.CheckOut > dto.CheckIn);

        if (overlap)
            return (null, "Room is already booked for those dates.");

        // 6. Calculate total price
        int nights = (dto.CheckOut.Date - dto.CheckIn.Date).Days;
        decimal total = nights * room.PricePerNight;

        // 7. Create the booking
        var booking = new Booking
        {
            RoomId          = dto.RoomId,
            GuestName       = dto.GuestName,
            GuestEmail      = dto.GuestEmail.ToLower(),
            GuestPhone      = dto.GuestPhone,
            NumberOfGuests  = dto.NumberOfGuests,
            CheckIn         = dto.CheckIn.Date,
            CheckOut        = dto.CheckOut.Date,
            Nights          = nights,
            TotalPrice      = total,
            SpecialRequests = dto.SpecialRequests,
            Status          = BookingStatus.Confirmed,
            CreatedAt       = DateTime.UtcNow
        };

        // 8. Mark room as Booked
        room.Status = RoomStatus.Booked;

        _db.Bookings.Add(booking);
        await _db.SaveChangesAsync();

        return (MapToDto(booking, room, baseUrl), string.Empty);
    }

    // GET all bookings for a guest email (guest looks up their bookings)
    public async Task<List<BookingDto>> GetBookingsByEmailAsync(string email, string baseUrl)
    {
        var bookings = await _db.Bookings
            .Include(b => b.Room).ThenInclude(r => r.Hotel)
            .Where(b => b.GuestEmail == email.ToLower())
            .OrderByDescending(b => b.CreatedAt)
            .ToListAsync();

        return bookings.Select(b => MapToDto(b, b.Room, baseUrl)).ToList();
    }

    // GET all bookings for a hotel (admin view)
    public async Task<List<BookingDto>> GetBookingsByHotelAsync(int hotelId, string baseUrl)
    {
        var bookings = await _db.Bookings
            .Include(b => b.Room).ThenInclude(r => r.Hotel)
            .Where(b => b.Room.HotelId == hotelId)
            .OrderByDescending(b => b.CreatedAt)
            .ToListAsync();

        return bookings.Select(b => MapToDto(b, b.Room, baseUrl)).ToList();
    }

    // GET a single booking by ID
    public async Task<BookingDto?> GetBookingByIdAsync(int id, string baseUrl)
    {
        var booking = await _db.Bookings
            .Include(b => b.Room).ThenInclude(r => r.Hotel)
            .FirstOrDefaultAsync(b => b.Id == id);

        return booking == null ? null : MapToDto(booking, booking.Room, baseUrl);
    }

    // CANCEL booking (called by the GUEST)
    public async Task<(bool Success, string Message)> CancelBookingAsync(int id, string guestEmail)
    {
        var booking = await _db.Bookings
            .Include(b => b.Room)
            .FirstOrDefaultAsync(b => b.Id == id && b.GuestEmail == guestEmail.ToLower());

        if (booking == null)
            return (false, "Booking not found or email doesn't match.");

        if (booking.Status == BookingStatus.Cancelled)
            return (false, "Booking is already cancelled.");

        if (booking.CheckIn.Date <= DateTime.Today)
            return (false, "Cannot cancel - check-in date has passed.");

        return await DoCancellation(booking);
    }

    // CANCEL booking (called by the ADMIN)
    public async Task<(bool Success, string Message)> CancelBookingByAdminAsync(int id, int hotelId)
    {
        var booking = await _db.Bookings
            .Include(b => b.Room)
            .FirstOrDefaultAsync(b => b.Id == id && b.Room.HotelId == hotelId);

        if (booking == null)
            return (false, "Booking not found in your hotel.");

        if (booking.Status == BookingStatus.Cancelled)
            return (false, "Booking is already cancelled.");

        return await DoCancellation(booking);
    }

    // Shared cancellation logic
    private async Task<(bool Success, string Message)> DoCancellation(Booking booking)
    {
        booking.Status      = BookingStatus.Cancelled;
        booking.CancelledAt = DateTime.UtcNow;

        // Free up the room again
        booking.Room.Status = RoomStatus.Available;

        await _db.SaveChangesAsync();
        return (true, "Booking cancelled successfully.");
    }

    // ── Helper: Convert Booking + Room → BookingDto ──────────────────────
    private static BookingDto MapToDto(Booking booking, Room room, string baseUrl)
    {
        return new BookingDto
        {
            Id              = booking.Id,
            RoomId          = booking.RoomId,
            RoomName        = room.Name,
            HotelName       = room.Hotel?.HotelName ?? "",
            RoomImageUrl    = room.ImagePath != null
                              ? $"{baseUrl}/uploads/{room.ImagePath}"
                              : null,
            GuestName       = booking.GuestName,
            GuestEmail      = booking.GuestEmail,
            GuestPhone      = booking.GuestPhone,
            NumberOfGuests  = booking.NumberOfGuests,
            CheckIn         = booking.CheckIn,
            CheckOut        = booking.CheckOut,
            Nights          = booking.Nights,
            TotalPrice      = booking.TotalPrice,
            SpecialRequests = booking.SpecialRequests,
            Status          = booking.Status.ToString(),
            CreatedAt       = booking.CreatedAt
        };
    }
}
