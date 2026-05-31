import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

export async function getSheetsClient() {
  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
    const auth = new google.auth.GoogleAuth({
      keyFile: serviceAccountPath,
      scopes: SCOPES,
    });
    return google.sheets({ version: 'v4', auth });
  }

  const oauthClientPath = process.env.GOOGLE_OAUTH_CLIENT || 'credentials/oauth-client.json';
  if (!fs.existsSync(oauthClientPath)) {
    throw new Error(
      `Google 인증 파일이 없습니다. 서비스 계정 JSON은 GOOGLE_APPLICATION_CREDENTIALS에, OAuth client JSON은 ${oauthClientPath}에 두세요.`,
    );
  }

  const credentials = JSON.parse(fs.readFileSync(oauthClientPath, 'utf8'));
  const clientInfo = credentials.installed || credentials.web;
  const oauth2Client = new google.auth.OAuth2(
    clientInfo.client_id,
    clientInfo.client_secret,
    (clientInfo.redirect_uris || ['http://localhost'])[0],
  );

  const tokenPath = process.env.GOOGLE_TOKEN_PATH || '.tokens/google-oauth-token.json';
  if (fs.existsSync(tokenPath)) {
    oauth2Client.setCredentials(JSON.parse(fs.readFileSync(tokenPath, 'utf8')));
    return google.sheets({ version: 'v4', auth: oauth2Client });
  }

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log(`Google 인증 URL:\n${authUrl}\n`);
  const rl = readline.createInterface({ input, output });
  const code = await rl.question('인증 후 표시된 code를 붙여넣으세요: ');
  rl.close();

  const { tokens } = await oauth2Client.getToken(code.trim());
  oauth2Client.setCredentials(tokens);
  fs.mkdirSync(path.dirname(tokenPath), { recursive: true });
  fs.writeFileSync(tokenPath, JSON.stringify(tokens, null, 2));
  return google.sheets({ version: 'v4', auth: oauth2Client });
}
