// 0️⃣ Load environment variables
require("dotenv").config();
const { google } = require("googleapis");

// 1️⃣ Setup Google Auth using environment variables
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    // Replace escaped \n with real newlines
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  },
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

// 2️⃣ Spreadsheet ID from your .env
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;

// 3️⃣ Main handler — this works with Vercel's serverless setup
module.exports = async (req, res) => {
  try {
    const { method, url } = req;

    // 📨 Add comment
    if (method === "POST" && url.includes("/add-comment")) {
      const { name, comment } = JSON.parse(req.body || "{}");

      if (!name || !comment) {
        return res.status(400).json({ success: false, message: "Name and comment are required." });
      }

      const timestamp = new Date().toLocaleString();
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: "Comments!A:C", // Name, Timestamp, Comment
        valueInputOption: "RAW",
        resource: { values: [[name, timestamp, comment]] },
      });

      console.log(`✅ Comment added by ${name} at ${timestamp}`);
      return res.status(200).json({ success: true, message: "Comment added successfully!" });
    }

    // 📰 Add newsletter signup
    if (method === "POST" && url.includes("/add-newsletter")) {
      const { name, email, topic } = JSON.parse(req.body || "{}");

      if (!name || !email) {
        return res.status(400).json({ success: false, message: "Name and email are required." });
      }

      const timestamp = new Date().toLocaleString();
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: "Newsletter!A:D", // Name, Timestamp, Email, Topic
        valueInputOption: "RAW",
        resource: { values: [[name, timestamp, email, topic]] },
      });

      console.log(`✅ Newsletter signup added for ${name}`);
      return res.status(200).json({ success: true, message: "Newsletter signup successful!" });
    }

    // 💬 Fetch comments
    if (method === "GET" && url.includes("/comments")) {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: "Comments!A:C",
      });

      const rows = response.data.values || [];
      const comments =
        rows.length > 1
          ? rows
              .slice(1)
              .map((r) => ({
                name: r[0] || "Anonymous",
                timestamp: r[1] || "",
                comment: r[2] || "",
              }))
              .reverse()
          : [];

      console.log(`📜 Sent ${comments.length} comments.`);
      return res.status(200).json({ success: true, comments });
    }

    // 🔍 Default route
    return res.status(200).send("🚀 Bree's Backend is live and connected to Google Sheets!");
  } catch (error) {
    console.error("❌ Server error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
