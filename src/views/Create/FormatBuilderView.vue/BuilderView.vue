<script setup lang="ts">
import { computed } from "vue";
import type { Tournament } from "@/types/tournament";
import NodeConnector from "./NodeConnector.vue";
import EndNode from "./EndNode.vue";
import StartNode from "./StartNode.vue";
import KnockoutNode from "./KnockoutNode.vue";
import GroupNode from "./GroupNode.vue";
import InvalidNode from "./InvalidNode.vue";

const props = defineProps<{
    modelValue: Tournament;
}>();
const emit = defineEmits<{
    (e: "update:modelValue", value: Tournament): void;
}>();

const tournament = computed({
    get() {
        return props.modelValue;
    },
    set(value) {
        emit("update:modelValue", value);
    },
});
</script>
<template>
    <div class="format-builder card">
        <StartNode
            v-model="tournament"
            @update:modelValue="tournament = $event"
        />

        <template
            v-for="(phase, phaseIndex) in tournament.phases"
            :key="phase.id"
        >
            <NodeConnector
                :hideValue="phaseIndex == 0"
                v-model="phase.teamCount"
            />
            <KnockoutNode
                v-if="phase.type === 'knockout'"
                :phase="phase"
                v-model="tournament"
                @update:modelValue="tournament = $event"
            />
            <GroupNode
                v-else-if="phase.type === 'group'"
                :phase="phase"
                v-model="tournament"
                @update:modelValue="tournament = $event"
            />
            <InvalidNode
                v-else
                :phase="phase"
                v-model="tournament"
                @update:modelValue="tournament = $event"
            />
        </template>

        <NodeConnector
            :modelValue="1"
            readonly
        />
        <EndNode />
    </div>
</template>
