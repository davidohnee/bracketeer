<script setup lang="ts">
import { computed } from "vue";
import IconContextMenu from "./IconContextMenu.vue";
import type { ActionOption } from "@/types/common";

const props = defineProps<{
    options: ActionOption[];
    icon?: string;
    align?: "left" | "right";
}>();

const groups = computed(() => {
    const groups: Record<string, ActionOption[]> = {};
    props.options.forEach((option) => {
        const groupName = option.group || "";
        if (!groups[groupName]) {
            groups[groupName] = [];
        }
        groups[groupName]!.push(option);
    });
    return groups;
});
</script>
<template>
    <IconContextMenu :alignment="props.align">
        <template #activator>
            <slot
                v-if="$slots.activator"
                name="activator"
            />
            <div
                v-else
                class="dropdown__selected"
            >
                <ion-icon
                    :name="icon || 'ellipsis-vertical'"
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
                    :class="option.type"
                    @click.stop="
                        option.action();
                        close();
                    "
                >
                    <slot
                        v-if="$slots.item"
                        name="item"
                        :option="option"
                    />
                    <template v-else>
                        <ion-icon
                            v-if="option.icon"
                            :name="option.icon"
                        ></ion-icon>
                        <span>
                            {{ option.label }}
                        </span>
                    </template>
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
    gap: 0.5rem;
    align-items: center;

    grid-template-columns: 1fr;

    &:has(ion-icon:first-child) {
        grid-template-columns: 20px 1fr;
    }

    &:hover {
        background: var(--color-surface-hover);
    }

    &.danger {
        color: var(--color-brand-red);
    }

    .selected {
        font-weight: var(--typography-fontWeight-bold);
    }
}
</style>
