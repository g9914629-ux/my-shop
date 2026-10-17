
import { adminAuth, adminDb } from './firebase-admin.js'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1]

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  let user

  try {
    user = await adminAuth.verifyIdToken(token)
  } catch (error) {
    console.error('AUTH ERROR:', error?.message)
    return res.status(401).json({ error: 'Invalid authentication' })
  }

  const { orderId } = req.body || {}

  if (typeof orderId !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(orderId)) {
    return res.status(400).json({ error: 'Invalid order ID' })
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  if (!botToken || !chatId) {
    console.error('Telegram environment variables are missing')
    return res.status(500).json({ error: 'Telegram configuration is missing' })
  }

  const orderRef = adminDb.collection('orders').doc(orderId)

  try {
    const claim = await adminDb.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(orderRef)

      if (!snapshot.exists) return { error: 'not_found' }

      const data = snapshot.data()

      if (data.userId !== user.uid) return { error: 'forbidden' }

      if (data.telegramNotificationStatus === 'sent') {
        return { error: 'already_sent' }
      }

      if (data.telegramNotificationStatus === 'sending') {
        const startedAt = data.telegramNotificationStartedAt
        const recent =
          startedAt?.toMillis &&
          Date.now() - startedAt.toMillis() < 120000

        if (recent) return { error: 'processing' }
      }

      transaction.update(orderRef, {
        telegramNotificationStatus: 'sending',
        telegramNotificationStartedAt: Timestamp.now(),
      })

      return { data }
    })

    if (claim.error === 'not_found') {
      return res.status(404).json({ error: 'Order not found' })
    }

    if (claim.error === 'forbidden') {
      return res.status(403).json({ error: 'Access denied' })
    }

    if (claim.error === 'already_sent') {
      return res.status(200).json({ ok: true, alreadySent: true })
    }

    if (claim.error === 'processing') {
      return res.status(409).json({ error: 'Notification is processing' })
    }

    const order = claim.data
    const customer = order.customer || {}
    const items = Array.isArray(order.items) ? order.items : []

    const message = [
      `New order #${orderId}`,
      `Status: ${String(order.status || 'new').slice(0, 30)}`,
      `Total: ${Number(order.total || 0).toLocaleString('ru-RU')} сом`,
      '',
      `Customer: ${String(customer.name || 'Not provided').slice(0, 150)}`,
      `Phone: ${String(customer.phone || 'Not provided').slice(0, 80)}`,
      `Address: ${String(customer.address || 'Not provided').slice(0, 250)}`,
      '',
      'Items:',
      ...items.slice(0, 50).map(
        (item) =>
          `- ${String(item.name || 'Product').slice(0, 150)} × ${Number(item.quantity) || 0}`
      ),
    ].join('\n').slice(0, 4000)

    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: message }),
      }
    )

    const payload = await response.json()

    if (!response.ok || !payload.ok) {
      console.error('TELEGRAM API ERROR:', payload.description || response.status)
      throw new Error('Telegram API rejected the message')
    }

    await orderRef.update({
      telegramNotificationStatus: 'sent',
      telegramNotificationSentAt: FieldValue.serverTimestamp(),
    })

    return res.status(200).json({ ok: true })
  } catch (error) {
    console.error('ORDER NOTIFICATION ERROR:', error?.message)

    try {
      await orderRef.update({ telegramNotificationStatus: 'failed' })
    } catch (updateError) {
      console.error('ORDER STATUS UPDATE ERROR:', updateError?.message)
    }

    return res.status(502).json({
      error: 'Could not send Telegram notification',
    })
  }
}
