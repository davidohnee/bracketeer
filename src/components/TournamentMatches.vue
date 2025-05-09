<script setup lang="ts">
import { computed, ref, watch } from "vue";
import MatchCard from "@/components/MatchCard.vue";
import MatchRow from "@/components/ResponsiveMatchRow.vue";
import { getCourtName } from "@/helpers";
import type { Match, Tournament, TournamentRound } from "@/types/tournament";
import { useRoute, useRouter } from "vue-router";

const props = defineProps<{
    modelValue: Tournament;
    readonly?: boolean;
}>();
const emit = defineEmits<{
    (e: "update:modelValue", tournament: Tournament): void;
}>();

const tournament = ref(props.modelValue);
const route = useRoute();
const router = useRouter();

const onChanged = () => {
    emit("update:modelValue", tournament.value);
};

watch(
    () => props.modelValue,
    (newTournament) => {
        tournament.value = newTournament;
    },
);

const teamFilter = computed({
    get() {
        return route.query.team as string;
    },
    set(team) {
        router.replace({
            query: {
                team,
                court: route.query.court,
                group: route.query.group,
            },
        });
    },
});
const courtFilter = computed({
    get() {
        return parseInt(route.query.court as string);
    },
    set(court) {
        router.replace({ query: { court, team: route.query.team, group: route.query.group } });
    },
});
const selectedGroupOption = computed<(typeof GROUP_OPTIONS)[number]>({
    get() {
        return (route.query.group ?? GROUP_OPTIONS[0]) as (typeof GROUP_OPTIONS)[number];
    },
    set(group) {
        router.replace({
            query: {
                group,
                team: route.query.team,
                court: route.query.court,
            },
        });
    },
});

const knockoutBracket = computed<TournamentRound[]>(() => {
    return props.modelValue.knockoutPhase;
});

const getTeamName = (teamId: string | undefined) => {
    const team = props.modelValue.teams.find((team) => team.id === teamId);
    return team ? team.name : null;
};

type MatchAndRound = {
    match: Match;
    roundName: string;
};

const allMatches = computed<MatchAndRound[]>(() => {
    const matches: MatchAndRound[] = props.modelValue.groupPhase.map((match) => ({
        match,
        roundName: match.round?.name || "Group Phase",
    }));
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

const selectedDisplayOption = ref<("card" | "row")[number]>("row");

const GROUP_OPTIONS = ["round", "time", "team", "court"] as const;

const grouped = computed(() => {
    // Group matches by the selected option
    const groupedMatches: Record<string, MatchAndRound[]> = {};
    for (const match of allMatches.value) {
        // filter
        if (
            teamFilter.value &&
            !match.match.teams.some((team) => team.ref?.id === teamFilter.value)
        ) {
            continue;
        }
        if (courtFilter.value && match.match.court !== courtFilter.value) {
            continue;
        }

        const keys: string[] = [];
        if (selectedGroupOption.value === "round") {
            keys.push(match.roundName);
        } else if (selectedGroupOption.value === "time") {
            keys.push(match.match.date.toLocaleString());
        } else if (selectedGroupOption.value === "team") {
            keys.push(getTeamName(match.match.teams[0].ref?.id) || "N/A");
            keys.push(getTeamName(match.match.teams[1].ref?.id) || "N/A");
        } else if (selectedGroupOption.value === "court") {
            keys.push(getCourtName(match.match.court));
        }

        for (const key of keys) {
            if (!groupedMatches[key]) {
                groupedMatches[key] = [];
            }
            groupedMatches[key].push(match);
        }
    }

    // sort groups if 'team' or 'court' is selected
    if (["team", "court"].includes(selectedGroupOption.value)) {
        return Object.fromEntries(
            Object.entries(groupedMatches).sort((a, b) => {
                const aKey = a[0];
                const bKey = b[0];
                return aKey.localeCompare(bKey, undefined, {
                    numeric: true,
                });
            }),
        );
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
                        v-model="match.match"
                        :tournament="tournament"
                        @update:modelValue="onChanged"
                        :readonly="readonly"
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
    overflow-x: auto;

    .group-option {
        border: 1px solid var(--color-border);
        border-radius: 100vmax;
        font-size: 0.9rem;
        padding: 0.25em 1em;
        font-weight: bold;
        cursor: pointer;
        white-space: nowrap;

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
