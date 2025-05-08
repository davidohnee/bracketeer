<script setup lang="ts">
import type { MatchStatus, Match, Tournament } from "@/types/tournament";
import { onMounted, ref, shallowRef } from "vue";
import MatchCard from "./MatchCard.vue";
import MatchRow from "./MatchRow.vue";

const props = defineProps<{
    modelValue: Match;
    tournament: Tournament;
    readonly?: boolean;
}>();

const match = ref(props.modelValue);
const emit = defineEmits<{
    (e: "update:modelValue", match: Match): void;
    (e: "statusChanged", newStatus: MatchStatus): void;
}>();

const emitStatusChanged = (status: MatchStatus) => {
    emit("statusChanged", status);
};

const componentType = shallowRef<typeof MatchRow | typeof MatchCard | null>(null);

onMounted(() => {
    if (window.innerWidth < 540) {
        componentType.value = MatchCard;
    } else {
        componentType.value = MatchRow;
    }
});
</script>

<template>
    <component
        :is="componentType"
        v-model="match"
        @update:modelValue="emit('update:modelValue', $event)"
        :tournament="tournament"
        :readonly="readonly"
        @statusChanged="emitStatusChanged"
    />
</template>
