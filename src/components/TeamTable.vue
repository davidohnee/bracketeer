<script setup lang="ts">
import { computed } from "vue";
import { type Tournament } from "../types/tournament";
import TeamTableEntry from "./TeamTableEntry.vue";
import { generateTable } from "@/helpers";

const props = defineProps<{ tournament: Tournament }>();

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
        />
    </div>
</template>

<style>
.team-table {
    width: 100%;

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
}
</style>
