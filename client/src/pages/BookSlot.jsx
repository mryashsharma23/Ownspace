import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api, { errMsg } from "../api";
import Loading from "../components/Loading";

const pad = (n) => String(n).padStart(2, "0");
const toInput = (d) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

const nextHour = () => {
    const d = new Date();
    d.setMinutes(0, 0, 0);
    d.setHours(d.getHours() + 1);
    return d;
};

export default function BookSlot() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [lot, setLot] = useState(null);
    const [slots, setSlots] = useState([]);
    const [slotsLoading, setSlotsLoading] = useState(true);
    const [vehicle, setVehicle] = useState("");
    const [start, setStart] = useState(() => toInput(nextHour()));
    const [end, setEnd] = useState(() => toInput(new Date(nextHour().getTime() + 36e5)));
    const [selected, setSelected] = useState(null);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    const validTime = start && end && new Date(end) > new Date(start);
    const hours = validTime ? Math.ceil((new Date(end) - new Date(start)) / 36e5) : 0;
    const amount = lot ? hours * lot.pricePerHour : 0;
    const freeCount = slots.filter((s) => s.available).length;
    const picked = slots.find((s) => s._id === selected);

    useEffect(() => {
        api.get(`/lots/${id}`).then((r) => setLot(r.data));
    }, [id]);

    useEffect(() => {
        setSelected(null);
        const params = validTime
            ? { start: new Date(start).toISOString(), end: new Date(end).toISOString() }
            : {};
        api
            .get(`/slots/${id}`, { params })
            .then((r) => setSlots(r.data))
            .finally(() => setSlotsLoading(false));
    }, [id, start, end]); // eslint-disable-line

    const setDuration = (h) => {
        if (!start) return;
        setEnd(toInput(new Date(new Date(start).getTime() + h * 36e5)));
    };

    const book = async () => {
        setError("");
        if (!vehicle.trim()) return setError("Enter your vehicle number.");
        if (!validTime) return setError("Choose an end time after the start time.");
        if (!selected) return setError("Tap a slot on the map to pick it.");
        setBusy(true);
        try {
            await api.post("/bookings", {
                slotId: selected,
                vehicleNumber: vehicle,
                startTime: new Date(start).toISOString(),
                endTime: new Date(end).toISOString(),
            });
            navigate("/my-bookings", { state: { booked: true } });
        } catch (e) {
            setError(errMsg(e));
        } finally {
            setBusy(false);
        }
    };

    if (!lot) return <Loading rows={1} height={300} />;

    return (
        <div className="grid lg:grid-cols-[350px_1fr] gap-6 items-start">
            {/* booking details */}
            <div className="panel p-5 space-y-4 lg:sticky lg:top-6">
                <Link to="/lots" className="text-sm text-sign font-medium">← All lots</Link>
                <div>
                    <h1 className="text-2xl font-bold leading-tight">{lot.name}</h1>
                    <p className="text-sm text-slate-500">{lot.location} · ₹{lot.pricePerHour} per hour</p>
                </div>

                <div>
                    <label className="label" htmlFor="vehicle">Vehicle number</label>
                    <input
                        id="vehicle"
                        className="field"
                        placeholder="e.g. UK04AB1234"
                        value={vehicle}
                        onChange={(e) => setVehicle(e.target.value)}
                    />
                </div>

                <div>
                    <label className="label" htmlFor="start">Arriving</label>
                    <input
                        id="start"
                        type="datetime-local"
                        className="field"
                        min={toInput(new Date())}
                        value={start}
                        onChange={(e) => setStart(e.target.value)}
                    />
                </div>

                <div>
                    <label className="label" htmlFor="end">Leaving</label>
                    <input
                        id="end"
                        type="datetime-local"
                        className="field"
                        min={start}
                        value={end}
                        onChange={(e) => setEnd(e.target.value)}
                    />
                    <div className="flex gap-2 mt-2">
                        {[1, 2, 3, 4].map((h) => (
                            <button key={h} type="button" onClick={() => setDuration(h)} className="btn btn-ghost btn-sm">
                                {h} hr
                            </button>
                        ))}
                    </div>
                </div>

                <div className="rounded-xl bg-concrete p-4 text-sm space-y-1.5">
                    <div className="flex justify-between">
                        <span className="text-slate-600">Slot</span>
                        <span className="font-bold">{picked ? `P${picked.number}` : "Not picked yet"}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-600">Duration</span>
                        <span className="font-bold">{validTime ? `${hours} hour${hours > 1 ? "s" : ""}` : "-"}</span>
                    </div>
                    <div className="flex justify-between items-baseline pt-1.5 border-t border-slate-300">
                        <span className="text-slate-600">Total</span>
                        <span className="font-display text-2xl font-bold">₹{amount}</span>
                    </div>
                </div>

                {error && <div className="alert-error" role="alert">{error}</div>}

                <button onClick={book} disabled={busy} className="btn btn-primary w-full">
                    {busy ? "Booking..." : picked ? `Book slot P${picked.number}` : "Confirm booking"}
                </button>
            </div>

            {/* the lot */}
            <div>
                <div className="flex flex-wrap items-end justify-between gap-3 mb-3">
                    <div>
                        <h2 className="text-2xl font-bold">Choose your slot</h2>
                        <p className="text-sm text-slate-500">
                            {validTime
                                ? `${freeCount} of ${slots.length} slots are free for your time.`
                                : "Pick a start and end time to see what's free."}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                        <span className="flex items-center gap-2"><i className="w-4 h-4 rounded-sm border-2 border-asphalt/70" /> Free</span>
                        <span className="flex items-center gap-2"><i className="w-4 h-4 rounded-sm bg-[#9aa4b2]" /> Taken</span>
                        <span className="flex items-center gap-2"><i className="w-4 h-4 rounded-sm bg-paint" /> Your pick</span>
                    </div>
                </div>

                {slotsLoading ? (
                    <div className="skeleton" style={{ height: 260 }} />
                ) : (
                    <div className="lot-floor">
                        <div className="bays">
                            {slots.map((s) => {
                                const mine = selected === s._id;
                                return (
                                    <button
                                        key={s._id}
                                        type="button"
                                        disabled={!s.available}
                                        onClick={() => setSelected(mine ? null : s._id)}
                                        className={`bay ${mine ? "selected" : ""}`}
                                        aria-pressed={mine}
                                        aria-label={`Slot P${s.number}, ${s.available ? "free" : "taken"}`}
                                    >
                                        {!s.available && <span className="car" />}
                                        {mine && <span className="car car-mine" />}
                                        P{s.number}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}