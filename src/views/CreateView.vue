<script setup lang="ts">
import StepProgress from "@/components/StepProgress.vue";
import Basics from "./Create/BasicsView.vue";
import Logistics from "./Create/LogisticsView.vue";
import Format from "./Create/FormatView.vue";
import type { Tournament } from "@/types/tournament";
import { ref, watch } from "vue";
import { tournamentFromJson } from "@/helpers";
import { useTournamentsStore } from "@/stores/tournaments";
import { useRouter } from "vue-router";

const tournament = ref<Tournament | null>(null);
const tournaments = useTournamentsStore();
const router = useRouter();

const todayAt1800 = new Date();
todayAt1800.setHours(18, 0, 0, 0);

const initTournament: Tournament = {
    version: 3,
    id: crypto.randomUUID(),
    name: "",
    teams: [],
    phases: [
        {
            id: crypto.randomUUID(),
            type: "group",
            name: "Group Phase",
            matches: [],
            groups: [],
            rounds: 3,
        },
        {
            id: crypto.randomUUID(),
            type: "knockout",
            name: "Knockout Phase",
            rounds: [],
            teamCount: 8,
        },
    ],
    config: {
        breakDuration: 5,
        knockoutBreakDuration: 5,
        courts: 4,
        startTime: todayAt1800,
        matchDuration: 10,
        sport: "other",
    },
};

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
const STEPS = ["Basics", "Logistics", "Format"];
const TITLES = ["Set Up Your Tournament", "Define Match Logistics", "Design the Competition"];
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
        <h1>{{ TITLES[currentStep] }}</h1>

        <Basics
            v-if="currentStep === 0"
            v-model="tournament"
        />
        <Logistics
            v-else-if="currentStep === 1"
            v-model="tournament"
        />
        <Format
            v-else-if="currentStep === 2"
            v-model="tournament"
        />
        <div class="row end">
            <button
                class="button"
                @click="currentStep++"
                v-if="currentStep < STEPS.length - 1"
            >
                Continue
            </button>
            <button
                class="button"
                @click="create"
                v-else
            >
                Create
            </button>
        </div>
    </div>
</template>
