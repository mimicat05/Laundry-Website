import { db } from "./db";
import {
  orders,
  orderLogs,
  services,
  promos,
  staff,
  customers,
  passwordResetTokens,
  shopSettings,
  feedback,
  messages,
  type InsertOrder,
  type Order,
  type OrderLog,
  type Service,
  type InsertService,
  type Promo,
  type InsertPromo,
  type Staff,
  type InsertStaff,
  type Customer,
  type InsertCustomer,
  type UpdateOrderRequest,
  type PasswordResetToken,
  type ShopSettings,
  type InsertShopSettings,
  type Feedback,
  type InsertFeedback,
  type Message,
  type InsertMessage,
} from "@shared/schema";
import { eq, isNull, isNotNull, desc, lt } from "drizzle-orm";

export interface IStorage {
  getOrders(): Promise<Order[]>;
  getAllOrders(): Promise<Order[]>;
  getDeletedOrders(): Promise<Order[]>;
  getOrder(id: number): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: number, updates: UpdateOrderRequest): Promise<Order>;
  deleteOrder(id: number, staffName?: string): Promise<void>;
  restoreOrder(id: number, staffName?: string): Promise<Order>;
  permanentDeleteOrder(id: number, staffName?: string): Promise<void>;
  getOrderLogs(): Promise<OrderLog[]>;
  logOrderAction(order: Order, action: string, staffName?: string): Promise<void>;
  // Services
  getServices(): Promise<Service[]>;
  createService(data: InsertService): Promise<Service>;
  updateService(id: number, data: Partial<InsertService>): Promise<Service>;
  deleteService(id: number): Promise<void>;
  // Promos
  getPromos(): Promise<Promo[]>;
  createPromo(data: InsertPromo): Promise<Promo>;
  updatePromo(id: number, data: Partial<InsertPromo>): Promise<Promo>;
  deletePromo(id: number): Promise<void>;
  // Staff
  getStaffList(): Promise<Staff[]>;
  getStaffByPin(pin: string): Promise<Staff | undefined>;
  createStaff(data: InsertStaff): Promise<Staff>;
  updateStaff(id: number, data: Partial<InsertStaff>): Promise<Staff>;
  deleteStaff(id: number): Promise<void>;
  // Customers
  getCustomerById(id: number): Promise<Customer | undefined>;
  getCustomerByEmail(email: string): Promise<Customer | undefined>;
  createCustomer(data: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, data: Partial<InsertCustomer>): Promise<Customer>;
  getOrdersByEmail(email: string): Promise<Order[]>;
  // Password reset tokens
  createResetToken(customerId: number, token: string, expiresAt: Date): Promise<PasswordResetToken>;
  getResetToken(token: string): Promise<PasswordResetToken | undefined>;
  deleteResetToken(token: string): Promise<void>;
  deleteExpiredTokens(): Promise<void>;
  // Shop settings
  getShopSettings(): Promise<ShopSettings>;
  updateShopSettings(data: Partial<InsertShopSettings>): Promise<ShopSettings>;
  // Feedback
  getFeedback(): Promise<Feedback[]>;
  getFeedbackByOrderId(orderId: string): Promise<Feedback | undefined>;
  createFeedback(data: InsertFeedback): Promise<Feedback>;
  // Messages
  getMessages(): Promise<Message[]>;
  getMessagesByCustomerId(customerId: number): Promise<Message[]>;
  getUnreadMessageCount(): Promise<number>;
  createMessage(data: InsertMessage): Promise<Message>;
  markMessageRead(id: number): Promise<void>;
  markAllMessagesRead(): Promise<void>;
  replyToMessage(id: number, staffReply: string, repliedByName: string): Promise<Message>;
}

async function logOrder(order: Order, action: string, staffName?: string) {
  await db.insert(orderLogs).values({
    orderId: order.orderId,
    customerName: order.customerName,
    contactNumber: order.contactNumber,
    email: order.email,
    address: order.address ?? null,
    service: order.service,
    weight: order.weight,
    total: order.total,
    paid: order.paid,
    status: order.status,
    action,
    notes: order.notes ?? null,
    staffName: staffName ?? null,
  });
}

export class DatabaseStorage implements IStorage {
  async getOrders(): Promise<Order[]> {
    return await db.select().from(orders)
      .where(isNull(orders.deletedAt))
      .orderBy(orders.id);
  }

  async getAllOrders(): Promise<Order[]> {
    return await db.select().from(orders).orderBy(orders.id);
  }

  async getDeletedOrders(): Promise<Order[]> {
    return await db.select().from(orders)
      .where(isNotNull(orders.deletedAt))
      .orderBy(orders.deletedAt);
  }

  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const [order] = await db.insert(orders).values(insertOrder).returning();
    return order;
  }

  async updateOrder(id: number, updates: UpdateOrderRequest): Promise<Order> {
    const [updated] = await db.update(orders)
      .set(updates)
      .where(eq(orders.id, id))
      .returning();
    return updated;
  }

  async logOrderAction(order: Order, action: string, staffName?: string): Promise<void> {
    await logOrder(order, action, staffName);
  }

  async deleteOrder(id: number, staffName?: string): Promise<void> {
    const order = await this.getOrder(id);
    await db.update(orders)
      .set({ deletedAt: new Date() })
      .where(eq(orders.id, id));
    if (order) await logOrder(order, "deleted", staffName);
  }

  async restoreOrder(id: number, staffName?: string): Promise<Order> {
    const [restored] = await db.update(orders)
      .set({ deletedAt: null })
      .where(eq(orders.id, id))
      .returning();
    await logOrder(restored, "restored", staffName);
    return restored;
  }

  async permanentDeleteOrder(id: number, staffName?: string): Promise<void> {
    const order = await this.getOrder(id);
    if (order) await logOrder(order, "permanently_deleted", staffName);
    await db.delete(orders).where(eq(orders.id, id));
  }

  async getOrderLogs(): Promise<OrderLog[]> {
    return await db.select().from(orderLogs).orderBy(desc(orderLogs.loggedAt));
  }

  async getServices(): Promise<Service[]> {
    return await db.select().from(services).orderBy(services.id);
  }

  async createService(data: InsertService): Promise<Service> {
    const [svc] = await db.insert(services).values(data).returning();
    return svc;
  }

  async updateService(id: number, data: Partial<InsertService>): Promise<Service> {
    const [svc] = await db.update(services).set(data).where(eq(services.id, id)).returning();
    return svc;
  }

  async deleteService(id: number): Promise<void> {
    await db.delete(services).where(eq(services.id, id));
  }

  async getPromos(): Promise<Promo[]> {
    return await db.select().from(promos).orderBy(promos.id);
  }

  async createPromo(data: InsertPromo): Promise<Promo> {
    const [promo] = await db.insert(promos).values(data).returning();
    return promo;
  }

  async updatePromo(id: number, data: Partial<InsertPromo>): Promise<Promo> {
    const [promo] = await db.update(promos).set(data).where(eq(promos.id, id)).returning();
    return promo;
  }

  async deletePromo(id: number): Promise<void> {
    await db.delete(promos).where(eq(promos.id, id));
  }

  async getStaffList(): Promise<Staff[]> {
    return await db.select().from(staff).orderBy(staff.id);
  }

  async getStaffByPin(pin: string): Promise<Staff | undefined> {
    const [member] = await db.select().from(staff).where(eq(staff.pin, pin));
    return member;
  }

  async createStaff(data: InsertStaff): Promise<Staff> {
    const [member] = await db.insert(staff).values(data).returning();
    return member;
  }

  async updateStaff(id: number, data: Partial<InsertStaff>): Promise<Staff> {
    const [member] = await db.update(staff).set(data).where(eq(staff.id, id)).returning();
    return member;
  }

  async deleteStaff(id: number): Promise<void> {
    await db.delete(staff).where(eq(staff.id, id));
  }

  async getCustomerById(id: number): Promise<Customer | undefined> {
    const [c] = await db.select().from(customers).where(eq(customers.id, id));
    return c;
  }

  async getCustomerByEmail(email: string): Promise<Customer | undefined> {
    const [c] = await db.select().from(customers).where(eq(customers.email, email));
    return c;
  }

  async createCustomer(data: InsertCustomer): Promise<Customer> {
    const [c] = await db.insert(customers).values(data).returning();
    return c;
  }

  async updateCustomer(id: number, data: Partial<InsertCustomer>): Promise<Customer> {
    const [c] = await db.update(customers).set(data).where(eq(customers.id, id)).returning();
    return c;
  }

  async getOrdersByEmail(email: string): Promise<Order[]> {
    return await db.select().from(orders)
      .where(eq(orders.email, email))
      .orderBy(desc(orders.id));
  }

  async createResetToken(customerId: number, token: string, expiresAt: Date): Promise<PasswordResetToken> {
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.customerId, customerId));
    const [t] = await db.insert(passwordResetTokens).values({ customerId, token, expiresAt }).returning();
    return t;
  }

  async getResetToken(token: string): Promise<PasswordResetToken | undefined> {
    const [t] = await db.select().from(passwordResetTokens).where(eq(passwordResetTokens.token, token));
    return t;
  }

  async deleteResetToken(token: string): Promise<void> {
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.token, token));
  }

  async deleteExpiredTokens(): Promise<void> {
    await db.delete(passwordResetTokens).where(lt(passwordResetTokens.expiresAt, new Date()));
  }

  async getShopSettings(): Promise<ShopSettings> {
    const [existing] = await db.select().from(shopSettings).orderBy(shopSettings.id);
    if (existing) return existing;
    const [created] = await db
      .insert(shopSettings)
      .values({
        phone: "0955 921 8921",
        email: "zareenans09@gmail.com",
        address: "Dacanlao, Calaca, Philippines, 4212",
        hours: "Mon–Sat: 7am – 8pm  |  Sun: 9am – 5pm",
      })
      .returning();
    return created;
  }

  async updateShopSettings(data: Partial<InsertShopSettings>): Promise<ShopSettings> {
    const current = await this.getShopSettings();
    const [updated] = await db
      .update(shopSettings)
      .set(data)
      .where(eq(shopSettings.id, current.id))
      .returning();
    return updated;
  }

  async getFeedback(): Promise<Feedback[]> {
    return await db.select().from(feedback).orderBy(desc(feedback.createdAt));
  }

  async getFeedbackByOrderId(orderId: string): Promise<Feedback | undefined> {
    const [f] = await db.select().from(feedback).where(eq(feedback.orderId, orderId));
    return f;
  }

  async createFeedback(data: InsertFeedback): Promise<Feedback> {
    const [f] = await db.insert(feedback).values(data).returning();
    return f;
  }

  async getMessages(): Promise<Message[]> {
    return await db.select().from(messages).orderBy(desc(messages.createdAt));
  }

  async getUnreadMessageCount(): Promise<number> {
    const unread = await db.select().from(messages).where(eq(messages.isRead, false));
    return unread.length;
  }

  async createMessage(data: InsertMessage): Promise<Message> {
    const [m] = await db.insert(messages).values(data).returning();
    return m;
  }

  async markMessageRead(id: number): Promise<void> {
    await db.update(messages).set({ isRead: true }).where(eq(messages.id, id));
  }

  async markAllMessagesRead(): Promise<void> {
    await db.update(messages).set({ isRead: true }).where(eq(messages.isRead, false));
  }

  async getMessagesByCustomerId(customerId: number): Promise<Message[]> {
    return await db.select().from(messages).where(eq(messages.customerId, customerId)).orderBy(desc(messages.createdAt));
  }

  async replyToMessage(id: number, staffReply: string, repliedByName: string): Promise<Message> {
    const [m] = await db.update(messages)
      .set({ staffReply, repliedByName, repliedAt: new Date(), isRead: true })
      .where(eq(messages.id, id))
      .returning();
    return m;
  }
}

export const storage = new DatabaseStorage();
