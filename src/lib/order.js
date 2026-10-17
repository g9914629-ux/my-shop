export const ORDER_STATUS_OPTIONS = [
  { value: 'new', label: 'Новый' },
  { value: 'processing', label: 'В обработке' },
  { value: 'shipped', label: 'Отправлен' },
  { value: 'done', label: 'Завершён' },
  { value: 'cancelled', label: 'Отменён' },
]

export function getOrderStatusLabel(status = 'new') {
  return ORDER_STATUS_OPTIONS.find((option) => option.value === status)?.label ?? 'Новый'
}

export function buildOrderPayload(items, customer = {}) {
  const normalizedItems = items.map(({ id, quantity, product }) => {
    const price = Number(product.price)
    const itemQuantity = Number(quantity)

    return {
      id,
      name: product.name,
      quantity: itemQuantity,
      price,
      subtotal: price * itemQuantity,
    }
  })

  return {
    customer: {
      name: String(customer.name || '').trim(),
      phone: String(customer.phone || '').trim(),
      address: String(customer.address || '').trim(),
    },
    items: normalizedItems,
    total: normalizedItems.reduce((sum, item) => sum + item.subtotal, 0),
  }
}

export function buildTelegramOrderMessage(order) {
  const items = Array.isArray(order?.items) ? order.items : []
  const customer = order?.customer || {}
  const orderLabel = String(order?.id || '---').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12)
  const customerText = [
    customer.name && `👤 ${customer.name}`,
    customer.phone && `📞 ${customer.phone}`,
    customer.address && `📍 ${customer.address}`,
  ].filter(Boolean).join('\n')
  const itemText = items.length
    ? items.map((item) => `• ${item.name} — ${item.quantity} × ${Number(item.price).toLocaleString('ru-RU')} ₽`).join('\n')
    : '• Без товаров'

  return [
    `🛍️ Новый заказ #${orderLabel}`,
    `Статус: ${getOrderStatusLabel(order?.status || 'new')}`,
    `Сумма: ${Number(order?.total || 0).toLocaleString('ru-RU')} ₽`,
    '',
    customerText || 'Покупатель: не указан',
    '',
    itemText,
  ].join('\n')
}
