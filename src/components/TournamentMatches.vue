<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { getCourtName } from "@/helpers";
import type { RichMatch, Tournament } from "@/types/tournament";
import { useRoute, useRouter } from "vue-router";
import GroupedTournamentList from "./GroupedTournamentList.vue";
import { tournamentRichMatches } from "@/helpers/matches";
import TabSelector from "./TabSelector.vue";
import { localeDateTimeString } from "@/helpers/common";

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

const allMatches = computed(() => tournamentRichMatches(tournament.value));

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
            keys.push(match.roundName);
        } else if (selectedGroupOption.value === "time") {
            keys.push(localeDateTimeString(match.match.date));
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

const selectedGroup = ref("");
const autoSelectGroup = () => {
    // set the selected group to the first group that has in-progress matches or is scheduled
    const groups = Object.keys(grouped.value);

    if (["team", "court"].includes(selectedGroupOption.value)) {
        // For 'team' or 'court', we select the first group by default
        selectedGroup.value = groups[0] || "";
        return;
    }

    if (groups.length > 0) {
        selectedGroup.value =
            groups.find((group) => {
                return grouped.value[group].some(
                    (match) =>
                        match.match.status === "in-progress" || match.match.status === "scheduled",
                );
            }) || groups[0];
    }
};
watch(selectedGroupOption, autoSelectGroup);

interface DisplaySetting {
    showPhase: boolean;
    showRound: boolean;
    showGroup: boolean;
}

const displaySettings: { [K in (typeof GROUP_OPTIONS)[number]]: DisplaySetting } = {
    round: { showPhase: false, showRound: false, showGroup: true },
    time: { showPhase: true, showRound: true, showGroup: true },
    team: { showPhase: true, showRound: true, showGroup: true },
    court: { showPhase: true, showRound: true, showGroup: false },
};

onMounted(() => {
    autoSelectGroup();
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
            <TabSelector
                v-model="selectedGroup"
                :options="grouped ? Object.keys(grouped) : []"
            />
            <div class="round">
                <GroupedTournamentList
                    v-if="grouped[selectedGroup]"
                    v-model="grouped[selectedGroup]"
                    :tournament="tournament"
                    :readonly="readonly"
                    @update:model-value="onChanged"
                    :show-group="displaySettings[selectedGroupOption].showGroup"
                    :show-phase="displaySettings[selectedGroupOption].showPhase"
                    :show-round="displaySettings[selectedGroupOption].showRound"
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

.round {
    margin-top: 1em;
}
</style>
