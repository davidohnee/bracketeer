<script setup lang="ts">
import type { Tournament } from "@/types/tournament";
import { useTournamentsStore } from "@/stores/tournaments";
import { ref } from "vue";
import FormatView from "@/views/Create/FormatView.vue";
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
        <FormatView v-model="editableTournament" />
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
