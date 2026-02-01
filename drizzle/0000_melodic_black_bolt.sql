CREATE TABLE `fan_letters` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email_id` text,
	`subject` text,
	`sender_name` text NOT NULL,
	`sender_email` text NOT NULL,
	`content` text NOT NULL,
	`language` text,
	`country` text,
	`sentiment` text,
	`sentiment_score` real,
	`topics` text,
	`is_read` integer DEFAULT false,
	`is_starred` integer DEFAULT false,
	`received_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE UNIQUE INDEX `fan_letters_email_id_unique` ON `fan_letters` (`email_id`);--> statement-breakpoint
CREATE INDEX `idx_sender_email` ON `fan_letters` (`sender_email`);--> statement-breakpoint
CREATE INDEX `idx_language` ON `fan_letters` (`language`);--> statement-breakpoint
CREATE INDEX `idx_country` ON `fan_letters` (`country`);--> statement-breakpoint
CREATE INDEX `idx_sentiment` ON `fan_letters` (`sentiment`);--> statement-breakpoint
CREATE INDEX `idx_is_read` ON `fan_letters` (`is_read`);--> statement-breakpoint
CREATE INDEX `idx_received_at` ON `fan_letters` (`received_at`);--> statement-breakpoint
CREATE TABLE `replies` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`letter_id` integer NOT NULL,
	`content` text NOT NULL,
	`email_sent` integer DEFAULT false,
	`email_sent_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`letter_id`) REFERENCES `fan_letters`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_reply_letter_id` ON `replies` (`letter_id`);