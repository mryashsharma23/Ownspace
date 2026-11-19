import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import api, { errMsg } from "../api";
import Loading from "../components/Loading";
import Empty from "../components/Empty";
import TicketQR from "../components/TicketQR";

const fmt = (d) =>
    new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

function Ticket({ b, onCancel, onShowQR }) {
    const past = b.status !== "active";
    return (
        <article className="ticket">
            <div className={`ticket-stub ${past ? "muted" : ""}`}>
                <span className="text-xs opacity-80">Slot</span>
                <span className="font-display text-4xl font-bold leading-none">P{b.slot?.number}</span>
            </div>
            <div className="flex-1 p-4 flex flex-wrap justify-between gap-3">
                <div>
                    <h3 className="text-lg font-bold leading-tight">{b.lot?.name}</h3>
                    <p className="text-sm text-slate-500">{b.lot?.location}</p>
                    <p className="text-sm font-medium mt-2">{b.vehicleNumber}</p>
                    <p className="text-sm text-slate-600">{fmt(b.startTime)} to {fmt(b.endTime)}</p>
                </div>
                <div className="text-right">
                    <p className="font-display text-2xl font-bold">₹{b.amount}</p>
                    <span className={`badge badge-${b.status}`}>{b.status}</span>
                    {!past && (
                        <div className="flex items-center justify-end gap-3 mt-2">
                            <button onClick={() => onShowQR(b)} className="btn btn-primary btn-sm">Show QR</button>
                            <button onClick={() => onCancel(b._id)} className="text-sm text-stop hover:underline">
                                Cancel
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </article>
    );
}

export default function MyBookings() {
    const { state } = useLocation();
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [qrFor, setQrFor] = useState(null);

    const load = () =>
        api.get("/bookings/my").then((r) => setList(r.data)).finally(() => setLoading(false));

    useEffect(() => { load(); }, []);

    const cancel = async (id) => {
        if (!confirm("Cancel this booking?")) return;
        try {
            await api.put(`/bookings/${id}/cancel`);
            load();
        } catch (e) {
            alert(errMsg(e));
        }
    };

    const active = list.filter((b) => b.status === "active");
    const history = list.filter((b) => b.status !== "active");

    return (
        <div>
            <h1 className="text-3xl font-bold mb-1">My bookings</h1>
            <p className="text-slate-500 mb-6">Your reserved slots and past parking.</p>

            {state?.booked && (
                <div className="alert-ok mb-5" role="status">
                    Booking confirmed. Tap "Show QR" on your ticket to use it at the gate.
                </div>
            )}

            {loading ? (
                <Loading rows={2} height={110} />
            ) : list.length === 0 ? (
                <Empty title="No bookings yet" text="Find a lot near you and reserve your first slot.">
                    <Link to="/lots" className="btn btn-primary">Find a parking lot</Link>
                </Empty>
            ) : (
                <div className="space-y-8">
                    {active.length > 0 && (
                        <section>
                            <h2 className="text-xl font-bold mb-3">Active</h2>
                            <div className="space-y-3">
                                {active.map((b) => (
                                    <Ticket key={b._id} b={b} onCancel={cancel} onShowQR={setQrFor} />
                                ))}
                            </div>
                        </section>
                    )}
                    {history.length > 0 && (
                        <section>
                            <h2 className="text-xl font-bold mb-3">History</h2>
                            <div className="space-y-3">
                                {history.map((b) => (
                                    <Ticket key={b._id} b={b} onCancel={cancel} onShowQR={setQrFor} />
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            )}

            {qrFor && <TicketQR booking={qrFor} onClose={() => setQrFor(null)} />}
        </div>
    );
}