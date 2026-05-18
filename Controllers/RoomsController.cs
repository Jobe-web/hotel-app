using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HotelAPI.DTOs;
using HotelAPI.Services;

namespace HotelAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RoomsController : ControllerBase
{
    private readonly IRoomService _roomService;

    public RoomsController(IRoomService roomService)
    {
        _roomService = roomService;
    }

    // Helper: get the logged-in hotel's ID from the JWT token
    private int GetHotelId() =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");

    // Helper: build the base URL for image links (e.g. https://localhost:5000)
    private string GetBaseUrl() =>
        $"{Request.Scheme}://{Request.Host}";

    // ─────────────────────────────────────────────────────────────────────
    // GET /api/rooms
    // Public: Browse all available rooms (guests use this)
    // Optional query params: ?type=Suite&hotelId=1
    // ─────────────────────────────────────────────────────────────────────
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAllRooms(
        [FromQuery] string? type    = null,
        [FromQuery] int?    hotelId = null)
    {
        var rooms = await _roomService.GetAllRoomsAsync(type, hotelId);
        return Ok(rooms);
    }

    // ─────────────────────────────────────────────────────────────────────
    // GET /api/rooms/my-hotel
    // Admin only: Get all rooms for the logged-in hotel
    // ─────────────────────────────────────────────────────────────────────
    [HttpGet("my-hotel")]
    [Authorize]
    public async Task<IActionResult> GetMyHotelRooms()
    {
        int hotelId = GetHotelId();
        var rooms = await _roomService.GetRoomsByHotelAsync(hotelId);
        return Ok(rooms);
    }

    // ─────────────────────────────────────────────────────────────────────
    // GET /api/rooms/{id}
    // Public: Get a single room by ID
    // ─────────────────────────────────────────────────────────────────────
    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetRoom(int id)
    {
        var room = await _roomService.GetRoomByIdAsync(id);
        if (room == null) return NotFound(new { message = "Room not found." });
        return Ok(room);
    }

    // ─────────────────────────────────────────────────────────────────────
    // POST /api/rooms
    // Admin only: Create a new room
    // ─────────────────────────────────────────────────────────────────────
    [HttpPost]
    [Authorize]
    public async Task<IActionResult> CreateRoom([FromBody] CreateRoomDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name) || dto.PricePerNight <= 0)
            return BadRequest(new { message = "Room name and a valid price are required." });

        int hotelId = GetHotelId();
        var room = await _roomService.CreateRoomAsync(hotelId, dto);
        return CreatedAtAction(nameof(GetRoom), new { id = room.Id }, room);
    }

    // ─────────────────────────────────────────────────────────────────────
    // PUT /api/rooms/{id}
    // Admin only: Update a room (only updates fields you send)
    // ─────────────────────────────────────────────────────────────────────
    [HttpPut("{id}")]
    [Authorize]
    public async Task<IActionResult> UpdateRoom(int id, [FromBody] UpdateRoomDto dto)
    {
        int hotelId = GetHotelId();
        var room = await _roomService.UpdateRoomAsync(id, hotelId, dto);

        if (room == null)
            return NotFound(new { message = "Room not found or you do not own this room." });

        return Ok(room);
    }

    // ─────────────────────────────────────────────────────────────────────
    // DELETE /api/rooms/{id}
    // Admin only: Delete a room
    // ─────────────────────────────────────────────────────────────────────
    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> DeleteRoom(int id)
    {
        int hotelId = GetHotelId();
        bool deleted = await _roomService.DeleteRoomAsync(id, hotelId);

        if (!deleted)
            return NotFound(new { message = "Room not found or you do not own this room." });

        return Ok(new { message = "Room deleted successfully." });
    }

    // ─────────────────────────────────────────────────────────────────────
    // POST /api/rooms/{id}/upload-image
    // Admin only: Upload or replace the image for a room
    // Send as multipart/form-data with field name "image"
    // ─────────────────────────────────────────────────────────────────────
    [HttpPost("{id}/upload-image")]
    [Authorize]
    public async Task<IActionResult> UploadRoomImage(int id, IFormFile image)
    {
        if (image == null || image.Length == 0)
            return BadRequest(new { message = "Please select an image file." });

        if (image.Length > 5 * 1024 * 1024)   // 5 MB limit
            return BadRequest(new { message = "Image must be under 5 MB." });

        int hotelId = GetHotelId();

        try
        {
            var room = await _roomService.UploadRoomImageAsync(id, hotelId, image, GetBaseUrl());
            if (room == null)
                return NotFound(new { message = "Room not found or you do not own this room." });

            return Ok(new { message = "Image uploaded successfully.", imageUrl = room.ImageUrl, room });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
