<script setup lang="ts">
import type { Tournament } from "@/types/tournament";
import { useTournamentsStore } from "@/stores/tournaments";
import { ref } from "vue";
import FormatSubView from "@/views/Create/FormatSubView.vue";
import { tournamentFromJson } from "@/helpers";
import { useRouter } from "vue-router";

const props = defineProps<{
    tournament: Tournament;
}>();

const tournamentStore = useTournamentsStore();
const tournament = tournamentStore.getTournamentById(props.tournament.id)!;

const editableTournament = ref<Tournament>(
    tournamentFromJson(JSON.parse(JSON.stringify(tournament))),
);

const router = useRouter();

const save = () => {
    tournament.knockoutPhase = editableTournament.value.knockoutPhase;
    tournament.groupPhase = editableTournament.value.groupPhase;
    tournament.config = editableTournament.value.config;

    router.push({
        name: "tournament",
        params: { tournamentId: tournament.id },
    });
};
</script>

<template>
    <div class="form plan-editor">
        <FormatSubView v-model="editableTournament" />
        <div class="row end">
            <router-link
                class="button"
                :to="{ name: 'tournament', params: { tournamentId: tournament.id } }"
            >
                <button class="danger">Cancel</button>
            </router-link>
            <button @click="save">Save</button>
        </div>
    </div>
</template>

<style scoped>
.plan-editor {
    padding: 1em;
    width: calc(100% - 2em);
}
</style>
