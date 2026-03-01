<script setup lang="ts">
import { computed } from "vue";
import { type GroupTournamentPhase, type Tournament } from "../types/tournament";
import TeamTableEntry from "./TeamTableEntry.vue";
import { generateTables } from "@/helpers/tables";

const props = defineProps<{
    tournament: Tournament;
    teamMatchesRouteName: string;
    phase: GroupTournamentPhase;
}>();

const tables = computed(() => {
    return generateTables(props.phase);
});

const groupName = (id: string | null) => {
    return props.phase.groups?.find((group) => group.id === id)?.name ?? "";
};
</script>

<template>
    <div class="team-tables">
        <div
            class="team-table"
            v-for="(table, i) in tables"
            :key="table.group?.id"
        >
            <div
                class="top-header"
                v-if="table.group"
            >
                <h5>{{ groupName(table.group?.id) }}</h5>
            </div>
            <div class="header entry text-muted">
                <div class="rank">#</div>
                <div class="name"></div>
                <div class="mp">MP</div>
                <div class="w">W</div>
                <div class="d">D</div>
                <div class="l">L</div>
                <div class="for-against">+/-</div>
                <div class="gd">GD</div>
                <div class="pts">PTS</div>
            </div>
            <TeamTableEntry
                class="entry"
                v-for="(score, index) in table.teams"
                :key="index"
                :score="score"
                :rank="index + 1"
                :tournament="tournament"
                :teamMatchesRouteName="teamMatchesRouteName"
                :phaseId="phase.id"
            />
            <legend v-if="i === tables.length - 1">
                <div class="text-muted"><strong>#:</strong> Rank</div>
                <div class="text-muted"><strong>MP:</strong> Matches Played</div>
                <div class="text-muted"><strong>W:</strong> Wins</div>
                <div class="text-muted"><strong>D:</strong> Draws</div>
                <div class="text-muted"><strong>L:</strong> Losses</div>
                <div class="text-muted"><strong>+/-:</strong> Goals For - Goals Against</div>
                <div class="text-muted"><strong>GD:</strong> Goal Difference</div>
                <div class="text-muted"><strong>PTS:</strong> Points</div>
                <div class="text-muted">
                    <span
                        class="swatch"
                        :style="{ backgroundColor: 'var(--c-play-in)' }"
                    ></span>
                    Play In
                </div>
                <div class="text-muted">
                    <span
                        class="swatch"
                        :style="{ backgroundColor: 'var(--c-progress)' }"
                    ></span>
                    Direct Progress
                </div>
            </legend>
        </div>
    </div>
</template>

<style>
.team-tables {
    width: 100%;
}

.team-table {
    width: 100%;
    --c-play-in: var(--color-brand-blue);
    --c-progress: var(--color-brand-green);

    .swatch {
        display: inline-block;
        width: 0.75em;
        height: 0.75em;
        margin-right: 0.25em;
        border-radius: 0.25em;
        vertical-align: middle;
    }

    & legend {
        margin-top: 1rem;
        border-top: 1px solid var(--color-border);
        padding: 1rem;
        font-size: 0.9rem;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    }

    .entry.header:hover {
        background-color: unset;
        cursor: unset;
    }

    .entry {
        display: grid;
        grid-template-columns: 2ch 1fr repeat(4, 3ch) 9ch 4ch 4ch;
        gap: 0.5em;
        cursor: pointer;
        padding: 0.25em 1em;
        border-radius: 0.35em;

        &:hover {
            background-color: var(--color-surface-hover);
        }

        & div {
            text-align: center;
        }

        & .name {
            text-align: left;
        }

        &.progress {
            position: relative;

            ::before {
                content: "";
                position: absolute;
                top: 2px;
                left: 0;
                width: 2px;
                height: calc(100% - 4px);
                background-color: var(--c-progress);
            }
        }

        &.play-in {
            position: relative;

            ::before {
                content: "";
                position: absolute;
                top: 2px;
                left: 0;
                width: 2px;
                height: calc(100% - 4px);
                background-color: var(--c-play-in);
            }
        }
    }

    @media screen and (max-width: 600px) {
        .entry {
            grid-template-columns: 2ch 1fr repeat(4, 3ch) 4ch 4ch;
        }

        .for-against {
            display: none;
        }
    }

    @media screen and (max-width: 400px) {
        .entry {
            grid-template-columns: 2ch 1fr 3ch 4ch 4ch;
        }

        .w,
        .d,
        .l {
            display: none;
        }
    }

    & h5 {
        margin: 0;
        padding-left: 1em;
        padding-top: 1em;
    }
}

.team-table:not(:first-child) {
    margin-top: 1em;
    border-top: 1px solid var(--color-border);
}
</style>
