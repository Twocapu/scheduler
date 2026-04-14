import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function BottomNavBar() {
  const { t } = useTranslation()
  const location = useLocation()
  
  const tabs = [
    { path: '/', icon: 'fact_check', label: t('nav.routine') },
    { path: '/wish', icon: 'lightbulb', label: t('nav.wish') },
    { path: '/plans', icon: 'calendar_month', label: t('nav.plans') }
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-surface/90 backdrop-blur-md border-t border-outline-variant/20 pb-safe z-[90]">
      <div className="flex justify-around items-center h-20 max-w-2xl mx-auto px-2">
        {tabs.map(tab => {
          const isActive = location.pathname === tab.path
          return (
            <Link 
              key={tab.path} 
              to={tab.path}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                isActive ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <div className={`w-14 h-8 flex items-center justify-center rounded-full transition-all ${
                isActive ? 'bg-primary-container' : 'bg-transparent'
              }`}>
                <span className={`material-symbols-outlined text-2xl ${isActive ? 'filled text-primary-fixed-dim' : ''}`}>
                  {tab.icon}
                </span>
              </div>
              <span className={`text-[10px] font-bold ${isActive ? 'text-primary' : 'text-on-surface-variant'}`}>
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
