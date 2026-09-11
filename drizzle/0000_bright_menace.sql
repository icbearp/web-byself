CREATE TABLE `feedback` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text DEFAULT 'suggestion' NOT NULL,
	`message` text NOT NULL,
	`contact` text DEFAULT '' NOT NULL,
	`page` text DEFAULT 'home' NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`user_id` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
