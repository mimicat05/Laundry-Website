import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api, errorSchemas } from "@shared/routes";
import { sendOrderStatusEmail } from "./email";
import { z } from "zod";

async function seedDatabase() {
  const existingOrders = await storage.getOrders();
  if (existingOrders.length === 0) {
    await storage.createOrder({
      orderId: "ORD001",
      customerName: "John Cruz",
      address: "123 Street",
      contactNumber: "098765435667",
      email: "john@gmail.com",
      service: "Wash & Hang",
      weight: "3.00",
      total: "360.00",
      status: "pending"
    });
    
    await storage.createOrder({
      orderId: "ORD002",
      customerName: "Jane Doe",
      address: "456 Avenue",
      contactNumber: "09123456789",
      email: "jane@gmail.com",
      service: "Dry Cleaning",
      weight: "2.50",
      total: "500.00",
      status: "washed"
    });

    await storage.createOrder({
      orderId: "ORD003",
      customerName: "Alice Smith",
      address: "789 Boulevard",
      contactNumber: "09988776655",
      email: "alice@gmail.com",
      service: "Wash & Hang",
      weight: "5.00",
      total: "600.00",
      status: "ready_for_pickup"
    });
    
    await storage.createOrder({
      orderId: "ORD004",
      customerName: "Bob Johnson",
      address: "321 Road",
      contactNumber: "09223344556",
      email: "bob@gmail.com",
      service: "Dry Cleaning",
      weight: "1.50",
      total: "300.00",
      status: "completed"
    });
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Seed the database with initial examples
  seedDatabase().catch(console.error);

  app.get(api.orders.list.path, async (req, res) => {
    try {
      const orders = await storage.getOrders();
      res.json(orders);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get(api.orders.listDeleted.path, async (req, res) => {
    try {
      const orders = await storage.getDeletedOrders();
      res.json(orders);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch deleted orders" });
    }
  });

  app.get(api.orders.get.path, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const order = await storage.getOrder(id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json(order);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  // Public endpoint for customer order requests (no auth needed)
  app.post("/api/orders/request", async (req, res) => {
    try {
      const bodySchema = z.object({
        customerName: z.string().min(2, "Full name must be at least 2 characters"),
        address: z.string().min(5, "Please enter your full address"),
        contactNumber: z
          .string()
          .regex(
            /^(09|\+639)\d{9}$/,
            "Enter a valid Philippine mobile number (e.g. 09171234567 or +639171234567)"
          ),
        email: z
          .string()
          .regex(
            /^[a-zA-Z0-9._%+\-]+@gmail\.com$/,
            "Only Gmail addresses are accepted (e.g. yourname@gmail.com)"
          ),
        service: z.string().min(1, "Please select a service"),
        notes: z.string().optional(),
        weight: z.coerce.string().optional(),
        total: z.coerce.string().optional(),
      });
      const input = bodySchema.parse(req.body);
      const orderId = `ORD${Math.floor(1000 + Math.random() * 9000)}`;
      const order = await storage.createOrder({
        customerName: input.customerName,
        address: input.address,
        contactNumber: input.contactNumber,
        email: input.email,
        service: input.service,
        notes: input.notes || null,
        orderId,
        weight: input.weight || "0",
        total: input.total || "0",
        status: "requested",
      });
      await sendOrderStatusEmail(order.email, order.customerName, order.orderId, "requested");
      res.status(201).json(order);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Failed to submit order request" });
    }
  });

  app.post(api.orders.create.path, async (req, res) => {
    try {
      // Coerce numeric fields from strings if necessary
      const bodySchema = api.orders.create.input.extend({
        weight: z.coerce.string(),
        total: z.coerce.string(),
      });
      const input = bodySchema.parse(req.body);
      const order = await storage.createOrder(input);
      res.status(201).json(order);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  app.put(api.orders.update.path, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const existing = await storage.getOrder(id);
      if (!existing) {
        return res.status(404).json({ message: "Order not found" });
      }

      const bodySchema = api.orders.update.input;
      const input = bodySchema.parse(req.body);
      
      const order = await storage.updateOrder(id, input);
      
      // Send email notification when status changes
      if (input.status && input.status !== existing.status) {
        await sendOrderStatusEmail(
          order.email,
          order.customerName,
          order.orderId,
          order.status
        );
      }

      res.json(order);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Failed to update order" });
    }
  });

  app.delete(api.orders.delete.path, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const existing = await storage.getOrder(id);
      if (!existing) {
        return res.status(404).json({ message: "Order not found" });
      }
      await storage.deleteOrder(id);
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ message: "Failed to delete order" });
    }
  });

  app.post(api.orders.restore.path, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const existing = await storage.getOrder(id);
      if (!existing) {
        return res.status(404).json({ message: "Order not found" });
      }
      const restored = await storage.restoreOrder(id);
      res.json(restored);
    } catch (err) {
      res.status(500).json({ message: "Failed to restore order" });
    }
  });

  app.delete("/api/orders/:id/permanent", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const existing = await storage.getOrder(id);
      if (!existing) {
        return res.status(404).json({ message: "Order not found" });
      }
      await storage.permanentDeleteOrder(id);
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ message: "Failed to permanently delete order" });
    }
  });

  return httpServer;
}
