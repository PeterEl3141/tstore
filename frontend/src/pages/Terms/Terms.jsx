import React from 'react';
import './Terms.css';

export default function Terms() {
  return (
    <section className="terms">
      <h1 className="terms-title">Terms and Conditions</h1>

      <p className="terms-text">
        Last updated: <strong>DECEMBER 17, 2025</strong>
      </p>

      <p className="terms-text">
        By using this website and placing an order, you agree to these Terms and Conditions.
      </p>

      <h2 className="terms-heading">1. Who we are</h2>
      <p className="terms-text">
        This website is operated by <strong>CON-FUOCO</strong>. You can contact us at{' '}
        <strong>
          <a href="mailto:contact@con-fuoco.co.uk">contact@con-fuoco.co.uk</a>
        </strong>
        . Business address: <strong>Bron Yr Aur, Blackhills Lane, Swansea, United Kingdom</strong>.
      </p>

      <h2 className="terms-heading">2. Products</h2>
      <p className="terms-text">
        We sell classical-music-themed apparel and related items. Items are produced on demand and shipped to you via our
        print and logistics partner (Gelato) using regional fulfilment where available.
      </p>

      <h2 className="terms-heading">3. Orders and production</h2>
      <p className="terms-text">
        After you place an order, it is sent to production quickly. If you need to change or cancel an order, contact us
        immediately at{' '}
        <strong>
          <a href="mailto:contact@con-fuoco.co.uk">contact@con-fuoco.co.uk</a>
        </strong>
        . We cannot guarantee changes or cancellations once production has started.
      </p>

      <h2 className="terms-heading">4. Prices, taxes, and payment</h2>
      <p className="terms-text">
        Prices are shown at checkout. Any applicable taxes, duties, or import fees may be charged by your country and are
        the customer’s responsibility unless stated otherwise at checkout.
      </p>

      <h2 className="terms-heading">5. Shipping</h2>
      <p className="terms-text">
        Shipping costs are included in the item price unless stated otherwise at checkout. Delivery times are shown at
        checkout and/or in your order confirmation. Delivery estimates are not guarantees and may vary due to carrier
        delays, customs processing, or peak periods.
      </p>

      <h2 className="terms-heading">6. Returns, refunds, and replacements</h2>

      <h3 className="terms-subheading">6.1 Damaged, defective, or incorrect items</h3>
      <p className="terms-text">
        If your item arrives damaged, defective, or incorrect, contact us within <strong>30 days</strong> of delivery at{' '}
        <strong>
          <a href="mailto:contact@con-fuoco.co.uk">contact@con-fuoco.co.uk</a>
        </strong>{' '}
        with your order number and clear photos. We will offer a replacement or refund at no cost to you.
      </p>

      <h3 className="terms-subheading">6.2 Change-of-mind returns (EU/EEA/UK customers)</h3>
      <p className="terms-text">
        If you are a consumer in the EU/EEA/UK, you generally have a <strong>14-day right of withdrawal</strong> for online
        purchases. You may return eligible items within 14 days of delivery without giving a reason. Returned items must
        be unworn, unwashed, and in original condition.
      </p>
      <p className="terms-text">
        To initiate a return, email us and we’ll provide return instructions and the correct return address.{' '}
        <strong>Return shipping costs are your responsibility</strong> unless the item is defective/incorrect. After we
        receive and inspect the return, we will refund the product price using the original payment method. Shipping fees
        are only refunded where required by law.
      </p>

      <h3 className="terms-subheading">6.3 Change-of-mind returns (outside EU/EEA/UK)</h3>
      <p className="terms-text">
        For customers outside the EU/EEA/UK, we do not offer change-of-mind returns as a standard policy due to the cost
        and complexity of international returns for made-to-order goods. If you believe your situation is exceptional,
        contact us and we will review it case-by-case.
      </p>

      <h3 className="terms-subheading">6.4 No return address from our fulfilment partner</h3>
      <p className="terms-text">
        Our fulfilment partner does not provide a general return address for change-of-mind returns. If a return is
        approved, we will provide you with the correct return instructions and address.
      </p>

      <h2 className="terms-heading">7. Intellectual property</h2>
      <p className="terms-text">
        All site content, designs, text, graphics, and branding are owned by Con-fuoco or licensed to us. You may not use,
        reproduce, or distribute our content without permission.
      </p>

      <h2 className="terms-heading">8. Limitation of liability</h2>
      <p className="terms-text">
        To the extent permitted by law, we are not liable for indirect or consequential losses. Nothing in these terms
        limits liability where it would be unlawful to do so (including consumer rights and statutory guarantees).
      </p>

      <h2 className="terms-heading">9. Privacy</h2>
      <p className="terms-text">
        We process personal data in accordance with our Privacy Policy. (Add a link once your Privacy Policy page is live.)
      </p>

      <h2 className="terms-heading">10. Governing law</h2>
      <p className="terms-text">
        These terms are governed by the laws of <strong>The United Kingdom of Great Britain and Northern Ireland</strong>.
        If you are a consumer, you may also benefit from mandatory consumer protections in your country of residence.
      </p>

      <h2 className="terms-heading">11. Contact</h2>
      <p className="terms-text">
        Questions? Email us at{' '}
        <strong>
          <a href="mailto:contact@con-fuoco.co.uk">contact@con-fuoco.co.uk</a>
        </strong>
        .
      </p>
    </section>
  );
}
