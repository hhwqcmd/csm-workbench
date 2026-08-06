CREATE TABLE `material_assets` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`object_key` text NOT NULL,
	`name` text NOT NULL,
	`content_type` text NOT NULL,
	`size` integer NOT NULL,
	`created_at` text NOT NULL,
	`source` text NOT NULL,
	`source_ref` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_material_assets_object_key` ON `material_assets` (`object_key`);--> statement-breakpoint
CREATE INDEX `idx_material_assets_created_at` ON `material_assets` (`created_at`);