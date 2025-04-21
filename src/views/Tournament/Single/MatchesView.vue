<script setup lang="ts">
import { computed, ref } from "vue";
import MatchCard from "@/components/MatchCard.vue";
import MatchRow from "@/components/MatchRow.vue";
import { updateKnockoutMatches } from "../../../helpers";
import type { Match, MatchStatus, Tournament, TournamentRound } from "@/types/tournament";
import { useTournamentsStore } from "@/stores/tournaments";

const props = defineProps<{
    tournament: Tournament;
}>();

const tournamentStore = useTournamentsStore();

const tournament = tournamentStore.getTournamentById(props.tournament.id)!;

const knockoutBracket = computed<TournamentRound[]>(() => {
    return props.tournament.knockoutPhase;
});

const getTeamName = (teamId: string | undefined) => {
    const team = props.tournament.teams.find((team) => team.id === teamId);
    return team ? team.name : null;
};

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

const selectedDisplayOption = ref<("card" | "row")[number]>("row");

const GROUP_OPTIONS = ["round", "time", "team", "court"] as const;
const selectedGroupOption = ref<(typeof GROUP_OPTIONS)[number]>(GROUP_OPTIONS[0]);

const grouped = computed(() => {
    // Group matches by the selected option
    const groupedMatches: Record<string, MatchAndRound[]> = {};
    for (const match of allMatches.value) {
        const keys: string[] = [];
        if (selectedGroupOption.value === "round") {
            keys.push(match.roundName);
        } else if (selectedGroupOption.value === "time") {
            keys.push(match.match.date.toLocaleString());
        } else if (selectedGroupOption.value === "team") {
            keys.push(getTeamName(match.match.teams[0].ref?.id) || "N/A");
            keys.push(getTeamName(match.match.teams[1].ref?.id) || "N/A");
        } else if (selectedGroupOption.value === "court") {
            keys.push(match.match.court || "N/A");
        }

        for (const key of keys) {
            if (!groupedMatches[key]) {
                groupedMatches[key] = [];
            }
            groupedMatches[key].push(match);
        }
    }
    return groupedMatches;
});
</script>

<template>
    <div class="all-matches">
        <div class="group-options">
            <div
                v-for="option in GROUP_OPTIONS"
                :key="option"
                :value="option"
                class="group-option"
                :class="{ selected: selectedGroupOption === option }"
                @click="selectedGroupOption = option"
            >
                by {{ option }}
            </div>
        </div>
        <div class="rounds">
            <div
                class="round"
                v-for="(round, key) in grouped"
                :key="key"
            >
                <h3 class="round-title">{{ key }}</h3>
                <div class="matches">
                    <component
                        :is="selectedDisplayOption === 'card' ? MatchCard : MatchRow"
                        v-for="(match, index) in round"
                        :key="index"
                        :match="match.match"
                        :teams="tournament.teams"
                        @matchStatusChanged="
                            (newStatus) =>
                                updateMatchStatus(match.roundName, match.match.id, newStatus)
                        "
                        @scoreChanged="
                            (teamIndex, newScore) =>
                                updateMatchScore(
                                    match.roundName,
                                    match.match.id,
                                    teamIndex,
                                    newScore,
                                )
                        "
                    />
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
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
</style>
