import { useEffect, useState } from 'react'
import { getCategories, createProduct, updateProduct } from '../api/api'
import { useToast } from '../context/ToastContext'
import styles from './AddProduct.module.css'

function normalizeArray(data) {
  if (!data) return []
  if (Array.isArray(data)) return data
  if (Array.isArray(data.results)) return data.results
  if (Array.isArray(data.data)) return data.data
  return []
}

export default function AddProduct({ productToEdit = null, onClose, onSuccess }) {
  const [name, setName] = useState(productToEdit?.name || '')
  const [description, setDescription] = useState(productToEdit?.description || '')
  const [price, setPrice] = useState(productToEdit?.price ? parseFloat(productToEdit.price).toString() : '')
  const [stock, setStock] = useState(productToEdit?.stock !== undefined ? productToEdit.stock.toString() : '')
  const [category, setCategory] = useState(productToEdit?.category || '')
  const [imageUrl, setImageUrl] = useState(productToEdit?.image_url || '')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(
    productToEdit?.display_image || productToEdit?.image_url || ''
  )
  const [isActive, setIsActive] = useState(productToEdit?.is_active ?? true)
  
  const [categories, setCategories] = useState([])
  const [loadingCats, setLoadingCats] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({})
  
  const toast = useToast()
  const isEditing = Boolean(productToEdit)

  useEffect(() => {
    let isMounted = true
    getCategories()
      .then((res) => {
        if (isMounted) {
          setCategories(normalizeArray(res?.data))
        }
      })
      .catch(() => {
        toast.error('Failed to load categories')
        if (isMounted) setCategories([])
      })
      .finally(() => {
        if (isMounted) setLoadingCats(false)
      })
    return () => { isMounted = false }
  }, [toast])

  const validate = () => {
    const errs = {}
    if (!name.trim()) errs.name = 'Product name is required'
    if (!price || parseFloat(price) <= 0) errs.price = 'Enter a valid positive price'
    if (stock === '' || parseInt(stock, 10) < 0) errs.stock = 'Stock cannot be negative'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    setSubmitting(true)
    setErrors({})


    const payload = new FormData()
      
    payload.append('name', name.trim())
    payload.append('description', description.trim())
    payload.append('price', parseFloat(price).toFixed(2))
    payload.append('stock', parseInt(stock, 10))
    payload.append('is_active', String(isActive))
      
    if (category) {
      payload.append('category', category)
    }
    
    if (imageFile) {
      payload.append('image', imageFile)
    } else if (imageUrl.trim()) {
      payload.append('image_url', imageUrl.trim())
    }


    try {
      if (isEditing) {
        await updateProduct(productToEdit.id, payload)
        toast.success(`"${name}" updated successfully!`)
      } else {
        await createProduct(payload)
        toast.success(`"${name}" added to store! 🎉`)
      }
      if (onSuccess) onSuccess()
      if (onClose) onClose()
    } catch (err) {
      const respData = err.response?.data
      const msg = respData?.detail || (typeof respData === 'object' ? Object.values(respData).flat().join(', ') : 'Failed to save product')
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerTitleWrap}>
            <div className={styles.headerIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>
              </svg>
            </div>
            <div>
              <h2 className={styles.modalTitle}>{isEditing ? 'Edit Product' : 'Add New Product'}</h2>
              <p className={styles.modalSubtitle}>Fill in product details to {isEditing ? 'update' : 'publish to catalog'}</p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <div className={styles.formBody}>
            {/* Product Name */}
            <div className={styles.field}>
              <label className={styles.label}>Product Name *</label>
              <input
                type="text"
                className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (errors.name) setErrors(prev => ({ ...prev, name: '' }))
                }}
                placeholder="e.g. Premium Fountain Pen"
                required
              />
              {errors.name && <span className={styles.errText}>{errors.name}</span>}
            </div>

            {/* Category & Price Row */}
            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>Category</label>
                <select
                  className={styles.select}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={loadingCats}
                >
                  <option value="">-- No Category --</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Price (₹) *</label>
                <input
                  type="number"
                  className={`${styles.input} ${errors.price ? styles.inputError : ''}`}
                  value={price}
                  onChange={(e) => {
                    setPrice(e.target.value)
                    if (errors.price) setErrors(prev => ({ ...prev, price: '' }))
                  }}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required
                />
                {errors.price && <span className={styles.errText}>{errors.price}</span>}
              </div>
            </div>

            {/* Stock & Active Toggle */}
            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>Stock Quantity *</label>
                <input
                  type="number"
                  className={`${styles.input} ${errors.stock ? styles.inputError : ''}`}
                  value={stock}
                  onChange={(e) => {
                    setStock(e.target.value)
                    if (errors.stock) setErrors(prev => ({ ...prev, stock: '' }))
                  }}
                  placeholder="e.g. 50"
                  min="0"
                  required
                />
                {errors.stock && <span className={styles.errText}>{errors.stock}</span>}
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Visibility</label>
                <label className={styles.toggleWrap}>
                  <input
                    type="checkbox"
                    className={styles.checkbox}
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                  />
                  <span className={styles.toggleLabel}>
                    {isActive ? '✅ Active (Visible in Store)' : '❌ Inactive (Hidden)'}
                  </span>
                </label>
              </div>
            </div>

            
            {/* Product Image Upload */}
            <div className={styles.field}>
              <label className={styles.label}>Product Image</label>
                            
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className={styles.input}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                
                  if (!file.type.startsWith('image/')) {
                    toast.error('Please select an image file.')
                    e.target.value = ''
                    return
                  }
                
                  setImageFile(file)
                  setImagePreview(URL.createObjectURL(file))
                  setImageUrl('')
                }}
              />
            
              <span className={styles.previewCaption}>
                Take a photo using your camera or choose an existing image.
              </span>
              
              {imagePreview && (
                <div className={styles.imagePreviewWrap}>
                  <img
                    src={imagePreview}
                    alt="Product preview"
                    className={styles.imagePreview}
                  />
            
                  <button
                    type="button"
                    className={styles.cancelBtn}
                    onClick={() => {
                      setImageFile(null)
                      setImagePreview('')
                      setImageUrl('')
                    }}
                  >
                    Remove Image
                  </button>
                </div>
              )}
            </div>


            {/* Description */}
            <div className={styles.field}>
              <label className={styles.label}>Description</label>
              <textarea
                className={styles.textarea}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed description, features, dimensions, material..."
                rows={4}
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className={styles.modalFooter}>
            <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className={styles.submitBtn} disabled={submitting}>
              {submitting ? (
                <>
                  <span className={styles.spinner} />
                  Saving...
                </>
              ) : isEditing ? (
                'Save Changes'
              ) : (
                '+ Add Product'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}