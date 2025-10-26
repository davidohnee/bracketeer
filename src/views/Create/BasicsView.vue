<script setup lang="ts">
import { DEFAULTS } from "@/helpers/defaults";
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

const breakDuration = computed({
    get() {
        return tournament.value.config.breakDuration;
    },
    set(value) {
        tournament.value.config.knockoutBreakDuration = value;
        tournament.value.config.breakDuration = value;
    },
});

watch(
    () => tournament.value.config.sport,
    (newSport) => {
        breakDuration.value = DEFAULTS[newSport]!.breakDuration;
        tournament.value.config.matchDuration = DEFAULTS[newSport]!.matchDuration;
    },
);

const sportSupportsSets = computed(() => {
    return DEFAULTS[tournament.value.config.sport]?.supportsSets ?? false;
});
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
        <span class="text-sm text-muted">Sport</span>
        <div class="chip-group">
            <div
                v-for="(v, k) in DEFAULTS"
                :key="k"
                class="chip-option"
                :class="{ selected: tournament.config.sport === k }"
                @click="tournament.config.sport = k"
                :title="v.description"
            >
                <ion-icon
                    :name="v.icon"
                    class="icon"
                ></ion-icon>
                <span>{{ v.name }}</span>
            </div>
        </div>
    </div>
    <div class="field">
        <label for="start">Start</label>
        <input
            type="datetime-local"
            id="start"
            v-model="startTime"
        />
    </div>
    <div
        v-if="sportSupportsSets"
        class="field"
    >
        <label
            class="checkbox-label"
            for="use-sets"
        >
            <input
                type="checkbox"
                id="use-sets"
                v-model="tournament.config.useSets"
            />
            <span>Use set-based scoring</span>
        </label>
        <p class="text-muted text-sm">Enable this to track individual set scores (e.g., 6-4, 7-5). The match score will be automatically calculated based on sets won.</p>
    </div>
</template>
