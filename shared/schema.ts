import { pgTable, text, serial, timestamp, numeric, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const staff = pgTable("staff", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  pin: text("pin").notNull(),
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
  service: text("service").notNull(),
  weight: numeric("weight", { precision: 10, scale: 2 }).notNull(),
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull(),
  action: text("action").notNull(), // created | status_changed | deleted | restored | permanently_deleted | paid | unpaid | discount_applied | discount_removed | edited
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
  createdAt: timestamp("created_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true });

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type CreateOrderRequest = InsertOrder;
export type UpdateOrderRequest = Partial<InsertOrder>;

export type OrderResponse = Order;
