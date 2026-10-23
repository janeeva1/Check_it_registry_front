// Cards are never typed into Prove Ownership: every payment opens Paystack's
// secure page, which handles the card. This page used to collect full card
// numbers and CVVs and store a made-up token, which was neither useful nor safe.
import { Link } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { Layout } from '../components/Layout'

export default function PaymentMethodSelection() {
  return (
    <Layout requireAuth>
      <div className="po-page po-single" style={{ maxWidth: 560 }}>
        <section className="po-card po-center-card">
          <Lock size={40} className="po-text-success" aria-hidden="true" />
          <h1 className="po-card-title">You don't need to save a card</h1>
          <p className="po-card-text">When you pay for a check, a report or a marketplace item, Paystack's secure page opens and you pay with card, bank transfer or USSD there. Your card details never touch Prove Ownership.</p>
          <div className="po-quiet-links" style={{ justifyContent: 'center' }}>
            <Link to="/payments/transactions">See your payments</Link>
            <Link to="/business/payout-settings">Bank account for payouts</Link>
          </div>
        </section>
      </div>
    </Layout>
  )
}
