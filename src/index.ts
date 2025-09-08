import dotenv from 'dotenv';
import app from './app';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
dotenv.config();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});

async function main() {
	const client = postgres(process.env.DATABASE_URL!);
	const db = drizzle({ client });
}
main();
