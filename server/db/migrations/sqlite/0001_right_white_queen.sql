ALTER TABLE `product_variants` ADD `is_active` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `product_variants` ADD `is_promo_active` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `product_variants` ADD `discount_amount` real;--> statement-breakpoint
ALTER TABLE `product_variants` ADD `promo_start_date` text;--> statement-breakpoint
ALTER TABLE `product_variants` ADD `promo_repeat_yearly` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `rules` text;