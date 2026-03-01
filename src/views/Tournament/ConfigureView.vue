<script setup lang="ts">
import { randomiseGroupPhaseResults } from "@/helpers";
import type {
    GroupTournamentPhase,
    KnockoutTournamentPhase,
    Tournament,
    TournamentPhase,
} from "@/types/tournament";
import { useTournamentsStore } from "@/stores/tournaments";
import { useRouter } from "vue-router";
import { computed, ref, toRaw } from "vue";
import ShareModal from "@/components/modals/ShareFullModal.vue";
import gistClient from "@/gistClient";
import { Notifications } from "@/components/notifications/createNotification";
import { generateKnockoutBracket, updateKnockoutMatches } from "@/helpers/matchplan/knockoutPhase";
import { agoString, getTournamentStatus } from "@/helpers/common";
import { generateGroupPhase } from "@/helpers/matchplan/groupPhase";
import { fromShare } from "@/share";

const props = defineProps<{
    tournament: Tournament;
}>();

const tournaments = useTournamentsStore();
const tournament = tournaments.getTournamentById(props.tournament.id)!;
const router = useRouter();

const shareModal = ref<typeof ShareModal>();

const randomGroupPhase = () => {
    const rawTournament = toRaw(tournament);
    randomiseGroupPhaseResults(rawTournament);
    tournament.phases = [...rawTournament.phases];
    hasStarted.value = true;
    update();
};

const update = () => {
    const rawTournament = toRaw(tournament);
    updateKnockoutMatches(rawTournament);
    tournament.phases = [...rawTournament.phases];
    Notifications.addSuccess("Knockout matches updated", {
        details: "The knockout matches have been updated based on the current group phase results.",
        timeout: 3000,
    });
};

const deleteTournament = () => {
    Notifications.addYesNo("Delete Tournament", {
        details: "Are you sure you want to delete the tournament? This action cannot be undone.",
        onYes: () => {
            tournaments.deleteTournament(props.tournament.id);
            router.push({ name: "home" });
            Notifications.addSuccess("Tournament deleted", {
                details: "The tournament has been deleted successfully.",
                timeout: 3000,
            });
        },
    });
};

const resetGroupPhase = (phase: GroupTournamentPhase, tournament: Tournament) => {
    phase.matches = generateGroupPhase(phase, tournament);
};
const resetKnockoutPhase = (phase: KnockoutTournamentPhase, tournament: Tournament) => {
    phase.rounds = generateKnockoutBracket(phase, tournament);
};
const resetPhase = (phase: TournamentPhase, tournament: Tournament) => {
    if (phase.type === "group") {
        resetGroupPhase(phase as GroupTournamentPhase, tournament);
    } else if (phase.type === "knockout") {
        resetKnockoutPhase(phase as KnockoutTournamentPhase, tournament);
    }
};

const resetTournament = () => {
    Notifications.addYesNo("Reset Tournament", {
        details:
            "Are you sure you want to reset the tournament? This will remove all results and start the tournament from scratch.",
        onYes: () => {
            const rawTournament = toRaw(tournament);

            for (const phase of rawTournament.phases) {
                resetPhase(phase, rawTournament);
            }

            tournament.phases = [...rawTournament.phases];
            hasStarted.value = false;

            Notifications.addSuccess("Tournament reset", {
                details: "The tournament has been reset. All results have been removed.",
                timeout: 3000,
            });
        },
    });
};

const duplicateTournament = () => {
    const newTournament = { ...tournament, id: crypto.randomUUID() };
    tournaments.add(newTournament);
    router.push({ name: "tournament", params: { tournamentId: newTournament.id } });
};

const canPush = computed(() => {
    if (!props.tournament.remote?.length) return false;
    const identifier = props.tournament.remote[0]!.identifier;
    return gistClient.isMine(identifier);
});

const canPull = computed(() => {
    if (!props.tournament.remote?.length) return false;
    return !!props.tournament.remote[0]!.identifier;
});

const pull = async () => {
    try {
        await tournaments.pull({
            tournament,
        });
        Notifications.addSuccess("Tournament updated", {
            details: "The tournament has been updated successfully.",
            timeout: 3000,
        });
    } catch (error) {
        console.error("Error pulling tournament:", error);
        Notifications.addError("Error updating tournament", {
            details: "There was an error updating the tournament. Please try again.",
            timeout: 3000,
        });
    }
};

const lastPushed = computed(() => {
    if (!props.tournament.remote?.length) return null;
    const pushed = props.tournament.remote[0]!.pushDate;
    if (!pushed) return null;
    return typeof pushed === "string" ? new Date(pushed) : pushed;
});

const lastPushedAgo = computed(() => {
    const lastPushedDate = lastPushed.value;
    if (!lastPushedDate) return null;
    return agoString(lastPushedDate);
});

const remoteDescription = computed(() => {
    if (!props.tournament.remote?.length) return "Not shared";
    const identifier = props.tournament.remote[0]!.identifier;
    const share = fromShare(identifier);
    return share ? `${share.author} via ${share.mode}` : "Unknown source";
});

const hasStarted = ref(getTournamentStatus(tournament) !== "scheduled");
</script>

<template>
    <ShareModal ref="shareModal" />
    <div class="form">
        <section>
            <h3>Settings</h3>
            <div class="row">
                <div class="field">
                    <router-link
                        class="secondary"
                        :to="{
                            name: 'tournament.config.teams',
                            params: { tournamentId: props.tournament.id },
                        }"
                    >
                        <button class="secondary">Edit Teams</button>
                    </router-link>
                </div>
                <div class="field">
                    <router-link
                        :to="{
                            name: 'tournament.config.plan',
                            params: { tournamentId: props.tournament.id },
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
            <div
                v-if="lastPushed"
                class="row"
            >
                <div class="field">
                    <p class="my-0">
                        Last pushed:
                        <strong>
                            {{ lastPushedAgo }}
                        </strong>
                    </p>
                </div>
            </div>
            <div class="row">
                <div class="field">
                    <p
                        v-if="props.tournament.remote?.length"
                        class="mt-0"
                    >
                        Remote source:
                        <strong>
                            {{ remoteDescription }}
                        </strong>
                    </p>
                    <p v-else>This tournament is <strong>not</strong> linked to a remote source.</p>
                </div>
            </div>
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
                    v-if="canPush"
                >
                    <button
                        class="secondary"
                        @click="tournaments.share(props.tournament)"
                    >
                        <ion-icon name="cloud-upload-outline" />
                        Push
                    </button>
                </div>
                <div
                    class="field"
                    v-if="!tournament.remote?.length"
                >
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
