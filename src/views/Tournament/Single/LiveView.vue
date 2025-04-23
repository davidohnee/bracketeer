<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from "vue";
import MatchRow from "@/components/MatchRow.vue";
import { updateKnockoutMatches } from "../../../helpers";
import type { Match, MatchStatus, Tournament, TournamentRound } from "@/types/tournament";
import { useTournamentsStore } from "@/stores/tournaments";
import TeamTable from "@/components/TeamTable.vue";
import MatchResultEditor from "@/components/MatchResultEditor.vue";

const props = defineProps<{
    tournament: Tournament;
}>();

const tournamentStore = useTournamentsStore();

const tournament = tournamentStore.getTournamentById(props.tournament.id)!;

const missingResults = ref<MatchAndRound[]>([]);

const knockoutBracket = computed<TournamentRound[]>(() => {
    return props.tournament.knockoutPhase;
});

type MatchAndRound = {
    match: Match;
    roundName: string;
};

const allMatches = computed<MatchAndRound[]>(() => {
    const matches: MatchAndRound[] = [];
    for (const round of props.tournament.groupPhase) {
        for (const match of round.matches) {
            matches.push({ match, roundName: round.name });
        }
    }
    for (const round of knockoutBracket.value) {
        for (const match of round.matches) {
            matches.push({ match, roundName: round.name });
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

const updateMatchScore = (
    roundName: string,
    matchId: string,
    teamIndex: number,
    newScore: number,
) => {
    if (!tournament) return;

    const groupRoundIndex = props.tournament.groupPhase.findIndex(
        (round) => round.name === roundName,
    );
    if (groupRoundIndex !== -1) {
        const matchIndex = props.tournament.groupPhase[groupRoundIndex].matches.findIndex(
            (match) => match.id === matchId,
        );
        if (matchIndex !== -1) {
            const match = tournament.groupPhase[groupRoundIndex].matches[matchIndex];
            if (teamIndex === 0) {
                match.teams[0].score = newScore;
            } else {
                match.teams[1].score = newScore;
            }
            tournament.groupPhase[groupRoundIndex].matches[matchIndex] = match;
            updateKnockoutMatches(props.tournament);
            return;
        }
    }

    const knockoutRoundIndex = knockoutBracket.value.findIndex((round) => round.name === roundName);
    if (knockoutRoundIndex === -1) return;

    const matchIndex = knockoutBracket.value[knockoutRoundIndex].matches.findIndex(
        (match) => match.id === matchId,
    );
    if (matchIndex === -1) return;
    const match = tournament.knockoutPhase[knockoutRoundIndex].matches[matchIndex];
    if (teamIndex === 0) {
        match.teams[0].score = newScore;
    } else {
        match.teams[1].score = newScore;
    }
    tournament.knockoutPhase[knockoutRoundIndex].matches[matchIndex] = match;
    updateKnockoutMatches(props.tournament);
};

const updateMatchStatus = (roundName: string, matchId: string, newStatus: MatchStatus) => {
    if (!tournament) return;

    const groupRoundIndex = props.tournament.groupPhase.findIndex(
        (round) => round.name === roundName,
    );

    if (groupRoundIndex !== -1) {
        const matchIndex = props.tournament.groupPhase[groupRoundIndex].matches.findIndex(
            (match) => match.id === matchId,
        );
        if (matchIndex !== -1) {
            const match = tournament.groupPhase[groupRoundIndex].matches[matchIndex];
            match.status = newStatus;
            tournament.groupPhase[groupRoundIndex].matches[matchIndex] = match;
            return;
        }
    }

    const knockoutRoundIndex = knockoutBracket.value.findIndex((round) => round.name === roundName);
    if (knockoutRoundIndex !== -1) {
        const matchIndex = knockoutBracket.value[knockoutRoundIndex].matches.findIndex(
            (match) => match.id === matchId,
        );
        if (matchIndex !== -1) {
            const match = tournament.knockoutPhase[knockoutRoundIndex].matches[matchIndex];
            match.status = newStatus;
            tournament.knockoutPhase[knockoutRoundIndex].matches[matchIndex] = match;
        }
    }
};

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

const nextRoundCountdown = ref("");
const updateNextRoundCountdown = () => {
    const nextRoundDate = new Date(grouped.value[nextRound.value!][0].match.date);
    const now = new Date();
    const diff = nextRoundDate.getTime() - now.getTime();
    if (diff == 0 && missingResults.value.length == 0) {
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

const skip = () => {
    const matches = grouped.value[nextRound.value!];
    for (const match of matches) {
        if (match.match.status === "scheduled") {
            match.match.status = "in-progress";
            updateMatchStatus(match.roundName, match.match.id, "in-progress");
        }
    }

    currentTab.value = defaultCurrentTab.value;
};

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

    for (const match of allMatches.value) {
        if (match.match.status === "scheduled") {
            const matchDate = new Date(match.match.date);
            const diff = matchDate.getTime() - veryNextRound.getTime();

            if (diff > 0) {
                const adjustedDate = new Date(adjustedBaseDate.getTime() + diff);
                const newDate = ceilToNextMinute(adjustedDate);
                match.match.date = newDate;
                updateMatchStatus(match.roundName, match.match.id, "scheduled");
            } else if (diff == 0) {
                match.match.date = new Date(adjustedBaseDate);
                updateMatchStatus(match.roundName, match.match.id, "in-progress");
            }
        }
    }

    currentTab.value = defaultCurrentTab.value;
};
const currentTab = ref<string | null>(defaultCurrentTab.value);

const proceed = () => {
    if (missingResults.value.length) {
        missingResults.value = [];
        return;
    }

    const matches = grouped.value[currentTab.value!];
    for (const match of matches) {
        if (match.match.status === "in-progress") {
            match.match.status = "completed";
            updateMatchStatus(match.roundName, match.match.id, "completed");

            // if scores == 0, add to missingResults
            if (match.match.teams[0].score === 0 && match.match.teams[1].score === 0) {
                missingResults.value.push(match);
            }
        }
    }
    currentTab.value = defaultCurrentTab.value;

    tournamentStore.share(tournament);
};

const groupPhaseCompleted = computed(() => {
    return props.tournament.groupPhase.every((round) =>
        round.matches.every((match) => match.status === "completed"),
    );
});
</script>

<template>
    <div class="live">
        <div
            class="missing-results"
            v-if="currentTab == null && missingResults.length"
        >
            <h3>Results</h3>
            <div class="matches">
                <MatchResultEditor
                    v-for="(match, index) in missingResults"
                    :key="index"
                    :match="match.match"
                    :teams="tournament.teams"
                    :match-duration="tournament.config.matchDuration"
                    @matchStatusChanged="
                        (newStatus) => updateMatchStatus(match.roundName, match.match.id, newStatus)
                    "
                    @scoreChanged="
                        (teamIndex, newScore) =>
                            updateMatchScore(match.roundName, match.match.id, teamIndex, newScore)
                    "
                />
            </div>
            <div class="action">
                <button
                    class="secondary"
                    @click="proceed"
                >
                    <ion-icon name="arrow-forward" />
                    Proceeed
                </button>
            </div>
        </div>
        <div
            class="no-round"
            v-else-if="currentTab === null"
        >
            <p>
                Next round starts at <strong>{{ nextRound }}</strong>
            </p>
            <p class="countdown">{{ nextRoundCountdown }}</p>
            <div class="actions">
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
                            ? "Adjust start times & proceed to next round"
                            : "Adjust start times & skip to next round"
                    }}
                </button>
            </div>
        </div>
        <div
            class="round"
            v-else
        >
            <h3 class="round-title">{{ currentTab }}</h3>
            <div class="matches">
                <MatchRow
                    v-for="(match, index) in grouped[currentTab]"
                    :key="index"
                    :match="match.match"
                    :teams="tournament.teams"
                    :match-duration="tournament.config.matchDuration"
                    @matchStatusChanged="
                        (newStatus) => updateMatchStatus(match.roundName, match.match.id, newStatus)
                    "
                    @scoreChanged="
                        (teamIndex, newScore) =>
                            updateMatchScore(match.roundName, match.match.id, teamIndex, newScore)
                    "
                />
            </div>
            <div class="action">
                <button
                    class="secondary"
                    @click="proceed"
                >
                    <ion-icon name="arrow-forward" />
                    Proceeed
                </button>
            </div>
        </div>
        <div
            class="table"
            v-if="!groupPhaseCompleted"
        >
            <TeamTable
                :tournament="tournament"
                teamMatchesRouteName="tournament.table"
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
        cursor: pointer;

        &.selected {
            background-color: var(--color-foreground);
            color: var(--color-background);
        }
    }
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
