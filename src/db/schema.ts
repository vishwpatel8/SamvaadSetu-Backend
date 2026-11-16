import { sql } from "drizzle-orm";
import {
  boolean,
  integer,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    // Basic Information
    email: varchar("email", { length: 100 }).unique().notNull(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    userName: varchar("user_name", { length: 30 }).unique().notNull(),
    displayName: varchar("display_name", { length: 50 }).notNull(),
    about: varchar("about", { length: 180 }),
    avatarKey: varchar("avatar_key", { length: 512 }).default(""),

    // Email Verification
    isEmailVerified: boolean("is_email_verified").default(false).notNull(),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    emailVerificationToken: varchar("email_verification_token", {
      length: 255,
    }),
    emailVerificationExpires: timestamp("email_verification_expires", {
      withTimezone: true,
    }),

    // Password Reset
    passwordResetToken: varchar("password_reset_token", { length: 255 }),
    passwordResetExpires: timestamp("password_reset_expires", {
      withTimezone: true,
    }),

    // Two-Factor Authentication
    twoFactorEnabled: boolean("two_factor_enabled").default(false).notNull(),
    twoFactorCode: varchar("two_factor_code", { length: 255 }),
    twoFactorCodeExpires: timestamp("two_factor_code_expires", {
      withTimezone: true,
    }),
    twoFactorAttempts: integer("two_factor_attempts").default(0).notNull(),

    // Session Management
    refreshToken: varchar("refresh_token", { length: 512 }),

    // Login Security
    loginAttempts: integer("login_attempts").default(0).notNull(),
    lockUntil: timestamp("lock_until", { withTimezone: true }),

    // Account Activity
    lastLogin: timestamp("last_login", { withTimezone: true }),
    lastPasswordChangedAt: timestamp("last_password_changed_at", {
      withTimezone: true,
    }),

    isActive: boolean("is_active").default(true).notNull(),

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),

    // Soft-delete marker. Clear/anonymize personal data in your deletion flow.
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("users_email_lower_unique").on(sql`lower(${table.email})`),
    uniqueIndex("users_username_lower_unique").on(
      sql`lower(${table.userName})`,
    ),
  ],
);
