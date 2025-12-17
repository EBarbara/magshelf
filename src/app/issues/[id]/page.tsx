'use client';

import { useState, useEffect, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen, Edit, Trash2, ExternalLink } from 'lucide-react';
import styles from './page.module.css';

interface Issue {
    id: number;
    title: string | null;
    issueNumber: string | null;
    fileName: string;
    pageCount: number;
    cover: string | null;
    addedAt: string;
    magazineId: number;
}

interface Magazine {
    id: number;
    series: string; // The magazine title
}

interface Data {
    issue: Issue;
    magazine: Magazine;
}

export default function IssuePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [data, setData] = useState<Data | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Edit Modal State
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        title: '',
        issueNumber: '',
        cover: '',
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchIssue();
    }, [id]);

    const fetchIssue = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/issues/${id}`);
            if (!res.ok) throw new Error('Failed to load issue');
            const jsonData = await res.json();
            setData(jsonData);

            // Initialize form data
            if (jsonData && jsonData.issue) {
                setEditForm({
                    title: jsonData.issue.title || '',
                    issueNumber: jsonData.issue.issueNumber || '',
                    cover: jsonData.issue.cover || '',
                });
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this issue details? The file will NOT be deleted.')) {
            return;
        }

        try {
            const res = await fetch(`/api/issues/${id}`, {
                method: 'DELETE',
            });

            if (!res.ok) throw new Error('Failed to delete issue');

            // Redirect to magazine page
            if (data?.magazine) {
                router.push(`/magazines/${data.magazine.id}`);
            } else {
                router.push('/');
            }
        } catch (err: any) {
            alert('Error deleting issue: ' + err.message);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/issues/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm),
            });

            if (!res.ok) throw new Error('Failed to update issue');

            const updatedIssue = await res.json();

            // Update local state
            setData(prev => prev ? { ...prev, issue: updatedIssue } : null);
            setIsEditing(false);
        } catch (err: any) {
            alert('Error updating issue: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className={styles.container}>Loading...</div>;
    if (error) return <div className={styles.container}>Error: {error}</div>;
    if (!data) return <div className={styles.container}>Issue not found</div>;

    const { issue, magazine } = data;
    const coverUrl = issue.cover || `/api/image/${issue.id}/0`;
    const displayTitle = issue.title || issue.fileName;

    return (
        <div className={styles.container}>
            {/* Left Column: Cover */}
            <div className={styles.coverSection}>
                <Image
                    src={coverUrl}
                    alt={displayTitle}
                    fill
                    className={styles.coverImage}
                    sizes="(max-width: 768px) 100vw, 300px"
                    priority
                />
            </div>

            {/* Right Column: Info & Actions */}
            <div className={styles.infoSection}>
                <div className={styles.header}>
                    <div style={{ marginBottom: '10px' }}>
                        <Link href={`/magazines/${magazine.id}`} className={styles.seriesLink}>
                            <ArrowLeft size={16} style={{ display: 'inline', marginRight: '5px' }} />
                            Back to {magazine.series}
                        </Link>
                    </div>

                    <h1 className={styles.title}>{displayTitle}</h1>
                    <p className={styles.series}>
                        <Link href={`/magazines/${magazine.id}`} className={styles.seriesLink}>
                            {magazine.series}
                        </Link>
                        {issue.issueNumber && <span> #{issue.issueNumber}</span>}
                    </p>
                </div>

                <div className={styles.actions}>
                    <Link href={`/reader/${issue.id}`} className={`${styles.actionButton} ${styles.readButton}`}>
                        <BookOpen size={20} />
                        READ
                    </Link>

                    <button onClick={() => setIsEditing(true)} className={`${styles.actionButton} ${styles.editButton}`}>
                        <Edit size={20} />
                        EDIT
                    </button>

                    <button onClick={handleDelete} className={`${styles.actionButton} ${styles.deleteButton}`}>
                        <Trash2 size={20} />
                        DELETE
                    </button>
                </div>

                <div className={styles.metadataGrid}>
                    <div className={styles.metaItem}>
                        <span className={styles.metaLabel}>Issue Number</span>
                        <span className={styles.metaValue}>{issue.issueNumber || '-'}</span>
                    </div>
                    <div className={styles.metaItem}>
                        <span className={styles.metaLabel}>Page Count</span>
                        <span className={styles.metaValue}>{issue.pageCount}</span>
                    </div>
                    <div className={styles.metaItem}>
                        <span className={styles.metaLabel}>File Name</span>
                        <span className={styles.metaValue} style={{ wordBreak: 'break-all', fontSize: '0.9rem' }}>
                            {issue.fileName}
                        </span>
                    </div>
                    <div className={styles.metaItem}>
                        <span className={styles.metaLabel}>Added</span>
                        <span className={styles.metaValue}>
                            {new Date(issue.addedAt).toLocaleDateString()}
                        </span>
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {isEditing && (
                <div className={styles.modalOverlay} onClick={() => setIsEditing(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <h2 className={styles.modalTitle}>Edit Issue</h2>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Title</label>
                            <input
                                className={styles.input}
                                value={editForm.title}
                                onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                                placeholder="Display Title"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Issue Number</label>
                            <input
                                className={styles.input}
                                value={editForm.issueNumber}
                                onChange={e => setEditForm({ ...editForm, issueNumber: e.target.value })}
                                placeholder="e.g. 01, Special"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Custom Cover Path / URL</label>
                            <input
                                className={styles.input}
                                value={editForm.cover}
                                onChange={e => setEditForm({ ...editForm, cover: e.target.value })}
                                placeholder="/path/to/cover.jpg or http..."
                            />
                            <small style={{ color: '#888' }}>Leave empty to use page 1 of the file.</small>
                        </div>

                        <div className={styles.modalActions}>
                            <button
                                className={styles.cancelButton}
                                onClick={() => setIsEditing(false)}
                                disabled={saving}
                            >
                                Cancel
                            </button>
                            <button
                                className={styles.saveButton}
                                onClick={handleSave}
                                disabled={saving}
                            >
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
