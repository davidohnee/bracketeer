<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from "vue";
import MatchRow from "@/components/ResponsiveMatchRow.vue";
import type { Match, Tournament, TournamentRound } from "@/types/tournament";
import TeamTable from "@/components/TeamTable.vue";
import { useRoute } from "vue-router";

const props = defineProps<{
    tournament: Tournament;
    readonly?: boolean;
}>();
const tournament = ref(props.tournament);
const emit = defineEmits<{
    (e: "update:modelValue", value: Tournament): void;
}>();
const onChanged = () => {
    emit("update:modelValue", tournament.value);
};

const knockoutBracket = computed<TournamentRound[]>(() => {
    return tournament.value.knockoutPhase;
});

type MatchAndRound = {
    match: Match;
    roundName: string;
};

const allMatches = computed<MatchAndRound[]>(() => {
    const matches: MatchAndRound[] = tournament.value.groupPhase.map((match) => ({
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

const groupPhaseCompleted = computed(() => {
    return tournament.value.groupPhase.every((match) => match.status === "completed");
});

const route = useRoute();
const teamMatchesRouteName = computed(() => {
    return String(route.name).split(".")[0] + ".table";
});
</script>

<template>
    <div
        class="live"
        :class="{ readonly }"
    >
        <div
            class="no-round"
            v-if="currentTab === null"
        >
            <template v-if="nextRoundCountdown">
                <p>
                    Next round starts at <strong>{{ nextRound }}</strong>
                </p>
                <p class="countdown">{{ nextRoundCountdown }}</p>
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
        </div>
        <div
            class="table"
            v-if="!groupPhaseCompleted"
        >
            <TeamTable
                :tournament="tournament"
                :teamMatchesRouteName="teamMatchesRouteName"
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
