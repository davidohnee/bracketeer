<!--
  - Copyright (c) 2023, reAudioPlayer ONE.
  - Licenced under the GNU General Public License v3.0
  -->

<script lang="ts" setup>
import type { PropType } from "vue";
import type { INotification } from "./createNotification";
import { useRouter } from "vue-router";

const props = defineProps({
    notification: {
        type: Object as PropType<INotification>,
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
        class="notification card"
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
    padding: 0.5em 1em;
    display: flex;
    flex-direction: row;
    gap: 2em;
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

    h4,
    p {
        margin: 0;
    }
}

.close {
    cursor: pointer;
    font-size: 1.5rem;
}

.details {
    display: block;
}
</style>
