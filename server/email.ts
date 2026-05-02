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

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; background: #f9f9f9; padding: 20px; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #333; margin: 0;">Lavanderia Sunrise</h2>
        <p style="color: #666; margin: 5px 0;">Dacanlao, Calaca, Batangas 4212</p>
        <p style="color: #666; margin: 5px 0; font-size: 14px;">0955 921 8921 · zareenans09@gmail.com</p>
      </div>
      
      <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #ddd;">
        <h3 style="text-align: center; color: #333; margin-top: 0;">LAUNDRY RECEIPT</h3>
        <div style="text-align: center; font-size: 24px; font-weight: bold; color: #333; margin: 10px 0; border: 2px solid #333; padding: 10px; display: inline-block;">${order.orderId}</div>
        
        <div style="margin: 20px 0;">
          <p><strong>Customer:</strong> ${order.customerName}</p>
          <p><strong>Contact:</strong> ${order.contactNumber}</p>
          <p><strong>Address:</strong> ${order.address}</p>
          <p><strong>Service:</strong> ${order.service}</p>
          <p><strong>Weight:</strong> ${order.weight} kg</p>
          ${order.notes ? `<p><strong>Notes:</strong> ${order.notes}</p>` : ""}
          <p><strong>Received:</strong> ${dateReceived}</p>
        </div>
        
        <div style="text-align: center; margin: 20px 0; padding: 15px; background: ${paymentBg}; border: 2px solid ${paymentColor}; border-radius: 4px;">
          <strong style="color: ${paymentColor}; font-size: 16px;">${paymentText}</strong>
        </div>
        
        <div style="text-align: center; font-size: 20px; font-weight: bold; color: #333; margin: 20px 0;">
          TOTAL: ${totalFormatted}
        </div>
        
        <div style="text-align: center; color: #666; margin-top: 20px;">
          Thank you for choosing Lavanderia Sunrise!
        </div>
      </div>
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
    const result = await transport.sendMail({
      from: process.env.GMAIL_USER,
      to: order.email,
      subject: `Lavanderia Sunrise – Receipt (${order.orderId})`,
      html,
      text,
    });
    console.log(`✅ Receipt email sent to ${order.email} - Message ID: ${result.messageId}`);
  } catch (error) {
    console.error(`❌ Failed to send receipt email to ${order.email}:`, error);
    throw error;
  }
}

export async function sendOrderConfirmedEmail(order: {
  email: string;
  customerName: string;
  orderId: string;
  contactNumber: string;
  address: string;
  service: string;
  weight: string;
  total: string;
  notes: string | null;
  createdAt: Date | string;
}) {
  const transport = getTransporter();
  const totalFormatted = `₱${Number(order.total).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
  const dateReceived = new Date(order.createdAt).toLocaleString("en-PH", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #f9f9f9; padding: 20px; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #333; margin: 0;">Lavanderia Sunrise</h2>
        <p style="color: #666; margin: 5px 0;">Dacanlao, Calaca, Batangas 4212</p>
        <p style="color: #666; margin: 5px 0; font-size: 14px;">0955 921 8921 · zareenans09@gmail.com</p>
      </div>

      <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #ddd;">
        <div style="text-align: center; background: #e8f5e9; border: 2px solid #4caf50; border-radius: 8px; padding: 12px; margin-bottom: 20px;">
          <strong style="color: #2e7d32; font-size: 16px;">✓ Order Confirmed</strong>
        </div>

        <p style="color: #333;">Hi <strong>${order.customerName}</strong>,</p>
        <p style="color: #555;">Your laundry order has been accepted! You may now drop off your clothes at our shop.</p>

        <table style="width:100%;border-collapse:collapse;margin:20px 0;">
          <tr style="background:#f5f5f5;">
            <td style="padding:10px;color:#666;width:40%;">Order ID</td>
            <td style="padding:10px;font-weight:bold;color:#333;">${order.orderId}</td>
          </tr>
          <tr>
            <td style="padding:10px;color:#666;">Service</td>
            <td style="padding:10px;color:#333;">${order.service}</td>
          </tr>
          <tr style="background:#f5f5f5;">
            <td style="padding:10px;color:#666;">Contact</td>
            <td style="padding:10px;color:#333;">${order.contactNumber}</td>
          </tr>
          <tr>
            <td style="padding:10px;color:#666;">Address</td>
            <td style="padding:10px;color:#333;">${order.address}</td>
          </tr>
          ${order.notes ? `
          <tr style="background:#f5f5f5;">
            <td style="padding:10px;color:#666;">Notes</td>
            <td style="padding:10px;color:#333;">${order.notes}</td>
          </tr>` : ""}
          <tr style="background:#f5f5f5;">
            <td style="padding:10px;color:#666;">Date</td>
            <td style="padding:10px;color:#333;">${dateReceived}</td>
          </tr>
          <tr>
            <td style="padding:10px;color:#666;font-weight:bold;">Estimated Total</td>
            <td style="padding:10px;font-weight:bold;color:#333;font-size:16px;">${totalFormatted}</td>
          </tr>
        </table>

        <p style="color:#666;font-size:13px;">The final total may vary based on the actual weight of your laundry.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:20px 0;">
        <p style="color:#999;font-size:12px;text-align:center;">Thank you for choosing Lavanderia Sunrise!</p>
      </div>
    </div>
  `;

  const text = `
ORDER CONFIRMED – Lavanderia Sunrise
Dacanlao, Calaca, Batangas 4212

Hi ${order.customerName},

Your laundry order has been accepted! You may now drop off your clothes at our shop.

Order ID:          ${order.orderId}
Service:           ${order.service}
Contact:           ${order.contactNumber}
Address:           ${order.address}${order.notes ? `\nNotes:             ${order.notes}` : ""}
Date:              ${dateReceived}
Estimated Total:   ${totalFormatted}

The final total may vary based on the actual weight of your laundry.

Thank you for choosing Lavanderia Sunrise!
  `;

  if (!transport) {
    console.log(`[Email Disabled] Would send order confirmation to ${order.email}`);
    return;
  }

  try {
    await transport.sendMail({
      from: process.env.GMAIL_USER,
      to: order.email,
      subject: `Lavanderia Sunrise – Order Confirmed (${order.orderId})`,
      html,
      text,
    });
    console.log(`✅ Order confirmation email sent to ${order.email}`);
  } catch (error) {
    console.error(`❌ Failed to send order confirmation email to ${order.email}:`, error);
  }
}

export async function sendPasswordResetEmail(email: string, customerName: string, resetLink: string) {
  const transport = getTransporter();
  if (!transport) {
    console.log(`[Email Disabled] Would send password reset to ${email} - Link: ${resetLink}`);
    return;
  }
  try {
    await transport.sendMail({
      from: process.env.GMAIL_USER,
      to: email,
      subject: "Lavanderia Sunrise – Password Reset",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>Hi ${customerName},</p>
          <p>We received a request to reset the password for your Lavanderia Sunrise account. Click the button below to set a new password. This link expires in <strong>1 hour</strong>.</p>
          <div style="text-align:center; margin: 28px 0;">
            <a href="${resetLink}" style="background:#4f7df3;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;">Reset My Password</a>
          </div>
          <p style="color:#666;font-size:13px;">If you didn't request this, you can safely ignore this email. Your password will not change.</p>
          <hr style="border:none;border-top:1px solid #eee;margin:20px 0;">
          <p style="color:#999;font-size:12px;">Lavanderia Sunrise · Dacanlao, Calaca, Batangas</p>
        </div>
      `,
      text: `Hi ${customerName},\n\nReset your Lavanderia Sunrise password by visiting:\n${resetLink}\n\nThis link expires in 1 hour. If you didn't request this, ignore this email.\n\nLavanderia Sunrise`,
    });
    console.log(`✅ Password reset email sent to ${email}`);
  } catch (error) {
    console.error(`❌ Failed to send password reset email to ${email}:`, error);
  }
}

export async function sendPriceUpdateEmail(
  email: string,
  customerName: string,
  orderId: string,
  oldTotal: string,
  newTotal: string,
  actualWeight: string
) {
  const transport = getTransporter();
  if (!transport) {
    console.log(`[Email Disabled] Would send price update to ${email} - Order: ${orderId}`);
    return;
  }
  try {
    await transport.sendMail({
      from: process.env.GMAIL_USER,
      to: email,
      subject: `Lavanderia Sunrise – Updated Price for ${orderId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Order Price Updated</h2>
          <p>Hi ${customerName},</p>
          <p>The actual weight of your laundry for order <strong>${orderId}</strong> has been recorded, and your total has been updated accordingly.</p>
          <table style="width:100%;border-collapse:collapse;margin:20px 0;">
            <tr><td style="padding:8px;color:#666;">Actual Weight</td><td style="padding:8px;font-weight:bold;">${actualWeight} kg</td></tr>
            <tr style="background:#f9f9f9;"><td style="padding:8px;color:#666;">Previous Total</td><td style="padding:8px;text-decoration:line-through;color:#999;">₱${Number(oldTotal).toFixed(2)}</td></tr>
            <tr><td style="padding:8px;color:#333;font-weight:bold;">New Total</td><td style="padding:8px;font-weight:bold;color:#333;font-size:16px;">₱${Number(newTotal).toFixed(2)}</td></tr>
          </table>
          <p style="color:#666;font-size:13px;">You can track your order status through our customer portal.</p>
          <hr style="border:none;border-top:1px solid #eee;margin:20px 0;">
          <p style="color:#999;font-size:12px;">Lavanderia Sunrise · Dacanlao, Calaca, Batangas</p>
        </div>
      `,
      text: `Hi ${customerName},\n\nThe actual weight for order ${orderId} has been recorded.\nActual Weight: ${actualWeight} kg\nPrevious Total: ₱${Number(oldTotal).toFixed(2)}\nNew Total: ₱${Number(newTotal).toFixed(2)}\n\nLavanderia Sunrise`,
    });
    console.log(`✅ Price update email sent to ${email}`);
  } catch (error) {
    console.error(`❌ Failed to send price update email to ${email}:`, error);
  }
}

export async function sendWalkInOrderEmail(
  email: string,
  customerName: string,
  orderId: string,
  service: string,
  portalUrl: string
) {
  const transport = getTransporter();
  if (!transport) {
    console.log(`[Email Disabled] Would send walk-in order notification to ${email} - Order: ${orderId}`);
    return;
  }
  try {
    await transport.sendMail({
      from: process.env.GMAIL_USER,
      to: email,
      subject: `Lavanderia Sunrise – Your Order ${orderId} Has Been Created`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Your Laundry Order is Registered</h2>
          <p>Hi ${customerName},</p>
          <p>A laundry order has been created for you at <strong>Lavanderia Sunrise</strong>.</p>
          <table style="width:100%;border-collapse:collapse;margin:20px 0;">
            <tr><td style="padding:8px;color:#666;">Order ID</td><td style="padding:8px;font-weight:bold;">${orderId}</td></tr>
            <tr style="background:#f9f9f9;"><td style="padding:8px;color:#666;">Service</td><td style="padding:8px;">${service}</td></tr>
          </table>
          <p>To track your order online, create a free account using this email address:</p>
          <div style="text-align:center; margin: 24px 0;">
            <a href="${portalUrl}" style="background:#4f7df3;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;">Track My Order</a>
          </div>
          <p style="color:#666;font-size:13px;">Simply sign up with this email address and your order will appear in your dashboard automatically.</p>
          <hr style="border:none;border-top:1px solid #eee;margin:20px 0;">
          <p style="color:#999;font-size:12px;">Lavanderia Sunrise · Dacanlao, Calaca, Batangas</p>
        </div>
      `,
      text: `Hi ${customerName},\n\nYour laundry order ${orderId} (${service}) has been registered at Lavanderia Sunrise.\n\nTo track it online, create a free account with this email at:\n${portalUrl}\n\nYour order will appear in your dashboard automatically.\n\nLavanderia Sunrise`,
    });
    console.log(`✅ Walk-in order email sent to ${email}`);
  } catch (error) {
    console.error(`❌ Failed to send walk-in order email to ${email}:`, error);
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
