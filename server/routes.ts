import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api, errorSchemas } from "@shared/routes";
import { sendOrderStatusEmail, sendReceiptEmail } from "./email";
import { z } from "zod";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";

const BCRYPT_ROUNDS = 10;

async function hashPin(plainPin: string): Promise<string> {
  return bcrypt.hash(plainPin, BCRYPT_ROUNDS);
}

async function isPinBcryptHash(value: string): Promise<boolean> {
  return value.startsWith("$2a$") || value.startsWith("$2b$");
}

async function migrateExistingPins() {
  const allStaff = await storage.getAllStaff();
  for (const member of allStaff) {
    if (!(await isPinBcryptHash(member.pin))) {
      const hashed = await hashPin(member.pin);
      await storage.updateStaff(member.id, { pin: hashed });
    }
  }
}

async function seedDatabase() {
  const existingServices = await storage.getServices();
  if (existingServices.length === 0) {
    await storage.createService({ name: "Wash & Hang", description: "We wash and hang your clothes so they come back fresh and ready to wear.", pricePerKg: "30", active: true });
    await storage.createService({ name: "Dry-cleaning", description: "Professional dry cleaning for delicate fabrics, suits, and formal wear.", pricePerKg: "60", active: true });
  }

  const existingStaff = await storage.getStaffList();
  if (existingStaff.length === 0) {
    await storage.createStaff({ name: "Admin", pin: await hashPin("1234"), role: "owner", active: true });
  }

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
  seedDatabase().catch(console.error);
  migrateExistingPins().catch(console.error);

  // ── Auth ──────────────────────────────────────────────────────────────────
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session.staffId) return res.status(401).json({ message: "Not authenticated" });
    next();
  };

  const requireOwner = (req: any, res: any, next: any) => {
    if (!req.session.staffId) return res.status(401).json({ message: "Not authenticated" });
    if (req.session.staffRole !== "owner") return res.status(403).json({ message: "Owner access required" });
    next();
  };

  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many login attempts. Please wait 15 minutes and try again." },
  });

  app.post("/api/auth/login", loginLimiter, async (req, res) => {
    try {
      const { pin } = z.object({ pin: z.string().min(1) }).parse(req.body);
      const allStaff = await storage.getAllStaff();
      let matched = null;
      for (const member of allStaff) {
        if (member.active && await bcrypt.compare(pin, member.pin)) {
          matched = member;
          break;
        }
      }
      if (!matched) {
        return res.status(401).json({ message: "Incorrect PIN. Please try again." });
      }
      req.session.staffId = matched.id;
      req.session.staffName = matched.name;
      req.session.staffRole = matched.role;
      res.json({ id: matched.id, name: matched.name, role: matched.role });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "PIN is required." });
      }
      res.status(500).json({ message: "Login failed." });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ ok: true });
    });
  });

  app.get("/api/auth/me", (req, res) => {
    if (req.session.staffId) {
      return res.json({ id: req.session.staffId, name: req.session.staffName, role: req.session.staffRole });
    }
    res.status(401).json({ message: "Not authenticated" });
  });

  // ── Staff CRUD (owner only) ────────────────────────────────────────────────
  app.get("/api/staff", requireOwner, async (_req, res) => {
    try {
      res.json(await storage.getStaffList());
    } catch {
      res.status(500).json({ message: "Failed to fetch staff" });
    }
  });

  app.post("/api/staff", requireOwner, async (req, res) => {
    try {
      const schema = z.object({
        name: z.string().min(2, "Name must be at least 2 characters"),
        pin: z.string().length(4, "PIN must be exactly 4 digits").regex(/^\d{4}$/, "PIN must be 4 digits"),
        role: z.enum(["owner", "staff"]).optional().default("staff"),
        active: z.boolean().optional().default(true),
      });
      const data = schema.parse(req.body);
      const allStaff = await storage.getAllStaff();
      for (const member of allStaff) {
        if (await bcrypt.compare(data.pin, member.pin)) {
          return res.status(409).json({ message: "That PIN is already in use by another staff member." });
        }
      }
      const hashed = await hashPin(data.pin);
      const member = await storage.createStaff({ ...data, pin: hashed });
      res.status(201).json(member);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Failed to create staff member" });
    }
  });

  app.put("/api/staff/:id", requireOwner, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const schema = z.object({
        name: z.string().min(2).optional(),
        pin: z.string().length(4).regex(/^\d{4}$/).optional(),
        role: z.enum(["owner", "staff"]).optional(),
        active: z.boolean().optional(),
      });
      const data = schema.parse(req.body);
      if (data.pin) {
        const allStaff = await storage.getAllStaff();
        for (const member of allStaff) {
          if (member.id !== id && await bcrypt.compare(data.pin, member.pin)) {
            return res.status(409).json({ message: "That PIN is already in use by another staff member." });
          }
        }
        data.pin = await hashPin(data.pin);
      }
      const member = await storage.updateStaff(id, data);
      res.json(member);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Failed to update staff member" });
    }
  });

  app.delete("/api/staff/:id", requireOwner, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const allStaff = await storage.getStaffList();
      const activeCount = allStaff.filter((s) => s.active).length;
      const target = allStaff.find((s) => s.id === id);
      if (target?.active && activeCount <= 1) {
        return res.status(400).json({ message: "Cannot remove the last active staff account." });
      }
      await storage.deleteStaff(id);
      res.status(204).send();
    } catch {
      res.status(500).json({ message: "Failed to delete staff member" });
    }
  });

  // ── Orders ────────────────────────────────────────────────────────────────
  app.get(api.orders.list.path, async (req, res) => {
    try {
      const orders = await storage.getOrders();
      res.json(orders);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get("/api/orders/all", async (req, res) => {
    try {
      const orders = await storage.getAllOrders();
      res.json(orders);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch all orders" });
    }
  });

  app.get("/api/orders/logs", requireOwner, async (req, res) => {
    try {
      const logs = await storage.getOrderLogs();
      res.json(logs);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch order logs" });
    }
  });

  app.get(api.orders.listDeleted.path, requireOwner, async (req, res) => {
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

  app.post("/api/orders/request", async (req, res) => {
    try {
      const bodySchema = z.object({
        customerName: z.string().min(2, "Please enter your full name"),
        address: z.string().min(5, "Please enter your full address"),
        contactNumber: z
          .string()
          .regex(/^(09|\+639)\d{9}$/, "Please enter a valid mobile number"),
        email: z
          .string()
          .regex(/^[a-zA-Z0-9._%+\-]+@gmail\.com$/, "Enter a valid Gmail address"),
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
      const bodySchema = api.orders.create.input.extend({
        weight: z.coerce.string(),
        total: z.coerce.string(),
      });
      const input = bodySchema.parse(req.body);
      const order = await storage.createOrder(input);
      await storage.logOrderAction(order, "created", req.session.staffName);
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

      const input = api.orders.update.input.parse(req.body);
      const staffName = req.session.staffName;

      const order = await storage.updateOrder(id, input);

      // Determine what action to log
      let action = "edited";
      if (input.status && input.status !== existing.status) {
        action = "status_changed";
        await sendOrderStatusEmail(order.email, order.customerName, order.orderId, order.status);
      } else if (input.paid !== undefined && input.paid !== existing.paid) {
        action = input.paid ? "paid" : "unpaid";
      } else if (input.promoId !== undefined && input.promoId !== existing.promoId) {
        action = input.promoId ? "discount_applied" : "discount_removed";
      }

      await storage.logOrderAction(order, action, staffName);
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

  app.post("/api/orders/:id/email-receipt", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const order = await storage.getOrder(id);
      if (!order) return res.status(404).json({ message: "Order not found" });
      await sendReceiptEmail(order);
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to send receipt email" });
    }
  });

  app.delete(api.orders.delete.path, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const existing = await storage.getOrder(id);
      if (!existing) {
        return res.status(404).json({ message: "Order not found" });
      }
      await storage.deleteOrder(id, req.session.staffName);
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
      const restored = await storage.restoreOrder(id, req.session.staffName);
      res.json(restored);
    } catch (err) {
      res.status(500).json({ message: "Failed to restore order" });
    }
  });

  app.delete("/api/orders/:id/permanent", requireOwner, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const existing = await storage.getOrder(id);
      if (!existing) {
        return res.status(404).json({ message: "Order not found" });
      }
      await storage.permanentDeleteOrder(id, req.session.staffName);
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ message: "Failed to permanently delete order" });
    }
  });

  // ── Services (GET public for order forms; write ops owner only) ───────────
  app.get("/api/services", async (_req, res) => {
    try {
      res.json(await storage.getServices());
    } catch {
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });

  app.post("/api/services", requireOwner, async (req, res) => {
    try {
      const data = req.body;
      const svc = await storage.createService({ ...data, pricePerKg: String(data.pricePerKg), active: data.active ?? true });
      res.status(201).json(svc);
    } catch {
      res.status(500).json({ message: "Failed to create service" });
    }
  });

  app.put("/api/services/:id", requireOwner, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const data = req.body;
      const svc = await storage.updateService(id, { ...data, pricePerKg: data.pricePerKg !== undefined ? String(data.pricePerKg) : undefined });
      res.json(svc);
    } catch {
      res.status(500).json({ message: "Failed to update service" });
    }
  });

  app.delete("/api/services/:id", requireOwner, async (req, res) => {
    try {
      await storage.deleteService(Number(req.params.id));
      res.status(204).send();
    } catch {
      res.status(500).json({ message: "Failed to delete service" });
    }
  });

  // ── Promos (GET public for order forms; write ops owner only) ─────────────
  app.get("/api/promos", async (_req, res) => {
    try {
      res.json(await storage.getPromos());
    } catch {
      res.status(500).json({ message: "Failed to fetch promos" });
    }
  });

  app.post("/api/promos", requireOwner, async (req, res) => {
    try {
      const data = req.body;
      const promo = await storage.createPromo({ ...data, discount: String(data.discount), active: data.active ?? true });
      res.status(201).json(promo);
    } catch {
      res.status(500).json({ message: "Failed to create promo" });
    }
  });

  app.put("/api/promos/:id", requireOwner, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const data = req.body;
      const promo = await storage.updatePromo(id, { ...data, discount: data.discount !== undefined ? String(data.discount) : undefined });
      res.json(promo);
    } catch {
      res.status(500).json({ message: "Failed to update promo" });
    }
  });

  app.delete("/api/promos/:id", requireOwner, async (req, res) => {
    try {
      await storage.deletePromo(Number(req.params.id));
      res.status(204).send();
    } catch {
      res.status(500).json({ message: "Failed to delete promo" });
    }
  });

  return httpServer;
}
