<script setup lang="ts">
import StepProgress from "@/components/StepProgress.vue";
import TemplateView from "./Create/TemplateView.vue";
import Basics from "./Create/BasicsView.vue";
import Logistics from "./Create/LogisticsView.vue";
import Format from "./Create/FormatView.vue";
import type { Tournament } from "@/types/tournament";
import { ref, watch } from "vue";
import { tournamentFromJson } from "@/helpers";
import { useTournamentsStore } from "@/stores/tournaments";
import { useRouter } from "vue-router";
import { emptyTournament } from "@/helpers/defaults";

const tournament = ref<Tournament | null>(null);
const tournaments = useTournamentsStore();
const router = useRouter();

const initTournament: Tournament = emptyTournament();

const getTournament = () => {
    const sessionValue = sessionStorage.getItem("creator.tournament");
    if (!sessionValue) return initTournament;

    const tournament = JSON.parse(sessionValue);
    return tournamentFromJson(tournament);
};
tournament.value = getTournament();

watch(
    tournament,
    (newValue, oldValue) => {
        if (oldValue == null) return;
        sessionStorage.setItem("creator.tournament", JSON.stringify(newValue));
    },
    { deep: true },
);
const STEPS = ["Template", "Basics", "Logistics", "Format"];
const TITLES = [
    "Choose a template",
    "Set Up Your Tournament",
    "Define Match Logistics",
    "Design the Competition",
];
const currentStep = ref(parseInt(sessionStorage.getItem("creator.step") ?? "0"));

watch(currentStep, (newValue) => {
    sessionStorage.setItem("creator.step", newValue.toString());
});

const create = () => {
    tournaments.add(tournament.value!);
    sessionStorage.removeItem("creator.tournament");
    sessionStorage.removeItem("creator.step");
    router.push({ name: "tournament", params: { tournamentId: tournament.value!.id } });
};
</script>
<template>
    <div
        class="form"
        v-if="tournament"
    >
        <StepProgress
            :steps="STEPS"
            v-model="currentStep"
            can-go-back
            can-go-forward
        />
        <div class="row between baseline">
            <h2>{{ TITLES[currentStep] }}</h2>
            <button
                class="button"
                @click="currentStep++"
                v-if="currentStep < STEPS.length - 1"
            >
                <ion-icon name="arrow-forward"></ion-icon>
                Continue
            </button>
            <button
                class="button"
                @click="create"
                v-else
            >
                <ion-icon name="checkmark"></ion-icon>
                Create
            </button>
        </div>

        <TemplateView
            v-if="currentStep === 0"
            v-model="tournament"
            @continue="currentStep++"
        />
        <Basics
            v-if="currentStep === 1"
            v-model="tournament"
        />
        <Logistics
            v-else-if="currentStep === 2"
            v-model="tournament"
        />
        <Format
            v-else-if="currentStep === 3"
            v-model="tournament"
        />
    </div>
</template>

<style scoped>
h2 {
    margin-top: 2rem;
}

.row.baseline {
    align-items: baseline;
}

@media (max-width: 768px) {
    .form {
        margin: 1em;
    }

    .desktop-only {
        display: none;
    }
}
</style>
