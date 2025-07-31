<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, toRaw } from "vue";
import type { GroupTournamentPhase, Match, RichMatch, Tournament } from "@/types/tournament";
import TeamTable from "@/components/TeamTable.vue";
import { useRoute } from "vue-router";
import { useTournamentsStore } from "@/stores/tournaments";
import { allMatches as getAllMatches } from "@/helpers/phase";
import { updateKnockoutMatches } from "@/helpers/matchplan/knockoutPhase";
import GroupedTournamentList from "./GroupedTournamentList.vue";

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

const allMatches = computed<RichMatch[]>(() => {
    const matches: RichMatch[] = [];

    for (const phase of props.tournament.phases) {
        if (phase.type === "group") {
            for (const match of phase.matches) {
                matches.push({ match, round: match.round, phase });
            }
        } else if (phase.type === "knockout") {
            for (const round of phase.rounds) {
                for (const match of round.matches) {
                    matches.push({ match, round, phase });
                }
            }
        }
    }

    // Sort matches by date
    matches.sort((a, b) => {
        const dateA = a.match.date.getTime();
        const dateB = b.match.date.getTime();
        if (dateA < dateB) return -1;
        if (dateA > dateB) return 1;
        return a.round!.name.localeCompare(b.round!.name);
    });
    return matches;
});

const grouped = computed(() => {
    // Group matches by the selected option
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

const defaultCurrentTab = computed(() => {
    // grouped -> latest key with matches that are not completed
    const keys = Object.keys(grouped.value).sort((a, b) => {
        const dateA = new Date(a).getTime();
        const dateB = new Date(b).getTime();
        return dateA - dateB;
    });
    for (const key of keys) {
        const matches = grouped.value[key];
        if (matches.some((match) => match.match.status === "in-progress")) {
            return key;
        }
    }
    return null;
});

const lastCompletedRound = computed(() => {
    // grouped -> latest key with matches that are completed
    const keys = Object.keys(grouped.value).sort((a, b) => {
        const dateA = new Date(a).getTime();
        const dateB = new Date(b).getTime();
        return dateB - dateA;
    });
    for (const key of keys) {
        const matches = grouped.value[key];
        if (matches.every((match) => match.match.status === "completed")) {
            return key;
        }
    }
    return null;
});

const nextRound = computed(() => {
    // grouped -> latest key with matches that are not completed
    const keys = Object.keys(grouped.value).sort((a, b) => {
        const dateA = new Date(a).getTime();
        const dateB = new Date(b).getTime();
        return dateA - dateB;
    });
    for (const key of keys) {
        const matches = grouped.value[key];
        if (matches.some((match) => match.match.status === "scheduled")) {
            return key;
        }
    }
    return null;
});

const nextBreak = computed(() => {
    const next = new Date(nextRound.value!);
    next.setMinutes(next.getMinutes() - tournament.value.config.breakDuration);
    return next;
});

const nextBreakCountdown = ref<string | null>(null);
const nextRoundCountdown = ref<string | null>("");
const updateNextRoundCountdown = () => {
    if (nextRound.value === null) {
        nextRoundCountdown.value = null;
        return;
    }
    const nextRoundDate = new Date(grouped.value[nextRound.value!][0].match.date);
    const now = new Date();
    const diff = nextRoundDate.getTime() - now.getTime();
    if (diff == 0) {
        nextTick(() => {
            currentTab.value = nextRound.value;
        });
        nextRoundCountdown.value = "Soon...";
        return;
    }
    if (diff <= 0) {
        nextRoundCountdown.value = "Soon...";
        return;
    }
    const minutes = Math.floor(diff / 1000 / 60);
    const seconds = Math.floor((diff / 1000) % 60);
    nextRoundCountdown.value = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

    const thisEndDiff = diff - tournament.value.config.breakDuration * 1000 * 60;
    if (thisEndDiff > 0) {
        const endMinutes = Math.floor(thisEndDiff / 1000 / 60);
        const endSeconds = Math.floor((thisEndDiff / 1000) % 60);
        nextBreakCountdown.value = `${String(endMinutes).padStart(2, "0")}:${String(endSeconds).padStart(2, "0")}`;
    } else {
        nextBreakCountdown.value = "Soon...";
    }
};
const updateNextRoundCountdownInterval = setInterval(() => {
    updateNextRoundCountdown();
}, 1000);

onMounted(() => {
    updateNextRoundCountdown();
});

onUnmounted(() => {
    clearInterval(updateNextRoundCountdownInterval);
});

const currentTab = ref<string | null>(defaultCurrentTab.value);
const missingResults = computed<RichMatch[]>(() => {
    return grouped.value[lastCompletedRound.value!] || [];
});

const groupPhaseCompleted = computed(() => {
    return (tournament.value.phases[0] as GroupTournamentPhase).matches.every(
        (match) => match.status === "completed",
    );
});

const route = useRoute();
const teamMatchesRouteName = computed(() => {
    return String(route.name).split(".")[0] + ".table";
});

/**
 * Ceils a date to the next minute
 * @param date The date to ceil
 */
const ceilToNextMinute = (date: Date) => {
    if (date.getSeconds() > 0) {
        date.setMinutes(date.getMinutes() + 1);
        date.setSeconds(0);
    }
    return date;
};

const adjustAndSkip = () => {
    const veryNextRound = new Date(grouped.value[nextRound.value!][0].match.date);
    const adjustedBaseDate = new Date();

    // all games that are scheduled, get the difference to "veryNextRound", ceilToNextMinute and apply

    const updateMatch = (match: Match) => {
        if (match.status === "scheduled") {
            const matchDate = new Date(match.date);
            const diff = matchDate.getTime() - veryNextRound.getTime();

            if (diff > 0) {
                const adjustedDate = new Date(adjustedBaseDate.getTime() + diff);
                const newDate = ceilToNextMinute(adjustedDate);
                match.date = newDate;
                match.status = "scheduled";
            } else if (diff == 0) {
                match.date = new Date(adjustedBaseDate);
                match.status = "in-progress";
            }
        }
    };

    const rawTournament = toRaw(tournament.value);
    updateKnockoutMatches(tournament.value);
    for (const phase of rawTournament.phases) {
        for (const match of getAllMatches(phase)) {
            updateMatch(match);
        }
    }
    tournament.value.phases = [...rawTournament.phases];
    currentTab.value = defaultCurrentTab.value;
};

const proceed = () => {
    const matches = toRaw(grouped.value[currentTab.value!]);
    for (const match of matches) {
        if (match.match.status === "in-progress") {
            match.match.status = "completed";
        }
    }
    grouped.value[currentTab.value!] = matches;
    currentTab.value = defaultCurrentTab.value;
    updateKnockoutMatches(tournament.value);
    tournamentStore.share(tournament.value);
};

const adjustAndSkipText = computed(() => {
    if (!missingResults.value.length) {
        return "Start tournament";
    }
    return nextRoundCountdown.value == "Soon..."
        ? "Adjust start times & proceed"
        : "Adjust start times & skip";
});
</script>

<template>
    <div
        class="live"
        :class="{ readonly }"
    >
        <div
            class="missing-results"
            v-if="currentTab == null"
        >
            <div
                class="time"
                v-if="nextRoundCountdown"
            >
                <p>
                    Next round: <strong>{{ new Date(nextRound!).toLocaleTimeString() }}</strong>
                </p>
                <p class="countdown">
                    <ion-icon name="timer-outline" />
                    {{ nextRoundCountdown }}
                </p>
            </div>
            <template v-if="missingResults.length">
                <h3>Results</h3>
                <GroupedTournamentList
                    v-model="missingResults"
                    :tournament="tournament"
                    :readonly="readonly"
                    @update:model-value="onChanged"
                />
            </template>
            <template v-else>
                <!-- start of tournament -->
                <h3>Upcoming Matches</h3>
                <GroupedTournamentList
                    v-model="grouped[nextRound!]"
                    :tournament="tournament"
                    :readonly="readonly"
                    @update:model-value="onChanged"
                />
            </template>
            <div
                class="actions"
                :class="{ center: !missingResults.length }"
                v-if="nextRoundCountdown && !readonly"
            >
                <button @click="adjustAndSkip">{{ adjustAndSkipText }}</button>
            </div>
            <template v-if="!nextRoundCountdown">
                <h3>No upcoming matches</h3>
            </template>
        </div>
        <div
            class="round"
            v-else
        >
            <div
                class="time"
                v-if="nextBreakCountdown"
            >
                <p>
                    Until: <strong>{{ new Date(nextBreak!).toLocaleTimeString() }}</strong>
                </p>
                <p class="countdown">
                    <ion-icon name="timer-outline" />
                    {{ nextBreakCountdown }}
                </p>
            </div>
            <h3>Ongoing</h3>
            <GroupedTournamentList
                v-model="grouped[currentTab]"
                :tournament="tournament"
                :readonly="readonly"
                @update:model-value="onChanged"
            />
            <div
                class="actions"
                v-if="!readonly"
            >
                <button
                    class="secondary"
                    @click="proceed"
                >
                    <ion-icon name="arrow-forward" />
                    Proceed
                </button>
            </div>
        </div>
        <div
            class="table"
            v-if="!groupPhaseCompleted"
        >
            <TeamTable
                :tournament="tournament"
                :teamMatchesRouteName="teamMatchesRouteName"
                :phase="
                    tournament.phases.find(
                        (phase) => phase.type === 'group',
                    ) as GroupTournamentPhase
                "
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

        .no-round {
            position: unset;
        }

        .table {
            border-top: 1px solid var(--color-border);
            border-left: unset;
        }
    }
}

.round,
.missing-results {
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
