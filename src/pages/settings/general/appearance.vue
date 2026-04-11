<script setup lang="ts">
import { THEMES, useThemeStore } from "@/stores/theme";
const theme = useThemeStore();
</script>
<template>
    <div class="themes">
        <div
            v-for="availableTheme in THEMES"
            :key="availableTheme"
            class="theme"
            :class="{ selected: availableTheme === theme.currrent }"
        >
            <div
                class="theme-preview"
                :class="availableTheme"
                @click="theme.set(availableTheme)"
            ></div>
            <span class="theme-name">
                {{ availableTheme }}
            </span>
        </div>
    </div>
</template>
<style>
.themes {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
}

.theme {
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;

    &.selected {
        color: var(--color-primary);

        .theme-preview {
            border-color: var(--color-primary);
        }
    }
}

.theme-preview {
    width: 50px;
    height: 50px;
    border-radius: 0.5em;
    border: 2px solid var(--color-border);

    &.light {
        background-color: white;
    }
    &.dark {
        background-color: black;
    }
    &.system {
        background-color: grey;
        background-image: -webkit-linear-gradient(-45deg, white 50%, black 50%);
    }
}
</style>
