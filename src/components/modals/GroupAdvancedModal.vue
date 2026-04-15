<script setup lang="ts">
import DraggableList from "@/components/DraggableList.vue";
import { TIE_BREAKER_LABELS, COMPARATOR_KEYS, type ComparatorOrder } from "@/types/tournament";
import { ref, watch } from "vue";

const props = defineProps<{
    modelValue: ComparatorOrder;
}>();

const emit = defineEmits<(e: "update:modelValue" | "change", value: ComparatorOrder) => void>();

const dialog = ref<HTMLDialogElement | null>(null);
const tieBreakerOrder = ref<ComparatorOrder>([...props.modelValue]);

const open = () => {
    dialog.value?.showModal();
};

const close = () => {
    dialog.value?.close();
};

const updateTieBreakerOrder = (nextOrder: ComparatorOrder) => {
    tieBreakerOrder.value = nextOrder;
    emit("update:modelValue", [...nextOrder]);
    emit("change", [...nextOrder]);
};

const resetTieBreakers = () => {
    updateTieBreakerOrder([...COMPARATOR_KEYS]);
};

watch(
    () => props.modelValue,
    (newValue) => {
        tieBreakerOrder.value = [...newValue];
    },
    { deep: true, immediate: true },
);

defineExpose({
    open,
    close,
});
</script>

<template>
    <dialog ref="dialog">
        <div class="content advanced-settings">
            <ion-icon
                @click="close"
                class="close"
                name="close"
            ></ion-icon>
            <h2>Advanced Group Settings</h2>
            <p class="text-muted my-0">Drag and drop tie-breakers to define ranking order.</p>
            <DraggableList
                v-model="tieBreakerOrder"
                @change="updateTieBreakerOrder"
                :get-label="(item) => TIE_BREAKER_LABELS[item]"
            />
            <button
                class="ghost text-sm self-end"
                @click="resetTieBreakers"
            >
                Reset to default
            </button>
        </div>
    </dialog>
</template>

<style scoped>
.advanced-settings {
    min-width: min(40ch, 90vw);

    & h2 {
        margin-right: 3em;
    }
}
</style>
