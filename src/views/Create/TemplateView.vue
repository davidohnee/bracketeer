<script setup lang="ts">
import type { Tournament } from "@/types/tournament";
import { computed } from "vue";
import templates, {
    logoHref,
    templateHref,
    type TournamentTemplate,
} from "@/assets/samples/tournaments";
import { emptyTournament } from "@/helpers/defaults";
import { tournamentFromJson } from "@/helpers";
import { generateId } from "@/helpers/id";

const props = defineProps<{
    modelValue: Tournament | null;
}>();
const emit = defineEmits<{
    (e: "update:modelValue", value: Tournament): void;
    (e: "continue"): void;
}>();

const tournament = computed({
    get() {
        return props.modelValue;
    },
    set(value: Tournament) {
        emit("update:modelValue", value);
    },
});

const useTemplate = (template: TournamentTemplate | null) => {
    if (!template) {
        tournament.value = emptyTournament();
        emit("continue");
        return;
    }

    fetch(templateHref(template))
        .then((response) => response.json())
        .then((data) => {
            const template = tournamentFromJson(data);
            template.id = generateId();
            tournament.value = template;
            emit("continue");
        });
};
</script>
<template>
    <div class="template-list">
        <div
            class="template"
            @click="useTemplate(null)"
        >
            <ion-icon
                name="document-text-outline"
                class="icon"
            ></ion-icon>
            <span>Blank Tournament</span>
        </div>
        <div
            class="template"
            v-for="template in templates"
            :key="template.name"
            @click="useTemplate(template)"
        >
            <img
                :src="logoHref(template)"
                :alt="`Logo for ${template.name}`"
                class="logo"
            />
            <span>{{ template.name }}</span>
        </div>
    </div>
</template>

<style scoped>
.template-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(40ch, 1fr));
    gap: 1rem;

    .template {
        display: flex;
        flex-direction: column;
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: 1rem;
        padding: 1em;
        gap: 1em;
        cursor: pointer;

        &:hover {
            background: var(--color-surface-hover);
        }

        & img,
        ion-icon {
            max-width: 4rem;
            max-height: 4rem;
            object-fit: contain;
            margin: auto;
            font-size: 2rem;
        }
    }
}
</style>
