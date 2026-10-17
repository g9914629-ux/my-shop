
import { useState } from 'react'
import { Link, useNavigate, useOutletContext } from 'react-router-dom'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase'

const translations = {
  ru: {
    eyebrow: 'С РАДОСТЬЮ СНОВА',
    title: 'С возвращением',
    description: 'Войди в аккаунт, чтобы продолжить покупки.',
    email: 'Электронная почта',
    password: 'Пароль',
    passwordPlaceholder: 'Введи свой пароль',
    submit: 'Войти в аккаунт',
    loading: 'Входим...',
    noAccount: 'Ещё нет аккаунта?',
    register: 'Создать аккаунт',
    invalid: 'Неверный email или пароль.',
    generalError: 'Не удалось войти. Попробуй ещё раз.',
    footer: 'ТВОЙ СТИЛЬ. ТВОЙ ВЫБОР.',
  },
  kg: {
    eyebrow: 'КАЙРА КЕЛГЕНИҢЕ КУБАНЫЧТАБЫЗ',
    title: 'Кайра кош келиң',
    description: 'Сатып алууну улантуу үчүн аккаунтуңа кир.',
    email: 'Электрондук почта',
    password: 'Сырсөз',
    passwordPlaceholder: 'Сырсөзүңдү жаз',
    submit: 'Аккаунтка кирүү',
    loading: 'Кирүүдө...',
    noAccount: 'Аккаунтуң жокпу?',
    register: 'Аккаунт түзүү',
    invalid: 'Электрондук почта же сырсөз туура эмес.',
    generalError: 'Кирүү ишке ашкан жок. Кайра аракет кыл.',
    footer: 'СЕНИН СТИЛИҢ. СЕНИН ТАНДООҢ.',
  },
  en: {
    eyebrow: 'NICE TO HAVE YOU BACK',
    title: 'Welcome back',
    description: 'Log in to your account to continue shopping.',
    email: 'Email address',
    password: 'Password',
    passwordPlaceholder: 'Enter your password',
    submit: 'Log in',
    loading: 'Logging in...',
    noAccount: "Don't have an account?",
    register: 'Create an account',
    invalid: 'Incorrect email or password.',
    generalError: 'Could not log in. Please try again.',
    footer: 'YOUR STYLE. YOUR CHOICE.',
  },
}

function Login() {
  const { language = 'ru' } = useOutletContext()
  const t = translations[language] || translations.ru

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()

  async function handleLogin(event) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      )
      navigate('/')
    } catch (error) {
      if (
        error.code === 'auth/invalid-credential' ||
        error.code === 'auth/user-not-found' ||
        error.code === 'auth/wrong-password'
      ) {
        setError(t.invalid)
      } else {
        setError(t.generalError)
        console.error(error)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-page page-width">
      <section className="login-card">
        <div className="login-brand">
          MY-SHOP<span>.</span>
        </div>

        <p className="eyebrow">{t.eyebrow}</p>
        <h1>{t.title}</h1>

        <p className="login-description">
          {t.description}
        </p>

        <form onSubmit={handleLogin} className="login-form">
          <label>
            <span>{t.email}</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@example.com"
              autoComplete="email"
              required
            />
          </label>

          <label>
            <span>{t.password}</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={t.passwordPlaceholder}
              autoComplete="current-password"
              required
            />
          </label>

          {error && (
            <p className="login-error" role="alert">
              {error}
            </p>
          )}

          <button
            className="login-submit"
            type="submit"
            disabled={loading}
          >
            {loading ? t.loading : t.submit}
          </button>
        </form>

        <p className="login-register">
          {t.noAccount}{' '}
          <Link to="/register">{t.register}</Link>
        </p>

        <p className="login-footer">{t.footer}</p>
      </section>
    </main>
  )
}

export default Login
