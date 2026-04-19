<script setup lang="ts" generic="T">
import { ref, shallowRef, watch } from "vue";

const props = defineProps<{
    modelValue: T[];
    getLabel?: (item: T) => string;
}>();

const getLabel = props.getLabel ?? String;

const emit = defineEmits<(e: "update:modelValue" | "change", value: T[]) => void>();

const order = shallowRef<T[]>([...props.modelValue]);
const draggingIndex = ref<number | null>(null);
const dragOverIndex = ref<number | null>(null);

const moveItem = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    if (fromIndex < 0 || fromIndex >= order.value.length) return;
    if (toIndex < 0 || toIndex >= order.value.length) return;

    const nextOrder = [...order.value];
    const moved = nextOrder[fromIndex];
    nextOrder.splice(fromIndex, 1);

    nextOrder.splice(toIndex, 0, moved);
    order.value = nextOrder;
};

const finishDrag = (shouldEmit: boolean) => {
    if (shouldEmit) {
        emit("update:modelValue", [...order.value]);
        emit("change", [...order.value]);
    }

    draggingIndex.value = null;
    dragOverIndex.value = null;
};

const onDragStart = (event: DragEvent, index: number) => {
    draggingIndex.value = index;
    const currentItem = order.value[index];

    if (event.dataTransfer && currentItem !== undefined) {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.dropEffect = "move";
        event.dataTransfer.setData("text/plain", getLabel(currentItem));
    }
};

const onDragOver = (event: DragEvent, index: number) => {
    event.preventDefault();

    const fromIndex = draggingIndex.value;
    if (fromIndex === null || fromIndex === index) {
        dragOverIndex.value = index;
        return;
    }

    moveItem(fromIndex, index);
    draggingIndex.value = index;
    dragOverIndex.value = index;
};

const onDrop = () => {
    finishDrag(true);
};

const onDragEnd = () => {
    finishDrag(draggingIndex.value !== null);
};

watch(
    () => props.modelValue,
    (newValue) => {
        if (draggingIndex.value === null) {
            order.value = [...newValue];
        }
    },
);
</script>

<template>
    <ul class="draggable-list">
        <TransitionGroup name="draggable-list">
            <li
                v-for="(item, index) in order"
                :key="getLabel(item)"
                class="draggable-list-item"
                :class="{
                    dragging: draggingIndex === index,
                    'drop-target': dragOverIndex === index && draggingIndex !== index,
                }"
                draggable="true"
                @dragstart="onDragStart($event, index)"
                @dragover="onDragOver($event, index)"
                @drop="onDrop"
                @dragend="onDragEnd"
            >
                <ion-icon
                    name="reorder-three-outline"
                    class="drag-handle"
                ></ion-icon>
                <span>{{ getLabel(item) }}</span>
            </li>
        </TransitionGroup>
    </ul>
</template>

<style scoped>
.draggable-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
}

.draggable-list-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-xs) var(--spacing-m);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-m);
    background: var(--color-background-soft);
    cursor: grab;
    user-select: none;
    transition:
        opacity 120ms ease,
        border-color 120ms ease;
}

.draggable-list-item.dragging {
    opacity: 0.7;
    cursor: grabbing;
}

.draggable-list-item.drop-target {
    border-color: var(--color-brand-blue);
}

.draggable-list-move {
    transition: transform 200ms ease;
}

.drag-handle {
    font-size: 1.2em;
    color: var(--color-text-muted);
}
</style>
