import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from './AuthContext'

import RoutineTab from './pages/RoutineTab'
import WishTab from './pages/WishTab'
import PlansTab from './pages/PlansTab'
import BottomNavBar from './components/BottomNavBar'

function AppContent() {
  const { user } = useAuth()

  // If not logged in, show the welcome screen (from original App.jsx)
  if (!user) {
    return <WelcomeScreen />
  }

  return (
    <div className="relative min-h-screen bg-background">
      <Routes>
        <Route path="/" element={<RoutineTab />} />
        <Route path="/wish" element={<WishTab />} />
        <Route path="/plans" element={<PlansTab />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BottomNavBar />
    </div>
  )
}

function WelcomeScreen() {
  const { t, i18n } = useTranslation()
  const { signInWithGoogle } = useAuth()

  return (
    <>
      <header className="bg-[#dcffe7] dark:bg-emerald-950 docked full-width top-0 z-50 sticky shadow-sm">
        <div className="flex justify-between items-center px-6 py-6 w-full max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            <h1 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold tracking-tight text-[#006a30] dark:text-emerald-400">
              {t('header.routine')}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={i18n.language.startsWith('ko') ? 'ko' : 'en'}
              onChange={(e) => i18n.changeLanguage(e.target.value)}
              className="appearance-none text-xs font-bold text-[#006a30] dark:text-emerald-400 bg-white/50 dark:bg-emerald-900/50 px-3 py-1.5 rounded-full"
            >
              <option value="ko">한글</option>
              <option value="en">Eng</option>
            </select>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 mt-16 text-center">
        <div className="bg-white/60 rounded-2xl p-10 shadow-sm border border-outline-variant/20 inline-block">
          <span className="material-symbols-outlined text-6xl text-primary/40 mb-4 block">fact_check</span>
          <h2 className="text-2xl font-bold text-on-surface mb-2">{t('welcome.title')}</h2>
          <p className="text-on-surface-variant mb-6">{t('welcome.description')}</p>
          <button onClick={signInWithGoogle} className="bg-primary hover:bg-primary-dim text-on-primary font-bold py-3 px-8 rounded-full transition-all shadow-md active:scale-95">
            {t('welcome.loginButton')}
          </button>
        </div>
      </main>
    </>
  )
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}
