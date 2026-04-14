<script setup lang="ts">
import { computed } from "vue";

type NavigationTarget = {
    title: string;
    route: string;
};

type NavigationGroup = {
    title: string;
    children: NavigationTarget[];
};

type Navigation = NavigationGroup[];

const props = defineProps<{
    navigation: Navigation;
    base?: string;
    on?: "surface" | "background";
    layout?: "spacious" | "compact";
}>();

const layout = computed(() => props.layout || "spacious");
</script>

<template>
    <div
        class="settings"
        :class="{ invert: on === 'surface' }"
    >
        <div
            class="split"
            :class="layout"
        >
            <aside class="sidebar">
                <div
                    v-for="section in navigation"
                    :key="section.title"
                    class="sidebar-section"
                >
                    <h5>{{ section.title }}</h5>
                    <router-link
                        v-for="child in section.children"
                        :key="child.route"
                        class="sidebar-item"
                        :to="{ name: (base + child.route) as any }"
                    >
                        {{ child.title }}
                    </router-link>
                </div>
            </aside>
            <div class="settings-content">
                <slot
                    v-if="$slots.content"
                    name="content"
                />
                <router-view v-else />
            </div>
        </div>
    </div>
</template>

<style scoped>
.split {
    display: grid;
    grid-template-columns: 25ch 1fr;
    align-items: start;

    &.spacious {
        gap: 5em;
    }

    &.compact {
        gap: 2em;
    }

    & aside {
        display: flex;
        flex-direction: column;
        gap: 1em;
        border-right: 1px solid var(--color-border);
        padding-right: 1em;
    }

    & h5 {
        margin: 0;
        margin-left: 0.5em;
        text-transform: uppercase;
        color: var(--color-text-secondary);
    }

    & h2 {
        margin: 0;
        margin-bottom: 0.5em;
    }

    & a {
        color: inherit;
        border: 1px solid transparent;
        display: block;
        padding: 0.5em;
        border-radius: 0.5em;

        &.router-link-active {
            background: var(--color-surface);
            border-color: var(--color-border);
        }
    }
}

.settings,
.settings-content {
    width: 100%;
}

.settings.invert {
    @media (min-width: 768px) {
        .split aside {
            height: 100%;
        }
    }

    .split a.router-link-active {
        background: var(--color-background);
    }
}

@media (max-width: 768px) {
    .split {
        grid-template-columns: 1fr;
        gap: 1em;

        & aside {
            padding-right: 0;
            border-right: none;
            border-bottom: 1px solid var(--color-border);
            padding-bottom: 1em;
        }
    }
}
</style>
