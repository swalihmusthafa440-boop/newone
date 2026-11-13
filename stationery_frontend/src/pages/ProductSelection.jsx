import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { getProducts, getCategories, getActiveAdvertisements } from '../api/api'
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

const CATEGORY_ICONS = {
  all: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  ),
  notebooks: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  ),
  pens: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 19l7-7 3 3-7 7-3-3z" />
      <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
      <path d="M2 2l7.586 7.586" />
      <circle cx="11" cy="11" r="2" />
    </svg>
  ),
  office: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  ),
  art: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="13.5" cy="6.5" r=".5" />
      <circle cx="17.5" cy="10.5" r=".5" />
      <circle cx="8.5" cy="7.5" r=".5" />
      <circle cx="6.5" cy="12.5" r=".5" />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.563-2.512 5.563-5.563C22 6.5 17.5 2 12 2z" />
    </svg>
  ),
}

function getAdvertisementImage(ad) {
  const image = ad.image_url || ad.image;
  if (!image) return '';
  if (/^https?:\/\//i.test(image)) {
    return image;
  }
  if (image.startsWith('/media/')) {
    return image;
    }
    return `/media/${image.replace(/^\/+/, '')}`;
}



export default function ProductSelection() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('')

  const [advertisements, setAdvertisements] = useState([])
  const [adIndex, setAdIndex] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const touchStartX = useRef(null)




  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      const [prodRes, catRes] = await Promise.all([
        getProducts(),
        getCategories(),
      ])

      setProducts(normalizeArray(prodRes?.data))
      setCategories(normalizeArray(catRes?.data))
    } catch (err) {
      console.error(err)
      setError('Unable to load products. Please ensure the backend server is running.')
      setProducts([])
      setCategories([])
    } finally {
      setLoading(false)
    }
  }, [])


  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 600px)')

    const handleScreenChange = (event) => {
      setIsMobile(event.matches)
      setAdIndex(0)
    }

    setIsMobile(mediaQuery.matches)

    mediaQuery.addEventListener('change', handleScreenChange)

    return () => {
      mediaQuery.removeEventListener('change', handleScreenChange)
    }
  }, [])


  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    const fetchAdvertisements = async () => {
      try {
        const response = await getActiveAdvertisements()
        setAdvertisements(normalizeArray(response?.data))
        setAdIndex(0)
      } catch (err) {
        console.error('Advertisement loading failed:', err)
        setAdvertisements([])
      }
    }

    fetchAdvertisements()
  }, [])

  const handleCategoryClick = useCallback(async (slug) => {
    setActiveCategory(slug)
    setSearch('')

    try {
      setLoading(true)
      setError('')

      const response = await getProducts(slug ? { category: slug } : {})
      setProducts(normalizeArray(response?.data))
    } catch (err) {
      console.error(err)
      setProducts([])
      setError('Unable to load products for this category.')
    } finally {
      setLoading(false)
    }
  }, [])

  const adsPerView = isMobile ? 1 : 2
  
  const maxAdIndex = Math.max(
    0,
    advertisements.length - adsPerView
  )
  
  const showNextAds = () => {
    setAdIndex((current) =>
      Math.min(maxAdIndex, current + adsPerView)
    )
  }
  
  const showPreviousAds = () => {
    setAdIndex((current) =>
      Math.max(0, current - adsPerView)
    )
  }

  const handleAdTouchStart = (event) => {
    touchStartX.current = event.touches[0].clientX
  }

  const handleAdTouchEnd = (event) => {
    if (touchStartX.current === null) return

    const difference = touchStartX.current - event.changedTouches[0].clientX

    if (Math.abs(difference) > 40) {
      if (difference > 0) showNextAds()
      else showPreviousAds()
    }

    touchStartX.current = null
  }

  const processedProducts = useMemo(() => {
    let list = normalizeArray(products)

    if (search.trim()) {
      const query = search.toLowerCase().trim()

      list = list.filter((product) =>
        (product.name && product.name.toLowerCase().includes(query)) ||
        (product.description && product.description.toLowerCase().includes(query)) ||
        (product.category_name && product.category_name.toLowerCase().includes(query))
      )
    }

    return list
  }, [products, search])

  const safeCategories = normalizeArray(categories)

  useEffect(() => {
    if (advertisements.length <= adsPerView) return;
    
    const interval = setInterval(() => {
      setAdIndex((current) =>
        current >= maxAdIndex ? 0 : Math.min(current + adsPerView, maxAdIndex)
      );
    }, 3000);
  
    return () => clearInterval(interval);
  }, [advertisements.length, adsPerView, maxAdIndex]);






  return (
    <div className={styles.page}>
      <Header />

      <main className={styles.main}>
        {/* Search */}
        <section className={styles.searchSection}>
          <form className={styles.searchForm} onSubmit={(e) => e.preventDefault()}>
            <div className={styles.searchInputWrapper}>
              <input
                className={styles.searchInput}
                type="text"
                placeholder="Search for stationery, office supplies..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              {search && (
                <button
                  type="button"
                  className={styles.clearSearchBtn}
                  onClick={() => setSearch('')}
                >
                  ✕
                </button>
              )}
            </div>

            <button type="submit" className={styles.searchBtn}>
              🔍
            </button>
          </form>
        </section>

        {/* Advertisement carousel */}
        {!search && advertisements.length > 0 && (
          <section className={styles.bannerSection}>
            <div
              className={styles.adViewport}
              onTouchStart={handleAdTouchStart}
              onTouchEnd={handleAdTouchEnd}
            >
              <div
                className={styles.adTrack}
                style={{
                  transform: `translateX(-${adIndex * (isMobile ? 100 : 50)}%)`
                }}
              >
                {advertisements.map((ad) => (
                  <div className={styles.adSlide} key={ad.id}>
                    <img
                      className={styles.adImage}
                      src={getAdvertisementImage(ad)}
                      alt={ad.title || 'Advertisement'}
                      draggable="false"
                      onError={(e) => {
                        console.error("Banner failed:", {
                        src: e.currentTarget.src,
                        naturalWidth: e.currentTarget.naturalWidth,
                        error: e.currentTarget.error
                      });
                    }}
                    />
                  </div>
                ))}
              </div>
            </div>

          </section>
        )}

        {/* Categories */}
        <section className={styles.categoriesBar}>
          <div className={styles.categoriesScroll}>
            <button
              className={`${styles.catButton} ${activeCategory === '' ? styles.catButtonActive : ''}`}
              onClick={() => handleCategoryClick('')}
            >
              <div className={styles.catIconWrap}>{CATEGORY_ICONS.all}</div>
              <span className={styles.catName}>All</span>
            </button>

            {safeCategories.map((cat) => {
              const slug = (cat.slug || '').toLowerCase()
              let icon = CATEGORY_ICONS.office

              if (slug.includes('notebook') || slug.includes('paper')) {
                icon = CATEGORY_ICONS.notebooks
              } else if (slug.includes('pen') || slug.includes('pencil')) {
                icon = CATEGORY_ICONS.pens
              } else if (slug.includes('art') || slug.includes('craft')) {
                icon = CATEGORY_ICONS.art
              }

              return (
                <button
                  key={cat.id}
                  className={`${styles.catButton} ${activeCategory === cat.slug ? styles.catButtonActive : ''}`}
                  onClick={() => handleCategoryClick(cat.slug)}
                >
                  <div className={styles.catIconWrap}>{icon}</div>
                  <span className={styles.catName}>{cat.name}</span>
                </button>
              )
            })}
          </div>
        </section>

        {/* Products */}
        <section className={styles.catalogSection} id="catalog-grid">
          {error && (
            <div className={styles.errorBox}>
              <p>{error}</p>
              <button onClick={fetchData} className={styles.retryBtn}>
                Retry
              </button>
            </div>
          )}

          {loading && (
            <div className={styles.productsGrid}>
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className={styles.skeletonCard} />
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
                    onClick={() => {
                      setSearch('')
                      handleCategoryClick('')
                    }}
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

      
    </div>
  )
}