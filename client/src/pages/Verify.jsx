import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api, { errMsg } from "../api";

const look = {
    valid: { title: "Valid ticket", note: "OK to let this vehicle in.", cls: "bg-go text-white" },
    upcoming: { title: "Not started yet", note: "This booking begins later.", cls: "bg-paint text-asphalt" },
    expired: { title: "Expired", note: "This booking has ended.", cls: "bg-[#8a949e] text-white" },
    cancelled: { title: "Cancelled", note: "This booking was cancelled.", cls: "bg-stop text-white" },
};

const fmt = (d) =>
    new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

export default function Verify() {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        api
            .get(`/bookings/verify/${id}`)
            .then((r) => setData(r.data))
            .catch((e) => setError(errMsg(e)));
    }, [id]);

    if (error)
        return (
            <div className="max-w-md mx-auto">
                <div className="rounded-2xl bg-stop text-white p-6 text-center">
                    <h1 className="text-3xl font-bold">Invalid ticket</h1>
                    <p className="mt-1">{error}</p>
                </div>
            </div>
        );

    if (!data) return <div className="skeleton max-w-md mx-auto" style={{ height: 320 }} />;

    const s = look[data.result];

    return (
        <div className="max-w-md mx-auto space-y-4">
            <div className={`rounded-2xl p-6 text-center ${s.cls}`} role="status">
                <h1 className="text-4xl font-bold">{s.title}</h1>
                <p className="mt-1">{s.note}</p>
            </div>

            <div className="panel p-5 space-y-3">
                <div>
                    <p className="text-sm text-slate-500">Vehicle</p>
                    <p className="font-display text-3xl font-bold">{data.vehicleNumber}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                        <p className="text-slate-500">Lot</p>
                        <p className="font-medium">{data.lot?.name}</p>
                        <p className="text-slate-500">{data.lot?.location}{data.lot?.city ? `, ${data.lot.city}` : ""}</p>
                    </div>
                    <div>
                        <p className="text-slate-500">Slot</p>
                        <p className="font-display text-2xl font-bold">P{data.slot}</p>
                    </div>
                    <div>
                        <p className="text-slate-500">From</p>
                        <p className="font-medium">{fmt(data.startTime)}</p>
                    </div>
                    <div>
                        <p className="text-slate-500">To</p>
                        <p className="font-medium">{fmt(data.endTime)}</p>
                    </div>
                </div>
                {data.driver && <p className="text-sm text-slate-500">Booked by {data.driver}</p>}
            </div>
        </div>
    );
}