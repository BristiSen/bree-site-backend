const { google } = require("googleapis");
const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS);


// 1️⃣ Auth with Google Sheets API
const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

// 2️⃣ Spreadsheet ID
const SPREADSHEET_ID = "1xtPDMShzPOzKuIGfCQmRa6KevOM7o7wC0xqCt3Hf_fA";

// Serverless handler
module.exports = async (req, res) => {
  const { method } = req;

  try {
    if (method === "POST" && req.url.includes("/add-comment")) {
      const { name, comment } = JSON.parse(req.body);
      if (!name || !comment) throw new Error("Name and comment required");
      const timestamp = new Date().toLocaleString();
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: "Comments!A:C",
        valueInputOption: "RAW",
        resource: { values: [[name, timestamp, comment]] },
      });
      return res.status(200).send({ success: true });
    }

    if (method === "POST" && req.url.includes("/add-newsletter")) {
      const { name, email, topic } = JSON.parse(req.body);
      if (!name || !email) throw new Error("Name and email required");
      const timestamp = new Date().toLocaleString();
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: "Newsletter!A:D",
        valueInputOption: "RAW",
        resource: { values: [[name, timestamp, email, topic]] },
      });
      return res.status(200).send({ success: true });
    }

    if (method === "GET" && req.url.includes("/comments")) {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: "Comments!A:C",
      });
      const rows = response.data.values || [];
      const comments = rows.slice(1).map((row) => ({
        name: row[0] || "Anonymous",
        timestamp: row[1] || "",
        comment: row[2] || "",
      })).reverse();
      return res.status(200).send({ success: true, comments });
    }

    return res.status(404).send({ success: false, message: "Not found" });
  } catch (err) {
    console.error(err);
    return res.status(500).send({ success: false, message: err.message });
  }
};
