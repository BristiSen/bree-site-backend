// backend/api/index.js
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
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;

// 2️⃣ Serverless function handler
export default async function handler(req, res) {
  try {
    // Parse POST body safely
    let body = {};
    if (req.method === "POST") {
      try {
        body = JSON.parse(req.body || "{}");
      } catch {
        return res.status(400).json({ success: false, message: "Invalid JSON body" });
      }
    }

    // Add Comment
    if (req.method === "POST" && req.url.endsWith("/add-comment")) {
      const { name, comment } = body;
      if (!name || !comment)
        return res.status(400).json({ success: false, message: "Name and comment required" });

      const timestamp = new Date().toLocaleString();
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: "Comments!A:C",
        valueInputOption: "RAW",
        resource: { values: [[name, timestamp, comment]] },
      });

      return res.status(200).json({ success: true, message: "Comment added!" });
    }

    // Add Newsletter
    if (req.method === "POST" && req.url.endsWith("/add-newsletter")) {
      const { name, email, topic } = body;
      if (!name || !email)
        return res.status(400).json({ success: false, message: "Name and email required" });

      const timestamp = new Date().toLocaleString();
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: "Newsletter!A:D",
        valueInputOption: "RAW",
        resource: { values: [[name, timestamp, email, topic]] },
      });

      return res
        .status(200)
        .json({ success: true, message: "Newsletter signup added!" });
    }

    // Fetch Comments
    if (req.method === "GET" && req.url.endsWith("/comments")) {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: "Comments!A:C",
      });

      const rows = response.data.values || [];
      const comments = rows.slice(1).map(row => ({
        name: row[0] || "Anonymous",
        timestamp: row[1] || "",
        comment: row[2] || "",
      })).reverse();

      return res.status(200).json({ success: true, comments });
    }

    // Root /api route fallback
    return res
      .status(200)
      .json({
        success: true,
        message: "🚀 Bree's backend API is alive! Use /add-comment, /add-newsletter, or /comments",
      });
  } catch (err) {
    console.error("❌ Serverless function error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
}
