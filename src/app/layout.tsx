import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import styles from './layout.module.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MagShelf',
  description: 'Your personal magazine collection manager',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className={styles.layout}>
          <Sidebar />
          <div className={styles.main}>
            <Topbar />
            <div className={styles.content}>
              {children}
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
