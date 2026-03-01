<script setup lang="ts">
import { computed } from "vue";
import IconComboContextMenu from "./IconComboContextMenu.vue";
import type { Option, ActionOption } from "@/types/common";

const props = defineProps<{
    modelValue: string;
    options: string[] | Option[];
}>();

const emit = defineEmits<(e: "update:modelValue", value: string) => void>();

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

const getId = (value: string | Option): string => {
    if (typeof value === "string") {
        return value;
    } else {
        return value.id;
    }
};
const selectedValueLabel = computed(() => {
    const id = selectedValue.value;
    return labels.value[id];
});

const select = (value: string | Option) => {
    selectedValue.value = getId(value);
};

const labels = computed(() => {
    const map: Record<string, string> = {};
    props.options.forEach((option) => {
        if (typeof option === "string") {
            map[option] = option;
        } else {
            map[option.id] = `${option.group}: ${option.label}`;
        }
    });
    return map;
});

const actionOptions = computed<ActionOption[]>(() => {
    return props.options.map((option) => {
        if (typeof option === "string") {
            return {
                id: option,
                label: option,
                action: () => select(option),
            };
        } else {
            return {
                id: option.id,
                label: option.label,
                group: option.group,
                action: () => select(option),
            };
        }
    });
});
</script>
<template>
    <IconComboContextMenu
        :options="actionOptions"
        :icon="selectedValueLabel || 'chevron-down'"
    >
        <template #activator>
            <div class="dropdown__selected">
                <div class="flex flex-row gap-2">
                    <strong>{{ selectedValueLabel }}</strong>
                </div>
                <ion-icon
                    name="chevron-down"
                    class="dropdown__icon"
                ></ion-icon>
            </div>
        </template>
        <template v-slot:item="{ option }">
            <div class="dropdown__option">
                <span :class="selectedValue == getId(option) ? 'selected' : ''">
                    {{ option.label }}
                </span>
                <ion-icon
                    v-if="selectedValue == getId(option)"
                    name="checkmark"
                ></ion-icon>
            </div>
        </template>
    </IconComboContextMenu>
</template>

<style scoped>
.dropdown__selected {
    cursor: pointer;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    gap: 1em;
}

.dropdown__option {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr 20px;
}

.selected {
    font-weight: var(--typography-fontWeight-bold);
}
</style>
