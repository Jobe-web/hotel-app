import { useState } from "react";
import { uid, dark, gold, Input, Textarea, Select, Btn } from "./App";

// ?? AUTH ??????????????????????????????????????????????????????????????????????
export function AuthPage({ mode, onDone, onToggle, onBack, db, persist, showToast }) {
    const isLogin = mode === "login";
    const [form, setForm] = useState({ hotelName: "", address: "", email: "", password: "", phone: "", description: "", stars: "5" });
    const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

    const submit = () => {
        if (isLogin) {
            const hotel = db.hotels.find(h => h.email === form.email && h.password === form.password);
            if (!hotel) return showToast("Invalid email or password", "error");
            onDone(hotel);
        } else {
            if (!form.hotelName || !form.email || !form.password) return showToast("Please fill all required fields", "error");
            if (db.hotels.find(h => h.email === form.email)) return showToast("Email already registered", "error");
            const hotel = { id: uid(), ...form, createdAt: new Date().toISOString() };
            persist({ ...db, hotels: [...db.hotels, hotel] });
            onDone(hotel);
            showToast(`Welcome, ${hotel.hotelName}! ??`);
        }
    };

    //function setShowPassword({ arg0 }: { arg0: boolean; }): void {
    //    throw new Error("Function not implemented.");
    //}
    return (
        <div style={{ minHeight: "100vh", background: dark, display: "flex" }}>
            {/* Left panel */}
            <div style={{ flex: "0 0 45%", background: `linear-gradient(160deg,#0f0f1a,#1a1206)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 48, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(ellipse 60% 60% at 30% 40%, rgba(201,169,110,.1), transparent)` }} />
                <div style={{ position: "relative", textAlign: "center" }}>
                    <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 52, fontWeight: 900, color: "#f0ede8" }}>Luxe<span style={{ color: gold }}>Stay</span></div>
                    <div style={{ width: 40, height: 2, background: gold, margin: "16px auto" }} />
                    <p style={{ color: "#666", fontSize: 15, lineHeight: 1.7, maxWidth: 260 }}>
                        {isLogin ? "Sign in to manage your hotel, rooms and guest bookings." : "Register your hotel and start accepting bookings today."}
                    </p>
                    <div style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 14 }}>
                        {["Real-time booking management", "Room photo uploads", "Guest cancellation system", "Revenue dashboard"].map(f => (
                            <div key={f} style={{ display: "flex", alignItems: "center", gap: 10, color: "#888", fontSize: 13 }}>
                                <span style={{ color: gold, fontSize: 16 }}>?</span>{f}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right panel */}
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 48 }}>
                <div style={{ width: "100%", maxWidth: 420 }} className="fade-up">
                    <button onClick={onBack} style={{ background: "none", border: "none", color: gold, cursor: "pointer", marginBottom: 24, fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>? Back to Home</button>
                    <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 32, fontWeight: 800, color: "#f0ede8", marginBottom: 6 }}>
                        {isLogin ? "Welcome back" : "Register Hotel"}
                    </h2>
                    <p style={{ color: "#666", marginBottom: 30, fontSize: 15 }}>{isLogin ? "Sign in to your admin panel" : "Create your hotel account"}</p>


                  //-----------------------LOGIN ADIMN-----------------------------------------------


                    {!isLogin && <>
                        <Input label="Hotel Name *" value={form.hotelName} onChange={set("hotelName")} placeholder="Grand Palace Hotel" />
                        <Input label="Address" value={form.address} onChange={set("address")} placeholder="123 Main Street, City" />
                        <Input label="Phone" value={form.phone} onChange={set("phone")} placeholder="+1 555 000 0000" />
                        <Textarea label="Description" value={form.description} onChange={set("description")} placeholder="Describe your hotel..." />
                        <Select label="Star Rating" value={form.stars} onChange={set("stars")}>
                            {[3, 4, 5].map(s => <option key={s} value={s}>{s} Stars</option>)}
                        </Select>
                    </>}
                    const [showPassword, setShowPassword] = useState(false);
                    <Input label="Email Address *" type="email" value={form.email} onChange={set("email")} placeholder="admin@hotel.com" />
                    <Input label="Password *" type={showpassword ? "text" : "password"} value={form.password} onChange={set("password")} placeholder="••••••••" />

                    <button type="button" onClick={() => setShowPassword({ arg0: !showPassword })} style={{ marginTop: 5 }}>
                        {showPassword ? "Hide" : "Show"}
                    </button>
                    <Btn full onClick={submit} style={{ marginTop: 8, padding: "14px" }}>
                        {isLogin ? "Sign In ?" : "Create Hotel Account ?"}
                    </Btn>
                    <p style={{ textAlign: "center", marginTop: 20, fontSize: 14, color: "#555" }}>
                        {isLogin ? "New hotel?" : "Already registered?"}{" "}
                        <span onClick={onToggle} style={{ color: gold, cursor: "pointer", fontWeight: 700 }}>{isLogin ? "Register here" : "Sign in"}</span>
                    </p>
                </div>
            </div>
        </div>
    );
}
