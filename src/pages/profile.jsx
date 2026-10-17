
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { onAuthStateChanged, signOut, updateProfile } from 'firebase/auth'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { getOrderStatusLabel } from '../lib/order'

function Profile() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [ordersError, setOrdersError] = useState('')
  const [name, setName] = useState('')
  const [nameMessage, setNameMessage] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setName(currentUser?.displayName || '')
      setLoading(false)
    })

    return unsubscribe
  }, [])

  useEffect(() => {
    if (!user) return

    let active = true

    const ordersQuery = query(
      collection(db, 'orders'),
      where('userId', '==', user.uid)
    )

    const unsubscribe = onSnapshot(
      ordersQuery,
      (snapshot) => {
        if (!active) return

        setOrders(
          snapshot.docs.map((item) => ({
            id: item.id,
            ...item.data(),
          }))
        )
        setOrdersLoading(false)
      },
      (error) => {
        if (!active) return

        console.error(error)
        setOrdersError('Не удалось загрузить заказы.')
        setOrdersLoading(false)
      }
    )

    return () => {
      active = false
      unsubscribe()
    }
  }, [user])

  async function handleSaveName(event) {
    event.preventDefault()
    setNameMessage('')

    if (!auth.currentUser || !name.trim()) {
      setNameMessage('Введи своё имя.')
      return
    }

    try {
      await updateProfile(auth.currentUser, {
        displayName: name.trim(),
      })

      setUser({ ...auth.currentUser })
      setNameMessage('Имя сохранено!')
    } catch (error) {
      console.error(error)
      setNameMessage('Не удалось сохранить имя.')
    }
  }

  async function handleLogout() {
    try {
      await signOut(auth)
      setOrders([])
      navigate('/login')
    } catch (error) {
      console.error(error)
      alert('Не удалось выйти из аккаунта.')
    }
  }

  if (loading) {
    return <main className="page-width"><p>Загрузка...</p></main>
  }

  if (!user) {
    return (
      <main className="page-width">
        <h1>Мой профиль</h1>
        <p>Войди в аккаунт, чтобы открыть личный кабинет.</p>
        <Link className="button button-dark" to="/login">
          Войти
        </Link>
      </main>
    )
  }

  return (
    <main className="page-width">
      <section className="order-summary">
        <p className="eyebrow">MY-SHOP</p>
        <h1>Мой профиль</h1>

        <form onSubmit={handleSaveName} className="checkout-form">
          <label>
            <span>Имя</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Введи своё имя"
              required
            />
          </label>

          <button className="button button-dark" type="submit">
            Сохранить имя
          </button>

          {nameMessage && <p role="status">{nameMessage}</p>}
        </form>

        <p><strong>Email:</strong> {user.email}</p>

        <button
          className="button button-dark checkout-button"
          onClick={handleLogout}
        >
          Выйти из аккаунта
        </button>
      </section>

      <section className="profile-orders">
        <h2>Мои заказы</h2>

        {ordersLoading && <p>Загружаем заказы...</p>}
        {ordersError && <p className="admin-error">{ordersError}</p>}

        {!ordersLoading && !ordersError && orders.length === 0 && (
          <p>У тебя пока нет заказов.</p>
        )}

        {orders.map((order) => (
          <article className="order-summary" key={order.id}>
            <h3>Заказ #{order.id.slice(0, 8)}</h3>
            <p>
              Статус: <strong>{getOrderStatusLabel(order.status)}</strong>
            </p>
            <p>
              Сумма: {Number(order.total || 0).toLocaleString('ru-RU')} 
            </p>

            <ul>
              {(order.items || []).map((item, index) => (
                <li key={`${item.id}-${index}`}>
                  {item.name} — {item.quantity} шт.
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    </main>
  )
}

export default Profile
