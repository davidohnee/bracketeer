<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
    modelValue: number | undefined;
    hideValue?: boolean;
    readonly?: boolean;
}>();
const emit = defineEmits<{
    (e: "update:modelValue", value: number | undefined): void;
}>();

const value = computed({
    get() {
        return props.modelValue;
    },
    set(value) {
        emit("update:modelValue", value);
    },
});
</script>

<template>
    <div class="connector">
        <div class="field small">
            <input
                v-if="!props.hideValue"
                type="number"
                v-model="value"
                @input="$emit('update:modelValue', value)"
                :class="{ 'hidden-value': props.hideValue }"
                :disabled="readonly"
                title="# of teams to proceed"
            />
        </div>
    </div>
</template>
<style scoped>
.connector {
    width: 10ch;
    height: 1px;
    z-index: 1;
    flex-shrink: 0;
    flex-grow: 1;
    background: var(--color-text-secondary);
    position: relative;

    .field {
        position: absolute;
        top: 0%;
        left: 50%;
        translate: -50% -50%;

        & input {
            width: 5ch;
        }
    }
}
</style>
