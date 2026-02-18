'use client'

import {
    ArrowLeft,
    Loader2,
    Send,
    MessageSquare,
    Shield,
    Clock,
    AlertCircle,
    CheckCircle2,
    User,
    Building2,
    Calendar,
    ChevronDown,
    Zap,
    Lock
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

interface Message {
    id: string
    senderId: string
    message: string
    createdAt: string
}

interface Ticket {
    id: string
    subject: string
    status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
    priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
    userId: string
    organizationId: string
    createdAt: string
    updatedAt: string
    user?: { fullName: string; email: string }
    organization?: { name: string }
    messages: Message[]
}

const statusConfig: Record<string, { color: string, bg: string, ring: string, icon: any }> = {
    OPEN: { color: 'text-amber-600', bg: 'bg-amber-50', ring: 'ring-amber-200', icon: Clock },
    IN_PROGRESS: { color: 'text-blue-600', bg: 'bg-blue-50', ring: 'ring-blue-200', icon: Zap },
    RESOLVED: { color: 'text-emerald-600', bg: 'bg-emerald-50', ring: 'ring-emerald-200', icon: CheckCircle2 },
    CLOSED: { color: 'text-slate-600', bg: 'bg-slate-50', ring: 'ring-slate-200', icon: Lock },
}

const statusOptions = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']

export default function TicketChatPage() {
    const { id } = useParams()
    const router = useRouter()
    const { data: session } = useSession()
    const [ticket, setTicket] = useState<Ticket | null>(null)
    const [loading, setLoading] = useState(true)
    const [newMessage, setNewMessage] = useState('')
    const [sending, setSending] = useState(false)
    const [updatingStatus, setUpdatingStatus] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const isSuperAdmin = (session?.user as any)?.role === 'SUPER_ADMIN'
    const currentUserId = (session?.user as any)?.id

    const fetchTicket = async () => {
        if (!id) return
        setLoading(true)
        try {
            const res = await fetch(`/api/mobile/support/${id}`)
            if (res.ok) {
                const data = await res.json()
                setTicket(data)
            } else {
                router.push('/dashboard/support')
            }
        } catch (error) {
            console.error('Failed to fetch ticket:', error)
        } finally {
            setLoading(false)
        }
    }

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        if (session) fetchTicket()
    }, [session, id])

    useEffect(() => {
        scrollToBottom()
    }, [ticket?.messages])

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMessage.trim() || sending) return

        setSending(true)
        try {
            const res = await fetch(`/api/mobile/support/${id}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: newMessage.trim() })
            })
            if (res.ok) {
                setNewMessage('')
                fetchTicket()
            }
        } catch (error) {
            console.error('Failed to send message:', error)
        } finally {
            setSending(false)
        }
    }

    const handleStatusUpdate = async (newStatus: string) => {
        if (updatingStatus) return
        setUpdatingStatus(true)
        try {
            const res = await fetch(`/api/mobile/support/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            })
            if (res.ok) {
                fetchTicket()
            }
        } catch (error) {
            console.error('Failed to update status:', error)
        } finally {
            setUpdatingStatus(false)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-32 space-y-4 h-[calc(100vh-200px)]">
                <Loader2 className="w-12 h-12 animate-spin text-slate-900" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Synchronizing Encrypted Channel...</p>
            </div>
        )
    }

    if (!ticket) return null

    return (
        <div className="max-w-6xl mx-auto flex flex-col h-[calc(100vh-140px)] animate-in fade-in duration-700">
            {/* Premium Header */}
            <div className="bg-white border border-slate-200 rounded-t-[2.5rem] px-8 py-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 shrink-0 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                <div className="flex items-center gap-6 relative z-10">
                    <button
                        onClick={() => router.push('/dashboard/support')}
                        className="w-12 h-12 bg-slate-50 hover:bg-slate-900 hover:text-white rounded-2xl flex items-center justify-center transition-all shadow-sm active:scale-90 group"
                    >
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-black text-slate-900 tracking-tight">{ticket.subject}</h2>
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest px-2 py-0.5 border border-slate-100 rounded-lg">ID: {ticket.id.slice(-8).toUpperCase()}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            {isSuperAdmin ? (
                                <div className="relative group/select">
                                    <select
                                        value={ticket.status}
                                        onChange={(e) => handleStatusUpdate(e.target.value)}
                                        disabled={updatingStatus}
                                        className={`appearance-none text-[10px] font-black uppercase tracking-widest pl-3 pr-8 py-1.5 rounded-xl border-none focus:ring-4 focus:ring-slate-100 cursor-pointer shadow-sm transition-all ${statusConfig[ticket.status].bg} ${statusConfig[ticket.status].color}`}
                                    >
                                        {statusOptions.map(opt => (
                                            <option key={opt} value={opt} className="bg-white text-slate-900">{opt.replace('_', ' ')}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className={`absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 ${statusConfig[ticket.status].color} pointer-events-none group-hover/select:translate-y-0.5 transition-transform`} />
                                </div>
                            ) : (
                                <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ring-1 ring-inset ${statusConfig[ticket.status].bg} ${statusConfig[ticket.status].color} ${statusConfig[ticket.status].ring}`}>
                                    {(() => { const StatusIcon = statusConfig[ticket.status]?.icon; return StatusIcon ? <StatusIcon className="w-3.5 h-3.5" /> : null; })()}
                                    {ticket.status.replace('_', ' ')}
                                </div>
                            )}
                            <div className="w-1 h-1 rounded-full bg-slate-200"></div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Priority: {ticket.priority}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4 pl-12 sm:pl-0 relative z-10">
                    <div className="text-right">
                        <p className="text-sm font-black text-slate-900 leading-tight">{ticket.user?.fullName}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{ticket.organization?.name || 'External Link'}</p>
                    </div>
                    <div className="w-12 h-12 bg-slate-900 rounded-[1.25rem] flex items-center justify-center text-white font-black text-lg">
                        {ticket.user?.fullName?.charAt(0)}
                    </div>
                </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto bg-slate-50/50 p-8 space-y-8 border-x border-slate-200 scrollbar-hide relative">
                {ticket.messages.map((msg, index) => {
                    const isMine = msg.senderId === currentUserId
                    const showAvatar = index === 0 || ticket.messages[index - 1].senderId !== msg.senderId

                    return (
                        <div
                            key={msg.id}
                            className={`flex items-end gap-3 ${isMine ? 'flex-row-reverse' : 'flex-row'} animate-in slide-in-from-bottom-2 duration-300`}
                        >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm flex-shrink-0 transition-opacity duration-300 ${showAvatar ? 'opacity-100' : 'opacity-0'} ${isMine ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200'}`}>
                                <User className="w-4 h-4" />
                            </div>
                            <div className={`max-w-[70%] group relative ${isMine ? 'items-end' : 'items-start'}`}>
                                <div className={`rounded-[2rem] px-6 py-4 shadow-sm transition-all duration-300 hover:shadow-md ${isMine
                                    ? 'bg-slate-900 text-white rounded-br-none'
                                    : 'bg-white text-slate-900 border border-slate-200 rounded-bl-none'
                                    }`}>
                                    <p className="text-[15px] font-medium leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                                </div>
                                <div className={`flex items-center gap-2 mt-2 px-1 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    <CheckCircle2 className={`w-3 h-3 ${isMine ? 'text-blue-500' : 'text-slate-200'}`} />
                                </div>
                            </div>
                        </div>
                    )
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Premium Input Area */}
            <div className="bg-white border border-slate-200 rounded-b-[2.5rem] p-6 shrink-0 shadow-sm relative overflow-hidden">
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-slate-50 rounded-full -ml-16 -mb-16 blur-3xl"></div>
                {ticket.status === 'CLOSED' ? (
                    <div className="flex items-center justify-center gap-3 py-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 group">
                        <Lock className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-600 transition-colors">Transmission Channel Sealed: Resolved</span>
                    </div>
                ) : (
                    <form onSubmit={handleSendMessage} className="flex gap-4 items-end relative z-10">
                        <div className="flex-1 relative">
                            <textarea
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Enter response parameters..."
                                rows={2}
                                className="w-full pl-6 pr-14 py-4 bg-slate-50 border-none rounded-[1.5rem] text-[15px] font-medium focus:ring-4 focus:ring-slate-100 transition-all outline-none resize-none scrollbar-hide"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault()
                                        handleSendMessage(e)
                                    }
                                }}
                            />
                            <div className="absolute right-4 bottom-4 p-2.5 bg-white text-slate-300 rounded-xl shadow-sm border border-slate-100">
                                <MessageSquare className="w-4 h-4" />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={!newMessage.trim() || sending}
                            className="bg-slate-900 text-white p-5 rounded-[1.5rem] hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 active:scale-95 disabled:opacity-50 disabled:shadow-none group"
                        >
                            {sending ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Send className="w-6 h-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                </div>
                            )}
                        </button>
                    </form>
                )}
            </div>
        </div>
    )
}
