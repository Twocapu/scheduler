import { useTranslation } from 'react-i18next'
import { useAuth } from '../AuthContext'

export default function Header({ title, onTitleClick, showChevron = false }) {
  const { t, i18n } = useTranslation()
  const { user, signInWithGoogle, signOut } = useAuth()

  return (
    <header className="bg-surface/90 backdrop-blur-md dark:bg-emerald-950 docked full-width top-0 z-50 sticky shadow-sm border-b border-outline-variant/10">
      <div className="flex justify-between items-center px-6 py-6 w-full max-w-2xl mx-auto">
        <div 
          className={`flex items-center gap-2 ${onTitleClick ? 'group cursor-pointer' : ''}`} 
          onClick={onTitleClick ? onTitleClick : undefined}
        >
          <h1 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold tracking-tight text-primary dark:text-emerald-400">
            {title}
          </h1>
          {showChevron && <span className="material-symbols-outlined text-primary dark:text-emerald-400 text-xl transition-transform group-hover:translate-y-0.5">expand_more</span>}
        </div>
        <div className="flex items-center gap-4">
          <select
            value={i18n.language.startsWith('ko') ? 'ko' : 'en'}
            onChange={(e) => i18n.changeLanguage(e.target.value)}
            className="appearance-none text-xs font-bold text-primary dark:text-emerald-400 bg-white/50 dark:bg-emerald-900/50 px-3 py-1.5 rounded-full hover:bg-white dark:hover:bg-emerald-800 transition-colors border border-outline-variant/20 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="ko">한글</option>
            <option value="en">Eng</option>
          </select>
          {user ? (
            <div className="flex items-center gap-3">
              <div className="text-sm font-semibold text-on-surface hidden md:flex flex-col items-end">
                <span>{user.user_metadata?.full_name || user.email}</span>
              </div>
              {user.user_metadata?.avatar_url && (
                <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-8 h-8 rounded-full border border-outline-variant/30" />
              )}
              <button onClick={signOut} className="text-sm font-bold text-error bg-error-container/20 px-3 py-1.5 rounded-full hover:bg-error-container hover:text-on-error-container transition-colors">
                {t('header.logout')}
              </button>
            </div>
          ) : (
            <button onClick={signInWithGoogle} className="flex items-center gap-2 bg-white dark:bg-emerald-900 px-4 py-2 rounded-full shadow-sm hover:shadow-md transition-all active:scale-95 border border-outline-variant/20">
              <span className="text-sm font-bold text-on-surface">{t('header.login')}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
