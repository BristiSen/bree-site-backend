// 0️⃣ Load environment variables
require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { google } = require("googleapis");

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());

// 1️⃣ Auth with Google Sheets API using .env secrets
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"), // IMPORTANT: convert \\n to actual line breaks
  },
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

// 2️⃣ Your Google Sheet ID from .env
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;

// 3️⃣ Add Comment Route
app.post("/add-comment", async (req, res) => {
  try {
    const { name, comment } = req.body;
    if (!name || !comment) {
      return res.status(400).json({ success: false, message: "Name and comment are required." });
    }

    const timestamp = new Date().toLocaleString();

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "Comments!A:C", // Name, Timestamp, Comment
      valueInputOption: "RAW",
      resource: {
        values: [[name, timestamp, comment]],
      },
    });

    console.log(`✅ Comment added: ${name} at ${timestamp}`);
    res.status(200).json({ success: true, message: "Comment added!" });
  } catch (error) {
    console.error("❌ Error adding comment:", error);
    res.status(500).json({ success: false, message: "Error adding comment." });
  }
});

// 4️⃣ Newsletter Signup Route
app.post("/add-newsletter", async (req, res) => {
  try {
    const { name, email, topic } = req.body;
    if (!name || !email) {
      return res.status(400).json({ success: false, message: "Name and email are required." });
    }

    const timestamp = new Date().toLocaleString();

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "Newsletter!A:D", // Name, Timestamp, Email, Topic
      valueInputOption: "RAW",
      resource: {
        values: [[name, timestamp, email, topic]],
      },
    });

    console.log(`✅ Newsletter signup added: ${name} at ${timestamp}`);
    res.status(200).json({ success: true, message: "Newsletter signup added!" });
  } catch (error) {
    console.error("❌ Error adding newsletter signup:", error);
    res.status(500).json({ success: false, message: "Error adding newsletter signup." });
  }
});

// 5️⃣ Fetch Comments Route
app.get("/comments", async (req, res) => {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "Comments!A:C",
    });

    const rows = response.data.values || [];
    if (rows.length <= 1) return res.status(200).json({ success: true, comments: [] });

    const comments = rows.slice(1).map((row) => ({
      name: row[0] || "Anonymous",
      timestamp: row[1] || "",
      comment: row[2] || "",
    }));

    comments.reverse(); // newest first

    console.log(`📜 Sent ${comments.length} comments to client.`);
    res.status(200).json({ success: true, comments });
  } catch (error) {
    console.error("❌ Error fetching comments:", error);
    res.status(500).json({ success: false, message: "Error fetching comments." });
  }
});

// 6️⃣ Optional: Root Route
app.get("/", (req, res) => {
  res.send("🚀 Bree's Backend is running! Use /comments to fetch comments in JSON.");
});

// 7️⃣ Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
