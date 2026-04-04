'use client'

import { useState, useEffect } from 'react'
import { 
    ChevronLeft, 
    ChevronRight, 
    Clock, 
    Link as LinkIcon,
    Building2,
    Calendar as CalendarIcon
} from 'lucide-react'
import Link from 'next/link'

interface FollowUp {
    id: string
    title: string
    description?: string
    scheduledAt: string
    status: string
    lead: {
        name: string
        company?: string
    }
}

export default function FollowUpCalendar() {
    const [followUps, setFollowUps] = useState<FollowUp[]>([])
    const [currentDate, setCurrentDate] = useState(new Date())
    const [loading, setLoading] = useState(true)

    const fetchFollowUps = async () => {
        try {
            const res = await fetch('/api/follow-ups')
            if (res.ok) {
                const data = await res.json()
                setFollowUps(data)
            }
        } catch (error) {
            console.error('Failed to fetch follow-ups:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchFollowUps()
    }, [])

    const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate()
    const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay()

    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))

    const renderHeader = () => {
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
        return (
            <div className="flex items-center justify-between mb-4 px-4">
                <div className="space-y-2">
                    <h2 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tightest uppercase italic">
                        {monthNames[currentDate.getMonth()]} <span className="text-slate-300 font-medium">{currentDate.getFullYear()}</span>
                    </h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                        Engagement Schedule <CalendarIcon className="w-3 h-3" />
                    </p>
                </div>
                <div className="flex gap-4">
                    <button onClick={prevMonth} className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-orange-600 hover:border-orange-100 transition-all shadow-sm">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button onClick={nextMonth} className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-orange-600 hover:border-orange-100 transition-all shadow-sm">
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>
        )
    }

    const renderDays = () => {
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
        return (
            <div className="grid grid-cols-7 mb-2">
                {days.map(day => (
                    <div key={day} className="text-center text-[9px] font-black text-slate-300 uppercase tracking-widest py-2">
                        {day}
                    </div>
                ))}
            </div>
        )
    }

    const renderCells = () => {
        const year = currentDate.getFullYear()
        const month = currentDate.getMonth()
        const totalDays = daysInMonth(year, month)
        const startDay = firstDayOfMonth(year, month)
        const cells = []

        // Empty cells for alignment
        for (let i = 0; i < startDay; i++) {
            cells.push(<div key={`empty-${i}`} className="min-h-[85px] border border-slate-50 opacity-20" />)
        }

        for (let d = 1; d <= totalDays; d++) {
            const dateStr = new Date(year, month, d).toDateString()
            const dayFollowUps = followUps.filter(f => new Date(f.scheduledAt).toDateString() === dateStr)
            const isToday = new Date().toDateString() === dateStr

            cells.push(
                <div key={d} className={`min-h-[85px] p-2 border border-slate-50 hover:bg-slate-50/50 transition-colors group relative ${isToday ? 'bg-orange-50/20' : ''}`}>
                    <div className="flex justify-between items-start mb-2">
                        <span className={`text-sm font-black tracking-tighter ${isToday ? 'text-orange-600' : 'text-slate-900 group-hover:scale-110 transition-transform'}`}>
                            {d.toString().padStart(2, '0')}
                        </span>
                        {isToday && <div className="w-1.5 h-1.5 rounded-full bg-orange-600 animate-pulse" />}
                    </div>
                    <div className="space-y-1.5 max-h-[60px] overflow-y-auto no-scrollbar">
                        {dayFollowUps.map(f => (
                            <div key={f.id} className="p-1.5 bg-white border border-slate-100 rounded-lg shadow-sm hover:border-orange-200 transition-all hover:-translate-y-0.5">
                                <p className="text-[10px] font-black text-slate-900 leading-tight line-clamp-1">{f.title}</p>
                                <div className="flex items-center justify-between mt-1">
                                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter flex items-center gap-1">
                                        <Clock className="w-2 h-2" /> {new Date(f.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    <span className="text-[8px] font-black text-orange-600 uppercase tracking-tighter line-clamp-1">{f.lead.name.split(' ')[0]}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )
        }

        return <div className="grid grid-cols-7 border-collapse rounded-[2rem] overflow-hidden border border-slate-100">{cells}</div>
    }

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-20 animate-pulse">
            <CalendarIcon className="w-12 h-12 text-slate-100 mb-4" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Generating Follow-up Tensor</p>
        </div>
    )

    return (
        <div className="modern-card p-6 animate-slide-up">
            {renderHeader()}
            {renderDays()}
            {renderCells()}
        </div>
    )
}
