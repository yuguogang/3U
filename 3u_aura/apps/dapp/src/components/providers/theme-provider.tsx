"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes"

function ThemeMigration() {
    const { theme, setTheme } = useTheme()

    React.useEffect(() => {
        if (theme === "aura") {
            setTheme("day")
        }
    }, [setTheme, theme])

    return null
}

export function ThemeProvider({
    children,
    ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
    return (
        <NextThemesProvider {...props}>
            <ThemeMigration />
            {children}
        </NextThemesProvider>
    )
}
