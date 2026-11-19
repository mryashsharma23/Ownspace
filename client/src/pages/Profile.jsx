import { useEffect, useRef, useState } from "react";
import api, { errMsg } from "../api";
import { useAuth } from "../AuthContext";
import Avatar from "../components/Avatar";
import IndiaMap from "../components/IndiaMap";

const resizeImage = (file, size = 256) =>
    new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
            const side = Math.min(img.width, img.height);
            const sx = (img.width - side) / 2;
            const sy = (img.height - side) / 2;
            const canvas = document.createElement("canvas");
            canvas.width = canvas.height = size;
            canvas.getContext("2d").drawImage(img, sx, sy, side, side, 0, 0, size, size);
            URL.revokeObjectURL(url);
            resolve(canvas.toDataURL("image/jpeg", 0.85));
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error("Couldn't read this image. Try a JPG or PNG."));
        };
        img.src = url;
    });

function Msg({ msg }) {
    if (!msg) return null;
    return (
        <div
            className={msg.type === "ok" ? "alert-ok" : "alert-error"}
            role={msg.type === "ok" ? "status" : "alert"}
        >
            {msg.text}
        </div>
    );
}

export default function Profile() {
    const { user, updateUser } = useAuth();
    const fileRef = useRef(null);

    const [details, setDetails] = useState({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
    });
    const [pass, setPass] = useState({ current: "", next: "", confirm: "" });
    const [photoMsg, setPhotoMsg] = useState(null);
    const [detailsMsg, setDetailsMsg] = useState(null);
    const [passMsg, setPassMsg] = useState(null);
    const [coverage, setCoverage] = useState(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        api.get("/profile").then(({ data }) => {
            updateUser({ phone: data.phone, photo: data.photo });
            setDetails({ name: data.name, email: data.email, phone: data.phone || "" });
        });
        api.get("/lots/coverage").then((r) => setCoverage(r.data));
    }, []); // eslint-disable-line

    const setD = (k) => (e) => setDetails({ ...details, [k]: e.target.value });
    const setP = (k) => (e) => setPass({ ...pass, [k]: e.target.value });

    const onPhoto = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        setPhotoMsg(null);
        if (!file.type.startsWith("image/"))
            return setPhotoMsg({ type: "error", text: "Choose an image file (JPG, PNG or WebP)." });
        try {
            const photo = await resizeImage(file);
            const { data } = await api.put("/profile", { photo });
            updateUser({ photo: data.photo });
            setPhotoMsg({ type: "ok", text: "Profile photo updated." });
        } catch (err) {
            setPhotoMsg({ type: "error", text: errMsg(err) });
        }
    };

    const removePhoto = async () => {
        setPhotoMsg(null);
        try {
            await api.put("/profile", { photo: "" });
            updateUser({ photo: "" });
            setPhotoMsg({ type: "ok", text: "Profile photo removed." });
        } catch (err) {
            setPhotoMsg({ type: "error", text: errMsg(err) });
        }
    };

    const saveDetails = async (e) => {
        e.preventDefault();
        setDetailsMsg(null);
        try {
            const { data } = await api.put("/profile", details);
            updateUser({ name: data.name, email: data.email, phone: data.phone });
            setDetailsMsg({ type: "ok", text: "Details saved." });
        } catch (err) {
            setDetailsMsg({ type: "error", text: errMsg(err) });
        }
    };

    const savePassword = async (e) => {
        e.preventDefault();
        setPassMsg(null);
        if (pass.next !== pass.confirm)
            return setPassMsg({ type: "error", text: "The new passwords don't match." });
        try {
            await api.put("/profile/password", {
                currentPassword: pass.current,
                newPassword: pass.next,
            });
            setPass({ current: "", next: "", confirm: "" });
            setPassMsg({ type: "ok", text: "Password changed." });
        } catch (err) {
            setPassMsg({ type: "error", text: errMsg(err) });
        }
    };

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

    const states = coverage ? [...new Set(coverage.map((c) => c.state))].sort() : [];

    return (
        <div>
            <h1 className="text-3xl font-bold mb-1">My profile</h1>
            <p className="text-slate-500 mb-6">Keep your details up to date.</p>

            <div className="grid lg:grid-cols-[300px_1fr] gap-6 items-start">
                {/* photo */}
                <div className="panel p-6 text-center space-y-3">
                    <div className="flex justify-center">
                        <Avatar user={user} size={112} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold leading-tight">{user.name}</h2>
                        <p className="text-sm text-slate-500 capitalize">{user.role}</p>
                    </div>
                    <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPhoto} />
                    <div className="flex justify-center gap-2">
                        <button type="button" onClick={() => fileRef.current.click()} className="btn btn-dark btn-sm">
                            {user.photo ? "Change photo" : "Upload photo"}
                        </button>
                        {user.photo && (
                            <button type="button" onClick={removePhoto} className="btn btn-ghost btn-sm">
                                Remove
                            </button>
                        )}
                    </div>
                    <Msg msg={photoMsg} />
                </div>

                <div className="space-y-6">
                    {/* details */}
                    <form onSubmit={saveDetails} className="panel p-5 space-y-4">
                        <h2 className="text-xl font-bold">Personal details</h2>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <label className="label" htmlFor="p-name">Full name</label>
                                <input id="p-name" className="field" value={details.name} onChange={setD("name")} required />
                            </div>
                            <div>
                                <label className="label" htmlFor="p-phone">Phone</label>
                                <input id="p-phone" className="field" value={details.phone} onChange={setD("phone")} placeholder="+91 98765 43210" />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="label" htmlFor="p-email">Email</label>
                                <input id="p-email" type="email" className="field" value={details.email} onChange={setD("email")} required />
                                <p className="text-xs text-slate-500 mt-1">You'll use this email to log in.</p>
                            </div>
                        </div>
                        <Msg msg={detailsMsg} />
                        <button className="btn btn-primary">Save changes</button>
                    </form>

                    <form onSubmit={savePassword} className="panel p-5 space-y-4">
                        <h2 className="text-xl font-bold">Change password</h2>
                        <div>
                            <label className="label" htmlFor="p-cur">Current password</label>
                            <input id="p-cur" type="password" className="field" value={pass.current} onChange={setP("current")} required />
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <label className="label" htmlFor="p-new">New password</label>
                                <input id="p-new" type="password" className="field" value={pass.next} onChange={setP("next")} required />
                            </div>
                            <div>
                                <label className="label" htmlFor="p-conf">Confirm new password</label>
                                <input id="p-conf" type="password" className="field" value={pass.confirm} onChange={setP("confirm")} required />
                            </div>
                        </div>
                        <p className="text-xs text-slate-500">At least 6 characters.</p>
                        <Msg msg={passMsg} />
                        <button className="btn btn-dark">Update password</button>
                    </form>
                </div>
            </div>

            <section className="panel p-5 mt-8">
                <h2 className="text-2xl font-bold">Where OWNSPACE is available</h2>
                <p className="text-slate-500 mt-1 mb-4">
                    Blue pins are cities with parking lots you can book today. Grey dots are cities we haven't reached yet.
                </p>

                {coverage === null ? (
                    <div className="skeleton" style={{ height: 420 }} />
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

                {coverage && coverage.length > 0 ? (
                    <div className="mt-4">
                        <p className="text-sm font-medium mb-2">
                            Live in {coverage.length} {coverage.length > 1 ? "cities" : "city"} across {states.length}{" "}
                            {states.length > 1 ? "states" : "state"}
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {coverage.map((c) => (
                                <span key={c.city} className="badge badge-active">{c.city}</span>
                            ))}
                        </div>
                    </div>
                ) : (
                    coverage && <p className="text-sm text-slate-500 mt-4">No lots have been added yet.</p>
                )}

                <div className="rounded-xl bg-concrete p-4 mt-5">
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
                </div>
            </section>
        </div>
    );
}