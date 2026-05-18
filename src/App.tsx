
import API from "./api";
//import { useEffect } from "react";
import { useState, useEffect, useRef } from "react";

// ── Persistent storage ────────────────────────────────────────────────────────
const STORE = "luxestay_v2";
const load = () => { try { return JSON.parse(localStorage.getItem(STORE)) || defaultDb(); } catch { return defaultDb(); } };
const save = (d) => localStorage.setItem(STORE, JSON.stringify(d));
function defaultDb() {
  return { hotels: [], rooms: [], bookings: [] };
}
let _id = Date.now();
const uid = () => (++_id).toString(36);

// ── Global styles injected once ───────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;900&family=DM+Sans:wght@300;400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'DM Sans', sans-serif; background: #0a0a0f; color: #f0ede8; }
  ::-webkit-scrollbar { width: 5px; } ::-webkit-scrollbar-track { background: #111; } ::-webkit-scrollbar-thumb { background: #c9a96e; border-radius: 4px; }
  input, select, textarea, button { font-family: inherit; }
  @keyframes fadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
  @keyframes shimmer { 0%,100% { opacity:.6; } 50% { opacity:1; } }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes slideIn { from { transform:translateX(100%); opacity:0; } to { transform:translateX(0); opacity:1; } }
  .fade-up { animation: fadeUp .55s cubic-bezier(.22,.68,0,1.2) both; }
  .fade-up-2 { animation: fadeUp .55s .1s cubic-bezier(.22,.68,0,1.2) both; }
  .fade-up-3 { animation: fadeUp .55s .2s cubic-bezier(.22,.68,0,1.2) both; }
  .fade-up-4 { animation: fadeUp .55s .3s cubic-bezier(.22,.68,0,1.2) both; }
`;

// ── Colours & tokens ──────────────────────────────────────────────────────────
const gold = "#c9a96e";
const goldLight = "#e8d5a3";
const dark = "#0a0a0f";
const card = "#13131a";
const cardBorder = "rgba(201,169,110,.18)";
const surface = "#1a1a24";

// ── Tiny helpers ──────────────────────────────────────────────────────────────
const nights = (ci, co) => Math.max(0, Math.round((new Date(co).getTime() - new Date(ci).getTime()) / 86400000));

function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3800); return () => clearTimeout(t); }, []);
  const bg = type === "error" ? "#7f1d1d" : type === "info" ? "#1e3a5f" : "#14532d";
  const border = type === "error" ? "#ef4444" : type === "info" ? "#3b82f6" : "#22c55e";
  return (
    <div style={{ position:"fixed", bottom:28, right:28, zIndex:9999, background:bg, border:`1px solid ${border}`, color:"#fff", padding:"14px 20px", borderRadius:12, fontWeight:500, fontSize:14, maxWidth:340, animation:"slideIn .3s ease", display:"flex", alignItems:"center", gap:10, boxShadow:"0 8px 32px rgba(0,0,0,.5)" }}>
      <span style={{ fontSize:18 }}>{type==="error"?"❌":type==="info"?"ℹ️":"✅"}</span>
      {msg}
      <button onClick={onClose} style={{ marginLeft:"auto", background:"none", border:"none", color:"#fff", cursor:"pointer", opacity:.7, fontSize:16 }}>×</button>
    </div>
  );
}

function Modal({ title, onClose, children, wide }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.8)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:16, backdropFilter:"blur(6px)" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:card, border:`1px solid ${cardBorder}`, borderRadius:20, width:"100%", maxWidth: wide ? 680 : 520, maxHeight:"90vh", display:"flex", flexDirection:"column", boxShadow:"0 32px 80px rgba(0,0,0,.7)", animation:"fadeUp .3s ease" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"22px 28px 16px", borderBottom:`1px solid ${cardBorder}` }}>
          <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:700, color:goldLight }}>{title}</h3>
          <button onClick={onClose} style={{ background:surface, border:"none", color:"#888", borderRadius:8, width:32, height:32, cursor:"pointer", fontSize:18, display:"flex", alignItems:"center", justifyContent:"center" }}>×</button>
        </div>
        <div style={{ padding:"22px 28px", overflowY:"auto" }}>{children}</div>
      </div>
    </div>
  );
}

function Field({ label, error, children }: any) {
  return (
    <div style={{ marginBottom:16 }}>
      {label && <label style={{ display:"block", fontSize:12, fontWeight:600, color:gold, marginBottom:6, letterSpacing:.8, textTransform:"uppercase" }}>{label}</label>}
      {children}
      {error && <div style={{ fontSize:12, color:"#f87171", marginTop:4 }}>{error}</div>}
    </div>
  );
}

function Input({ label, error, ...props }: any) {
    const [focus, setFocus] = useState(false);
   // ✅ correct ref placement
  const inputRef = useRef<HTMLInputElement | null>(null);
  return (
    <Field label={label} error={error}>
          <input ref={inputRef}  {...props} onFocus={e => { setFocus(true); props.onFocus?.(e); }} onBlur={e => { setFocus(false); props.onBlur?.(e); }}
        style={{ width:"100%", background:surface, border:`1.5px solid ${focus ? gold : "rgba(255,255,255,.1)"}`, borderRadius:10, padding:"11px 14px", color:"#f0ede8", fontSize:15, outline:"none", transition:"border .2s", ...(props.style||{}) }} />
    </Field>
  );
}

function Select({ label, children, ...props }) {
  return (
    <Field label={label}>
      <select {...props} style={{ width:"100%", background:surface, border:"1.5px solid rgba(255,255,255,.1)", borderRadius:10, padding:"11px 14px", color:"#f0ede8", fontSize:15, outline:"none" }}>
        {children}
      </select>
    </Field>
  );
}

function Textarea({ label, ...props }) {
  return (
    <Field label={label}>
      <textarea {...props} style={{ width:"100%", background:surface, border:"1.5px solid rgba(255,255,255,.1)", borderRadius:10, padding:"11px 14px", color:"#f0ede8", fontSize:15, outline:"none", resize:"vertical", minHeight:80, fontFamily:"inherit" }} />
    </Field>
  );
}

function Btn({ children, variant="gold", size="md", full, ...props }: any) {
  const [hov, setHov] = useState(false);
  const variants = {
    gold: { background: hov ? "#e8c97e" : `linear-gradient(135deg,${gold},#a07840)`, color:"#0a0a0f", border:"none" },
    ghost: { background: hov ? "rgba(201,169,110,.12)" : "transparent", color:gold, border:`1px solid ${gold}` },
    danger: { background: hov ? "#dc2626" : "#991b1b", color:"#fff", border:"none" },
    dark: { background: hov ? surface : "rgba(255,255,255,.06)", color:"#ccc", border:"1px solid rgba(255,255,255,.1)" },
  };
  const sizes = { sm:"8px 16px", md:"12px 24px", lg:"15px 36px" };
  return (
    <button {...props} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ ...variants[variant], padding:sizes[size], borderRadius:10, fontWeight:700, fontSize:size==="sm"?13:15, cursor:"pointer", display:"inline-flex", alignItems:"center", justifyContent:"center", gap:8, transition:"all .2s", width:full?"100%":undefined, fontFamily:"inherit", ...(props.style||{}) }}>
      {children}
    </button>
  );
}

function Badge({ status }) {
  const map = { available:["#052e16","#22c55e","Available"], booked:["#450a0a","#ef4444","Booked"], confirmed:["#052e16","#22c55e","Confirmed"], cancelled:["#1c1c1c","#666","Cancelled"], maintenance:["#431407","#f97316","Maintenance"] };
  const [bg, clr, label] = map[status?.toLowerCase()] || map.available;
  return <span style={{ background:bg, color:clr, border:`1px solid ${clr}33`, padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700, letterSpacing:.6 }}>{label}</span>;
}

function StarRating({ count }) {
  return <span style={{ color:gold, fontSize:14 }}>{"★".repeat(count)}{"☆".repeat(5-count)}</span>;
}

// ── ROOM CARD ─────────────────────────────────────────────────────────────────
function RoomCard({ room, hotel, onBook, onEdit, onDelete, isAdmin }) {
  const [hov, setHov] = useState(false);
  const typeColors = { Standard:"#1a2a1a", Deluxe:"#1a1a2e", Suite:"#2a1a2a", Presidential:"#2a1e0a" };
  const typeBorder = { Standard:"#22c55e", Deluxe:"#818cf8", Suite:"#e879f9", Presidential:gold };

  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background:card, border:`1px solid ${hov ? cardBorder : "rgba(255,255,255,.06)"}`, borderRadius:18, overflow:"hidden", transition:"all .3s", transform:hov?"translateY(-4px)":"translateY(0)", boxShadow: hov?"0 20px 50px rgba(0,0,0,.5)":"0 4px 20px rgba(0,0,0,.3)", display:"flex", flexDirection:"column" }}>

      {/* Image */}
      <div style={{ height:200, position:"relative", overflow:"hidden", background:"linear-gradient(135deg,#1a1a2e,#0f0f1a)" }}>
        {room.image
          ? <img src={room.image} alt={room.name} style={{ width:"100%", height:"100%", objectFit:"cover", transition:"transform .4s", transform:hov?"scale(1.05)":"scale(1)" }} />
          : <div style={{ height:"100%", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:8 }}>
              <span style={{ fontSize:52 }}>🛏️</span>
              <span style={{ fontSize:12, color:"#444" }}>No photo uploaded</span>
            </div>
        }
        {/* Type badge */}
        <div style={{ position:"absolute", top:12, left:12, background:typeColors[room.type]||"#1a1a2e", border:`1px solid ${typeBorder[room.type]||gold}`, color:typeBorder[room.type]||gold, padding:"4px 12px", borderRadius:20, fontSize:11, fontWeight:700, letterSpacing:.6 }}>{room.type}</div>
        <div style={{ position:"absolute", top:12, right:12 }}><Badge status={room.status} /></div>
        {/* Price overlay */}
        <div style={{ position:"absolute", bottom:0, left:0, right:0, background:"linear-gradient(transparent,rgba(0,0,0,.85))", padding:"20px 16px 12px" }}>
          <span style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:700, color:gold }}>${room.price}</span>
          <span style={{ fontSize:12, color:"#aaa" }}> / night</span>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding:"16px 18px", flex:1, display:"flex", flexDirection:"column", gap:8 }}>
        <div>
          <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:17, fontWeight:700, color:"#f0ede8", marginBottom:2 }}>{room.name}</h3>
          {hotel && <div style={{ fontSize:12, color:"#888" }}>🏨 {hotel.hotelName} {hotel.stars && <StarRating count={+hotel.stars} />}</div>}
        </div>
        <div style={{ fontSize:13, color:"#666" }}>
          {room.floor && `Floor ${room.floor}  ·  `}👥 Up to {room.capacity} guests
        </div>
        {room.description && <p style={{ fontSize:13, color:"#888", lineHeight:1.55, flex:1 }}>{room.description.slice(0,90)}{room.description.length>90?"…":""}</p>}
        {room.amenities?.length > 0 && (
          <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
            {(Array.isArray(room.amenities) ? room.amenities : room.amenities.split(",")).slice(0,4).map(a => (
              <span key={a} style={{ background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.08)", color:"#aaa", padding:"2px 8px", borderRadius:8, fontSize:11 }}>{a.trim()}</span>
            ))}
          </div>
        )}
        <div style={{ display:"flex", gap:8, marginTop:4 }}>
          {isAdmin ? (
            <>
              <Btn variant="ghost" size="sm" onClick={onEdit} style={{ flex:1 }}>✏️ Edit</Btn>
              <Btn variant="danger" size="sm" onClick={onDelete} style={{ flex:1 }}>🗑 Delete</Btn>
            </>
          ) : (
            <Btn variant={room.status==="available"?"gold":"dark"} full onClick={room.status==="available" ? onBook : undefined}
              style={{ opacity: room.status==="available"?1:.5, cursor:room.status==="available"?"pointer":"not-allowed" }}>
              {room.status==="available" ? "✦ Book This Room" : "Unavailable"}
            </Btn>
          )}
        </div>
      </div>
    </div>
  );
}

// ── ROOM FORM MODAL ───────────────────────────────────────────────────────────
function RoomFormModal({ room, onClose, onSave }) {
  const [form, setForm] = useState({ name:room?.name||"", type:room?.type||"Standard", floor:room?.floor||"", capacity:room?.capacity||2, price:room?.price||"", description:room?.description||"", amenities:room?.amenities||[], image:room?.image||"" });
  const [preview, setPreview] = useState(room?.image||"");
    const fileRef = useRef<HTMLInputElement | null>(null);

  const amenityList = ["WiFi","AC","TV","Mini Bar","Jacuzzi","Balcony","Sea View","Pool Access","Breakfast Included","Parking","Safe","Bathrobe"];

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const toggleAmenity = a => setForm(f => ({ ...f, amenities: f.amenities.includes(a) ? f.amenities.filter(x=>x!==a) : [...f.amenities, a] }));

  const handleImg = e => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { setPreview(ev.target.result); setForm(f => ({ ...f, image: ev.target.result })); };
    reader.readAsDataURL(file);
  };

  return (
    <Modal title={room ? "Edit Room" : "Add New Room"} onClose={onClose} wide>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        <div style={{ gridColumn:"1/-1" }}><Input label="Room Name / Number *" value={form.name} onChange={set("name")} placeholder="e.g. The Royal Suite" /></div>
        <Select label="Room Type" value={form.type} onChange={set("type")}>
          {["Standard","Deluxe","Suite","Presidential"].map(t=><option key={t}>{t}</option>)}
        </Select>
        <Input label="Floor" value={form.floor} onChange={set("floor")} placeholder="3" type="number" />
        <Input label="Max Guests" value={form.capacity} onChange={set("capacity")} type="number" min="1" max="20" />
        <Input label="Price per Night (USD) *" value={form.price} onChange={set("price")} type="number" placeholder="299" />
        <div style={{ gridColumn:"1/-1" }}><Textarea label="Description" value={form.description} onChange={set("description")} placeholder="Describe this room..." /></div>
      </div>

      {/* Amenities */}
      <Field label="Amenities">
        <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
          {amenityList.map(a => (
            <span key={a} onClick={() => toggleAmenity(a)} style={{ padding:"6px 14px", borderRadius:20, fontSize:12, fontWeight:600, cursor:"pointer", transition:"all .15s", background: form.amenities.includes(a) ? gold : "rgba(255,255,255,.05)", color: form.amenities.includes(a) ? "#0a0a0f" : "#888", border:`1px solid ${form.amenities.includes(a)?gold:"rgba(255,255,255,.1)"}` }}>
              {a}
            </span>
          ))}
        </div>
      </Field>

      {/* Image upload */}
      <Field label="Room Photo">
        <div onClick={() => fileRef.current.click()} style={{ border:`2px dashed ${preview?"rgba(201,169,110,.4)":"rgba(255,255,255,.1)"}`, borderRadius:14, padding:16, textAlign:"center", cursor:"pointer", background:"rgba(255,255,255,.02)", transition:"border .2s", minHeight:120, display:"flex", alignItems:"center", justifyContent:"center" }}>
          {preview
            ? <img src={preview} alt="preview" style={{ maxHeight:160, borderRadius:10, objectFit:"cover", width:"100%" }} />
            : <div><div style={{ fontSize:36, marginBottom:8 }}>📷</div><div style={{ color:gold, fontWeight:600, fontSize:14 }}>Click to upload room photo</div><div style={{ color:"#555", fontSize:12, marginTop:4 }}>JPG, PNG or WEBP</div></div>
          }
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleImg} style={{ display:"none" }} />
        {preview && <button onClick={() => { setPreview(""); setForm(f=>({...f,image:""})); }} style={{ background:"none", border:"none", color:"#ef4444", cursor:"pointer", fontSize:13, marginTop:6, fontWeight:600 }}>Remove photo</button>}
      </Field>

      <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:8 }}>
        <Btn variant="dark" onClick={onClose}>Cancel</Btn>
        <Btn onClick={() => { if(!form.name||!form.price) return; onSave(form); }}>
          {room ? "Save Changes" : "✦ Add Room"}
        </Btn>
      </div>
    </Modal>
  );
}

// ── BOOKING MODAL ─────────────────────────────────────────────────────────────
function BookingModal({ room, hotel, onClose, onBook }) {
  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState({ guestName:"", guestEmail:"", guestPhone:"", guests:1, checkIn:today, checkOut:"", specialRequests:"" });
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const n = form.checkIn && form.checkOut ? nights(form.checkIn, form.checkOut) : 0;
  const total = n * +room.price;

  return (
    <Modal title="Reserve Your Stay" onClose={onClose} wide>
      {/* Room summary */}
      <div style={{ background:surface, border:`1px solid ${cardBorder}`, borderRadius:14, padding:16, marginBottom:20, display:"flex", gap:14, alignItems:"center" }}>
        {room.image && <img src={room.image} alt="" style={{ width:80, height:65, objectFit:"cover", borderRadius:10 }} />}
        <div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:17, fontWeight:700, color:goldLight }}>{room.name}</div>
          {hotel && <div style={{ fontSize:13, color:"#888" }}>🏨 {hotel.hotelName}</div>}
          <div style={{ fontSize:15, fontWeight:700, color:gold, marginTop:4 }}>${room.price} <span style={{ fontSize:12, fontWeight:400, color:"#666" }}>per night</span></div>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        <div style={{ gridColumn:"1/-1" }}><Input label="Full Name *" value={form.guestName} onChange={set("guestName")} placeholder="John Doe" /></div>
        <Input label="Email Address *" type="email" value={form.guestEmail} onChange={set("guestEmail")} placeholder="john@email.com" />
        <Input label="Phone Number" value={form.guestPhone} onChange={set("guestPhone")} placeholder="+1 555 0000" />
        <Input label="Check-In Date *" type="date" value={form.checkIn} min={today} onChange={set("checkIn")} />
        <Input label="Check-Out Date *" type="date" value={form.checkOut} min={form.checkIn||today} onChange={set("checkOut")} />
        <div style={{ gridColumn:"1/-1" }}><Input label={`Guests (max ${room.capacity})`} type="number" min="1" max={room.capacity} value={form.guests} onChange={set("guests")} /></div>
        <div style={{ gridColumn:"1/-1" }}><Textarea label="Special Requests" value={form.specialRequests} onChange={set("specialRequests")} placeholder="Any special needs or preferences..." /></div>
      </div>

      {/* Price summary */}
      {n > 0 && (
        <div style={{ background:"rgba(201,169,110,.06)", border:`1px solid rgba(201,169,110,.2)`, borderRadius:12, padding:16, marginTop:4, marginBottom:16 }}>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:14, color:"#aaa", marginBottom:6 }}>
            <span>${room.price} × {n} night{n>1?"s":""}</span><span style={{ color:goldLight }}>${(n * +room.price).toLocaleString()}</span>
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:18, fontWeight:800, color:gold, borderTop:"1px solid rgba(201,169,110,.2)", paddingTop:10 }}>
            <span>Total</span><span>${total.toLocaleString()}</span>
          </div>
        </div>
      )}

      <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
        <Btn variant="dark" onClick={onClose}>Cancel</Btn>
        <Btn onClick={() => { if(!form.guestName||!form.guestEmail||!form.checkIn||!form.checkOut||n<=0) return; onBook({...form, nights:n, totalPrice:total}); }}>
          ✦ Confirm Booking — ${total.toLocaleString()}
        </Btn>
      </div>
    </Modal>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SCREENS
// ══════════════════════════════════════════════════════════════════════════════

// ── LANDING ───────────────────────────────────────────────────────────────────
function Landing({ onAdmin, onGuest }) {
  return (
    <div style={{ minHeight:"100vh", background:dark, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:24, position:"relative", overflow:"hidden" }}>
      {/* Background decoration */}
      <div style={{ position:"absolute", inset:0, backgroundImage:"radial-gradient(ellipse 80% 50% at 50% -20%, rgba(201,169,110,.15), transparent)", pointerEvents:"none" }} />
      <div style={{ position:"absolute", top:"10%", left:"5%", width:300, height:300, background:"radial-gradient(circle, rgba(201,169,110,.04), transparent)", borderRadius:"50%" }} />
      <div style={{ position:"absolute", bottom:"10%", right:"5%", width:400, height:400, background:"radial-gradient(circle, rgba(139,92,246,.04), transparent)", borderRadius:"50%" }} />

      <div style={{ textAlign:"center", marginBottom:64, position:"relative" }}>
        <div style={{ fontSize:14, letterSpacing:6, color:gold, fontWeight:600, marginBottom:16, textTransform:"uppercase" }}>Welcome to</div>
        <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(52px,8vw,88px)", fontWeight:900, color:"#f0ede8", lineHeight:1, marginBottom:8 }}>
          Luxe<span style={{ color:gold }}>Stay</span>
        </h1>
        <div style={{ width:60, height:2, background:`linear-gradient(90deg,transparent,${gold},transparent)`, margin:"18px auto" }} />
        <p style={{ color:"#666", fontSize:17, maxWidth:400, margin:"0 auto", lineHeight:1.7 }}>
          The definitive hotel management & booking experience
        </p>
      </div>

      <div style={{ display:"flex", gap:20, flexWrap:"wrap", justifyContent:"center", position:"relative" }}>
        {[
          { emoji:"🔑", title:"Hotel Admin", sub:"Manage rooms, bookings & guests", action: onAdmin, variant:"gold" },
          { emoji:"🛎️", title:"Guest Portal", sub:"Browse & book your perfect room", action: onGuest, variant:"ghost" },
        ].map((c,i) => (
          <div key={i} onClick={c.action} style={{ background: i===0 ? `linear-gradient(135deg,rgba(201,169,110,.12),rgba(201,169,110,.04))` : "rgba(255,255,255,.02)", border:`1px solid ${i===0?gold+"44":"rgba(255,255,255,.08)"}`, borderRadius:20, padding:"36px 44px", cursor:"pointer", textAlign:"center", minWidth:220, transition:"all .25s", backdropFilter:"blur(10px)" }}
            onMouseEnter={e => { e.currentTarget.style.transform="translateY(-6px)"; e.currentTarget.style.boxShadow=`0 20px 50px rgba(201,169,110,.12)`; }}
            onMouseLeave={e => { e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="none"; }}>
            <div style={{ fontSize:44, marginBottom:14 }}>{c.emoji}</div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:21, fontWeight:700, color: i===0?gold:"#f0ede8", marginBottom:8 }}>{c.title}</div>
            <div style={{ fontSize:13, color:"#666", lineHeight:1.5 }}>{c.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ position:"absolute", bottom:28, color:"#333", fontSize:12, letterSpacing:1 }}>© 2026 LUXESTAY · ALL RIGHTS RESERVED</div>
    </div>
  );
}

// ── AUTH ──────────────────────────────────────────────────────────────────────
function AuthPage({ mode, onDone, onToggle, onBack, db, persist, showToast }) {
  const isLogin = mode === "login";
  const [form, setForm] = useState({ hotelName:"", address:"", email:"", password:"", phone:"", description:"", stars:"5" });
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = () => {
    if (isLogin) {
      const hotel = db.hotels.find(h => h.email === form.email && h.password === form.password);
        if (!hotel) return showToast("Invalid email or password", "error");
        if (rememberMe) {
            localStorage.setItem("email", form.email);
        } else {
            localStorage.removeItem("email");
        }

      onDone(hotel);
    } else {
      if (!form.hotelName || !form.email || !form.password) return showToast("Please fill all required fields", "error");
      if (db.hotels.find(h => h.email === form.email)) return showToast("Email already registered", "error");
      const hotel = { id: uid(), ...form, createdAt: new Date().toISOString() };
      persist({ ...db, hotels: [...db.hotels, hotel] });
      onDone(hotel);
      showToast(`Welcome, ${hotel.hotelName}! 🎉`);
    }
  };


    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [message, setMessage] = useState("");

    useEffect(() => {
        const savedEmail = localStorage.getItem("email");
        if (savedEmail) {
            setForm(prev => ({ ...prev, email: savedEmail }));
        }
    }, []);


  return (
    <div style={{ minHeight:"100vh", background:dark, display:"flex" }}>
      {/* Left panel */}
      <div style={{ flex:"0 0 45%", background:`linear-gradient(160deg,#0f0f1a,#1a1206)`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:48, position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, backgroundImage:`radial-gradient(ellipse 60% 60% at 30% 40%, rgba(201,169,110,.1), transparent)` }} />
        <div style={{ position:"relative", textAlign:"center" }}>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:52, fontWeight:900, color:"#f0ede8" }}>Luxe<span style={{ color:gold }}>Stay</span></div>
          <div style={{ width:40, height:2, background:gold, margin:"16px auto" }} />
          <p style={{ color:"#666", fontSize:15, lineHeight:1.7, maxWidth:260 }}>
            {isLogin ? "Sign in to manage your hotel, rooms and guest bookings." : "Register your hotel and start accepting bookings today."}
          </p>
          <div style={{ marginTop:40, display:"flex", flexDirection:"column", gap:14 }}>
            {["Real-time booking management","Room photo uploads","Guest cancellation system","Revenue dashboard"].map(f => (
              <div key={f} style={{ display:"flex", alignItems:"center", gap:10, color:"#888", fontSize:13 }}>
                <span style={{ color:gold, fontSize:16 }}>✦</span>{f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:48 }}>
        <div style={{ width:"100%", maxWidth:420 }} className="fade-up">
          <button onClick={onBack} style={{ background:"none", border:"none", color:gold, cursor:"pointer", marginBottom:24, fontSize:14, fontWeight:600, display:"flex", alignItems:"center", gap:6 }}>← Back to Home</button>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:32, fontWeight:800, color:"#f0ede8", marginBottom:6 }}>
            {isLogin ? "Welcome back" : "Register Hotel"}
          </h2>
                  <p style={{ color: "#666", marginBottom: 30, fontSize: 15 }}>{isLogin ? "Sign in to your admin panel" : "Create your hotel account"}</p>


          {!isLogin && <>
            <Input label="Hotel Name *" value={form.hotelName} onChange={set("hotelName")} placeholder="Grand Palace Hotel" />
            <Input label="Address" value={form.address} onChange={set("address")} placeholder="123 Main Street, City" />
            <Input label="Phone" value={form.phone} onChange={set("phone")} placeholder="+1 555 000 0000" />
            <Textarea label="Description" value={form.description} onChange={set("description")} placeholder="Describe your hotel..." />
            <Select label="Star Rating" value={form.stars} onChange={set("stars")}>
              {[3,4,5].map(s=><option key={s} value={s}>{s} Stars</option>)}
            </Select>
            </>}

          <Input label="Email Address *" type="email" value={form.email} onChange={set("email")} placeholder="admin@hotel.com" />
          <Input label="Password *" type={showPassword ? "text" : "password"} value={form.password} onChange={set("password")} placeholder="••••••••" />

          <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                  <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                   />
                   Remember me
           </label>

          <button type="button" onClick={() => setShowPassword(!showPassword )} style={{marginTop: 5}}>
             {showPassword ? "Hide" : "Show"}
          </button>
          <Btn full onClick={submit} style={{ marginTop:8, padding:"14px" }}>
            {isLogin ? "Sign In →" : "Create Hotel Account →"}
          </Btn>
          <p style={{ textAlign:"center", marginTop:20, fontSize:14, color:"#555" }}>
            {isLogin ? "New hotel?" : "Already registered?"}{" "}
            <span onClick={onToggle} style={{ color:gold, cursor:"pointer", fontWeight:700 }}>{isLogin ? "Register here" : "Sign in"}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

// ── ADMIN DASHBOARD ───────────────────────────────────────────────────────────
function AdminDashboard({ admin, db, persist, onLogout, showToast }) {
  const [tab, setTab] = useState("overview");
  const [modal, setModal] = useState(null);
  const rooms = db.rooms.filter(r => r.hotelId === admin.id);
  const bookings = db.bookings.filter(b => rooms.some(r => r.id === b.roomId));
  const revenue = bookings.filter(b=>b.status==="confirmed").reduce((s,b)=>s+(+b.totalPrice||0),0);

  const addRoom = data => { persist({ ...db, rooms:[...db.rooms, { id:uid(), hotelId:admin.id, ...data, status:"available", createdAt:new Date().toISOString() }] }); showToast("Room added!"); setModal(null); };
  const editRoom = (id, data) => { persist({ ...db, rooms:db.rooms.map(r=>r.id===id?{...r,...data}:r) }); showToast("Room updated!"); setModal(null); };
  const deleteRoom = id => { persist({ ...db, rooms:db.rooms.filter(r=>r.id!==id) }); showToast("Room deleted","info"); };
  const cancelBooking = id => {
    const b = db.bookings.find(x=>x.id===id);
    persist({ ...db, bookings:db.bookings.map(x=>x.id===id?{...x,status:"cancelled"}:x), rooms:db.rooms.map(r=>r.id===b?.roomId?{...r,status:"available"}:r) });
    showToast("Booking cancelled","info");
  };

  const tabs = [
    { id:"overview", icon:"◈", label:"Overview" },
    { id:"rooms", icon:"▦", label:"Rooms" },
    { id:"bookings", icon:"◷", label:"Bookings" },
  ];

  return (
    <div style={{ minHeight:"100vh", background:dark, display:"flex" }}>
      {modal}
      {/* Sidebar */}
      <div style={{ width:240, background:card, borderRight:`1px solid ${cardBorder}`, display:"flex", flexDirection:"column", padding:"28px 0", position:"sticky", top:0, height:"100vh" }}>
        <div style={{ padding:"0 24px", marginBottom:36 }}>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:900, color:"#f0ede8" }}>Luxe<span style={{ color:gold }}>Stay</span></div>
          <div style={{ fontSize:11, color:gold, letterSpacing:2, marginTop:2, textTransform:"uppercase" }}>Admin Panel</div>
        </div>
        <div style={{ padding:"0 14px 0", flex:1 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ width:"100%", padding:"12px 16px", background:tab===t.id?`rgba(201,169,110,.1)`:"transparent", border:`1px solid ${tab===t.id?gold+"33":"transparent"}`, borderRadius:10, color:tab===t.id?gold:"#666", cursor:"pointer", display:"flex", alignItems:"center", gap:12, marginBottom:4, fontSize:14, fontWeight:tab===t.id?700:400, transition:"all .2s", textAlign:"left" }}>
              <span style={{ fontSize:16 }}>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>
        <div style={{ padding:"0 14px" }}>
          <div style={{ padding:"14px 16px", background:surface, borderRadius:12, marginBottom:12 }}>
            <div style={{ fontSize:12, color:"#555", marginBottom:2 }}>Signed in as</div>
            <div style={{ fontSize:14, fontWeight:700, color:goldLight }}>{admin.hotelName}</div>
            <StarRating count={+admin.stars||4} />
          </div>
          <button onClick={onLogout} style={{ width:"100%", padding:"10px 16px", background:"rgba(239,68,68,.08)", border:"1px solid rgba(239,68,68,.2)", borderRadius:10, color:"#ef4444", cursor:"pointer", fontSize:13, fontWeight:600 }}>Sign Out</button>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex:1, overflowY:"auto", padding:"36px 40px" }}>
        {tab === "overview" && (
          <div className="fade-up">
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:28, fontWeight:800, color:"#f0ede8", marginBottom:6 }}>Dashboard</h2>
            <p style={{ color:"#555", marginBottom:32 }}>Welcome back, {admin.hotelName}</p>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:16, marginBottom:36 }}>
              {[
                { label:"Total Rooms", value:rooms.length, icon:"🛏️", clr:"#818cf8" },
                { label:"Available", value:rooms.filter(r=>r.status==="available").length, icon:"✅", clr:"#22c55e" },
                { label:"Booked", value:rooms.filter(r=>r.status==="booked").length, icon:"📋", clr:"#f59e0b" },
                { label:"Total Revenue", value:`$${revenue.toLocaleString()}`, icon:"💰", clr:gold },
                { label:"Bookings", value:bookings.filter(b=>b.status==="confirmed").length, icon:"📅", clr:"#0ea5e9" },
              ].map(s => (
                <div key={s.label} style={{ background:card, border:`1px solid rgba(255,255,255,.05)`, borderRadius:16, padding:"22px 20px", borderLeft:`3px solid ${s.clr}` }}>
                  <div style={{ fontSize:28, marginBottom:10 }}>{s.icon}</div>
                  <div style={{ fontSize:26, fontWeight:900, color:s.clr, fontFamily:"'Playfair Display',serif" }}>{s.value}</div>
                  <div style={{ fontSize:12, color:"#555", fontWeight:600, marginTop:2 }}>{s.label}</div>
                </div>
              ))}
            </div>
            {/* Recent bookings */}
            <div style={{ background:card, border:`1px solid rgba(255,255,255,.05)`, borderRadius:16, padding:24 }}>
              <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:700, color:goldLight, marginBottom:18 }}>Recent Bookings</h3>
              {bookings.length === 0
                ? <div style={{ textAlign:"center", padding:40, color:"#444" }}>No bookings yet</div>
                : bookings.slice(-5).reverse().map(b => {
                    const room = rooms.find(r=>r.id===b.roomId);
                    return (
                      <div key={b.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 0", borderBottom:"1px solid rgba(255,255,255,.04)" }}>
                        <div>
                          <div style={{ fontWeight:700, color:"#f0ede8", fontSize:15 }}>{b.guestName}</div>
                          <div style={{ fontSize:12, color:"#555" }}>{room?.name} · {b.checkIn} → {b.checkOut}</div>
                        </div>
                        <div style={{ textAlign:"right" }}>
                          <Badge status={b.status} />
                          <div style={{ fontSize:14, fontWeight:700, color:gold, marginTop:4 }}>${(+b.totalPrice).toLocaleString()}</div>
                        </div>
                      </div>
                    );
                  })
              }
            </div>
          </div>
        )}

        {tab === "rooms" && (
          <div className="fade-up">
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:28 }}>
              <div>
                <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:28, fontWeight:800, color:"#f0ede8" }}>Rooms</h2>
                <p style={{ color:"#555", fontSize:14 }}>{rooms.length} room{rooms.length!==1?"s":""} in your hotel</p>
              </div>
              <Btn onClick={() => setModal(<RoomFormModal onClose={() => setModal(null)} onSave={addRoom} room={undefined} />)}>✦ Add Room</Btn>
            </div>
            {rooms.length === 0
              ? <div style={{ textAlign:"center", padding:80, background:card, borderRadius:20, border:`1px solid rgba(255,255,255,.04)` }}>
                  <div style={{ fontSize:52, marginBottom:12 }}>🛏️</div>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontSize:20, color:goldLight }}>No rooms yet</div>
                  <div style={{ color:"#555", marginTop:6 }}>Click "Add Room" to get started</div>
                </div>
              : <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:20 }}>
                  {rooms.map(room => (
                    <RoomCard key={room.id} room={room} hotel={admin} isAdmin
                      onEdit={() => setModal(<RoomFormModal room={room} onClose={() => setModal(null)} onSave={d => editRoom(room.id, d)} />)}
                      onDelete={() => deleteRoom(room.id)} onBook={undefined} />
                  ))}
                </div>
            }
          </div>
        )}

        {tab === "bookings" && (
          <div className="fade-up">
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:28, fontWeight:800, color:"#f0ede8", marginBottom:28 }}>All Bookings</h2>
            {bookings.length === 0
              ? <div style={{ textAlign:"center", padding:80, background:card, borderRadius:20, border:`1px solid rgba(255,255,255,.04)` }}>
                  <div style={{ fontSize:52 }}>📋</div>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontSize:20, color:goldLight, marginTop:12 }}>No bookings yet</div>
                </div>
              : <div style={{ background:card, borderRadius:16, border:`1px solid rgba(255,255,255,.05)`, overflow:"hidden" }}>
                  <table style={{ width:"100%", borderCollapse:"collapse" }}>
                    <thead>
                      <tr style={{ background:"rgba(255,255,255,.02)" }}>
                        {["Guest","Room","Check-In","Check-Out","Guests","Total","Status","Action"].map(h => (
                          <th key={h} style={{ padding:"14px 16px", textAlign:"left", fontSize:11, fontWeight:700, color:gold, letterSpacing:.8, textTransform:"uppercase", borderBottom:"1px solid rgba(255,255,255,.05)" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map(b => {
                        const room = rooms.find(r=>r.id===b.roomId);
                        return (
                          <tr key={b.id} style={{ borderBottom:"1px solid rgba(255,255,255,.03)" }}>
                            <td style={{ padding:"12px 16px" }}>
                              <div style={{ fontWeight:700, fontSize:14, color:"#f0ede8" }}>{b.guestName}</div>
                              <div style={{ fontSize:11, color:"#555" }}>{b.guestEmail}</div>
                            </td>
                            <td style={{ padding:"12px 16px", fontSize:13, color:"#aaa" }}>{room?.name}</td>
                            <td style={{ padding:"12px 16px", fontSize:13, color:"#aaa" }}>{b.checkIn}</td>
                            <td style={{ padding:"12px 16px", fontSize:13, color:"#aaa" }}>{b.checkOut}</td>
                            <td style={{ padding:"12px 16px", fontSize:13, color:"#aaa" }}>{b.guests}</td>
                            <td style={{ padding:"12px 16px", fontSize:14, fontWeight:700, color:gold }}>${(+b.totalPrice).toLocaleString()}</td>
                            <td style={{ padding:"12px 16px" }}><Badge status={b.status} /></td>
                            <td style={{ padding:"12px 16px" }}>
                              {b.status==="confirmed" && <Btn variant="danger" size="sm" onClick={() => cancelBooking(b.id)}>Cancel</Btn>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
            }
          </div>
        )}
      </div>
    </div>
  );
}

// ── GUEST PORTAL ──────────────────────────────────────────────────────────────
function GuestPortal({ db, persist, onBack, showToast }) {
  const [tab, setTab] = useState("browse");
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [filterHotel, setFilterHotel] = useState("All");
  const [modal, setModal] = useState(null);
  const [emailInput, setEmailInput] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [emailChecked, setEmailChecked] = useState(false);

  const available = db.rooms.filter(r => r.status === "available");
  const filtered = available.filter(r => {
    const hotel = db.hotels.find(h => h.id === r.hotelId);
    const s = search.toLowerCase();
    return (r.name.toLowerCase().includes(s) || hotel?.hotelName.toLowerCase().includes(s) || r.description?.toLowerCase().includes(s))
      && (filterType==="All" || r.type===filterType)
      && (filterHotel==="All" || r.hotelId===filterHotel);
  });

  const makeBooking = (roomId, data) => {
    const booking = { id:uid(), roomId, ...data, status:"confirmed", createdAt:new Date().toISOString() };
    persist({ ...db, bookings:[...db.bookings, booking], rooms:db.rooms.map(r=>r.id===roomId?{...r,status:"booked"}:r) });
    showToast("Booking confirmed! 🎉");
    setModal(null);
  };

  const cancelBooking = id => {
    const b = db.bookings.find(x=>x.id===id);
    persist({ ...db, bookings:db.bookings.map(x=>x.id===id?{...x,status:"cancelled"}:x), rooms:db.rooms.map(r=>r.id===b?.roomId?{...r,status:"available"}:r) });
    showToast("Booking cancelled","info");
  };

  const myBookings = guestEmail ? db.bookings.filter(b=>b.guestEmail?.toLowerCase()===guestEmail.toLowerCase()) : [];

  return (
    <div style={{ minHeight:"100vh", background:dark }}>
      {modal}
      {/* Header */}
      <div style={{ background:card, borderBottom:`1px solid ${cardBorder}`, padding:"0 36px", position:"sticky", top:0, zIndex:100 }}>
        <div style={{ maxWidth:1200, margin:"0 auto", display:"flex", justifyContent:"space-between", alignItems:"center", height:64 }}>
          <div style={{ display:"flex", alignItems:"center", gap:24 }}>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:900, color:"#f0ede8", cursor:"pointer" }} onClick={onBack}>
              Luxe<span style={{ color:gold }}>Stay</span>
            </div>
            <div style={{ display:"flex", gap:4 }}>
              {[{ id:"browse", label:"Browse Rooms" }, { id:"mybookings", label:"My Bookings" }].map(t => (
                <button key={t.id} onClick={() => setTab(t.id)} style={{ padding:"8px 18px", background:tab===t.id?`rgba(201,169,110,.1)`:"transparent", border:tab===t.id?`1px solid ${gold}33`:"1px solid transparent", borderRadius:8, color:tab===t.id?gold:"#555", cursor:"pointer", fontSize:13, fontWeight:tab===t.id?700:400, transition:"all .2s" }}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <button onClick={onBack} style={{ background:"none", border:`1px solid rgba(255,255,255,.1)`, color:"#888", padding:"8px 16px", borderRadius:8, cursor:"pointer", fontSize:13 }}>← Home</button>
        </div>
      </div>

      <div style={{ maxWidth:1200, margin:"0 auto", padding:"36px 36px" }}>
        {tab === "browse" && (
          <div>
            {/* Hero */}
            <div style={{ textAlign:"center", marginBottom:40 }} className="fade-up">
              <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(32px,5vw,52px)", fontWeight:900, color:"#f0ede8", marginBottom:8 }}>
                Find Your Perfect <span style={{ color:gold }}>Room</span>
              </h1>
              <p style={{ color:"#555", fontSize:16 }}>{available.length} room{available.length!==1?"s":""} available across {db.hotels.length} hotel{db.hotels.length!==1?"s":""}</p>
            </div>

            {/* Filters */}
            <div style={{ background:card, border:`1px solid rgba(255,255,255,.05)`, borderRadius:16, padding:18, marginBottom:32, display:"flex", gap:12, flexWrap:"wrap", alignItems:"center" }} className="fade-up-2">
              <div style={{ flex:1, minWidth:200, display:"flex", alignItems:"center", background:surface, border:"1px solid rgba(255,255,255,.08)", borderRadius:10, padding:"10px 14px", gap:8 }}>
                <span style={{ color:"#444" }}>🔍</span>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search rooms or hotels..." style={{ border:"none", background:"none", outline:"none", color:"#f0ede8", fontSize:14, flex:1, fontFamily:"inherit" }} />
              </div>
              <select value={filterType} onChange={e=>setFilterType(e.target.value)} style={{ padding:"10px 14px", border:"1px solid rgba(255,255,255,.08)", borderRadius:10, background:surface, color:"#f0ede8", fontSize:13, fontFamily:"inherit" }}>
                <option value="All">All Types</option>
                {["Standard","Deluxe","Suite","Presidential"].map(t=><option key={t}>{t}</option>)}
              </select>
              <select value={filterHotel} onChange={e=>setFilterHotel(e.target.value)} style={{ padding:"10px 14px", border:"1px solid rgba(255,255,255,.08)", borderRadius:10, background:surface, color:"#f0ede8", fontSize:13, fontFamily:"inherit" }}>
                <option value="All">All Hotels</option>
                {db.hotels.map(h=><option key={h.id} value={h.id}>{h.hotelName}</option>)}
              </select>
              <span style={{ color:"#444", fontSize:13, whiteSpace:"nowrap" }}>{filtered.length} result{filtered.length!==1?"s":""}</span>
            </div>

            {filtered.length === 0
              ? <div style={{ textAlign:"center", padding:80, background:card, borderRadius:20, border:`1px solid rgba(255,255,255,.04)` }}>
                  <div style={{ fontSize:52 }}>🔍</div>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, color:goldLight, marginTop:12 }}>No rooms found</div>
                  <div style={{ color:"#555", marginTop:6 }}>Try different filters</div>
                </div>
              : <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:22 }}>
                  {filtered.map(room => {
                    const hotel = db.hotels.find(h=>h.id===room.hotelId);
                    return <RoomCard key={room.id} room={room} hotel={hotel}
                    onBook={() => setModal(<BookingModal room={room} hotel={hotel} onClose={() => setModal(null)} onBook={data => makeBooking(room.id, data)} />)} onEdit={undefined} onDelete={undefined} isAdmin={undefined} />;
                  })}
                </div>
            }
          </div>
        )}

        {tab === "mybookings" && (
          <div className="fade-up">
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:32, fontWeight:800, color:"#f0ede8", marginBottom:6 }}>My Bookings</h2>
            <p style={{ color:"#555", marginBottom:32 }}>Enter your email to view your reservations</p>

            {!emailChecked ? (
              <div style={{ background:card, border:`1px solid rgba(255,255,255,.05)`, borderRadius:20, padding:48, maxWidth:440, margin:"0 auto", textAlign:"center" }}>
                <div style={{ fontSize:48, marginBottom:16 }}>📬</div>
                <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:22, color:goldLight, marginBottom:8 }}>Find Your Bookings</h3>
                <p style={{ color:"#555", marginBottom:24, fontSize:14 }}>Enter the email you used when booking</p>
                <Input value={emailInput} onChange={e=>setEmailInput(e.target.value)} placeholder="your@email.com" type="email" />
                <Btn full onClick={() => { setGuestEmail(emailInput); setEmailChecked(true); }}>Search Bookings</Btn>
              </div>
            ) : (
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
                  <div style={{ color:"#888", fontSize:14 }}>Showing bookings for <span style={{ color:gold, fontWeight:700 }}>{guestEmail}</span></div>
                  <Btn variant="dark" size="sm" onClick={() => { setEmailChecked(false); setEmailInput(""); setGuestEmail(""); }}>Change Email</Btn>
                </div>
                {myBookings.length === 0
                  ? <div style={{ textAlign:"center", padding:60, background:card, borderRadius:20, border:`1px solid rgba(255,255,255,.04)` }}>
                      <div style={{ fontSize:48 }}>📭</div>
                      <div style={{ fontFamily:"'Playfair Display',serif", fontSize:20, color:goldLight, marginTop:12 }}>No bookings found</div>
                      <div style={{ color:"#555", marginTop:6 }}>Make a booking from the Browse tab</div>
                    </div>
                  : <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                      {myBookings.map(b => {
                        const room = db.rooms.find(r=>r.id===b.roomId);
                        const hotel = db.hotels.find(h=>h.id===room?.hotelId);
                        return (
                          <div key={b.id} style={{ background:card, border:`1px solid rgba(255,255,255,.05)`, borderRadius:18, padding:22, display:"flex", gap:18, alignItems:"flex-start" }}>
                            <div style={{ width:110, height:90, borderRadius:12, overflow:"hidden", flexShrink:0, background:surface }}>
                              {room?.image ? <img src={room.image} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100%", fontSize:32 }}>🛏️</div>}
                            </div>
                            <div style={{ flex:1 }}>
                              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                                <div>
                                  <div style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:700, color:"#f0ede8" }}>{room?.name || "Room"}</div>
                                  {hotel && <div style={{ fontSize:13, color:"#666" }}>🏨 {hotel.hotelName}</div>}
                                  <div style={{ fontSize:13, color:"#666", marginTop:6 }}>📅 {b.checkIn} → {b.checkOut} · 👥 {b.guests} guest{b.guests>1?"s":""}</div>
                                  {b.specialRequests && <div style={{ fontSize:12, color:"#555", marginTop:4 }}>💬 {b.specialRequests}</div>}
                                </div>
                                <div style={{ textAlign:"right" }}>
                                  <Badge status={b.status} />
                                  <div style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:800, color:gold, marginTop:6 }}>${(+b.totalPrice).toLocaleString()}</div>
                                  <div style={{ fontSize:11, color:"#555" }}>{b.nights} night{b.nights>1?"s":""}</div>
                                </div>
                              </div>
                              {b.status==="confirmed" && (
                                <div style={{ marginTop:14 }}>
                                  <Btn variant="danger" size="sm" onClick={() => cancelBooking(b.id)}>Cancel Booking</Btn>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                }
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ROOT
// ══════════════════════════════════════════════════════════════════════════════
export default function App() {

    const [db, setDb] = useState(load);
    const [screen, setScreen] = useState("landing");
    const [authMode, setAuthMode] = useState("login");
    const [admin, setAdmin] = useState(null);
    const [toast, setToast] = useState(null);

    // API rooms
    const [rooms, setRooms] = useState<any[]>([]);

    // API call
    useEffect(() => {
        API.get("/Rooms")
            .then(res => {
                console.log("API WORKING:", res.data);
                setRooms(res.data);
            })
            .catch(err => {
                console.log("API ERROR:", err);
            });
    }, []);

    const persist = (d: any) => {
        setDb(d);
        save(d);
    };

    const showToast = (msg: string, type = "success") =>
        setToast({ msg, type });

    return (
        <>
            <style>{STYLES}</style>

            {toast && (
                <Toast
                    msg={toast.msg}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}

            {/* API ROOM TEST */}
            <div>
                {rooms.map((room: any) => (
                    <h1 key={room.id}>{room.name}</h1>
                ))}
            </div>

            {screen === "landing" && (
                <Landing
                    onAdmin={() => {
                        setAuthMode("login");
                        setScreen("auth");
                    }}
                    onGuest={() => setScreen("guest")}
                />
            )}

            {screen === "auth" && (
                <AuthPage
                    mode={authMode}
                    db={db}
                    persist={persist}
                    showToast={showToast}
                    onDone={(hotel: any) => {
                        setAdmin(hotel);
                        setScreen("admin");
                    }}
                    onToggle={() =>
                        setAuthMode(m => (m === "login" ? "register" : "login"))
                    }
                    onBack={() => setScreen("landing")}
                />
            )}

            {screen === "admin" && admin && (
                <AdminDashboard
                    admin={admin}
                    db={db}
                    persist={persist}
                    showToast={showToast}
                    onLogout={() => {
                        setAdmin(null);
                        setScreen("landing");
                    }}
                />
            )}

            {screen === "guest" && (
                <GuestPortal
                    db={db}
                    persist={persist}
                    showToast={showToast}
                    onBack={() => setScreen("landing")}
                />
            )}
        </>
    );
}
