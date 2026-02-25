"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();

    return (
        <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="relative inline-flex h-9 w-18 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 p-1 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors border border-slate-200 dark:border-slate-700 shadow-inner"
        >
            <div className="flex w-full items-center justify-between px-2">
                <Sun className="h-4 w-4" />
                <Moon className="h-4 w-4" />
            </div>
            <div
                className={`absolute top-1 left-1 bottom-1 w-7 rounded-full bg-white dark:bg-slate-600 shadow-sm transition-transform duration-300 ease-in-out ${theme === "dark" ? "translate-x-9" : "translate-x-0"
                    }`}
            />
        </button>
    );
}
