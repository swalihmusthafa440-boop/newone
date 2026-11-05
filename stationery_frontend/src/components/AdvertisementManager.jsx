import { useEffect, useState } from 'react'
import {
  getAdvertisements,
  createAdvertisement,
  updateAdvertisement,
  deleteAdvertisement
} from '../api/api'

import styles from './AdvertisementManager.module.css'

export default function AdvertisementManager() {
  const [ads, setAds] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [editingId, setEditingId] = useState(null)
  const [title, setTitle] = useState('')
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState('')
  const [displayOrder, setDisplayOrder] = useState(0)
  const [isActive, setIsActive] = useState(true)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const loadAds = async () => {
    setLoading(true)

    try {
      const response = await getAdvertisements()
      const data = response.data

      setAds(
        Array.isArray(data)
          ? data
          : data.results || []
      )
    } catch (error) {
      console.error(error)
      alert('Failed to load advertisements')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAds()
  }, [])

  const resetForm = () => {
    setEditingId(null)
    setTitle('')
    setImage(null)
    setPreview('')
    setDisplayOrder(0)
    setIsActive(true)
    setStartDate('')
    setEndDate('')
  }

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]

    if (!file) return

    setImage(file)
    setPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!editingId && !image) {
      alert('Please select an advertisement image')
      return
    }

    const formData = new FormData()

    formData.append('title', title)
    formData.append('is_active', isActive)
    formData.append('display_order', displayOrder)

    if (image) {
      formData.append('image', image)
    }

    if (startDate) {
      formData.append('start_date', new Date(startDate).toISOString())
    }

    if (endDate) {
      formData.append('end_date', new Date(endDate).toISOString())
    }

    setSaving(true)

    try {
      if (editingId) {
        await updateAdvertisement(editingId, formData)
        alert('Advertisement updated successfully')
      } else {
        await createAdvertisement(formData)
        alert('Advertisement uploaded successfully')
      }

      resetForm()
      await loadAds()

    } catch (error) {
      console.error(error)
      alert(
        error.response?.data
          ? JSON.stringify(error.response.data)
          : 'Failed to save advertisement'
      )
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (ad) => {
    setEditingId(ad.id)
    setTitle(ad.title || '')
    setPreview(ad.image_url || ad.image || '')
    setImage(null)
    setDisplayOrder(ad.display_order)
    setIsActive(ad.is_active)

    setStartDate(
      ad.start_date
        ? new Date(ad.start_date).toISOString().slice(0, 16)
        : ''
    )

    setEndDate(
      ad.end_date
        ? new Date(ad.end_date).toISOString().slice(0, 16)
        : ''
    )

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this advertisement?')) return

    try {
      await deleteAdvertisement(id)

      setAds(prev => prev.filter(ad => ad.id !== id))

      if (editingId === id) {
        resetForm()
      }

    } catch (error) {
      console.error(error)
      alert('Failed to delete advertisement')
    }
  }

  const handleToggle = async (ad) => {
    const formData = new FormData()
    formData.append('is_active', !ad.is_active)

    try {
      await updateAdvertisement(ad.id, formData)

      setAds(prev =>
        prev.map(item =>
          item.id === ad.id
            ? { ...item, is_active: !ad.is_active }
            : item
        )
      )

    } catch (error) {
      console.error(error)
      alert('Failed to update advertisement')
    }
  }

  return (
    <div className={styles.container}>

      <div className={styles.header}>
        <div>
          <h2>Advertisement Management</h2>
          <p>Manage homepage promotional banners</p>
        </div>

        <button onClick={loadAds}>
          ↻ Refresh
        </button>
      </div>

      <form
        className={styles.form}
        onSubmit={handleSubmit}
      >

        <h3>
          {editingId ? 'Edit Advertisement' : 'Upload Advertisement'}
        </h3>

        <label>Advertisement Title</label>

        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Summer Sale"
        />

        <label>Banner Image</label>

        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          required={!editingId}
        />

        {preview && (
          <img
            src={preview}
            alt="Advertisement preview"
            className={styles.preview}
          />
        )}

        <label>Display Order</label>

        <input
          type="number"
          min="0"
          value={displayOrder}
          onChange={e => setDisplayOrder(e.target.value)}
        />

        <label>Start Date</label>

        <input
          type="datetime-local"
          value={startDate}
          onChange={e => setStartDate(e.target.value)}
        />

        <label>End Date</label>

        <input
          type="datetime-local"
          value={endDate}
          onChange={e => setEndDate(e.target.value)}
        />

        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={isActive}
            onChange={e => setIsActive(e.target.checked)}
          />
          Active Advertisement
        </label>

        <div className={styles.actions}>
          <button
            type="submit"
            disabled={saving}
          >
            {saving
              ? 'Saving...'
              : editingId
                ? 'Update Advertisement'
                : 'Upload Advertisement'}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className={styles.cancel}
            >
              Cancel
            </button>
          )}
        </div>

      </form>

      <div className={styles.list}>
        <h3>All Advertisements ({ads.length})</h3>

        {loading ? (
          <p>Loading advertisements...</p>
        ) : ads.length === 0 ? (
          <p>No advertisements uploaded yet.</p>
        ) : (
          ads.map(ad => (
            <div
              key={ad.id}
              className={styles.adCard}
            >
              <img
                src={ad.image_url || ad.image}
                alt={ad.title || 'Advertisement'}
              />

              <div className={styles.details}>
                <strong>{ad.title || `Advertisement #${ad.id}`}</strong>

                <span>
                  Order: {ad.display_order}
                </span>

                <span>
                  {ad.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className={styles.cardActions}>
                <button onClick={() => handleEdit(ad)}>
                  Edit
                </button>

                <button onClick={() => handleToggle(ad)}>
                  {ad.is_active ? 'Deactivate' : 'Activate'}
                </button>

                <button
                  className={styles.delete}
                  onClick={() => handleDelete(ad.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  )
}