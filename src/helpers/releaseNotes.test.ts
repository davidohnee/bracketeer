import { describe, it, expect } from "vitest";
import { parseVersions, VERSIONS } from "./releaseNotes";

describe("release notes helper", () => {
    it("parses version blocks from markdown", () => {
        const markdown = [
            "# Changelog",
            "",
            "Intro text that should be ignored.",
            "",
            "## [1.2.3] - 2026-01-02",
            "### Added",
            "- First change",
            "",
            "## [1.2.4] - 2026-01-03",
            "### Fixed",
            "- Second change",
            "",
        ].join("\n");

        const versions = parseVersions(markdown);

        expect(versions).toHaveLength(2);
        expect(versions[0]?.version).toBe("1.2.3");
        expect(versions[0]?.date).toBeInstanceOf(Date);
        expect(versions[0]?.date.getFullYear()).toBe(2026);
        expect(versions[0]?.date.getMonth()).toBe(0);
        expect(versions[0]?.date.getDate()).toBe(2);
        expect(versions[0]?.changes).toBe("### Added\n- First change\n\n");

        expect(versions[1]?.version).toBe("1.2.4");
        expect(versions[1]?.date).toBeInstanceOf(Date);
        expect(versions[1]?.date.getFullYear()).toBe(2026);
        expect(versions[1]?.date.getMonth()).toBe(0);
        expect(versions[1]?.date.getDate()).toBe(3);
        expect(versions[1]?.changes).toBe("### Fixed\n- Second change\n\n");
    });

    it("exposes parsed versions from the repository changelog", () => {
        expect(VERSIONS.length).toBeGreaterThan(0);
        expect(VERSIONS[0]?.version).toMatch(/^\d+\.\d+\.\d+$/);
    });
});
