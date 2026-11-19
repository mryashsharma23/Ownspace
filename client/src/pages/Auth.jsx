import { useState } from "react";
import { useAuth } from "../AuthContext";
import { errMsg } from "../api";

export default function Auth() {
    const { login, register } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [showAdmin, setShowAdmin] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const [form, setForm] = useState({ name: "", phone: "", email: "", password: "", adminCode: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

    const submit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            if (isLogin) await login({ email: form.email, password: form.password });
            else await register({ ...form, adminCode: showAdmin ? form.adminCode.trim() : "" });
        } catch (err) {
            setError(errMsg(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="panel overflow-hidden max-w-4xl mx-auto grid md:grid-cols-2">
            {/* left: the lot */}
            <div className="hidden md:flex flex-col justify-between gap-8 bg-asphalt text-white p-8">
                <div>
                    <h2 className="font-display text-4xl font-bold leading-tight">
                        Find a spot.<br />Book it.<br />Park easy.
                    </h2>
                    <p className="mt-3 text-white/70 max-w-xs">
                        See which slots are free for your time, reserve one, and skip the circling.
                    </p>
                </div>
                <div className="lot-floor" aria-hidden="true">
                    <div className="bays" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
                        <div className="bay">P1</div>
                        <div className="bay"><span className="car" />P2</div>
                        <div className="bay selected"><span className="car car-mine" />P3</div>
                        <div className="bay">P4</div>
                    </div>
                </div>
            </div>

            {/* right: the form */}
            <div className="p-6 sm:p-8">
                <h1 className="text-3xl font-bold">{isLogin ? "Log in to OWNSPACE" : "Create your account"}</h1>
                <p className="text-slate-500 mt-1 mb-6">
                    {isLogin ? "Good to see you again." : "It takes under a minute."}
                </p>

                {error && <div className="alert-error mb-4" role="alert">{error}</div>}

                <form onSubmit={submit} className="space-y-4">
                    {!isLogin && (
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <label className="label" htmlFor="name">Full name</label>
                                <input id="name" className="field" value={form.name} onChange={set("name")} required />
                            </div>
                            <div>
                                <label className="label" htmlFor="phone">Phone (optional)</label>
                                <input id="phone" className="field" value={form.phone} onChange={set("phone")} />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="label" htmlFor="email">Email</label>
                        <input id="email" type="email" className="field" value={form.email} onChange={set("email")} required />
                    </div>

                    <div>
                        <label className="label" htmlFor="password">Password</label>
                        <div className="relative">
                            <input
                                id="password"
                                type={showPass ? "text" : "password"}
                                className="field pr-16"
                                value={form.password}
                                onChange={set("password")}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPass(!showPass)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-sign"
                            >
                                {showPass ? "Hide" : "Show"}
                            </button>
                        </div>
                        {!isLogin && <p className="text-xs text-slate-500 mt-1">At least 6 characters.</p>}
                    </div>

                    {!isLogin && (
                        <div>
                            {!showAdmin ? (
                                <button type="button" onClick={() => setShowAdmin(true)} className="text-sm text-sign font-medium">
                                    I have an admin code
                                </button>
                            ) : (
                                <>
                                    <label className="label" htmlFor="adminCode">Admin code</label>
                                    <input id="adminCode" className="field" value={form.adminCode} onChange={set("adminCode")} />
                                </>
                            )}
                        </div>
                    )}

                    <button disabled={loading} className="btn btn-primary w-full">
                        {loading ? "Please wait..." : isLogin ? "Log in" : "Create account"}
                    </button>
                </form>

                <p className="text-sm text-slate-600 mt-5 text-center">
                    {isLogin ? "New to OWNSPACE?" : "Already have an account?"}{" "}
                    <button
                        className="text-sign font-bold"
                        onClick={() => { setIsLogin(!isLogin); setError(""); }}
                    >
                        {isLogin ? "Create an account" : "Log in"}
                    </button>
                </p>
            </div>
        </div>
    );
}