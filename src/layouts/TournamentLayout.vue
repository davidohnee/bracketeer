<script setup lang="ts">
import { computed } from "vue";
import type { Tournament } from "@/types/tournament";
import { useRoute } from "vue-router";
import TournamentContextMenu from "@/components/TournamentContextMenu.vue";
import EditableText from "@/components/input/EditableText.vue";

const route = useRoute();

const TAB_LOOKUP = {
    table: "Table",
    knockout: "Knockout",
    matches: "Matches",
    live: "Live",
    about: "About",
    config: "Settings",
};
type Tab = keyof typeof TAB_LOOKUP;

const props = defineProps<{
    modelValue: Tournament;
    tabs?: Tab[];
    subtitle?: string;
    readonly?: boolean;
}>();

const emit = defineEmits<(e: "update:modelValue", value: Tournament) => void>();

const tabs = computed(() => {
    return props.tabs ?? Object.keys(TAB_LOOKUP);
});

const tournament = computed({
    get() {
        return props.modelValue;
    },
    set(value) {
        emit("update:modelValue", value);
    },
});

const baseRoute = computed(() => {
    if (!route.name) {
        return null;
    }
    const name = route.name as string;
    return name.split("/").slice(0, 3).join("/");
});
</script>

<template>
    <div
        v-if="tournament"
        class="tournament"
    >
        <section>
            <div class="title-component">
                <h3>
                    <EditableText
                        v-model="tournament.name"
                        :disabled="props.readonly"
                    />
                </h3>
                <TournamentContextMenu
                    v-if="!props.readonly"
                    :tournament="tournament"
                    @deleted="$router.push({ name: '/' })"
                />
            </div>
            <span
                v-if="subtitle"
                class="source text-muted"
            >
                {{ subtitle }}</span
            >
            <div class="tabs">
                <router-link
                    v-for="key in tabs"
                    :key="key"
                    :to="{
                        name: (baseRoute + '/' + key) as any,
                        params: route.params,
                    }"
                >
                    {{ TAB_LOOKUP[key as Tab] }}
                </router-link>
            </div>
            <RouterView
                :tournament="tournament"
                @update:tournament="tournament = $event"
                :readonly="props.readonly"
            />
        </section>
    </div>
</template>

<style scoped>
section {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-l);
    overflow: clip;
    display: flex;
    flex-direction: column;
    align-items: flex-start;

    &:has(span.source) {
        .title-component {
            padding-bottom: 0;
        }
        & h3 {
            margin-bottom: 0;
        }
    }

    & span.source {
        margin-bottom: var(--spacing-m);
        margin-left: var(--spacing-m);
    }

    .tabs {
        color: var(--color-text-primary);
        display: flex;
        gap: var(--spacing-m);
        padding: 0 var(--spacing-m);
        border-bottom: 1px solid var(--color-border);
        width: calc(100% - 2 * var(--spacing-m));
        overflow: auto;

        & a {
            color: var(--color-text-primary);
            text-decoration: none;
            padding: var(--spacing-xs) var(--spacing-m);
            border-radius: var(--radius-l);
            position: relative;

            &:hover {
                color: var(--color-text-secondary);
            }

            &.router-link-active::after {
                content: "";
                position: absolute;
                bottom: 0;
                left: var(--spacing-m);
                right: var(--spacing-m);
                height: 2px;
                background-color: var(--color-text-primary);
                margin-top: var(--spacing-xs);
            }
        }
    }
}

.filter-menu {
    > div {
        cursor: pointer;
        padding: var(--spacing-xs);
        transition: all 0.2s ease-in-out;
        display: grid;
        grid-template-columns: 1fr 100px;
        gap: var(--spacing-xs);
        align-items: center;

        &:hover {
            background: var(--color-surface-hover);
        }
    }
}

.title-component {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-m);
    width: calc(100% - 2 * var(--spacing-m));

    .clickable {
        font-size: 1.5em;
    }
}

@media (max-width: 600px) {
    section .tabs {
        gap: 0;
    }
}
</style>
