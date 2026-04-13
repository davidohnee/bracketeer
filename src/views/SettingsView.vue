<script setup lang="ts">
type NavigationTarget = {
    title: string;
    route: string;
};

type NavigationGroup = {
    title: string;
    children: NavigationTarget[];
};

type Navigation = NavigationGroup[];

defineProps<{
    navigation: Navigation;
    base?: string;
    on?: "surface" | "background";
}>();
</script>

<template>
    <div
        class="settings"
        :class="{ invert: on === 'surface' }"
    >
        <div class="split">
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
    gap: 5em;
    align-items: start;

    & aside {
        display: flex;
        flex-direction: column;
        gap: 1em;
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
            border-right: 1px solid var(--color-border);
            padding-right: 1em;
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
            border-bottom: 1px solid var(--color-border);
            padding-bottom: 1em;
        }
    }
}
</style>
