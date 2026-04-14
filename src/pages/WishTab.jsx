import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../AuthContext'
import { supabase } from '../supabase'
import Header from '../components/Header'

export default function WishTab() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [wishes, setWishes] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  
  // New wish form
  const [newTitle, setNewTitle] = useState('')
  const [newPriority, setNewPriority] = useState(0)

  // Step input form state per wish
  const [newStepInputs, setNewStepInputs] = useState({})
  // Accordion state
  const [expandedHistories, setExpandedHistories] = useState({})

  useEffect(() => {
    if (user) fetchWishes()
  }, [user])

  const fetchWishes = async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('wishes')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) console.error('Error fetching wishes:', error.message)
    else setWishes(data || [])
    setIsLoading(false)
  }

  const addWish = async () => {
    if (!newTitle.trim()) return
    const wish = {
      user_id: user.id,
      title: newTitle.trim(),
      priority: newPriority,
      total_progress: 0,
      upcoming_steps: [],
      history: []
    }
    const { data, error } = await supabase.from('wishes').insert([wish]).select()
    if (error) alert(error.message)
    else {
      setWishes([data[0], ...wishes])
      setNewTitle('')
      setNewPriority(0)
      setIsAdding(false)
    }
  }

  const deleteWish = async (id) => {
    if (!window.confirm(t('wish.confirmDelete'))) return
    setWishes(wishes.filter(w => w.id !== id))
    await supabase.from('wishes').delete().eq('id', id)
  }

  const updateWish = async (id, updates) => {
    setWishes(wishes.map(w => w.id === id ? { ...w, ...updates } : w))
    const { error } = await supabase.from('wishes').update(updates).eq('id', id)
    if (error) fetchWishes() // revert
  }

  const addStep = (id, wish) => {
    const stepText = newStepInputs[id]?.trim()
    if (!stepText) return
    const updatedSteps = [...(wish.upcoming_steps || []), stepText]
    updateWish(id, { upcoming_steps: updatedSteps })
    setNewStepInputs({ ...newStepInputs, [id]: '' })
  }

  const startStep = (id, wish, stepIndex) => {
    const stepText = wish.upcoming_steps[stepIndex]
    const updatedSteps = wish.upcoming_steps.filter((_, i) => i !== stepIndex)
    updateWish(id, { current_step: stepText, upcoming_steps: updatedSteps })
  }

  const completeCurrentStep = (id, wish) => {
    if (!wish.current_step) return
    const newHistoryEntry = { date: new Date().toISOString(), text: wish.current_step }
    const updatedHistory = [newHistoryEntry, ...(wish.history || [])]
    updateWish(id, { current_step: null, history: updatedHistory })
  }

  const toggleHistory = (id) => {
    setExpandedHistories(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const renderWishCard = (wish) => {
    const isExpanded = expandedHistories[wish.id] || false
    return (
      <div key={wish.id} className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-outline-variant/20 mb-4 transition-all">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-on-surface mb-1">{wish.title}</h3>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${wish.priority > 0 ? 'bg-primary/10 text-primary' : 'bg-surface-variant text-on-surface-variant'}`}>
                {wish.priority > 0 ? t('wish.priorityLabel', { level: wish.priority }) : t('wish.ideaLabel')}
              </span>
            </div>
          </div>
          <button onClick={() => deleteWish(wish.id)} className="text-outline hover:text-error transition-colors p-1"><span className="material-symbols-outlined text-lg">delete</span></button>
        </div>

        {/* Progress Slider */}
        <div className="mb-6 bg-surface-container/30 p-3 rounded-xl">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{t('wish.progress')}</span>
            <span className="text-sm font-bold text-primary">{wish.total_progress}%</span>
          </div>
          <input 
            type="range" min="0" max="100" 
            value={wish.total_progress}
            onChange={(e) => updateWish(wish.id, { total_progress: parseInt(e.target.value) })}
            className="w-full h-2 bg-outline-variant/30 rounded-lg appearance-none cursor-pointer accent-primary"
          />
        </div>

        {/* Current Step */}
        <div className="mb-4">
          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 block">{t('wish.currentFocus')}</span>
          {wish.current_step ? (
            <div className="flex items-center bg-primary-container/20 border border-primary/20 rounded-xl p-3">
              <span className="flex-1 text-on-surface font-medium text-sm">{wish.current_step}</span>
              <button onClick={() => completeCurrentStep(wish.id, wish)} className="ml-3 w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center hover:bg-primary-dim transition-colors">
                <span className="material-symbols-outlined text-sm">check</span>
              </button>
            </div>
          ) : (
            <div className="text-xs text-outline italic">{t('wish.noCurrent')}</div>
          )}
        </div>

        {/* Upcoming Steps */}
        <div className="mb-4">
          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 block">{t('wish.upcomingSteps')}</span>
          <div className="space-y-2 mb-3">
            {(wish.upcoming_steps || []).map((step, idx) => (
              <div key={idx} className="flex items-center bg-surface-container-low rounded-lg p-2.5">
                <span className="flex-1 text-sm text-on-surface-variant">{step}</span>
                <button onClick={() => startStep(wish.id, wish, idx)} disabled={!!wish.current_step} className="ml-2 text-xs font-bold text-primary disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary/10 px-2 py-1 rounded">
                  {t('wish.start')}
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder={t('wish.addStepPlaceholder')} 
              value={newStepInputs[wish.id] || ''}
              onChange={(e) => setNewStepInputs({...newStepInputs, [wish.id]: e.target.value})}
              onKeyDown={(e) => e.key === 'Enter' && addStep(wish.id, wish)}
              className="flex-1 text-sm bg-surface/50 border border-outline-variant/30 rounded-lg px-3 py-2 focus:ring-1 focus:ring-primary focus:outline-none"
            />
            <button onClick={() => addStep(wish.id, wish)} className="bg-surface-variant/50 hover:bg-surface-variant text-on-surface-variant p-2 rounded-lg transition-colors">
              <span className="material-symbols-outlined text-sm">add</span>
            </button>
          </div>
        </div>

        {/* History Accordion */}
        {wish.history && wish.history.length > 0 && (
          <div className="mt-6 pt-4 border-t border-outline-variant/10">
            <button onClick={() => toggleHistory(wish.id)} className="w-full flex items-center justify-between text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              <span>{t('wish.history')} ({wish.history.length})</span>
              <span className="material-symbols-outlined text-sm transition-transform duration-300" style={{transform: isExpanded ? 'rotate(180deg)' : ''}}>expand_more</span>
            </button>
            
            {isExpanded && (
              <div className="mt-3 space-y-2">
                {wish.history.map((h, i) => (
                  <div key={i} className="flex flex-col gap-1 bg-surface-variant/20 rounded-lg p-3">
                    <span className="text-xs text-outline">{new Date(h.date).toLocaleDateString()}</span>
                    <span className="text-sm text-on-surface-variant line-through">{h.text}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  const activeWishes = wishes.filter(w => w.priority > 0)
  const ideas = wishes.filter(w => w.priority === 0)

  return (
    <>
      <Header title={t('wish.title')} />
      <main className="max-w-2xl mx-auto px-4 pb-28 pt-4">
        
        {/* Top Add Button & Form */}
        {!isAdding ? (
          <button 
            onClick={() => setIsAdding(true)}
            className="w-full mb-6 bg-primary-container/30 hover:bg-primary-container/50 text-primary-fixed-variant font-bold py-4 rounded-xl border border-primary/10 border-dashed transition-all flex justify-center items-center gap-2"
          >
            <span className="material-symbols-outlined">add_circle</span>
            {t('wish.addNew')}
          </button>
        ) : (
          <div className="mb-6 bg-white rounded-2xl p-5 shadow-sm border border-outline-variant/20">
            <h3 className="font-bold text-on-surface mb-3">{t('wish.newTitle')}</h3>
            <input 
              type="text" 
              placeholder={t('wish.placeholder')} 
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              className="w-full mb-3 text-sm bg-surface/50 border border-outline-variant/30 rounded-lg px-4 py-3 focus:ring-1 focus:ring-primary focus:outline-none"
            />
            <div className="flex items-center gap-3 mb-4">
              <label className="text-xs font-bold text-on-surface-variant uppercase">{t('wish.priority')}</label>
              <select 
                value={newPriority} 
                onChange={e => setNewPriority(parseInt(e.target.value))}
                className="text-sm bg-surface/50 border border-outline-variant/30 rounded-lg px-3 py-1.5 focus:outline-none"
              >
                <option value={0}>{t('wish.priority0')}</option>
                <option value={1}>{t('wish.priority1')}</option>
                <option value={2}>{t('wish.priority2')}</option>
                <option value={3}>{t('wish.priority3')}</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setIsAdding(false)} className="flex-1 bg-surface-variant/30 text-on-surface-variant font-bold py-2.5 rounded-xl text-sm">{t('wish.cancel')}</button>
              <button onClick={addWish} className="flex-1 bg-primary text-on-primary font-bold py-2.5 rounded-xl text-sm">{t('wish.save')}</button>
            </div>
          </div>
        )}

        {isLoading ? (
           <div className="text-center py-10"><span className="material-symbols-outlined animate-spin text-primary text-3xl">refresh</span></div>
        ) : (
          <div className="space-y-8">
            {/* Priority Section */}
            {(activeWishes.length > 0 || ideas.length === 0) && (
              <section>
                <h2 className="text-sm font-bold text-on-surface-variant/60 uppercase tracking-widest mb-4 px-2">{t('wish.activePriorities')}</h2>
                {activeWishes.length === 0 ? (
                  <p className="text-sm text-outline italic px-2">{t('wish.noActive')}</p>
                ) : (
                  activeWishes.map(renderWishCard)
                )}
              </section>
            )}

            {/* Ideas Box Section */}
            {ideas.length > 0 && (
              <section className="pt-4 border-t border-outline-variant/20">
                <h2 className="text-sm font-bold text-on-surface-variant/60 uppercase tracking-widest mb-4 px-2">{t('wish.ideaBox')}</h2>
                {ideas.map(renderWishCard)}
              </section>
            )}
          </div>
        )}
      </main>
    </>
  )
}
