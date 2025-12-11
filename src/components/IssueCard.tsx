import Link from 'next/link';
import Image from 'next/image';
import styles from './IssueCard.module.css';

interface IssueCardProps {
    id: number;
    fileName: string;
    issueNumber?: string;
    pageCount: number;
    magazineTitle: string;
}

export default function IssueCard({ id, fileName, issueNumber, pageCount, magazineTitle }: IssueCardProps) {
    // Generate cover image URL
    // We assume page 0 is cover
    const coverUrl = `/api/image/${id}/0`;

    // Display Logic: Try to parse title better if needed, or just use what we have
    const displayText = issueNumber ? `Issue ${issueNumber}` : fileName;

    return (
        <Link href={`/reader/${id}`} className={styles.card}>
            <div className={styles.imageWrapper}>
                <Image
                    src={coverUrl}
                    alt={displayText}
                    fill
                    className={styles.image}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    style={{ objectFit: 'cover' }}
                />
                {issueNumber && <div className={styles.badge}>{issueNumber}</div>}
            </div>
            <div className={styles.content}>
                <h3 className={styles.title}>{magazineTitle}</h3>
                <p className={styles.subtitle}>{displayText}</p>
                <p className={styles.meta}>{pageCount} pages</p>
            </div>
        </Link>
    );
}
