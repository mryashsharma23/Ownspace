import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../api";
import { useAuth } from "../AuthContext";
import Loading from "../components/Loading";
import Empty from "../components/Empty";

export default function Lots() {
  const { user } = useAuth();
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [params] = useSearchParams();
  const [q, setQ] = useState(params.get("q") || "");

  useEffect(() => {
    api.get("/lots").then((r) => setLots(r.data)).finally(() => setLoading(false));
  }, []);

  const shown = lots.filter((l) =>
    `${l.name} ${l.location} ${l.city || ""}`.toLowerCase().includes(q.trim().toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Hi {user.name.split(" ")[0]}, where are you parking?</h1>
          <p className="text-slate-500 mt-1">Pick a lot, choose your time, and your slot is held for you.</p>
        </div>
        <input
          className="field sm:max-w-xs"
          placeholder="Search by name or area"
          aria-label="Search parking lots"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {loading ? (
        <Loading />
      ) : lots.length === 0 ? (
        <Empty title="No parking lots yet" text="The admin hasn't added any lots. Check back soon." />
      ) : shown.length === 0 ? (
        <Empty title="No lots match your search" text="Try a different name or area." />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {shown.map((l) => (
            <article key={l._id} className="panel p-5 flex flex-col">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold leading-tight">{l.name}</h2>
                  <p className="text-sm text-slate-500 mt-0.5">{l.location}</p>
                </div>
                <div className="shrink-0 text-right bg-sign text-white rounded-lg px-3 py-1.5">
                  <div className="font-display text-xl font-bold leading-none">₹{l.pricePerHour}</div>
                  <div className="text-[11px] opacity-90">per hour</div>
                </div>
              </div>
              <p className="text-sm text-slate-600 mt-4 mb-5">{l.totalSlots} slots</p>
              <Link to={`/lots/${l._id}`} className="btn btn-dark mt-auto">Pick a slot</Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}