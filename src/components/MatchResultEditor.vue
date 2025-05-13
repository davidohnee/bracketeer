<script setup lang="ts">
import { ALPHABET } from "@/helpers/common";
import type { MatchStatus, Match, MatchTeam, Ref, Team } from "@/types/tournament";
import { computed, onMounted, ref } from "vue";
import { debounce } from "lodash-es";

const teamIndex = (team: Ref | undefined) => props.teams.findIndex((x) => x.id === team?.id);

const teamDisplay = (team: MatchTeam) => {
    const i = teamIndex(team.ref);
    if (i >= 0) return props.teams[i].name;
    const asRef = team.link!;
    if (asRef.type == "league") {
        return `Place ${asRef.placement + 1}`;
    }
    const label = { winner: "Winner", loser: "Loser" };
    return `${label[asRef.type]} ${ALPHABET[asRef.placement]}`;
};
const props = defineProps<{ match: Match; teams: Team[]; matchDuration: number }>();

const emit = defineEmits<{
    (e: "scoreChanged", teamIndex: number, newScore: number): void;
    (e: "teamNameChanged", teamId: string, newName: string): void;
    (e: "matchStatusChanged", newStatus: MatchStatus): void;
}>();

const winner = computed(() => {
    if (status.value !== "completed") return "";
    const team1 = props.match.teams[0].score;
    const team2 = props.match.teams[1].score;
    if (team1 > team2) return props.teams[teamIndex(props.match.teams[0].ref)].name;
    if (team2 > team1) return props.teams[teamIndex(props.match.teams[1].ref)].name;
    return "Draw";
});

const _onScoreChanged = (teamIndex: number, newScore: number) => {
    emit("scoreChanged", 1 - teamIndex, 10 - newScore);
};

const scores = ref(props.match.teams.map((team) => (team.score ? 10 - team.score : 0)));
const status = ref<MatchStatus>(props.match.status);

const onScoreChanged = [
    debounce((newScore: number) => {
        _onScoreChanged(0, newScore);
    }, 1000),
    debounce((newScore: number) => {
        _onScoreChanged(1, newScore);
    }, 1000),
];

onMounted(() => {
    onScoreChanged[0](scores.value[0]);
    onScoreChanged[1](scores.value[1]);
});
</script>

<template>
    <div class="match row">
        <div class="form">
            <div
                v-for="(team, index) in match.teams"
                class="team-row"
                :key="index"
            >
                <template v-if="teamIndex(team.ref) >= 0">
                    <p
                        class="team"
                        :class="{ winner: winner === teamDisplay(team) }"
                    >
                        {{ teams[teamIndex(team.ref)].name }}
                    </p>
                    <div class="field">
                        <label :for="`team-score-${index}`">Cups still standing</label>
                        <input
                            type="number"
                            :id="`team-score-${index}`"
                            v-model="scores[index]"
                            @change="onScoreChanged[index](scores[index])"
                        />
                    </div>
                </template>
            </div>
        </div>
    </div>
</template>

<style scoped>
.team-row {
    display: grid;
    gap: 1em;
    grid-template-columns: 15ch 1fr;
    align-items: center;

    .team {
        color: var(--color-text-secondary);

        &.winner {
            color: var(--color-primary);
        }
    }
}

.match.row {
    overflow: clip;
    padding: 1em;
    flex: 1;
    font-size: 13px;
    display: grid;
    grid-template-columns: 1fr;
    align-items: center;
    gap: 1em;
    transition: border-color 0.2s ease-in-out;

    &:not(:last-child) {
        border-bottom: 1px solid var(--color-border);
    }

    .venue {
        color: var(--color-text-secondary);
    }

    .score {
        display: grid;
        grid-template-columns: 3ch 1ch 3ch;
        align-items: center;
        gap: 0.5em;
    }

    .details {
        display: flex;
        flex-direction: column;
        text-align: center;
        align-items: center;
    }

    .court,
    .score,
    .time {
        text-align: center;
    }

    .field {
        flex: 1;
    }

    .score,
    .match-time {
        font-size: 19px;
        font-weight: 500;
    }

    .match-time {
        color: var(--color-text-secondary);
    }

    .time {
        font-size: 19px;
        font-weight: 500;
        border-radius: 100vmax;
        padding: 0.5em 1em;
        font-size: 0.9rem;
        background-color: var(--color-border);
        color: var(--color-text-secondary);

        &.progress {
            background-color: var(--color-primary);
            color: var(--color-primary-inverse);
        }
    }

    .team {
        &:nth-child(2) {
            text-align: right;
        }

        &:nth-child(4) {
            text-align: left;
        }
    }
}
</style>
