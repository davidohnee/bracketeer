<!--
  - Copyright (c) 2023, reAudioPlayer ONE.
  - Licenced under the GNU General Public License v3.0
  -->

<script lang="ts" setup>
import { ref } from "vue";
import ClosableNotification from "./ClosableNotification.vue";
import YesNoNotification from "./YesNoNotification.vue";
import type { IFullNotification, IYesNoNotification } from "./createNotification";

const closableNotifications = ["success", "error", "info", "warning"];

const notifications = ref<IFullNotification[]>([]);

const add = (notification: IFullNotification) => {
    notifications.value.push(notification);
    if (notification.timeout) {
        setTimeout(() => {
            notification.onTimeout?.();
            remove(notification.id);
        }, notification.timeout);
    }
};

const remove = (id: string) => {
    notifications.value = notifications.value.filter((notification) => notification.id != id);
};

const clear = () => {
    notifications.value = [];
};

globalThis.addEventListener("notification.add", (e) => {
    const notification = (e as CustomEvent).detail;
    add(notification);
});

globalThis.addEventListener("notification.remove", (e) => {
    const id = (e as CustomEvent).detail;
    remove(id);
});

globalThis.addEventListener("notification.clear", () => {
    clear();
});
</script>

<template>
    <div class="notifications">
        <template
            v-for="notification in notifications"
            :key="notification.id"
        >
            <ClosableNotification
                v-if="closableNotifications.includes(notification.type)"
                :notification="notification"
                @remove="remove"
            />
            <YesNoNotification
                v-else-if="notification.type == 'yes-no'"
                :notification="notification as IYesNoNotification"
                @remove="remove"
            />
        </template>
    </div>
</template>

<style scoped>
.notifications {
    position: fixed;
    inset: auto auto 0 0;
    z-index: 10;
    margin: 2em;
    display: flex;
    flex-direction: column;
    gap: 1em;
    align-items: flex-start;

    .notification {
        min-width: 200px;
        max-width: 400px;
        border-radius: 1em;
        filter: drop-shadow(0 0 0.5em rgba(0, 0, 0, 0.2));
    }
}
</style>
