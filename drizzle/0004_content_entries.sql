CREATE TABLE `changelog` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`title` text NOT NULL,
	`detail` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `entries` (
	`type` text NOT NULL,
	`id` text NOT NULL,
	`title` text NOT NULL,
	`summary` text DEFAULT '' NOT NULL,
	`category` text DEFAULT '' NOT NULL,
	`stage` text,
	`tags` text DEFAULT '[]' NOT NULL,
	`content` text DEFAULT '' NOT NULL,
	`takeaway` text DEFAULT '' NOT NULL,
	`sources` text DEFAULT '[]' NOT NULL,
	`date` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`published_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`type`, `id`)
);
--> statement-breakpoint
CREATE INDEX `idx_entries_type_status_date` ON `entries` (`type`,`status`,`date`);