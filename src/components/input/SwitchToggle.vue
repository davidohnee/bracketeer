<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
    modelValue: boolean;
    label: string;
    disabled?: boolean;
}>();

const emit = defineEmits<(e: "update:modelValue", value: boolean) => void>();

const selectedValue = computed({
    get() {
        return props.modelValue;
    },
    set(value) {
        if (value !== props.modelValue) {
            emit("update:modelValue", value);
        }
    },
});
</script>
<template>
    <label class="switch-toggle">
        <input
            type="checkbox"
            :checked="selectedValue"
            :disabled="disabled"
        />
        <span class="slider"></span>
        <span class="label">{{ label }}</span>
    </label>
</template>

<style scoped>
.switch-toggle {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-s);
    cursor: pointer;
    position: relative;
}
.switch-toggle input {
    visibility: hidden;
}
.slider {
    position: relative;
    width: 40px;
    height: 20px;
    background-color: var(--color-border);
    border-radius: 10px;
    transition: background-color 0.2s;
}
.slider::before {
    content: "";
    position: absolute;
    top: 2px;
    left: 2px;
    width: 16px;
    height: 16px;
    background-color: var(--color-background);
    border-radius: 50%;
    transition: transform 0.2s;
}
input:checked + .slider {
    background-color: var(--color-primary);
}
input:checked + .slider::before {
    transform: translateX(20px);
}
.label {
    font-size: var(--font-size);
    color: var(--color-text);
}
</style>
