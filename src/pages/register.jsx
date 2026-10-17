
import { useState } from 'react'
import { Link, useNavigate, useOutletContext } from 'react-router-dom'
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth'
import { auth } from '../firebase'

const translations = {
  ru: {
    title: 'Создай аккаунт',
    description: 'Присоединяйся к нам и собирай свою коллекцию любимых вещей.',
    name: 'Твоё имя',
    namePlaceholder: 'Имя',
    email: 'Электронная почта',
    password: 'Пароль',
    passwordPlaceholder: 'Минимум 6 символов',
    submit: 'Создать аккаунт',
    loading: 'Создаём аккаунт...',
    existing: 'Уже есть аккаунт?',
    login: 'Войти',
    footer: 'ТВОЙ СТИЛЬ. ТВОЙ ВЫБОР.',
    shortPassword: 'Пароль должен содержать минимум 6 символов.',
    emailExists: 'Этот email уже зарегистрирован.',
    invalidEmail: 'Проверь правильность email.',
    weakPassword: 'Выбери более надёжный пароль.',
    generalError: 'Не удалось зарегистрироваться. Попробуй ещё раз.',
  },
  kg: {
    title: 'Аккаунт түзүү',
    description: 'Бизге кошулуп, өзүңө жаккан кийимдердин коллекциясын чогулт.',
    name: 'Атың',
    namePlaceholder: 'Атыңды жаз',
    email: 'Электрондук почта',
    password: 'Сырсөз',
    passwordPlaceholder: 'Кеминде 6 белги',
    submit: 'Аккаунт түзүү',
    loading: 'Аккаунт түзүлүүдө...',
    existing: 'Аккаунтуң барбы?',
    login: 'Кирүү',
    footer: 'СЕНИН СТИЛИҢ. СЕНИН ТАНДООҢ.',
    shortPassword: 'Сырсөз кеминде 6 белгиден турушу керек.',
    emailExists: 'Бул электрондук почта катталган.',
    invalidEmail: 'Электрондук почтаны текшер.',
    weakPassword: 'Күчтүүрөөк сырсөз танда.',
    generalError: 'Катталуу ишке ашкан жок. Кайра аракет кыл.',
  },
  en: {
    title: 'Create an account',
    description: 'Join us and build your collection of favorite pieces.',
    name: 'Your name',
    namePlaceholder: 'Name',
    email: 'Email address',
    password: 'Password',
    passwordPlaceholder: 'At least 6 characters',
    submit: 'Create account',
    loading: 'Creating account...',
    existing: 'Already have an account?',
    login: 'Log in',
    footer: 'YOUR STYLE. YOUR CHOICE.',
    shortPassword: 'Password must contain at least 6 characters.',
    emailExists: 'This email is already registered.',
    invalidEmail: 'Please check your email address.',
    weakPassword: 'Please choose a stronger password.',
    generalError: 'Registration failed. Please try again.',
  },
}

function Register() {
  const { language = 'ru' } = useOutletContext()
  const t = translations[language] || translations.ru

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()

  async function handleRegister(event) {
    event.preventDefault()
    setError('')

    if (password.length < 6) {
      setError(t.shortPassword)
      return
    }

    setLoading(true)

    try {
      const result = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      )

      if (name.trim()) {
        await updateProfile(result.user, {
          displayName: name.trim(),
        })
      }

      navigate('/')
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        setError(t.emailExists)
      } else if (error.code === 'auth/invalid-email') {
        setError(t.invalidEmail)
      } else if (error.code === 'auth/weak-password') {
        setError(t.weakPassword)
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

        <h1>{t.title}</h1>

        <p className="login-description">
          {t.description}
        </p>

        <form onSubmit={handleRegister} className="login-form">
          <label>
            <span>{t.name}</span>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t.namePlaceholder}
              autoComplete="name"
              required
            />
          </label>

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
              autoComplete="new-password"
              minLength={6}
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
          {t.existing} <Link to="/login">{t.login}</Link>
        </p>

        <p className="login-footer">
          {t.footer}
        </p>
      </section>
    </main>
  )
}

export default Register
