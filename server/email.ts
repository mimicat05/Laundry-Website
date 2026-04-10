import nodemailer from "nodemailer";

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (transporter) return transporter;

  const gmailUser = process.env.GMAIL_USER;
  const gmailPassword = process.env.GMAIL_PASSWORD;

  if (!gmailUser || !gmailPassword) {
    console.warn("⚠️  Gmail credentials not set. Email sending disabled.");
    return null;
  }

  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: gmailUser,
      pass: gmailPassword,
    },
  });

  return transporter;
}

export async function sendReceiptEmail(
  order: {
    email: string;
    customerName: string;
    orderId: string;
    contactNumber: string;
    address: string;
    service: string;
    weight: string;
    total: string;
    paid: boolean;
    notes: string | null;
    createdAt: Date | string;
  },
  type: "dropoff" | "pickup"
) {
  const transport = getTransporter();
  const isPickup = type === "pickup";
  const title = isPickup ? "Pickup Receipt" : "Drop-off Receipt";
  const note = isPickup
    ? "Thank you for choosing Lavanderia Sunrise!"
    : "We will notify you once your laundry is ready. Keep this email as your reference.";

  const paymentColor = order.paid ? "#15803d" : "#b91c1c";
  const paymentBg = order.paid ? "#f0fdf4" : "#fef2f2";
  const paymentText = order.paid ? "✓ PAID" : "✗ UNPAID";

  const totalFormatted = `₱${Number(order.total).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
  const dateReceived = new Date(order.createdAt).toLocaleString("en-PH", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  const html = `
    <div style="font-family: 'Courier New', Courier, monospace; max-width: 480px; margin: 0 auto; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; color: #111;">
      <div style="text-align:center; margin-bottom: 12px;">
        <div style="font-size: 20px; font-weight: bold; letter-spacing: 1px;">Lavanderia Sunrise</div>
        <div style="font-size: 12px; color: #6b7280;">Dacanlao, Calaca, Batangas 4212</div>
        <div style="font-size: 12px; color: #6b7280;">0955 921 8921 · zareenans09@gmail.com</div>
      </div>
      <div style="border-top: 1px dashed #d1d5db; margin: 12px 0;"></div>
      <div style="text-align:center; font-size:14px; font-weight:bold; letter-spacing:2px; margin-bottom:4px;">${title.toUpperCase()}</div>
      <div style="text-align:center; font-size:18px; font-weight:bold; margin-bottom:8px;">${order.orderId}</div>
      <div style="border-top: 1px dashed #d1d5db; margin: 12px 0;"></div>

      <div style="margin-bottom:12px;">
        <div style="font-size:10px; color:#9ca3af; text-transform:uppercase; letter-spacing:1px; margin-bottom:6px;">Customer</div>
        <div>${order.customerName}</div>
        <div>${order.contactNumber}</div>
        <div>${order.email}</div>
        <div>${order.address}</div>
      </div>

      <div style="border-top: 1px dashed #d1d5db; margin: 12px 0;"></div>

      <div style="margin-bottom:12px;">
        <div style="font-size:10px; color:#9ca3af; text-transform:uppercase; letter-spacing:1px; margin-bottom:6px;">Service Details</div>
        <div style="display:flex; justify-content:space-between;"><span>Service</span><span>${order.service}</span></div>
        <div style="display:flex; justify-content:space-between;"><span>Weight</span><span>${order.weight} kg</span></div>
        ${order.notes ? `<div style="display:flex; justify-content:space-between;"><span>Notes</span><span>${order.notes}</span></div>` : ""}
      </div>

      <div style="border-top: 1px dashed #d1d5db; margin: 12px 0;"></div>

      <div style="display:flex; justify-content:space-between; font-size:16px; font-weight:bold; margin-bottom:12px;">
        <span>TOTAL</span><span>${totalFormatted}</span>
      </div>

      <div style="border-top: 1px dashed #d1d5db; margin: 12px 0;"></div>

      <div style="text-align:center; margin: 12px 0;">
        <div style="font-size:10px; color:#9ca3af; text-transform:uppercase; letter-spacing:1px; margin-bottom:6px;">Payment Status</div>
        <div style="display:inline-block; font-size:15px; font-weight:bold; padding:4px 20px; border-radius:4px; border: 2px solid ${paymentColor}; color:${paymentColor}; background:${paymentBg};">${paymentText}</div>
      </div>

      <div style="border-top: 1px dashed #d1d5db; margin: 12px 0;"></div>

      <div style="font-size:12px; color:#6b7280;">
        <div style="display:flex; justify-content:space-between;"><span>Date Received</span><span>${dateReceived}</span></div>
      </div>

      <div style="border-top: 1px dashed #d1d5db; margin: 12px 0;"></div>
      <div style="text-align:center; font-size:12px; color:#6b7280;">${note}</div>
    </div>
  `;

  const text = `
${title.toUpperCase()}
Lavanderia Sunrise
Dacanlao, Calaca, Batangas 4212

Order ID: ${order.orderId}
Customer: ${order.customerName}
Contact: ${order.contactNumber}
Address: ${order.address}

Service: ${order.service}
Weight: ${order.weight} kg
Total: ${totalFormatted}
Payment: ${paymentText}
Date Received: ${dateReceived}

${note}
  `;

  if (!transport) {
    console.log(`[Email Disabled] Would send ${type} receipt to ${order.email}`);
    return;
  }

  try {
    await transport.sendMail({
      from: process.env.GMAIL_USER,
      to: order.email,
      subject: `Lavanderia Sunrise – ${title} (${order.orderId})`,
      html,
      text,
    });
    console.log(`✅ Receipt email (${type}) sent to ${order.email}`);
  } catch (error) {
    console.error(`❌ Failed to send receipt email to ${order.email}:`, error);
    throw error;
  }
}

export async function sendOrderStatusEmail(
  email: string,
  customerName: string,
  orderId: string,
  status: string
) {
  const transport = getTransporter();
  if (!transport) {
    console.log(`[Email Disabled] Would send to ${email} - status: ${status}`);
    return;
  }

  const statusMessages: Record<string, { subject: string; message: string }> = {
    requested: {
      subject: "Order Request Received",
      message: `We received your laundry order request ${orderId}. Our staff will review it shortly and you'll receive a confirmation email once it's accepted.`,
    },
    pending: {
      subject: "Order Accepted",
      message: `Your laundry order ${orderId} has been accepted! You may now drop off your clothes at our shop.`,
    },
    received: {
      subject: "Clothes Received",
      message: `Great news! We have received your clothes for order ${orderId}. We'll get started on your laundry right away.`,
    },
    washed: {
      subject: "Laundry Washed",
      message: `Your laundry for order ${orderId} has been washed and is ready for the next step.`,
    },
    ready_for_pickup: {
      subject: "Laundry Ready for Pickup",
      message: `Your laundry for order ${orderId} is ready for pickup! Please collect it at your earliest convenience.`,
    },
    completed: {
      subject: "Order Completed",
      message: `Your laundry order ${orderId} has been completed. Thank you for using our service!`,
    },
  };

  const { subject, message } = statusMessages[status] || {
    subject: "Order Status Updated",
    message: `Your order ${orderId} status has been updated to: ${status}`,
  };

  try {
    await transport.sendMail({
      from: process.env.GMAIL_USER,
      to: email,
      subject: `Laundry Service - ${subject}`,
      html: `
        <h2>Hello ${customerName},</h2>
        <p>${message}</p>
        <p><strong>Order ID:</strong> ${orderId}</p>
        <p>Thank you for using our laundry service!</p>
        <hr>
        <p style="color: #666; font-size: 12px;">This is an automated email. Please do not reply.</p>
      `,
      text: `
Hello ${customerName},

${message}

Order ID: ${orderId}

Thank you for using our laundry service!
      `,
    });

    console.log(`✅ Email sent to ${email} - Status: ${status}`);
  } catch (error) {
    console.error(`❌ Failed to send email to ${email}:`, error);
  }
}
