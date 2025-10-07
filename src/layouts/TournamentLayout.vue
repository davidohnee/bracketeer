<script setup lang="ts">
import { computed, ref } from "vue";
import type { Tournament } from "@/types/tournament";
import { useRoute } from "vue-router";
import TrackModal from "@/components/modals/ShareViewerModal.vue";
import gistClient from "@/gistClient";

const route = useRoute();
const trackModal = ref<typeof TrackModal>();

const TAB_LOOKUP = {
    table: "Table",
    knockout: "Knockout",
    matches: "Matches",
    live: "Live",
    config: "Settings",
};
type Tab = keyof typeof TAB_LOOKUP;

const props = defineProps<{
    modelValue: Tournament;
    tabs?: Tab[];
    subtitle?: string;
    readonly?: boolean;
}>();
const emit = defineEmits<{
    (e: "update:modelValue", value: Tournament): void;
}>();

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
    return name.split(".")[0];
});

const isMine = computed(() => {
    if (!tournament.value?.remote?.length) return false;
    const identifier = tournament.value?.remote[0]!.identifier;
    return gistClient.isMine(identifier);
});
</script>

<template>
    <TrackModal ref="trackModal" />
    <div
        v-if="tournament"
        class="tournament"
    >
        <section>
            <div class="title-component">
                <h3>{{ tournament.name }}</h3>
                <ion-icon
                    v-if="isMine"
                    @click="trackModal?.open(tournament)"
                    class="clickable"
                    name="share-outline"
                />
            </div>
            <span
                v-if="subtitle"
                class="source text-muted"
                >{{ subtitle }}</span
            >
            <div class="tabs">
                <router-link
                    v-for="key in tabs"
                    :key="key"
                    :to="{ name: baseRoute + '.' + key, params: { tournamentId: tournament.id } }"
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
    border-radius: 1em;
    overflow: clip;
    display: flex;
    flex-direction: column;
    align-items: flex-start;

    & span.source {
        margin-left: 1rem;
    }

    &:has(span.source) {
        .title-component {
            padding-bottom: 0;
        }
        & h3 {
            margin-bottom: 0;
        }
    }

    & span.source {
        margin-bottom: 1rem;
    }

    .tabs {
        color: var(--color-text-primary);
        display: flex;
        gap: 1em;
        padding: 0 1em;
        border-bottom: 1px solid var(--color-border);
        width: calc(100% - 2em);
        overflow: auto;

        & a {
            color: var(--color-text-primary);
            text-decoration: none;
            padding: 0.5em 1em;
            border-radius: 1em;
            position: relative;

            &:hover {
                color: var(--color-text-secondary);
            }

            &.router-link-active::after {
                content: "";
                position: absolute;
                bottom: 0;
                left: 1em;
                right: 1em;
                height: 2px;
                background-color: var(--color-text-primary);
                margin-top: 0.5em;
            }
        }
    }
}

.title-component {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1em;
    width: calc(100% - 2em);

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
