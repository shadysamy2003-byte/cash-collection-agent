export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { amount, currency, planId, customer } = req.body;

  const secretKey = process.env.PAYMOB_SECRET_KEY;

  if (!secretKey) {
    return res.status(500).json({ error: 'PAYMOB_SECRET_KEY is not configured on server' });
  }

  try {
    const response = await fetch('https://accept.paymob.com/v1/intention/', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amount,
        currency: currency || 'EGP',
        payment_methods: ['card', 'wallet', 'kiosk'],
        billing_data: {
          first_name: customer?.first_name || 'Customer',
          last_name: customer?.last_name || 'Subscriber',
          email: customer?.email || 'customer@example.com',
          phone_number: '+201000000000',
        },
        special_reference: `sub_${planId}_${Date.now()}`,
        items: [
          {
            name: `Subscription Plan: ${planId}`,
            amount: amount,
            description: `SaaS subscription for Cash Collection Agent`,
            quantity: 1,
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Paymob API error:', data);
      return res.status(response.status).json({ error: data.message || 'Paymob order failed' });
    }

    const clientSecret = data.client_secret;
    const publicKey = process.env.PAYMOB_PUBLIC_KEY;
    const paymentUrl = `https://accept.paymob.com/unifiedcheckout/?publicKey=${publicKey}&clientSecret=${clientSecret}`;

    return res.status(200).json({ paymentUrl });
  } catch (error) {
    console.error('Error creating payment:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}