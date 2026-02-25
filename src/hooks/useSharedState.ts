"use client";

import { useState, useEffect } from "react";

export function useSharedState<T>(key: string, initialValue: T) {
    const [state, setState] = useState<T>(() => {
        if (typeof window === "undefined") return initialValue;
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.warn(`Error reading localStorage key "${key}":`, error);
            return initialValue;
        }
    });

    const setValue = (value: T | ((val: T) => T)) => {
        try {
            const valueToStore = value instanceof Function ? value(state) : value;
            setState(valueToStore);
            if (typeof window !== "undefined") {
                window.localStorage.setItem(key, JSON.stringify(valueToStore));
                // Dispatch a custom event so tabs on the same page can also react immediately
                window.dispatchEvent(new CustomEvent("local-storage-sync", { detail: { key, value: valueToStore } }));
            }
        } catch (error) {
            console.warn(`Error setting localStorage key "${key}":`, error);
        }
    };

    // Listen for changes from BOTH other tabs (storage event) AND the current tab (custom event)
    useEffect(() => {
        if (typeof window === "undefined") return;

        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === key && e.newValue !== null) {
                try {
                    setState(JSON.parse(e.newValue));
                } catch (error) {
                    console.error("Failed to parse storage value", error);
                }
            }
        };

        const handleLocalChange = (e: CustomEvent) => {
            if (e.detail.key === key) {
                setState(e.detail.value);
            }
        };

        window.addEventListener("storage", handleStorageChange);
        window.addEventListener("local-storage-sync", handleLocalChange as EventListener);

        return () => {
            window.removeEventListener("storage", handleStorageChange);
            window.removeEventListener("local-storage-sync", handleLocalChange as EventListener);
        };
    }, [key]);

    return [state, setValue] as const;
}
