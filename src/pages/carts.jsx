import { useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { buildOrderPayload } from '../lib/order'
import { sendOrderToTelegram } from '../lib/telegram'

const translations = {
  ru: {
    choice: 'Твой выбор',
    cart: 'Корзина',
    continue: 'Продолжить покупки',
    emptyTitle: 'Пока здесь пусто',
    emptyText: 'Самое время найти что-то своё.',
    catalog: 'Перейти в каталог',
    remove: 'Удалить',
    quantity: 'Количество',
    decrease: 'Уменьшить количество',
    increase: 'Увеличить количество',
    customer: 'Данные клиента',
    name: 'Имя',
    phone: 'Телефон',
    address: 'Адрес доставки',
    namePlaceholder: 'Например: Айсулуу',
    addressPlaceholder: 'Бишкек, ул. Ленина 10',
    total: 'Итого',
    goods: 'Товары',
    delivery: 'Доставка',
    free: 'Бесплатно',
    later: 'Рассчитаем позже',
    payment: 'К оплате',
    checkout: 'Оформить заказ',
    submitting: 'Оформляем...',
    loginError: 'Сначала войдите в аккаунт или зарегистрируйтесь.',
    fieldsError: 'Укажите имя, телефон и адрес доставки, чтобы оформить заказ.',
    success: 'Заказ оформлен. В ближайшее время менеджер свяжется с вами.',
    orderError: 'Не удалось оформить заказ. Проверьте подключение к Firebase и правила базы.',
  },
  kg: {
    choice: 'Сенин тандооң',
    cart: 'Себет',
    continue: 'Сатып алууну улантуу',
    emptyTitle: 'Азырынча бош',
    emptyText: 'Өзүңө жаккан нерсени табууга убакыт келди.',
    catalog: 'Каталогго өтүү',
    remove: 'Өчүрүү',
    quantity: 'Саны',
    decrease: 'Санын азайтуу',
    increase: 'Санын көбөйтүү',
    customer: 'Кардардын маалыматы',
    name: 'Аты-жөнү',
    phone: 'Телефон',
    address: 'Жеткирүү дареги',
    namePlaceholder: 'Мисалы: Айсулуу',
    addressPlaceholder: 'Бишкек, Ленин көчөсү 10',
    total: 'Жыйынтыгы',
    goods: 'Товарлар',
    delivery: 'Жеткирүү',
    free: 'Акысыз',
    later: 'Кийин эсептелет',
    payment: 'Төлөнө турган сумма',
    checkout: 'Буйрутма берүү',
    submitting: 'Буйрутма берилүүдө...',
    loginError: 'Адегенде аккаунтуңа кир же каттал.',
    fieldsError: 'Буйрутма берүү үчүн аты-жөнүңдү, телефонуңду жана дарегиңди жаз.',
    success: 'Буйрутма кабыл алынды. Жакында менеджер сени менен байланышат.',
    orderError: 'Буйрутма берилген жок. Firebase туташуусун жана база эрежелерин текшер.',
  },
  en: {
    choice: 'Your choice',
    cart: 'Cart',
    continue: 'Continue shopping',
    emptyTitle: 'Your cart is empty',
    emptyText: 'It is time to find something you love.',
    catalog: 'Go to catalog',
    remove: 'Remove',
    quantity: 'Quantity',
    decrease: 'Decrease quantity',
    increase: 'Increase quantity',
    customer: 'Customer details',
    name: 'Name',
    phone: 'Phone',
    address: 'Delivery address',
    namePlaceholder: 'For example: Aisuluu',
    addressPlaceholder: 'Bishkek, Lenin Street 10',
    total: 'Summary',
    goods: 'Products',
    delivery: 'Delivery',
    free: 'Free',
    later: 'To be calculated later',
    payment: 'Total to pay',
    checkout: 'Place order',
    submitting: 'Placing order...',
    loginError: 'Please log in or register first.',
    fieldsError: 'Enter your name, phone number, and delivery address.',
    success: 'Your order has been placed. Our manager will contact you soon.',
    orderError: 'Could not place the order. Check your Firebase connection and database rules.',
  },
}

function Carts() {
  const {
    cart = [],
    clearCart,
    updateQuantity,
    products = [],
    language = 'ru',
  } = useOutletContext()

  const text = translations[language] || translations.ru

  const locale =
    language === 'kg' ? 'ky-KG' :
    language === 'en' ? 'en-US' :
    'ru-RU'

  const [checkoutMessage, setCheckoutMessage] = useState('')
  const [checkoutError, setCheckoutError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [customer, setCustomer] = useState({
    name: '',
    phone: '',
    address: '',
  })

  const cartItems = cart
    .map((item) => ({
      ...item,
      product: products.find((product) => product.id === item.id),
    }))
    .filter((item) => item.product)

  const itemCount = cartItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  )

  const total = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  )

  function formatPrice(price) {
    return Number(price).toLocaleString(locale)
  }

  async function handleCheckout() {
    if (!cartItems.length || isSubmitting) return

    setCheckoutError('')
    setCheckoutMessage('')

    if (!auth.currentUser) {
      setCheckoutError(text.loginError)
      return
    }

    const trimmedName = customer.name.trim()
    const trimmedPhone = customer.phone.trim()
    const trimmedAddress = customer.address.trim()

    if (!trimmedName || !trimmedPhone || !trimmedAddress) {
      setCheckoutError(text.fieldsError)
      return
    }

    setIsSubmitting(true)

    try {
      const payload = buildOrderPayload(cartItems, {
        name: trimmedName,
        phone: trimmedPhone,
        address: trimmedAddress,
      })

      const orderRef = await addDoc(collection(db, 'orders'), {
        ...payload,
        userId: auth.currentUser.uid,
        customer: {
          ...payload.customer,
          email: auth.currentUser.email || '',
        },
        status: 'new',
        createdAt: serverTimestamp(),
      })

      try {
        await sendOrderToTelegram({
          id: orderRef.id,
          ...payload,
          status: 'new',
        })
      } catch (telegramError) {
        console.error(
          'Telegram order notification failed:',
          telegramError
        )
      }

      setCustomer({
        name: '',
        phone: '',
        address: '',
      })

      clearCart()
      setCheckoutMessage(text.success)
    } catch (error) {
      console.error(error)
      setCheckoutError(text.orderError)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="cart-page page-width">
      <div className="page-heading cart-heading">
        <div>
          <p className="eyebrow">{text.choice}</p>

          <h1>
            {text.cart}
            <span className="heading-count">{itemCount}</span>
          </h1>
        </div>

        <Link className="text-link" to="/product">
          {text.continue} <span aria-hidden="true">↗</span>
        </Link>
      </div>

      {cartItems.length === 0 ? (
        <div className="empty-cart">
          <span className="empty-mark">( )</span>

          <h2>{text.emptyTitle}</h2>
          <p>{text.emptyText}</p>

          {checkoutMessage && (
            <p className="admin-success" role="status">
              {checkoutMessage}
            </p>
          )}

          <Link className="button button-dark" to="/product">
            {text.catalog} <span aria-hidden="true">↗</span>
          </Link>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-items">
            {cartItems.map(({ id, quantity, product }) => (
              <article className="cart-item" key={id}>
                <img src={product.image} alt={product.name} />

                <div className="cart-item-info">
                  <span className="eyebrow">
                    {product.category}
                  </span>

                  <h2>{product.name}</h2>
                  <p>{product.color}</p>

                  <button
                    className="remove-button"
                    onClick={() => updateQuantity(id, 0)}
                  >
                    {text.remove}
                  </button>
                </div>

                <div
                  className="quantity-control"
                  aria-label={`${text.quantity}: ${quantity}`}
                >
                  <button
                    onClick={() => updateQuantity(id, quantity - 1)}
                    aria-label={text.decrease}
                  >
                    −
                  </button>

                  <span>{quantity}</span>

                  <button
                    onClick={() => updateQuantity(id, quantity + 1)}
                    aria-label={text.increase}
                  >
                    +
                  </button>
                </div>

                <strong className="cart-item-price">
                  {formatPrice(product.price * quantity)}
                </strong>
              </article>
            ))}
          </div>

          <aside className="order-summary">
            <p className="eyebrow">{text.customer}</p>

            <div className="checkout-form">
              <label>
                <span>{text.name}</span>

                <input
                  type="text"
                  value={customer.name}
                  onChange={(event) =>
                    setCustomer((previous) => ({
                      ...previous,
                      name: event.target.value,
                    }))
                  }
                  placeholder={text.namePlaceholder}
                />
              </label>

              <label>
                <span>{text.phone}</span>

                <input
                  type="tel"
                  value={customer.phone}
                  onChange={(event) =>
                    setCustomer((previous) => ({
                      ...previous,
                      phone: event.target.value,
                    }))
                  }
                  placeholder="+996 777 777 777"
                />
              </label>

              <label>
                <span>{text.address}</span>

                <textarea
                  value={customer.address}
                  onChange={(event) =>
                    setCustomer((previous) => ({
                      ...previous,
                      address: event.target.value,
                    }))
                  }
                  placeholder={text.addressPlaceholder}
                  rows="3"
                />
              </label>
            </div>

            <p className="eyebrow">{text.total}</p>

            <div className="summary-row">
              <span>{text.goods}</span>
              <span>{formatPrice(total)}</span>
            </div>

            <div className="summary-row">
              <span>{text.delivery}</span>
              <span>
                {total >= 7000 ? text.free : text.later}
              </span>
            </div>

            <div className="summary-total">
              <span>{text.payment}</span>
              <strong>{formatPrice(total)}</strong>
            </div>

            <button
              className="button button-dark checkout-button"
              onClick={handleCheckout}
              disabled={isSubmitting}
            >
              {isSubmitting ? text.submitting : text.checkout}
            </button>

            {checkoutError && (
              <p className="admin-error" role="alert">
                {checkoutError}
              </p>
            )}

            {checkoutMessage && (
              <p className="admin-success" role="status">
                {checkoutMessage}
              </p>
            )}
          </aside>
        </div>
      )}
    </main>
  )
}

export default Carts