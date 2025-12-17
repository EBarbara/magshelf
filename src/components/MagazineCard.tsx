import Link from 'next/link';
import Image from 'next/image';
import styles from './MagazineCard.module.css';

interface MagazineCardProps {
    id: number;
    series: string;
    issueCount: number;
    coverIssueId?: number;
}

export default function MagazineCard({ id, series, issueCount, coverIssueId }: MagazineCardProps) {
    return (
        <Link href={`/magazines/${id}`} className={styles.card}>
            <div className={styles.imageWrapper}>
                {coverIssueId ? (
                    <Image
                        src={`/api/image/${coverIssueId}/0`}
                        alt={series}
                        fill
                        className={styles.image} // Reusing issue card image style if possible or need new one
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        style={{ objectFit: 'cover' }}
                    />
                ) : (
                    /* Placeholder for Magazine Cover - maybe fetch first issue? */
                    <div className={styles.placeholder}>
                        <span>{series[0]}</span>
                    </div>
                )}
                <div className={styles.badge}>{issueCount}</div>
            </div>
            <div className={styles.content}>
                <h3 className={styles.title}>{series}</h3>
                <p className={styles.subtitle}>{issueCount} issues</p>
            </div>
        </Link>
    );
}
