import { Request, Response } from 'express';
import { db } from '../db/connection';
import { Contact } from '../db/schema';
import { and, eq, or, isNull, not, inArray } from 'drizzle-orm';

export const identifyUser = async (req: Request, res: Response) => {
	try {
		console.log(req.body, '\n<---------------------------------- request body');

		const email = req.body.email;
		const phoneNumber = req.body.phoneNumber;

		// Build dynamic where conditions to handle null values properly
		const whereConditions = [];
		if (email) {
			whereConditions.push(eq(Contact.email, email));
		}
		if (phoneNumber) {
			whereConditions.push(eq(Contact.phoneNumber, phoneNumber));
		}

		// If no valid conditions, return empty result
		if (whereConditions.length === 0) {
			return res.status(400).json({
				error: 'Bad request',
				message: 'Either email or phoneNumber must be provided'
			});
		}

		const fetchedRecords = await db
			.select()
			.from(Contact)
			.where(or(...whereConditions));

		console.log(fetchedRecords, '\n<---------------------------------- fetched records');

		if (fetchedRecords.length === 0) {
			await db.insert(Contact).values({
				phoneNumber: phoneNumber || null,
				email: email || null,
				linkPrecedence: 'primary'
			});
		} else {
			const primaryRecords = fetchedRecords.filter((record) => record.linkPrecedence === 'primary');

			let primaryRecordID: number;

			if (primaryRecords.length > 0) {
				primaryRecordID = primaryRecords.reduce((oldest, current) =>
					current.createdAt < oldest.createdAt ? current : oldest
				).id;
			} else {
				primaryRecordID = fetchedRecords[0].linkedId!;
			}
			const secondaryIds = fetchedRecords.filter((record) => record.id !== primaryRecordID).map((record) => record.id);

			let emailExists,
				phoneExists = false;
			// check if the new email and phone number already exists. and adding flags for or condition
			for (let record of fetchedRecords) {
				// squashing nulls together like a, b to a, null or null, b
				if (
					(email === null || record.email === email) &&
					(phoneNumber === null || record.phoneNumber === phoneNumber)
				) {
					const FinalRecords = await db
						.select()
						.from(Contact)
						.where(or(eq(Contact.id, primaryRecordID), eq(Contact.linkedId, primaryRecordID)));
					console.log(FinalRecords, '\n<---------------------------------- FinalRecords');

					return res.status(200).json({
						contact: {
							primaryContatctId: primaryRecordID,
							emails: [...new Set(FinalRecords.map((record) => record.email))],
							phoneNumbers: [...new Set(FinalRecords.map((record) => record.phoneNumber))],
							secondaryContactIds: FinalRecords.filter((record) => record.id !== primaryRecordID).map(
								(record) => record.id
							)
						}
					});
				}
				if (record.email === email) emailExists = true;
				if (record.phoneNumber === phoneNumber) phoneExists = true;
			}

			if (secondaryIds.length > 0) {
				await db
					.update(Contact)
					.set({ linkPrecedence: 'secondary', linkedId: primaryRecordID, updatedAt: new Date() })
					.where(inArray(Contact.id, secondaryIds));
			}
			if (!emailExists || !phoneExists) {
				await db.insert(Contact).values({
					phoneNumber: phoneNumber || null,
					email: email || null,
					linkPrecedence: 'secondary',
					linkedId: primaryRecordID
				});
			} else {
				return res.status(200).json({
					contact: {
						primaryContatctId: primaryRecordID,
						emails: [...new Set(fetchedRecords.map((record) => record.email))],
						phoneNumbers: [...new Set(fetchedRecords.map((record) => record.phoneNumber))],
						secondaryContactIds: secondaryIds
					}
				});
			}
		}

		// Build conditions for final query
		const finalWhereConditions = [];
		if (email) {
			finalWhereConditions.push(eq(Contact.email, email));
		}
		if (phoneNumber) {
			finalWhereConditions.push(eq(Contact.phoneNumber, phoneNumber));
		}

		const FinalRecords = await db
			.select()
			.from(Contact)
			.where(or(...finalWhereConditions));

		console.log(FinalRecords, '\n<---------------------------------- FinalRecords');

		let primaryRecordID = FinalRecords[0].linkPrecedence === 'primary' ? FinalRecords[0].id : FinalRecords[0].linkedId!;
		const secondaryIds = FinalRecords.filter((record) => record.id !== primaryRecordID).map((record) => record.id);

		res.status(200).json({
			contact: {
				primaryContatctId: primaryRecordID,
				emails: [...new Set(FinalRecords.map((record) => record.email))],
				phoneNumbers: [...new Set(FinalRecords.map((record) => record.phoneNumber))],
				secondaryContactIds: secondaryIds
			}
		});
	} catch (error) {
		console.error('Database error:', error);
		res.status(500).json({
			error: 'Internal server error',
			message: error instanceof Error ? error.message : 'Unknown error'
		});
	}
};

export default { identifyUser };
