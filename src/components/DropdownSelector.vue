<script lang="ts" setup>
import { computed } from "vue";
import IconContextMenu from "./IconContextMenu.vue";

const props = defineProps<{
    modelValue: string;
    options: string[];
}>();

const emit = defineEmits<{
    (e: "update:modelValue", value: string): void;
}>();

const selectedValue = computed({
    get() {
        return props.modelValue;
    },
    set(value) {
        emit("update:modelValue", value);
    },
});

const select = (value: string) => {
    selectedValue.value = value;
};
</script>
<template>
    <IconContextMenu>
        <template #activator>
            <div class="dropdown__selected">
                <div class="flex flex-row gap-2">
                    <strong>{{ selectedValue }}</strong>
                </div>
                <ion-icon
                    name="chevron-down"
                    class="dropdown__icon"
                ></ion-icon>
            </div>
        </template>
        <template v-slot:context-menu="{ close }">
            <div
                v-for="option in options"
                :key="option"
                class="dropdown__option"
                @click.stop="
                    select(option);
                    close();
                "
            >
                <span :class="selectedValue == option ? 'selected' : ''">
                    {{ option }}
                </span>
                <ion-icon
                    v-if="selectedValue == option"
                    name="checkmark"
                ></ion-icon>
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
