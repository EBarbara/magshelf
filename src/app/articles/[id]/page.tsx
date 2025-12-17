'use client';

import { useState, useEffect, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen, Edit, Trash2 } from 'lucide-react';
import styles from './page.module.css';

interface Article {
    id: number;
    title: string;
    content: string | null;
    startPage: number;
    endPage: number | null;
    issueId: number;
}

interface Issue {
    id: number;
    title: string | null;
    issueNumber: string | null;
    fileName: string;
    cover: string | null;
}

interface Magazine {
    id: number;
    series: string;
}

interface Data {
    article: Article;
    issue: Issue;
    magazine: Magazine;
}

export default function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [data, setData] = useState<Data | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Edit Modal State
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        title: '',
        content: '',
        startPage: 0,
        endPage: 0 as number | null,
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchArticle();
    }, [id]);

    const fetchArticle = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/articles/${id}`);
            if (!res.ok) throw new Error('Failed to load article');
            const jsonData = await res.json();
            setData(jsonData);

            // Initialize form data
            if (jsonData && jsonData.article) {
                setEditForm({
                    title: jsonData.article.title || '',
                    content: jsonData.article.content || '',
                    startPage: jsonData.article.startPage,
                    endPage: jsonData.article.endPage,
                });
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this article?')) {
            return;
        }

        try {
            const res = await fetch(`/api/articles/${id}`, {
                method: 'DELETE',
            });

            if (!res.ok) throw new Error('Failed to delete article');

            // Redirect to issue page
            if (data?.issue) {
                router.push(`/issues/${data.issue.id}`);
            } else {
                router.push('/');
            }
        } catch (err: any) {
            alert('Error deleting article: ' + err.message);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/articles/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm),
            });

            if (!res.ok) throw new Error('Failed to update article');

            const updatedArticle = await res.json();

            // Update local state
            setData(prev => prev ? { ...prev, article: updatedArticle } : null);
            setIsEditing(false);
        } catch (err: any) {
            alert('Error updating article: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className={styles.container}>Loading...</div>;
    if (error) return <div className={styles.container}>Error: {error}</div>;
    if (!data) return <div className={styles.container}>Article not found</div>;

    const { article, issue, magazine } = data;
    // Cover is the start page of the article
    const coverUrl = `/api/image/${issue.id}/${article.startPage}`;
    const readUrl = `/reader/${issue.id}?start=${article.startPage}${article.endPage ? `&end=${article.endPage}` : ''}`;

    return (
        <div className={styles.container}>
            {/* Left Column: Cover (Page 1 of Article) */}
            <div className={styles.coverSection}>
                <Image
                    src={coverUrl}
                    alt={article.title}
                    fill
                    className={styles.coverImage}
                    sizes="(max-width: 768px) 100vw, 400px"
                    priority
                />
            </div>

            {/* Right Column: Info & Actions */}
            <div className={styles.infoSection}>
                <div className={styles.header}>
                    <div style={{ marginBottom: '10px' }}>
                        <Link href={`/issues/${issue.id}`} className={styles.seriesLink}>
                            <ArrowLeft size={16} style={{ display: 'inline', marginRight: '5px' }} />
                            Back to Issue
                        </Link>
                    </div>

                    <h1 className={styles.title}>{article.title}</h1>
                    <p className={styles.series}>
                        <Link href={`/magazines/${magazine.id}`} className={styles.seriesLink}>
                            {magazine.series}
                        </Link>
                        {issue.issueNumber && <span> #{issue.issueNumber}</span>}
                    </p>
                </div>

                <div className={styles.actions}>
                    <Link href={readUrl} className={`${styles.actionButton} ${styles.readButton}`}>
                        <BookOpen size={20} />
                        READ ARTICLE
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
                        <span className={styles.metaLabel}>Start Page</span>
                        <span className={styles.metaValue}>{article.startPage}</span>
                    </div>
                    <div className={styles.metaItem}>
                        <span className={styles.metaLabel}>End Page</span>
                        <span className={styles.metaValue}>{article.endPage || '-'}</span>
                    </div>
                </div>

                {article.content && (
                    <div className={styles.contentSection}>
                        <h3>Content</h3>
                        <p style={{ whiteSpace: 'pre-wrap' }}>{article.content}</p>
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {isEditing && (
                <div className={styles.modalOverlay} onClick={() => setIsEditing(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <h2 className={styles.modalTitle}>Edit Article</h2>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Title</label>
                            <input
                                className={styles.input}
                                value={editForm.title}
                                onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Content</label>
                            <textarea
                                className={styles.textarea}
                                value={editForm.content}
                                onChange={e => setEditForm({ ...editForm, content: e.target.value })}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <div className={styles.formGroup} style={{ flex: 1 }}>
                                <label className={styles.label}>Start Page</label>
                                <input
                                    type="number"
                                    className={styles.input}
                                    value={editForm.startPage}
                                    onChange={e => setEditForm({ ...editForm, startPage: parseInt(e.target.value) })}
                                />
                            </div>
                            <div className={styles.formGroup} style={{ flex: 1 }}>
                                <label className={styles.label}>End Page</label>
                                <input
                                    type="number"
                                    className={styles.input}
                                    value={editForm.endPage || ''}
                                    onChange={e => setEditForm({ ...editForm, endPage: e.target.value ? parseInt(e.target.value) : null })}
                                    placeholder="Optional"
                                />
                            </div>
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
