'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';

export default function SettingsPage() {
    const [path, setPath] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetch('/api/settings')
            .then(res => res.json())
            .then(data => {
                setPath(data.LIBRARY_PATH || '');
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage('');

        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: 'LIBRARY_PATH', value: path })
            });

            if (res.ok) {
                setMessage('Settings saved successfully');
            } else {
                setMessage('Failed to save settings');
            }
        } catch (err) {
            setMessage('An error occurred');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className={styles.container}>Loading...</div>;

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Settings</h1>

            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Library Configuration</h2>
                <form onSubmit={handleSave}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Library Root Path</label>
                        <input
                            type="text"
                            value={path}
                            onChange={(e) => setPath(e.target.value)}
                            className={styles.input}
                            placeholder="./data"
                        />
                        <p className={styles.helpText}>
                            Absolute path to the folder containing your magazines (e.g., C:\Books or /mnt/books).
                            Supports network drives mapped to a drive letter.
                            <br />
                            Leave empty to use <code>MAGSHELF_LIBRARY_PATH</code> environment variable or default to <code>./data</code>.
                        </p>
                    </div>

                    <button type="submit" className={styles.button} disabled={saving}>
                        {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                    {message && <p className={styles.helpText} style={{ color: message.includes('Failed') || message.includes('error') ? 'var(--destructive)' : 'var(--primary)' }}>{message}</p>}
                </form>
            </div>
        </div>
    );
}
