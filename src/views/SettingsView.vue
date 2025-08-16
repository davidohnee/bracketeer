<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();

const structure = [
    {
        title: "General",
        children: [
            {
                title: "About",
                route: "settings.general.about",
            },
            {
                title: "Appearance",
                route: "settings.general.appearance",
            },
        ],
    },
    {
        title: "Share",
        children: [
            {
                title: "GitHub Gists",
                route: "settings.share.gists",
            },
        ],
    },
];

const sectionTitle = computed(() => {
    const section = structure
        .flatMap((section) => section.children)
        .find((child) => child.route === route.name);
    return section ? section.title : "";
});
</script>

<template>
    <div class="settings">
        <h1>{{ sectionTitle }}</h1>

        <div class="split">
            <aside class="sidebar">
                <div
                    v-for="section in structure"
                    :key="section.title"
                    class="sidebar-section"
                >
                    <h5>{{ section.title }}</h5>
                    <router-link
                        v-for="child in section.children"
                        :key="child.route"
                        class="sidebar-item"
                        :to="{ name: child.route }"
                    >
                        {{ child.title }}
                    </router-link>
                </div>
            </aside>
            <div class="settings-content">
                <router-view />
            </div>
        </div>
    </div>
</template>

<style scoped>
.split {
    display: grid;
    grid-template-columns: 30ch 1fr;
    gap: 1em;

    & aside {
        display: flex;
        flex-direction: column;
        gap: 1em;
        background: var(--color-surface);
        border-radius: 0.5em;
        padding: 1em;
    }

    & h5 {
        margin: 0;
        text-transform: uppercase;
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
            background: var(--color-background);
            border-color: var(--color-border);
        }
    }
}

@media (max-width: 768px) {
    .settings {
        padding: 1em;
    }

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
