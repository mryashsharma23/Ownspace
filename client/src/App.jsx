import { Routes, Route, Navigate, Link, NavLink } from "react-router-dom";
import { useAuth } from "./AuthContext";
import Avatar from "./components/Avatar";
import Auth from "./pages/Auth";
import Lots from "./pages/Lots";
import BookSlot from "./pages/BookSlot";
import MyBookings from "./pages/MyBookings";
import Coverage from "./pages/Coverage";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";
import AdminLots from "./pages/AdminLots";
import Verify from "./pages/verify";

function Guard({ role, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/auth" replace />;
  if (role && user.role !== role)
    return <Navigate to={user.role === "admin" ? "/admin" : "/lots"} replace />;
  return children;
}

function Navbar() {
  const { user, logout } = useAuth();
  const link = ({ isActive }) =>
    `py-4 px-3 text-[0.95rem] font-medium border-b-[3px] transition-colors ${isActive ? "border-paint text-white" : "border-transparent text-white/70 hover:text-white"
    }`;

  return (
    <header className="bg-asphalt">
      <nav className="max-w-6xl mx-auto px-4 flex flex-wrap items-center gap-x-1">
        <Link to="/" className="flex items-center gap-2.5 py-3 mr-4">
          <span className="w-9 h-9 rounded-lg bg-sign text-white grid place-items-center font-display text-xl font-bold">
            P
          </span>
          <span className="font-display text-xl font-bold text-white tracking-wide">OWNSPACE</span>
        </Link>

        {user?.role === "user" && (
          <>
            <NavLink to="/lots" className={link}>Parking lots</NavLink>
            <NavLink to="/my-bookings" className={link}>My bookings</NavLink>
            <NavLink to="/map" className={link}>Map</NavLink>
          </>
        )}
        {user?.role === "admin" && (
          <>
            <NavLink to="/admin" end className={link}>Dashboard</NavLink>
            <NavLink to="/admin/lots" className={link}>Manage lots</NavLink>
            <NavLink to="/map" className={link}>Map</NavLink>
          </>
        )}

        {user && (
          <div className="ml-auto flex items-center gap-3 py-2">
            <Link
              to="/profile"
              title="My profile"
              className="flex items-center gap-2.5 rounded-full pr-3 hover:bg-white/10 transition-colors"
            >
              <Avatar user={user} size={32} />
              <span className="hidden sm:block text-sm text-white/80">{user.name}</span>
            </Link>
            <button onClick={logout} className="btn btn-ghost btn-sm">Log out</button>
          </div>
        )}
      </nav>
    </header>
  );
}

export default function App() {
  const { user } = useAuth();
  const home = user ? (user.role === "admin" ? "/admin" : "/lots") : "/auth";

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Navigate to={home} replace />} />
          <Route path="/auth" element={user ? <Navigate to={home} replace /> : <Auth />} />
          <Route path="/lots" element={<Guard role="user"><Lots /></Guard>} />
          <Route path="/lots/:id" element={<Guard role="user"><BookSlot /></Guard>} />
          <Route path="/my-bookings" element={<Guard role="user"><MyBookings /></Guard>} />
          <Route path="/map" element={<Guard><Coverage /></Guard>} />
          <Route path="/profile" element={<Guard><Profile /></Guard>} />
          <Route path="/admin" element={<Guard role="admin"><AdminDashboard /></Guard>} />
          <Route path="/admin/lots" element={<Guard role="admin"><AdminLots /></Guard>} />
          <Route path="*" element={<Navigate to="/" replace />} />
          <Route path="/verify/:id" element={<Verify />} />
        </Routes>
      </main>
    </div>
  );
}