# Identity Reconciliation Service

A Node.js service that identifies and links customer contacts based on email addresses and phone numbers.`

## Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/Namishk/identityRecon.git
   cd identityRecon
   ```

2. **Install dependencies**

   ```bash
   yarn install
   # or
   npm install
   ```

3. **Set up environment variables**

   Update the `.env` file with your database credentials:

   ```env
   DATABASE_URL="postgresql://username:password@host:port/database"
   PORT=3000
   ```

4. **Run database migrations**

   ```bash
   yarn db:generate
   yarn db:migrate
   ```

5. **Start the development server**
   ```bash
   yarn dev
   ```

## Database Schema

The service uses a single `contact` table with the following structure:

```typescript
{
  id: number (Primary Key, Auto-increment)
  phoneNumber: string | null
  email: string | null
  linkedId: number | null (References another contact's ID)
  linkPrecedence: "primary" | "secondary"
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}
```

## API Endpoints

### POST /identify

Identifies and links contacts based on email and phone number.

**Request Body:**

```json
{
	"email": "user@example.com",
	"phoneNumber": "1234567890"
}
```

**Response:**

```json
{
	"contact": {
		"primaryContatctId": 1,
		"emails": ["user@example.com", "user2@example.com"],
		"phoneNumbers": ["1234567890", "0987654321"],
		"secondaryContactIds": [2, 3]
	}
}
```

**Example cURL:**

```bash
curl --location 'http://localhost:3000/identify' \
--header 'Content-Type: application/json' \
--data-raw '{
  "email": "user@example.com",
  "phoneNumber": "1234567890"
}'
```

**Environment Variables:**

- `DATABASE_URL`: PostgreSQL connection string
- `PORT`: Server port (automatically set by Render)

## Error Handling

The service includes comprehensive error handling:

- **Validation Errors**: Returns 400 for invalid input
- **Database Errors**: Returns 500 with error details
- **Connection Issues**: Graceful handling of database connectivity problems

## Technologies Used

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Development**: ts-node-dev for hot reload
