import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { phone, amount } = req.body;

  if (!phone || !amount) {
    return res.status(400).json({ error: "Phone and amount required" });
  }

  try {
    const response = await fetch(process.env.PAYHERO_BASE_URL, {
      method: "POST",
      headers: {
        Authorization: process.env.PAYHERO_BASIC_AUTH,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount,
        msisdn: phone,
        account_id: process.env.PAYHERO_ACCOUNT_ID,
        callback_url: "https://test2-peach-iota.vercel.app/",
        narrative: "Test Payment",
      }),
    });

    const text = await response.text(); // capture raw response
    console.log("PayHero raw response:", text);

    try {
      const data = JSON.parse(text);
      return res.status(200).json(data);
    } catch {
      return res.status(200).json({ raw: text });
    }
  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({ error: "STK push failed", details: err.message });
  }
}
