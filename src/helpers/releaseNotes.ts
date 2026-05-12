import Changelog from "#root/CHANGELOG.md?raw";

export interface Version {
    version: string;
    date: Date;
    changes: string;
}

export const parseVersions = (markdown: string) => {
    const lines = markdown.split("\n");

    const versions: Version[] = [];
    let currentVersion: Version | null = null;

    const rVersion = /^## \[(\d+\.\d+\.\d+)\] - (\d{4}-\d{2}-\d{2})$/g;

    for (const line of lines) {
        const versionMatches = rVersion.exec(line);

        if (versionMatches) {
            if (currentVersion) {
                versions.push(currentVersion);
            }

            currentVersion = {
                version: versionMatches[1],
                date: new Date(versionMatches[2] + "T00:00:00"),
                changes: "",
            };
            continue;
        }

        if (!currentVersion) continue;

        currentVersion.changes += line + "\n";
    }

    if (currentVersion) {
        versions.push(currentVersion);
    }

    return versions;
};

export const VERSIONS = parseVersions(Changelog);
