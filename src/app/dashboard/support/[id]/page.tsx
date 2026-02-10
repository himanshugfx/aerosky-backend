'use client'

import { ArrowLeft, Loader2, Send } from 'lucide-react'
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

const statusConfig: Record<string, { color: string, bg: string }> = {
    OPEN: { color: 'text-yellow-600', bg: 'bg-yellow-100' },
    IN_PROGRESS: { color: 'text-blue-600', bg: 'bg-blue-100' },
    RESOLVED: { color: 'text-green-600', bg: 'bg-green-100' },
    CLOSED: { color: 'text-gray-600', bg: 'bg-gray-100' },
}

const statusOptions = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']
const priorityOptions = ['LOW', 'NORMAL', 'HIGH', 'URGENT']

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
            <div className="flex items-center justify-center py-12 h-[calc(100vh-200px)]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        )
    }

    if (!ticket) return null

    return (
        <div className="max-w-6xl mx-auto flex flex-col h-[calc(100vh-120px)]">
            {/* Header */}
            <div className="bg-white border border-gray-200 rounded-t-xl p-4 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push('/dashboard/support')}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-500" />
                    </button>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">{ticket.subject}</h2>
                        <div className="flex items-center gap-2 mt-1">
                            {isSuperAdmin ? (
                                <select
                                    value={ticket.status}
                                    onChange={(e) => handleStatusUpdate(e.target.value)}
                                    disabled={updatingStatus}
                                    className={`text-xs font-medium px-2 py-0.5 rounded-full border-0 focus:ring-2 focus:ring-blue-500 cursor-pointer ${statusConfig[ticket.status].bg} ${statusConfig[ticket.status].color}`}
                                >
                                    {statusOptions.map(opt => (
                                        <option key={opt} value={opt}>{opt.replace('_', ' ')}</option>
                                    ))}
                                </select>
                            ) : (
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig[ticket.status].bg} ${statusConfig[ticket.status].color}`}>
                                    {ticket.status.replace('_', ' ')}
                                </span>
                            )}
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-500">Priority: {ticket.priority}</span>
                            {isSuperAdmin && (
                                <>
                                    <span className="text-xs text-gray-400">•</span>
                                    <span className="text-xs font-medium text-gray-700">{ticket.organization?.name}</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
                <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium text-gray-900">{ticket.user?.fullName}</p>
                    <p className="text-xs text-gray-500">{ticket.user?.email}</p>
                </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto bg-gray-50 p-6 space-y-4 border-x border-gray-200">
                {ticket.messages.map((msg, index) => {
                    const isMine = msg.senderId === currentUserId
                    return (
                        <div
                            key={msg.id}
                            className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`max-w-[80%] rounded-2xl px-4 py-2 shadow-sm ${isMine
                                ? 'bg-blue-600 text-white rounded-tr-none'
                                : 'bg-white text-gray-900 border border-gray-200 rounded-tl-none'
                                }`}>
                                <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                                <p className={`text-[10px] mt-1 text-right ${isMine ? 'text-blue-100' : 'text-gray-400'}`}>
                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                    )
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Footer / Input */}
            <div className="bg-white border border-gray-200 rounded-b-xl p-4 shrink-0">
                {ticket.status === 'CLOSED' ? (
                    <div className="text-center py-2 text-gray-500 text-sm italic">
                        This ticket is closed and cannot receive further replies.
                    </div>
                ) : (
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                        <textarea
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type your reply here..."
                            rows={1}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none outline-none"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault()
                                    handleSendMessage(e)
                                }
                            }}
                        />
                        <button
                            type="submit"
                            disabled={!newMessage.trim() || sending}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                            <span className="hidden sm:inline">Send</span>
                        </button>
                    </form>
                )}
            </div>
        </div>
    )
}
