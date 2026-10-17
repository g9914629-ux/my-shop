
import { Link, useOutletContext } from 'react-router-dom'
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
  },
}

function Home() {
  const { products, productsLoading, productsError, language = 'ru' } = useOutletContext()
  const t = homeTranslations[language] || homeTranslations.ru

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
    </main>
  )
}

export default Home
