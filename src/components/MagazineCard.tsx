import Link from 'next/link';
import Image from 'next/image';
import styles from './MagazineCard.module.css';

interface MagazineCardProps {
    id: number;
    series: string;
    issueCount: number;
    // We'd ideally fetch a cover from the latest issue or a dedicated cover
    // For now we'll placeholder or leave empty
}

export default function MagazineCard({ id, series, issueCount }: MagazineCardProps) {
    return (
        <div className={styles.card}>
            <div className={styles.imageWrapper}>
                {/* Placeholder for Magazine Cover - maybe fetch first issue? */}
                <div className={styles.placeholder}>
                    <span>{series[0]}</span>
                </div>
                <div className={styles.badge}>{issueCount}</div>
            </div>
            <div className={styles.content}>
                <h3 className={styles.title}>{series}</h3>
                <p className={styles.subtitle}>{issueCount} issues</p>
            </div>
        </div>
    );
}
