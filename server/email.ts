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
    pending: {
      subject: "Order Accepted",
      message: `Your laundry order ${orderId} has been accepted and is pending processing.`,
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
