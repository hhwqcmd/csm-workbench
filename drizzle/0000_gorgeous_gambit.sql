CREATE TABLE `seedream_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`resume_token_hash` text NOT NULL,
	`status` text NOT NULL,
	`response_json` text,
	`error` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_seedream_jobs_expires_at` ON `seedream_jobs` (`expires_at`);