<script lang="ts" setup>
import { nextTick, ref } from "vue";

const props = defineProps<{
    modelValue: string;
    disabled?: boolean;
}>();

const emit = defineEmits<{
    (e: "update:modelValue", value: string): void;
    (e: "blur"): void;
}>();

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
    editable.value = false;
    onChange();
};

const onChange = () => {
    if (el.value) {
        emit("update:modelValue", el.value.innerText);
    }
};
</script>
<template>
    <div
        class="editable-text-wrapper"
        :class="{ disabled, editable }"
    >
        <div
            ref="el"
            class="editable-text"
            :contenteditable="editable"
            :class="{ disabled: disabled }"
            :disabled="disabled"
            @dblclick="startEditing()"
            @keydown.enter.prevent="stopEditing()"
            @blur="stopEditing()"
        >
            {{ modelValue }}
        </div>
        <ion-icon
            name="pencil-outline"
            class="edit-icon"
            @click="startEditing(true)"
        />
    </div>
</template>

<style scoped>
.editable-text-wrapper {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;

    &:hover:not(:disabled) .edit-icon,
    &.editable .edit-icon {
        opacity: 1;
    }

    .edit-icon {
        opacity: 0;
        cursor: pointer;
        transition: opacity 0.2s;
        color: var(--color-text-secondary);
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
