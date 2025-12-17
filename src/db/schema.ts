import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const magazines = sqliteTable('magazines', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    series: text('series').notNull(),
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
    cover: text('cover'), // Custom cover image path
    addedAt: integer('added_at', { mode: 'timestamp' }).notNull().defaultNow(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }),
});

export const articles = sqliteTable('articles', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    issueId: integer('issue_id').references(() => issues.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    content: text('content'), // Optional text content
    startPage: integer('start_page').notNull(),
    endPage: integer('end_page'),
});

export const readingProgress = sqliteTable('reading_progress', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    issueId: integer('issue_id').references(() => issues.id, { onDelete: 'cascade' }),
    currentPage: integer('current_page').notNull().default(0),
    isFinished: integer('is_finished', { mode: 'boolean' }).notNull().default(false),
    lastRead: integer('last_read', { mode: 'timestamp' }).notNull().defaultNow(),
});

export const settings = sqliteTable('settings', {
    key: text('key').primaryKey(),
    value: text('value').notNull(),
});
