export default function Avatar({ user, size = 32, className = "" }) {
    const style = { width: size, height: size, fontSize: size * 0.42 };

    if (user?.photo) {
        return (
            <img
                src={user.photo}
                alt=""
                style={style}
                className={`rounded-full object-cover shrink-0 ${className}`}
            />
        );
    }
    return (
        <span
            style={style}
            className={`rounded-full bg-paint text-asphalt grid place-items-center font-bold shrink-0 ${className}`}
        >
            {user?.name?.[0]?.toUpperCase()}
        </span>
    );
}