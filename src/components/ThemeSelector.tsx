'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import styles from './Sidebar.module.css'; // Reusing sidebar styles for consistency since it will likely live there

export function ThemeSelector() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className={styles.select}>System</div>; // Placeholder to match server-side render
    }

    return (
        <select
            className={styles.select}
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            aria-label="Select Theme"
        >
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
        </select>
    );
}
