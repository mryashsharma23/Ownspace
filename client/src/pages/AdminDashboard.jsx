import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import Loading from "../components/Loading";

const fmt = (d) =>
  new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [tab, setTab] = useState("bookings");

  useEffect(() => {
    api.get("/admin/stats").then((r) => setStats(r.data));
    api.get("/admin/bookings").then((r) => setBookings(r.data));
    api.get("/admin/users").then((r) => setUsers(r.data));
  }, []);

  if (!stats) return <Loading rows={3} height={110} />;

  const items = [
    ["Parking lots", stats.lots],
    ["Customers", stats.users],
    ["Bookings", stats.bookings],
    ["Revenue", `₹${stats.revenue.toLocaleString("en-IN")}`],
  ];

  const th = "text-left font-medium text-slate-500 text-sm p-3";
  const td = "p-3 border-t border-slate-200 text-sm";

  return (
    <div>
      <h1 className="text-3xl font-bold mb-1">Dashboard</h1>
      <p className="text-slate-500 mb-6">How your parking lots are doing.</p>

      {stats.lots === 0 && (
        <div className="alert-ok mb-5">
          You haven't added a parking lot yet.{" "}
          <Link to="/admin/lots" className="font-bold underline">Add your first lot</Link>{" "}
          to start getting bookings.
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-slate-200 border border-slate-200 rounded-[14px] overflow-hidden mb-8">
        {items.map(([label, value]) => (
          <div key={label} className="bg-white p-5">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="font-display text-3xl font-bold mt-1">{value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setTab("bookings")}
          className={`btn btn-sm ${tab === "bookings" ? "btn-dark" : "btn-ghost"}`}
        >
          Bookings ({bookings.length})
        </button>
        <button
          onClick={() => setTab("users")}
          className={`btn btn-sm ${tab === "users" ? "btn-dark" : "btn-ghost"}`}
        >
          Customers ({users.length})
        </button>
      </div>

      <div className="panel overflow-x-auto">
        {tab === "bookings" ? (
          <table className="w-full">
            <thead>
              <tr>
                <th className={th}>Customer</th><th className={th}>Lot</th><th className={th}>Slot</th>
                <th className={th}>Vehicle</th><th className={th}>From</th><th className={th}>To</th>
                <th className={th}>Amount</th><th className={th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.length === 0 && (
                <tr><td className={td} colSpan={8}>No bookings yet.</td></tr>
              )}
              {bookings.map((b) => (
                <tr key={b._id}>
                  <td className={td}>{b.user?.name}</td>
                  <td className={td}>{b.lot?.name}</td>
                  <td className={td}>P{b.slot?.number}</td>
                  <td className={td}>{b.vehicleNumber}</td>
                  <td className={td}>{fmt(b.startTime)}</td>
                  <td className={td}>{fmt(b.endTime)}</td>
                  <td className={td}>₹{b.amount}</td>
                  <td className={td}><span className={`badge badge-${b.status}`}>{b.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full">
            <thead>
              <tr>
                <th className={th}>Name</th>
                <th className={th}>Email</th>
                <th className={th}>Phone</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && (
                <tr><td className={td} colSpan={3}>No customers yet.</td></tr>
              )}
              {users.map((u) => (
                <tr key={u._id}>
                  <td className={td}>{u.name}</td>
                  <td className={td}>{u.email}</td>
                  <td className={td}>{u.phone || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}