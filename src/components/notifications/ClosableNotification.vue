<!--
  - Copyright (c) 2023, reAudioPlayer ONE.
  - Licenced under the GNU General Public License v3.0
  -->

<script lang="ts" setup>
import type { PropType } from "vue";
import type { IFullNotification } from "./createNotification";
import { useRouter } from "vue-router";

const props = defineProps({
    notification: {
        type: Object as PropType<IFullNotification>,
        required: true,
    },
});

const emit = defineEmits(["remove"]);
const router = useRouter();

const remove = (id: string) => {
    emit("remove", id);
};

const click = () => {
    emit("remove", props.notification.id);
    if (props.notification.onClick) {
        props.notification.onClick();
    }
    if (props.notification.redirect) {
        router.push(props.notification.redirect);
    }
};
</script>

<template>
    <div
        :class="{
            [notification.type]: true,
            'cursor-pointer': notification.redirect || notification.onClick,
        }"
        class="notification"
        @click.stop.prevent="click"
    >
        <div class="message">
            <h4>
                {{ notification.message }}
            </h4>
            <span
                v-if="notification.details"
                class="details text-sm"
            >
                {{ notification.details }}
            </span>
            <router-link
                v-if="notification.actionText && notification.redirect"
                class="action"
                :to="notification.redirect"
            >
                <ion-icon name="arrow-forward"></ion-icon>
                {{ notification.actionText }}
            </router-link>
        </div>
        <ion-icon
            name="close-outline"
            class="close"
            @click.stop.prevent="remove(notification.id)"
        />
    </div>
</template>

<style scoped>
.notification {
    padding: var(--spacing-xs) var(--spacing-m);
    display: flex;
    flex-direction: row;
    gap: var(--spacing-l);
    align-items: center;
    justify-content: space-between;
    color: var(--color-primary-inverse);

    &.success {
        background-color: var(--color-brand-green);
    }

    &.error {
        background-color: var(--color-brand-red);
    }

    &.info {
        background-color: var(--color-brand-blue);
    }

    &.warning {
        background-color: var(--color-brand-yellow);
    }

    &.redirect {
        background: var(--color-surface);
    }

    h4,
    p {
        margin: 0;
    }

    &.cursor-pointer {
        cursor: pointer;
    }
}

.close {
    cursor: pointer;
    font-size: 1.5rem;
}

.details {
    display: block;
}

.action {
    display: flex;
    align-items: center;
    gap: 0.25em;
}
</style>
