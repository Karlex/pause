ALTER TABLE "leave_balances" DROP CONSTRAINT "leave_balances_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "leave_balances" DROP CONSTRAINT "leave_balances_leave_type_id_leave_types_id_fk";
--> statement-breakpoint
ALTER TABLE "leave_requests" DROP CONSTRAINT "leave_requests_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "leave_requests" DROP CONSTRAINT "leave_requests_leave_type_id_leave_types_id_fk";
--> statement-breakpoint
ALTER TABLE "leave_requests" DROP CONSTRAINT "leave_requests_reviewer_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_manager_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "leave_balances" ADD CONSTRAINT "leave_balances_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_balances" ADD CONSTRAINT "leave_balances_leave_type_id_leave_types_id_fk" FOREIGN KEY ("leave_type_id") REFERENCES "public"."leave_types"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_leave_type_id_leave_types_id_fk" FOREIGN KEY ("leave_type_id") REFERENCES "public"."leave_types"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" DROP COLUMN "ip_address";--> statement-breakpoint
ALTER TABLE "sessions" DROP COLUMN "user_agent";