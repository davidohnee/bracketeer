<script lang="ts" setup>
import { nextTick, ref, watch } from "vue";

const props = defineProps<{
    modelValue: string;
    disabled?: boolean;
    multiline?: boolean;
    clearable?: boolean;
}>();

const emit = defineEmits<{
    (e: "update:modelValue", value: string): void;
    (e: "blur"): void;
}>();

const showClearOption = ref(false);
const editable = ref(false);
const el = ref<HTMLDivElement | null>(null);

const startEditing = (cursorAtEnd = false) => {
    if (props.disabled || editable.value) {
        return;
    }

    editable.value = true;
    nextTick(() => {
        if (el.value) {
            el.value.focus();

            if (cursorAtEnd) {
                // Place cursor at the end of the text
                const range = document.createRange();
                const sel = globalThis.getSelection();
                if (sel) {
                    range.selectNodeContents(el.value);
                    range.collapse(false); // collapse to end
                    sel.removeAllRanges();
                    sel.addRange(range);
                }
            }
        }
    });
};

const stopEditing = () => {
    emit("blur");
    onChange();
    nextTick(() => (editable.value = false));
};

const onEnter = (e?: KeyboardEvent) => {
    if (e?.shiftKey) return;
    if (props.multiline && !e?.ctrlKey) return;

    e?.preventDefault();
    stopEditing();
};

const onChange = () => {
    if (el.value) {
        emit("update:modelValue", el.value.innerText);
    }
};

const clear = () => {
    stopEditing();
    emit("update:modelValue", "");
};

watch(editable, () => {
    if (editable.value === true) {
        showClearOption.value = true;
    } else {
        setTimeout(() => (showClearOption.value = false), 200);
    }
});
</script>
<template>
    <div
        class="editable-text-wrapper"
        :class="{ disabled, editable, multiline, clearable }"
    >
        <div
            ref="el"
            class="editable-text"
            :contenteditable="editable"
            :class="{ disabled: disabled }"
            :disabled="disabled"
            @dblclick="startEditing()"
            @keydown.enter="onEnter"
            @blur="stopEditing()"
            v-show="editable || !$slots.default"
            :innerText="modelValue"
        ></div>
        <div
            v-if="!editable && $slots.default"
            @dblclick="startEditing()"
        >
            <slot />
        </div>
        <ion-icon
            v-if="!disabled && clearable && showClearOption"
            name="trash-outline"
            class="clear-icon icon-action"
            @click="clear()"
        />
        <ion-icon
            v-if="!disabled"
            name="pencil-outline"
            class="edit-icon icon-action"
            @click="startEditing(true)"
        />
    </div>
</template>

<style scoped>
.editable-text-wrapper {
    display: inline-grid;
    align-items: center;
    gap: 0.5rem;
    grid-template-columns: 1fr 1rem;

    &.multiline {
        display: grid;
    }

    &:has(.clear-icon) {
        grid-template-columns: 1fr 1rem 1rem;
    }

    .edit-icon {
        opacity: 0;
    }

    &:hover:not(:disabled) .edit-icon,
    &.editable .edit-icon {
        opacity: 1;
    }

    .icon-action {
        cursor: pointer;
        color: var(--color-text-secondary);
        transition: opacity 0.2s;
        font-size: 1.2rem;

        &:hover {
            color: var(--color-primary);
        }
    }
}

.editable-text {
    display: inline-block;
    min-width: 1ch;
    border-bottom: 2px solid transparent;

    &:focus {
        outline: none;
        border-color: var(--color-primary);
    }
}
</style>
