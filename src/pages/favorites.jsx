
import { useOutletContext } from 'react-router-dom'
import { ProductGrid } from './product'

const translations = {
  ru: {
    collection: 'Твоя коллекция',
    title: 'Избранное',
    note: 'Товары, которые тебе понравились.',
    loading: 'Загружаем товары...',
    error: 'Не удалось загрузить товары.',
    empty: 'Пока ничего нет. Нажми на сердечко у понравившегося товара!',
  },
  kg: {
    collection: 'Сенин коллекцияң',
    title: 'Тандалгандар',
    note: 'Сага жаккан товарлар.',
    loading: 'Товарлар жүктөлүүдө...',
    error: 'Товарларды жүктөө мүмкүн болгон жок.',
    empty: 'Азырынча эч нерсе жок. Жаккан товарыңдын жүрөк белгисин бас!',
  },
  en: {
    collection: 'Your collection',
    title: 'Favorites',
    note: 'Items you have liked.',
    loading: 'Loading products...',
    error: 'Could not load products.',
    empty: 'Nothing here yet. Tap the heart on a product you like!',
  },
}

function Favorites() {
  const {
    products = [],
    favorites = [],
    productsLoading,
    productsError,
    language = 'ru',
  } = useOutletContext()

  const t = translations[language] || translations.ru

  const favoriteProducts = products.filter((product) =>
    favorites.includes(product.id)
  )

  return (
    <main className="catalog page-width">
      <div className="page-heading">
        <div>
          <p className="eyebrow">{t.collection}</p>
          <h1>
            {t.title} <em>♥</em>
          </h1>
        </div>

        <p className="heading-note">{t.note}</p>
      </div>

      {productsLoading ? (
        <p className="catalog-message">{t.loading}</p>
      ) : productsError ? (
        <p className="catalog-message">{t.error}</p>
      ) : favoriteProducts.length > 0 ? (
        <ProductGrid items={favoriteProducts} />
      ) : (
        <p className="catalog-message">{t.empty}</p>
      )}
    </main>
  )
}

export default Favorites
