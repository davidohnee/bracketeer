<script setup lang="ts">
import { ref } from "vue";

const inputRef = ref<HTMLInputElement | null>(null);
const isScrolledToEnd = ref(false);

const checkScroll = () => {
    if (inputRef.value) {
        const { scrollLeft, scrollWidth, clientWidth } = inputRef.value;
        isScrolledToEnd.value = scrollLeft + clientWidth >= scrollWidth - 1;
    }
};

defineProps<{
    modelValue: string;
    type: "text" | "number" | "password";
    copyable?: boolean;
    loading?: boolean;
    disabled?: boolean;
    readonly?: boolean;
}>();

const emit = defineEmits<(e: "copy") => void>();

const justCopied = ref(false);

const copy = () => {
    emit("copy");
    justCopied.value = true;
    setTimeout(() => {
        justCopied.value = false;
    }, 2000);
};
</script>
<template>
    <div
        class="advanced-input"
        :disabled="disabled || loading"
    >
        <div
            class="loader"
            v-if="loading"
        ></div>
        <input
            ref="inputRef"
            :type="type"
            :disabled="disabled || loading"
            :value="modelValue"
            :readonly="readonly"
            :class="{ fadeout: !isScrolledToEnd }"
            @input="checkScroll"
            @scroll="checkScroll"
        />
        <div
            class="copy"
            v-if="copyable && !loading"
            title="Copy to clipboard"
            :disabled="disabled || loading"
            @click="copy"
        >
            <ion-icon
                :name="justCopied ? 'checkmark' : 'copy-outline'"
                @click="copy"
            ></ion-icon>
        </div>
    </div>
</template>

<style scoped>
input {
    background: none;
    border: none;
    outline: none;
    width: 100%;
    padding: 0;
    border-radius: 0;
    margin: 0 !important;
    overflow: hidden;

    &.fadeout {
        mask-image: linear-gradient(to right, black 0%, black 85%, transparent 100%);
        -webkit-mask-image: linear-gradient(to right, black 0%, black 85%, transparent 100%);
    }

    &:disabled {
        background: none;
    }
}

.advanced-input:has(.copy) {
    padding-right: 1em;
}

.advanced-input {
    display: flex;
    align-items: center;
    gap: 0.5em;
    position: relative;

    &:disabled {
        background-color: var(--color-surface-hover);
        color: var(--color-text-secondary);
    }

    .loader {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background: color-mix(in srgb, var(--color-surface) 90%, transparent);
        display: flex;
        align-items: center;
        justify-content: center;

        &::after {
            content: "";
            width: 1em;
            height: 1em;
            border: 2px solid var(--color-text-secondary);
            border-top-color: transparent;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
    }

    .copy {
        cursor: pointer;
        display: flex;
        align-items: center;

        &:hover {
            color: var(--color-primary);
        }
    }
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}
</style>
