import { useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";

export default function TicketQR({ booking, onClose }) {
    useEffect(() => {
        const onKey = (e) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    const base = import.meta.env.VITE_PUBLIC_URL || window.location.origin;
    const url = `${base}/verify/${booking._id}`;

    return (
        <div
            className="fixed inset-0 z-50 grid place-items-center bg-asphalt/70 p-4"
            onClick={onClose}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-label="Booking QR code"
                className="panel w-full max-w-sm p-6 text-center"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-2xl font-bold">Show this at the gate</h2>
                <p className="text-sm text-slate-500 mb-4">
                    {booking.lot?.name} · Slot P{booking.slot?.number}
                </p>

                <div className="inline-block bg-white p-3 rounded-xl border border-slate-200">
                    <QRCodeSVG value={url} size={220} level="M" />
                </div>

                <p className="font-display text-2xl font-bold mt-4">{booking.vehicleNumber}</p>
                <p className="text-xs text-slate-500 mt-1">
                    Ticket #{booking._id.slice(-8).toUpperCase()}
                </p>

                <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block text-sm text-sign font-medium mt-3 hover:underline"
                >
                    Preview what the guard sees
                </a>

                <button onClick={onClose} className="btn btn-dark w-full mt-5">Close</button>
            </div>
        </div>
    );
}