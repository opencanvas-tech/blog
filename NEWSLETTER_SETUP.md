# Newsletter Setup — Google Sheets Backend

This guide walks you through setting up the Google Sheets backend for the blog newsletter form.

## Step 1: Create the Google Sheet

1. Go to [Google Sheets](https://sheets.google.com) and create a new spreadsheet
2. Name it **"OpenCanvas Newsletter Subscribers"**
3. In Row 1, add these column headers:

| A | B | C | D | E |
|---|---|---|---|---|
| Timestamp | Email | Page URL | User Agent | Referrer |

4. Note the spreadsheet ID from the URL: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`

## Step 2: Create the Apps Script

1. In your spreadsheet, go to **Extensions → Apps Script**
2. Delete any existing code and paste the following:

```javascript
function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = {};

    // Parse incoming data (supports both JSON and form-encoded)
    if (e.postData && e.postData.type === 'application/json') {
      data = JSON.parse(e.postData.contents);
    } else if (e.parameter) {
      data = e.parameter;
    }

    // Honeypot check — if the hidden "website" field has a value, it's a bot
    if (data.website) {
      return ContentService
        .createTextOutput(JSON.stringify({ status: 'ok', message: 'Subscribed' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var email = data.email || '';
    var pageUrl = data.pageUrl || '';
    var userAgent = data.userAgent || '';
    var referrer = data.referrer || '';

    // Basic email validation
    if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return ContentService
        .createTextOutput(JSON.stringify({ status: 'error', message: 'Invalid email' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Check for duplicate emails
    var existingEmails = sheet.getRange('B2:B' + sheet.getLastRow()).getValues().flat();
    if (existingEmails.includes(email)) {
      return ContentService
        .createTextOutput(JSON.stringify({ status: 'ok', message: 'Already subscribed' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Append row
    sheet.appendRow([
      new Date(),
      email,
      pageUrl,
      userAgent,
      referrer
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok', message: 'Subscribed' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', message: 'Newsletter endpoint active' }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

3. Click **Save** (Ctrl+S / Cmd+S)

### Restrict permissions to this spreadsheet only

By default, Apps Script may request access to **all** your Google Sheets. To restrict it to only the current spreadsheet:

1. In the Apps Script editor, click the **gear icon** (Project Settings) in the left sidebar
2. Check **"Show 'appsscript.json' manifest file in editor"**
3. Click the `appsscript.json` file in the left sidebar
4. Replace its contents with:

```json
{
  "timeZone": "America/Singapore",
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8",
  "webapp": {
    "executeAs": "USER_DEPLOYING",
    "access": "ANYONE"
  },
  "oauthScopes": [
    "https://www.googleapis.com/auth/spreadsheets.currentonly",
    "https://www.googleapis.com/auth/script.external_request"
  ]
}
```

5. Click **Save**

The key line is `spreadsheets.currentonly` — this tells Google to only grant the script access to the spreadsheet it's bound to, not all spreadsheets in your account. The `script.external_request` scope is needed to serve web responses via `ContentService`.

## Step 3: Deploy as a Web App

1. Click **Deploy → New deployment**
2. Click the gear icon next to "Select type" and choose **Web app**
3. Set:
   - **Description:** Newsletter endpoint
   - **Execute as:** Me
   - **Who has access:** Anyone
4. Click **Deploy**
5. Authorize the app when prompted (review permissions and click Allow)
6. Copy the **Web app URL** — it will look like:
   ```
   https://script.google.com/macros/s/AKfycb.../exec
   ```

## Step 4: Configure the Blog

1. Open `_config.yml` in the blog repository
2. Set the `newsletter_endpoint` value to your Web app URL:
   ```yaml
   newsletter_endpoint: "https://script.google.com/macros/s/AKfycb.../exec"
   ```
3. Commit and push the change

## Step 5: Test

1. Visit the blog and scroll to the newsletter form
2. Enter a test email and click Subscribe
3. Check your Google Sheet — a new row should appear within a few seconds

## Notes

- **IP address:** Google Apps Script does not provide the client's IP address in the `doPost` event. If IP tracking is required, consider placing a Cloudflare Worker or similar proxy in front of the Apps Script endpoint.
- **Rate limiting:** Google Apps Script has a daily quota of ~20,000 URL fetch calls for free accounts. This is more than sufficient for a newsletter signup form.
- **Updating the script:** If you modify the Apps Script code, you must create a **new deployment** (Deploy → New deployment) for changes to take effect. The URL will change, so update `_config.yml` accordingly.
- **CORS:** The form uses `mode: 'no-cors'` when submitting, which means the browser cannot read the response. The form optimistically shows a success message after submission. This is a standard pattern for Google Apps Script integrations.
