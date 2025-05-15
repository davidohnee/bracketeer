export const chunks = <T>(a: T[], size: number) =>
    Array.from(Array.from({ length: Math.ceil(a.length / size) }), (_, i) =>
        a.slice(i * size, i * size + size),
    );

export const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export const deepCopy = <T>(item: T): T => JSON.parse(JSON.stringify(item));

export const agoString = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (seconds < 60) return "Just now";
    if (minutes == 1) return "1 minute ago";
    if (minutes < 60) return `${minutes} minutes ago`;
    if (hours == 1) return "1 hour ago";
    if (hours < 24) return `${hours} hours ago`;
    if (hours == 1) return "1 hour ago";
    if (hours < 24 * 7) return `${Math.floor(hours / 24)} days ago`;

    return date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    });
};
