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
  const [isAdding, setIsAdding] = useState(false)

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
    if (!user) return
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
    if (!user) return
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
      setIsAdding(false)
    }
  }

  const editRoutine = async (e, id) => {
    e.stopPropagation()
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

  const deleteRoutine = async (e, id) => {
    e.stopPropagation()
    if (window.confirm(t('routines.confirmDelete'))) {
      setRoutines(routines.filter(t => t.id !== id))
      await supabase.from('routines').delete().eq('id', id)
    }
  }

  const resetAllRoutines = async () => {
    if (!user) return
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
      <Header title={t('nav.routine')} showChevron={false} />
      
      <main className="max-w-2xl mx-auto px-4 pb-28 pt-4">
        
        {/* Top Add Button & Form */}
        {!isAdding ? (
          <div className="flex gap-4 mb-6">
            <button 
              onClick={resetAllRoutines}
              className="flex-1 bg-surface-variant/30 hover:bg-surface-variant/50 text-on-surface-variant font-bold py-4 rounded-xl border border-outline-variant/20 transition-all flex justify-center items-center gap-2 active:scale-95"
            >
              <span className="material-symbols-outlined">refresh</span>
              {t('routines.resetBtn')}
            </button>
            <button 
              onClick={() => setIsAdding(true)}
              className="flex-[2] bg-primary-container/30 hover:bg-primary-container/50 text-primary-fixed-variant font-bold py-4 rounded-xl border border-primary/10 border-dashed transition-all flex justify-center items-center gap-2 active:scale-95"
            >
              <span className="material-symbols-outlined">add_circle</span>
              {t('routines.addNewBtn')}
            </button>
          </div>
        ) : (
          <div className="mb-6 bg-white rounded-2xl p-5 shadow-sm border border-outline-variant/20">
            <h3 className="font-bold text-on-surface mb-3">{t('form.addNewTask')}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1">{t('form.taskName')}</label>
                <input type="text" value={newRoutineName} onChange={e => setNewRoutineName(e.target.value)} className="w-full text-sm rounded-lg border-outline-variant/30 bg-surface/50 border focus:ring-1 focus:ring-primary focus:outline-none px-4 py-3" placeholder={t('form.placeholder')} />
              </div>
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1">{t('form.type')}</label>
                  <select value={newRoutineType} onChange={e => setNewRoutineType(e.target.value)} className="w-full text-sm rounded-lg border-outline-variant/30 bg-surface/50 border focus:ring-1 focus:ring-primary focus:outline-none px-4 py-3">
                    <option value="simple">{t('form.typeSimple')}</option>
                    <option value="counter">{t('form.typeCounter')}</option>
                  </select>
                </div>
                {newRoutineType === 'counter' && (
                  <div className="w-24">
                    <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1">{t('form.target')}</label>
                    <input type="number" value={newRoutineTarget} onChange={e => setNewRoutineTarget(Number(e.target.value))} className="w-full text-sm rounded-lg border-outline-variant/30 bg-surface/50 border focus:ring-1 focus:ring-primary focus:outline-none px-4 py-3" min="1" />
                  </div>
                )}
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setIsAdding(false)} className="flex-1 bg-surface-variant/30 text-on-surface-variant font-bold py-2.5 rounded-xl text-sm">{t('routines.cancel')}</button>
                <button onClick={addRoutine} className="flex-1 bg-primary text-on-primary font-bold py-2.5 rounded-xl text-sm">{t('routines.save')}</button>
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-10"><span className="material-symbols-outlined animate-spin text-primary text-3xl">refresh</span></div>
        ) : (
          <section className="space-y-6 pt-2">
            {activeRoutines.map(routine => (
              <div key={routine.id} onClick={() => toggleRoutine(routine.id)} className="bg-surface-container-lowest rounded-xl p-5 shadow-[0px_10px_30px_rgba(2,54,33,0.03)] flex flex-col group transition-all border border-outline-variant/10 hover:border-primary/30 cursor-pointer">
                
                <div className="flex justify-between items-start mb-2">
                   <div className="flex gap-2 items-center">
                     {routine.type === 'counter' ? (
                       <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-primary/10 text-primary`}>
                         {t('routines.counter')} {routine.current}/{routine.total}
                       </span>
                     ) : (
                       <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-surface-variant/50 text-on-surface-variant`}>
                         {t('routines.simple')}
                       </span>
                     )}
                   </div>
                   <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                     <button onClick={(e) => editRoutine(e, routine.id)} className="text-outline hover:text-primary transition-colors p-1"><span className="material-symbols-outlined text-sm">edit</span></button>
                     <button onClick={(e) => deleteRoutine(e, routine.id)} className="text-outline hover:text-error transition-colors p-1"><span className="material-symbols-outlined text-sm">delete</span></button>
                   </div>
                </div>

                <div className="flex items-center gap-5">
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
                    <div key={routine.id} onClick={() => toggleRoutine(routine.id)} className="bg-surface-variant/30 rounded-lg p-4 flex flex-col transition-all cursor-pointer hover:bg-surface-variant/50 group border border-transparent hover:border-outline-variant/30">
                      
                      <div className="flex justify-between items-start mb-1">
                         {routine.type === 'counter' ? (
                           <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-primary/10 text-primary`}>
                             {t('routines.counter')} {routine.current}/{routine.total}
                           </span>
                         ) : <div></div>}
                         <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-y-[-4px]">
                           <button onClick={(e) => editRoutine(e, routine.id)} className="text-outline hover:text-primary transition-colors p-1"><span className="material-symbols-outlined text-sm">edit</span></button>
                           <button onClick={(e) => deleteRoutine(e, routine.id)} className="text-outline hover:text-error transition-colors p-1"><span className="material-symbols-outlined text-sm">delete</span></button>
                         </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center group-hover:scale-95 transition-transform"><span className="material-symbols-outlined text-surface text-sm font-bold">check</span></div>
                        <div className="flex-1"><p className="text-on-surface-variant font-medium line-through decoration-on-surface-variant/40">{routine.text}</p></div>
                      </div>

                    </div>
                  ))}
                </div>
              </>
            )}

            {routines.length === 0 && (
              <div className="text-center py-12"><p className="text-on-surface-variant text-sm italic">{t('routines.emptyList')}</p></div>
            )}
          </section>
        )}
      </main>
    </>
  )
}
