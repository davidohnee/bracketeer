import { generateId } from "@/helpers/id";

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
    globalThis.dispatchEvent(notificationEvent);
};

export const Notifications = {
    addSuccess(
        message: string,
        {
            details,
            timeout,
            onClick,
            redirect,
        }: {
            details?: string;
            timeout?: number;
            onClick?: () => void;
            redirect?: string;
        } = {},
    ) {
        const id = generateId();
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
        {
            details,
            timeout,
            onClick,
            redirect,
        }: {
            details?: string;
            timeout?: number;
            onClick?: () => void;
            redirect?: string;
        } = {},
    ) {
        const id = generateId();
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
        {
            details,
            timeout,
            onClick,
            redirect,
        }: {
            details?: string;
            timeout?: number;
            onClick?: () => void;
            redirect?: string;
        } = {},
    ) {
        const id = generateId();
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
        {
            details,
            timeout,
            onClick,
            redirect,
        }: {
            details?: string;
            timeout?: number;
            onClick?: () => void;
            redirect?: string;
        } = {},
    ) {
        const id = generateId();
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
        {
            details,
            timeout,
            onYes,
            onNo,
            onTimeout,
            onClick,
            redirect,
        }: {
            details?: string;
            timeout?: number;
            onYes?: () => void;
            onNo?: () => void;
            onTimeout?: () => void;
            onClick?: () => void;
            redirect?: string;
        } = {},
    ) {
        const id = generateId();
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
        globalThis.dispatchEvent(notificationEvent);
    },
    clear() {
        const notificationEvent = new CustomEvent("notification.clear");
        globalThis.dispatchEvent(notificationEvent);
    },
};
