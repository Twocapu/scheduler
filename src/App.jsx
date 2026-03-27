import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from './AuthContext'
import { supabase } from './supabase'

export default function App() {
  const { t, i18n } = useTranslation()
  const { user, signInWithGoogle, signOut } = useAuth()

  const [tasks, setTasks] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isManageView, setIsManageView] = useState(false)

  const [newTaskName, setNewTaskName] = useState('')
  const [newTaskType, setNewTaskType] = useState('simple')
  const [newTaskTarget, setNewTaskTarget] = useState(1)

  useEffect(() => {
    if (user) {
      fetchTasks()
    } else {
      setTasks([])
    }
  }, [user])

  const fetchTasks = async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching tasks:', error.message)
    } else {
      setTasks(data || [])
    }
    setIsLoading(false)
  }

  const toggleTask = async (id) => {
    if (isManageView || !user) return
    const task = tasks.find(t => t.id === id)
    if (!task) return

    let current = task.current
    if (task.type === 'counter') {
      current = !task.completed ? task.total : 0
    }
    const newCompleted = !task.completed

    // Optimistic update
    setTasks(tasks.map(t => t.id === id ? { ...t, current, completed: newCompleted } : t))

    // DB update
    const { error } = await supabase
      .from('todos')
      .update({ completed: newCompleted, current })
      .eq('id', id)

    if (error) {
      console.error(error)
      fetchTasks() // revert
    }
  }

  const updateCounter = async (e, id, delta) => {
    if (isManageView || !user) return
    e.stopPropagation()
    const task = tasks.find(t => t.id === id)
    if (!task || task.type !== 'counter') return

    const newCurrent = Math.max(0, Math.min(task.total, task.current + delta))
    const newCompleted = newCurrent === task.total

    // Optimistic update
    setTasks(tasks.map(t => t.id === id ? { ...t, current: newCurrent, completed: newCompleted } : t))

    const { error } = await supabase
      .from('todos')
      .update({ current: newCurrent, completed: newCompleted })
      .eq('id', id)

    if (error) {
      console.error(error)
      fetchTasks() // revert
    }
  }

  const addTask = async () => {
    if (!user) return alert(t('tasks.pleaseLogin'))
    if (!newTaskName.trim()) return alert(t('tasks.pleaseEnterName'))

    const newTask = {
      text: newTaskName.trim(),
      type: newTaskType,
      completed: false,
      user_id: user.id
    }
    if (newTask.type === 'counter') {
      const target = parseInt(newTaskTarget, 10)
      if (isNaN(target) || target < 1) return alert(t('tasks.pleaseEnterValidTarget'))
      newTask.current = 0
      newTask.total = target
    }

    const { data, error } = await supabase
      .from('todos')
      .insert([newTask])
      .select()

    if (error) {
      console.error(error)
      alert(t('tasks.errorAdding') + error.message)
    } else if (data) {
      setTasks([...tasks, data[0]])
      setNewTaskName('')
      setNewTaskTarget(1)
    }
  }

  const editTask = async (id) => {
    const task = tasks.find(t => t.id === id)
    if (!task) return
    const newName = prompt(t('tasks.enterNewName'), task.text)
    if (newName && newName.trim()) {
      let updates = { text: newName.trim() }
      if (task.type === 'counter') {
        const newTotalStr = prompt(t('tasks.enterNewTarget', { current: task.total }), task.total)
        const newTotal = parseInt(newTotalStr, 10)
        if (!isNaN(newTotal) && newTotal > 0) {
          updates.total = newTotal
          updates.current = Math.min(task.current, newTotal)
          updates.completed = updates.current === newTotal
        }
      }

      setTasks(tasks.map(t => t.id === id ? { ...t, ...updates } : t))

      const { error } = await supabase.from('todos').update(updates).eq('id', id)
      if (error) {
        console.error(error)
        fetchTasks()
      }
    }
  }

  const deleteTask = async (id) => {
    if (window.confirm(t('tasks.confirmDelete'))) {
      setTasks(tasks.filter(t => t.id !== id))
      const { error } = await supabase.from('todos').delete().eq('id', id)
      if (error) {
        console.error(error)
        fetchTasks()
      }
    }
  }

  const activeTasks = tasks.filter(t => !t.completed)
  const completedTasks = tasks.filter(t => t.completed)

  return (
    <>
      <header className="bg-[#dcffe7] dark:bg-emerald-950 docked full-width top-0 z-50 sticky shadow-sm">
        <div className="flex justify-between items-center px-6 py-6 w-full max-w-2xl mx-auto">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setIsManageView(false)}>
            <h1 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold tracking-tight text-[#006a30] dark:text-emerald-400">
              {isManageView ? t('header.manageTasks') : t('header.today')}
            </h1>
            {!isManageView && <span className="material-symbols-outlined text-[#006a30] dark:text-emerald-400 text-xl transition-transform group-hover:translate-y-0.5">expand_more</span>}
          </div>
          <div className="flex items-center gap-4">
            <select
              value={i18n.language.startsWith('ko') ? 'ko' : 'en'}
              onChange={(e) => i18n.changeLanguage(e.target.value)}
              className="appearance-none text-xs font-bold text-[#006a30] dark:text-emerald-400 bg-white/50 dark:bg-emerald-900/50 px-3 py-1.5 rounded-full hover:bg-white dark:hover:bg-emerald-800 transition-colors border border-outline-variant/20 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20"
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
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                <span className="text-sm font-bold text-on-surface">{t('header.login')}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {!user ? (
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
      ) : isLoading ? (
        <main className="max-w-2xl mx-auto px-6 mt-16 text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-16 bg-surface-variant/30 rounded-xl w-full"></div>
            <div className="h-16 bg-surface-variant/30 rounded-xl w-full"></div>
            <div className="h-16 bg-surface-variant/30 rounded-xl w-full"></div>
          </div>
        </main>
      ) : !isManageView ? (
        <main className="max-w-2xl mx-auto px-6 space-y-8 block">
          <section className="space-y-6 pt-2">
            {activeTasks.map(task => (
              <div key={task.id} onClick={() => toggleTask(task.id)} className="bg-surface-container-lowest rounded-xl p-6 shadow-[0px_10px_30px_rgba(2,54,33,0.03)] flex items-center gap-5 group transition-all hover:bg-white/90 cursor-pointer">
                {task.type === 'counter' && (
                  <div className="bg-primary/10 px-3 py-1 rounded-full">
                    <span className="text-primary font-bold text-sm tracking-widest">{task.current}/{task.total}</span>
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-on-surface font-semibold text-lg">{task.text}</p>
                </div>
                {task.type === 'counter' ? (
                  <div className="flex items-center gap-2">
                    <button onClick={(e) => updateCounter(e, task.id, -1)} className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-primary hover:bg-primary hover:text-on-primary transition-colors active:scale-90">
                      <span className="material-symbols-outlined font-bold">remove</span>
                    </button>
                    <button onClick={(e) => updateCounter(e, task.id, 1)} className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-primary hover:bg-primary hover:text-on-primary transition-colors active:scale-90">
                      <span className="material-symbols-outlined font-bold">add</span>
                    </button>
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-full border-2 border-outline-variant/30 flex items-center justify-center bg-transparent group-hover:border-primary transition-colors"></div>
                )}
              </div>
            ))}

            {completedTasks.length > 0 && (
              <>
                <div className="flex items-center gap-4 py-2 mt-4">
                  <span className="text-on-surface-variant/60 font-bold text-xs uppercase tracking-widest">
                    {activeTasks.length > 0 ? t('tasks.completed') : t('tasks.allCompleted')}
                  </span>
                  <div className="h-[1px] flex-1 bg-outline-variant/20"></div>
                </div>
                <div className="space-y-4">
                  {completedTasks.map(task => (
                    <div key={task.id} onClick={() => toggleTask(task.id)} className="bg-surface-variant/30 rounded-lg p-5 flex items-center gap-5 transition-all opacity-80 cursor-pointer hover:opacity-100 group">
                      <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center group-hover:scale-95 transition-transform">
                        <span className="material-symbols-outlined text-surface text-lg font-bold">check</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-on-surface-variant font-medium line-through decoration-on-surface-variant/40">
                          {task.text} {task.type === 'counter' && `(${task.total}/${task.total})`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {tasks.length === 0 && (
              <div className="text-center py-12">
                <p className="text-on-surface-variant text-lg">{t('tasks.emptyList')}</p>
              </div>
            )}
          </section>
        </main>
      ) : (
        <main className="max-w-2xl mx-auto px-6 space-y-8 block pb-32 pt-2">
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-on-surface mb-4">{t('form.addNewTask')}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">{t('form.taskName')}</label>
                <input type="text" value={newTaskName} onChange={e => setNewTaskName(e.target.value)} className="w-full rounded-lg border-outline-variant/30 bg-surface/50 focus:ring-primary focus:border-primary px-4 py-2" placeholder={t('form.placeholder')} />
              </div>
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-on-surface mb-1">{t('form.type')}</label>
                  <select value={newTaskType} onChange={e => setNewTaskType(e.target.value)} className="w-full rounded-lg border-outline-variant/30 bg-surface/50 focus:ring-primary focus:border-primary px-4 py-2">
                    <option value="simple">{t('form.typeSimple')}</option>
                    <option value="counter">{t('form.typeCounter')}</option>
                  </select>
                </div>
                {newTaskType === 'counter' && (
                  <div className="w-24">
                    <label className="block text-sm font-medium text-on-surface mb-1">{t('form.target')}</label>
                    <input type="number" value={newTaskTarget} onChange={e => setNewTaskTarget(Number(e.target.value))} className="w-full rounded-lg border-outline-variant/30 bg-surface/50 focus:ring-primary focus:border-primary px-4 py-2" min="1" />
                  </div>
                )}
              </div>
              <button onClick={addTask} className="w-full bg-primary text-on-primary font-bold py-3 rounded-xl hover:bg-primary-dim transition-colors mt-2 shadow-sm">{t('form.addTaskButton')}</button>
            </div>
          </div>

          <div className="space-y-4">
            {tasks.length === 0 ? (
              <div className="text-center py-8 text-on-surface-variant font-medium">{t('tasks.noTasks')}</div>
            ) : tasks.map(task => (
              <div key={task.id} className="bg-surface-container-lowest rounded-xl p-5 shadow-sm flex items-center gap-4 border border-outline-variant/10">
                <div className="flex-1">
                  <h3 className="text-on-surface font-semibold text-lg inline-block">{task.text}</h3>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ml-2 ${task.type === 'counter' ? 'bg-primary/10 text-primary' : 'bg-surface-variant/50 text-on-surface-variant'}`}>
                    {task.type === 'counter' ? `${t('tasks.counter')} ${task.current}/${task.total}` : t('tasks.simple')}
                  </span>
                  <span className={`text-xs font-bold uppercase tracking-widest block mt-1 ${task.completed ? 'text-outline' : 'text-primary'}`}>
                    {task.completed ? t('tasks.completed') : t('tasks.active')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => editTask(task.id)} className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-surface-variant transition-colors group">
                    <span className="material-symbols-outlined text-xl transition-transform group-hover:scale-110">edit</span>
                  </button>
                  <button onClick={() => deleteTask(task.id)} className="w-10 h-10 rounded-full bg-error-container/20 flex items-center justify-center text-error hover:bg-error-container hover:text-on-error-container transition-colors group">
                    <span className="material-symbols-outlined text-xl transition-transform group-hover:scale-110">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>
      )}

      {user && (
        <button onClick={() => setIsManageView(!isManageView)} className="fixed bottom-8 right-8 w-16 h-16 rounded-full bg-primary text-white shadow-lg flex items-center justify-center z-[100] active:scale-95 transition-all focus:outline-none focus:ring-4 focus:ring-primary/30 group">
          <span className="material-symbols-outlined text-3xl transition-transform duration-500 group-hover:rotate-180">
            {isManageView ? 'close' : 'settings'}
          </span>
        </button>
      )}
    </>
  )
}
