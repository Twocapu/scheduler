import { useState, useEffect } from 'react'
import { useAuth } from './AuthContext'

const defaultTasks = [
  { id: 1, text: 'Begin my ADHD journey', type: 'simple', completed: false },
  { id: 2, text: 'Drink water cups', type: 'counter', current: 4, total: 8, completed: false },
  { id: 3, text: 'Create a social media plan', type: 'simple', completed: false },
  { id: 4, text: 'Brush teeth', type: 'simple', completed: true },
  { id: 5, text: 'Do homework', type: 'simple', completed: true },
  { id: 6, text: 'Call Mom', type: 'simple', completed: true },
  { id: 7, text: 'Make breakfast', type: 'simple', completed: true },
]

export default function App() {
  const { user, signInWithGoogle, signOut } = useAuth()
  
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('tasks')
    if (saved) {
      try { return JSON.parse(saved) } catch(e) { return defaultTasks }
    }
    return defaultTasks
  })
  
  const [isManageView, setIsManageView] = useState(false)
  
  const [newTaskName, setNewTaskName] = useState('')
  const [newTaskType, setNewTaskType] = useState('simple')
  const [newTaskTarget, setNewTaskTarget] = useState(1)

  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks))
  }, [tasks])

  const toggleTask = (id) => {
    if (isManageView) return
    setTasks(tasks.map(t => {
      if (t.id === id) {
        let current = t.current
        if (t.type === 'counter') {
          current = !t.completed ? t.total : 0
        }
        return { ...t, current, completed: !t.completed }
      }
      return t
    }))
  }

  const updateCounter = (e, id, delta) => {
    if (isManageView) return
    e.stopPropagation()
    setTasks(tasks.map(t => {
      if (t.id === id && t.type === 'counter') {
        const current = Math.max(0, Math.min(t.total, t.current + delta))
        return { ...t, current, completed: current === t.total }
      }
      return t
    }))
  }

  const addTask = () => {
    if (!newTaskName.trim()) return alert('Please enter a task name.')
    const newTask = {
      id: Date.now(),
      text: newTaskName.trim(),
      type: newTaskType,
      completed: false
    }
    if (newTask.type === 'counter') {
      const target = parseInt(newTaskTarget, 10)
      if (isNaN(target) || target < 1) return alert('Please enter a valid target.')
      newTask.current = 0
      newTask.total = target
    }
    setTasks([...tasks, newTask])
    setNewTaskName('')
  }

  const editTask = (id) => {
    const task = tasks.find(t => t.id === id)
    if (!task) return
    const newName = prompt('Enter new task name:', task.text)
    if (newName && newName.trim()) {
      let updatedTask = { ...task, text: newName.trim() }
      if (task.type === 'counter') {
        const newTotalStr = prompt(`Enter new total target (current is ${task.total}):`, task.total)
        const newTotal = parseInt(newTotalStr, 10)
        if (!isNaN(newTotal) && newTotal > 0) {
          updatedTask.total = newTotal
          updatedTask.current = Math.min(task.current, newTotal)
          updatedTask.completed = updatedTask.current === newTotal
        }
      }
      setTasks(tasks.map(t => t.id === id ? updatedTask : t))
    }
  }

  const deleteTask = (id) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      setTasks(tasks.filter(t => t.id !== id))
    }
  }

  const activeTasks = tasks.filter(t => !t.completed)
  const completedTasks = tasks.filter(t => t.completed)

  return (
    <>
      <header className="bg-[#dcffe7] dark:bg-emerald-950 docked full-width top-0 z-50 sticky">
        <div className="flex justify-between items-center px-6 py-6 w-full max-w-2xl mx-auto">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setIsManageView(false)}>
            <h1 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold tracking-tight text-[#006a30] dark:text-emerald-400">
              {isManageView ? 'Manage Tasks' : 'Today'}
            </h1>
            {!isManageView && <span className="material-symbols-outlined text-[#006a30] dark:text-emerald-400 text-xl transition-transform group-hover:translate-y-0.5">expand_more</span>}
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="text-sm font-semibold text-on-surface flex flex-col items-end">
                  <span>{user.user_metadata?.full_name || user.email}</span>
                </div>
                {user.user_metadata?.avatar_url && (
                  <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-8 h-8 rounded-full border border-outline-variant/30" />
                )}
                <button onClick={signOut} className="text-sm font-bold text-error bg-error-container/20 px-3 py-1.5 rounded-full hover:bg-error-container hover:text-on-error-container transition-colors">
                  Logout
                </button>
              </div>
            ) : (
              <button onClick={signInWithGoogle} className="flex items-center gap-2 bg-white dark:bg-emerald-900 px-4 py-2 rounded-full shadow-sm hover:shadow-md transition-all active:scale-95 border border-outline-variant/20">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span className="text-sm font-bold text-on-surface">Login</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {!isManageView ? (
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
                    {activeTasks.length > 0 ? 'Completed' : 'All Tasks Completed!'}
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
          </section>
        </main>
      ) : (
        <main className="max-w-2xl mx-auto px-6 space-y-8 block pb-32 pt-2">
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-on-surface mb-4">Add New Task</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">Task Name</label>
                <input type="text" value={newTaskName} onChange={e => setNewTaskName(e.target.value)} className="w-full rounded-lg border-outline-variant/30 bg-surface/50 focus:ring-primary focus:border-primary px-4 py-2" placeholder="e.g. Read 10 pages" />
              </div>
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-on-surface mb-1">Type</label>
                  <select value={newTaskType} onChange={e => setNewTaskType(e.target.value)} className="w-full rounded-lg border-outline-variant/30 bg-surface/50 focus:ring-primary focus:border-primary px-4 py-2">
                    <option value="simple">Simple (Check)</option>
                    <option value="counter">Counter (e.g. 0/8)</option>
                  </select>
                </div>
                {newTaskType === 'counter' && (
                  <div className="w-24">
                    <label className="block text-sm font-medium text-on-surface mb-1">Target</label>
                    <input type="number" value={newTaskTarget} onChange={e => setNewTaskTarget(e.target.value)} className="w-full rounded-lg border-outline-variant/30 bg-surface/50 focus:ring-primary focus:border-primary px-4 py-2" min="1" />
                  </div>
                )}
              </div>
              <button onClick={addTask} className="w-full bg-primary text-on-primary font-bold py-3 rounded-xl hover:bg-primary-dim transition-colors mt-2">Add Task</button>
            </div>
          </div>

          <div className="space-y-4">
            {tasks.length === 0 ? (
              <div className="text-center py-8 text-on-surface-variant font-medium">No tasks found. Create one above!</div>
            ) : tasks.map(task => (
              <div key={task.id} className="bg-surface-container-lowest rounded-xl p-5 shadow-sm flex items-center gap-4 border border-outline-variant/10">
                <div className="flex-1">
                  <h3 className="text-on-surface font-semibold text-lg inline-block">{task.text}</h3>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ml-2 ${task.type === 'counter' ? 'bg-primary/10 text-primary' : 'bg-surface-variant/50 text-on-surface-variant'}`}>
                    {task.type === 'counter' ? `Counter ${task.current}/${task.total}` : 'Simple'}
                  </span>
                  <span className={`text-xs font-bold uppercase tracking-widest block mt-1 ${task.completed ? 'text-outline' : 'text-primary'}`}>
                    {task.completed ? 'Completed' : 'Active'}
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

      <button onClick={() => setIsManageView(!isManageView)} className="fixed bottom-8 right-8 w-16 h-16 rounded-full bg-primary text-white shadow-lg flex items-center justify-center z-[100] active:scale-95 transition-all focus:outline-none focus:ring-4 focus:ring-primary/30 group">
        <span className="material-symbols-outlined text-3xl transition-transform duration-500 group-hover:rotate-180">
          {isManageView ? 'close' : 'settings'}
        </span>
      </button>
    </>
  )
}
