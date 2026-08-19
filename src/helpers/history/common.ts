export type Change = {
    type: "CREATE" | "REMOVE" | "CHANGE";
    path: (string | number)[];
    value?: unknown;
    oldValue?: unknown;
};

export const reverseChange = (change: Change): Change => {
    switch (change.type) {
        case "CREATE":
            return { ...change, type: "REMOVE" };
        case "REMOVE":
            return { ...change, type: "CREATE" };
        case "CHANGE":
            return { ...change, value: change.oldValue, oldValue: change.value };
    }
};

export const changesAreEqual = (a: Change, b: Change): boolean => {
    if (a.type !== b.type) return false;
    if (a.path.length !== b.path.length) return false;
    for (let i = 0; i < a.path.length; i++) {
        if (a.path[i] !== b.path[i]) return false;
    }
    if (a.value !== b.value) return false;
    if (a.oldValue !== b.oldValue) return false;
    return true;
};

export const changesAreReverse = (a: Change, b: Change): boolean => {
    return changesAreEqual(a, reverseChange(b));
};

const applyRemoveChange = (target: Record<string, unknown>, path: (string | number)[]) => {
    for (let i = 0; i < path.length - 1; i++) {
        target = target[path[i]] as Record<string, unknown>;
    }
    if (Array.isArray(target)) {
        target.splice(path.at(-1) as number, 1);
    } else {
        delete target[path.at(-1)!];
    }
};

const applyCreateOrChange = (
    target: Record<string, unknown>,
    path: (string | number)[],
    value: unknown,
) => {
    for (let i = 0; i < path.length - 1; i++) {
        if (!target[path[i]]) {
            target[path[i]] = {};
        }
        target = target[path[i]] as Record<string, unknown>;
    }
    target[path.at(-1)!] = value;
};

export const applyChanges = (target: Record<string, unknown>, changes: Change[]) => {
    for (const change of changes) {
        if (change.type === "REMOVE") {
            applyRemoveChange(target, change.path);
        } else if (change.type === "CREATE" || change.type === "CHANGE") {
            applyCreateOrChange(target, change.path, change.value);
        }
    }
    return target;
};
