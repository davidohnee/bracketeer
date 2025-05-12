export const chunks = <T>(a: T[], size: number) =>
    Array.from(Array.from({ length: Math.ceil(a.length / size) }), (_, i) =>
        a.slice(i * size, i * size + size),
    );

export const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export const deepCopy = <T>(item: T): T => JSON.parse(JSON.stringify(item));
