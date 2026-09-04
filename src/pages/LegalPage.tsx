import React from 'react';

export const LegalPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-12 bg-slate-800/60 p-8 rounded-2xl border border-slate-700 shadow-xl backdrop-blur-sm">
        
        {/* Header */}
        <div className="text-center border-b border-slate-700 pb-6">
          <h1 className="text-3xl font-bold text-blue-400">Terms of Service & Refund Policy</h1>
          <p className="text-sm text-slate-400 mt-2">Last updated: September 2026 | Cash Collection Agent</p>
        </div>

        {/* 1. Refund Policy */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-emerald-400 border-l-4 border-emerald-500 pl-3">
            1. Refund & Cancellation Policy
          </h2>
          <ul className="list-disc list-inside space-y-2 text-slate-300 leading-relaxed pl-2">
            <li>
              <strong>Refund Window:</strong> New subscribers are entitled to request a full refund within <strong>7 calendar days</strong> from the date of the initial subscription payment.
            </li>
            <li>
              <strong>After 7 Days:</strong> All payments become completely non-refundable, as this is a cloud-based digital service providing immediate access to software tools and financial data.
            </li>
            <li>
              <strong>Refund Processing:</strong> Refunds are issued exclusively to the original payment card or method via our payment gateway partner, Paymob, and typically take 5 to 14 business days to process.
            </li>
            <li>
              <strong>Canceling Renewal:</strong> You can turn off auto-renewal at any time through your account settings. Your access will remain active until the end of the current paid billing cycle.
            </li>
          </ul>
        </section>

        {/* 2. Disclaimer */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-amber-400 border-l-4 border-amber-500 pl-3">
            2. Financial Disclaimer
          </h2>
          <div className="bg-amber-950/30 border border-amber-800/60 rounded-xl p-4 text-slate-300 leading-relaxed text-sm">
            <p>
              <strong>Cash Collection Agent</strong> is an operational workflow and organization platform designed for invoice tracking and receivable management. 
              The platform <strong>does not provide certified financial, tax, investment, or legal advice</strong>, and assumes no liability for business collection decisions, manual data entry errors, or market exchange rate fluctuations.
            </p>
          </div>
        </section>

        {/* 3. Payment Processing & Security */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-blue-400 border-l-4 border-blue-500 pl-3">
            3. Payment Processing & Security
          </h2>
          <ul className="list-disc list-inside space-y-2 text-slate-300 leading-relaxed pl-2">
            <li>All electronic card payments are processed securely via <strong>Paymob</strong>, a licensed payment gateway compliant with Central Bank standards.</li>
            <li>Our system never stores or logs your credit card numbers or security codes (CVV) on our servers, adhering strictly to PCI-DSS standards.</li>
            <li>By initiating a payment, you authorize the transfer of necessary transaction parameters to the payment gateway to complete the transaction.</li>
          </ul>
        </section>

        {/* 4. Audit & Dispute Protection */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-purple-400 border-l-4 border-purple-500 pl-3">
            4. Audit Trail & Dispute Protection
          </h2>
          <p className="text-slate-300 leading-relaxed text-sm">
            By subscribing and accepting these terms, you explicitly consent to them. The platform maintains electronic audit logs containing timestamps, IP addresses, and transaction references as conclusive evidence for resolving any commercial or payment dispute.
          </p>
        </section>

      </div>
    </div>
  );
};

export default LegalPage;