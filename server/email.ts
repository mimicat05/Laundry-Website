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

export async function sendReceiptEmail(order: {
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
}) {
  const transport = getTransporter();

  const paymentColor = order.paid ? "#15803d" : "#b91c1c";
  const paymentBg  = order.paid ? "#f0fdf4" : "#fef2f2";
  const paymentText = order.paid ? "✓ PAID" : "✗ UNPAID";
  const totalFormatted = `₱${Number(order.total).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
  const dateReceived = new Date(order.createdAt).toLocaleString("en-PH", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
  const divider = `<div style="text-align:center;color:#9ca3af;letter-spacing:1px;font-size:11px;margin:8px 0;">- - - - - - - - - - - - - - - - - -</div>`;
  const row = (label: string, value: string) =>
    `<div style="display:flex;justify-content:space-between;margin:3px 0;font-size:12px;"><span style="color:#6b7280;">${label}</span><span style="font-weight:500;">${value}</span></div>`;

  const html = `
    <div style="font-family:'Courier New',Courier,monospace;max-width:360px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:20px;color:#111;">
      <div style="text-align:center;margin-bottom:10px;">
        <div style="font-size:17px;font-weight:bold;letter-spacing:1px;">Lavanderia Sunrise</div>
        <div style="font-size:11px;color:#6b7280;">Dacanlao, Calaca, Batangas 4212</div>
        <div style="font-size:11px;color:#6b7280;">0955 921 8921 · zareenans09@gmail.com</div>
      </div>
      ${divider}
      <div style="text-align:center;font-size:11px;font-weight:bold;letter-spacing:2px;margin-bottom:6px;">LAUNDRY RECEIPT</div>
      <div style="text-align:center;font-size:22px;font-weight:bold;letter-spacing:2px;border:2px solid #111;padding:6px;margin-bottom:6px;">${order.orderId}</div>
      ${divider}
      ${row("Customer:", order.customerName)}
      ${row("Contact:", order.contactNumber)}
      ${row("Address:", order.address)}
      ${row("Service:", order.service)}
      ${row("Weight:", order.weight + " kg")}
      ${order.notes ? row("Notes:", order.notes) : ""}
      ${row("Received:", dateReceived)}
      ${divider}
      ${row("TOTAL:", totalFormatted)}
      <div style="text-align:center;margin:8px 0;">
        <span style="display:inline-block;font-size:13px;font-weight:bold;padding:3px 16px;border-radius:4px;border:2px solid ${paymentColor};color:${paymentColor};background:${paymentBg};">${paymentText}</span>
      </div>
      ${divider}
      <div style="text-align:center;font-size:11px;color:#9ca3af;">Thank you for choosing Lavanderia Sunrise!</div>
    </div>
  `;

  const text = `
LAUNDRY RECEIPT – Lavanderia Sunrise
Dacanlao, Calaca, Batangas 4212

Order:    ${order.orderId}
Customer: ${order.customerName}
Contact:  ${order.contactNumber}
Address:  ${order.address}
Service:  ${order.service}
Weight:   ${order.weight} kg${order.notes ? `\nNotes:    ${order.notes}` : ""}
Received: ${dateReceived}

TOTAL:    ${totalFormatted}
Payment:  ${paymentText}

Thank you for choosing Lavanderia Sunrise!
  `;

  if (!transport) {
    console.log(`[Email Disabled] Would send receipt to ${order.email}`);
    return;
  }

  try {
    await transport.sendMail({
      from: process.env.GMAIL_USER,
      to: order.email,
      subject: `Lavanderia Sunrise – Receipt (${order.orderId})`,
      html,
      text,
    });
    console.log(`✅ Receipt email sent to ${order.email}`);
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
