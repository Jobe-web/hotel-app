using Microsoft.EntityFrameworkCore;
using HotelAPI.Data;
using HotelAPI.DTOs;
using HotelAPI.Models;
using System.Linq;

namespace HotelAPI.Services;

// ── Interface ──────────────────────────────────────────────────────────────
public interface IRoomService
{
    Task<List<RoomDto>> GetAllRoomsAsync(string? type = null, int? hotelId = null);
    Task<List<RoomDto>> GetRoomsByHotelAsync(int hotelId);
    Task<RoomDto?> GetRoomByIdAsync(int id);
    Task<RoomDto> CreateRoomAsync(int hotelId, CreateRoomDto dto);
    Task<RoomDto?> UpdateRoomAsync(int id, int hotelId, UpdateRoomDto dto);
    Task<bool> DeleteRoomAsync(int id, int hotelId);
    Task<RoomDto?> UploadRoomImageAsync(int id, int hotelId, IFormFile image, string baseUrl);
}

// ── Implementation ─────────────────────────────────────────────────────────
public class RoomService : IRoomService
{
    private readonly HotelDbContext _db;

    public RoomService(HotelDbContext db) => _db = db;

    // GET all available rooms (guests use this to browse)
    public async Task<List<RoomDto>> GetAllRoomsAsync(string? type = null, int? hotelId = null)
    {
        var query = _db.Rooms
            .Include(r => r.Hotel)
            .AsQueryable();

        if (!string.IsNullOrEmpty(type))
            query = query.Where(r => r.Type == type);

        if (hotelId.HasValue)
            query = query.Where(r => r.HotelId == hotelId.Value);

        var rooms = await query.ToListAsync();
        return rooms.Select(room => MapToDto(room)).ToList();
    }

    // GET all rooms belonging to a specific hotel (admin use)
    public async Task<List<RoomDto>> GetRoomsByHotelAsync(int hotelId)
    {
        var rooms = await _db.Rooms
            .Include(r => r.Hotel)
            .Where(r => r.HotelId == hotelId)
            .ToListAsync();

        return rooms.Select(room => MapToDto(room)).ToList();
    }

    // GET single room by ID
    public async Task<RoomDto?> GetRoomByIdAsync(int id)
    {
        var room = await _db.Rooms
            .Include(r => r.Hotel)
            .FirstOrDefaultAsync(r => r.Id == id);

        return room == null ? null : MapToDto(room);
    }

    // CREATE a new room (admin only)
    public async Task<RoomDto> CreateRoomAsync(int hotelId, CreateRoomDto dto)
    {
        var room = new Room
        {
            HotelId        = hotelId,
            Name           = dto.Name,
            Type           = dto.Type,
            Floor          = dto.Floor,
            Capacity       = dto.Capacity,
            PricePerNight  = dto.PricePerNight,
            Description    = dto.Description,
            Amenities      = dto.Amenities,
            Status         = RoomStatus.Available,
            CreatedAt      = DateTime.UtcNow
        };

        _db.Rooms.Add(room);
        await _db.SaveChangesAsync();

        // Reload with Hotel navigation property
        await _db.Entry(room).Reference(r => r.Hotel).LoadAsync();
        return MapToDto(room);
    }

    // UPDATE a room (admin only, must own the room)
    public async Task<RoomDto?> UpdateRoomAsync(int id, int hotelId, UpdateRoomDto dto)
    {
        var room = await _db.Rooms
            .Include(r => r.Hotel)
            .FirstOrDefaultAsync(r => r.Id == id && r.HotelId == hotelId);

        if (room == null) return null;

        // Only update fields that were actually sent (null = don't change)
        if (dto.Name != null) room.Name = dto.Name;
        if (dto.Type != null) room.Type = dto.Type;
        if (dto.Floor.HasValue) room.Floor = dto.Floor.Value;
        if (dto.Capacity.HasValue) room.Capacity = dto.Capacity.Value;
        if (dto.PricePerNight.HasValue) room.PricePerNight = dto.PricePerNight.Value;
        if (dto.Description != null) room.Description = dto.Description;
        if (dto.Amenities != null) room.Amenities = dto.Amenities;

        await _db.SaveChangesAsync();
        return MapToDto(room);
    }

    // DELETE a room (admin only, must own the room)
    public async Task<bool> DeleteRoomAsync(int id, int hotelId)
    {
        var room = await _db.Rooms
            .FirstOrDefaultAsync(r => r.Id == id && r.HotelId == hotelId);

        if (room == null) return false;

        // Delete image file from disk if it exists
        if (!string.IsNullOrEmpty(room.ImagePath))
        {
            var filePath = Path.Combine("wwwroot", "uploads", room.ImagePath);
            if (File.Exists(filePath)) File.Delete(filePath);
        }

        _db.Rooms.Remove(room);
        await _db.SaveChangesAsync();
        return true;
    }

    // UPLOAD image for a room (saves to wwwroot/uploads/)
    public async Task<RoomDto?> UploadRoomImageAsync(int id, int hotelId, IFormFile image, string baseUrl)
    {
        var room = await _db.Rooms
            .Include(r => r.Hotel)
            .FirstOrDefaultAsync(r => r.Id == id && r.HotelId == hotelId);

        if (room == null) return null;

        // Validate file type
        var allowedTypes = new[] { "image/jpeg", "image/png", "image/webp", "image/gif" };
        if (!allowedTypes.Contains(image.ContentType))
            throw new InvalidOperationException("Invalid image type. Use JPEG, PNG, WEBP or GIF.");

        // Create upload directory if it doesn't exist
        var uploadDir = Path.Combine("wwwroot", "uploads");
        Directory.CreateDirectory(uploadDir);

        // Delete old image if exists
        if (!string.IsNullOrEmpty(room.ImagePath))
        {
            var oldPath = Path.Combine(uploadDir, room.ImagePath);
            if (File.Exists(oldPath)) File.Delete(oldPath);
        }

        // Save new image with a unique filename
        var extension = Path.GetExtension(image.FileName);
        var fileName  = $"room_{id}_{Guid.NewGuid():N}{extension}";
        var savePath  = Path.Combine(uploadDir, fileName);

        using (var stream = new FileStream(savePath, FileMode.Create))
        {
            await image.CopyToAsync(stream);
        }

        room.ImagePath = fileName;
        await _db.SaveChangesAsync();

        return MapToDto(room, baseUrl);
    }

    // ── Helper: Convert Room entity → RoomDto ────────────────────────────
    private static RoomDto MapToDto(Room room, string? baseUrl = null)
    {
        return new RoomDto
        {
            Id            = room.Id,
            HotelId       = room.HotelId,
            HotelName     = room.Hotel?.HotelName ?? "",
            Name          = room.Name,
            Type          = room.Type,
            Floor         = room.Floor,
            Capacity      = room.Capacity,
            PricePerNight = room.PricePerNight,
            Description   = room.Description,
            Amenities     = room.Amenities,
            ImageUrl      = room.ImagePath != null
                            ? $"{baseUrl}/uploads/{room.ImagePath}"
                            : null,
            Status    = room.Status.ToString(),
            CreatedAt = room.CreatedAt
        };
    }
}
