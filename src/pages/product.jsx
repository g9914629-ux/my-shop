
import { useEffect, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
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
  t,
}) {
  const [reviews, setReviews] = useState([])
  const [rating, setRating] = useState('5')
  const [reviewText, setReviewText] = useState('')
  const [reviewMessage, setReviewMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const isFavorite = favorites.includes(item.id)

  useEffect(() => {
    const reviewsQuery = query(
      collection(db, 'reviews'),
      where('productId', '==', item.id)
    )

    const unsubscribe = onSnapshot(
      reviewsQuery,
      (snapshot) => {
        setReviews(
          snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
        )
      },
      (error) => {
        console.error('Ошибка загрузки отзывов:', error)
      }
    )

    return unsubscribe
  }, [item.id])

  async function handleReviewSubmit(event) {
    event.preventDefault()
    setReviewMessage('')

    const currentUser = auth.currentUser

    if (!currentUser) {
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
        productId: item.id,
        productName: item.name,
        userId: currentUser.uid,
        userName:
          currentUser.displayName ||
          currentUser.email ||
          'Покупатель',
        rating: Number(rating),
        text: reviewText.trim(),
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

  return (
    <article className="product-card">
      <div className="product-image-wrap">
        <img
          className="product-image"
          src={item.image}
          alt={item.name}
          loading="lazy"
        />

        {item.tag && (
          <span className="product-tag">{item.tag}</span>
        )}

        <button
          type="button"
          className="quick-add"
          onClick={() => addToCart(item)}
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

      <div className="product-meta">
        <div>
          <h3>{item.name}</h3>
          <p>{item.color}</p>
        </div>
        <strong>
          {Number(item.price).toLocaleString('ru-RU')}
        </strong>
      </div>

      <section className="product-reviews">
        <h4>{t('reviews')} ({reviews.length})</h4>

        {reviews.length === 0 && (
          <p>{t('noReviews')}</p>
        )}

        {reviews.map((review) => (
          <div key={review.id} className="review-item">
            <strong>{review.userName}</strong>
            <p>{'⭐'.repeat(review.rating || 0)}</p>
            <p>{review.text}</p>
          </div>
        ))}

        <form
          onSubmit={handleReviewSubmit}
          className="checkout-form"
        >
          <label>
            <span>{t('rating')}</span>

            <div className="rating-stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={
                    Number(rating) >= star
                      ? 'rating-star selected'
                      : 'rating-star'
                  }
                  onClick={() => setRating(String(star))}
                  aria-label={`${star} / 5`}
                >
                  ★
                </button>
              ))}

              <span className="rating-number">
                {rating}/5
              </span>
            </div>
          </label>

          <label>
            <span>{t('yourReview')}</span>
            <textarea
              value={reviewText}
              onChange={(event) =>
                setReviewText(event.target.value)
              }
              placeholder={t('reviewPlaceholder')}
              rows={3}
              maxLength={1000}
              required
            />
          </label>

          {auth.currentUser ? (
            <button
              className="button button-dark"
              type="submit"
              disabled={submitting}
            >
              {submitting ? t('sending') : t('leaveReview')}
            </button>
          ) : (
            <p>
              <Link to="/login">{t('loginFirst')}</Link>
              {t('toReview')}
            </p>
          )}

          {reviewMessage && (
            <p role="status">{reviewMessage}</p>
          )}
        </form>
      </section>
    </article>
  )
}

export function ProductGrid({ items = [] }) {
  const {
    addToCart,
    favorites = [],
    toggleFavorite,
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

export default Product
