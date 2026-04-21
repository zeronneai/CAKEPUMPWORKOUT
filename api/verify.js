import { google } from 'googleapis';

async function getSheet() {
  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return google.sheets({ version: 'v4', auth });
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ valid: false, error: 'token is required' });
  }

  const sheets = await getSheet();
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  // Read all rows from Hoja 1
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Hoja 1!A:F',
  });

  const rows = response.data.values ?? [];

  // columns: 0=name, 1=phone, 2=email, 3=goal, 4=token, 5=confirmed
  const rowIndex = rows.findIndex((row) => row[4] === token);

  if (rowIndex === -1) {
    return res.status(200).json({ valid: false });
  }

  // Mark confirmed=true (column F = index 5, Sheets col F)
  // rowIndex is 0-based; Sheets rows are 1-based
  const sheetRow = rowIndex + 1;

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `Hoja 1!F${sheetRow}`,
    valueInputOption: 'RAW',
    requestBody: { values: [['true']] },
  });

  return res.status(200).json({ valid: true });
}
