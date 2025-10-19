const { google } = require("googleapis");

// 1️⃣ Auth with Google Sheets API using env variables
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  },
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

// 2️⃣ Spreadsheet ID
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;

// 3️⃣ Serverless handler
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

      return res.status(200).json({ success: true, message: "Comment added!" });
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

      return res.status(200).json({ success: true, message: "Newsletter signup added!" });
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

      return res.status(200).json({ success: true, comments });
    }

    return res.status(404).json({ success: false, message: "Not found" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
