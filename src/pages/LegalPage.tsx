export default function LegalPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px', fontFamily: 'sans-serif', lineHeight: '1.6', color: '#cbd5e1' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '30px', color: '#f8fafc' }}>Legal Information & Policies</h1>
      
      {/* 1. Terms of Service */}
      <section style={{ marginBottom: '30px' }}>
        <h2 style={{ color: '#f8fafc' }}>1. Terms of Service</h2>
        <p><strong>Overview:</strong> Cash Collection Agent provides automated cash collection and customer communication tools for businesses. By accessing or using our service at https://cash-collection-agent.vercel.app, you agree to these Terms.</p>
        <p><strong>Merchant of Record:</strong> Our order process is conducted by our online reseller Paddle.com. Paddle.com is the Merchant of Record for all our orders. Paddle provides all customer service inquiries and handles returns.</p>
        <p><strong>Account & Subscription:</strong> Subscriptions are billed on a recurring basis according to your chosen plan and may be cancelled at any time via your dashboard or Paddle receipt.</p>
      </section>

      <hr style={{ border: 'none', borderTop: '1px solid #334155', margin: '20px 0' }} />

      {/* 2. Privacy Policy */}
      <section style={{ marginBottom: '30px' }}>
        <h2 style={{ color: '#f8fafc' }}>2. Privacy Policy</h2>
        <p><strong>Information We Collect:</strong> We collect necessary account details (name and email). Payment data is handled directly and securely by Paddle.com; we never store full credit card details on our servers.</p>
        <p><strong>Usage:</strong> Your information is strictly used to deliver, maintain, and support your use of Cash Collection Agent.</p>
      </section>

      <hr style={{ border: 'none', borderTop: '1px solid #334155', margin: '20px 0' }} />

      {/* 3. Refund & Cancellation Policy */}
      <section style={{ marginBottom: '30px' }}>
        <h2 style={{ color: '#f8fafc' }}>3. Refund and Cancellation Policy</h2>
        <p><strong>Cancellation:</strong> You can cancel your subscription at any time. You will retain access until the end of the current billing cycle.</p>
        <p><strong>Refunds:</strong> All purchases are processed by Paddle.com. We offer full refunds within 14 days of purchase if you encounter technical difficulties. Contact us or Paddle support directly to request assistance.</p>
      </section>

      <hr style={{ border: 'none', borderTop: '1px solid #334155', margin: '20px 0' }} />

      {/* 4. Contact Information */}
      <section>
        <h2 style={{ color: '#f8fafc' }}>4. Contact Us</h2>
        <p>
          If you have any questions regarding these policies, please reach out to us at:{' '}
          <a href="mailto:Shadysamy2003@gmail.com" style={{ color: '#38bdf8', textDecoration: 'underline' }}>
            Cash Collection Support (Shadysamy2003@gmail.com)
          </a>
        </p>
      </section>
    </div>
  );
}