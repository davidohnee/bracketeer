/*
 * Copyright (c) 2023, reAudioPlayer ONE.
 * Licenced under the GNU General Public License v3.0
 */

export interface INotification {
    id: string;
    message: string;
    details?: string;
    type: "success" | "error" | "info" | "warning" | "yes-no";
    timeout?: number;
    onClick?: () => void;
    redirect?: string;
}

export interface IYesNoNotification extends INotification {
    type: "yes-no";
    onYes?: () => void;
    onNo?: () => void;
    onTimeout?: () => void;
}

export interface IFullNotification extends INotification {
    onYes?: () => void;
    onNo?: () => void;
    onTimeout?: () => void;
}

const triggerNotification = (notification: IFullNotification) => {
    const notificationEvent = new CustomEvent("notification.add", {
        detail: notification,
    });
    window.dispatchEvent(notificationEvent);
};

export const Notifications = {
    addSuccess(
        message: string,
        details?: string,
        timeout?: number,
        onClick?: () => void,
        redirect?: string,
    ) {
        const id = Math.random().toString(36).substring(7);
        const notification: IFullNotification = {
            id,
            message,
            details,
            type: "success",
            timeout,
            onClick,
            redirect,
        };
        triggerNotification(notification);
        return id;
    },
    addError(
        message: string,
        details?: string,
        timeout?: number,
        onClick?: () => void,
        redirect?: string,
    ) {
        const id = Math.random().toString(36).substring(7);
        const notification: IFullNotification = {
            id,
            message,
            details,
            type: "error",
            timeout,
            onClick,
            redirect,
        };
        triggerNotification(notification);
        return id;
    },
    addInfo(
        message: string,
        details?: string,
        timeout?: number,
        onClick?: () => void,
        redirect?: string,
    ) {
        const id = Math.random().toString(36).substring(7);
        const notification: IFullNotification = {
            id,
            message,
            details,
            type: "info",
            timeout,
            onClick,
            redirect,
        };
        triggerNotification(notification);
        return id;
    },
    addWarning(
        message: string,
        details?: string,
        timeout?: number,
        onClick?: () => void,
        redirect?: string,
    ) {
        const id = Math.random().toString(36).substring(7);
        const notification: IFullNotification = {
            id,
            message,
            details,
            type: "warning",
            timeout,
            onClick,
            redirect,
        };
        triggerNotification(notification);
        return id;
    },
    addYesNo(
        message: string,
        details?: string,
        timeout?: number,
        onYes?: () => void,
        onNo?: () => void,
        onTimeout?: () => void,
        onClick?: () => void,
        redirect?: string,
    ) {
        const id = Math.random().toString(36).substring(7);
        const notification: IYesNoNotification = {
            id,
            message,
            details,
            type: "yes-no",
            timeout,
            onYes,
            onNo,
            onTimeout,
            onClick,
            redirect,
        };
        triggerNotification(notification);
        return id;
    },
    remove(id: string) {
        const notificationEvent = new CustomEvent("notification.remove", {
            detail: id,
        });
        window.dispatchEvent(notificationEvent);
    },
    clear() {
        const notificationEvent = new CustomEvent("notification.clear");
        window.dispatchEvent(notificationEvent);
    },
};
