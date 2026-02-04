import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useThemeStore, THEMES, type Theme } from "./theme";

describe("Theme Store", () => {
    beforeEach(() => {
        // Create a new pinia instance for each test
        setActivePinia(createPinia());

        // Clear localStorage before each test
        localStorage.clear();

        // Mock document.querySelector
        vi.spyOn(document, "querySelector").mockReturnValue({
            setAttribute: vi.fn(),
        } as any);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("Initial State", () => {
        it("should initialize with 'system' theme when localStorage is empty", () => {
            const store = useThemeStore();
            expect(store.currrent).toBe("system");
        });

        it("should initialize with stored theme from localStorage", () => {
            localStorage.setItem("theme", "dark");
            const store = useThemeStore();
            expect(store.currrent).toBe("dark");
        });

        it("should initialize with 'light' theme from localStorage", () => {
            localStorage.setItem("theme", "light");
            const store = useThemeStore();
            expect(store.currrent).toBe("light");
        });
    });

    describe("set method", () => {
        it("should update the current theme", () => {
            const store = useThemeStore();
            store.set("dark");
            expect(store.currrent).toBe("dark");
        });

        it("should set HTML data-theme attribute", () => {
            const mockElement = {
                setAttribute: vi.fn(),
            };
            vi.spyOn(document, "querySelector").mockReturnValue(mockElement as any);

            const store = useThemeStore();
            store.set("dark");

            expect(document.querySelector).toHaveBeenCalledWith("html");
            expect(mockElement.setAttribute).toHaveBeenCalledWith("data-theme", "dark");
        });

        it("should save theme to localStorage for 'dark' theme", () => {
            const store = useThemeStore();
            store.set("dark");
            expect(localStorage.getItem("theme")).toBe("dark");
        });

        it("should save theme to localStorage for 'light' theme", () => {
            const store = useThemeStore();
            store.set("light");
            expect(localStorage.getItem("theme")).toBe("light");
        });

        it("should remove theme from localStorage when set to 'system'", () => {
            localStorage.setItem("theme", "dark");
            const store = useThemeStore();
            store.set("system");
            expect(localStorage.getItem("theme")).toBeNull();
        });

        it("should handle all valid theme values", () => {
            const store = useThemeStore();
            THEMES.forEach((theme) => {
                store.set(theme);
                expect(store.currrent).toBe(theme);
            });
        });
    });

    describe("init method", () => {
        it("should apply the current theme on initialization", () => {
            const mockElement = {
                setAttribute: vi.fn(),
            };
            vi.spyOn(document, "querySelector").mockReturnValue(mockElement as any);

            localStorage.setItem("theme", "light");
            const store = useThemeStore();
            store.init();

            expect(mockElement.setAttribute).toHaveBeenCalledWith("data-theme", "light");
        });

        it("should apply system theme when no theme is stored", () => {
            const mockElement = {
                setAttribute: vi.fn(),
            };
            vi.spyOn(document, "querySelector").mockReturnValue(mockElement as any);

            const store = useThemeStore();
            store.init();

            expect(mockElement.setAttribute).toHaveBeenCalledWith("data-theme", "system");
        });
    });

    describe("THEMES constant", () => {
        it("should export all available themes", () => {
            expect(THEMES).toEqual(["dark", "light", "system"]);
        });

        it("should be readonly (as const)", () => {
            expect(THEMES).toHaveLength(3);
            expect(THEMES.includes("dark")).toBe(true);
            expect(THEMES.includes("light")).toBe(true);
            expect(THEMES.includes("system")).toBe(true);
        });
    });
});
