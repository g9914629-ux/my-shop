
import { Link, NavLink } from 'react-router-dom'

function Header({
  cartCount = 0,
  user = null,
  authReady = false,
  language = 'ru',
  onLanguageChange,
  t = (key) => key,
}) {
  return (
    <header className="site-header">
      <Link className="wordmark" to="/">
        My-Shop<span>.</span>
      </Link>

      <nav className="main-nav" aria-label="Основная навигация">
        <NavLink to="/" end>{t('home')}</NavLink>
        <NavLink to="/product">{t('catalog')}</NavLink>
        <NavLink to="/favorites">{t('favorites')}</NavLink>
      </nav>

      <div className="header-right">
        <div className="header-auth">
          {authReady && user ? (
            <NavLink className="header-account" to="/profile">
              {t('profile')}
            </NavLink>
          ) : authReady ? (
            <>
              <NavLink className="header-account" to="/login">
                {t('login')}
              </NavLink>
              <NavLink className="header-register" to="/register">
                {t('register')}
              </NavLink>
            </>
          ) : null}
        </div>

        <div className="language-switcher" aria-label="Выбор языка">
          {['ru', 'kg', 'en'].map((lang) => (
            <button
              key={lang}
              type="button"
              className={language === lang ? 'language-active' : ''}
              aria-pressed={language === lang}
              onClick={() => onLanguageChange?.(lang)}
            >
              {lang.toUpperCase()}
            </button>
          ))}
        </div>

        <Link
          className="cart-link"
          to="/carts"
          aria-label={`${t('cart')}, товаров: ${cartCount}`}
        >
          <span>{t('cart')}</span>
          <span className="cart-count">{cartCount}</span>
        </Link>
      </div>
    </header>
  )
}

export default Header
