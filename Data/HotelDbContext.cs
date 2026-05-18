using Microsoft.EntityFrameworkCore;
using HotelAPI.Models;

namespace HotelAPI.Data;

// HotelDbContext is the bridge between your C# classes and the database.
// Entity Framework will auto-create the SQLite database file (hotel.db).

public class HotelDbContext : DbContext
{
    public HotelDbContext(DbContextOptions<HotelDbContext> options) : base(options) { }

    // These become database TABLES
    public DbSet<Hotel> Hotels { get; set; }
    public DbSet<Room> Rooms { get; set; }
    public DbSet<Booking> Bookings { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // ── Hotel ─────────────────────────────────────────────────────────
        modelBuilder.Entity<Hotel>(entity =>
        {
            entity.HasKey(h => h.Id);
            entity.HasIndex(h => h.Email).IsUnique();   // email must be unique
            entity.Property(h => h.HotelName).IsRequired().HasMaxLength(200);
            entity.Property(h => h.Email).IsRequired().HasMaxLength(200);
            entity.Property(h => h.PasswordHash).IsRequired();
        });

        // ── Room ──────────────────────────────────────────────────────────
        modelBuilder.Entity<Room>(entity =>
        {
            entity.HasKey(r => r.Id);
            entity.Property(r => r.PricePerNight).HasPrecision(10, 2);
            entity.Property(r => r.Name).IsRequired().HasMaxLength(200);

            // One Hotel → Many Rooms
            entity.HasOne(r => r.Hotel)
                  .WithMany(h => h.Rooms)
                  .HasForeignKey(r => r.HotelId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // ── Booking ───────────────────────────────────────────────────────
        modelBuilder.Entity<Booking>(entity =>
        {
            entity.HasKey(b => b.Id);
            entity.Property(b => b.TotalPrice).HasPrecision(10, 2);
            entity.Property(b => b.GuestName).IsRequired().HasMaxLength(200);
            entity.Property(b => b.GuestEmail).IsRequired().HasMaxLength(200);

            // One Room → Many Bookings
            entity.HasOne(b => b.Room)
                  .WithMany(r => r.Bookings)
                  .HasForeignKey(b => b.RoomId)
                  .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
