import { pgTable, text, serial, timestamp, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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
  action: text("action").notNull(), // created | status_changed | deleted | restored | permanently_deleted
  notes: text("notes"),
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
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true });

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type CreateOrderRequest = InsertOrder;
export type UpdateOrderRequest = Partial<InsertOrder>;

export type OrderResponse = Order;
