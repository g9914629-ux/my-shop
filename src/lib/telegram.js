
import { auth } from '../firebase'

export async function sendOrderToTelegram(order) {
  const user = auth.currentUser

  if (!user) {
    throw new Error('Please sign in before sending an order')
  }

  const idToken = await user.getIdToken()

  const response = await fetch('/api/send-telegram', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      orderId: order.id,
    }),
  })

  const responseText = await response.text()
  let payload
  try {
    payload = JSON.parse(responseText)
  } catch {
    throw new Error(
      `Telegram API returned an invalid response (HTTP ${response.status})`
    )
  }

  if (!response.ok || !payload.ok) {
    throw new Error(
      payload.error || 'Telegram notification failed'
    )
  }

  return payload
}
