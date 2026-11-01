
import { useEffect, useState } from 'react'
import {
  getAdminCredits,
  updateCustomerCredit,
  recordCreditPayment,
} from '../api/api'

import './AdminCredits.css'

const money = (v) => `₹${Number(v || 0).toFixed(2)}`

export default function AdminCredits() {
  const [credits, setCredits] = useState([])
  const [totalCredit, setTotalCredit] = useState('0.00')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)
  const [mode, setMode] = useState('')
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('cash')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  async function loadCredits(query = search) {
    setLoading(true)
    setError('')
    try {
      const { data } = await getAdminCredits(
        query.trim() ? { search: query.trim() } : {}
      )
      setCredits(data.credits || [])
      setTotalCredit(data.total_credit_amount || '0.00')
    } catch (err) {
      setError(
        err.response?.data?.detail || 'Could not load customer credits.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCredits('')
    // Load once when the page opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function openForm(credit, selectedMode) {
    setSelected(credit)
    setMode(selectedMode)
    setAmount(
      selectedMode === 'edit'
        ? String(credit.credit_amount)
        : ''
    )
    setMethod('cash')
    setNotes('')
    setMessage('')
  }

  async function submitForm(event) {
    event.preventDefault()
    if (!selected) return

    setSaving(true)
    setMessage('')

    try {
      if (mode === 'edit') {
        await updateCustomerCredit(selected.id, {
          credit_amount: amount,
          amount_paid: selected.amount_paid,
        })
        setMessage('Credit amount updated.')
      } else {
        const { data } = await recordCreditPayment(selected.id, {
          amount,
          method,
          notes,
        })
        setMessage(
          `Payment recorded: ${money(data.payment.amount)}`
        )
      }

      await loadCredits()
      // Refresh the selected credit so the details show the latest balance.
      const refreshed = await getAdminCredits(
        search.trim() ? { search: search.trim() } : {}
      )
      const latest = (refreshed.data.credits || []).find(
        (item) => item.id === selected.id
      )
      if (latest) setSelected(latest)
      setMode('')
      setAmount('')
    } catch (err) {
      setMessage(
        err.response?.data?.detail ||
        JSON.stringify(err.response?.data || {}) ||
        'Could not save changes.'
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="admin-credits-page">
      

      <main className="admin-credits-container">
        <div className="admin-credits-heading">
          <div>
            <p className="admin-credits-eyebrow">FINANCE MANAGEMENT</p>
            <h1>Customer Credits</h1>
            <p>Manage unpaid balances and customer payments.</p>
          </div>
        </div>

        <form
          className="admin-credits-search"
          onSubmit={(event) => {
            event.preventDefault()
            loadCredits(search)
          }}
        >
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by customer name, username, or phone"
          />
          <button type="submit">Search</button>
        </form>

        <section className="admin-credit-summary">
          <div>
            <span>Total Credit Amount</span>
            <small>Total outstanding customer credit</small>
          </div>
          <strong>{money(totalCredit)}</strong>
        </section>

        {error && <p className="admin-credit-error">{error}</p>}
        {message && <p className="admin-credit-message">{message}</p>}
        {loading && <p>Loading credits...</p>}

        {!loading && credits.length === 0 && (
          <div className="admin-credit-empty">
            <h2>No credit records found</h2>
            <p>Credit records will appear here once they are created.</p>
          </div>
        )}

        <div className="admin-credit-list">
          {credits.map((credit) => (
            <article className="admin-credit-card" key={credit.id}>
              <div className="admin-credit-card-top">
                <div>
                  <h2>{credit.customer_name || 'Customer'}</h2>
                  <p>{credit.customer_phone || 'No phone number'}</p>
                  <span>Order #{credit.order_id}</span>
                </div>
                <strong className="admin-credit-due">
                  {money(credit.remaining_credit)}
                  <small> outstanding</small>
                </strong>
              </div>

              <div className="admin-credit-amounts">
                <div>
                  <span>Order Amount</span>
                  <strong>{money(credit.order_amount)}</strong>
                </div>
                <div>
                  <span>Initially Paid</span>
                  <strong>{money(credit.amount_paid)}</strong>
                </div>
                <div>
                  <span>Original Credit</span>
                  <strong>{money(credit.credit_amount)}</strong>
                </div>
                <div>
                  <span>Paid Later</span>
                  <strong>{money(credit.total_payments)}</strong>
                </div>
              </div>

              <div className="admin-credit-actions">
                <button
                  type="button"
                  className="admin-credit-secondary"
                  onClick={() =>
                    setSelected(selected?.id === credit.id ? null : credit)
                  }
                >
                  {selected?.id === credit.id ? 'Hide Details' : 'View Details'}
                </button>
                <button
                  type="button"
                  className="admin-credit-secondary"
                  onClick={() => openForm(credit, 'edit')}
                >
                  Edit Credit
                </button>
                <button
                  type="button"
                  className="admin-credit-primary"
                  disabled={Number(credit.remaining_credit) <= 0}
                  onClick={() => openForm(credit, 'payment')}
                >
                  Record Payment
                </button>
              </div>

              {selected?.id === credit.id && mode === '' && (
                <div className="admin-credit-details">
                  <h3>Credit Details & Payment History</h3>
                  <p>Order date: {credit.order_date
                    ? new Date(credit.order_date).toLocaleString('en-IN')
                    : 'Not available'}</p>
                  <p>Current outstanding: <strong>
                    {money(credit.remaining_credit)}
                  </strong></p>

                  <h4>Payments</h4>
                  {!credit.payments?.length ? (
                    <p>No later payments recorded.</p>
                  ) : (
                    credit.payments.map((payment) => (
                      <div
                        className="admin-credit-payment"
                        key={payment.id}
                      >
                        <span>{money(payment.amount)}</span>
                        <span>{payment.method.toUpperCase()}</span>
                        <span>
                          {new Date(payment.created_at).toLocaleDateString('en-IN')}
                        </span>
                        {payment.notes && <span>{payment.notes}</span>}
                      </div>
                    ))
                  )}
                </div>
              )}

              {selected?.id === credit.id && mode !== '' && (
                <form className="admin-credit-form" onSubmit={submitForm}>
                  <h3>
                    {mode === 'edit' ? 'Edit Credit Amount' : 'Record Customer Payment'}
                  </h3>

                  {mode === 'edit' ? (
                    <>
                      <label>Original credit amount (₹)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        value={amount}
                        onChange={(event) => setAmount(event.target.value)}
                      />
                      <p>
                        Amount paid initially: {money(selected.amount_paid)}.
                        The two amounts must add up to the order amount.
                      </p>
                    </>
                  ) : (
                    <>
                      <label>Payment amount (₹)</label>
                      <input
                        type="number"
                        min="0.01"
                        max={selected.remaining_credit}
                        step="0.01"
                        required
                        value={amount}
                        onChange={(event) => setAmount(event.target.value)}
                      />

                      <label>Payment method</label>
                      <select
                        value={method}
                        onChange={(event) => setMethod(event.target.value)}
                      >
                        <option value="cash">Cash</option>
                        <option value="upi">UPI</option>
                        <option value="other">Other</option>
                      </select>

                      <label>Notes (optional)</label>
                      <input
                        value={notes}
                        maxLength={250}
                        onChange={(event) => setNotes(event.target.value)}
                        placeholder="Payment reference or note"
                      />
                    </>
                  )}

                  <div className="admin-credit-actions">
                    <button
                      type="button"
                      className="admin-credit-secondary"
                      onClick={() => setMode('')}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="admin-credit-primary"
                      disabled={saving}
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </form>
              )}
            </article>
          ))}
        </div>
      </main>

      
    </div>
  )
}
