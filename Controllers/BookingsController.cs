using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HotelAPI.DTOs;
using HotelAPI.Services;

namespace HotelAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BookingsController : ControllerBase
{
    private readonly IBookingService _bookingService;

    public BookingsController(IBookingService bookingService)
    {
        _bookingService = bookingService;
    }

    private int GetHotelId() =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");

    private string GetBaseUrl() =>
        $"{Request.Scheme}://{Request.Host}";

    // ─────────────────────────────────────────────────────────────────────
    // POST /api/bookings
    // Public: Guest creates a new booking
    // ─────────────────────────────────────────────────────────────────────
    [HttpPost]
    [AllowAnonymous]
    public async Task<IActionResult> CreateBooking([FromBody] CreateBookingDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.GuestName) ||
            string.IsNullOrWhiteSpace(dto.GuestEmail))
        {
            return BadRequest(new { message = "Guest name and email are required." });
        }

        var (booking, error) = await _bookingService.CreateBookingAsync(dto, GetBaseUrl());

        if (booking == null)
            return BadRequest(new { message = error });

        return CreatedAtAction(nameof(GetBookingById),
            new { id = booking.Id },
            new { message = "Booking confirmed!", booking });
    }

    // ─────────────────────────────────────────────────────────────────────
    // GET /api/bookings/{id}
    // Public: Get a single booking by ID
    // ─────────────────────────────────────────────────────────────────────
    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetBookingById(int id)
    {
        var booking = await _bookingService.GetBookingByIdAsync(id, GetBaseUrl());
        if (booking == null) return NotFound(new { message = "Booking not found." });
        return Ok(booking);
    }

    // ─────────────────────────────────────────────────────────────────────
    // GET /api/bookings/my-bookings?email=guest@email.com
    // Public: Guest retrieves all their bookings by email
    // ─────────────────────────────────────────────────────────────────────
    [HttpGet("my-bookings")]
    [AllowAnonymous]
    public async Task<IActionResult> GetMyBookings([FromQuery] string email)
    {
        if (string.IsNullOrWhiteSpace(email))
            return BadRequest(new { message = "Email is required." });

        var bookings = await _bookingService.GetBookingsByEmailAsync(email, GetBaseUrl());
        return Ok(bookings);
    }

    // ─────────────────────────────────────────────────────────────────────
    // GET /api/bookings/hotel
    // Admin only: Get all bookings for the logged-in hotel
    // ─────────────────────────────────────────────────────────────────────
    [HttpGet("hotel")]
    [Authorize]
    public async Task<IActionResult> GetHotelBookings()
    {
        int hotelId = GetHotelId();
        var bookings = await _bookingService.GetBookingsByHotelAsync(hotelId, GetBaseUrl());
        return Ok(bookings);
    }

    // ─────────────────────────────────────────────────────────────────────
    // POST /api/bookings/{id}/cancel
    // Public: Guest cancels their own booking (must provide email)
    // ─────────────────────────────────────────────────────────────────────
    [HttpPost("{id}/cancel")]
    [AllowAnonymous]
    public async Task<IActionResult> CancelBooking(int id, [FromQuery] string email)
    {
        if (string.IsNullOrWhiteSpace(email))
            return BadRequest(new { message = "Your email is required to cancel." });

        var (success, message) = await _bookingService.CancelBookingAsync(id, email);

        if (!success)
            return BadRequest(new { message });

        return Ok(new { message });
    }

    // ─────────────────────────────────────────────────────────────────────
    // POST /api/bookings/{id}/admin-cancel
    // Admin only: Admin cancels any booking in their hotel
    // ─────────────────────────────────────────────────────────────────────
    [HttpPost("{id}/admin-cancel")]
    [Authorize]
    public async Task<IActionResult> AdminCancelBooking(int id)
    {
        int hotelId = GetHotelId();
        var (success, message) = await _bookingService.CancelBookingByAdminAsync(id, hotelId);

        if (!success)
            return BadRequest(new { message });

        return Ok(new { message });
    }
}
