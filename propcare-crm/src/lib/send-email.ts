// src/lib/send-email.ts
// يشتغل بدون npm install — بيكلم Resend API مباشرة بـ fetch

const FROM_EMAIL  = process.env.RESEND_FROM_EMAIL  ?? "NOS Portal <onboarding@resend.dev>";
const APP_URL     = process.env.NEXT_PUBLIC_APP_URL ?? "https://your-app.com";

interface NotifEmailParams {
  to:      string;
  name:    string;
  title:   string;
  message: string;
  link?:   string;
  type?:   "TICKET_ASSIGNED" | "TICKET_UPDATED" | "TICKET_RESOLVED" | "MENTION" | "SYSTEM";
}

export async function sendNotificationEmail(params: NotifEmailParams) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[send-email] RESEND_API_KEY not set — skipping email");
    return;
  }

  const { to, name, title, message, link, type = "SYSTEM" } = params;

  const accentMap: Record<string, string> = {
    TICKET_ASSIGNED: "#C9A84C",
    TICKET_UPDATED:  "#3B82F6",
    TICKET_RESOLVED: "#22C55E",
    MENTION:         "#3B82F6",
    SYSTEM:          "#6B7280",
  };
  const accent  = accentMap[type] ?? "#C9A84C";
  const ctaUrl  = link ? `${APP_URL}${link}` : `${APP_URL}/dashboard/notifications`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#0A0A0A;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0A0A;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0"
        style="background:#111111;border-radius:16px;border:1px solid #2A2A2A;overflow:hidden;">
        <tr><td style="background:${accent};height:4px;"></td></tr>
        <tr><td style="padding:28px 32px 0;">
          <table cellpadding="0" cellspacing="0"><tr>
            <td style="width:8px;height:28px;background:${accent};border-radius:3px;"></td>
            <td style="padding-left:10px;font-size:18px;font-weight:700;color:#FFFFFF;">NOS Portal</td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:24px 32px 32px;">
          <p style="margin:0 0 6px;font-size:13px;color:#888888;">Hi ${name},</p>
          <h2 style="margin:0 0 12px;font-size:20px;font-weight:600;color:#FFFFFF;">${title}</h2>
          <p style="margin:0 0 28px;font-size:14px;color:#AAAAAA;line-height:1.6;">${message}</p>
          <a href="${ctaUrl}"
            style="display:inline-block;padding:12px 28px;background:${accent};
                   color:#000000;font-weight:700;font-size:14px;text-decoration:none;border-radius:8px;">
            View Details →
          </a>
        </td></tr>
        <tr><td style="padding:20px 32px;border-top:1px solid #1E1E1E;">
          <p style="margin:0;font-size:11px;color:#555555;">
            This notification was sent automatically by NOS Portal.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method:  "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type":  "application/json",
      },
      body: JSON.stringify({
        from:    FROM_EMAIL,
        to:      [to],
        subject: `[NOS Portal] ${title}`,
        html,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error("[send-email] Resend error:", err);
    }
  } catch (err) {
    console.error("[send-email] Unexpected error:", err);
  }
}
