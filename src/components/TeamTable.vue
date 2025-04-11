<script setup lang="ts">
import { type TeamScore } from '../types/tournament';
import TeamTableEntry from './TeamTableEntry.vue';

defineProps<{ table: TeamScore[] }>()
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
        <TeamTableEntry class="entry" v-for="(score, index) in table" :key="index" :score="score" :rank="index + 1" />
    </div>
</template>

<style>
.team-table {
    border: 1px solid var(--color-border);
    border-radius: 1em;
    overflow: clip;

    .entry {
        display: grid;
        grid-template-columns: 2ch 1fr repeat(4, 3ch) 9ch 4ch 4ch;
        gap: 0.5em;
        cursor: pointer;
        padding: 0.5em 1em;

        &:hover {
            background-color: var(--color-background-hover);
        }

        & div {
            text-align: center;
        }

        & .name {
            text-align: left;
            font-weight: bold;
        }
    }
}
</style>
