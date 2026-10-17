
import { useEffect, useState } from 'react'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'
import { useOutletContext } from 'react-router-dom'
import { auth, db } from '../firebase'
import { products as starterProducts } from '../data/products'
import { getOrderStatusLabel, ORDER_STATUS_OPTIONS } from '../lib/order'
import './admin.css'

const emptyProduct = {
  name: '',
  category: '',
  price: '',
  color: '',
  image: '',
  tag: '',
}

function Admin() {
  const { products, productsError } = useOutletContext()

  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [checkingAccess, setCheckingAccess] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [form, setForm] = useState(emptyProduct)
  const [editingId, setEditingId] = useState(null)
  const [busy, setBusy] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [orders, setOrders] = useState([])
  const [ordersError, setOrdersError] = useState('')

  useEffect(() => {
    let cancelled = false

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)
      setIsAdmin(false)
      setCheckingAccess(Boolean(currentUser))
      setError('')

      if (!currentUser) {
        setCheckingAccess(false)
        return
      }

      try {
        const adminSnapshot = await getDoc(
          doc(db, 'Admins', currentUser.uid)
        )

        if (!cancelled) {
          setIsAdmin(
            adminSnapshot.exists() &&
            adminSnapshot.data().active === true
          )
        }
      } catch {
        if (!cancelled) {
          setError(
            'Не удалось проверить права. Проверь правила доступа Firestore.'
          )
        }
      } finally {
        if (!cancelled) setCheckingAccess(false)
      }
    })

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!isAdmin) return

    const ordersQuery = query(
      collection(db, 'orders'),
      orderBy('createdAt', 'desc')
    )

    const unsubscribe = onSnapshot(
      ordersQuery,
      (snapshot) => {
        setOrders(
          snapshot.docs.map((item) => ({
            id: item.id,
            ...item.data(),
          }))
        )
        setOrdersError('')
      },
      () => {
        setOrdersError(
          'Не удалось загрузить заказы. Проверь правила Firestore и дату создания.'
        )
      }
    )

    return unsubscribe
  }, [isAdmin])

  async function handleLogin(event) {
    event.preventDefault()
    setBusy(true)
    setError('')

    try {
      await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      )
      setPassword('')
    } catch {
      setError(
        'Не удалось войти. Проверь email, пароль и включён ли вход по email в Firebase Authentication.'
      )
    } finally {
      setBusy(false)
    }
  }

  async function handleImageUpload(event) {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) return

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
    ]

    if (!allowedTypes.includes(file.type)) {
      setError('Выбери изображение в формате JPG, PNG, WEBP или GIF.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Размер фотографии не должен превышать 5 МБ.')
      return
    }

    setUploadingImage(true)
    setError('')
    setMessage('')

    try {
      const data = new FormData()
      data.append('file', file)
      data.append('upload_preset', 'my_shop_images')

      const response = await fetch(
        'https://api.cloudinary.com/v1_1/qespg936/image/upload',
        {
          method: 'POST',
          body: data,
        }
      )

      const result = await response.json()

      if (!response.ok) {
        throw new Error(
          result.error?.message || 'Не удалось загрузить фотографию.'
        )
      }

      setForm((prev) => ({
        ...prev,
        image: result.secure_url,
      }))

      setMessage('Фото загружено! Теперь нажми кнопку сохранения товара.')
    } catch (uploadError) {
      console.error('Cloudinary upload error:', uploadError)
      setError(
        `Не удалось загрузить фото: ${uploadError.message}`
      )
    } finally {
      setUploadingImage(false)
    }
  }

  function startEditing(product) {
    setEditingId(product.id)
    setForm({
      name: product.name || '',
      category: product.category || '',
      price: String(product.price ?? ''),
      color: product.color || '',
      image: product.image || '',
      tag: product.tag || '',
    })
    setMessage('')
    setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelEditing() {
    setEditingId(null)
    setForm(emptyProduct)
    setMessage('')
    setError('')
  }

  async function handleSave(event) {
    event.preventDefault()

    if (uploadingImage) {
      setError('Подожди, пока фотография загрузится.')
      return
    }

    setBusy(true)
    setMessage('')
    setError('')

    const product = {
      name: form.name.trim(),
      category: form.category.trim(),
      price: Number(form.price),
      color: form.color.trim(),
      image: form.image.trim(),
      tag: form.tag.trim(),
      updatedAt: serverTimestamp(),
    }

    try {
      if (editingId) {
        await updateDoc(doc(db, 'products', editingId), product)
        setMessage('Изменения сохранены.')
      } else {
        await addDoc(collection(db, 'products'), {
          ...product,
          createdAt: serverTimestamp(),
        })
        setMessage('Товар добавлен в каталог.')
      }

      setEditingId(null)
      setForm(emptyProduct)
    } catch {
      setError(
        'Не удалось сохранить товар. Проверь правила Firestore и подключение к интернету.'
      )
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(product) {
    if (!window.confirm(`Удалить товар «${product.name}»?`)) return

    setBusy(true)
    setMessage('')
    setError('')

    try {
      await deleteDoc(doc(db, 'products', product.id))

      if (editingId === product.id) {
        setEditingId(null)
        setForm(emptyProduct)
      }

      setMessage('Товар удалён.')
    } catch {
      setError('Не удалось удалить товар. Проверь правила Firestore.')
    } finally {
      setBusy(false)
    }
  }

  async function handleSeed() {
    setBusy(true)
    setMessage('')
    setError('')

    try {
      const batch = writeBatch(db)

      starterProducts.forEach((product) => {
        const reference = doc(collection(db, 'products'))
        batch.set(reference, {
          ...product,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      })

      await batch.commit()
      setMessage('Стартовый каталог добавлен.')
    } catch {
      setError('Не удалось добавить товары. Проверь правила Firestore.')
    } finally {
      setBusy(false)
    }
  }

  async function handleOrderStatusChange(orderId, nextStatus) {
    setBusy(true)
    setMessage('')
    setError('')

    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: nextStatus,
        updatedAt: serverTimestamp(),
      })
      setMessage('Статус заказа обновлён.')
    } catch {
      setError(
        'Не удалось обновить статус заказа. Проверь доступ к коллекции orders.'
      )
    } finally {
      setBusy(false)
    }
  }

  if (checkingAccess) {
    return (
      <main className="admin-page page-width">
        <p className="admin-notice">Проверяем доступ...</p>
      </main>
    )
  }

  if (!user) {
    return (
      <main className="admin-page page-width">
        <section className="admin-login">
          <p className="eyebrow">Управление магазином</p>
          <h1>Вход в <em>админку.</em></h1>
          <p className="admin-intro">
            Войди с аккаунтом, которому выданы права администратора в Firebase.
          </p>

          <form className="admin-form login-form" onSubmit={handleLogin}>
            <label>
              Email
              <input
                type="email"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>

            <label>
              Пароль
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>

            {error && <p className="admin-error" role="alert">{error}</p>}

            <button className="button button-dark" disabled={busy}>
              {busy ? 'Входим...' : 'Войти'} <span aria-hidden="true">↗</span>
            </button>
          </form>
        </section>
      </main>
    )
  }

  if (!isAdmin) {
    return (
      <main className="admin-page page-width">
        <section className="admin-login">
          <p className="eyebrow">Управление магазином</p>
          <h1>Доступ <em>не выдан.</em></h1>
          <p className="admin-intro">
            В Firebase Console проверь документ администратора с полем active: true.
          </p>
          <p className="admin-uid">UID аккаунта: <code>{user.uid}</code></p>
          {error && <p className="admin-error" role="alert">{error}</p>}
          <button className="button button-dark" onClick={() => signOut(auth)}>
            Выйти
          </button>
        </section>
      </main>
    )
  }

  return (
    <main className="admin-page page-width">
      <div className="admin-topbar">
        <div>
          <p className="eyebrow">Панель управления</p>
          <h1>Товары <span>{products.length}</span></h1>
        </div>
        <button className="admin-logout" onClick={() => signOut(auth)}>
          Выйти <span aria-hidden="true">↗</span>
        </button>
      </div>

      <div className="admin-layout">
        <section className="admin-editor">
          <p className="eyebrow">
            {editingId ? 'Изменить товар' : 'Новая позиция'}
          </p>
          <h2>{editingId ? 'Редактирование' : 'Добавить товар'}</h2>

          <form className="admin-form" onSubmit={handleSave}>
            <label>
              Название
              <input
                value={form.name}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
                required
                maxLength={90}
              />
            </label>

            <div className="admin-field-row">
              <label>
                Категория
                <input
                  value={form.category}
                  onChange={(event) =>
                    setForm({ ...form, category: event.target.value })
                  }
                  required
                  maxLength={40}
                  placeholder="Например, Футболки"
                />
              </label>

              <label>
                Цена
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={form.price}
                  onChange={(event) =>
                    setForm({ ...form, price: event.target.value })
                  }
                  required
                />
              </label>
            </div>

            <label>
              Цвет
              <input
                value={form.color}
                onChange={(event) =>
                  setForm({ ...form, color: event.target.value })
                }
                required
                maxLength={50}
              />
            </label>

            
       <div className="photo-upload">
            <span className="photo-upload-title">Фотография товара</span>

          <label className="photo-upload-button">
            <span className="photo-upload-icon">↑</span>
             {uploadingImage ? 'Загружаем фото...' : 'Выбрать фотографию'}
            <input
             type="file"
             accept="image/jpeg,image/png,image/webp,image/gif"
             onChange={handleImageUpload}
             disabled={uploadingImage || busy}/>
          </label>

            <span className="photo-upload-hint">
             JPG, PNG или WEBP · до 5 МБ
            </span>
       </div>


            {uploadingImage && (
              <p className="admin-notice">Загружаем фотографию...</p>
            )}

            {form.image && (
              <div>
                <img
                  src={form.image}
                  alt="Предпросмотр товара"
                  style={{
                    width: '140px',
                    height: '140px',
                    objectFit: 'cover',
                    borderRadius: '10px',
                  }}
                />
                <button
                  type="button"
                  className="admin-cancel"
                  onClick={() =>
                    setForm((prev) => ({ ...prev, image: '' }))
                  }
                  disabled={busy || uploadingImage}
                >
                  Убрать фото
                </button>
              </div>
            )}

            <label>
              Метка <span className="optional-label">необязательно</span>
              <input
                value={form.tag}
                onChange={(event) =>
                  setForm({ ...form, tag: event.target.value })
                }
                maxLength={30}
                placeholder="Новинка, Хит..."
              />
            </label>

            {error && <p className="admin-error" role="alert">{error}</p>}
            {message && <p className="admin-success" role="status">{message}</p>}

            <div className="admin-form-actions">
              <button
                className="button button-dark"
                disabled={busy || uploadingImage}
              >
                {busy
                  ? 'Сохраняем...'
                  : editingId
                    ? 'Сохранить'
                    : 'Добавить товар'}
                {' '}<span aria-hidden="true">↗</span>
              </button>

              {editingId && (
                <button
                  className="admin-cancel"
                  type="button"
                  onClick={cancelEditing}
                >
                  Отмена
                </button>
              )}
            </div>
          </form>
        </section>

        <div className="admin-side-stack">
          <section className="admin-list">
            <div className="admin-list-heading">
              <div>
                <p className="eyebrow">Каталог Firebase</p>
                <h2>Все товары</h2>
              </div>

              {!products.length && (
                <button
                  className="seed-button"
                  onClick={handleSeed}
                  disabled={busy}
                >
                  Добавить стартовый каталог
                </button>
              )}
            </div>

            {productsError ? (
              <p className="admin-error">
                Не удалось загрузить Firestore: проверь подключение и правила базы.
              </p>
            ) : products.length ? (
              <div className="admin-product-list">
                {products.map((product) => (
                  <article className="admin-product" key={product.id}>
                    <img src={product.image} alt="" />
                    <div className="admin-product-name">
                      <strong>{product.name}</strong>
                      <span>
                        {product.category} · {Number(product.price).toLocaleString('ru-RU')}
                      </span>
                    </div>
                    <button
                      className="admin-action"
                      onClick={() => startEditing(product)}
                      disabled={busy}
                    >
                      Изменить
                    </button>
                    <button
                      className="admin-action delete-action"
                      onClick={() => handleDelete(product)}
                      disabled={busy}
                    >
                      Удалить
                    </button>
                  </article>
                ))}
              </div>
            ) : (
              <p className="admin-empty">
                Товаров пока нет. Добавь первый товар или загрузи стартовый каталог.
              </p>
            )}
          </section>

          <section className="admin-orders">
            <div className="admin-list-heading">
              <div>
                <p className="eyebrow">Заказы</p>
                <h2>Все заказы</h2>
              </div>
              <span className="admin-order-counter">{orders.length}</span>
            </div>

            {ordersError ? (
              <p className="admin-error">{ordersError}</p>
            ) : orders.length ? (
              <div className="admin-order-list">
                {orders.map((order) => (
                  <article className="admin-order" key={order.id}>
                    <div className="admin-order-header">
                      <div>
                        <p className="admin-order-id">
                          Заказ #{order.id.slice(0, 6).toUpperCase()}
                        </p>
                        <p className="admin-order-date">
                          {order.createdAt?.toDate
                            ? new Date(order.createdAt.toDate()).toLocaleString('ru-RU')
                            : 'Без даты'}
                        </p>
                      </div>
                      <span className={`admin-order-status status-${order.status || 'new'}`}>
                        {getOrderStatusLabel(order.status)}
                      </span>
                    </div>

                    <div className="admin-order-customer">
                      <p><strong>Клиент:</strong> {order.customer?.name || 'Не указан'}</p>
                      <p><strong>Телефон:</strong> {order.customer?.phone || 'Не указан'}</p>
                      <p><strong>Адрес:</strong> {order.customer?.address || 'Не указан'}</p>
                    </div>

                    <ul className="admin-order-items">
                      {(order.items || []).map((item) => (
                        <li key={`${order.id}-${item.id}`}>
                          <span>{item.name}</span>
                          <strong>
                            {item.quantity} × {Number(item.price).toLocaleString('ru-RU')} 
                          </strong>
                        </li>
                      ))}
                    </ul>

                    <div className="admin-order-footer">
                      <strong>
                        Итого: {Number(order.total || 0).toLocaleString('ru-RU')} 
                      </strong>
                      <label className="admin-order-status-picker">
                        <span>Статус</span>
                        <select
                          value={order.status || 'new'}
                          onChange={(event) =>
                            handleOrderStatusChange(order.id, event.target.value)
                          }
                          disabled={busy}
                        >
                          {ORDER_STATUS_OPTIONS.map((statusOption) => (
                            <option
                              key={statusOption.value}
                              value={statusOption.value}
                            >
                              {statusOption.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="admin-empty">Пока нет оформленных заказов.</p>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}

export default Admin
