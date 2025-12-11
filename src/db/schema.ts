import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const magazines = sqliteTable('magazines', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    title: text('title').notNull(),
    path: text('path').notNull().unique(), // Folder path for the magazine series
    lastUpdated: integer('last_updated', { mode: 'timestamp' }).notNull().defaultNow(),
});

export const issues = sqliteTable('issues', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    magazineId: integer('magazine_id').references(() => magazines.id, { onDelete: 'cascade' }),
    title: text('title'), // Optional title
    volume: integer('volume'),
    issueNumber: text('issue_number'), // Text because sometimes issues are "Special Edition" etc.
    fileName: text('file_name').notNull(),
    filePath: text('file_path').notNull().unique(),
    pageCount: integer('page_count').notNull().default(0),
    addedAt: integer('added_at', { mode: 'timestamp' }).notNull().defaultNow(),
});

export const articles = sqliteTable('articles', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    issueId: integer('issue_id').references(() => issues.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    content: text('content'), // Optional text content
    startPage: integer('start_page').notNull(),
    endPage: integer('end_page'),
});
