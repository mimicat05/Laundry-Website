import { db } from "./db";
import {
  orders,
  type InsertOrder,
  type Order,
  type UpdateOrderRequest
} from "@shared/schema";
import { eq, isNull, isNotNull } from "drizzle-orm";

export interface IStorage {
  getOrders(): Promise<Order[]>;
  getDeletedOrders(): Promise<Order[]>;
  getOrder(id: number): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: number, updates: UpdateOrderRequest): Promise<Order>;
  deleteOrder(id: number): Promise<void>;
  restoreOrder(id: number): Promise<Order>;
  permanentDeleteOrder(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getOrders(): Promise<Order[]> {
    return await db.select().from(orders)
      .where(isNull(orders.deletedAt))
      .orderBy(orders.id);
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

  async deleteOrder(id: number): Promise<void> {
    await db.update(orders)
      .set({ deletedAt: new Date() })
      .where(eq(orders.id, id));
  }

  async restoreOrder(id: number): Promise<Order> {
    const [restored] = await db.update(orders)
      .set({ deletedAt: null })
      .where(eq(orders.id, id))
      .returning();
    return restored;
  }

  async permanentDeleteOrder(id: number): Promise<void> {
    await db.delete(orders).where(eq(orders.id, id));
  }
}

export const storage = new DatabaseStorage();
