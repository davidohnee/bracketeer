const rotate = <T>(n: number, xs: T[]) => [
    ...xs.slice(xs.length - (n % xs.length)),
    ...xs.slice(0, xs.length - (n % xs.length)),
];

const BYE = Symbol();

const fold = <T>(xs: T[]) =>
    xs.slice(0, Math.ceil(xs.length / 2)).map((x, i) => [x, xs[xs.length - i - 1]]);

export const roundRobin = <T>(teams: T[]): T[][][] => {
    const ts = teams as (T | symbol)[];
    const all = ts.concat(ts.length % 2 == 0 ? [] : [BYE]);
    const rest = all.slice(0, -1);
    return rest
        .map((_, i) => rotate(i + 1, fold([...rotate(i, rest), all.at(-1)])))
        .map((b) => b.filter(([a, b]) => a !== BYE && b !== BYE))
        .map((b, i) => (i % 2 == 0 ? b : b.map(([a, b]) => [b, a]))) as T[][][];
};
