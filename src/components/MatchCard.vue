<script setup lang="ts">
import { type Match } from '../types/tournament';

defineProps<{ match: Match }>();
</script>

<template>
    <div class="match">
        <div class="team">{{ match.team1.name }}</div>

        <div class=details>
            <div class="score" v-if="match.status !== 'scheduled'">
                <div class="for">{{ match.score1 }}</div>
                <span>-</span>
                <div class="against">{{ match.score2 }}</div>
            </div>
            <div v-else class="time">{{ match.date?.toLocaleTimeString?.([], { hour: '2-digit', minute: '2-digit' }) }}
            </div>
            <div class="venue">
                <div class="court">{{ match.court }}</div>
            </div>
        </div>

        <div class="team">{{ match.team2.name }}</div>
    </div>
</template>

<style>
.match {
    border: 1px solid var(--color-border);
    border-radius: 1em;
    overflow: clip;
    min-width: 30ch;
    max-width: 40ch;
    padding: 2em 1em;
    flex: 1;
    font-size: 13px;
    display: grid;
    grid-template-columns: 1fr max-content 1fr;
    align-items: center;

    .venue {
        color: var(--color-foreground-secondary);
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
        gap: 1em;
    }

    .score,
    .time {
        font-size: 19px;
        font-weight: 500;
    }

    .team {
        &:first-child {
            text-align: left;
        }

        &:last-child {
            text-align: right;
        }
    }
}
</style>
