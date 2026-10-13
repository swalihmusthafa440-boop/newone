import { useState, useEffect, useCallback, useMemo } from 'react'
import { getProducts, getCategories } from '../api/api'
import Header from '../components/Header'
import Footer from '../components/Footer'
import ProductCard from '../components/ProductCard'
import styles from './ProductSelection.module.css'

function normalizeArray(data) {
  if (!data) return []
  if (Array.isArray(data)) return data
  if (Array.isArray(data.results)) return data.results
  if (Array.isArray(data.data)) return data.data
  return []
}

// Category icons for reference-style icon pills
const CATEGORY_ICONS = {
  all: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  ),
  notebooks: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  ),
  pens: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 19l7-7 3 3-7 7-3-3z" />
      <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
      <path d="M2 2l7.586 7.586" />
      <circle cx="11" cy="11" r="2" />
    </svg>
  ),
  office: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  ),
  art: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
      <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
      <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
      <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.563-2.512 5.563-5.563C22 6.5 17.5 2 12 2z" />
    </svg>
  ),
}

export default function ProductSelection() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('')
  const [bannerSlide, setBannerSlide] = useState(0)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const [prodRes, catRes] = await Promise.all([getProducts(), getCategories()])
      setProducts(normalizeArray(prodRes?.data))
      setCategories(normalizeArray(catRes?.data))
    } catch {
      setError('Unable to load products. Please ensure the backend server is running.')
      setProducts([])
      setCategories([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleCategoryClick = useCallback(async (slug) => {
    setActiveCategory(slug)
    setSearch('')
    try {
      setLoading(true)
      const res = await getProducts(slug ? { category: slug } : {})
      setProducts(normalizeArray(res?.data))
    } catch {
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [])

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault()
    // Filters applied via processedProducts useMemo
  }

  const processedProducts = useMemo(() => {
    let list = normalizeArray(products)
    if (search.trim()) {
      const q = search.toLowerCase().trim()
      list = list.filter(
        (p) =>
          (p.name && p.name.toLowerCase().includes(q)) ||
          (p.description && p.description.toLowerCase().includes(q)) ||
          (p.category_name && p.category_name.toLowerCase().includes(q))
      )
    }
    return list
  }, [products, search])

  const safeCategories = normalizeArray(categories)

  return (
    <div className={styles.page}>
      <Header />

      {/* Main Container */}
      <main className={styles.main}>
        {/* Search Bar matching Reference Image Row 2 */}
        <section className={styles.searchSection}>
          <form className={styles.searchForm} onSubmit={handleSearchSubmit}>
            <div className={styles.searchInputWrapper}>
              <svg className={styles.searchLeadingIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                className={styles.searchInput}
                type="text"
                placeholder="Search for stationery, office supplies..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search stationery"
              />
              {search && (
                <button
                  type="button"
                  className={styles.clearSearchBtn}
                  onClick={() => setSearch('')}
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Bright-Blue Square Search Button with Magnifying Glass */}
            <button type="submit" className={styles.searchBtn} aria-label="Search">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
          </form>
        </section>

        {/* Promotional Carousel Banner matching Reference Image */}
        {!search && (
          <section className={styles.bannerSection}>
            <div className={styles.bannerCard}>
              {/* Left arrow */}
              <button
                className={styles.bannerArrowLeft}
                onClick={() => setBannerSlide(prev => (prev === 0 ? 1 : 0))}
                aria-label="Previous promo"
              >
                ‹
              </button>

              <div className={styles.bannerContent}>
                <h2 className={styles.bannerTitle}>
                  Your <br />
                  <strong>Stationery Partner</strong>
                </h2>
                <p className={styles.bannerSubtitle}>
                  {bannerSlide === 0
                    ? 'Great Deals on Quality Products'
                    : 'Premium Pens, Notebooks & Office Supplies'}
                </p>
                <button
                  className={styles.shopNowBtn}
                  onClick={() => {
                    const el = document.getElementById('catalog-grid')
                    el?.scrollIntoView({ behavior: 'smooth' })
                  }}
                >
                  Shop Now →
                </button>
              </div>

              {/* Decorative Visual Illustration */}
              <div className={styles.bannerIllustration}>
                <div className={styles.pencilCupVisual}>
                  <span className={styles.cupEmoji}>✏️</span>
                  <span className={styles.booksEmoji}>📚</span>
                </div>
              </div>

              {/* Right arrow */}
              <button
                className={styles.bannerArrowRight}
                onClick={() => setBannerSlide(prev => (prev === 0 ? 1 : 0))}
                aria-label="Next promo"
              >
                ›
              </button>
            </div>
          </section>
        )}

        {/* Categories Bar matching Reference Horizontal Row */}
        <section className={styles.categoriesBar}>
          <div className={styles.categoriesScroll}>
            {/* "All" button */}
            <button
              className={`${styles.catButton} ${activeCategory === '' ? styles.catButtonActive : ''}`}
              onClick={() => handleCategoryClick('')}
            >
              <div className={styles.catIconWrap}>
                {CATEGORY_ICONS.all}
              </div>
              <span className={styles.catName}>All</span>
            </button>

            {/* Dynamic categories from DB */}
            {safeCategories.map((cat) => {
              const slugLower = (cat.slug || '').toLowerCase()
              let icon = CATEGORY_ICONS.office
              if (slugLower.includes('notebook') || slugLower.includes('paper')) icon = CATEGORY_ICONS.notebooks
              else if (slugLower.includes('pen') || slugLower.includes('pencil')) icon = CATEGORY_ICONS.pens
              else if (slugLower.includes('art') || slugLower.includes('craft')) icon = CATEGORY_ICONS.art

              const isCatActive = activeCategory === cat.slug

              return (
                <button
                  key={cat.id}
                  className={`${styles.catButton} ${isCatActive ? styles.catButtonActive : ''}`}
                  onClick={() => handleCategoryClick(cat.slug)}
                >
                  <div className={styles.catIconWrap}>
                    {icon}
                  </div>
                  <span className={styles.catName}>{cat.name}</span>
                </button>
              )
            })}
          </div>
        </section>

        {/* Catalog Section */}
        <section className={styles.catalogSection} id="catalog-grid">
          {error && (
            <div className={styles.errorBox}>
              <p>{error}</p>
              <button onClick={fetchData} className={styles.retryBtn}>Retry</button>
            </div>
          )}

          {loading && (
            <div className={styles.productsGrid}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={styles.skeletonCard} />
              ))}
            </div>
          )}

          {!loading && !error && (
            <>
              {processedProducts.length === 0 ? (
                <div className={styles.emptyResults}>
                  <span className={styles.emptyEmoji}>🔍</span>
                  <h3>No stationery products found</h3>
                  <p>Try searching with another keyword or explore all categories.</p>
                  <button
                    className={styles.resetBtn}
                    onClick={() => { setSearch(''); handleCategoryClick('') }}
                  >
                    View All Products
                  </button>
                </div>
              ) : (
                <div className={styles.productsGrid}>
                  {processedProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </main>

      <Footer />
    </div>
  )
}
