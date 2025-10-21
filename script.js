document.getElementById("pay").addEventListener("click", async () => {
  const phone = document.getElementById("phone").value.trim();
  const status = document.getElementById("status");

  if (!phone) {
    status.textContent = "Please enter your phone number";
    return;
  }

  status.textContent = "Processing STK Push...";

  try {
    const res = await fetch("/api/stkpush", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });

    const data = await res.json();
    if (data.success) {
      status.textContent = "✅ STK Push sent! Check your phone for the M-Pesa prompt.";
    } else {
      status.textContent = "❌ Failed: " + (data.message || "Unknown error");
    }
  } catch (err) {
    status.textContent = "Error: " + err.message;
  }
});
