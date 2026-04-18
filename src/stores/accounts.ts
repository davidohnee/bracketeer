import { defineStore } from "pinia";
import { computed, ref, watch } from "vue";

import { throttle } from "lodash";
import type { Account } from "@/types/accounts";
import { gistShare } from "@/helpers/share/gist/gist";

const LOCAL_STORAGE_KEY = "accounts";

export const useAccountsStore = defineStore(LOCAL_STORAGE_KEY, () => {
    const accounts = ref<Account[]>([]);

    const throttlingEnabled = ref(true);
    const _syncToLocalStorage = () =>
        localStorage.setItem(
            LOCAL_STORAGE_KEY,
            JSON.stringify(
                accounts.value.map((x) => ({
                    ...x,
                    accessToken: btoa(x.accessToken), // obfuscation only!
                })),
            ),
        );
    const _throttledSyncToLocalStorage = throttle(() => {
        _syncToLocalStorage();
    }, 300);
    const syncToLocalStorage = computed(() => {
        if (!throttlingEnabled.value) {
            return _syncToLocalStorage;
        }
        return _throttledSyncToLocalStorage;
    });

    watch(accounts, () => syncToLocalStorage.value(), { deep: true });
    const storedAccounts = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedAccounts) {
        accounts.value = JSON.parse(storedAccounts)
            .map((x: Account) => {
                try {
                    return {
                        ...x,
                        accessToken: atob(x.accessToken),
                    };
                } catch {
                    return null;
                }
            })
            .filter(Boolean);
    }

    const add = (account: Account) => {
        accounts.value.push(account);
    };

    const remove = (accountId: string) => {
        accounts.value = accounts.value.filter((t) => t.id !== accountId);
    };

    return {
        migrate: () => {
            const account = gistShare.migrate();
            if (account) {
                add(account);
            }
        },
        all: accounts,
        add,
        remove,
        findShareAccount: (remoteIdentifier: string) => {
            return gistShare.isMine(
                remoteIdentifier,
                accounts.value.filter((x) => x.type === "gist"),
            );
        },
        disableThrottling: () => {
            console.warn("Disabling throttling for accounts store");
            throttlingEnabled.value = false;
        },
        enableThrottling: () => {
            console.info("Enabling throttling for accounts store");
            throttlingEnabled.value = true;
        },
    };
});
