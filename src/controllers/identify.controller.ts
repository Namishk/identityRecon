import { Request, Response } from 'express';
import { db } from '../db/connection';
import { Contact } from '../db/schema';
import { and, eq, or, isNull } from 'drizzle-orm';

export const identifyUser = async (req: Request, res: Response) => {
	try {
		console.log(req.body);

		const email = req.body.email;
		const phoneNumber = req.body.phoneNumber;

		const fetchedRecords = await db
			.select()
			.from(Contact)
			.where(
				and(or(eq(Contact.email, email), eq(Contact.phoneNumber, phoneNumber)), eq(Contact.linkPrecedence, 'primary'))
			);
		console.log(fetchedRecords);
		if (fetchedRecords.length === 0) {
			await db.insert(Contact).values({
				phoneNumber: phoneNumber || null,
				email: email || null,
				linkPrecedence: 'primary'
			});
		}
		if (fetchedRecords.length == 1) {
			await insertToDB(fetchedRecords[0], email, phoneNumber, 'secondary');
		}
		if (fetchedRecords.length > 1) {
			const primaryRecord = fetchedRecords[0];
			for (let i = 1; i < fetchedRecords.length; i++) {
				await db
					.update(Contact)
					.set({ linkPrecedence: 'secondary', linkedId: primaryRecord.id })
					.where(eq(Contact.id, fetchedRecords[i].id));
			}
			await insertToDB(primaryRecord, email, phoneNumber, 'secondary');
		}

		const FinalRecords = await db
			.select()
			.from(Contact)
			.where(or(eq(Contact.email, email), eq(Contact.phoneNumber, phoneNumber)));

		console.log(FinalRecords);
		res.status(200).json({
			searched: { email, phoneNumber }
		});
	} catch (error) {
		console.error('Database error:', error);
		res.status(500).json({
			error: 'Internal server error',
			message: error instanceof Error ? error.message : 'Unknown error'
		});
	}
};
type RecordType = {
	id: number;
	phoneNumber: string | null;
	email: string | null;
	linkedId: number | null;
	linkPrecedence: 'secondary' | 'primary';
	createdAt: Date;
	updatedAt: Date;
	deletedAt: Date | null;
};
const insertToDB = async (
	record: RecordType,
	email: string | null,
	phoneNumber: string | null,
	linkPrecedence: 'secondary' | 'primary'
) => {
	if (linkPrecedence === 'secondary') {
		if ((record.email !== email && email) || (record.phoneNumber !== phoneNumber && phoneNumber)) {
			const whereConditions = [];
			if (email) {
				whereConditions.push(eq(Contact.email, email));
			} else {
				whereConditions.push(isNull(Contact.email));
			}
			if (phoneNumber) {
				whereConditions.push(eq(Contact.phoneNumber, phoneNumber));
			} else {
				whereConditions.push(isNull(Contact.phoneNumber));
			}

			const existingRecord = await db
				.select()
				.from(Contact)
				.where(and(...whereConditions));

			if (existingRecord.length === 0) {
				await db.insert(Contact).values({
					phoneNumber: phoneNumber || null,
					email: email || null,
					linkPrecedence: linkPrecedence,
					linkedId: record.id
				});
			}
		}
	} else {
		// not useing the explicit check because if adding primary then it must be a new entry. also this condition is already explicitly tested before calling api
		await db.insert(Contact).values({
			phoneNumber: phoneNumber || null,
			email: email || null,
			linkPrecedence: linkPrecedence
		});
	}
};

export default { identifyUser };
