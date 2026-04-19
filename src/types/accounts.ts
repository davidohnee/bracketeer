export const ACCOUNT_TYPES = ["gist"] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export interface IAccount {
    type: AccountType;
    id: string;
    displayName: string;
}

export interface GistAccount extends IAccount {
    type: "gist";
    accessToken: string;
}

export type Account = GistAccount;
