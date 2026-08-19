// src/app/layout.tsx

import type { Metadata } from "next";
// @ts-expect-error - global stylesheet is provided by the Next.js app setup
import "./globals.css";

export const metadata: Metadata = {
    title: "ASO Audit Agent",
    description: "App Store Optimization audit tool powered by AI",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
