'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, Save, X } from 'lucide-react';
import styles from './page.module.css';

interface HelperIssue {
    id: number;
    title: string | null;
    volume: number | null;
    issueNumber: string | null;
    fileName: string;
    cover: string | null;
    addedAt: string;
    updatedAt: string | null;
    readingProgress: {
        isFinished: boolean;
        currentPage: number;
    } | null;
}

interface Magazine {
    id: number;
    series: string;
    lastUpdated: string;
    issues: HelperIssue[];
}

export default function MagazinePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [magazine, setMagazine] = useState<Magazine | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editSeries, setEditSeries] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMagazine();
    }, [id]);

    const fetchMagazine = async () => {
        try {
            const res = await fetch(`/api/magazines/${id}`);
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setMagazine(data);
            setEditSeries(data.series);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            const res = await fetch(`/api/magazines/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ series: editSeries }),
            });
            if (res.ok) {
                const updated = await res.json();
                setMagazine(prev => prev ? { ...prev, series: updated.series } : null);
                setIsEditing(false);
                router.refresh();
            }
        } catch (error) {
            console.error('Failed to update', error);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this magazine? Files will remain.')) return;

        try {
            const res = await fetch(`/api/magazines/${id}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                router.push('/');
                router.refresh();
            }
        } catch (error) {
            console.error('Failed to delete', error);
        }
    };

    const getCoverIssue = (issues: HelperIssue[]) => {
        // "Issue não lido de menor valor ou issue de menor valor" logic
        if (!issues || issues.length === 0) return null;

        // Find first unread
        const unread = issues.find(i => !i.readingProgress?.isFinished);
        if (unread) return unread;

        // Fallback to first issue (assuming they are sorted by volume/number from backend)
        return issues[0];
    };

    if (loading) return <div>Loading...</div>;
    if (!magazine) return <div>Magazine not found</div>;

    const coverIssue = getCoverIssue(magazine.issues);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.coverContainer}>
                    {coverIssue ? (
                        <div className={styles.issueCover}>
                            <img
                                src={`/api/image/${coverIssue.id}/0?ts=${new Date(coverIssue.updatedAt || coverIssue.addedAt).getTime()}`}
                                alt={`Cover of ${coverIssue.title || 'issue'}`}
                                className={styles.coverImage}
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.parentElement!.innerText = coverIssue.issueNumber || String(coverIssue.id);
                                }}
                            />
                            {/* Fallback container for when image error happens and we hide the img */}
                            <div style={{ display: 'none' }}>
                                {coverIssue.issueNumber || coverIssue.id}
                            </div>
                        </div>
                    ) : (
                        <div className={styles.issueCover} />
                    )}
                </div>

                <div className={styles.info}>
                    {isEditing ? (
                        <input
                            value={editSeries}
                            onChange={(e) => setEditSeries(e.target.value)}
                            className={styles.input}
                            autoFocus
                        />
                    ) : (
                        <h1 className={styles.title}>{magazine.series}</h1>
                    )}

                    <div className={styles.metadata}>
                        <div className={styles.metaItem}>{magazine.issues.length} books</div>
                        {/* Add more metadata here as needed */}
                    </div>

                    <div className={styles.actions}>
                        {isEditing ? (
                            <>
                                <button onClick={handleSave} className={`${styles.button} ${styles.primaryButton}`}>
                                    <Save size={18} /> Save
                                </button>
                                <button onClick={() => setIsEditing(false)} className={`${styles.button} ${styles.secondaryButton}`}>
                                    <X size={18} /> Cancel
                                </button>
                            </>
                        ) : (
                            <>
                                <button onClick={() => setIsEditing(true)} className={`${styles.button} ${styles.secondaryButton}`}>
                                    <Pencil size={18} /> Edit
                                </button>
                                <button onClick={handleDelete} className={`${styles.button} ${styles.dangerButton}`}>
                                    <Trash2 size={18} /> Delete
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className={styles.issueList}>
                {magazine.issues.map(issue => (
                    <Link href={`/reader/${issue.id}`} key={issue.id} className={styles.issueCard}>
                        <div className={styles.issueCover}>
                            <img
                                src={`/api/image/${issue.id}/0?ts=${new Date(issue.updatedAt || issue.addedAt).getTime()}`}
                                alt={`Cover of ${issue.title || 'issue'}`}
                                className={styles.coverImage}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.parentElement!.innerText = issue.issueNumber || '#';
                                }}
                            />
                            {/* Fallback container */}
                            <div style={{ display: 'none' }}>
                                {issue.issueNumber || '#'}
                            </div>
                        </div>
                        <div className={styles.issueTitle}>{issue.title || issue.fileName}</div>
                        <div style={{ fontSize: '0.8rem', color: '#888' }}>
                            {issue.volume ? `Vol. ${issue.volume}` : ''} {issue.issueNumber ? `No. ${issue.issueNumber}` : ''}
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
