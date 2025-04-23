<script setup lang="ts">
import { randomiseGroupPhaseResults } from "@/helpers";
import type { Tournament } from "@/types/tournament";
import { updateKnockoutMatches } from "../../../helpers";
import { useTournamentsStore } from "../../../stores/tournaments";
import { useRouter } from "vue-router";
import { computed, ref } from "vue";
import ShareModal from "./ShareModal.vue";
import gistClient from "@/gistClient";

const props = defineProps<{
    tournament: Tournament;
}>();

const tournaments = useTournamentsStore();
const router = useRouter();

const shareModal = ref<typeof ShareModal>();

const randomGroupPhase = () => {
    randomiseGroupPhaseResults(props.tournament);
    update();
};

const update = () => {
    updateKnockoutMatches(props.tournament);
};

const deleteTournament = () => {
    tournaments.deleteTournament(props.tournament.id);
    router.push({ name: "tournaments" });
};

const resetTournament = () => {
    const tournament = tournaments.getTournamentById(props.tournament.id);

    for (const round of tournament?.groupPhase ?? []) {
        for (const match of round.matches) {
            match.teams[0].score = 0;
            match.teams[1].score = 0;
            match.status = "scheduled";
        }
    }
    for (const round of tournament?.knockoutPhase ?? []) {
        for (const match of round.matches) {
            match.teams[0].score = 0;
            match.teams[1].score = 0;
            match.status = "scheduled";
        }
    }
};

const duplicateTournament = () => {
    const tournament = tournaments.getTournamentById(props.tournament.id);
    if (!tournament) return;

    const newTournament = { ...tournament, id: crypto.randomUUID() };
    tournaments.add(newTournament);
    router.push({ name: "tournament", params: { id: newTournament.id } });
};

const canUpdate = computed(() => {
    if (!props.tournament.remote?.length) return false;

    const identifier = props.tournament.remote[0].identifier;

    return gistClient.isMine(identifier);
});
</script>

<template>
    <ShareModal ref="shareModal" />
    <div class="form">
        <section>
            <h3>Settings</h3>
            <div class="row">
                <div class="field">
                    <label for="result-input">Result input type</label>
                    <select
                        disabled
                        value="beerpong.10"
                        id="result-input"
                    >
                        <option value="beerpong.10">Beerpong (10 pcs.)</option>
                    </select>
                </div>
                <div class="field">
                    <router-link
                        class="secondary"
                        :to="{
                            name: 'tournament.config.teams',
                            params: { id: props.tournament.id },
                        }"
                    >
                        <button class="secondary">Edit Teams</button>
                    </router-link>
                </div>
                <div class="field">
                    <button @click="shareModal?.open(props.tournament)">Share</button>
                </div>
                <div
                    class="field"
                    v-if="canUpdate"
                >
                    <button @click="shareModal?.open(props.tournament)">Publish Update</button>
                </div>
            </div>
        </section>
        <section>
            <h3>Debug</h3>
            <div class="row">
                <button
                    class="secondary"
                    @click="randomGroupPhase"
                >
                    Randomise Group Phase
                </button>
                <button
                    class="secondary"
                    @click="update"
                >
                    Update Knockout Matches
                </button>
                <button
                    class="secondary"
                    @click="duplicateTournament"
                >
                    Duplicate Tournament
                </button>
            </div>
        </section>
        <section>
            <h3>Danger zone</h3>
            <div class="row">
                <button
                    class="danger secondary"
                    @click="resetTournament"
                >
                    Reset Tournament
                </button>
                <button
                    class="danger"
                    @click="deleteTournament"
                >
                    Delete Tournament
                </button>
            </div>
        </section>
    </div>
</template>

<style scoped>
.form {
    padding: 1em;
    width: calc(100% - 2em);
}

.row {
    justify-content: flex-start;
    align-items: flex-end;

    & select {
        margin: 0;
    }
}

section {
    width: 100%;
}
</style>
