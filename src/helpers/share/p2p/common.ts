export type P2PChange = {
    type: "CREATE" | "REMOVE" | "CHANGE";
    path: (string | number)[];
    value?: unknown;
    oldValue?: unknown;
};

export type PeerIdType = "session" | "random" | "permanent";
