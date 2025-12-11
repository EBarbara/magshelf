'use client';

import { Search, Menu, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import styles from './Topbar.module.css';

export default function Topbar() {
    return (
        <header className={styles.topbar}>
            <div className={styles.left}>
                <button className={styles.iconBtn}><Menu size={20} /></button>
                <div className={styles.searchBar}>
                    <Search size={18} className={styles.searchIcon} />
                    <input type="text" placeholder="Search" className={styles.searchInput} />
                </div>
            </div>

            <div className={styles.right}>
                <a href="#" className={styles.link}>Library</a>
                <a href="#" className={styles.link}>Articles</a>
                <a href="#" className={styles.link}>People</a>
                <Link href="/admin" className={styles.link}>Admin</Link>
            </div>
        </header>
    );
}
