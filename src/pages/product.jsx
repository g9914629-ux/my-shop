
import { useEffect, useState } from 'react'
import { Link, useOutletContext, useParams } from 'react-router-dom'
import { auth, db } from '../firebase'
import {
  addDoc,
  collection,
  onSnapshot,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore'

const productTranslations = {
  ru: {
    addCart: 'Добавить в корзину',
    removeFavorite: 'Убрать из избранного',
    addFavorite: 'Добавить в избранное',
    reviews: 'Отзывы',
    noReviews: 'Пока нет отзывов.',
    rating: 'Твоя оценка',
    yourReview: 'Твой отзыв',
    reviewPlaceholder: 'Расскажи, что думаешь о товаре',
    sending: 'Отправляем...',
    leaveReview: 'Оставить отзыв',
    loginFirst: 'Войди в аккаунт',
    toReview: ', чтобы оставить отзыв.',
    loginMessage: 'Сначала войди в аккаунт.',
    writeReview: 'Напиши текст отзыва.',
    reviewAdded: 'Отзыв добавлен!',
    reviewError: 'Не удалось добавить отзыв.',
    back: 'Назад в каталог',
    categoryLabel: 'Категория',
    colorLabel: 'Цвет',
    priceLabel: 'Цена',
    notFound: 'Товар не найден.',
    reviewLoading: 'Загружаем отзывы...',
    collection: 'Коллекция 2026',
    heading1: 'Найди свой',
    heading2: 'ритм.',
    note: 'Вещи, которые легко становятся любимыми.',
    search: 'Найти товар...',
    all: 'Все товары',
    products: 'товаров',
    loading: 'Загружаем товары...',
    error: 'Не удалось загрузить каталог из Firebase.',
    empty: 'В этой категории пока нет товаров.',
  },
  kg: {
    addCart: 'Себетке кошуу',
    removeFavorite: 'Тандалгандардан алып салуу',
    addFavorite: 'Тандалгандарга кошуу',
    reviews: 'Пикирлер',
    noReviews: 'Азырынча пикир жок.',
    rating: 'Сенин бааң',
    yourReview: 'Сенин пикириң',
    reviewPlaceholder: 'Товар тууралуу оюңду жаз',
    sending: 'Жөнөтүлүүдө...',
    leaveReview: 'Пикир калтыруу',
    loginFirst: 'Аккаунтуңа кир',
    toReview: ', пикир калтыруу үчүн.',
    loginMessage: 'Адегенде аккаунтуңа кир.',
    writeReview: 'Пикирдин текстин жаз.',
    reviewAdded: 'Пикир кошулду!',
    reviewError: 'Пикир кошулган жок.',
    back: 'Каталогго кайтуу',
    categoryLabel: 'Категория',
    colorLabel: 'Түсү',
    priceLabel: 'Баасы',
    notFound: 'Товар табылган жок.',
    reviewLoading: 'Пикирлер жүктөлүүдө...',
    collection: '2026 коллекциясы',
    heading1: 'Өз ыргагыңды',
    heading2: 'тап.',
    note: 'Сүйүктүү болуп кала турган кийимдер.',
    search: 'Товар издөө...',
    all: 'Бардык товарлар',
    products: 'товар',
    loading: 'Товарлар жүктөлүүдө...',
    error: 'Каталогду жүктөө мүмкүн болгон жок.',
    empty: 'Бул категорияда азырынча товар жок.',
  },
  en: {
    addCart: 'Add to cart',
    removeFavorite: 'Remove from favorites',
    addFavorite: 'Add to favorites',
    reviews: 'Reviews',
    noReviews: 'No reviews yet.',
    rating: 'Your rating',
    yourReview: 'Your review',
    reviewPlaceholder: 'Tell us what you think about this item',
    sending: 'Sending...',
    leaveReview: 'Leave a review',
    loginFirst: 'Log in',
    toReview: ' to leave a review.',
    loginMessage: 'Please log in first.',
    writeReview: 'Write your review.',
    reviewAdded: 'Review added!',
    reviewError: 'Could not add review.',
    back: 'Back to catalog',
    categoryLabel: 'Category',
    colorLabel: 'Color',
    priceLabel: 'Price',
    notFound: 'Product not found.',
    reviewLoading: 'Loading reviews...',
    collection: 'Collection 2026',
    heading1: 'Find your',
    heading2: 'rhythm.',
    note: 'Pieces that easily become your favorites.',
    search: 'Search products...',
    all: 'All products',
    products: 'products',
    loading: 'Loading products...',
    error: 'Could not load the Firebase catalog.',
    empty: 'No products in this category yet.',
  },
}

function ProductCard({
  item,
  addToCart,
  favorites,
  toggleFavorite,
  preferencesLoading,
  t,
}) {
  const isFavorite = favorites.includes(item.id)

  return (
    <article className="product-card">
      <div className="product-image-wrap">
        <Link className="product-image-link" to={`/product/${item.id}`}>
          <img
            className="product-image"
            src={item.image}
            alt={item.name}
            loading="lazy"
          />
        </Link>

        {item.tag && (
          <span className="product-tag">{item.tag}</span>
        )}

        <button
          type="button"
          className="quick-add"
          onClick={() => addToCart(item)}
          disabled={preferencesLoading}
          aria-label={`${t('addCart')}: ${item.name}`}
          title={t('addCart')}
        >
          +
        </button>

        <button
          type="button"
          className={`favorite-button ${
            isFavorite ? 'is-favorite' : ''
          }`}
          onClick={() => toggleFavorite(item.id)}
          disabled={preferencesLoading}
          aria-label={
            isFavorite
              ? t('removeFavorite')
              : t('addFavorite')
          }
          title={
            isFavorite
              ? t('removeFavorite')
              : t('addFavorite')
          }
        >
          {isFavorite ? '♥' : '♡'}
        </button>
      </div>

      <Link className="product-meta product-card-details" to={`/product/${item.id}`}>
        <div>
          <h3>{item.name}</h3>
          <p>{item.color}</p>
        </div>
        <strong>
          {Number(item.price).toLocaleString('ru-RU')}
        </strong>
      </Link>
    </article>
  )
}

export function ProductGrid({ items = [] }) {
  const {
    addToCart,
    favorites = [],
    toggleFavorite,
    preferencesLoading,
    language = 'ru',
  } = useOutletContext()

  const dictionary =
    productTranslations[language] || productTranslations.ru

  const t = (key) => dictionary[key] || key

  return (
    <div className="product-grid">
      {items.map((item) => (
        <ProductCard
          key={item.id}
          item={item}
          addToCart={addToCart}
          favorites={favorites}
          toggleFavorite={toggleFavorite}
          preferencesLoading={preferencesLoading}
          t={t}
        />
      ))}
    </div>
  )
}

function Product() {
  const {
    products,
    productsLoading,
    productsError,
    language = 'ru',
  } = useOutletContext()

  const dictionary =
    productTranslations[language] || productTranslations.ru

  const t = (key) => dictionary[key] || key

  const [category, setCategory] = useState('Все товары')
  const [search, setSearch] = useState('')

  const categories = [
    'Все товары',
    ...new Set(
      products.map((item) => item.category).filter(Boolean)
    ),
  ]

  const visibleProducts = products.filter((product) => {
    const matchesCategory =
      category === 'Все товары' ||
      category === 'Бардык товарлар' ||
      category === 'All products' ||
      product.category === category

    const matchesSearch = (product.name || '')
      .toLowerCase()
      .includes(search.toLowerCase().trim())

    return matchesCategory && matchesSearch
  })

  return (
    <main className="catalog page-width">
      <div className="page-heading">
        <div>
          <p className="eyebrow">{t('collection')}</p>
          <h1>
            {t('heading1')} <em>{t('heading2')}</em>
          </h1>
        </div>

        <p className="heading-note">{t('note')}</p>
      </div>

      <div className="catalog-toolbar">
        <input
          type="search"
          className="product-search"
          placeholder={t('search')}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          aria-label={t('search')}
        />

        <span>
          {visibleProducts.length} {t('products')}
        </span>

        <div
          className="category-tabs"
          aria-label="Фильтр по категориям"
        >
          {categories.map((item) => (
            <button
              type="button"
              className={
                category === item
                  ? 'category-tab active'
                  : 'category-tab'
              }
              key={item}
              onClick={() => setCategory(item)}
            >
              {item === 'Все товары' ? t('all') : item}
            </button>
          ))}
        </div>
      </div>

      {productsLoading ? (
        <p className="catalog-message">{t('loading')}</p>
      ) : productsError ? (
        <p className="catalog-message">{t('error')}</p>
      ) : visibleProducts.length ? (
        <ProductGrid items={visibleProducts} />
      ) : (
        <p className="catalog-message">{t('empty')}</p>
      )}
    </main>
  )
}

export function ProductDetails() {
  const { productId } = useParams()
  const {
    products = [],
    productsLoading,
    addToCart,
    favorites = [],
    toggleFavorite,
    preferencesLoading,
    language = 'ru',
    user,
  } = useOutletContext()
  const dictionary =
    productTranslations[language] || productTranslations.ru
  const t = (key) => dictionary[key] || key
  const reviewErrorMessage = dictionary.reviewError
  const product = products.find((item) => String(item.id) === productId)
  const [reviewState, setReviewState] = useState({
    productId: null,
    reviews: [],
    loading: true,
    error: '',
  })
  const [rating, setRating] = useState('5')
  const [reviewText, setReviewText] = useState('')
  const [reviewMessage, setReviewMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const isFavorite = product && favorites.includes(product.id)

  useEffect(() => {
    if (!product) return undefined

    const currentProductId = product.id
    const reviewsQuery = query(
      collection(db, 'reviews'),
      where('status', '==', 'approved')
    )

    return onSnapshot(
      reviewsQuery,
      (snapshot) => {
        setReviewState({
          productId: currentProductId,
          loading: false,
          error: '',
          reviews: snapshot.docs
            .filter((review) => review.data().productId === currentProductId)
            .map((review) => ({
              id: review.id,
              ...review.data(),
            }))
            .sort(
              (first, second) =>
                (second.createdAt?.seconds || 0) -
                (first.createdAt?.seconds || 0)
            ),
        })
      },
      (error) => {
        console.error('Ошибка загрузки отзывов:', error)
        setReviewState({
          productId: currentProductId,
          reviews: [],
          loading: false,
          error: reviewErrorMessage,
        })
      }
    )
  }, [product, reviewErrorMessage])

  async function handleReviewSubmit(event) {
    event.preventDefault()
    setReviewMessage('')

    if (!user || !auth.currentUser) {
      setReviewMessage(t('loginMessage'))
      return
    }

    if (!reviewText.trim()) {
      setReviewMessage(t('writeReview'))
      return
    }

    try {
      setSubmitting(true)
      await addDoc(collection(db, 'reviews'), {
        productId: product.id,
        productName: product.name,
        userId: auth.currentUser.uid,
        userName:
          auth.currentUser.displayName ||
          auth.currentUser.email ||
          'Покупатель',
        rating: Number(rating),
        text: reviewText.trim(),
        status: 'pending',
        createdAt: serverTimestamp(),
      })
      setReviewText('')
      setRating('5')
      setReviewMessage(t('reviewAdded'))
    } catch (error) {
      console.error(error)
      setReviewMessage(t('reviewError'))
    } finally {
      setSubmitting(false)
    }
  }

  if (productsLoading) {
    return <main className="page-width product-detail-page"><p>{t('loading')}</p></main>
  }

  if (!product) {
    return (
      <main className="page-width product-detail-page">
        <p className="catalog-message">{t('notFound')}</p>
        <Link className="text-link" to="/product">{t('back')}</Link>
      </main>
    )
  }

  const locale =
    language === 'kg' ? 'ky-KG' :
    language === 'en' ? 'en-US' :
    'ru-RU'
  const reviews =
    reviewState.productId === product.id ? reviewState.reviews : []
  const reviewsLoading =
    reviewState.productId !== product.id || reviewState.loading
  const reviewsError =
    reviewState.productId === product.id ? reviewState.error : ''
  const averageRating = reviews.length
    ? (
        reviews.reduce((total, review) => total + Number(review.rating || 0), 0) /
        reviews.length
      ).toFixed(1)
    : null

  return (
    <main className="page-width product-detail-page">
      <Link className="text-link product-back-link" to="/product">
        <span aria-hidden="true">←</span> {t('back')}
      </Link>

      <section className="product-detail">
        <div className="product-detail-image-wrap">
          <img src={product.image} alt={product.name} />
          {product.tag && <span className="product-tag">{product.tag}</span>}
        </div>

        <div className="product-detail-info">
          <p className="eyebrow">{product.category}</p>
          <h1>{product.name}</h1>
          <p className="product-detail-price">
            {Number(product.price).toLocaleString(locale)}
          </p>
          <dl className="product-specifications">
            <div>
              <dt>{t('categoryLabel')}</dt>
              <dd>{product.category || '—'}</dd>
            </div>
            <div>
              <dt>{t('colorLabel')}</dt>
              <dd>{product.color || '—'}</dd>
            </div>
          </dl>
          <div className="product-detail-actions">
            <button
              className="button button-dark"
              type="button"
              onClick={() => addToCart(product)}
              disabled={preferencesLoading}
            >
              {t('addCart')}
            </button>
            <button
              className={`button favorite-detail-button ${isFavorite ? 'is-favorite' : ''}`}
              type="button"
              onClick={() => toggleFavorite(product.id)}
              disabled={preferencesLoading}
            >
              {isFavorite ? '♥' : '♡'} {isFavorite ? t('removeFavorite') : t('addFavorite')}
            </button>
          </div>
        </div>
      </section>

      <section className="product-detail-reviews">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{t('reviews')}</p>
            <h2>
              {t('reviews')} ({reviews.length})
              {averageRating && <span className="review-average"> · ★ {averageRating}/5</span>}
            </h2>
          </div>
        </div>

        {reviewsLoading ? (
          <p>{t('reviewLoading')}</p>
        ) : reviewsError ? (
          <p className="admin-error" role="alert">{reviewsError}</p>
        ) : reviews.length ? (
          <div className="product-detail-review-list">
            {reviews.map((review) => (
              <article key={review.id} className="review-item">
                <div className="review-heading">
                  <strong>{review.userName || 'Покупатель'}</strong>
                  <span className="review-rating" aria-label={`${review.rating} / 5`}>
                    {'★'.repeat(Number(review.rating) || 0)}
                    {'☆'.repeat(5 - (Number(review.rating) || 0))}
                  </span>
                </div>
                <p>{review.text}</p>
              </article>
            ))}
          </div>
        ) : (
          <p>{t('noReviews')}</p>
        )}

        <form onSubmit={handleReviewSubmit} className="product-review-form">
          <h3>{t('leaveReview')}</h3>
          {user ? (
            <>
              <label>
                <span>{t('rating')}</span>
                <div className="rating-stars">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={Number(rating) >= star ? 'rating-star selected' : 'rating-star'}
                      onClick={() => setRating(String(star))}
                      aria-label={`${star} / 5`}
                    >
                      ★
                    </button>
                  ))}
                  <span className="rating-number">{rating}/5</span>
                </div>
              </label>
              <label>
                <span>{t('yourReview')}</span>
                <textarea
                  value={reviewText}
                  onChange={(event) => setReviewText(event.target.value)}
                  placeholder={t('reviewPlaceholder')}
                  rows={4}
                  maxLength={1000}
                  required
                />
              </label>
              <button className="button button-dark" type="submit" disabled={submitting}>
                {submitting ? t('sending') : t('leaveReview')}
              </button>
            </>
          ) : (
            <p><Link to="/login">{t('loginFirst')}</Link>{t('toReview')}</p>
          )}
          {reviewMessage && <p role="status">{reviewMessage}</p>}
        </form>
      </section>
    </main>
  )
}

export default Product
