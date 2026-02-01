-- fan_letters: 답장 여부 컬럼 추가 (미답장 조회 필터 및 응답용)
ALTER TABLE `fan_letters` ADD COLUMN `is_replied` integer DEFAULT false;
--> statement-breakpoint
ALTER TABLE `fan_letters` ADD COLUMN `replied_at` text;
--> statement-breakpoint
CREATE INDEX `idx_is_replied` ON `fan_letters` (`is_replied`);
