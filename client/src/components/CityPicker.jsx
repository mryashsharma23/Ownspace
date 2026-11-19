import { useEffect, useState } from "react";
import { CITIES } from "../data/cities";

const ALLOWED = ["city", "town", "village", "hamlet", "suburb", "municipality", "borough", "locality"];
const label = (p) => (p.state ? `${p.city}, ${p.state}` : p.city);

export default function CityPicker({ initial, onPick }) {
    const [text, setText] = useState(initial ? label(initial) : "");
    const [picked, setPicked] = useState(!!initial);
    const [remote, setRemote] = useState([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    const q = text.trim().toLowerCase();

    // search any city/town in India (free OpenStreetMap search)
    useEffect(() => {
        if (picked || q.length < 3) {
            setRemote([]);
            setLoading(false);
            return;
        }
        const ctrl = new AbortController();
        const t = setTimeout(async () => {
            setLoading(true);
            try {
                const url =
                    "https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&countrycodes=in&limit=10&accept-language=en&q=" +
                    encodeURIComponent(q);
                const res = await fetch(url, { signal: ctrl.signal });
                const data = await res.json();
                setRemote(
                    data
                        .filter((r) => r.class === "place" && ALLOWED.includes(r.type))
                        .map((r) => {
                            const a = r.address || {};
                            return {
                                city: a.city || a.town || a.village || a.municipality || r.name,
                                state: a.state || "",
                                lat: Number(r.lat),
                                lng: Number(r.lon),
                            };
                        })
                        .filter((p) => p.city && !isNaN(p.lat) && !isNaN(p.lng))
                );
            } catch (e) {
                if (e.name !== "AbortError") setRemote([]);
            } finally {
                if (!ctrl.signal.aborted) setLoading(false);
            }
        }, 500);
        return () => {
            clearTimeout(t);
            ctrl.abort();
        };
    }, [q, picked]);

    // built-in cities show instantly, then the live results
    const local = q ? CITIES.filter((c) => c.city.toLowerCase().includes(q)).slice(0, 5) : [];
    const seen = new Set();
    const options = [...local, ...remote].filter((p) => {
        const k = `${p.city}|${p.state}`.toLowerCase();
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
    });

    const pick = (p) => {
        setText(label(p));
        setPicked(true);
        setOpen(false);
        onPick({ city: p.city, state: p.state, lat: p.lat, lng: p.lng });
    };

    const onType = (e) => {
        setText(e.target.value);
        setPicked(false);
        setOpen(true);
        onPick(null);
    };

    return (
        <div className="relative">
            <input
                id="city"
                className="field"
                placeholder="Type your city or town"
                autoComplete="off"
                value={text}
                onChange={onType}
                onFocus={() => setOpen(true)}
                onBlur={() => setOpen(false)}
            />

            {open && !picked && q.length >= 1 && (
                <ul className="absolute z-20 mt-1 w-full max-h-64 overflow-auto bg-white border border-slate-300 rounded-xl shadow-lg py-1">
                    {options.map((p) => (
                        <li key={`${p.city}|${p.state}`}>
                            <button
                                type="button"
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    pick(p);
                                }}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-concrete"
                            >
                                {label(p)}
                            </button>
                        </li>
                    ))}
                    {loading && <li className="px-3 py-2 text-sm text-slate-500">Searching...</li>}
                    {!loading && options.length === 0 && (
                        <li className="px-3 py-2 text-sm text-slate-500">
                            {q.length < 3 ? "Keep typing..." : "No match. Check the spelling or try a nearby bigger town."}
                        </li>
                    )}
                </ul>
            )}

            {picked && <p className="text-xs text-go mt-1">Location set for the map.</p>}
        </div>
    );
}