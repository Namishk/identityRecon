CREATE TABLE "contact" (
	"id" serial PRIMARY KEY NOT NULL,
	"phoneNumber" varchar(15),
	"email" varchar(255),
	"linkedId" integer,
	"linkPrecedence" varchar(10) NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"deletedAt" timestamp
);
