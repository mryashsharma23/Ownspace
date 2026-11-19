import { useEffect, useState } from "react";
import api, { errMsg } from "../api";
import Loading from "../components/Loading";
import Empty from "../components/Empty";
import { CITIES } from "../data/cities";

const empty = { name: "", location: "", city: "", totalSlots: "", pricePerHour: "" };

const titleCase = (s) =>
    s.trim().toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

async function locate(cityInput) {
    const typed = cityInput.trim();
    const known = CITIES.find((c) => c.city.toLowerCase() === typed.toLowerCase());
    if (known) return { city: known.city, state: known.state, lat: known.lat, lng: known.lng };

    const url =
        "https://nominatim.openstreetmap.org/search?format=json&limit=1&addressdetails=1&countrycodes=in&q=" +
        encodeURIComponent(typed);
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error("Couldn't look up this city right now. Please try again.");
    const [hit] = await res.json();
    if (!hit) throw new Error(`Couldn't find "${typed}" in India. Check the spelling.`);

    return {
        city: titleCase(typed),
        state: hit.address?.state || "",
        lat: Number(hit.lat),
        lng: Number(hit.lon),
    };
}

export default function AdminLots() {
    const [lots, setLots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState(empty);
    const [editId, setEditId] = useState(null);
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    const load = () =>
        api.get("/lots").then((r) => setLots(r.data)).finally(() => setLoading(false));
    useEffect(() => { load(); }, []);

    const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

    const submit = async (e) => {
        e.preventDefault();
        setError("");
        setSaving(true);
        try {
            // reuse saved position if the city didn't change while editing
            const existing = editId ? lots.find((l) => l._id === editId) : null;
            const place =
                existing &&
                    existing.lat != null &&
                    existing.city.toLowerCase() === form.city.trim().toLowerCase()
                    ? { city: existing.city, state: existing.state, lat: existing.lat, lng: existing.lng }
                    : await locate(form.city);

            const payload = { ...form, ...place };
            if (editId) await api.put(`/lots/${editId}`, payload);
            else await api.post("/lots", payload);

            setForm(empty);
            setEditId(null);
            load();
        } catch (err) {
            setError(errMsg(err));
        } finally {
            setSaving(false);
        }
    };

    const edit = (l) => {
        setEditId(l._id);
        setForm({
            name: l.name,
            location: l.location,
            city: l.city || "",
            totalSlots: l.totalSlots,
            pricePerHour: l.pricePerHour,
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const cancelEdit = () => {
        setEditId(null);
        setForm(empty);
        setError("");
    };

    const remove = async (l) => {
        if (!confirm(`Delete "${l.name}" along with its slots and bookings?`)) return;
        await api.delete(`/lots/${l._id}`);
        load();
    };

    return (
        <div>
            <h1 className="text-3xl font-bold mb-1">Manage lots</h1>
            <p className="text-slate-500 mb-6">Add parking lots and set their hourly price.</p>

            <form onSubmit={submit} className="panel p-5 mb-8">
                <h2 className="text-xl font-bold mb-4">{editId ? "Edit lot" : "Add a new lot"}</h2>
                <div className="grid md:grid-cols-3 gap-4">
                    <div>
                        <label className="label" htmlFor="lname">Lot name</label>
                        <input id="lname" className="field" value={form.name} onChange={set("name")} required />
                    </div>
                    <div>
                        <label className="label" htmlFor="city">City</label>
                        <input
                            id="city"
                            className="field"
                            list="city-list"
                            placeholder="e.g. Dehradun"
                            value={form.city}
                            onChange={set("city")}
                            required
                        />
                        <datalist id="city-list">
                            {CITIES.map((c) => (
                                <option key={c.city} value={c.city}>{c.state}</option>
                            ))}
                        </datalist>
                        <p className="text-xs text-slate-500 mt-1">Pick from the list or type any city in India.</p>
                    </div>
                    <div>
                        <label className="label" htmlFor="loc">Area / address</label>
                        <input id="loc" className="field" placeholder="e.g. Near Clock Tower" value={form.location} onChange={set("location")} required />
                    </div>
                    <div>
                        <label className="label" htmlFor="slots">Number of slots</label>
                        <input
                            id="slots"
                            type="number"
                            min="1"
                            max="200"
                            className="field disabled:bg-concrete"
                            value={form.totalSlots}
                            onChange={set("totalSlots")}
                            disabled={!!editId}
                            required
                        />
                        {editId && <p className="text-xs text-slate-500 mt-1">Can't change after creation.</p>}
                    </div>
                    <div>
                        <label className="label" htmlFor="price">Price per hour (₹)</label>
                        <input id="price" type="number" min="0" className="field" value={form.pricePerHour} onChange={set("pricePerHour")} required />
                    </div>
                </div>

                {error && <div className="alert-error mt-4" role="alert">{error}</div>}

                <div className="flex gap-2 mt-4">
                    <button disabled={saving} className="btn btn-primary">
                        {saving ? "Saving..." : editId ? "Save changes" : "Add lot"}
                    </button>
                    {editId && <button type="button" onClick={cancelEdit} className="btn btn-ghost">Cancel</button>}
                </div>
            </form>

            <h2 className="text-xl font-bold mb-3">Your lots ({lots.length})</h2>
            {loading ? (
                <Loading rows={2} height={80} />
            ) : lots.length === 0 ? (
                <Empty title="No lots yet" text="Add your first lot using the form above." />
            ) : (
                <div className="panel divide-y divide-slate-200">
                    {lots.map((l) => (
                        <div key={l._id} className="p-4 flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h3 className="text-lg font-bold leading-tight">{l.name}</h3>
                                <p className="text-sm text-slate-500">
                                    {l.location}{l.city ? `, ${l.city}` : ""}
                                </p>
                                {!l.city && (
                                    <p className="text-xs text-stop mt-0.5">No city set. Edit this lot so it shows on the map.</p>
                                )}
                            </div>
                            <p className="text-sm text-slate-600">
                                {l.totalSlots} slots · <span className="font-bold text-asphalt">₹{l.pricePerHour}/hour</span>
                            </p>
                            <div className="flex gap-2">
                                <button onClick={() => edit(l)} className="btn btn-ghost btn-sm">Edit</button>
                                <button onClick={() => remove(l)} className="btn btn-ghost btn-sm text-stop">Delete</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}