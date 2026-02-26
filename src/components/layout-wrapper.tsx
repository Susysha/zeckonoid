"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isLanding = pathname === "/";

    if (isLanding) {
        return (
            <div className="app-wrapper-landing">
                {children}
            </div>
        );
    }

    return (
        <div className="app-wrapper">
            <Sidebar />
            {children}
        </div>
    );
}
