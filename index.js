const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { google } = require("googleapis");
const credentials = require("./credentials.json"); // your JSON file

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());

// 1️⃣ Auth with Google Sheets API
const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

// 2️⃣ Your Google Sheet ID
const SPREADSHEET_ID = "1xtPDMShzPOzKuIGfCQmRa6KevOM7o7wC0xqCt3Hf_fA";

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

// 5️⃣ Fetch Comments Route (NEW!)
app.get("/comments", async (req, res) => {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "Comments!A:C", // Name | Timestamp | Comment
    });

    const rows = response.data.values || [];

    if (rows.length <= 1) {
      // Assuming first row is headers
      return res.status(200).json({ success: true, comments: [] });
    }

    // Convert to array of objects (skip header)
    const comments = rows.slice(1).map((row) => ({
      name: row[0] || "Anonymous",
      timestamp: row[1] || "",
      comment: row[2] || "",
    }));

    // Newest comments first
    comments.reverse();

    console.log(`📜 Sent ${comments.length} comments to client.`);
    res.status(200).json({ success: true, comments });
  } catch (error) {
    console.error("❌ Error fetching comments:", error);
    res.status(500).json({ success: false, message: "Error fetching comments." });
  }
});

// 6️⃣ Optional: Root Route (so / doesn't show Cannot GET /)
app.get("/", (req, res) => {
  res.send("🚀 Bree's Backend is running! Use /comments to fetch comments in JSON.");
});

// 7️⃣ Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
