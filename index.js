import express from "express";
import dotenv from "dotenv";
import { PayHeroClient } from "payhero-devkit";

dotenv.config();

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Initialize PayHero SDK client
const client = new PayHeroClient({
  authToken: process.env.PAYHERO_AUTH_TOKEN
});

// Serve HTML page
app.get("/", (req, res) => {
  res.send(`
    <html>
      <head>
        <title>PayHero STK Push Test</title>
        <style>
          body {
            font-family: 'Poppins', sans-serif;
            background: linear-gradient(to bottom right, #0077ff, #00c6ff);
            color: #fff;
            text-align: center;
            padding-top: 100px;
          }
          input {
            padding: 10px;
            width: 220px;
            border: none;
            border-radius: 6px;
          }
          button {
            padding: 10px 20px;
            border: none;
            border-radius: 6px;
            background: #fff;
            color: #0077ff;
            cursor: pointer;
            margin-top: 10px;
          }
          button:hover {
            background: #e3e3e3;
          }
          .loading {
            display: none;
            margin-top: 20px;
            font-size: 18px;
          }
          .loader {
            border: 5px solid #f3f3f3;
            border-top: 5px solid #fff;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto;
            margin-top: 15px;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
        <script>
          function showLoading() {
            document.getElementById('loading').style.display = 'block';
          }
        </script>
      </head>
      <body>
        <h1>💸 PayHero STK Push Test</h1>
        <form method="POST" action="/stkpush" onsubmit="showLoading()">
          <input name="phone" placeholder="2547XXXXXXXX" required><br><br>
          <button type="submit">Initialize STK Push</button>
        </form>
        <div id="loading" class="loading">
          <div class="loader"></div>
          <p>Processing STK Push... Please wait</p>
        </div>
      </body>
    </html>
  `);
});

// Handle STK Push
app.post("/stkpush", async (req, res) => {
  const { phone } = req.body;

  try {
    const response = await client.stkPush({
      phone_number: phone,
      amount: 1,
      provider: "m-pesa",
      channel_id: process.env.CHANNEL_ID,
      external_reference: "Test-TX-" + Date.now(),
    });

    res.send(`
      <html>
        <head>
          <style>
            body {
              font-family: 'Poppins', sans-serif;
              background: #e0ffe8;
              text-align: center;
              padding-top: 100px;
              color: #333;
            }
            pre {
              text-align: left;
              width: 70%;
              margin: 20px auto;
              background: #f6f6f6;
              padding: 15px;
              border-radius: 10px;
            }
            a {
              text-decoration: none;
              color: #0077ff;
            }
          </style>
        </head>
        <body>
          <h2>✅ STK Push Sent Successfully</h2>
          <p>Please check your phone for the M-Pesa popup and enter your PIN.</p>
          <pre>${JSON.stringify(response, null, 2)}</pre>
          <a href="/">← Back to Home</a>
        </body>
      </html>
    `);
  } catch (error) {
    console.error(error);
    res.send(`
      <html>
        <head>
          <style>
            body {
              font-family: 'Poppins', sans-serif;
              background: #ffe3e3;
              color: #b30000;
              text-align: center;
              padding-top: 100px;
            }
            a {
              text-decoration: none;
              color: #0077ff;
            }
          </style>
        </head>
        <body>
          <h2>❌ STK Push Failed</h2>
          <p>${error.message}</p>
          <a href="/">← Try Again</a>
        </body>
      </html>
    `);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
