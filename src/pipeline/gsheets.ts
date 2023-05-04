import { google, sheets_v4 } from 'googleapis';
import { JWT } from 'google-auth-library';
import * as fs from 'fs';

const privatekey = JSON.parse(fs.readFileSync('gsheet_credentials.json', 'utf8'));

// Configure a JWT auth client
const jwtClient = new JWT(privatekey.client_email, null, privatekey.private_key, [
  'https://www.googleapis.com/auth/spreadsheets'
]);

// Google Sheets API
const spreadsheetId = '1ws0soGn4WRNA78m_fY0GY25yvSbQQ0ONdTx2eRQxfO8';
const sheetName = 'Sheet1!A:F';

const sheets: any = google.sheets('v4');

async function authenticate() {
  try {
    await jwtClient.authorize();
    console.log('Successfully connected!');
  } catch (err) {
    console.log('Error authenticating:', err);
  }
}

async function getValues() {
  try {
    const response = await sheets.spreadsheets.values.get({
      auth: jwtClient,
      spreadsheetId,
      range: sheetName,
    });
    console.log('Movie list from Google Sheets:');
    console.log(response.data.values);
  } catch (err) {
    console.log('The API returned an error: ' + err);
  }
}

export async function appendRow(row: any[]) {
  try {
    const response = await sheets.spreadsheets.values.append({
      auth: jwtClient,
      spreadsheetId,
      range: sheetName,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [row],
      },
    });
  console.log(' ** Appended row to sheet:', `https://docs.google.com/spreadsheets/d/${spreadsheetId}` );
  } catch (err) {
    console.log('Error appending row to sheet:', err);
  }
}

// (async () => {
//   await authenticate();
//   await getValues();
//   await appendRow(['Example Column 1', 'Example Column 2', 'Example Column 3']);
// })();
