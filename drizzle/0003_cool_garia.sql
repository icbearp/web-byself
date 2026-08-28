CREATE TABLE `comments` (
	`id` text PRIMARY KEY NOT NULL,
	`content_type` text NOT NULL,
	`content_id` text NOT NULL,
	`content_title` text NOT NULL,
	`category` text DEFAULT 'question' NOT NULL,
	`message` text NOT NULL,
	`author_name` text DEFAULT '匿名读者' NOT NULL,
	`anchor_text` text DEFAULT '' NOT NULL,
	`anchor_block` text DEFAULT '' NOT NULL,
	`parent_id` text,
	`user_id` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_comments_content_status_created` ON `comments` (`content_type`,`content_id`,`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_comments_parent_id` ON `comments` (`parent_id`);
--> statement-breakpoint
PRAGMA optimize;
