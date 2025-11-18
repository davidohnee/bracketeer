<script setup lang="ts">
import { computed } from "vue";
import IconContextMenu from "./IconContextMenu.vue";
import type { Option } from "@/types/common";

const props = defineProps<{
    modelValue: string;
    options: string[] | Option[];
}>();

const emit = defineEmits<{
    (e: "update:modelValue", value: string): void;
}>();

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

const groups = computed(() => {
    const groups: Record<string, (string | Option)[]> = {};
    props.options.forEach((option) => {
        let groupName = "";
        if (typeof option === "string") {
            groupName = "";
        } else {
            groupName = option.group;
        }
        if (!groups[groupName]) {
            groups[groupName] = [];
        }
        groups[groupName]!.push(option);
    });
    return groups;
});
</script>
<template>
    <IconContextMenu>
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
        <template v-slot:context-menu="{ close }">
            <div
                v-for="(options, group) in groups"
                :key="group"
                class="group"
            >
                <div
                    v-if="group"
                    class="header"
                >
                    <span class="text-sm text-muted uppercase">{{ group }}</span>
                </div>
                <div
                    v-for="option in options"
                    :key="typeof option === 'string' ? option : option.id"
                    class="dropdown__option"
                    @click.stop="
                        select(option);
                        close();
                    "
                >
                    <span :class="selectedValue == getId(option) ? 'selected' : ''">
                        {{ typeof option === "string" ? option : option.label }}
                    </span>
                    <ion-icon
                        v-if="selectedValue == getId(option)"
                        name="checkmark"
                    ></ion-icon>
                </div>
            </div>
        </template>
    </IconContextMenu>
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

.group {
    .header {
        padding: 0.25rem 0.5rem;
    }

    &:not(:first-child) {
        margin-top: 0.5rem;
        border-top: 1px solid var(--color-border);
    }
}

.dropdown__option {
    cursor: pointer;
    padding: 0.5rem;
    transition: all 0.2s ease-in-out;
    display: grid;
    grid-template-columns: 1fr 20px;
    gap: 0.5rem;
    align-items: center;

    &:hover {
        background: var(--color-surface-hover);
    }

    .selected {
        font-weight: var(--typography-fontWeight-bold);
    }
}
</style>
