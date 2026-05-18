# 🏨 LuxeStay Hotel Management API
### Built with C# · ASP.NET Core 8 · Entity Framework Core · SQLite · JWT Auth

---

## 📋 What This App Does

| Feature | Who Uses It |
|---|---|
| Register a hotel account | Admin |
| Login / Logout with JWT token | Admin |
| Add, Edit, Delete rooms | Admin |
| Upload room photos | Admin |
| View all bookings for their hotel | Admin |
| Cancel any guest booking | Admin |
| Browse all available rooms | Guest |
| Book a room (with date validation) | Guest |
| View their own bookings by email | Guest |
| Cancel their own booking | Guest |

---

## 🚀 How to Run (Step by Step)

### Requirements
- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- Visual Studio 2022 **or** VS Code **or** just a terminal

### Step 1 — Open Terminal in the HotelAPI folder
```
cd HotelAPI
```

### Step 2 — Restore packages
```
dotnet restore
```

### Step 3 — Run the API
```
dotnet run
```

The API will start at: **http://localhost:5000**
Swagger UI will open at: **http://localhost:5000/swagger**

> 💡 The SQLite database file `hotel.db` is created automatically on first run.
> No SQL Server or database setup needed!

---

## 📁 Project Structure

```
HotelAPI/
├── Program.cs                  ← App startup, middleware, DI setup
├── HotelAPI.csproj             ← NuGet packages
├── appsettings.json            ← JWT key, connection string
│
├── Models/
│   └── Models.cs               ← Hotel, Room, Booking classes (DB tables)
│
├── Data/
│   └── HotelDbContext.cs       ← Entity Framework database context
│
├── DTOs/
│   └── DTOs.cs                 ← Request/response data shapes
│
├── Services/
│   ├── AuthService.cs          ← Register, Login, JWT generation
│   ├── RoomService.cs          ← Room CRUD + image upload
│   └── BookingService.cs       ← Booking + cancellation logic
│
└── Controllers/
    ├── AuthController.cs       ← /api/auth/register, /api/auth/login
    ├── RoomsController.cs      ← /api/rooms (CRUD + image)
    └── BookingsController.cs   ← /api/bookings (create, cancel, view)
```

---

## 🔌 API Endpoints

### 🔑 Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | None | Register new hotel |
| POST | `/api/auth/login` | None | Login, returns JWT token |

**Register body:**
```json
{
  "hotelName": "Grand Palace",
  "address": "123 Main St",
  "email": "admin@grandpalace.com",
  "password": "SecurePass123",
  "phone": "+1 555 0000",
  "description": "Luxury hotel in the city center",
  "stars": 5
}
```

**Login body:**
```json
{
  "email": "admin@grandpalace.com",
  "password": "SecurePass123"
}
```

**Response (both):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "hotelId": 1,
  "hotelName": "Grand Palace",
  "email": "admin@grandpalace.com",
  "stars": 5
}
```

> Save the `token` value. Use it as: `Authorization: Bearer <token>`

---

### 🛏️ Rooms

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/rooms` | None | Browse all rooms (filter: ?type=Suite&hotelId=1) |
| GET | `/api/rooms/{id}` | None | Get single room |
| GET | `/api/rooms/my-hotel` | Admin | Get your hotel's rooms |
| POST | `/api/rooms` | Admin | Create new room |
| PUT | `/api/rooms/{id}` | Admin | Update room |
| DELETE | `/api/rooms/{id}` | Admin | Delete room |
| POST | `/api/rooms/{id}/upload-image` | Admin | Upload room photo |

**Create room body:**
```json
{
  "name": "Room 101",
  "type": "Deluxe",
  "floor": 1,
  "capacity": 2,
  "pricePerNight": 299.99,
  "description": "Beautiful room with city view",
  "amenities": "WiFi,AC,TV,Mini Bar"
}
```

**Upload image:** Send as `multipart/form-data` with field name `image`

---

### 📅 Bookings

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/bookings` | None | Guest creates booking |
| GET | `/api/bookings/{id}` | None | Get booking by ID |
| GET | `/api/bookings/my-bookings?email=x` | None | Guest views their bookings |
| GET | `/api/bookings/hotel` | Admin | Admin views hotel bookings |
| POST | `/api/bookings/{id}/cancel?email=x` | None | Guest cancels booking |
| POST | `/api/bookings/{id}/admin-cancel` | Admin | Admin cancels booking |

**Create booking body:**
```json
{
  "roomId": 1,
  "guestName": "John Doe",
  "guestEmail": "john@email.com",
  "guestPhone": "+1 555 1234",
  "numberOfGuests": 2,
  "checkIn": "2026-06-01",
  "checkOut": "2026-06-05",
  "specialRequests": "High floor please"
}
```

---

## 🔒 How to Send Authenticated Requests

After login, include the JWT token in every admin request header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

In Visual Studio or Swagger UI, click "Authorize" and paste your token.

---

## 🗄️ Database

- Uses **SQLite** — no installation needed, the database is a single file `hotel.db`
- Created automatically on first run
- To switch to **SQL Server**, just change `UseSqlite` to `UseSqlServer` in `Program.cs`
  and update the connection string in `appsettings.json`

---

## 🏗️ Technologies Used

| Technology | Purpose |
|---|---|
| **C# / ASP.NET Core 8** | Web API framework |
| **Entity Framework Core** | Database ORM (object-relational mapper) |
| **SQLite** | Database (file-based, no server needed) |
| **BCrypt.Net** | Secure password hashing |
| **JWT (JSON Web Tokens)** | Admin authentication |
| **Swagger / Swashbuckle** | Interactive API documentation |
