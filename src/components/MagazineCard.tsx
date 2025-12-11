import Link from 'next/link';
import Image from 'next/image';
import styles from './MagazineCard.module.css';

interface MagazineCardProps {
    id: number;
    title: string;
    issueCount: number;
    // We'd ideally fetch a cover from the latest issue or a dedicated cover
    // For now we'll placeholder or leave empty
}

export default function MagazineCard({ id, title, issueCount }: MagazineCardProps) {
    return (
        <div className={styles.card}>
            <div className={styles.imageWrapper}>
                {/* Placeholder for Magazine Cover - maybe fetch first issue? */}
                <div className={styles.placeholder}>
                    <span>{title[0]}</span>
                </div>
                <div className={styles.badge}>{issueCount}</div>
            </div>
            <div className={styles.content}>
                <h3 className={styles.title}>{title}</h3>
                <p className={styles.subtitle}>{issueCount} issues</p>
            </div>
        </div>
    );
}
