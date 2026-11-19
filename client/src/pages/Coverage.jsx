import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import { useAuth } from "../AuthContext";
import IndiaMap from "../components/IndiaMap";

export default function Coverage() {
    const { user } = useAuth();
    const [coverage, setCoverage] = useState(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        api.get("/lots/coverage").then((r) => setCoverage(r.data));
    }, []);

    const states = coverage ? [...new Set(coverage.map((c) => c.state).filter(Boolean))] : [];
    const totalLots = coverage ? coverage.reduce((sum, c) => sum + c.lots, 0) : 0;
    const totalSlots = coverage ? coverage.reduce((sum, c) => sum + c.slots, 0) : 0;

    const cityNames = coverage?.map((c) => c.city).join(", ");
    const shareText = cityNames
        ? `I use OWNSPACE to book parking slots in advance. It's available in ${cityNames}. Try it: ${window.location.origin}`
        : `I use OWNSPACE to book parking slots in advance. Try it: ${window.location.origin}`;

    const copyShare = async () => {
        try {
            await navigator.clipboard.writeText(shareText);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            /* clipboard not available */
        }
    };

    const stats = [
        ["Cities", coverage?.length ?? "-"],
        ["States", coverage ? states.length : "-"],
        ["Parking lots", coverage ? totalLots : "-"],
        ["Slots", coverage ? totalSlots : "-"],
    ];

    return (
        <div>
            <h1 className="text-3xl font-bold mb-1">Where OWNSPACE is available</h1>
            <p className="text-slate-500 mb-6">
                Blue pins are cities with parking lots you can book today. Grey dots are cities we haven't reached yet.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-slate-200 border border-slate-200 rounded-[14px] overflow-hidden mb-6">
                {stats.map(([label, value]) => (
                    <div key={label} className="bg-white p-5">
                        <p className="text-sm text-slate-500">{label}</p>
                        <p className="font-display text-3xl font-bold mt-1">{value}</p>
                    </div>
                ))}
            </div>

            {coverage === null ? (
                <div className="skeleton" style={{ height: 460 }} />
            ) : (
                <IndiaMap coverage={coverage} />
            )}

            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 mt-3">
                <span className="flex items-center gap-2">
                    <i className="w-4 h-4 rounded-full bg-sign border-2 border-paint" /> Available
                </span>
                <span className="flex items-center gap-2">
                    <i className="w-3 h-3 rounded-full bg-[#8a949e]" /> Not available yet
                </span>
            </div>

            <section className="panel p-5 mt-6">
                <h2 className="text-xl font-bold mb-3">Cities with OWNSPACE</h2>
                {coverage && coverage.length === 0 && (
                    <p className="text-sm text-slate-500">No lots have been added yet.</p>
                )}
                <div className="flex flex-wrap gap-2">
                    {coverage?.map((c) =>
                        user.role === "user" ? (
                            <Link
                                key={c.city}
                                to={`/lots?q=${encodeURIComponent(c.city)}`}
                                className="badge badge-active hover:underline"
                                title={`See lots in ${c.city}`}
                            >
                                {c.city} · {c.lots}
                            </Link>
                        ) : (
                            <span key={c.city} className="badge badge-active">
                                {c.city} · {c.lots}
                            </span>
                        )
                    )}
                </div>
                {user.role === "user" && coverage?.length > 0 && (
                    <p className="text-xs text-slate-500 mt-3">Tap a city to see its parking lots.</p>
                )}
            </section>

            <section className="rounded-xl bg-concrete p-5 mt-6">
                <h3 className="text-lg font-bold">Know someone who needs parking?</h3>
                <p className="text-sm text-slate-600 mt-1 mb-3">
                    Share OWNSPACE with friends, family or a parking owner in your city. The more people ask, the faster we grow.
                </p>
                <div className="flex flex-wrap gap-2">
                    <a
                        href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-primary btn-sm"
                    >
                        Share on WhatsApp
                    </a>
                    <button type="button" onClick={copyShare} className="btn btn-ghost btn-sm">
                        {copied ? "Copied!" : "Copy message"}
                    </button>
                </div>
            </section>
        </div>
    );
}