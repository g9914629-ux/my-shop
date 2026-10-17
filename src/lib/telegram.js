
import { buildTelegramOrderMessage } from './order'

export async function sendOrderToTelegram(order) {
  const response = await fetch('/api/send-telegram', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: buildTelegramOrderMessage(order),
    }),
  })

  const payload = await response.json()

  if (!response.ok || !payload.ok) {
    throw new Error(
      payload.error || 'Telegram notification failed'
    )
  }

  return payload
}
