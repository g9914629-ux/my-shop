import { Buffer } from 'node:buffer'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

function telegramApi() {
  return {
    name: 'telegram-api',
    configureServer(server) {
      server.middlewares.use('/api/send-telegram', async (request, response) => {
        const sendJson = (status, payload) => {
          response.statusCode = status
          response.setHeader('Content-Type', 'application/json; charset=utf-8')
          response.end(JSON.stringify(payload))
        }

        if (request.method !== 'POST') {
          sendJson(405, { error: 'Method not allowed' })
          return
        }

        try {
          const chunks = []
          let bodySize = 0
          for await (const chunk of request) {
            bodySize += chunk.length
            if (bodySize > 16 * 1024) {
              sendJson(413, { error: 'Request body is too large' })
              return
            }
            chunks.push(chunk)
          }

          try {
            request.body = JSON.parse(Buffer.concat(chunks).toString('utf8'))
          } catch {
            sendJson(400, { error: 'Invalid JSON request body' })
            return
          }

          const { default: handler } = await import('./api/send-telegram.js')
          const apiResponse = {
            statusCode: 200,
            status(statusCode) {
              this.statusCode = statusCode
              return this
            },
            json(payload) {
              sendJson(this.statusCode, payload)
              return this
            },
          }

          await handler(request, apiResponse)
        } catch (error) {
          console.error('Local Telegram API failed:', error)
          if (!response.writableEnded) {
            sendJson(500, {
              error:
                'Local Telegram API could not start. Check Firebase Admin and Telegram environment variables.',
            })
          }
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), telegramApi()],
})
