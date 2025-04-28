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

const pat = () => (typeof window !== "undefined" ? localStorage.getItem("github.pat") : null);
const me = () =>
    typeof window !== "undefined" ? JSON.parse(localStorage.getItem("github.me") ?? "null") : null;

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
        body: body(files, options), // eslint-disable-line
    });

    if (!res.ok) {
        return null;
    }

    const jdata = await res.json();
    return jdata;
};

const fetchMe = () => {
    if (!pat()) return undefined;

    const fromCache = me();
    if (fromCache) return fromCache;

    getHeaders().then(async (headers) => {
        const res = await fetch("https://api.github.com/user", {
            headers,
        });
        const data = await res.json();
        localStorage.setItem("github.me", JSON.stringify(data));
    });

    return null;
};
fetchMe();

const isMine = (identifier: string) => {
    const myData = fetchMe();

    if (!myData) return false;

    const myName = myData.login as string;

    const { author } = fromShare(identifier);
    return myName === author;
};

export default {
    pat,
    setPat(pat: string) {
        localStorage.setItem("github.pat", pat);
        fetchMe();
    },
    me: fetchMe,
    save,
    isMine,
    update,
};
