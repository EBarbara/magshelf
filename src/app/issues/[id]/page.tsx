'use client';

import { useState, useEffect, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen, Edit, Trash2, Plus, MoreVertical } from 'lucide-react';
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

interface Article {
    id: number;
    title: string;
    startPage: number;
    endPage: number | null;
    content: string | null;
}

interface Data {
    issue: Issue;
    magazine: Magazine;
    articles: Article[];
}

export default function IssuePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [data, setData] = useState<Data | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Edit Issue Modal State
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        title: '',
        issueNumber: '',
        cover: '',
    });
    const [saving, setSaving] = useState(false);

    // Article Modal State (Create/Edit)
    const [isArticleModalOpen, setIsArticleModalOpen] = useState(false);
    const [articleForm, setArticleForm] = useState({
        id: null as number | null,
        title: '',
        content: '',
        startPage: 0,
        endPage: null as number | null,
    });
    const [savingArticle, setSavingArticle] = useState(false);

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

    // Article Actions

    const openCreateArticleModal = () => {
        setArticleForm({
            id: null,
            title: '',
            content: '',
            startPage: 0,
            endPage: null,
        });
        setIsArticleModalOpen(true);
    };

    const openEditArticleModal = (article: Article) => {
        setArticleForm({
            id: article.id,
            title: article.title,
            content: article.content || '',
            startPage: article.startPage,
            endPage: article.endPage,
        });
        setIsArticleModalOpen(true);
    };

    const handleSaveArticle = async () => {
        if (!data?.issue?.id) return;
        setSavingArticle(true);

        try {
            const isUpdate = !!articleForm.id;
            const url = isUpdate ? `/api/articles/${articleForm.id}` : `/api/articles`;
            const method = isUpdate ? 'PUT' : 'POST';
            const body = isUpdate 
                ? articleForm 
                : { ...articleForm, issueId: data.issue.id };

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (!res.ok) throw new Error(`Failed to ${isUpdate ? 'update' : 'create'} article`);

            // Refresh data
            await fetchIssue();
            setIsArticleModalOpen(false);
        } catch (err: any) {
            alert('Error saving article: ' + err.message);
        } finally {
            setSavingArticle(false);
        }
    };

    const handleDeleteArticle = async (articleId: number) => {
        if (!confirm('Are you sure you want to delete this article?')) return;
        
        try {
            const res = await fetch(`/api/articles/${articleId}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error('Failed to delete article');
            
            // Refresh
            await fetchIssue();
        } catch (err: any) {
            alert('Error deleting article: ' + err.message);
        }
    }


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

                {/* Articles Index */}
                <div style={{ marginTop: '3rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Articles</h2>
                        <button 
                            onClick={openCreateArticleModal}
                            style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '5px', 
                                padding: '6px 12px', 
                                backgroundColor: '#22c55e', 
                                color: 'white', 
                                border: 'none', 
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontWeight: 600
                            }}
                        >
                            <Plus size={16} /> New Article
                        </button>
                    </div>
                    
                    {data.articles && data.articles.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {data.articles.map((article) => (
                                <div 
                                    key={article.id} 
                                    style={{ 
                                        display: 'flex', 
                                        justifyContent: 'space-between', 
                                        alignItems: 'center',
                                        padding: '10px', 
                                        backgroundColor: 'rgba(255,255,255,0.05)', 
                                        borderRadius: '4px',
                                        transition: 'background-color 0.2s',
                                    }}
                                >
                                    <Link 
                                        href={`/articles/${article.id}`}
                                        style={{ 
                                            textDecoration: 'none', 
                                            color: 'inherit',
                                            flex: 1,
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            marginRight: '1rem'
                                        }}
                                    >
                                        <span style={{ fontWeight: 500 }}>{article.title}</span>
                                        <span style={{ color: '#888' }}>Page {article.startPage}</span>
                                    </Link>
                                    
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button 
                                            onClick={() => openEditArticleModal(article)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#eab308' }}
                                            title="Edit"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteArticle(article.id)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                                            title="Delete"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p style={{ color: '#888', fontStyle: 'italic' }}>No articles indexed yet.</p>
                    )}
                </div>
            </div>

            {/* Edit Issue Modal */}
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

            {/* Article Modal (Create/Edit) */}
             {isArticleModalOpen && (
                <div className={styles.modalOverlay} onClick={() => setIsArticleModalOpen(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <h2 className={styles.modalTitle}>{articleForm.id ? 'Edit Article' : 'New Article'}</h2>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Title</label>
                            <input
                                className={styles.input}
                                value={articleForm.title}
                                onChange={e => setArticleForm({ ...articleForm, title: e.target.value })}
                                placeholder="Article Title"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Content</label>
                            <textarea
                                className={styles.textarea}
                                value={articleForm.content}
                                onChange={e => setArticleForm({ ...articleForm, content: e.target.value })}
                                placeholder="Optional description or content"
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <div className={styles.formGroup} style={{ flex: 1 }}>
                                <label className={styles.label}>Start Page</label>
                                <input
                                    type="number"
                                    className={styles.input}
                                    value={articleForm.startPage}
                                    onChange={e => setArticleForm({ ...articleForm, startPage: parseInt(e.target.value) })}
                                />
                            </div>
                            <div className={styles.formGroup} style={{ flex: 1 }}>
                                <label className={styles.label}>End Page</label>
                                <input
                                    type="number"
                                    className={styles.input}
                                    value={articleForm.endPage || ''}
                                    onChange={e => setArticleForm({ ...articleForm, endPage: e.target.value ? parseInt(e.target.value) : null })}
                                    placeholder="Optional"
                                />
                            </div>
                        </div>

                        <div className={styles.modalActions}>
                            <button
                                className={styles.cancelButton}
                                onClick={() => setIsArticleModalOpen(false)}
                                disabled={savingArticle}
                            >
                                Cancel
                            </button>
                            <button
                                className={styles.saveButton}
                                onClick={handleSaveArticle}
                                disabled={savingArticle}
                            >
                                {savingArticle ? 'Saving...' : 'Save Article'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
