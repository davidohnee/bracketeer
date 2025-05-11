/*
 * Copyright (c) 2023, reAudioPlayer ONE.
 * Licenced under the GNU General Public License v3.0
 */

import { fromShare } from "./share";

type Files = Record<string, object>;
interface IOptions {
    filename?: string;
    description?: string;
    isPublic?: boolean;
}

export interface GitHubUser {
    login: string;
    id: number;
    node_id: string;
    avatar_url: string;
    gravatar_id: string;
    url: string;
    html_url: string;
    followers_url: string;
    following_url: string;
    gists_url: string;
    starred_url: string;
    subscriptions_url: string;
    organizations_url: string;
    repos_url: string;
    events_url: string;
    received_events_url: string;
}

const pat = () => localStorage.getItem("github.pat");
const me = () => JSON.parse(localStorage.getItem("github.me") ?? "null") as GitHubUser | null;

const getHeaders = async (forcePat: string | null = null) => {
    const token = pat() || forcePat;
    if (!token) throw new Error("No GitHub PAT found");

    return {
        Authorization: "Bearer " + token,
    };
};

const body = (files: Files, options: IOptions) => {
    const base = window.location.origin + window.location.pathname;
    const body = {
        public: options.isPublic ?? false,
        description: options.description,
        files: {
            [`_${options.filename ?? "bracketeer"}.md`]: {
                content: `# bracketeer\n\nThis gist was created with bracketeer\n\n${base}`,
            },
        },
    };
    for (const [key, value] of Object.entries(files)) {
        body.files[key] = {
            content: JSON.stringify(value, null, 4),
        };
    }
    return JSON.stringify(body);
};

const save = async (
    files: Files,
    options: IOptions = {
        isPublic: false,
    },
) => {
    return await setGist(files, options);
};

const update = async (
    files: Files,
    options: IOptions = {
        isPublic: false,
    },
    id: string,
) => {
    return await setGist(files, options, id);
};

const setGist = async (files: Files, options: IOptions, id?: string) => {
    const headers = await getHeaders();

    let endpoint = "https://api.github.com/gists";
    if (id) {
        endpoint += "/" + id;
    }

    const res = await fetch(endpoint, {
        method: id ? "PATCH" : "POST",
        headers,
        body: body(files, options),  
    });

    if (!res.ok) {
        return null;
    }

    const jdata = await res.json();
    return jdata;
};

const fetchMe = async (force = false) => {
    if (!pat()) return null;

    const fromCache = me();
    if (fromCache && !force) return fromCache;

    const headers = await getHeaders();
    const res = await fetch("https://api.github.com/user", {
        headers,
    });
    const data = (await res.json()) as GitHubUser;
    localStorage.setItem("github.me", JSON.stringify(data));

    return data;
};
fetchMe();

const isMine = async (identifier: string) => {
    const myData = me();

    if (!myData) return false;

    const myName = myData.login as string;

    const { author } = fromShare(identifier);
    return myName === author;
};

export default {
    pat,
    async setPat(pat: string) {
        localStorage.setItem("github.pat", pat);
        return await fetchMe(true);
    },
    me: fetchMe,
    save,
    isMine,
    update,
};
