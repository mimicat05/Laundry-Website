import { pgTable, text, serial, timestamp, numeric, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  contactNumber: text("contact_number").notNull(),
  address: text("address").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCustomerSchema = createInsertSchema(customers).omit({ id: true, createdAt: true });
export type Customer = typeof customers.$inferSelect;
export type PublicCustomer = Omit<Customer, "password">;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;

export const staff = pgTable("staff", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  pin: text("pin").notNull().unique(),
  role: text("role").notNull().default("staff"), // "owner" | "staff"
  active: boolean("active").notNull().default(true),
});

export const insertStaffSchema = createInsertSchema(staff).omit({ id: true });
export type Staff = typeof staff.$inferSelect;
export type InsertStaff = z.infer<typeof insertStaffSchema>;

export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  pricePerKg: numeric("price_per_kg", { precision: 10, scale: 2 }).notNull(),
  active: boolean("active").notNull().default(true),
});

export const insertServiceSchema = createInsertSchema(services).omit({ id: true });
export type Service = typeof services.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;

export const promos = pgTable("promos", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  discount: numeric("discount", { precision: 5, scale: 2 }).notNull(),
  active: boolean("active").notNull().default(true),
});

export const insertPromoSchema = createInsertSchema(promos).omit({ id: true });
export type Promo = typeof promos.$inferSelect;
export type InsertPromo = z.infer<typeof insertPromoSchema>;

export const orderLogs = pgTable("order_logs", {
  id: serial("id").primaryKey(),
  orderId: text("order_id").notNull(),
  customerName: text("customer_name").notNull(),
  contactNumber: text("contact_number").notNull(),
  email: text("email").notNull(),
  address: text("address"),
  service: text("service").notNull(),
  weight: numeric("weight", { precision: 10, scale: 2 }).notNull(),
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),
  paid: boolean("paid").notNull().default(false),
  status: text("status").notNull(),
  action: text("action").notNull(), // created | status_changed | deleted | restored | permanently_deleted | paid | unpaid | discount_applied | discount_removed | edited | cancelled
  notes: text("notes"),
  staffName: text("staff_name"),
  loggedAt: timestamp("logged_at").defaultNow().notNull(),
});

export type OrderLog = typeof orderLogs.$inferSelect;

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderId: text("order_id").notNull(), // e.g., ORD001
  customerName: text("customer_name").notNull(),
  address: text("address").notNull(),
  contactNumber: text("contact_number").notNull(),
  email: text("email").notNull(),
  service: text("service").notNull(), // Wash & Hang, Dry Cleaning
  weight: numeric("weight", { precision: 10, scale: 2 }).notNull(),
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"), // pending, washed, ready_for_pickup, completed
  paid: boolean("paid").notNull().default(false),
  notes: text("notes"),
  promoId: integer("promo_id"),
  promoName: text("promo_name"),
  discountAmount: numeric("discount_amount", { precision: 10, scale: 2 }),
  actualWeight: numeric("actual_weight", { precision: 10, scale: 2 }),
  promoClaimName: text("promo_claim_name"),
  promoPhoto: text("promo_photo"),
  promoClaimStatus: text("promo_claim_status"), // "pending" | "approved" | "rejected"
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  deletedAt: timestamp("deleted_at"),
});

export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true });

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type CreateOrderRequest = InsertOrder;
export type UpdateOrderRequest = Partial<InsertOrder>;

export type OrderResponse = Order;

export const shopSettings = pgTable("shop_settings", {
  id: serial("id").primaryKey(),
  phone: text("phone").notNull().default(""),
  email: text("email").notNull().default(""),
  address: text("address").notNull().default(""),
  hours: text("hours").notNull().default(""),
});

export const insertShopSettingsSchema = createInsertSchema(shopSettings).omit({ id: true });
export type ShopSettings = typeof shopSettings.$inferSelect;
export type InsertShopSettings = z.infer<typeof insertShopSettingsSchema>;

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  token: text("token").notNull().unique(),
  customerId: integer("customer_id").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;

export const feedback = pgTable("feedback", {
  id: serial("id").primaryKey(),
  orderId: text("order_id").notNull(),
  customerId: integer("customer_id").notNull(),
  customerName: text("customer_name").notNull(),
  rating: integer("rating").notNull(), // 1–5
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertFeedbackSchema = createInsertSchema(feedback).omit({ id: true, createdAt: true });
export type Feedback = typeof feedback.$inferSelect;
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull(),
  customerName: text("customer_name").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true });
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
