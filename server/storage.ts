import { db } from "./db";
import {
  orders,
  orderLogs,
  services,
  promos,
  staff,
  type InsertOrder,
  type Order,
  type OrderLog,
  type Service,
  type InsertService,
  type Promo,
  type InsertPromo,
  type Staff,
  type InsertStaff,
  type UpdateOrderRequest
} from "@shared/schema";
import { eq, isNull, isNotNull, desc } from "drizzle-orm";

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
}

async function logOrder(order: Order, action: string, staffName?: string) {
  await db.insert(orderLogs).values({
    orderId: order.orderId,
    customerName: order.customerName,
    contactNumber: order.contactNumber,
    email: order.email,
    service: order.service,
    weight: order.weight,
    total: order.total,
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
    await logOrder(order, "created");
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
}

export const storage = new DatabaseStorage();
