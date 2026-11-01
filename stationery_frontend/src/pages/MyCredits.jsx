
import { useEffect, useState } from 'react'
import { getMyCredits } from '../api/api'
import Header from '../components/Header'
import Footer from '../components/Footer'
import './MyCredits.css'
import './AdminCredits.css'

const money = (value) =>
  `₹${Number(value || 0).toFixed(2)}`

export default function MyCredits() {
  const [credits, setCredits] = useState([])
  const [totalCredit, setTotalCredit] = useState('0.00')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Load customer's own credit details
  async function loadCredits() {
    setLoading(true)
    setError('')

    try {
      const { data } = await getMyCredits()

      setCredits(data.credits || [])
      setTotalCredit(data.total_credit_amount || '0.00')

    } catch (err) {
      setError(
        err.response?.data?.detail ||
        'Could not load your credit details. Please log in again.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCredits()
  }, [])

  return (
    <div className="my-credits-page">

      <Header />

      <main className="my-credits-container">

        {/* Page Heading */}
        <div className="my-credits-heading">
          <div>
            <p className="my-credits-eyebrow">
              YOUR ACCOUNT
            </p>

            <h1>My Credits</h1>

            <p>
              View your credit details and payment history.
            </p>
          </div>
        </div>

        {/* Total Credit Summary */}
        <section className="my-credit-summary">
          <div>
            <span>Total Credit Amount</span>

            <small>
              Total outstanding customer credit
            </small>
          </div>

          <strong>
            {money(totalCredit)}
          </strong>
        </section>

        {/* Loading */}
        {loading && (
          <p>Loading your credits...</p>
        )}

        {/* Error */}
        {error && (
          <p className="my-credit-error">
            {error}
          </p>
        )}

        {/* Empty State */}
        {!loading && !error && credits.length === 0 && (
          <div className="my-credit-empty">
            <h2>No credit records found</h2>

            <p>
              Your credit purchases will appear here.
            </p>
          </div>
        )}

        {/* Customer Credit List */}
        <div className="my-credit-list">

          {credits.map((credit) => (

            <article
              className="admin-credit-card"
              key={credit.id}
            >

              {/* Customer Information */}
              <div className="admin-credit-card-top">

                <div>

                  <h2>
                    {credit.customer_name || 'Customer'}
                  </h2>

                  <p>
                    {credit.customer_phone || 'No phone number'}
                  </p>

                  <span>
                    Order #{credit.order_id}
                  </span>

                </div>

                {/* Outstanding Amount */}
                <strong className="admin-credit-due">

                  {money(credit.remaining_credit)}

                  <small> outstanding</small>

                </strong>

              </div>

              {/* Credit Amount Details */}
              <div className="admin-credit-amounts">

                <div>
                  <span>Order Amount</span>

                  <strong>
                    {money(credit.order_amount)}
                  </strong>
                </div>

                <div>
                  <span>Initially Paid</span>

                  <strong>
                    {money(credit.amount_paid)}
                  </strong>
                </div>

                <div>
                  <span>Original Credit</span>

                  <strong>
                    {money(credit.credit_amount)}
                  </strong>
                </div>

                <div>
                  <span>Paid Later</span>

                  <strong>
                    {money(credit.total_payments)}
                  </strong>
                </div>

              </div>

              {/* Credit Details */}
              <div className="my-credit-history">

                <h3>
                  Credit Details & Payment History
                </h3>

                <p>
                  Order date:{' '}

                  {credit.order_date
                    ? new Date(
                        credit.order_date
                      ).toLocaleString('en-IN')
                    : 'Not available'}
                </p>

                <p>
                  Current outstanding:{' '}

                  <strong>
                    {money(credit.remaining_credit)}
                  </strong>
                </p>

                <h4>Payments</h4>

                {/* Payment History */}
                {!credit.payments?.length ? (

                  <p>
                    No later payments recorded.
                  </p>

                ) : (

                  <div className="my-credit-payment-list">

                    {credit.payments.map((payment) => (

                      <div
                        className="my-credit-payment"
                        key={payment.id}
                      >

                        <div>

                          <strong>
                            {money(payment.amount)}
                          </strong>

                          <span>
                            {new Date(
                              payment.created_at
                            ).toLocaleDateString('en-IN')}
                          </span>

                        </div>

                        <span className="my-credit-method">

                          {(payment.method || 'cash').toUpperCase()}

                        </span>

                        {payment.received_by_name && (
                          <p>
                            Received by: {payment.received_by_name}
                          </p>
                        )}

                        {payment.notes && (
                          <p>
                            Notes: {payment.notes}
                          </p>
                        )}

                      </div>

                    ))}

                  </div>

                )}

              </div>

            </article>

          ))}

        </div>

      </main>

      <Footer />

    </div>
  )
}
