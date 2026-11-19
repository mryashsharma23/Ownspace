export default function Empty({ title, text, children }) {
    return (
        <div className="panel p-10 text-center">
            <div className="mx-auto mb-3 w-12 h-12 rounded-xl bg-sign text-white grid place-items-center font-display text-2xl font-bold">
                P
            </div>
            <h2 className="text-xl font-bold">{title}</h2>
            <p className="text-slate-500 mt-1 mb-4">{text}</p>
            {children}
        </div>
    );
}