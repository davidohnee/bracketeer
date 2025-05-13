import { defineStore } from "pinia";
import { ref } from "vue";

const KEY = "theme";
export const THEMES = ["dark", "light", "system"] as const;
export type Theme = (typeof THEMES)[number];

export const useThemeStore = defineStore("theme", () => {
    const currrent = ref<Theme>((localStorage.getItem(KEY) as Theme) || "system");

    const set = (newTheme: Theme) => {
        currrent.value = newTheme;
        document.querySelector("html")?.setAttribute("data-theme", newTheme);

        if (newTheme === "system") {
            window.localStorage.removeItem(KEY);
            return;
        } else {
            window.localStorage.setItem(KEY, newTheme);
        }
    };

    const init = () => set(currrent.value);

    return {
        currrent,
        set,
        init,
    };
});
