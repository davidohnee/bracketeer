<script setup lang="ts">
import type { Tournament } from "@/types/tournament";
import { useTournamentsStore } from "@/stores/tournaments";
import { computed, ref, toRaw } from "vue";
import FormatView from "@/views/Create/FormatView.vue";
import { tournamentFromJson } from "@/helpers";
import { useRouter } from "vue-router";
import { generateGroupPhases } from "@/helpers/matchplan/groupPhase";
import { generateKnockoutBrackets } from "@/helpers/matchplan/knockoutPhase";

const props = defineProps<{
    tournament: Tournament;
}>();

const tournamentStore = useTournamentsStore();
const tournament = tournamentStore.getTournamentById(props.tournament.id)!;

const startTimeString = ref<string>(
    tournament.config.startTime
        ? tournament.config.startTime.toLocaleString("sv").replace(" ", "T")
        : "",
);
const startTime = computed<Date | null>(() =>
    startTimeString.value ? new Date(startTimeString.value) : null,
);
const updateStartTime = () => {
    if (startTime.value) {
        if (editableTournament.value.config.startTime.getTime() === startTime.value.getTime()) {
            return;
        }

        const rawTournament = toRaw(editableTournament.value);
        editableTournament.value.config.startTime = startTime.value;
        rawTournament.phases = generateGroupPhases(rawTournament);
        editableTournament.value.phases = generateKnockoutBrackets(rawTournament);
    }
};

const editableTournament = ref<Tournament>(
    tournamentFromJson(JSON.parse(JSON.stringify(tournament))),
);

const router = useRouter();

const save = () => {
    updateStartTime();
    tournament.phases = editableTournament.value.phases;
    tournament.config = editableTournament.value.config;

    router.push({
        name: "tournament",
        params: { tournamentId: tournament.id },
    });
};
</script>

<template>
    <div class="form plan-editor">
        <div class="row">
            <div class="field">
                <label for="tournament-start">Start</label>
                <input
                    id="tournament-start"
                    type="datetime-local"
                    v-model="startTimeString"
                    @input="updateStartTime"
                />
            </div>
        </div>
        <FormatView v-model="editableTournament" />
        <div class="row end">
            <router-link
                class="button"
                :to="{ name: 'tournament', params: { tournamentId: tournament.id } }"
            >
                <button class="secondary danger">Cancel</button>
            </router-link>
            <button
                class="secondary"
                @click="save"
            >
                Save
            </button>
        </div>
    </div>
</template>

<style scoped>
.plan-editor {
    padding: 1em;
    width: calc(100% - 2em);
}
</style>
