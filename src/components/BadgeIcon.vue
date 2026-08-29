<script setup lang="ts">
defineProps<{
    icon: string;
    badgeIcon?: string;
    badgeColor?: string;
}>();
</script>
<template>
    <div
        class="icon-container"
        :style="{ '--c': 'var(' + badgeColor + ')' }"
    >
        <ion-icon
            class="icon"
            :name="icon"
        />
        <slot
            v-if="$slots.activator"
            name="badge"
            class="badge"
        />
        <ion-icon
            v-else-if="badgeIcon"
            class="badge"
            :name="badgeIcon || 'checkmark'"
        />
    </div>
</template>

<style scoped>
.icon-container {
    position: relative;
}

.badge {
    position: absolute;
    background-color: var(--c);
    color: var(--color-text-primary);
    padding: 0.2em;
    border-radius: 50%;
    bottom: -0.1em;
    left: -0.1em;
    font-size: 0.5em;
    --ionicon-stroke-width: 64px;
}
</style>
