
import { useEffect, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import {
  addDoc,
  collection,
  onSnapshot,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore'
import { db } from '../firebase'
import { ProductGrid } from './product'

const homeTranslations = {
  ru: {
    collection: 'Новая коллекция · весна / лето 2026',
    title1: 'Меньше вещей.',
    title2: 'Больше',
    title3: 'себя.',
    description: 'Продуманный гардероб на каждый день. Честные материалы, свободный крой и никакой лишней суеты.',
    view: 'Смотреть коллекцию',
    delivery: 'Бесплатная доставка от 7 000',
    chosen: 'Выбрали для тебя',
    everyday: 'На каждый день',
    all: 'Весь каталог',
    loading: 'Загружаем товары...',
    error: 'Не удалось загрузить каталог из Firebase.',
    empty: 'Каталог скоро появится.',
    manifesto: 'Форма — это ощущение',
    quote1: 'Хорошая одежда не просит внимания.',
    quote2: 'Она просто подходит тебе.',
    find: 'Найти свою форму',
    reviewsEyebrow: 'Нам важно твоё мнение',
    reviewsTitle: 'Отзывы о магазине',
    noReviews: 'Пока отзывов нет. Будь первым!',
    loadingReviews: 'Загружаем отзывы...',
    reviewsError: 'Не удалось загрузить отзывы.',
    writeReview: 'Оставить отзыв',
    rating: 'Оценка',
    reviewPlaceholder: 'Расскажи о своём опыте покупок',
    submitReview: 'Опубликовать отзыв',
    submittingReview: 'Отправляем...',
    loginToReview: 'Войди в аккаунт, чтобы оставить отзыв.',
    reviewAdded: 'Спасибо! Твой отзыв опубликован.',
    reviewSubmitError: 'Не удалось отправить отзыв. Попробуй ещё раз.',
    reviewRequired: 'Напиши текст отзыва.',
  },
  kg: {
    collection: 'Жаңы коллекция · жаз / жай 2026',
    title1: 'Кийим аз.',
    title2: 'Өзүң',
    title3: 'көбүрөөк.',
    description: 'Ар бир күнгө ылайыктуу гардероб. Сапаттуу материалдар, эркин тигиш жана ашыкча түйшүк жок.',
    view: 'Коллекцияны көрүү',
    delivery: '7 000 сомдон баштап жеткирүү акысыз',
    chosen: 'Сен үчүн тандадык',
    everyday: 'Ар бир күнгө',
    all: 'Бардык каталог',
    loading: 'Товарлар жүктөлүүдө...',
    error: 'Каталогду жүктөө мүмкүн болгон жок.',
    empty: 'Каталог жакында чыгат.',
    manifesto: 'Форма — бул сезим',
    quote1: 'Жакшы кийим көңүл бурууну талап кылбайт.',
    quote2: 'Ал сага жөн гана жарашат.',
    find: 'Өз стилиңди тап',
    reviewsEyebrow: 'Сенин пикириң биз үчүн маанилүү',
    reviewsTitle: 'Дүкөн тууралуу пикирлер',
    noReviews: 'Азырынча пикир жок. Биринчи болуп жаз!',
    loadingReviews: 'Пикирлер жүктөлүүдө...',
    reviewsError: 'Пикирлерди жүктөө мүмкүн болгон жок.',
    writeReview: 'Пикир калтыруу',
    rating: 'Баалоо',
    reviewPlaceholder: 'Сатып алуу тажрыйбаң тууралуу жаз',
    submitReview: 'Пикирди жарыялоо',
    submittingReview: 'Жөнөтүлүүдө...',
    loginToReview: 'Пикир калтыруу үчүн аккаунтуңа кир.',
    reviewAdded: 'Рахмат! Пикириң жарыяланды.',
    reviewSubmitError: 'Пикир жөнөтүлгөн жок. Кайра аракет кыл.',
    reviewRequired: 'Пикирдин текстин жаз.',
  },
  en: {
    collection: 'New collection · spring / summer 2026',
    title1: 'Fewer things.',
    title2: 'More',
    title3: 'you.',
    description: 'A thoughtful everyday wardrobe. Honest materials, relaxed cuts, and no unnecessary fuss.',
    view: 'Explore collection',
    delivery: 'Free delivery on orders over 7,000',
    chosen: 'Picked for you',
    everyday: 'Everyday essentials',
    all: 'View all products',
    loading: 'Loading products...',
    error: 'Could not load the Firebase catalog.',
    empty: 'The catalog is coming soon.',
    manifesto: 'Form is a feeling',
    quote1: 'Good clothing does not ask for attention.',
    quote2: 'It simply feels right for you.',
    find: 'Find your style',
    reviewsEyebrow: 'Your feedback matters',
    reviewsTitle: 'Store reviews',
    noReviews: 'No reviews yet. Be the first!',
    loadingReviews: 'Loading reviews...',
    reviewsError: 'Could not load reviews.',
    writeReview: 'Leave a review',
    rating: 'Rating',
    reviewPlaceholder: 'Tell us about your shopping experience',
    submitReview: 'Post review',
    submittingReview: 'Sending...',
    loginToReview: 'Log in to leave a review.',
    reviewAdded: 'Thank you! Your review has been posted.',
    reviewSubmitError: 'Could not send your review. Please try again.',
    reviewRequired: 'Write your review.',
  },
}

function Home() {
  const {
    products,
    productsLoading,
    productsError,
    language = 'ru',
    user,
  } = useOutletContext()
  const t = homeTranslations[language] || homeTranslations.ru
  const [reviews, setReviews] = useState([])
  const [reviewsLoading, setReviewsLoading] = useState(true)
  const [reviewsError, setReviewsError] = useState('')
  const [rating, setRating] = useState(5)
  const [reviewText, setReviewText] = useState('')
  const [reviewMessage, setReviewMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const reviewsQuery = query(
      collection(db, 'siteReviews'),
      where('status', '==', 'approved')
    )

    return onSnapshot(
      reviewsQuery,
      (snapshot) => {
        setReviews(
          snapshot.docs
            .map((review) => ({
              id: review.id,
              ...review.data(),
            }))
            .sort(
              (first, second) =>
                (second.createdAt?.seconds || 0) -
                (first.createdAt?.seconds || 0)
            )
            .slice(0, 8)
        )
        setReviewsLoading(false)
        setReviewsError('')
      },
      (error) => {
        console.error('Ошибка загрузки отзывов о магазине:', error)
        setReviewsError(t.reviewsError)
        setReviewsLoading(false)
      }
    )
  }, [t.reviewsError])

  async function handleReviewSubmit(event) {
    event.preventDefault()
    setReviewMessage('')

    const text = reviewText.trim()
    if (!text) {
      setReviewMessage(t.reviewRequired)
      return
    }

    if (!user) {
      setReviewMessage(t.loginToReview)
      return
    }

    setSubmitting(true)
    try {
      await addDoc(collection(db, 'siteReviews'), {
        userId: user.uid,
        userName: (user.displayName || user.email || 'Покупатель').slice(0, 100),
        rating,
        text,
        status: 'pending',
        createdAt: serverTimestamp(),
      })
      setReviewText('')
      setRating(5)
      setReviewMessage(t.reviewAdded)
    } catch (error) {
      console.error('Ошибка отправки отзыва о магазине:', error)
      setReviewMessage(t.reviewSubmitError)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main>
      <section className="hero page-width">
        <div className="hero-copy">
          <p className="eyebrow">{t.collection}</p>
          <h1>{t.title1}<br />{t.title2} <em>{t.title3}</em></h1>
          <p className="hero-description">{t.description}</p>
          <Link className="button button-dark" to="/product">
            {t.view} <span aria-hidden="true">↗</span>
          </Link>
          <div className="hero-note">
            <span className="note-dot" /> {t.delivery}
          </div>
        </div>

        <div className="hero-visual">
          <img
            src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1400&q=90"
            alt="People wearing casual clothes"
          />
          <span className="image-caption">New chapter / 01</span>
          <span className="hero-stamp">FORM<br />YOUR<br />OWN WAY</span>
        </div>
      </section>

      <section className="featured page-width" id="featured">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{t.chosen}</p>
            <h2>{t.everyday}</h2>
          </div>
          <Link className="text-link" to="/product">
            {t.all} <span aria-hidden="true">↗</span>
          </Link>
        </div>

        {productsLoading ? (
          <p className="catalog-message">{t.loading}</p>
        ) : productsError ? (
          <p className="catalog-message">{t.error}</p>
        ) : products.length ? (
          <ProductGrid items={products.slice(0, 4)} />
        ) : (
          <p className="catalog-message">{t.empty}</p>
        )}
      </section>

      <section className="manifesto">
        <p className="eyebrow">{t.manifesto}</p>
        <p>{t.quote1}<br /><em>{t.quote2}</em></p>
        <Link className="button button-light" to="/product">
          {t.find}
        </Link>
      </section>

      <section className="store-reviews page-width">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{t.reviewsEyebrow}</p>
            <h2>{t.reviewsTitle}</h2>
          </div>
        </div>

        {reviewsLoading ? (
          <p>{t.loadingReviews}</p>
        ) : reviewsError ? (
          <p className="admin-error" role="alert">{reviewsError}</p>
        ) : reviews.length ? (
          <div className="store-review-list">
            {reviews.map((review) => (
              <article className="store-review-card" key={review.id}>
                <div className="store-review-heading">
                  <strong>{review.userName || 'Покупатель'}</strong>
                  <span aria-label={`${review.rating} / 5`}>
                    {'★'.repeat(Number(review.rating) || 0)}
                    {'☆'.repeat(5 - (Number(review.rating) || 0))}
                  </span>
                </div>
                <p>{review.text}</p>
              </article>
            ))}
          </div>
        ) : (
          <p>{t.noReviews}</p>
        )}

        <form className="store-review-form" onSubmit={handleReviewSubmit}>
          <h3>{t.writeReview}</h3>
          {user ? (
            <>
              <label>
                <span>{t.rating}</span>
                <div className="rating-stars">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={rating >= star ? 'rating-star selected' : 'rating-star'}
                      onClick={() => setRating(star)}
                      aria-label={`${star} / 5`}
                    >
                      ★
                    </button>
                  ))}
                  <span className="rating-number">{rating}/5</span>
                </div>
              </label>
              <label>
                <span>{t.writeReview}</span>
                <textarea
                  value={reviewText}
                  onChange={(event) => setReviewText(event.target.value)}
                  placeholder={t.reviewPlaceholder}
                  rows={4}
                  maxLength={1000}
                  required
                />
              </label>
              <button className="button button-dark" type="submit" disabled={submitting}>
                {submitting ? t.submittingReview : t.submitReview}
              </button>
            </>
          ) : (
            <p><Link to="/login">{t.loginToReview}</Link></p>
          )}
          {reviewMessage && <p role="status">{reviewMessage}</p>}
        </form>
      </section>
    </main>
  )
}

export default Home
