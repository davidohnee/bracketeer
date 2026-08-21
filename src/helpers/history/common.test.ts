import { describe, expect, it } from "vitest";
import {
    applyChanges,
    changesAreEqual,
    changesAreReverse,
    reverseChange,
    type Change,
} from "./common";

describe("Common History Tests", () => {
    it("reverse change", () => {
        const change: Change = {
            type: "CHANGE",
            oldValue: "old",
            value: "new",
            path: ["name"],
        };

        const reversed = reverseChange(change);

        const expected: Change = {
            type: "CHANGE",
            oldValue: "new",
            value: "old",
            path: ["name"],
        };

        expect(reversed).toEqual(expected);
    });

    it("detects equal changes", () => {
        const change1: Change = {
            type: "CHANGE",
            oldValue: "old",
            value: "new",
            path: ["name"],
        };

        expect(changesAreEqual(change1, change1)).toBe(true);
    });

    it("detects reverse changes", () => {
        const change1: Change = {
            type: "CHANGE",
            oldValue: "old",
            value: "new",
            path: ["name"],
        };

        const change2: Change = {
            type: "CHANGE",
            oldValue: "new",
            value: "old",
            path: ["name"],
        };

        expect(changesAreReverse(change1, change2)).toBe(true);
    });

    it("applies changes correctly", () => {
        const target: Record<string, unknown> = {
            name: "old",
        };

        const changes: Change[] = [
            {
                type: "CHANGE",
                oldValue: "old",
                value: "new",
                path: ["name"],
            },
        ];

        applyChanges(target, changes);

        expect(target).toEqual({ name: "new" });
    });
});
