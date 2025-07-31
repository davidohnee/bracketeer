<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { getCourtName } from "@/helpers";
import type { RichMatch, Tournament } from "@/types/tournament";
import { useRoute, useRouter } from "vue-router";
import GroupedTournamentList from "./GroupedTournamentList.vue";

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

const getTeamName = (teamId: string | undefined) => {
    const team = props.modelValue.teams.find((team) => team.id === teamId);
    return team ? team.name : null;
};

const allMatches = computed<RichMatch[]>(() => {
    const matches: RichMatch[] = [];

    for (const phase of tournament.value.phases) {
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

const GROUP_OPTIONS = ["round", "time", "team", "court"] as const;

const grouped = computed(() => {
    // Group matches by the selected option
    const groupedMatches: Record<string, RichMatch[]> = {};
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

        const keys: (string | null)[] = [];
        if (selectedGroupOption.value === "round") {
            keys.push(match.round!.name);
        } else if (selectedGroupOption.value === "time") {
            keys.push(match.match.date.toLocaleString());
        } else if (selectedGroupOption.value === "team") {
            keys.push(getTeamName(match.match.teams[0].ref?.id));
            keys.push(getTeamName(match.match.teams[1].ref?.id));
        } else if (selectedGroupOption.value === "court") {
            keys.push(getCourtName(tournament.value.config.sport, match.match.court));
        }

        for (const key of keys) {
            if (!key) continue;
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
        <div class="chip-group">
            <div
                v-for="option in GROUP_OPTIONS"
                :key="option"
                :value="option"
                class="chip-option"
                :class="{ selected: selectedGroupOption === option }"
                @click="selectedGroupOption = option"
            >
                by {{ option }}
            </div>
        </div>
        <div class="rounds">
            <div
                class="round"
                v-for="(_, key) in grouped"
                :key="key"
            >
                <h3 class="round-title">{{ key }}</h3>
                <GroupedTournamentList
                    v-model="grouped[key]"
                    :tournament="tournament"
                    :readonly="readonly"
                    @update:model-value="onChanged"
                />
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

h3 {
    text-align: center;
}

.chip-group {
    padding: 1em;
}
</style>
