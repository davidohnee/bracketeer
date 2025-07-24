<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, toRaw } from "vue";
import MatchRow from "@/components/ResponsiveMatchRow.vue";
import type { GroupTournamentPhase, Match, Tournament } from "@/types/tournament";
import TeamTable from "@/components/TeamTable.vue";
import { useRoute } from "vue-router";
import { useTournamentsStore } from "@/stores/tournaments";
import { allMatches as getAllMatches } from "@/helpers/phase";
import { updateKnockoutMatches } from "@/helpers/matchplan/knockoutPhase";

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

type MatchAndRound = {
    match: Match;
    roundName: string;
};

const allMatches = computed<MatchAndRound[]>(() => {
    const matches: MatchAndRound[] = [];

    for (const phase of props.tournament.phases) {
        if (phase.type === "group") {
            for (const match of phase.matches) {
                matches.push({ match, roundName: match.round?.name ?? phase.name });
            }
        } else if (phase.type === "knockout") {
            for (const round of phase.rounds) {
                for (const match of round.matches) {
                    matches.push({ match, roundName: round.name });
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
        return a.roundName.localeCompare(b.roundName);
    });
    return matches;
});

const grouped = computed(() => {
    // Group matches by the selected option
    const groupedMatches: Record<string, MatchAndRound[]> = {};
    for (const match of allMatches.value) {
        const key = match.match.date.toLocaleString();

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
const missingResults = ref<MatchAndRound[]>([]);

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
    if (missingResults.value.length) {
        missingResults.value = [];
        return;
    }

    const matches = toRaw(grouped.value[currentTab.value!]);
    for (const match of matches) {
        if (match.match.status === "in-progress") {
            match.match.status = "completed";
            if (match.match.teams[0].score === 0 && match.match.teams[1].score === 0) {
                missingResults.value.push(match);
            }
        }
    }
    grouped.value[currentTab.value!] = matches;
    currentTab.value = defaultCurrentTab.value;
    updateKnockoutMatches(tournament.value);
    tournamentStore.share(tournament.value);
};

const skip = () => {
    const matches = toRaw(grouped.value[nextRound.value!]);
    for (const match of matches) {
        if (match.match.status === "scheduled") {
            match.match.status = "in-progress";
        }
    }
    grouped.value[nextRound.value!] = matches;
    updateKnockoutMatches(tournament.value);
    currentTab.value = defaultCurrentTab.value;
};
</script>

<template>
    <div
        class="live"
        :class="{ readonly }"
    >
        <div
            class="missing-results"
            v-if="currentTab == null && missingResults.length"
        >
            <h3>Results</h3>
            <div class="matches">
                <MatchRow
                    v-for="result in missingResults"
                    :key="result.match.id"
                    v-model="result.match"
                    :tournament="tournament"
                    @update:model-value="onChanged"
                    :readonly="readonly"
                />
            </div>
            <div
                class="action"
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
            class="no-round"
            v-else-if="currentTab === null"
        >
            <template v-if="nextRoundCountdown">
                <p>
                    Next round starts at <strong>{{ nextRound }}</strong>
                </p>
                <p class="countdown">{{ nextRoundCountdown }}</p>
                <div
                    class="actions"
                    v-if="!readonly"
                >
                    <button
                        @click="skip"
                        class="secondary"
                    >
                        {{
                            nextRoundCountdown == "Soon..."
                                ? "Proceed to next round"
                                : "Skip to next round"
                        }}
                    </button>
                    <button @click="adjustAndSkip">
                        {{
                            nextRoundCountdown == "Soon..."
                                ? "Adjust start times & proceed"
                                : "Adjust start times & skip"
                        }}
                    </button>
                </div>
            </template>
            <template v-else>
                <h3>No upcoming matches</h3>
            </template>
        </div>
        <div
            class="round"
            v-else
        >
            <h3 class="round-title">{{ currentTab }}</h3>
            <div class="matches">
                <MatchRow
                    v-for="(_, index) in grouped[currentTab]"
                    :key="index"
                    v-model="grouped[currentTab][index].match"
                    :tournament="tournament"
                    @update:model-value="onChanged"
                    :readonly="readonly"
                />
            </div>
            <div
                class="action"
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

.no-round {
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    max-height: 60vh;
    position: sticky;
    top: 0;

    & .actions {
        display: flex;
        flex-direction: row;
        gap: 1em;
        margin-top: 1em;
        margin-bottom: 1em;
    }

    & .countdown {
        font-size: 2rem;
        font-weight: bold;
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
