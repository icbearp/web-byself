ALTER TABLE `feedback` ADD `note` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `feedback` ADD `updated_at` text;--> statement-breakpoint
ALTER TABLE `users` ADD `disabled` integer DEFAULT 0 NOT NULL;