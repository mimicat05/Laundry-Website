import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api, errorSchemas } from "@shared/routes";
import { insertCustomerSchema, insertFeedbackSchema, insertMessageSchema, insertMessageReplySchema } from "@shared/schema";
import { sendOrderStatusEmail, sendOrderConfirmedEmail, sendReceiptEmail, sendPasswordResetEmail, sendWalkInOrderEmail } from "./email";
import { z } from "zod";
import bcrypt from "bcryptjs";

const loginAttempts = new Map<string, { count: number; lockedUntil: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 5 * 60 * 1000;

async function seedDatabase() {
  const existingServices = await storage.getServices();
  if (existingServices.length === 0) {
    await storage.createService({ name: "Wash & Hang", description: "We wash and hang your clothes so they come back fresh and ready to wear.", pricePerKg: "30", active: true });
    await storage.createService({ name: "Dry-cleaning", description: "Professional dry cleaning for delicate fabrics, suits, and formal wear.", pricePerKg: "60", active: true });
  }

  const existingStaff = await storage.getStaffList();
  if (existingStaff.length === 0) {
    await storage.createStaff({ name: "Admin", pin: "1234", role: "owner", active: true });
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
      service: "Dry-cleaning",
      weight: "2.50",
      total: "500.00",
      status: "washing"
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
      service: "Dry-cleaning",
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

  app.post("/api/auth/login", async (req, res) => {
    try {
      const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.socket.remoteAddress || "unknown";
      const now = Date.now();
      const record = loginAttempts.get(ip) || { count: 0, lockedUntil: 0 };

      if (record.lockedUntil > now) {
        const minutesLeft = Math.ceil((record.lockedUntil - now) / 60000);
        return res.status(429).json({ message: `Too many failed attempts. Try again in ${minutesLeft} minute${minutesLeft > 1 ? "s" : ""}.` });
      }

      const { name, pin } = z.object({ name: z.string().min(1), pin: z.string().min(1) }).parse(req.body);
      const member = await storage.getStaffByPin(pin);
      if (!member || !member.active || member.name.toLowerCase() !== name.toLowerCase()) {
        record.count += 1;
        if (record.count >= MAX_ATTEMPTS) {
          record.lockedUntil = now + LOCKOUT_MS;
          record.count = 0;
          loginAttempts.set(ip, record);
          return res.status(429).json({ message: "Too many failed attempts. You are locked out for 5 minutes." });
        }
        loginAttempts.set(ip, record);
        const remaining = MAX_ATTEMPTS - record.count;
        return res.status(401).json({ message: `Invalid name or PIN. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.` });
      }

      loginAttempts.delete(ip);
      req.session.staffId = member.id;
      req.session.staffName = member.name;
      req.session.staffRole = member.role;
      res.json({ id: member.id, name: member.name, role: member.role });
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

  // ── Customer Auth ─────────────────────────────────────────────────────────
  const requireCustomer = (req: any, res: any, next: any) => {
    if (!req.session.customerId) return res.status(401).json({ message: "Not authenticated" });
    next();
  };

  app.post("/api/customer/register", async (req, res) => {
    try {
      const schema = z.object({
        name: z.string().min(2, "Name must be at least 2 characters"),
        email: z.string().regex(/^[a-zA-Z0-9._%+\-]+@gmail\.com$/, "Enter a valid Gmail address"),
        password: z.string().min(6, "Password must be at least 6 characters"),
        contactNumber: z.string().regex(/^(09|\+639)\d{9}$/, "Enter a valid mobile number"),
        address: z.string().min(5, "Please enter your full address"),
      });
      const data = schema.parse(req.body);
      const existing = await storage.getCustomerByEmail(data.email);
      if (existing) return res.status(409).json({ message: "An account with this email already exists." });
      const hashed = await bcrypt.hash(data.password, 10);
      const customer = await storage.createCustomer({ ...data, password: hashed });
      req.session.customerId = customer.id;
      const { password: _, ...safe } = customer;
      res.status(201).json(safe);
    } catch (err: any) {
      if (err?.errors) return res.status(400).json({ message: err.errors[0]?.message || "Invalid input" });
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/customer/login", async (req, res) => {
    try {
      const { email, password } = z.object({
        email: z.string().email(),
        password: z.string().min(1),
      }).parse(req.body);
      const customer = await storage.getCustomerByEmail(email);
      if (!customer) return res.status(401).json({ message: "Invalid email or password." });
      const valid = await bcrypt.compare(password, customer.password);
      if (!valid) return res.status(401).json({ message: "Invalid email or password." });
      req.session.customerId = customer.id;
      const { password: _, ...safe } = customer;
      res.json(safe);
    } catch {
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/customer/logout", (req, res) => {
    req.session.destroy(() => res.json({ ok: true }));
  });

  app.get("/api/customer/me", async (req, res) => {
    if (!req.session.customerId) return res.status(401).json({ message: "Not authenticated" });
    const customer = await storage.getCustomerById(req.session.customerId);
    if (!customer) return res.status(401).json({ message: "Not authenticated" });
    const { password: _, ...safe } = customer;
    res.json(safe);
  });

  app.patch("/api/customer/me", requireCustomer, async (req, res) => {
    try {
      const updateSchema = insertCustomerSchema.omit({ password: true }).partial();
      const data = updateSchema.parse(req.body);
      if (data.email) {
        const existing = await storage.getCustomerByEmail(data.email);
        if (existing && existing.id !== req.session.customerId) {
          return res.status(400).json({ message: "Email already in use." });
        }
      }
      const updated = await storage.updateCustomer(req.session.customerId, data);
      const { password: _, ...safe } = updated;
      res.json(safe);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.get("/api/customer/orders", requireCustomer, async (req, res) => {
    try {
      const customer = await storage.getCustomerById(req.session.customerId);
      if (!customer) return res.status(401).json({ message: "Not authenticated" });
      const customerOrders = await storage.getOrdersByEmail(customer.email);
      const visible = customerOrders.filter((o) => !o.deletedAt);
      res.json(visible);
    } catch {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.post("/api/customer/orders/:id/cancel", requireCustomer, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const customer = await storage.getCustomerById(req.session.customerId);
      if (!customer) return res.status(401).json({ message: "Not authenticated" });
      const order = await storage.getOrder(id);
      if (!order) return res.status(404).json({ message: "Order not found" });
      if (order.email !== customer.email) return res.status(403).json({ message: "Not your order" });
      if (!["requested", "pending"].includes(order.status)) {
        return res.status(400).json({ message: "Order can no longer be cancelled at this stage." });
      }
      const updated = await storage.updateOrder(id, { status: "cancelled" });
      await storage.logOrderAction(updated, "cancelled", `customer:${customer.name}`);
      res.json(updated);
    } catch {
      res.status(500).json({ message: "Failed to cancel order" });
    }
  });

  // ── Customer: Submit Promo Claim ──────────────────────────────────────────
  app.post("/api/customer/orders/:id/promo-claim", requireCustomer, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const customer = await storage.getCustomerById(req.session.customerId);
      if (!customer) return res.status(401).json({ message: "Not authenticated" });
      const order = await storage.getOrder(id);
      if (!order) return res.status(404).json({ message: "Order not found" });
      if (order.email !== customer.email) return res.status(403).json({ message: "Not your order" });
      if (!["requested", "pending"].includes(order.status)) {
        return res.status(400).json({ message: "Promo claims can only be submitted for active orders." });
      }
      if (order.promoId) {
        return res.status(400).json({ message: "A discount is already applied to this order." });
      }
      const schema = z.object({
        promoClaimName: z.string().min(1, "Please select a promo"),
        promoPhoto: z.string().min(1, "Please upload a photo"),
      });
      const { promoClaimName, promoPhoto } = schema.parse(req.body);
      // Limit base64 image size to ~3MB
      if (promoPhoto.length > 4 * 1024 * 1024) {
        return res.status(400).json({ message: "Image is too large. Please upload a smaller photo." });
      }
      const updated = await storage.updateOrder(id, {
        promoClaimName,
        promoPhoto,
        promoClaimStatus: "pending",
      });
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Failed to submit promo claim" });
    }
  });

  // ── Customer: Change Password ─────────────────────────────────────────────
  app.post("/api/customer/change-password", requireCustomer, async (req, res) => {
    try {
      const schema = z.object({
        currentPassword: z.string().min(1),
        newPassword: z.string().min(6, "New password must be at least 6 characters"),
      });
      const { currentPassword, newPassword } = schema.parse(req.body);
      const customer = await storage.getCustomerById(req.session.customerId!);
      if (!customer) return res.status(401).json({ message: "Not authenticated" });
      const valid = await bcrypt.compare(currentPassword, customer.password);
      if (!valid) return res.status(400).json({ message: "Current password is incorrect" });
      const hashed = await bcrypt.hash(newPassword, 10);
      await storage.updateCustomer(customer.id, { password: hashed });
      res.json({ message: "Password changed successfully" });
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Failed to change password" });
    }
  });

  // ── Customer: Direct Password Reset (verify by email + contact number) ───
  app.post("/api/customer/reset-password-direct", async (req, res) => {
    try {
      const schema = z.object({
        email: z.string().email(),
        contactNumber: z.string().min(1),
        newPassword: z.string().min(6, "Password must be at least 6 characters"),
      });
      const { email, contactNumber, newPassword } = schema.parse(req.body);
      const customer = await storage.getCustomerByEmail(email);
      if (!customer || customer.contactNumber !== contactNumber) {
        return res.status(400).json({ message: "No account found with that email and contact number combination." });
      }
      const hashed = await bcrypt.hash(newPassword, 10);
      await storage.updateCustomer(customer.id, { password: hashed });
      res.json({ message: "Password has been reset successfully. You can now log in." });
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // ── Customer: Forgot Password ─────────────────────────────────────────────
  app.post("/api/customer/forgot-password", async (req, res) => {
    try {
      const schema = z.object({ email: z.string().email() });
      const { email } = schema.parse(req.body);
      // Always respond OK to prevent email enumeration
      const customer = await storage.getCustomerByEmail(email);
      if (customer) {
        const crypto = await import("crypto");
        const token = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        await storage.createResetToken(customer.id, token, expiresAt);
        const baseUrl = `${req.protocol}://${req.get("host")}`;
        const resetLink = `${baseUrl}/customer/reset-password?token=${token}`;
        await sendPasswordResetEmail(customer.email, customer.name, resetLink);
      }
      res.json({ message: "If that email is registered, a reset link has been sent." });
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Failed to process request" });
    }
  });

  // ── Customer: Reset Password ───────────────────────────────────────────────
  app.post("/api/customer/reset-password", async (req, res) => {
    try {
      const schema = z.object({ token: z.string().min(1), newPassword: z.string().min(6, "Password must be at least 6 characters") });
      const { token, newPassword } = schema.parse(req.body);
      await storage.deleteExpiredTokens();
      const record = await storage.getResetToken(token);
      if (!record || record.expiresAt < new Date()) {
        return res.status(400).json({ message: "This reset link is invalid or has expired. Please request a new one." });
      }
      const hashed = await bcrypt.hash(newPassword, 10);
      await storage.updateCustomer(record.customerId, { password: hashed });
      await storage.deleteResetToken(token);
      res.json({ message: "Password has been reset successfully. You can now log in." });
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Failed to reset password" });
    }
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
        active: z.boolean().optional().default(true),
      });
      const data = schema.parse(req.body);
      const existing = await storage.getStaffByPin(data.pin);
      if (existing) {
        return res.status(409).json({ message: "That PIN is already in use by another staff member." });
      }
      const member = await storage.createStaff(data);
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
        active: z.boolean().optional(),
      });
      const data = schema.parse(req.body);
      if (data.pin) {
        const existing = await storage.getStaffByPin(data.pin);
        if (existing && existing.id !== id) {
          return res.status(409).json({ message: "That PIN is already in use by another staff member." });
        }
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
  app.get(api.orders.list.path, requireAuth, async (req, res) => {
    try {
      const orders = await storage.getOrders();
      res.json(orders);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get("/api/orders/all", requireOwner, async (req, res) => {
    try {
      const orders = await storage.getAllOrders();
      res.json(orders);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch all orders" });
    }
  });

  // Public order tracking endpoint — no auth required
  app.post("/api/orders/track", async (req, res) => {
    try {
      const { orderId, contact } = z.object({
        orderId: z.string().min(1),
        contact: z.string().min(1),
      }).parse(req.body);

      const allOrders = await storage.getAllOrders();
      const order = allOrders.find(
        (o) =>
          !o.deletedAt &&
          o.orderId.toLowerCase() === orderId.trim().toLowerCase() &&
          (o.email.toLowerCase() === contact.trim().toLowerCase() ||
            o.contactNumber === contact.trim())
      );

      if (!order) {
        return res.status(404).json({ message: "Order not found. Please check your Order ID and contact details." });
      }

      return res.json(order);
    } catch {
      return res.status(400).json({ message: "Invalid request." });
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

  app.get(api.orders.get.path, requireAuth, async (req, res) => {
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
        promoClaimName: z.string().optional(),
        promoPhoto: z.string().optional(),
      });
      const input = bodySchema.parse(req.body);

      if (input.promoPhoto && input.promoPhoto.length > 4 * 1024 * 1024) {
        return res.status(400).json({ message: "Photo is too large. Please upload a smaller image." });
      }

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
        ...(input.promoClaimName && input.promoPhoto
          ? { promoClaimName: input.promoClaimName, promoPhoto: input.promoPhoto, promoClaimStatus: "pending" }
          : {}),
      });
      await storage.logOrderAction(order, "created");
      res.status(201).json(order);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Failed to submit order request" });
    }
  });

  app.post(api.orders.create.path, requireAuth, async (req, res) => {
    try {
      const bodySchema = api.orders.create.input.extend({
        weight: z.coerce.string(),
        total: z.coerce.string(),
      });
      const input = bodySchema.parse(req.body);
      const order = await storage.createOrder(input);
      await storage.logOrderAction(order, "created", req.session.staffName);

      // Notify the customer about their walk-in order so they can track it online
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      sendWalkInOrderEmail(
        order.email,
        order.customerName,
        order.orderId,
        order.service,
        `${baseUrl}/customer/login`
      ).catch(() => {});

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

  app.put(api.orders.update.path, requireAuth, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const existing = await storage.getOrder(id);
      if (!existing) {
        return res.status(404).json({ message: "Order not found" });
      }

      const input = api.orders.update.input.parse(req.body);
      const staffName = req.session.staffName;

      const completedAt = input.status === "completed" && existing.status !== "completed"
        ? new Date()
        : undefined;
      const order = await storage.updateOrder(id, { ...input, ...(completedAt ? { completedAt } : {}) });

      // Determine what action to log
      let action = "edited";
      if (input.status && input.status !== existing.status) {
        action = "status_changed";
        if (input.status === "pending") {
          await sendOrderConfirmedEmail(order);
        } else if (input.status === "ready_for_pickup") {
          await sendOrderStatusEmail(order.email, order.customerName, order.orderId, "ready_for_pickup");
        }
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

  // ── Staff: Review Promo Claim ─────────────────────────────────────────────
  app.post("/api/orders/:id/promo-claim-review", requireAuth, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const order = await storage.getOrder(id);
      if (!order) return res.status(404).json({ message: "Order not found" });
      if (order.promoClaimStatus !== "pending") {
        return res.status(400).json({ message: "No pending promo claim on this order." });
      }
      const schema = z.object({
        action: z.enum(["approve", "reject"]),
        promoId: z.number().optional(),
        promoName: z.string().optional(),
        discount: z.number().optional(),
      });
      const { action, promoId, promoName, discount } = schema.parse(req.body);
      let updates: Record<string, any> = { promoClaimStatus: action === "approve" ? "approved" : "rejected" };

      if (action === "approve" && promoId && promoName && discount !== undefined) {
        const baseTotal = order.discountAmount
          ? Number(order.total) + Number(order.discountAmount)
          : Number(order.total);
        const discountAmount = (baseTotal * discount / 100).toFixed(2);
        const newTotal = (baseTotal - Number(discountAmount)).toFixed(2);
        updates = {
          ...updates,
          promoId,
          promoName,
          discountAmount,
          total: newTotal,
        };
      }

      const updated = await storage.updateOrder(id, updates);
      await storage.logOrderAction(
        updated,
        action === "approve" ? "discount_applied" : "discount_removed",
        req.session.staffName
      );
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Failed to review promo claim" });
    }
  });

  app.post("/api/orders/:id/email-receipt", requireAuth, async (req, res) => {
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

  app.delete(api.orders.delete.path, requireAuth, async (req, res) => {
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

  app.post(api.orders.restore.path, requireOwner, async (req, res) => {
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

  // ── Shop Settings ─────────────────────────────────────────────────────────
  app.get("/api/settings", async (_req, res) => {
    try {
      const settings = await storage.getShopSettings();
      res.json(settings);
    } catch {
      res.status(500).json({ message: "Failed to fetch shop settings" });
    }
  });

  app.put("/api/settings", requireOwner, async (req, res) => {
    try {
      const schema = z.object({
        phone: z.string().max(50).optional(),
        email: z.string().max(120).optional(),
        address: z.string().max(250).optional(),
        hours: z.string().max(250).optional(),
      });
      const data = schema.parse(req.body);
      const updated = await storage.updateShopSettings(data);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Failed to update shop settings" });
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

  // Feedback
  app.get("/api/feedback", requireAuth, async (_req, res) => {
    try {
      const all = await storage.getFeedback();
      res.json(all);
    } catch {
      res.status(500).json({ message: "Failed to fetch feedback" });
    }
  });

  app.post("/api/customer/feedback", requireCustomer, async (req, res) => {
    try {
      const customer = await storage.getCustomerById(req.session.customerId!);
      if (!customer) return res.status(401).json({ message: "Not authenticated" });
      const body = insertFeedbackSchema.parse({
        ...req.body,
        customerId: customer.id,
        customerName: customer.name,
      });
      const existing = await storage.getFeedbackByOrderId(body.orderId);
      if (existing) return res.status(409).json({ message: "Feedback already submitted for this order" });
      const result = await storage.createFeedback(body);
      res.status(201).json(result);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Failed to submit feedback" });
    }
  });

  app.delete("/api/feedback/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteFeedback(Number(req.params.id));
      res.status(204).send();
    } catch {
      res.status(500).json({ message: "Failed to delete feedback" });
    }
  });

  app.get("/api/feedback/order/:orderId", requireCustomer, async (req, res) => {
    try {
      const existing = await storage.getFeedbackByOrderId(req.params.orderId);
      res.json(existing ?? null);
    } catch {
      res.status(500).json({ message: "Failed to fetch feedback" });
    }
  });

  // Messages
  app.get("/api/messages", requireAuth, async (_req, res) => {
    try {
      const all = await storage.getMessages();
      res.json(all);
    } catch {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.get("/api/messages/unread-count", requireAuth, async (_req, res) => {
    try {
      const count = await storage.getUnreadMessageCount();
      res.json({ count });
    } catch {
      res.status(500).json({ message: "Failed to fetch unread count" });
    }
  });

  app.post("/api/customer/messages", requireCustomer, async (req, res) => {
    try {
      const customer = await storage.getCustomerById(req.session.customerId!);
      if (!customer) return res.status(401).json({ message: "Not authenticated" });
      const body = insertMessageSchema.parse({
        ...req.body,
        customerId: customer.id,
        customerName: customer.name,
        isRead: false,
      });
      const result = await storage.createMessage(body);
      res.status(201).json(result);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  app.put("/api/messages/:id/read", requireAuth, async (req, res) => {
    try {
      await storage.markMessageRead(Number(req.params.id));
      res.status(204).send();
    } catch {
      res.status(500).json({ message: "Failed to mark message as read" });
    }
  });

  app.put("/api/messages/read-all", requireAuth, async (_req, res) => {
    try {
      await storage.markAllMessagesRead();
      res.status(204).send();
    } catch {
      res.status(500).json({ message: "Failed to mark all messages as read" });
    }
  });

  // Staff sends a reply to a message thread
  app.post("/api/messages/:id/reply", requireAuth, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { reply } = req.body as { reply: string };
      if (!reply || !reply.trim()) return res.status(400).json({ message: "Reply cannot be empty" });
      const staffName = req.session.staffName || "Staff";
      const newReply = await storage.createMessageReply({
        messageId: id,
        senderType: "staff",
        senderName: staffName,
        body: reply.trim(),
      });
      await storage.markMessageRead(id);
      res.json(newReply);
    } catch {
      res.status(500).json({ message: "Failed to send reply" });
    }
  });

  // Staff fetches replies for a thread
  app.get("/api/messages/:id/replies", requireAuth, async (req, res) => {
    try {
      const replies = await storage.getMessageReplies(Number(req.params.id));
      res.json(replies);
    } catch {
      res.status(500).json({ message: "Failed to fetch replies" });
    }
  });

  app.get("/api/customer/messages", requireCustomer, async (req, res) => {
    try {
      const customer = await storage.getCustomerById(req.session.customerId!);
      if (!customer) return res.status(401).json({ message: "Not authenticated" });
      const msgs = await storage.getMessagesByCustomerId(customer.id);
      res.json(msgs);
    } catch {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Customer fetches replies for their own thread
  app.get("/api/customer/messages/:id/replies", requireCustomer, async (req, res) => {
    try {
      const customer = await storage.getCustomerById(req.session.customerId!);
      if (!customer) return res.status(401).json({ message: "Not authenticated" });
      const msg = await storage.getMessages().then(all => all.find(m => m.id === Number(req.params.id)));
      if (!msg || msg.customerId !== customer.id) return res.status(403).json({ message: "Not your message" });
      const replies = await storage.getMessageReplies(Number(req.params.id));
      res.json(replies);
    } catch {
      res.status(500).json({ message: "Failed to fetch replies" });
    }
  });

  // Customer sends a reply in an existing thread
  app.post("/api/customer/messages/:id/reply", requireCustomer, async (req, res) => {
    try {
      const customer = await storage.getCustomerById(req.session.customerId!);
      if (!customer) return res.status(401).json({ message: "Not authenticated" });
      const msg = await storage.getMessages().then(all => all.find(m => m.id === Number(req.params.id)));
      if (!msg || msg.customerId !== customer.id) return res.status(403).json({ message: "Not your message" });
      const { reply } = req.body as { reply: string };
      if (!reply || !reply.trim()) return res.status(400).json({ message: "Reply cannot be empty" });
      const newReply = await storage.createMessageReply({
        messageId: Number(req.params.id),
        senderType: "customer",
        senderName: customer.name,
        body: reply.trim(),
      });
      await storage.markMessageUnread(Number(req.params.id));
      res.json(newReply);
    } catch {
      res.status(500).json({ message: "Failed to send reply" });
    }
  });

  // Unified customer conversation
  app.get("/api/customer/conversation", requireCustomer, async (req, res) => {
    try {
      const customer = await storage.getCustomerById(req.session.customerId!);
      if (!customer) return res.status(401).json({ message: "Not authenticated" });
      const entries = await storage.getCustomerConversation(customer.id);
      res.json(entries);
    } catch {
      res.status(500).json({ message: "Failed to fetch conversation" });
    }
  });

  app.post("/api/customer/conversation", requireCustomer, async (req, res) => {
    try {
      const customer = await storage.getCustomerById(req.session.customerId!);
      if (!customer) return res.status(401).json({ message: "Not authenticated" });
      const { message } = req.body as { message: string };
      if (!message || !message.trim()) return res.status(400).json({ message: "Message cannot be empty" });
      await storage.sendConversationMessage(customer.id, customer.name, message.trim());
      res.status(201).json({ ok: true });
    } catch {
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  app.get("/api/public/feedback", async (_req, res) => {
    try {
      const all = await storage.getFeedback();
      res.json(all);
    } catch {
      res.status(500).json({ message: "Failed to fetch feedback" });
    }
  });

  return httpServer;
}
