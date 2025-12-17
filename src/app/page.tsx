'use client';

import { useEffect, useState } from 'react';
import IssueCard from '@/components/IssueCard';
import MagazineCard from '@/components/MagazineCard';
import styles from './page.module.css';
import { ChevronRight, ChevronLeft } from 'lucide-react';

interface Article {
  // Placeholder
}

interface Issue {
  id: number;
  title: string;
  volume?: number;
  issueNumber?: string;
  fileName: string;
  pageCount: number;
  magazineTitle: string;
}

interface Magazine {
  id: number;
  series: string;
  issueCount: number;
}

export default function Dashboard() {
  const [recentIssues, setRecentIssues] = useState<Issue[]>([]);
  const [magazines, setMagazines] = useState<Magazine[]>([]);

  useEffect(() => {
    fetch('/api/issues?limit=6')
      .then(res => res.json())
      .then(data => setRecentIssues(data));

    fetch('/api/magazines')
      .then(res => res.json())
      .then(data => setMagazines(data));
  }, []);

  return (
    <div className={styles.container}>
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Recently Added Issues</h2>
          <div className={styles.navIcons}>
            <button className={styles.iconBtn}><ChevronLeft size={16} /></button>
            <button className={styles.iconBtn}><ChevronRight size={16} /></button>
          </div>
        </div>

        <div className={styles.carousel}>
          {recentIssues.map(issue => (
            <div key={issue.id} className={styles.carouselItem}>
              <IssueCard
                id={issue.id}
                fileName={issue.fileName}
                issueNumber={issue.issueNumber}
                pageCount={issue.pageCount}
                magazineTitle={issue.magazineTitle}
              />
            </div>
          ))}
          {recentIssues.length === 0 && <p className={styles.empty}>No issues found. <span onClick={() => fetch('/api/scan')}>Scan Library</span></p>}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Recently Updated Magazines</h2>
          <div className={styles.navIcons}>
            <button className={styles.iconBtn}><ChevronLeft size={16} /></button>
            <button className={styles.iconBtn}><ChevronRight size={16} /></button>
          </div>
        </div>

        <div className={styles.grid}>
          {magazines.map(mag => (
            <MagazineCard
              key={mag.id}
              id={mag.id}
              series={mag.series}
              issueCount={mag.issueCount}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
