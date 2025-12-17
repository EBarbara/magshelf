'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Library, User, LogOut, ChevronDown, BookOpen } from 'lucide-react';
import styles from './Sidebar.module.css';
import { useState, useEffect } from 'react';

interface Magazine {
    id: number;
    title: string;
}


export default function Sidebar() {
    const pathname = usePathname();
    const [librariesOpen, setLibrariesOpen] = useState(true);
    const [magazines, setMagazines] = useState<Magazine[]>([]);

    useEffect(() => {
        fetch('/api/magazines')
            .then(res => res.json())
            .then(data => setMagazines(data))
            .catch(err => console.error('Failed to fetch magazines:', err));
    }, []);

    return (
        <aside className={styles.sidebar}>
            <div className={styles.logo}>
                <div className={styles.logoIcon}><BookOpen size={24} /></div>
                <span className={styles.logoText}>MagShelf</span>
            </div>

            <nav className={styles.nav}>
                <Link href="/" className={`${styles.navItem} ${pathname === '/' ? styles.active : ''}`}>
                    <Home size={20} />
                    <span>Home</span>
                </Link>

                <div className={styles.group}>
                    <div
                        className={styles.groupHeader}
                        onClick={() => setLibrariesOpen(!librariesOpen)}
                    >
                        <div className={styles.groupTitle}>
                            <Library size={20} />
                            <span>Magazines</span>
                        </div>
                        <ChevronDown
                            size={16}
                            className={`${styles.chevron} ${librariesOpen ? styles.open : ''}`}
                        />
                    </div>

                    {librariesOpen && (
                        <div className={styles.groupContent}>
                            {magazines.map((mag) => (
                                <Link
                                    key={mag.id}
                                    href={`/magazines/${mag.id}`}
                                    className={`${styles.subItem} ${pathname === `/magazines/${mag.id}` ? styles.activeSubItem : ''}`}
                                >
                                    {mag.title}
                                </Link>
                            ))}
                            {magazines.length === 0 && (
                                <div className={styles.emptyState}>No magazines found</div>
                            )}
                        </div>
                    )}
                </div>

                <div className={styles.divider} />

                <div className={styles.group}>
                    <div className={styles.groupHeader}>
                        <div className={styles.groupTitle}>
                            <User size={20} />
                            <span>My Account</span>
                        </div>
                        <ChevronDown size={16} />
                    </div>
                </div>

                <div className={styles.navItem}>
                    <LogOut size={20} />
                    <span>Log Out</span>
                </div>

            </nav>

            <div className={styles.footer}>
                <div className={styles.footerItem}>
                    <label>Theme</label>
                    <div className={styles.select}>System</div>
                </div>
                <div className={styles.footerItem}>
                    <label>Translation</label>
                    <div className={styles.select}>English</div>
                </div>
            </div>
        </aside>
    );
}
