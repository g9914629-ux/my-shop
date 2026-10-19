
import { useEffect, useRef, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'
import Header from './components/header'
import { auth, db } from './firebase'

const translations = {
  ru: {
    home: 'Главная',
    catalog: 'Каталог',
    favorites: 'Избранное',
    login: 'Войти',
    register: 'Регистрация',
    profile: 'Профиль',
    cart: 'Корзина',
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
    tagline: 'Clothing for your comfort',
  },
}

function normalizeCart(value) {
  return (Array.isArray(value) ? value : [])
    .filter(
      (item) =>
        item &&
        (typeof item.id === 'string' || typeof item.id === 'number') &&
        Number.isInteger(item.quantity) &&
        item.quantity > 0
    )
    .map((item) => ({ id: String(item.id), quantity: item.quantity }))
}

function normalizeFavorites(value) {
  return (Array.isArray(value) ? value : [])
    .filter(
      (productId) =>
        typeof productId === 'string' || typeof productId === 'number'
    )
    .map(String)
}

function readLegacyArray(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]')
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const [language, setLanguage] = useState(() => {
    try {
      const saved = localStorage.getItem('my-shop-language')
      return ['ru', 'kg', 'en'].includes(saved) ? saved : 'ru'
    } catch {
      return 'ru'
    }
  })

  const t = (key) => translations[language][key] || key

  const [user, setUser] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [preferencesUserId, setPreferencesUserId] = useState(null)
  const [preferencesError, setPreferencesError] = useState('')
  const [userProfileError, setUserProfileError] = useState('')
  const cartRef = useRef([])
  const favoritesRef = useRef([])
  const writeQueue = useRef(Promise.resolve())
  const previousAuthUidRef = useRef(undefined)
  const [products, setProducts] = useState([])
  const [productsLoading, setProductsLoading] = useState(true)
  const [productsError, setProductsError] = useState('')

  const [cart, setCart] = useState(() =>
    normalizeCart(readLegacyArray('my-shop-cart'))
  )
  const [favorites, setFavorites] = useState(() =>
    normalizeFavorites(readLegacyArray('my-shop-favorites'))
  )

  useEffect(() => {
    cartRef.current = cart
    favoritesRef.current = favorites
  }, [cart, favorites])

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

  useEffect(() => onAuthStateChanged(auth, (currentUser) => {
    const nextUid = currentUser?.uid || null
    const previousUid = previousAuthUidRef.current
    if (
      previousUid !== undefined &&
      nextUid !== previousUid &&
      (!currentUser || previousUid !== null)
    ) {
      setCart([])
      setFavorites([])
    }
    previousAuthUidRef.current = nextUid
    setUser(currentUser)
    setIsAdmin(false)
    setPreferencesUserId(null)
    setPreferencesError('')
    setUserProfileError('')
    setAuthReady(true)
  }), [])

  useEffect(() => {
    if (!user) return undefined

    let active = true
    const userProfileRef = doc(db, 'users', user.uid)

    async function syncUserProfile() {
      try {
        await runTransaction(db, async (transaction) => {
          const snapshot = await transaction.get(userProfileRef)
          const profile = {
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || '',
            updatedAt: serverTimestamp(),
          }

          transaction.set(
            userProfileRef,
            snapshot.exists()
              ? profile
              : { ...profile, createdAt: serverTimestamp() },
            { merge: true }
          )
        })
        if (active) setUserProfileError('')
      } catch (error) {
        console.error('Не удалось обновить профиль пользователя:', error)
        if (active) {
          setUserProfileError('Не удалось сохранить профиль пользователя в Firebase.')
        }
      }
    }

    const preferencesRef = doc(db, 'userPreferences', user.uid)

    async function loadPreferences() {
      try {
        const initialCart = normalizeCart(cartRef.current)
        const initialFavorites = normalizeFavorites(favoritesRef.current)
        const result = await runTransaction(db, async (transaction) => {
          const snapshot = await transaction.get(preferencesRef)
          if (snapshot.exists()) {
            const data = snapshot.data()
            return {
              cart: normalizeCart(data.cart),
              favorites: normalizeFavorites(data.favorites),
            }
          }

          transaction.set(preferencesRef, {
            cart: initialCart,
            favorites: initialFavorites,
            updatedAt: serverTimestamp(),
          })
          return {
            cart: initialCart,
            favorites: initialFavorites,
          }
        })
        if (!active) return

        setCart(result.cart)
        setFavorites(result.favorites)
        setPreferencesError('')
        setPreferencesUserId(user.uid)
      } catch (error) {
        console.error('Не удалось загрузить корзину и избранное:', error)
        if (active) {
          setPreferencesError(
            'Firebase отклонил доступ к корзине и избранному. Опубликуй актуальные правила из firestore.rules в Firebase Console.'
          )
        }
      }
    }

    syncUserProfile()
    loadPreferences()

    const unsubscribe = onSnapshot(
      preferencesRef,
      (snapshot) => {
        if (!active || !snapshot.exists()) return
        const data = snapshot.data()
        const nextCart = normalizeCart(data.cart)
        const nextFavorites = normalizeFavorites(data.favorites)

        if (JSON.stringify(nextCart) !== JSON.stringify(cartRef.current)) {
          setCart(nextCart)
        }
        if (
          JSON.stringify(nextFavorites) !==
          JSON.stringify(favoritesRef.current)
        ) {
          setFavorites(nextFavorites)
        }
      },
      (error) => {
        console.error('Не удалось синхронизировать корзину и избранное:', error)
        if (active) {
          setPreferencesError(
            'Firebase отклонил синхронизацию корзины и избранного. Опубликуй актуальные правила из firestore.rules в Firebase Console.'
          )
        }
      }
    )

    return () => {
      active = false
      unsubscribe()
    }
  }, [user])

  useEffect(() => {
    let active = true

    async function checkAdminAccess() {
      if (!user) return

      try {
        const adminSnapshot = await getDoc(doc(db, 'Admins', user.uid))
        if (active) {
          setIsAdmin(
            adminSnapshot.exists() && adminSnapshot.data().active === true
          )
        }
      } catch (error) {
        console.error('Не удалось проверить права администратора:', error)
      }
    }

    checkAdminAccess()

    return () => {
      active = false
    }
  }, [user])

  useEffect(() => {
    if (authReady && isAdmin && location.pathname !== '/admin') {
      navigate('/admin', { replace: true })
    }
  }, [authReady, isAdmin, location.pathname, navigate])

  useEffect(() => {
    try {
      localStorage.removeItem('my-shop-cart')
      localStorage.removeItem('my-shop-favorites')
    } catch (error) {
      console.error('Не удалось удалить старые данные корзины из браузера:', error)
    }
  }, [])

  useEffect(() => {
    if (!user || preferencesUserId !== user.uid) return

    const preferencesRef = doc(db, 'userPreferences', user.uid)
    const nextCart = cart
    const nextFavorites = favorites
    writeQueue.current = writeQueue.current
      .then(() => setDoc(preferencesRef, {
        cart: nextCart,
        favorites: nextFavorites,
        updatedAt: serverTimestamp(),
      }))
      .then(() => setPreferencesError(''))
      .catch((error) => {
        console.error('Не удалось сохранить корзину и избранное:', error)
        setPreferencesError(
          'Firebase отклонил сохранение корзины и избранного. Опубликуй актуальные правила из firestore.rules в Firebase Console.'
        )
      })
  }, [user, preferencesUserId, cart, favorites])

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
  const preferencesLoading = Boolean(
    user && preferencesUserId !== user.uid && !preferencesError
  )
  const isAdminRoute = location.pathname === '/admin'

  return (
    <div className="app-shell">
      {!isAdminRoute && (
        <Header
          cartCount={cartCount}
          user={user}
          authReady={authReady}
          language={language}
          onLanguageChange={setLanguage}
          t={t}
        />
      )}

      {preferencesError && (
        <p className="preferences-sync-error" role="alert">
          {preferencesError}
        </p>
      )}
      {userProfileError && (
        <p className="preferences-sync-error" role="alert">
          {userProfileError}
        </p>
      )}
      {preferencesLoading && (
        <p className="preferences-sync-loading" role="status">
          Загружаем корзину и избранное...
        </p>
      )}

      <Outlet context={{
        user,
        preferencesLoading,
        preferencesError,
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

      {!isAdminRoute && (
        <footer className="site-footer">
          <Link to="/">My-Shop</Link>
          <span>{t('tagline')}</span>
          <span>© 2026 Forma Studio</span>
        </footer>
      )}
    </div>
  )
}

export default Layout
