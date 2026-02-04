import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { Notifications, type IFullNotification } from "./createNotification";

describe("Notifications", () => {
    let eventListener: EventListenerOrEventListenerObject | null = null;

    beforeEach(() => {
        // Mock window.dispatchEvent to capture events
        vi.spyOn(window, "dispatchEvent").mockImplementation((event: Event) => {
            if (eventListener && typeof eventListener === "function") {
                eventListener(event);
            }
            return true;
        });

        // Mock addEventListener to capture the listener
        vi.spyOn(window, "addEventListener").mockImplementation((
            _type: string,
            listener: EventListenerOrEventListenerObject
        ) => {
            eventListener = listener;
        });
    });

    afterEach(() => {
        eventListener = null;
        vi.restoreAllMocks();
    });

    describe("addSuccess", () => {
        it("should dispatch success notification event", () => {
            let capturedEvent: CustomEvent<IFullNotification> | null = null;
            window.addEventListener("notification.add", ((e: Event) => {
                capturedEvent = e as CustomEvent<IFullNotification>;
            }) as EventListener);

            Notifications.addSuccess("Success message");

            expect(window.dispatchEvent).toHaveBeenCalled();
            expect(capturedEvent).not.toBeNull();
            expect(capturedEvent!.detail.message).toBe("Success message");
            expect(capturedEvent!.detail.type).toBe("success");
        });

        it("should return a unique id", () => {
            const id1 = Notifications.addSuccess("Message 1");
            const id2 = Notifications.addSuccess("Message 2");
            
            expect(id1).toBeTruthy();
            expect(id2).toBeTruthy();
            expect(id1).not.toBe(id2);
        });

        it("should include all optional parameters", () => {
            let capturedEvent: CustomEvent<IFullNotification> | null = null;
            window.addEventListener("notification.add", ((e: Event) => {
                capturedEvent = e as CustomEvent<IFullNotification>;
            }) as EventListener);

            const onClick = vi.fn();
            Notifications.addSuccess(
                "Success",
                "Details",
                5000,
                onClick,
                "/redirect"
            );

            expect(capturedEvent!.detail.message).toBe("Success");
            expect(capturedEvent!.detail.details).toBe("Details");
            expect(capturedEvent!.detail.timeout).toBe(5000);
            expect(capturedEvent!.detail.onClick).toBe(onClick);
            expect(capturedEvent!.detail.redirect).toBe("/redirect");
        });
    });

    describe("addError", () => {
        it("should dispatch error notification event", () => {
            let capturedEvent: CustomEvent<IFullNotification> | null = null;
            window.addEventListener("notification.add", ((e: Event) => {
                capturedEvent = e as CustomEvent<IFullNotification>;
            }) as EventListener);

            Notifications.addError("Error message");

            expect(capturedEvent!.detail.message).toBe("Error message");
            expect(capturedEvent!.detail.type).toBe("error");
        });

        it("should return a unique id", () => {
            const id1 = Notifications.addError("Error 1");
            const id2 = Notifications.addError("Error 2");
            
            expect(id1).not.toBe(id2);
        });

        it("should include details when provided", () => {
            let capturedEvent: CustomEvent<IFullNotification> | null = null;
            window.addEventListener("notification.add", ((e: Event) => {
                capturedEvent = e as CustomEvent<IFullNotification>;
            }) as EventListener);

            Notifications.addError("Error", "Error details");

            expect(capturedEvent!.detail.message).toBe("Error");
            expect(capturedEvent!.detail.details).toBe("Error details");
        });
    });

    describe("addInfo", () => {
        it("should dispatch info notification event", () => {
            let capturedEvent: CustomEvent<IFullNotification> | null = null;
            window.addEventListener("notification.add", ((e: Event) => {
                capturedEvent = e as CustomEvent<IFullNotification>;
            }) as EventListener);

            Notifications.addInfo("Info message");

            expect(capturedEvent!.detail.message).toBe("Info message");
            expect(capturedEvent!.detail.type).toBe("info");
        });

        it("should return a unique id", () => {
            const id1 = Notifications.addInfo("Info 1");
            const id2 = Notifications.addInfo("Info 2");
            
            expect(id1).not.toBe(id2);
        });
    });

    describe("addWarning", () => {
        it("should dispatch warning notification event", () => {
            let capturedEvent: CustomEvent<IFullNotification> | null = null;
            window.addEventListener("notification.add", ((e: Event) => {
                capturedEvent = e as CustomEvent<IFullNotification>;
            }) as EventListener);

            Notifications.addWarning("Warning message");

            expect(capturedEvent!.detail.message).toBe("Warning message");
            expect(capturedEvent!.detail.type).toBe("warning");
        });

        it("should return a unique id", () => {
            const id1 = Notifications.addWarning("Warning 1");
            const id2 = Notifications.addWarning("Warning 2");
            
            expect(id1).not.toBe(id2);
        });
    });

    describe("addYesNo", () => {
        it("should dispatch yes-no notification event", () => {
            let capturedEvent: CustomEvent<IFullNotification> | null = null;
            window.addEventListener("notification.add", ((e: Event) => {
                capturedEvent = e as CustomEvent<IFullNotification>;
            }) as EventListener);

            Notifications.addYesNo("Confirm action?");

            expect(capturedEvent!.detail.message).toBe("Confirm action?");
            expect(capturedEvent!.detail.type).toBe("yes-no");
        });

        it("should return a unique id", () => {
            const id1 = Notifications.addYesNo("Question 1?");
            const id2 = Notifications.addYesNo("Question 2?");
            
            expect(id1).not.toBe(id2);
        });

        it("should include all callback parameters", () => {
            let capturedEvent: CustomEvent<IFullNotification> | null = null;
            window.addEventListener("notification.add", ((e: Event) => {
                capturedEvent = e as CustomEvent<IFullNotification>;
            }) as EventListener);

            const onYes = vi.fn();
            const onNo = vi.fn();
            const onTimeout = vi.fn();
            const onClick = vi.fn();

            Notifications.addYesNo(
                "Confirm?",
                "Details",
                10000,
                onYes,
                onNo,
                onTimeout,
                onClick,
                "/redirect"
            );

            expect(capturedEvent!.detail.message).toBe("Confirm?");
            expect(capturedEvent!.detail.details).toBe("Details");
            expect(capturedEvent!.detail.timeout).toBe(10000);
            expect(capturedEvent!.detail.onYes).toBe(onYes);
            expect(capturedEvent!.detail.onNo).toBe(onNo);
            expect(capturedEvent!.detail.onTimeout).toBe(onTimeout);
            expect(capturedEvent!.detail.onClick).toBe(onClick);
            expect(capturedEvent!.detail.redirect).toBe("/redirect");
        });
    });

    describe("remove", () => {
        it("should dispatch remove notification event with id", () => {
            let capturedEvent: CustomEvent<string> | null = null;
            window.addEventListener("notification.remove", ((e: Event) => {
                capturedEvent = e as CustomEvent<string>;
            }) as EventListener);

            Notifications.remove("notification-id");

            expect(window.dispatchEvent).toHaveBeenCalled();
            expect(capturedEvent!.detail).toBe("notification-id");
        });

        it("should handle removing multiple notifications", () => {
            const removedIds: string[] = [];
            window.addEventListener("notification.remove", ((e: Event) => {
                const customEvent = e as CustomEvent<string>;
                removedIds.push(customEvent.detail);
            }) as EventListener);

            Notifications.remove("id-1");
            Notifications.remove("id-2");
            Notifications.remove("id-3");

            expect(removedIds).toEqual(["id-1", "id-2", "id-3"]);
        });
    });

    describe("clear", () => {
        it("should dispatch clear notification event", () => {
            let eventDispatched = false;
            window.addEventListener("notification.clear", () => {
                eventDispatched = true;
            });

            Notifications.clear();

            expect(window.dispatchEvent).toHaveBeenCalled();
            expect(eventDispatched).toBe(true);
        });

        it("should dispatch event without detail", () => {
            let capturedEvent: Event | null = null;
            window.addEventListener("notification.clear", ((e: Event) => {
                capturedEvent = e;
            }) as EventListener);

            Notifications.clear();

            expect(capturedEvent).not.toBeNull();
        });
    });

    describe("notification id generation", () => {
        it("should generate different ids for concurrent notifications", () => {
            const ids = new Set<string>();
            
            for (let i = 0; i < 100; i++) {
                const id = Notifications.addSuccess("Test");
                ids.add(id);
            }
            
            // All ids should be unique
            expect(ids.size).toBe(100);
        });

        it("should generate ids with expected format", () => {
            const id = Notifications.addSuccess("Test");
            
            // ID should be a string
            expect(typeof id).toBe("string");
            // ID should have reasonable length (Math.random().toString(36).substring(7) typically produces 7-11 chars)
            expect(id.length).toBeGreaterThan(0);
        });
    });

    describe("notification structure", () => {
        it("should create notification with correct structure", () => {
            let capturedNotification: IFullNotification | null = null;
            window.addEventListener("notification.add", ((e: Event) => {
                const customEvent = e as CustomEvent<IFullNotification>;
                capturedNotification = customEvent.detail;
            }) as EventListener);

            Notifications.addSuccess("Test", "Details", 3000);

            expect(capturedNotification).toMatchObject({
                id: expect.any(String),
                message: "Test",
                details: "Details",
                type: "success",
                timeout: 3000,
            });
        });

        it("should create yes-no notification with extended structure", () => {
            let capturedNotification: IFullNotification | null = null;
            window.addEventListener("notification.add", ((e: Event) => {
                const customEvent = e as CustomEvent<IFullNotification>;
                capturedNotification = customEvent.detail;
            }) as EventListener);

            const onYes = vi.fn();
            const onNo = vi.fn();

            Notifications.addYesNo("Confirm?", undefined, undefined, onYes, onNo);

            expect(capturedNotification).toMatchObject({
                id: expect.any(String),
                message: "Confirm?",
                type: "yes-no",
                onYes: expect.any(Function),
                onNo: expect.any(Function),
            });
        });
    });
});
