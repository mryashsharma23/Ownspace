export default function Loading({ rows = 3, height = 150 }) {
    return (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4" aria-busy="true">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height }} />
            ))}
        </div>
    );
}