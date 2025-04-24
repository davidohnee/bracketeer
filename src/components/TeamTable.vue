<script setup lang="ts">
import { computed } from "vue";
import { type Tournament } from "../types/tournament";
import TeamTableEntry from "./TeamTableEntry.vue";
import { generateTable } from "@/helpers";

const props = defineProps<{ tournament: Tournament; teamMatchesRouteName: string }>();

const table = computed(() => {
    return generateTable(props.tournament);
});
</script>

<template>
    <div class="team-table">
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
            v-for="(score, index) in table"
            :key="index"
            :score="score"
            :rank="index + 1"
            :tournament="tournament"
            :teamMatchesRouteName="teamMatchesRouteName"
        />
        <legend>
            <div class="text-muted"><strong>#:</strong> Rank</div>
            <div class="text-muted"><strong>MP:</strong> Matches Played</div>
            <div class="text-muted"><strong>W:</strong> Wins</div>
            <div class="text-muted"><strong>D:</strong> Draws</div>
            <div class="text-muted"><strong>L:</strong> Losses</div>
            <div class="text-muted"><strong>+/-:</strong> Goals For - Goals Against</div>
            <div class="text-muted"><strong>GD:</strong> Goal Difference</div>
            <div class="text-muted"><strong>PTS:</strong> Points</div>
        </legend>
    </div>
</template>

<style>
.team-table {
    width: 100%;

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
            background-color: var(--color-background-hover);
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
                background-color: rgb(31, 202, 131);
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
}
</style>
