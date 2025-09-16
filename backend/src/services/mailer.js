import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.MAIL_FROM || "no-reply@localhost";

export async function sendOrderConfirmedEmail(order) {
  if (!resend) return;
  await resend.emails.send({
    from: FROM,
    to: order.email,
    subject: `Order received: ${order.id}`,
    html: `
      <h2>Thanks for your order!</h2>
      <p>We’re getting it ready. We’ll email tracking details when it ships.</p>
      <p>Order ID: <b>${order.id}</b></p>
    `,
  });
}

export async function sendOrderShippedEmail(order) {
  if (!resend) return;
  const tracking = order.trackingUrl
    ? `<p>Track your package: <a href="${order.trackingUrl}">${order.trackingUrl}</a></p>`
    : order.trackingNumber
    ? `<p>Tracking number: <b>${order.trackingNumber}</b>${order.carrier ? ` (${order.carrier})` : ""}</p>`
    : `<p>Tracking details will follow shortly.</p>`;
    await resend.emails.send({
        from: FROM, // e.g. "TStore <orders@mail.con-fuoco.co.uk>"
        to: order.email, // or an array: ["customer@example.com"]
        reply_to: "support@mail.con-fuoco.co.uk", // use "replyTo" if your linter prefers camelCase
        subject: `Order received: ${order.id}`,
        text: `Thanks for your order ${order.id}.
      We’re getting it ready and will email tracking when it ships.
      If you have questions, just reply to this email.`,
        html: `
          <h2>Thanks for your order!</h2>
          <p>We’re getting it ready. We’ll email tracking when it ships.</p>
          <p>Order ID: <b>${order.id}</b></p>
          <p>If you have questions, just reply to this email.</p>
        `,
      });
}
