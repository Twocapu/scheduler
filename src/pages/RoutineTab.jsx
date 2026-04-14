import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../AuthContext'
import { supabase } from '../supabase'
import Header from '../components/Header'

export default function RoutineTab() {
  const { t } = useTranslation()
  const { user } = useAuth()

  const [routines, setRoutines] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isManageView, setIsManageView] = useState(false)

  const [newRoutineName, setNewRoutineName] = useState('')
  const [newRoutineType, setNewRoutineType] = useState('simple')
  const [newRoutineTarget, setNewRoutineTarget] = useState(1)

  useEffect(() => {
    if (user) fetchRoutines()
  }, [user])

  const fetchRoutines = async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('routines')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) console.error('Error fetching routines:', error.message)
    else setRoutines(data || [])
    setIsLoading(false)
  }

  const toggleRoutine = async (id) => {
    if (isManageView || !user) return
    const routine = routines.find(t => t.id === id)
    if (!routine) return

    let current = routine.current
    if (routine.type === 'counter') {
      current = !routine.completed ? routine.total : 0
    }
    const newCompleted = !routine.completed

    setRoutines(routines.map(t => t.id === id ? { ...t, current, completed: newCompleted } : t))
    const { error } = await supabase
      .from('routines')
      .update({ completed: newCompleted, current })
      .eq('id', id)

    if (error) fetchRoutines()
  }

  const updateCounter = async (e, id, delta) => {
    if (isManageView || !user) return
    e.stopPropagation()
    const routine = routines.find(t => t.id === id)
    if (!routine || routine.type !== 'counter') return

    const newCurrent = Math.max(0, Math.min(routine.total, routine.current + delta))
    const newCompleted = newCurrent === routine.total

    setRoutines(routines.map(t => t.id === id ? { ...t, current: newCurrent, completed: newCompleted } : t))
    const { error } = await supabase
      .from('routines')
      .update({ current: newCurrent, completed: newCompleted })
      .eq('id', id)

    if (error) fetchRoutines()
  }

  const addRoutine = async () => {
    if (!user) return alert(t('routines.pleaseLogin'))
    if (!newRoutineName.trim()) return alert(t('routines.pleaseEnterName'))

    const newRoutine = { text: newRoutineName.trim(), type: newRoutineType, completed: false, user_id: user.id }
    if (newRoutine.type === 'counter') {
      const target = parseInt(newRoutineTarget, 10)
      if (isNaN(target) || target < 1) return alert(t('routines.pleaseEnterValidTarget'))
      newRoutine.current = 0
      newRoutine.total = target
    }

    const { data, error } = await supabase.from('routines').insert([newRoutine]).select()
    if (error) alert(t('routines.errorAdding') + error.message)
    else if (data) {
      setRoutines([...routines, data[0]])
      setNewRoutineName('')
      setNewRoutineTarget(1)
    }
  }

  const editRoutine = async (id) => {
    const routine = routines.find(t => t.id === id)
    if (!routine) return
    const newName = prompt(t('routines.enterNewName'), routine.text)
    if (newName && newName.trim()) {
      let updates = { text: newName.trim() }
      if (routine.type === 'counter') {
        const newTotalStr = prompt(t('routines.enterNewTarget', { current: routine.total }), routine.total)
        const newTotal = parseInt(newTotalStr, 10)
        if (!isNaN(newTotal) && newTotal > 0) {
          updates.total = newTotal
          updates.current = Math.min(routine.current, newTotal)
          updates.completed = updates.current === newTotal
        }
      }

      setRoutines(routines.map(t => t.id === id ? { ...t, ...updates } : t))
      const { error } = await supabase.from('routines').update(updates).eq('id', id)
      if (error) fetchRoutines()
    }
  }

  const deleteRoutine = async (id) => {
    if (window.confirm(t('routines.confirmDelete'))) {
      setRoutines(routines.filter(t => t.id !== id))
      await supabase.from('routines').delete().eq('id', id)
    }
  }

  const resetAllRoutines = async () => {
    if (isManageView || !user) return
    setRoutines(routines.map(t => ({ ...t, completed: false, current: t.type === 'counter' ? 0 : t.current })))
    const updatePromises = routines.map(t => {
      const updates = { completed: false }
      if (t.type === 'counter') updates.current = 0
      return supabase.from('routines').update(updates).eq('id', t.id)
    })
    const results = await Promise.all(updatePromises)
    if (results.some(res => res.error)) fetchRoutines()
  }

  const activeRoutines = routines.filter(t => !t.completed)
  const completedRoutines = routines.filter(t => t.completed)

  return (
    <>
      <Header 
        title={isManageView ? t('header.manageTasks') : 'Routine'} 
        onTitleClick={() => setIsManageView(false)}
        showChevron={!isManageView}
      />
      {isLoading ? (
        <main className="max-w-2xl mx-auto px-6 mt-16 text-center pb-24">
          <div className="animate-pulse space-y-4">
            <div className="h-16 bg-surface-variant/30 rounded-xl w-full"></div>
            <div className="h-16 bg-surface-variant/30 rounded-xl w-full"></div>
          </div>
        </main>
      ) : !isManageView ? (
        <main className="max-w-2xl mx-auto px-6 space-y-8 block pb-28 pt-2">
          <section className="space-y-6 pt-2">
            {activeRoutines.map(routine => (
              <div key={routine.id} onClick={() => toggleRoutine(routine.id)} className="bg-surface-container-lowest rounded-xl p-6 shadow-[0px_10px_30px_rgba(2,54,33,0.03)] flex items-center gap-5 group transition-all hover:bg-white/90 cursor-pointer">
                {routine.type === 'counter' && (
                  <div className="bg-primary/10 px-3 py-1 rounded-full">
                    <span className="text-primary font-bold text-sm tracking-widest">{routine.current}/{routine.total}</span>
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-on-surface font-semibold text-lg">{routine.text}</p>
                </div>
                {routine.type === 'counter' ? (
                  <div className="flex items-center gap-2">
                    <button onClick={(e) => updateCounter(e, routine.id, -1)} className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-primary hover:bg-primary hover:text-on-primary transition-colors active:scale-90"><span className="material-symbols-outlined font-bold">remove</span></button>
                    <button onClick={(e) => updateCounter(e, routine.id, 1)} className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-primary hover:bg-primary hover:text-on-primary transition-colors active:scale-90"><span className="material-symbols-outlined font-bold">add</span></button>
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-full border-2 border-outline-variant/30 flex items-center justify-center bg-transparent group-hover:border-primary transition-colors"></div>
                )}
              </div>
            ))}

            {completedRoutines.length > 0 && (
              <>
                <div className="flex items-center gap-4 py-2 mt-4">
                  <span className="text-on-surface-variant/60 font-bold text-xs uppercase tracking-widest">{activeRoutines.length > 0 ? t('routines.completed') : t('routines.allCompleted')}</span>
                  <div className="h-[1px] flex-1 bg-outline-variant/20"></div>
                  {activeRoutines.length === 0 && (
                    <button onClick={resetAllRoutines} className="text-primary hover:bg-primary/10 ml-2 p-1.5 rounded-full transition-colors flex items-center justify-center cursor-pointer active:scale-95"><span className="material-symbols-outlined text-xl">refresh</span></button>
                  )}
                </div>
                <div className="space-y-4">
                  {completedRoutines.map(routine => (
                    <div key={routine.id} onClick={() => toggleRoutine(routine.id)} className="bg-surface-variant/30 rounded-lg p-5 flex items-center gap-5 transition-all opacity-80 cursor-pointer hover:opacity-100 group">
                      <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center group-hover:scale-95 transition-transform"><span className="material-symbols-outlined text-surface text-lg font-bold">check</span></div>
                      <div className="flex-1"><p className="text-on-surface-variant font-medium line-through decoration-on-surface-variant/40">{routine.text} {routine.type === 'counter' && `(${routine.total}/${routine.total})`}</p></div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {routines.length === 0 && (
              <div className="text-center py-12"><p className="text-on-surface-variant text-lg">{t('routines.emptyList')}</p></div>
            )}
          </section>
        </main>
      ) : (
        <main className="max-w-2xl mx-auto px-6 space-y-8 block pb-40 pt-2">
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-on-surface mb-4">{t('form.addNewTask')}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">{t('form.routineName')}</label>
                <input type="text" value={newRoutineName} onChange={e => setNewRoutineName(e.target.value)} className="w-full rounded-lg border-outline-variant/30 bg-surface/50 focus:ring-primary focus:border-primary px-4 py-2" placeholder={t('form.placeholder')} />
              </div>
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-on-surface mb-1">{t('form.type')}</label>
                  <select value={newRoutineType} onChange={e => setNewRoutineType(e.target.value)} className="w-full rounded-lg border-outline-variant/30 bg-surface/50 focus:ring-primary focus:border-primary px-4 py-2">
                    <option value="simple">{t('form.typeSimple')}</option>
                    <option value="counter">{t('form.typeCounter')}</option>
                  </select>
                </div>
                {newRoutineType === 'counter' && (
                  <div className="w-24">
                    <label className="block text-sm font-medium text-on-surface mb-1">{t('form.target')}</label>
                    <input type="number" value={newRoutineTarget} onChange={e => setNewRoutineTarget(Number(e.target.value))} className="w-full rounded-lg border-outline-variant/30 bg-surface/50 focus:ring-primary focus:border-primary px-4 py-2" min="1" />
                  </div>
                )}
              </div>
              <button onClick={addRoutine} className="w-full bg-primary text-on-primary font-bold py-3 rounded-xl hover:bg-primary-dim transition-colors mt-2 shadow-sm">{t('form.addRoutineButton')}</button>
            </div>
          </div>

          <div className="space-y-4">
            {routines.map(routine => (
              <div key={routine.id} className="bg-surface-container-lowest rounded-xl p-5 shadow-sm flex items-center gap-4 border border-outline-variant/10">
                <div className="flex-1">
                  <h3 className="text-on-surface font-semibold text-lg inline-block">{routine.text}</h3>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ml-2 ${routine.type === 'counter' ? 'bg-primary/10 text-primary' : 'bg-surface-variant/50 text-on-surface-variant'}`}>
                    {routine.type === 'counter' ? `${t('routines.counter')} ${routine.current}/${routine.total}` : t('routines.simple')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => editRoutine(routine.id)} className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-surface-variant transition-colors group"><span className="material-symbols-outlined text-xl transition-transform group-hover:scale-110">edit</span></button>
                  <button onClick={() => deleteRoutine(routine.id)} className="w-10 h-10 rounded-full bg-error-container/20 flex items-center justify-center text-error hover:bg-error-container hover:text-on-error-container transition-colors group"><span className="material-symbols-outlined text-xl transition-transform group-hover:scale-110">delete</span></button>
                </div>
              </div>
            ))}
          </div>
        </main>
      )}

      {user && (
        <button onClick={() => setIsManageView(!isManageView)} className="fixed bottom-24 right-8 w-16 h-16 rounded-full bg-primary text-white shadow-lg flex items-center justify-center z-[80] active:scale-95 transition-all focus:outline-none focus:ring-4 focus:ring-primary/30 group">
          <span className="material-symbols-outlined text-3xl transition-transform duration-500 group-hover:rotate-180">
            {isManageView ? 'close' : 'settings'}
          </span>
        </button>
      )}
    </>
  )
}
