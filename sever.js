import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import fetch from "node-fetch";
import fs from "fs-extra";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 5000;
const LOG_FILE = "transactions.json";

// Ensure log file exists
if (!fs.existsSync(LOG_FILE)) fs.writeJsonSync(LOG_FILE, []);

// ✅ Serve frontend
app.get("/", (req, res) => {
  res.sendFile(process.cwd() + "/index.html");
});

// ✅ STK PUSH route
app.post("/pay", async (req, res) => {
  const { phone, amount } = req.body;
  if (!phone || !amount) return res.status(400).json({ success: false, message: "Phone and amount required." });

  try {
    const response = await fetch(`${process.env.PAYHERO_BASE_URL}/v1/stkpush`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "API-KEY": process.env.PAYHERO_API_KEY,
        "API-SECRET": process.env.PAYHERO_API_SECRET
      },
      body: JSON.stringify({
        merchant_id: process.env.PAYHERO_MERCHANT_ID,
        phone,
        amount,
        reference: "TestPayment",
        description: "STK Push Test via PayHero",
        callback_url: "https://webhook.site/your-callback-url"
      })
    });

    const data = await response.json();
    console.log("PayHero Response:", data);

    // Log every transaction
    const logData = {
      date: new Date().toISOString(),
      phone,
      amount,
      status: data.status || "failed",
      message: data.message || "No message"
    };
    const logs = await fs.readJson(LOG_FILE);
    logs.push(logData);
    await fs.writeJson(LOG_FILE, logs, { spaces: 2 });

    if (data.status === "success") {
      res.json({ success: true, message: "✅ STK Push sent. Check your phone to complete payment." });
    } else {
      res.json({ success: false, message: data.message || "❌ Failed to send STK Push." });
    }
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ success: false, message: "Server error occurred." });
  }
});

// ✅ Admin dashboard (secured with password)
app.get("/admin", (req, res) => {
  const password = req.query.pass;
  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(403).send("<h2>Access Denied 🔒</h2>");
  }

  const logs = fs.readJsonSync(LOG_FILE);
  let html = `
  <html>
  <head>
    <title>Admin Dashboard | BERA TECH</title>
    <style>
      body { font-family: Arial; background:#0d1117; color:#fff; padding:20px; }
      table { width:100%; border-collapse:collapse; background:#161b22; }
      th, td { border:1px solid #222; padding:10px; text-align:left; }
      th { background:#00a859; color:white; }
      tr:nth-child(even) { background:#1f2937; }
    </style>
  </head>
  <body>
    <h1>💳 Transaction Logs</h1>
    <table>
      <tr><th>Date</th><th>Phone</th><th>Amount</th><th>Status</th><th>Message</th></tr>
      ${logs.map(l => `<tr>
        <td>${l.date}</td><td>${l.phone}</td><td>${l.amount}</td><td>${l.status}</td><td>${l.message}</td>
      </tr>`).join("")}
    </table>
  </body>
  </html>
  `;
  res.send(html);
});

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
