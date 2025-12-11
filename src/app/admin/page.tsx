'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';

interface Magazine {
    id: number;
    title: string;
    path: string;
}

export default function AdminPage() {
    const [magazines, setMagazines] = useState<Magazine[]>([]);
    const [scanStatus, setScanStatus] = useState('');

    useEffect(() => {
        loadMagazines();
    }, []);

    const loadMagazines = () => {
        fetch('/api/magazines')
            .then(res => res.json())
            .then(data => setMagazines(data));
    };

    const handleScan = async () => {
        setScanStatus('Scanning...');
        try {
            const res = await fetch('/api/scan');
            const data = await res.json();
            setScanStatus(data.message || 'Scan complete');
            loadMagazines();
        } catch (e) {
            setScanStatus('Scan failed');
        }
    };

    const handleUpdateTitle = async (id: number, newTitle: string) => {
        // Implementation for simple update
        await fetch('/api/admin/magazine', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, title: newTitle })
        });
        loadMagazines();
    };

    return (
        <div className={styles.container}>
            <h1>Admin Dashboard</h1>

            <div className={styles.actions}>
                <button onClick={handleScan} className={styles.btn}>Scan Library</button>
                <span>{scanStatus}</span>
            </div>

            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Title</th>
                        <th>Path</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {magazines.map(mag => (
                        <tr key={mag.id}>
                            <td>{mag.id}</td>
                            <td>
                                <input
                                    defaultValue={mag.title}
                                    onBlur={(e) => handleUpdateTitle(mag.id, e.target.value)}
                                    className={styles.input}
                                />
                            </td>
                            <td>{mag.path}</td>
                            <td>
                                <button className={styles.textBtn}>Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
