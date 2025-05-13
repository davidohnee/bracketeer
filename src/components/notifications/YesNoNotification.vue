<!--
  - Copyright (c) 2023, reAudioPlayer ONE.
  - Licenced under the GNU General Public License v3.0
  -->

<script lang="ts" setup>
import type { PropType } from "vue";
import type { IYesNoNotification } from "./createNotification";
import { useRouter } from "vue-router";

const props = defineProps({
    notification: {
        type: Object as PropType<IYesNoNotification>,
        required: true,
    },
});

const emit = defineEmits(["remove"]);
const router = useRouter();

const no = () => {
    emit("remove", props.notification.id);
    if (props.notification.onNo) {
        props.notification.onNo();
    }
};

const yes = () => {
    emit("remove", props.notification.id);
    if (props.notification.onYes) {
        props.notification.onYes();
    }
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
        class="notification"
        @click.stop.prevent="click"
    >
        <div class="message">
            <h4>
                {{ notification.message }}
            </h4>
            <span
                v-if="notification.details"
                class="details"
            >
                {{ notification.details }}
            </span>
        </div>
        <div class="yes-no">
            <div
                class="yes option"
                @click.stop.prevent="yes"
            >
                <ion-icon name="checkmark-outline"></ion-icon>
            </div>
            <div
                class="no option"
                @click.stop.prevent="no"
            >
                <ion-icon name="close-outline"></ion-icon>
            </div>
        </div>
    </div>
</template>

<style scoped>
.notification {
    gap: 2em;
    align-items: center;
    overflow: hidden;
    background: var(--color-surface);
    cursor: pointer;

    .message {
        padding: 1em 0 1em 1em;

        h4 {
            margin: 0;
        }

        .details {
            font-size: 0.8em;
        }
    }
}

.yes-no {
    display: flex;
    flex-direction: row;
    font-size: 1.5rem;
    font-weight: bold;

    .option {
        flex: 1;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--color-primary-inverse);

        &.yes {
            background-color: var(--color-brand-green);
        }

        &.no {
            background-color: var(--color-brand-red);
        }
    }
}
</style>
