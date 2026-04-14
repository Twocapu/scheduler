import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../AuthContext'
import { supabase } from '../supabase'
import Header from '../components/Header'

export default function PlansTab() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [plans, setPlans] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [viewMode, setViewMode] = useState('list') // 'list' | 'calendar'
  
  // New Plan form
  const [isAdding, setIsAdding] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDate, setNewDate] = useState(() => new Date().toISOString().split('T')[0])
  const [newTime, setNewTime] = useState('12:00')

  // Calendar State
  const [currentMonth, setCurrentMonth] = useState(() => new Date())

  useEffect(() => {
    if (user) fetchPlans()
  }, [user])

  const fetchPlans = async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .order('date', { ascending: true })
      .order('time', { ascending: true })
    
    if (error) console.error(error.message)
    else setPlans(data || [])
    setIsLoading(false)
  }

  const addPlan = async () => {
    if (!newTitle.trim() || !newDate || !newTime) return
    const plan = {
      user_id: user.id,
      title: newTitle.trim(),
      date: newDate,
      time: newTime,
      is_completed: false
    }
    const { data, error } = await supabase.from('plans').insert([plan]).select()
    if (error) alert(error.message)
    else {
      setPlans([...plans, data[0]].sort((a,b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date)
        return a.time.localeCompare(b.time)
      }))
      setNewTitle('')
      setIsAdding(false)
    }
  }

  const togglePlan = async (id, currentStatus) => {
    setPlans(plans.map(p => p.id === id ? { ...p, is_completed: !currentStatus } : p))
    const { error } = await supabase.from('plans').update({ is_completed: !currentStatus }).eq('id', id)
    if (error) fetchPlans()
  }

  const deletePlan = async (id) => {
    if (!window.confirm(t('plans.confirmDelete'))) return
    setPlans(plans.filter(p => p.id !== id))
    await supabase.from('plans').delete().eq('id', id)
  }

  // --- Helpers for grouping and calendar ---
  const groupedPlans = plans.reduce((acc, plan) => {
    if (!acc[plan.date]) acc[plan.date] = []
    acc[plan.date].push(plan)
    return acc
  }, {})

  const datesWithPlans = Object.keys(groupedPlans)

  const renderListView = () => {
    if (Object.keys(groupedPlans).length === 0) {
      return <div className="text-center text-sm text-outline italic py-10">{t('plans.noPlans')}</div>
    }
    return (
      <div className="space-y-6">
        {Object.entries(groupedPlans).map(([dateStr, dayPlans]) => {
          const dateObj = new Date(dateStr)
          const isToday = dateStr === new Date().toISOString().split('T')[0]
          return (
            <div key={dateStr}>
              <h3 className={`text-sm font-bold uppercase tracking-widest mb-3 px-2 ${isToday ? 'text-primary' : 'text-on-surface-variant/60'}`}>
                {dateObj.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                {isToday && ` ${t('plans.today')}`}
              </h3>
              <div className="space-y-3">
                {dayPlans.map(plan => (
                  <div key={plan.id} className={`flex items-center gap-4 bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-outline-variant/10 transition-all ${plan.is_completed ? 'opacity-50' : ''}`}>
                    <div onClick={() => togglePlan(plan.id, plan.is_completed)} className={`w-6 h-6 rounded flex items-center justify-center cursor-pointer border-2 transition-colors ${plan.is_completed ? 'bg-primary border-primary text-white' : 'border-outline-variant/30 hover:border-primary'}`}>
                      {plan.is_completed && <span className="material-symbols-outlined text-[16px] font-bold">check</span>}
                    </div>
                    <div className="flex-1">
                      <div className={`font-bold text-on-surface ${plan.is_completed ? 'line-through' : ''}`}>{plan.title}</div>
                      <div className="text-xs text-outline">{plan.time}</div>
                    </div>
                    <button onClick={() => deletePlan(plan.id)} className="text-outline hover:text-error transition-colors p-1"><span className="material-symbols-outlined text-lg">delete</span></button>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const renderCalendarView = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    
    const startDayOfWeek = firstDay.getDay()
    const daysInMonth = lastDay.getDate()
    
    let days = []
    for(let i=0; i<startDayOfWeek; i++) {
      days.push(null)
    }
    for(let i=1; i<=daysInMonth; i++) {
      days.push(i)
    }

    const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1))
    const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1))

    return (
        <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-outline-variant/10">
          <div className="flex justify-between items-center mb-4">
            <button onClick={prevMonth} className="p-2"><span className="material-symbols-outlined text-on-surface-variant">chevron_left</span></button>
            <h3 className="font-bold text-on-surface">{currentMonth.toLocaleDateString(undefined, {month: 'long', year: 'numeric'})}</h3>
            <button onClick={nextMonth} className="p-2"><span className="material-symbols-outlined text-on-surface-variant">chevron_right</span></button>
          </div>
          <div className="grid grid-cols-7 gap-y-4 gap-x-1 text-center mb-2">
            {['S','M','T','W','T','F','S'].map((day,i) => <div key={i} className="text-[10px] font-bold text-outline uppercase">{day}</div>)}
            {days.map((day, idx) => {
              if (day === null) return <div key={idx}></div>
              const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
              const hasPlan = datesWithPlans.includes(dateStr)
              const isToday = dateStr === new Date().toISOString().split('T')[0]
              
              return (
                <div key={idx} className="flex flex-col items-center justify-start h-10">
                  <div className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium ${isToday ? 'bg-primary text-white' : 'text-on-surface'}`}>
                    {day}
                  </div>
                  {hasPlan && <div className="w-1 h-1 bg-error rounded-full mt-1"></div>}
                </div>
              )
            })}
          </div>
          <p className="text-xs text-center text-outline italic mt-4">{t('plans.editNote')}</p>
        </div>
    )
  }

  return (
    <>
      <Header title={t('plans.title')} />
      <main className="max-w-2xl mx-auto px-4 pb-28 pt-4">
        
        {/* View Toggle */}
        <div className="flex bg-surface-container-low p-1 rounded-xl mb-6 mx-auto w-48">
          <button 
            onClick={() => setViewMode('list')}
            className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-primary' : 'text-on-surface-variant'}`}
          >
            {t('plans.listView')}
          </button>
          <button 
            onClick={() => setViewMode('calendar')}
            className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-colors ${viewMode === 'calendar' ? 'bg-white shadow-sm text-primary' : 'text-on-surface-variant'}`}
          >
            {t('plans.calendarView')}
          </button>
        </div>

        {/* Add New Plan */}
        {viewMode === 'list' && (
          !isAdding ? (
            <button 
              onClick={() => setIsAdding(true)}
              className="w-full mb-6 bg-primary-container/30 hover:bg-primary-container/50 text-primary-fixed-variant font-bold py-4 rounded-xl border border-primary/10 border-dashed transition-all flex justify-center items-center gap-2"
            >
              <span className="material-symbols-outlined">add_circle</span>
              {t('plans.newAppointment')}
            </button>
          ) : (
            <div className="mb-6 bg-white rounded-2xl p-5 shadow-sm border border-outline-variant/20">
              <h3 className="font-bold text-on-surface mb-3">{t('plans.schedule')}</h3>
              <input 
                type="text" 
                placeholder={t('plans.eventTitle')} 
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                className="w-full mb-3 text-sm bg-surface/50 border border-outline-variant/30 rounded-lg px-4 py-3 focus:ring-1 focus:ring-primary focus:outline-none"
              />
              <div className="flex gap-3 mb-4">
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase mb-1 block">{t('plans.date')}</label>
                  <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="w-full text-sm bg-surface/50 border border-outline-variant/30 rounded-lg px-3 py-2 focus:outline-none" />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase mb-1 block">{t('plans.time')}</label>
                  <input type="time" value={newTime} onChange={e => setNewTime(e.target.value)} className="w-full text-sm bg-surface/50 border border-outline-variant/30 rounded-lg px-3 py-2 focus:outline-none" />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setIsAdding(false)} className="flex-1 bg-surface-variant/30 text-on-surface-variant font-bold py-2.5 rounded-xl text-sm">{t('plans.cancel')}</button>
                <button onClick={addPlan} className="flex-1 bg-primary text-on-primary font-bold py-2.5 rounded-xl text-sm">{t('plans.save')}</button>
              </div>
            </div>
          )
        )}

        {isLoading ? (
           <div className="text-center py-10"><span className="material-symbols-outlined animate-spin text-primary text-3xl">refresh</span></div>
        ) : (
          viewMode === 'list' ? renderListView() : renderCalendarView()
        )}
      </main>
    </>
  )
}
