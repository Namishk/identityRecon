import { integer, varchar, serial, pgTable, timestamp } from 'drizzle-orm/pg-core';

export const Contact = pgTable('contact', {
	id: serial('id').primaryKey(),
	phoneNumber: varchar('phoneNumber', { length: 15 }),
	email: varchar('email', { length: 255 }),
	linkedId: integer('linkedId'),
	linkPrecedence: varchar('linkPrecedence', { length: 10 }).notNull().$type<'primary' | 'secondary'>(),
	createdAt: timestamp('createdAt').notNull().defaultNow(),
	updatedAt: timestamp('updatedAt').notNull().defaultNow(),
	deletedAt: timestamp('deletedAt')
});
