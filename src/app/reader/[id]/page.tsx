'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import styles from './page.module.css';

export default function ReaderPage() {
    const params = useParams();
    // In Next 15 params is async in server components but hook unwrap it in Client Components in future maybe? 
    // Usually useParams() returns the params object directly in Client Components.

    const id = params?.id as string;

    const searchParams = useSearchParams();
    const startParam = searchParams.get('start');
    const endParam = searchParams.get('end');

    const [pageCount, setPageCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(startParam ? parseInt(startParam) : 0);
    const [title, setTitle] = useState('');

    // Limits
    const minPage = startParam ? parseInt(startParam) : 0;
    const maxPage = endParam ? parseInt(endParam) : null;

    useEffect(() => {
        if (!id) return;
        // Fetch issue details directly
        fetch(`/api/issues/${id}`)
            .then(res => res.json())
            .then((data) => {
                if (data && data.issue) {
                    setPageCount(data.issue.pageCount);
                    setTitle(data.magazine.series + ' - ' + (data.issue.title || data.issue.fileName));
                }
            });
    }, [id]);

    const handlePrev = () => {
        setCurrentPage(p => Math.max(minPage, p - 1));
    };

    const handleNext = () => {
        // If maxPage is set, use it. Otherwise use pageCount.
        const limit = maxPage !== null ? maxPage : (pageCount > 0 ? pageCount - 1 : 9999);
        if (currentPage >= limit) return;
        setCurrentPage(p => p + 1);
    };

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') handlePrev();
            if (e.key === 'ArrowRight') handleNext();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [pageCount, currentPage]);

    return (
        <div className={styles.reader}>
            <div className={styles.toolbar}>
                <Link href="/" className={styles.backBtn}><ArrowLeft size={20} /> Back</Link>
                <span className={styles.title}>{title}</span>
                <span className={styles.pageInfo}>Page {currentPage + 1} {pageCount > 0 ? `/ ${pageCount}` : ''}</span>
            </div>

            <div className={styles.viewer}>
                <div className={styles.imageContainer}>
                    {/* We use standard img for Reader to avoid complexity with Next Image optimization on dynamic huge blobs sometimes, but Next Image is fine too */}
                    {/* Using unoptimized to ensure original quality roughly or handling large buffers */}
                    <Image
                        src={`/api/image/${id}/${currentPage}`}
                        alt={`Page ${currentPage + 1}`}
                        fill
                        layout='fill'
                        objectFit='contain'
                        priority
                        className={styles.pageImage}
                        key={currentPage} // Force re-render on page change
                    />
                </div>

                <button className={`${styles.navBtn} ${styles.prev}`} onClick={handlePrev} disabled={currentPage <= minPage}>
                    <ChevronLeft size={48} />
                </button>

                <button className={`${styles.navBtn} ${styles.next}`} onClick={handleNext} disabled={(maxPage !== null && currentPage >= maxPage) || (pageCount > 0 && currentPage >= pageCount - 1)}>
                    <ChevronRight size={48} />
                </button>
            </div>
        </div>
    );
}
