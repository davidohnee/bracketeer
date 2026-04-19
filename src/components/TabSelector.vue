<script setup lang="ts">
import { computed } from "vue";
import DropdownSelector from "./DropdownSelector.vue";
import type { Option } from "@/types/common";

const props = defineProps<{
    modelValue: string;
    options: string[] | Option[];
    showNavigation?: boolean;
    selectedValueComponent?: string;
}>();

const emit = defineEmits<(e: "update:modelValue", value: string) => void>();

const selectedValue = computed({
    get() {
        return props.modelValue;
    },
    set(value) {
        emit("update:modelValue", value);
    },
});

const index = computed({
    get() {
        if (typeof props.options[0] === "string") {
            return (props.options as string[]).indexOf(selectedValue.value);
        }
        return props.options.findIndex((option) => (option as Option).id === selectedValue.value);
    },
    set(value) {
        if (value >= 0 && value < props.options.length) {
            emit(
                "update:modelValue",
                typeof props.options[0] === "string"
                    ? (props.options as string[])[value]!
                    : (props.options[value] as Option).id,
            );
        }
    },
});
</script>
<template>
    <div class="tab-selector">
        <span
            class="navigation-option"
            v-if="props.showNavigation"
        >
            <button
                class="ghost"
                @click="index--"
                :disabled="index <= 0"
            >
                <ion-icon name="chevron-back" />
            </button>
        </span>
        <span class="current-tab">
            <DropdownSelector
                v-model="selectedValue"
                :options="props.options"
                :selected-value-component="selectedValueComponent"
            />
        </span>
        <span
            class="navigation-option"
            v-if="props.showNavigation"
        >
            <button
                class="ghost"
                @click="index++"
                :disabled="index === props.options.length - 1"
            >
                <ion-icon name="chevron-forward" />
            </button>
        </span>
    </div>
</template>

<style scoped>
.tab-selector {
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 1rem;

    &:has(.navigation-option) {
        justify-content: space-between;
    }
}

.navigation-option button {
    border-radius: var(--radius-full);
    padding: var(--spacing-xxs);
    border: 1px solid var(--color-border);
}
</style>
