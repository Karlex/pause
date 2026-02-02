CREATE TABLE "employee_sensitive_data" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"phone" text,
	"personal_email" text,
	"address" text,
	"emergency_contact_name" text,
	"emergency_contact_phone" text,
	"emergency_contact_relationship" text,
	"contract_type" text,
	"work_hours" text,
	"salary" text,
	"bank_account_number" text,
	"bank_sort_code" text,
	"bank_account_name" text,
	"tax_code" text,
	"ni_number" text,
	"id_document_type" text,
	"id_document_number" text,
	"benefits" jsonb,
	"last_accessed_at" timestamp,
	"last_accessed_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "employee_sensitive_data_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "employee_sensitive_data" ADD CONSTRAINT "employee_sensitive_data_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_sensitive_data" ADD CONSTRAINT "employee_sensitive_data_last_accessed_by_users_id_fk" FOREIGN KEY ("last_accessed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;