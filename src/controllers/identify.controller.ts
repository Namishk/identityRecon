import { Request, Response } from 'express';

export const identifyUser = (req: Request, res: Response) => {
	console.log(req.body);

	const email = req.body.email;
	const phoneNumber = req.body.phoneNumber;

	res.json({
		message: `Identified user with email: ${email} and phone number: ${phoneNumber}`
	});
};

export default { identifyUser };
