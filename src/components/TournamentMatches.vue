<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { getCourtName, getTeamName } from "@/helpers";
import type { Tournament } from "@/types/tournament";
import { useRoute, useRouter } from "vue-router";
import GroupedTournamentList from "./GroupedTournamentList.vue";
import { GROUP_OPTIONS, groupMatches, tournamentRichMatches } from "@/helpers/matches";
import TabSelector from "./TabSelector.vue";
import MatchFilter from "./filter/MatchFilter.vue";
import type { Option } from "@/types/common";

const props = defineProps<{
    modelValue: Tournament;
    readonly?: boolean;
}>();

const emit = defineEmits<(e: "update:modelValue", tournament: Tournament) => void>();

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
        return route.query.team as string | undefined;
    },
    set(team) {
        router.replace({
            query: {
                ...route.query,
                team,
            },
        });
    },
});
const courtFilter = computed<number | undefined>({
    get() {
        const int = Number.parseInt(route.query.court as string);
        return Number.isNaN(int) ? undefined : int;
    },
    set(court) {
        router.replace({ query: { ...route.query, court } });
    },
});
const groupFilter = computed({
    get() {
        return route.query.group as string | undefined;
    },
    set(group) {
        router.replace({
            query: {
                ...route.query,
                group,
            },
        });
    },
});
const selectedGroupOption = computed<(typeof GROUP_OPTIONS)[number]>({
    get() {
        return (route.query["group-by"] ?? GROUP_OPTIONS[0]) as (typeof GROUP_OPTIONS)[number];
    },
    set(groupBy) {
        router.replace({
            query: {
                ...route.query,
                "group-by": groupBy,
            },
        });
    },
});

const allMatches = computed(() => tournamentRichMatches(tournament.value));
const matchFilter = ref<typeof MatchFilter>();

const grouped = computed(() =>
    groupMatches({
        allMatches: allMatches.value,
        tournament: tournament.value,
        selectedGroupOption: selectedGroupOption.value,
        teamFilter: teamFilter.value,
        courtFilter: courtFilter.value,
        groupFilter: groupFilter.value,
    }),
);

const groupLookup = computed<Record<string, Option>>(() => {
    const lookup: Record<string, Option> = {};
    for (const match of allMatches.value) {
        const id = `${match.phaseId}.${match.roundName}`;
        lookup[id] = {
            label: match.roundName,
            group: match.phaseName,
            id,
        };
    }
    return lookup;
});

const tabOptions = computed<Option[] | string[]>(() => {
    const groupedKeys = Object.keys(grouped.value) ?? [];

    if (groupedKeys.length && groupLookup.value[groupedKeys[0]!]) {
        return Object.keys(grouped.value).map((key) => {
            return groupLookup.value[key]!;
        });
    }
    return groupedKeys;
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
                return grouped.value[group]!.some(
                    (match) =>
                        match.match.status === "in-progress" || match.match.status === "scheduled",
                );
            }) || groups[0]!;
    }
};
watch([selectedGroupOption, courtFilter, groupFilter, teamFilter], autoSelectGroup);

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

const activeFilters = computed(() => {
    const filters = [];
    if (teamFilter.value) {
        filters.push(getTeamName(tournament.value, teamFilter.value));
    }
    if (courtFilter.value) {
        filters.push(getCourtName(tournament.value.config.sport, courtFilter.value));
    }
    if (groupFilter.value) {
        const [phaseId, groupId] = groupFilter.value.split(".") as [string, string];
        const phase = tournament.value.phases.find((p) => p.id === phaseId);
        if (phase?.type === "group" && phase.groups) {
            const group = phase.groups.find((g) => g.id === groupId);
            if (group) {
                filters.push(group.name);
            }
        }
    }
    return filters;
});

const activeFilterSummary = computed(() => {
    const filters = activeFilters.value;
    if (filters.length === 0) {
        return null;
    }
    if (filters.length === 1) {
        return filters[0];
    }
    return `${filters[0]} (+${filters.length - 1})`;
});

const activeFilterSummaryTooltip = computed(() => {
    return "Filtering for: " + activeFilters.value.join(", ");
});

const resetFilters = () => {
    router.replace({
        query: { ...route.query, team: undefined, court: undefined, group: undefined },
    });
};

onMounted(() => {
    autoSelectGroup();
});
</script>

<template>
    <div class="all-matches">
        <div class="filter-row">
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
            <div class="filters">
                <div
                    class="filter active"
                    v-if="activeFilterSummary"
                >
                    <span :title="activeFilterSummaryTooltip">
                        {{ activeFilterSummary }}
                    </span>
                    <ion-icon
                        @click="resetFilters"
                        name="close-outline"
                    ></ion-icon>
                </div>
                <div
                    class="filter"
                    :class="{ open: matchFilter?.contextMenu?.isOpen }"
                    @click.stop.prevent="matchFilter?.contextMenu?.toggle()"
                >
                    <MatchFilter
                        ref="matchFilter"
                        :tournament="tournament"
                        v-model:team-filter="teamFilter"
                        v-model:court-filter="courtFilter"
                        v-model:group-filter="groupFilter"
                    />
                </div>
            </div>
        </div>
        <div class="rounds">
            <TabSelector
                v-model="selectedGroup"
                :options="tabOptions"
            />
            <div class="round">
                <GroupedTournamentList
                    v-if="grouped[selectedGroup]"
                    v-model="grouped[selectedGroup]!"
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

.filter-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1em;
    margin-bottom: 1em;
    gap: 1em;

    .filters {
        display: flex;
        align-items: center;
        gap: 0.5em;
    }

    & .filter {
        border-radius: 100vmax;
        width: 2em;
        height: 2em;
        border: 1px solid var(--color-border);
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        position: relative;

        & ion-icon {
            font-size: 1.2rem;
        }

        &:hover {
            background-color: var(--color-text-primary);
            color: var(--color-surface);
        }

        &.open,
        &.active:hover {
            color: var(--color-primary-inverse);
            background-color: var(--color-primary);
        }

        &.active {
            width: fit-content;
            padding: 0 0.25em 0 0.5em;

            & span {
                max-width: 25ch;
                overflow: hidden;
                white-space: nowrap;
                text-overflow: ellipsis;
                margin-right: 1ch;

                @media screen and (max-width: 768px) {
                    max-width: 18ch;
                }

                @media screen and (max-width: 400px) {
                    max-width: 12ch;
                }
            }
        }
    }

    & .chip-group {
        margin: 0;
    }
}

h3 {
    text-align: center;
}

.round {
    margin-top: 1em;
}
</style>
