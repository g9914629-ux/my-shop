
import { useEffect, useState } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { collection, onSnapshot } from 'firebase/firestore'
import Header from './components/header'
import { db } from './firebase'

const translations = {
  ru: {
    home: 'Главная',
    catalog: 'Каталог',
    favorites: 'Избранное',
    login: 'Войти',
    register: 'Регистрация',
    profile: 'Профиль',
    cart: 'Корзина',
    admin: 'Админка',
    tagline: 'Одежда для твоего удобства',
  },
  kg: {
    home: 'Башкы бет',
    catalog: 'Каталог',
    favorites: 'Тандалгандар',
    login: 'Кирүү',
    register: 'Катталуу',
    profile: 'Профиль',
    cart: 'Себет',
    admin: 'Админка',
    tagline: 'Сенин ыңгайлуулугуң үчүн кийим',
  },
  en: {
    home: 'Home',
    catalog: 'Catalog',
    favorites: 'Favorites',
    login: 'Log in',
    register: 'Register',
    profile: 'Profile',
    cart: 'Cart',
    admin: 'Admin',
    tagline: 'Clothing for your comfort',
  },
}

function Layout() {
  const [language, setLanguage] = useState(() => {
    try {
      const saved = localStorage.getItem('my-shop-language')
      return ['ru', 'kg', 'en'].includes(saved) ? saved : 'ru'
    } catch {
      return 'ru'
    }
  })

  const t = (key) => translations[language][key] || key

  const [products, setProducts] = useState([])
  const [productsLoading, setProductsLoading] = useState(true)
  const [productsError, setProductsError] = useState('')

  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('my-shop-cart') || '[]')
    } catch {
      return []
    }
  })

  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('my-shop-favorites') || '[]')
    } catch {
      return []
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem('my-shop-language', language)
    } catch {
      // Сайт продолжит работать, даже если сохранение недоступно
    }
  }, [language])

  useEffect(() => onSnapshot(
    collection(db, 'products'),
    (snapshot) => {
      setProducts(snapshot.docs.map((product) => ({
        id: product.id,
        ...product.data(),
      })))
      setProductsLoading(false)
      setProductsError('')
    },
    (error) => {
      setProductsError(error.message)
      setProductsLoading(false)
    }
  ), [])

  useEffect(() => {
    localStorage.setItem('my-shop-cart', JSON.stringify(cart))
  }, [cart])

  useEffect(() => {
    localStorage.setItem('my-shop-favorites', JSON.stringify(favorites))
  }, [favorites])

  function addToCart(product) {
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id)

      return existing
        ? current.map((item) =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        : [...current, { id: product.id, quantity: 1 }]
    })
  }

  function updateQuantity(id, quantity) {
    setCart((current) => quantity < 1
      ? current.filter((item) => item.id !== id)
      : current.map((item) =>
          item.id === id ? { ...item, quantity } : item
        ))
  }

  function clearCart() {
    setCart([])
  }

  function toggleFavorite(productId) {
    setFavorites((current) =>
      current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId]
    )
  }

  const cartCount = cart.reduce(
    (total, item) => total + item.quantity,
    0
  )

  return (
    <div className="app-shell">
      <Header
        cartCount={cartCount}
        language={language}
        onLanguageChange={setLanguage}
        t={t}
      />

      <Outlet context={{
        cart,
        addToCart,
        updateQuantity,
        clearCart,
        products,
        productsLoading,
        productsError,
        favorites,
        toggleFavorite,
        language,
        t,
      }} />

      <footer className="site-footer">
        <Link to="/">My-Shop</Link>
        <span>{t('tagline')}</span>
        <Link to="/admin">{t('admin')}</Link>
        <span>© 2026 Forma Studio</span>
      </footer>
    </div>
  )
}

export default Layout
