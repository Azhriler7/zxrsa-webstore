import { sql, relations } from 'drizzle-orm'
import { integer, text, sqliteTable, real } from 'drizzle-orm/sqlite-core'

export type DayOfWeek =
  | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday'
  | 'Friday' | 'Saturday' | 'Sunday'

export type TransactionStatus = 'pending' | 'settlement' | 'deny' | 'expire' | 'cancel'

export const products = sqliteTable('products', {
  id:          text('id').primaryKey(),
  name:        text('name').notNull(),
  description: text('description'),
  image:       text('image'),
  promoBadge:  text('promo_badge'),
  rules:       text('rules'),
  isActive:    integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt:   text('created_at').notNull().default(sql`(datetime('now'))`),
})

export const productVariants = sqliteTable('product_variants', {
  id:                text('id').primaryKey(),
  productId:         text('product_id').notNull()
                       .references(() => products.id, { onDelete: 'cascade' }),
  duration:          text('duration').notNull(),
  price:             real('price').notNull(),
  isActive:          integer('is_active', { mode: 'boolean' }).notNull().default(true),
  isPromoActive:     integer('is_promo_active', { mode: 'boolean' }).notNull().default(false),
  discountAmount:    real('discount_amount'),
  promoPrice:        real('promo_price'),
  promoStartDate:    text('promo_start_date'),
  promoDayOfWeek:    text('promo_day_of_week'),
  promoSpecificDate: text('promo_specific_date'),
  promoRepeatYearly: integer('promo_repeat_yearly', { mode: 'boolean' }).notNull().default(false),
  isCustomGmail:     integer('is_custom_gmail', { mode: 'boolean' }).notNull().default(false),
  createdAt:         text('created_at').notNull().default(sql`(datetime('now'))`),
})

export const accountStocks = sqliteTable('account_stocks', {
  id:          integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  variantId:   text('variant_id').notNull()
                 .references(() => productVariants.id, { onDelete: 'cascade' }),
  accountData: text('account_data').notNull(),
  isSold:      integer('is_sold', { mode: 'boolean' }).notNull().default(false),
  soldAt:      text('sold_at'),
  createdAt:   text('created_at').notNull().default(sql`(datetime('now'))`),
})

export const transactions = sqliteTable('transactions', {
  id:                   text('id').primaryKey(),
  customerEmail:        text('customer_email').notNull(),
  customGmailAccount:   text('custom_gmail_account'),
  variantId:            text('variant_id').notNull()
                          .references(() => productVariants.id),
  amount:               real('amount').notNull(),
  status:               text('status').notNull().default('pending'),
  mutasikuPaymentId:    text('mutasiku_payment_id'),
  qrisImageUrl:         text('qris_image_url'),
  deliveredAccountData: text('delivered_account_data'),
  createdAt:            text('created_at').notNull().default(sql`(datetime('now'))`),
})

export const users = sqliteTable('users', {
  id:        text('id').primaryKey(),
  email:     text('email').notNull().unique(),
  password:  text('password').notNull(),
  role:      text('role').notNull().default('admin'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
})

export const productsRelations = relations(products, ({ many }) => ({
  variants: many(productVariants),
}))

export const productVariantsRelations = relations(productVariants, ({ one, many }) => ({
  product:      one(products, { fields: [productVariants.productId], references: [products.id] }),
  stocks:       many(accountStocks),
  transactions: many(transactions),
}))

export const accountStocksRelations = relations(accountStocks, ({ one }) => ({
  variant: one(productVariants, { fields: [accountStocks.variantId], references: [productVariants.id] }),
}))

export const transactionsRelations = relations(transactions, ({ one }) => ({
  variant: one(productVariants, { fields: [transactions.variantId], references: [productVariants.id] }),
}))