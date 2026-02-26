import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { insertSubmission } from "@/lib/db";

export async function POST(request: Request) {
  const body = await request.json();
  const { name, email, phone, projectType, unitType, quality, access, sqft, estimateRange, message } = body;

  if (!name || !email) {
    return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
  }

  // Save to database first (this should always work)
  try {
    await insertSubmission({ name, email, phone, projectType, unitType, quality, access, sqft, estimateRange, message });
    console.log("✓ Submission saved to database");
  } catch (dbError) {
    console.error("Database error:", dbError);
    return NextResponse.json({ error: "Failed to save submission" }, { status: 500 });
  }

  // Try to send emails (don't fail the request if this fails)
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.warn("⚠️ Email credentials not configured");
      return NextResponse.json({ success: true, warning: "Saved but email not sent (credentials missing)" });
    }

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const selectionsHtml = `
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr style="background:#f0f4ff;">
          <td style="padding:10px 14px;font-weight:600;border:1px solid #e2e8f0;">Project Type</td>
          <td style="padding:10px 14px;border:1px solid #e2e8f0;">${projectType || "—"}</td>
        </tr>
        <tr>
          <td style="padding:10px 14px;font-weight:600;border:1px solid #e2e8f0;">Unit Type</td>
          <td style="padding:10px 14px;border:1px solid #e2e8f0;">${unitType || "—"}</td>
        </tr>
        ${quality ? `<tr style="background:#f0f4ff;">
          <td style="padding:10px 14px;font-weight:600;border:1px solid #e2e8f0;">Quality Tier</td>
          <td style="padding:10px 14px;border:1px solid #e2e8f0;">${quality}</td>
        </tr>` : ""}
        ${access ? `<tr>
          <td style="padding:10px 14px;font-weight:600;border:1px solid #e2e8f0;">Unit Access</td>
          <td style="padding:10px 14px;border:1px solid #e2e8f0;">${access}</td>
        </tr>` : ""}
        ${sqft ? `<tr style="background:#f0f4ff;">
          <td style="padding:10px 14px;font-weight:600;border:1px solid #e2e8f0;">Square Footage</td>
          <td style="padding:10px 14px;border:1px solid #e2e8f0;">${sqft === ">1800" ? "> 1,800 sqft" : "< 1,800 sqft"}</td>
        </tr>` : ""}
      </table>
    `;

    const estimateSection = estimateRange
      ? `<div style="background:#ecfdf5;border:2px solid #22c55e;border-radius:12px;padding:20px;text-align:center;margin:16px 0;">
          <p style="font-size:14px;color:#166534;margin:0 0 4px;">Estimated Cost Range</p>
          <p style="font-size:28px;font-weight:700;color:#16a34a;margin:0;">${estimateRange}</p>
        </div>`
      : `<div style="background:#eff6ff;border:2px solid #3b82f6;border-radius:12px;padding:20px;text-align:center;margin:16px 0;">
          <p style="font-size:14px;color:#1e40af;margin:0;">Specialized quote required — team will follow up.</p>
        </div>`;

    const htmlTemplate = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
      <div style="background:linear-gradient(135deg,#2563eb,#1d4ed8);padding:30px;text-align:center;">
        <div style="width:50px;height:50px;background:white;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-weight:700;color:#2563eb;font-size:18px;line-height:50px;">DH</div>
        <h1 style="color:white;margin:12px 0 0;font-size:22px;">DeHart HVAC Quote</h1>
      </div>
      <div style="padding:24px;">
        <h2 style="color:#1e293b;font-size:18px;margin:0 0 16px;">Client Information</h2>
        <p style="margin:4px 0;color:#334155;"><strong>Name:</strong> ${name}</p>
        <p style="margin:4px 0;color:#334155;"><strong>Email:</strong> ${email}</p>
        ${phone ? `<p style="margin:4px 0;color:#334155;"><strong>Phone:</strong> ${phone}</p>` : ""}
        <h2 style="color:#1e293b;font-size:18px;margin:20px 0 8px;">Selections</h2>
        ${selectionsHtml}
        ${estimateSection}
        <p style="color:#64748b;font-size:13px;margin-top:20px;text-align:center;">This is an automated quote from the DeHart HVAC estimator.</p>
      </div>
    </div>`;

    const clientHtml = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
      <div style="background:linear-gradient(135deg,#2563eb,#1d4ed8);padding:30px;text-align:center;">
        <div style="width:50px;height:50px;background:white;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-weight:700;color:#2563eb;font-size:18px;line-height:50px;">DH</div>
        <h1 style="color:white;margin:12px 0 0;font-size:22px;">Your DeHart HVAC Quote</h1>
      </div>
      <div style="padding:24px;">
        <p style="color:#334155;font-size:16px;">Hi ${name},</p>
        <p style="color:#334155;">Thank you for using our quote estimator! Here&rsquo;s a summary of your selections:</p>
        ${selectionsHtml}
        ${estimateSection}
        <p style="color:#334155;margin-top:16px;">${message || ""}</p>
        <p style="color:#334155;">If you have any questions, don&rsquo;t hesitate to reach out. We look forward to working with you!</p>
        <p style="color:#334155;font-weight:600;">— The DeHart HVAC Team</p>
        <p style="color:#94a3b8;font-size:12px;text-align:center;margin-top:24px;">This is an automated message. Please do not reply directly to this email.</p>
      </div>
    </div>`;

    // Send to business
    await transporter.sendMail({
      from: `"DeHart HVAC" <${process.env.EMAIL_USER}>`,
      to: "tecnodael@gmail.com",
      subject: `New HVAC Quote Request from ${name}`,
      html: htmlTemplate,
    });
    console.log("✓ Business email sent");

    // Send confirmation to client
    await transporter.sendMail({
      from: `"DeHart HVAC" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your DeHart HVAC Quote Estimate",
      html: clientHtml,
    });
    console.log("✓ Client email sent");

    return NextResponse.json({ success: true });
  } catch (emailError) {
    console.error("⚠️ Email error:", emailError);
    // Still return success since database save worked
    return NextResponse.json({
      success: true,
      warning: "Saved but email notification failed"
    });
  }
}
