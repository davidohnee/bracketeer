<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, toRaw } from "vue";
import type { Match, RichMatch, Tournament } from "@/types/tournament";
import TeamTable from "@/components/TeamTable.vue";
import { useRoute } from "vue-router";
import { useTournamentsStore } from "@/stores/tournaments";
import { updateKnockoutMatches } from "@/helpers/matchplan/knockoutPhase";
import GroupedTournamentList from "./GroupedTournamentList.vue";
import { tournamentRichMatches } from "@/helpers/matches";
import { adjustStartTimes } from "@/helpers/matchplan/common";

const props = defineProps<{
    tournament: Tournament;
    readonly?: boolean;
}>();
const tournament = ref(props.tournament);
const tournamentStore = useTournamentsStore();
const emit = defineEmits<{
    (e: "update:modelValue", value: Tournament): void;
}>();
const onChanged = () => {
    emit("update:modelValue", tournament.value);
};

const allMatches = computed(() => tournamentRichMatches(tournament.value));

const groupedByTime = computed(() => {
    const groupedMatches: Record<string, RichMatch[]> = {};
    for (const match of allMatches.value) {
        const key = match.match.date.toISOString();

        if (!groupedMatches[key]) {
            groupedMatches[key] = [];
        }
        groupedMatches[key].push(match);
    }
    return groupedMatches;
});

/** sorted ascending */
const startTimes = computed(() =>
    Object.keys(groupedByTime.value).sort((a, b) => {
        const dateA = new Date(a).getTime();
        const dateB = new Date(b).getTime();
        return dateA - dateB;
    }),
);
const startTimesDesc = computed(() => [...startTimes.value].reverse());

const firstStartTimeWith = (status: Match["status"]) => {
    return computed(() => {
        for (const key of startTimes.value) {
            const matches = groupedByTime.value[key]!;
            if (matches.some((match) => match.match.status === status)) {
                return key;
            }
        }
        return null;
    });
};
const lastStartTimeWith = (status: Match["status"]) => {
    return computed(() => {
        for (const key of startTimesDesc.value) {
            const matches = groupedByTime.value[key]!;
            if (matches.some((match) => match.match.status === status)) {
                return key;
            }
        }
        return null;
    });
};

const currentStartTime = firstStartTimeWith("in-progress");
const previousStartTime = lastStartTimeWith("completed");
const nextStartTime = firstStartTimeWith("scheduled");

const nextBreakTime = computed(() => {
    const next = new Date(currentStartTime.value!);
    next.setMinutes(next.getMinutes() + tournament.value.config.matchDuration);
    return next;
});

const diffToString = (diff: number) => {
    if (diff < 0) return "Soon...";
    const minutes = Math.floor(diff / (60 * 1000));

    if (minutes > 24 * 60) {
        return `${Math.floor(minutes / (24 * 60))} days`;
    }
    if (minutes > 60) {
        return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
    }

    const seconds = Math.floor((diff % (60 * 1000)) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

const nextBreakCountdown = ref<string | null>(null);
const nextRoundCountdown = ref<string | null>(null);
const updateCountdowns = () => {
    const updateNextRoundStart = () => {
        if (!nextStartTime.value) {
            nextRoundCountdown.value = null;
            return;
        }

        const nextRoundDate = new Date(nextStartTime.value!);
        const now = new Date();
        const diff = nextRoundDate.getTime() - now.getTime();
        nextRoundCountdown.value = diffToString(diff);
    };

    const updateCurrentRoundEnd = () => {
        if (!currentStartTime.value) {
            nextBreakCountdown.value = null;
            return;
        }

        const currentRoundDate = new Date(currentStartTime.value!);
        currentRoundDate.setMinutes(
            currentRoundDate.getMinutes() + tournament.value.config.matchDuration,
        );
        const now = new Date();
        const diff = currentRoundDate.getTime() - now.getTime();
        nextBreakCountdown.value = diffToString(diff);
    };

    updateNextRoundStart();
    updateCurrentRoundEnd();
};

let updateCountdownTask = 0;

onMounted(() => {
    updateCountdowns();
    updateCountdownTask = setInterval(() => {
        updateCountdowns();
    }, 1000);
});

onUnmounted(() => {
    clearInterval(updateCountdownTask);
});

const latestResults = computed<RichMatch[]>(() => {
    if (previousStartTime.value) {
        return groupedByTime.value[previousStartTime.value] || [];
    }
    return [];
});

const route = useRoute();
const teamMatchesRouteName = computed(() => {
    return String(route.name).split(".")[0] + ".table";
});

const adjustAndSkip = () => {
    const veryNextRound = new Date(nextStartTime.value!);
    const rawTournament = toRaw(tournament.value);
    updateKnockoutMatches(rawTournament);
    adjustStartTimes(rawTournament, {
        startTime: veryNextRound,
        startMatches: true,
    });
    tournament.value.phases = [...rawTournament.phases];
};

/**
 * Finish the current round and proceed to the next one.
 * This will mark all matches in the current round as completed.
 */
const proceed = () => {
    const key = currentStartTime.value!;
    const matches = toRaw(groupedByTime.value[key])!;
    for (const match of matches) {
        if (match.match.status === "in-progress") {
            match.match.status = "completed";
        }
    }
    groupedByTime.value[key] = matches;
    updateKnockoutMatches(tournament.value);
    tournamentStore.share(tournament.value);
};

const adjustAndSkipText = computed(() => {
    if (!latestResults.value.length) {
        return "Start tournament";
    }
    return nextRoundCountdown.value == "Soon..."
        ? "Adjust start times & proceed"
        : "Adjust start times & skip";
});

const currentPhase = computed(() => {
    let phaseId = "";
    if (currentStartTime.value) {
        phaseId = groupedByTime.value[currentStartTime.value]![0]!.phaseId;
    } else if (previousStartTime.value) {
        phaseId = groupedByTime.value[previousStartTime.value]![0]!.phaseId;
    } else if (nextStartTime.value) {
        phaseId = groupedByTime.value[nextStartTime.value]![0]!.phaseId;
    }
    return tournament.value.phases.find((phase) => phase.id === phaseId);
});
</script>

<template>
    <div
        class="live"
        :class="{ readonly }"
    >
        <div class="round">
            <!--time-->
            <div
                class="time"
                v-if="nextStartTime || currentStartTime"
            >
                <template v-if="currentStartTime">
                    <p>
                        Ends at:
                        <strong>{{ new Date(nextBreakTime!).toLocaleTimeString() }}</strong>
                    </p>
                    <p class="countdown">
                        <ion-icon name="timer-outline" />
                        {{ nextBreakCountdown ?? "..." }}
                    </p>
                </template>
                <template v-else-if="nextStartTime">
                    <p>
                        Next round:
                        <strong>{{ new Date(nextStartTime!).toLocaleTimeString() }}</strong>
                    </p>
                    <p class="countdown">
                        <ion-icon name="timer-outline" />
                        {{ nextRoundCountdown ?? "..." }}
                    </p>
                </template>
            </div>

            <!--ongoing games, finished games or upcoming games-->
            <template v-if="currentStartTime">
                <h3>Ongoing</h3>
                <GroupedTournamentList
                    v-model="groupedByTime[currentStartTime]!"
                    :tournament="tournament"
                    :readonly="readonly"
                    @update:model-value="onChanged"
                    show-group
                    show-phase
                    show-round
                />
            </template>
            <template v-else-if="latestResults.length">
                <h3>Results</h3>
                <GroupedTournamentList
                    v-model="latestResults"
                    :tournament="tournament"
                    :readonly="readonly"
                    @update:model-value="onChanged"
                    show-group
                    show-phase
                    show-round
                />
            </template>
            <template v-else>
                <!-- start of tournament -->
                <h3>Upcoming Matches</h3>
                <GroupedTournamentList
                    v-model="groupedByTime[nextStartTime!]!"
                    :tournament="tournament"
                    :readonly="readonly"
                    @update:model-value="onChanged"
                    show-group
                    show-phase
                    show-round
                />
            </template>

            <!--finish round, proceed to next round-->
            <template v-if="!readonly && nextRoundCountdown">
                <div
                    class="actions"
                    :class="{ center: !previousStartTime && !currentStartTime }"
                    v-if="nextRoundCountdown && !readonly"
                >
                    <button
                        class="secondary"
                        @click="proceed"
                        v-if="currentStartTime"
                    >
                        <ion-icon name="arrow-forward" />
                        Proceed
                    </button>
                    <button
                        v-else
                        @click="adjustAndSkip"
                    >
                        {{ adjustAndSkipText }}
                    </button>
                </div>
            </template>
        </div>
        <div
            class="table"
            v-if="currentPhase?.type === 'group'"
        >
            <TeamTable
                :tournament="tournament"
                :teamMatchesRouteName="teamMatchesRouteName"
                :phase="currentPhase"
            />
        </div>
    </div>
</template>

<style scoped>
.live {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr;
    position: relative;

    &:has(.table) {
        grid-template-columns: 1fr 1fr;
    }
}

@media (max-width: 768px) {
    .live {
        grid-template-columns: 1fr !important;
        gap: 3em;

        .round {
            position: unset;
        }

        .table {
            border-top: 1px solid var(--color-border);
            border-left: unset;
        }
    }
}

.round {
    position: sticky;
    top: 5em;
    height: max-content;
}

.time {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1em;
    padding: 0.5em 1em;
    border-bottom: 1px solid var(--color-border);

    p {
        margin: 0;
    }

    .countdown {
        flex: 0;
        padding: 0.5em 1em;
        border: 1px solid var(--color-border);
        border-radius: 100vmax;
        display: flex;
        align-items: center;
        gap: 0.5em;
        padding-left: 0.5em;
        min-width: max-content;
    }
}

.actions {
    display: flex;
    flex-direction: row;
    gap: 1em;
    padding: 1em;
    justify-content: flex-end;
    border-top: 1px solid var(--color-border);

    &.center {
        justify-content: center;
    }
}

.table {
    border-left: 1px solid var(--color-border);
}

.all-matches {
    width: 100%;
    display: flex;
    flex-direction: column;
}

.group-options {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 0.5em;
    padding: 1em;

    .group-option {
        border: 1px solid var(--color-border);
        border-radius: 100vmax;
        font-size: 0.9rem;
        padding: 0.25em 1em;
        font-weight: bold;

        &.selected {
            background-color: var(--color-text-primary);
            color: var(--color-surface);
        }
    }
}

.live:not(.readonly) .group-option {
    cursor: pointer;
}

h3 {
    text-align: center;
}

.action {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 1em;
    margin-right: 1em;

    & button {
        display: flex;
        align-items: center;
        gap: 0.5em;
    }
}
</style>
