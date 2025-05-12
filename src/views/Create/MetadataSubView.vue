<script setup lang="ts">
import type { Tournament } from "@/types/tournament";
import { computed, ref, watch } from "vue";

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

const getDatetimeLocal = (date: Date) => {
    const pad = (num: number) => String(num).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
        date.getHours(),
    )}:${pad(date.getMinutes())}`;
};

const startTime = ref<string>(getDatetimeLocal(tournament.value.config.startTime));
watch(
    startTime,
    (newValue) => {
        tournament.value.config.startTime = new Date(newValue);
    },
    { immediate: true },
);
</script>
<template>
    <div class="field">
        <label for="name">Name</label>
        <input
            type="text"
            id="name"
            v-model="tournament.name"
        />
    </div>
    <div class="field">
        <label for="start">Start</label>
        <input
            type="datetime-local"
            id="start"
            v-model="startTime"
        />
    </div>
</template>
