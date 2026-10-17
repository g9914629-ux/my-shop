import test from 'node:test'
import assert from 'node:assert/strict'

import { buildOrderPayload, buildTelegramOrderMessage, getOrderStatusLabel } from './order.js'

test('buildOrderPayload creates order data from cart items', () => {
  const cartItems = [
    { id: 'p1', quantity: 2, product: { name: 'Кофта', price: 3000 } },
    { id: 'p2', quantity: 1, product: { name: 'Шапка', price: 1500 } }
  ]

  const order = buildOrderPayload(cartItems, {
    name: 'Алина',
    phone: '+996 555 123 456',
    address: 'Бишкек, ул. Ленина 10',
  })

  assert.equal(order.items.length, 2)
  assert.equal(order.total, 7500)
  assert.deepEqual(order.customer, {
    name: 'Алина',
    phone: '+996 555 123 456',
    address: 'Бишкек, ул. Ленина 10',
  })
  assert.deepEqual(order.items[0], {
    id: 'p1',
    name: 'Кофта',
    quantity: 2,
    price: 3000,
    subtotal: 6000,
  })
})

test('getOrderStatusLabel returns readable order state labels', () => {
  assert.equal(getOrderStatusLabel('new'), 'Новый')
  assert.equal(getOrderStatusLabel('processing'), 'В обработке')
  assert.equal(getOrderStatusLabel('shipped'), 'Отправлен')
  assert.equal(getOrderStatusLabel('done'), 'Завершён')
  assert.equal(getOrderStatusLabel('cancelled'), 'Отменён')
  assert.equal(getOrderStatusLabel('unknown'), 'Новый')
})

test('buildTelegramOrderMessage creates a readable order notification', () => {
  const message = buildTelegramOrderMessage({
    id: 'order_123',
    total: 5400,
    status: 'new',
    customer: {
      name: 'Алина',
      phone: '+996 555 123 456',
      address: 'Бишкек, ул. Ленина 10',
    },
    items: [
      { name: 'Кофта', quantity: 1, price: 3000 },
      { name: 'Шапка', quantity: 1, price: 2400 },
    ],
  })

  assert.match(message, /Новый заказ #ORDER123/)
  assert.match(message, /Сумма: 5\s*400 ₽/)
  assert.match(message, /Алина/)
  assert.match(message, /\+996 555 123 456/)
  assert.match(message, /Бишкек, ул\. Ленина 10/)
  assert.match(message, /Кофта/)
  assert.match(message, /Шапка/)
})
