
import { useEffect, useState } from 'react'
import {
  getDeliveryHandover,
  saveDeliveryHandover,
} from '../api/api'
import './DeliveryCashHandover.css'

const money = (value) => `₹${Number(value || 0).toFixed(2)}`

export default function DeliveryCashHandover({ order, onClose }) {
  const orderTotal = Number(order?.total_amount || 0)

  const [name, setName] = useState('')
  const [total, setTotal] = useState(String(orderTotal))
  const [handed, setHanded] = useState('0')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    let active = true

    getDeliveryHandover(order.id)
      .then(({ data }) => {
        if (!active) return
        setName(data.delivery_boy_name || '')
        setTotal(String(data.total_amount ?? orderTotal))
        setHanded(String(data.amount_handed_over ?? 0))
      })
      .catch((err) => {
        if (!active) return
        if (err.response?.status !== 404) {
          setError(
            err.response?.data?.detail ||
            'Could not load the existing handover.'
          )
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [order.id, orderTotal])

  const remaining = Number(total || 0) - Number(handed || 0)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!name.trim()) {
      setError("Enter the delivery person's name.")
      return
    }

    if (Number(total) < 0 || Number(handed) < 0) {
      setError('Amounts cannot be negative.')
      return
    }

    if (Number(handed) > Number(total)) {
      setError('Amount handed over cannot exceed the total amount.')
      return
    }

    setSaving(true)

    try {
      await saveDeliveryHandover(order.id, {
        delivery_boy_name: name.trim(),
        total_amount: total,
        amount_handed_over: handed,
      })
      setSuccess('Delivery cash handover saved successfully.')
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        JSON.stringify(err.response?.data || {}) ||
        'Could not save the handover.'
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="handover-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        className="handover-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="handover-title"
      >
        <div className="handover-heading">
          <div>
            <p>ORDER #{order.id}</p>
            <h2 id="handover-title">Delivery Cash Handover</h2>
          </div>
          <button
            type="button"
            className="handover-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {loading ? (
          <p>Loading handover details...</p>
        ) : (
          <form onSubmit={handleSubmit} className="handover-form">
            <label>Delivery Boy Name</label>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              maxLength={150}
              placeholder="Enter delivery person's name"
            />

            <label>Total Amount (₹)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              required
              value={total}
              onChange={(event) => setTotal(event.target.value)}
            />

            <label>Amount Handed Over (₹)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              required
              value={handed}
              onChange={(event) => setHanded(event.target.value)}
            />

            <div className="handover-balance">
              <span>Remaining Amount</span>
              <strong>{money(remaining)}</strong>
            </div>

            {error && <p className="handover-error">{error}</p>}
            {success && <p className="handover-success">{success}</p>}

            <div className="handover-actions">
              <button
                type="button"
                className="handover-cancel"
                onClick={onClose}
              >
                Close
              </button>
              <button
                type="submit"
                className="handover-save"
                disabled={saving || remaining < 0}
              >
                {saving ? 'Saving...' : 'Save Handover'}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  )
}
