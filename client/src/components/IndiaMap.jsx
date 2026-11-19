import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { CITIES } from "../data/cities";

const popupNode = (title, subtitle) => {
    const div = document.createElement("div");
    const b = document.createElement("strong");
    b.textContent = title;
    div.appendChild(b);
    div.appendChild(document.createElement("br"));
    const s = document.createElement("span");
    s.textContent = subtitle;
    div.appendChild(s);
    return div;
};

export default function IndiaMap({ coverage }) {
    const el = useRef(null);

    useEffect(() => {
        const map = L.map(el.current, {
            minZoom: 4,
            maxBounds: [[0, 60], [42, 105]],
            maxBoundsViscosity: 1,
            scrollWheelZoom: false,
        });
        map.fitBounds([[6.5, 68], [35.7, 97.5]]);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "&copy; OpenStreetMap contributors",
            maxZoom: 12,
        }).addTo(map);

        const known = new Map(CITIES.map((c) => [c.city.toLowerCase(), c]));
        const coveredNames = new Set(coverage.map((c) => c.city.toLowerCase()));

        // grey dots: suggested cities with no lots yet
        CITIES.filter((c) => !coveredNames.has(c.city.toLowerCase())).forEach((c) => {
            L.circleMarker([c.lat, c.lng], {
                radius: 4,
                color: "#8a949e",
                weight: 1,
                fillColor: "#8a949e",
                fillOpacity: 0.7,
            })
                .bindTooltip(`${c.city}: not available yet`)
                .addTo(map);
        });

        // blue pins: cities that have lots (any city an admin typed works)
        coverage.forEach((c) => {
            const fallback = known.get(c.city.toLowerCase());
            const lat = c.lat ?? fallback?.lat;
            const lng = c.lng ?? fallback?.lng;
            if (lat == null || lng == null) return;

            L.circleMarker([lat, lng], {
                radius: 9,
                color: "#f5c518",
                weight: 3,
                fillColor: "#1d5fd0",
                fillOpacity: 1,
            })
                .bindPopup(
                    popupNode(
                        c.state ? `${c.city}, ${c.state}` : c.city,
                        `${c.lots} lot${c.lots > 1 ? "s" : ""} · ${c.slots} slots`
                    )
                )
                .addTo(map);
        });

        return () => map.remove();
    }, [coverage]);

    return (
        <div
            ref={el}
            className="h-105 rounded-xl overflow-hidden border border-slate-200"
            role="img"
            aria-label="Map of India showing cities where OWNSPACE is available"
        />
    );
}