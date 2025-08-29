<script setup lang="ts">
import { computed } from "vue";

interface Option {
    value: string;
    label: string;
}

const props = defineProps<{
    modelValue: string;
    options: string[] | Option[];
}>();

const emit = defineEmits<{
    (event: "update:modelValue", value: string): void;
    (event: "change", value: string): void;
}>();

const value = computed({
    get: () => props.modelValue,
    set: (val) => {
        emit("update:modelValue", val);
        emit("change", val);
    },
});

const allOptions = computed(() => {
    return props.options.map((option) => {
        if (typeof option === "string") {
            return { value: option, label: option };
        }
        return option;
    });
});
</script>
<template>
    <div class="segment-picker">
        <div
            v-for="option in allOptions"
            :key="option.value"
            class="segment"
            :class="{ active: value === option.value }"
            :tabindex="0"
            @click="value = option.value"
            @keydown.enter="value = option.value"
            @keydown.space.prevent="value = option.value"
        >
            {{ option.label }}
        </div>
    </div>
</template>
<style scoped>
.segment-picker {
    display: flex;
    border: 1px solid var(--color-border);
    border-radius: 0.5em;
    overflow: hidden;
}

.segment {
    padding: 0.5em 1em;
    cursor: pointer;
    position: relative;

    &:not(:last-child):after {
        content: "";
        position: absolute;
        top: 0;
        right: 0;
        width: 1px;
        height: 100%;
        background-color: var(--color-border);
    }
}

@media screen and (max-width: 768px) {
    .segment {
        padding: 0.75em;
    }
}

.segment.active {
    background-color: var(--color-primary);
    color: white;

    &:hover {
        background-color: var(--color-primary-hover);
    }
}
</style>
