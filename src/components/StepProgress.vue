<script setup lang="ts">
const props = defineProps<{
    steps: string[];
    modelValue: number;
    canGoForward?: boolean;
    canGoBack?: boolean;
}>();

const emit = defineEmits<{
    (e: "update:modelValue", value: number): void;
}>();

const jumpTo = (index: number) => {
    if (index > props.modelValue && props.canGoForward) {
        emit("update:modelValue", index);
    } else if (index < props.modelValue && props.canGoBack) {
        emit("update:modelValue", index);
    }
};
</script>

<template>
    <div class="progress">
        <template
            v-for="(name, index) in steps"
            :key="index"
        >
            <div class="step">
                <div
                    class="circle"
                    :class="{
                        done: index < modelValue,
                        active: index === modelValue,
                        pending: index > modelValue,
                        clickable:
                            (canGoForward && index > modelValue) ||
                            (canGoBack && index < modelValue),
                    }"
                    @click="jumpTo(index)"
                ></div>
                <span>{{ name }}</span>
            </div>
            <div class="divider"></div>
        </template>
    </div>
</template>

<style scoped>
@keyframes pulse {
    0% {
        transform: scale(1);
    }
    50% {
        transform: scale(0.9);
    }
    100% {
        transform: scale(1);
    }
}

.circle {
    height: 36px;
    border-radius: 50%;
    border: 2px solid var(--color-primary);
    display: block;
    aspect-ratio: 1/1;
    position: relative;
    transition: all 0.2s ease-in-out;

    &.clickable {
        cursor: pointer;
        outline: 2px solid transparent;

        &:hover {
            outline: 2px solid var(--color-primary);
        }
    }

    &:before {
        font-family: system-ui, sans-serif;
        position: absolute;
        place-items: center;

        counter-increment: section;
        content: counter(section);

        color: var(--color-primary);
        top: 50%;
        left: 50%;
        translate: -50% -50%;
    }

    &.done {
        background: var(--color-primary);
        animation: pulse 0.5s;

        &:before {
            color: var(--color-primary-inverse);
            content: "✓";
        }
    }

    &.pending {
        border-color: var(--color-text-secondary);

        &:before {
            color: var(--color-text-secondary);
        }
    }
}

.divider {
    width: 100%;
    height: 1px;
    background: var(--color-text-secondary);
    display: block;

    &:last-child {
        display: none;
    }
}

.step {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5em;
    font-size: var(--typography-body-fontSize-sm);
    position: relative;

    & span {
        position: absolute;
        bottom: 125%;
        left: 50%;
        translate: -50% 0;
    }
}

.progress {
    display: flex;
    flex-direction: row;
    align-items: center;
    counter-reset: section;
    gap: 1em;
    margin-bottom: 0.5em;
}
</style>
