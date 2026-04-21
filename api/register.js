import { v4 as uuidv4 } from 'uuid';
import { google } from 'googleapis';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

async function getSheet() {
  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const sheets = google.sheets({ version: 'v4', auth });
  return sheets;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, phone, email, goal } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'name and email are required' });
  }

  const token = uuidv4();
  const confirmed = false;

  // Save to Google Sheets
  const sheets = await getSheet();
  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Sheet1!A:F',
    valueInputOption: 'RAW',
    requestBody: {
      values: [[name, phone ?? '', email, goal ?? '', token, confirmed]],
    },
  });

  // Send confirmation email via Resend
  const domain = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'https://cakepumpworkout.com';

  const courseLink = `${domain}/curso.html?token=${token}`;

  await resend.emails.send({
    from: 'Cake Pump Workout <noreply@cakepumpworkout.com>',
    to: email,
    subject: '¡Tu acceso a Cake Pump Workout está listo! 🍑🔥',
    html: `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#0C0509;font-family:'Helvetica Neue',Arial,sans-serif;color:#fff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0C0509;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#160B12;border-radius:20px;overflow:hidden;border:1px solid rgba(232,82,106,0.2);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#C93055,#E8526A);padding:36px 40px;text-align:center;">
              <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:28px;font-weight:900;letter-spacing:4px;color:#fff;">
                CAKE<span style="color:#FFD580;">PUMP</span>
              </div>
              <div style="font-size:12px;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.75);margin-top:4px;">
                WORKOUT — Acceso Exclusivo
              </div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <p style="font-size:22px;font-weight:700;margin:0 0 8px;">Hola, ${name} 👋</p>
              <p style="font-size:15px;color:rgba(255,255,255,0.7);margin:0 0 28px;line-height:1.6;">
                Tu acceso al programa <strong style="color:#E8526A;">Cake Pump Workout</strong> ya está activo. Estás a un clic de comenzar tu transformación.
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0 32px;">
                    <a href="${courseLink}"
                       style="display:inline-block;background:linear-gradient(135deg,#E8526A,#C93055);color:#fff;text-decoration:none;font-size:16px;font-weight:700;letter-spacing:0.5px;padding:16px 40px;border-radius:100px;box-shadow:0 8px 30px rgba(200,48,85,0.4);">
                      Acceder al programa →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <hr style="border:none;border-top:1px solid rgba(255,255,255,0.07);margin:0 0 28px;">

              <!-- Features -->
              <p style="font-size:13px;text-transform:uppercase;letter-spacing:2px;color:#E8526A;margin:0 0 16px;font-weight:700;">Qué encuentras en el programa</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:6px 0;font-size:14px;color:rgba(255,255,255,0.8);">✓ &nbsp;40+ videos de entrenamiento HD</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;font-size:14px;color:rgba(255,255,255,0.8);">✓ &nbsp;8 semanas de programa estructurado</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;font-size:14px;color:rgba(255,255,255,0.8);">✓ &nbsp;Guía nutricional completa</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;font-size:14px;color:rgba(255,255,255,0.8);">✓ &nbsp;Acceso de por vida, sin mensualidad</td>
                </tr>
              </table>

              <!-- Link fallback -->
              <div style="margin-top:28px;padding:16px;background:rgba(255,255,255,0.04);border-radius:10px;border:1px solid rgba(255,255,255,0.07);">
                <p style="font-size:12px;color:rgba(255,255,255,0.4);margin:0 0 6px;">¿El botón no funciona? Copia este enlace en tu navegador:</p>
                <p style="font-size:12px;color:#E8526A;margin:0;word-break:break-all;">${courseLink}</p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid rgba(255,255,255,0.07);text-align:center;">
              <p style="font-size:12px;color:rgba(255,255,255,0.3);margin:0 0 4px;">Cake Pump Workout · by Brenda Jazmín · @brendaa_jazmin</p>
              <p style="font-size:11px;color:rgba(255,255,255,0.2);margin:0;">© ${new Date().getFullYear()} Todos los derechos reservados.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  });

  return res.status(200).json({ success: true });
}
