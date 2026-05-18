import { useState, useRef } from "react";
import { Modal, Input, Select, Textarea, Field, gold, Btn } from "./App";

// ── ROOM FORM MODAL ───────────────────────────────────────────────────────────
export function RoomFormModal({ room, onClose, onSave }) {
    const [form, setForm] = useState({ name: room?.name || "", type: room?.type || "Standard", floor: room?.floor || "", capacity: room?.capacity || 2, price: room?.price || "", description: room?.description || "", amenities: room?.amenities || [], image: room?.image || "" });
    const [preview, setPreview] = useState(room?.image || "");
    const fileRef = useRef();
    const amenityList = ["WiFi", "AC", "TV", "Mini Bar", "Jacuzzi", "Balcony", "Sea View", "Pool Access", "Breakfast Included", "Parking", "Safe", "Bathrobe"];

    const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
    const toggleAmenity = a => setForm(f => ({ ...f, amenities: f.amenities.includes(a) ? f.amenities.filter(x => x !== a) : [...f.amenities, a] }));

    const handleImg = e => {
        const file = e.target.files[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => { setPreview(ev.target.result); setForm(f => ({ ...f, image: ev.target.result })); };
        reader.readAsDataURL(file);
    };

    return (
        <Modal title={room ? "Edit Room" : "Add New Room"} onClose={onClose} wide>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={{ gridColumn: "1/-1" }}><Input label="Room Name / Number *" value={form.name} onChange={set("name")} placeholder="e.g. The Royal Suite" /></div>
                <Select label="Room Type" value={form.type} onChange={set("type")}>
                    {["Standard", "Deluxe", "Suite", "Presidential"].map(t => <option key={t}>{t}</option>)}
                </Select>
                <Input label="Floor" value={form.floor} onChange={set("floor")} placeholder="3" type="number" />
                <Input label="Max Guests" value={form.capacity} onChange={set("capacity")} type="number" min="1" max="20" />
                <Input label="Price per Night (USD) *" value={form.price} onChange={set("price")} type="number" placeholder="299" />
                <div style={{ gridColumn: "1/-1" }}><Textarea label="Description" value={form.description} onChange={set("description")} placeholder="Describe this room..." /></div>
            </div>

            {/* Amenities */}
            <Field label="Amenities">
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {amenityList.map(a => (
                        <span key={a} onClick={() => toggleAmenity(a)} style={{ padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all .15s", background: form.amenities.includes(a) ? gold : "rgba(255,255,255,.05)", color: form.amenities.includes(a) ? "#0a0a0f" : "#888", border: `1px solid ${form.amenities.includes(a) ? gold : "rgba(255,255,255,.1)"}` }}>
                            {a}
                        </span>
                    ))}
                </div>
            </Field>

            {/* Image upload */}
            <Field label="Room Photo">
                <div onClick={() => fileRef.current.click()} style={{ border: `2px dashed ${preview ? "rgba(201,169,110,.4)" : "rgba(255,255,255,.1)"}`, borderRadius: 14, padding: 16, textAlign: "center", cursor: "pointer", background: "rgba(255,255,255,.02)", transition: "border .2s", minHeight: 120, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {preview
                        ? <img src={preview} alt="preview" style={{ maxHeight: 160, borderRadius: 10, objectFit: "cover", width: "100%" }} />
                        : <div><div style={{ fontSize: 36, marginBottom: 8 }}>📷</div><div style={{ color: gold, fontWeight: 600, fontSize: 14 }}>Click to upload room photo</div><div style={{ color: "#555", fontSize: 12, marginTop: 4 }}>JPG, PNG or WEBP</div></div>}
                </div>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleImg} style={{ display: "none" }} />
                {preview && <button onClick={() => { setPreview(""); setForm(f => ({ ...f, image: "" })); }} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 13, marginTop: 6, fontWeight: 600 }}>Remove photo</button>}
            </Field>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
                <Btn variant="dark" onClick={onClose}>Cancel</Btn>
                <Btn onClick={() => { if (!form.name || !form.price) return; onSave(form); }}>
                    {room ? "Save Changes" : "✦ Add Room"}
                </Btn>
            </div>
        </Modal>
    );
}
