import fetch from 'node-fetch';
import express from 'express';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { phone_number, amount } = req.body;
    
    // Validate required fields
    if (!phone_number || !amount) {
      return res.status(400).json({ 
        error: 'Phone number and amount are required' 
      });
    }

    // Validate phone number format (Kenyan)
    const phoneRegex = /^254[17]\d{8}$/;
    if (!phoneRegex.test(phone_number)) {
      return res.status(400).json({ 
        error: 'Invalid phone number format. Use format: 2547XXXXXXX' 
      });
    }

    // Validate amount
    const amountNum = parseInt(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return res.status(400).json({ 
        error: 'Amount must be a positive number' 
      });
    }

    // Prepare PayHero API request payload 
    const payload = {
      amount: amountNum,
      phone_number: phone_number,
      channel_id: parseInt(process.env.PAYHERO_ACCOUNT_ID || '3342'),
      provider: "m-pesa",
      external_reference: `INV-${Date.now()}`,
      customer_name: "Customer",
      callback_url: process.env.CALLBACK_URL || "https://test2-1-trtq.onrender.com/"
    };

    console.log('Sending request to PayHero:', JSON.stringify(payload, null, 2));

    // Make request to PayHero API 
    const response = await fetch('https://backend.payhero.co.ke/api/v2/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': process.env.PAYHERO_BASIC_AUTH || 'Basic djM0QlPUTzA1UXg4TllqWW5DSVQ6UENUZHVZR3BicjJyOUFlNnhXdDlZQlVyUWdOUWhyTVM1dlJJVVXUdW=='
      },
      body: JSON.stringify(payload)
    });

    // Get raw response text first
    const rawResponse = await response.text();
    console.log('PayHero raw response:', rawResponse);
    console.log('PayHero response status:', response.status);

    // Try to parse as JSON, fallback to raw text
    let responseData;
    try {
      responseData = JSON.parse(rawResponse);
    } catch (parseError) {
      console.log('Response is not JSON, returning raw text');
      return res.status(200).json({
        raw: rawResponse,
        success: false,
        error: 'Invalid JSON response from PayHero'
      });
    }

    // Return the exact PayHero response
    return res.status(response.status).json(responseData);

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error: ' + error.message
    });
  }
});

export default router;
