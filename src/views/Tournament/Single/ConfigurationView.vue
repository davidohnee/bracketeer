<script setup lang="ts">
import { randomiseGroupPhaseResults } from "@/helpers";
import type { Tournament } from "@/types/tournament";
import { updateKnockoutMatches } from "../../../helpers";
import { useTournamentsStore } from "../../../stores/tournaments";
import { useRouter } from "vue-router";
import { computed, ref } from "vue";
import ShareModal from "./ShareModal.vue";
import gistClient from "@/gistClient";
import TrackModal from "./TrackModal.vue";
import { Notifications } from "@/components/notifications/createNotification";

const props = defineProps<{
    tournament: Tournament;
}>();

const tournaments = useTournamentsStore();
const router = useRouter();

const shareModal = ref<typeof ShareModal>();
const trackModal = ref<typeof TrackModal>();

const randomGroupPhase = () => {
    randomiseGroupPhaseResults(props.tournament);
    update();
};

const update = () => {
    updateKnockoutMatches(props.tournament);
    Notifications.addSuccess(
        "Knockout matches updated",
        "The knockout matches have been updated based on the current group phase results.",
        3000,
    );
};

const deleteTournament = () => {
    Notifications.addYesNo(
        "Delete Tournament",
        "Are you sure you want to delete the tournament? This action cannot be undone.",
        undefined,
        () => {
            tournaments.deleteTournament(props.tournament.id);
            router.push({ name: "home" });
            Notifications.addSuccess(
                "Tournament deleted",
                "The tournament has been deleted successfully.",
                3000,
            );
        },
    );
};

const resetTournament = () => {
    Notifications.addYesNo(
        "Reset Tournament",
        "Are you sure you want to reset the tournament? This will remove all results and start the tournament from scratch.",
        undefined,
        () => {
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
                    for (const team of match.teams) {
                        team.score = 0;
                        delete team.ref;
                    }
                    match.status = "scheduled";
                }
            }

            Notifications.addSuccess(
                "Tournament reset",
                "The tournament has been reset. All results have been removed.",
                3000,
            );
        },
    );
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

const canPull = computed(() => {
    if (!props.tournament.remote?.length) return false;
    return !!props.tournament.remote[0].identifier;
});

const pull = async () => {
    const tournament = tournaments.getTournamentById(props.tournament.id);
    tournaments.pull({
        tournament,
    });
    Notifications.addSuccess(
        "Tournament updated",
        "The tournament has been updated successfully.",
        3000,
    );
};

const hasStarted = computed(() => {
    const tournament = tournaments.getTournamentById(props.tournament.id);
    if (!tournament) return false;
    return tournament.groupPhase.some((round) =>
        round.matches.some((match) => match.status !== "scheduled"),
    );
});
</script>

<template>
    <ShareModal ref="shareModal" />
    <TrackModal ref="trackModal" />
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
                    <router-link
                        :to="{
                            name: 'tournament.config.plan',
                            params: { id: props.tournament.id },
                        }"
                        :disabled="hasStarted"
                        :title="
                            hasStarted
                                ? 'You cannot edit the match plan after the tournament has started. Reset the tournament first.'
                                : ''
                        "
                    >
                        <button
                            :disabled="hasStarted"
                            class="secondary"
                        >
                            Edit Match Plan
                        </button>
                    </router-link>
                </div>
            </div>
        </section>
        <section>
            <h3>Sharing & Sync</h3>
            <div class="row">
                <div
                    class="field"
                    v-if="canPull"
                >
                    <button
                        class="secondary"
                        @click="pull"
                    >
                        <ion-icon name="cloud-download-outline" />
                        Pull
                    </button>
                </div>
                <div
                    class="field"
                    :disabled="!canUpdate"
                >
                    <button
                        class="secondary"
                        @click="tournaments.share(props.tournament)"
                    >
                        <ion-icon name="cloud-upload-outline" />
                        Publish Update
                    </button>
                </div>
                <div class="field">
                    <button @click="shareModal?.open(props.tournament)">
                        <ion-icon name="share-outline" />
                        Share
                    </button>
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
                    :disabled="!hasStarted"
                    :title="
                        !hasStarted ? 'You cannot reset the tournament before it has started.' : ''
                    "
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
    flex-wrap: wrap;

    & select {
        margin: 0;
    }
}

@media (max-width: 600px) {
    .row {
        flex-direction: column;
        align-items: stretch;

        & button {
            width: 100%;
        }
    }
}

section {
    width: 100%;
}
</style>
