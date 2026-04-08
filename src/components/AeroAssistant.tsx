'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useRef, useState } from 'react'
import {
    Bot,
    ChevronDown,
    Loader2,
    Maximize2,
    Minimize2,
    Send,
    Sparkles,
    X,
} from 'lucide-react'

interface Message {
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
}

const SUGGESTED_PROMPTS = [
    'Summarize the current business status',
    'How many drones are in the fleet?',
    'What are today\'s active orders?',
    'Give me improvement suggestions',
    'How can I optimize inventory?',
    'Show me flight statistics',
]

function MarkdownText({ text }: { text: string }) {
    // Simple markdown parser for bold, bullets, and line breaks
    const lines = text.split('\n')
    return (
        <div className="space-y-1.5">
            {lines.map((line, i) => {
                if (line.startsWith('## ')) {
                    return <p key={i} className="font-black text-sm text-slate-900 mt-2">{line.replace('## ', '')}</p>
                }
                if (line.startsWith('# ')) {
                    return <p key={i} className="font-black text-base text-slate-900 mt-2">{line.replace('# ', '')}</p>
                }
                if (line.startsWith('- ') || line.startsWith('* ')) {
                    return (
                        <div key={i} className="flex items-start gap-2">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-orange-500 flex-shrink-0" />
                            <span className="text-sm leading-relaxed">{formatBold(line.slice(2))}</span>
                        </div>
                    )
                }
                if (line.trim() === '') return <div key={i} className="h-1" />
                return <p key={i} className="text-sm leading-relaxed">{formatBold(line)}</p>
            })}
        </div>
    )
}

function formatBold(text: string) {
    const parts = text.split(/\*\*(.*?)\*\*/g)
    return parts.map((part, i) =>
        i % 2 === 1 ? <strong key={i} className="font-bold text-slate-900">{part}</strong> : part
    )
}

export default function AeroAssistant() {
    const { data: session } = useSession()
    const [isOpen, setIsOpen] = useState(false)
    const [isExpanded, setIsExpanded] = useState(false)
    const [messages, setMessages] = useState<Message[]>([])
    const [inputValue, setInputValue] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isVisible, setIsVisible] = useState(false)
    const [showSuggestions, setShowSuggestions] = useState(true)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLTextAreaElement>(null)

    // Animate in after mount
    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), 800)
        return () => clearTimeout(timer)
    }, [])

    // Auto-scroll to bottom
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
        }
    }, [messages])

    // Focus input when panel opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 300)
        }
    }, [isOpen])

    // Show welcome message when first opened
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            const welcomeMsg: Message = {
                role: 'assistant',
                content: `Hello ${session?.user?.name?.split(' ')[0] || 'there'}! ✈️ I'm **Aero**, your AeroSky AI assistant.\n\nI have access to your live dashboard data — drones, orders, flights, expenses, and more. Ask me anything about your operations, or let me suggest improvements!`,
                timestamp: new Date(),
            }
            setMessages([welcomeMsg])
        }
    }, [isOpen, session?.user?.name])

    const sendMessage = async (text?: string) => {
        const messageText = text || inputValue.trim()
        if (!messageText || isLoading) return

        setInputValue('')
        setShowSuggestions(false)

        const userMsg: Message = {
            role: 'user',
            content: messageText,
            timestamp: new Date(),
        }
        setMessages((prev) => [...prev, userMsg])
        setIsLoading(true)

        try {
            const res = await fetch('/api/assistant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: messageText,
                    history: messages.map((m) => ({ role: m.role, content: m.content })),
                }),
            })

            const data = await res.json()
            const assistantMsg: Message = {
                role: 'assistant',
                content: data.reply || 'Something went wrong. Please try again.',
                timestamp: new Date(),
            }
            setMessages((prev) => [...prev, assistantMsg])
        } catch {
            const errMsg: Message = {
                role: 'assistant',
                content: 'I\'m experiencing turbulence reaching the server. Please try again in a moment.',
                timestamp: new Date(),
            }
            setMessages((prev) => [...prev, errMsg])
        } finally {
            setIsLoading(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            sendMessage()
        }
    }

    const clearChat = () => {
        setMessages([])
        setShowSuggestions(true)
    }

    if (!session) return null

    return (
        <>
            {/* Floating Trigger Button */}
            <div
                className={`fixed bottom-6 right-6 z-[200] transition-all duration-700 ${
                    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
            >
                <button
                    onClick={() => setIsOpen((prev) => !prev)}
                    id="aero-assistant-trigger"
                    aria-label="Open Aero AI Assistant"
                    className={`
                        relative w-14 h-14 rounded-2xl shadow-2xl flex items-center justify-center transition-all duration-500 group
                        ${isOpen
                            ? 'bg-slate-900 shadow-slate-900/30 rotate-0'
                            : 'bg-gradient-to-br from-orange-500 to-orange-700 shadow-orange-600/40 hover:scale-110 hover:-rotate-6'
                        }
                    `}
                >
                    {/* Pulse ring when closed */}
                    {!isOpen && (
                        <span className="absolute inset-0 rounded-2xl bg-orange-500 animate-ping opacity-20" />
                    )}
                    <span className="relative z-10 transition-all duration-300">
                        {isOpen ? (
                            <X className="w-5 h-5 text-white" />
                        ) : (
                            <div className="flex flex-col items-center">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                        )}
                    </span>

                    {/* Tooltip */}
                    {!isOpen && (
                        <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 pointer-events-none">
                            <div className="bg-slate-900 text-white text-[10px] font-black tracking-wider uppercase px-3 py-1.5 rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-xl">
                                Aero Assistant
                                <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-slate-900" />
                            </div>
                        </div>
                    )}
                </button>
            </div>

            {/* Chat Panel */}
            <div
                className={`
                    fixed z-[199] transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
                    ${isOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}
                    ${isExpanded
                        ? 'inset-4 lg:inset-8'
                        : 'bottom-24 right-6 w-[min(420px,calc(100vw-3rem))]'
                    }
                `}
                style={{ transformOrigin: 'bottom right' }}
            >
                <div className="flex flex-col h-full bg-white rounded-3xl shadow-[0_32px_80px_rgba(0,0,0,0.25)] border border-slate-200/80 overflow-hidden"
                    style={{ height: isExpanded ? '100%' : '560px' }}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-slate-900 to-slate-800 flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30 flex-shrink-0">
                                <Bot className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="text-white font-black text-sm tracking-tight">Aero Assistant</p>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                                    <span className="text-slate-400 text-[10px] font-bold tracking-wider uppercase">
                                        {isLoading ? 'Thinking...' : 'Online · Powered by Gemini'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={clearChat}
                                className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-all text-[10px] font-bold tracking-wider uppercase"
                                title="Clear chat"
                            >
                                Clear
                            </button>
                            <button
                                onClick={() => setIsExpanded((p) => !p)}
                                className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-all"
                                title={isExpanded ? 'Minimize' : 'Expand'}
                            >
                                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-all"
                            >
                                <ChevronDown className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scroll-smooth bg-slate-50/50"
                        style={{ scrollbarWidth: 'thin', scrollbarColor: '#e2e8f0 transparent' }}
                    >
                        {messages.map((msg, i) => (
                            <div
                                key={i}
                                className={`flex gap-3 animate-slide-up ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                            >
                                {/* Avatar */}
                                {msg.role === 'assistant' && (
                                    <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm shadow-orange-500/30">
                                        <Sparkles className="w-4 h-4 text-white" />
                                    </div>
                                )}

                                {/* Bubble */}
                                <div
                                    className={`
                                        max-w-[85%] rounded-2xl px-4 py-3 shadow-sm
                                        ${msg.role === 'user'
                                            ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-tr-sm ml-auto'
                                            : 'bg-white border border-slate-100 text-slate-700 rounded-tl-sm'
                                        }
                                    `}
                                >
                                    {msg.role === 'user' ? (
                                        <p className="text-sm leading-relaxed">{msg.content}</p>
                                    ) : (
                                        <MarkdownText text={msg.content} />
                                    )}
                                    <p className={`text-[9px] mt-2 font-bold tracking-wider ${msg.role === 'user' ? 'text-orange-200 text-right' : 'text-slate-400'}`}>
                                        {msg.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        ))}

                        {/* Loading indicator */}
                        {isLoading && (
                            <div className="flex gap-3 animate-slide-up">
                                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <Sparkles className="w-4 h-4 text-white" />
                                </div>
                                <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                                    <div className="flex items-center gap-1">
                                        <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Suggestions */}
                    {showSuggestions && messages.length <= 1 && !isLoading && (
                        <div className="px-4 py-2 border-t border-slate-100 bg-white flex-shrink-0">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Quick prompts</p>
                            <div className="flex flex-wrap gap-1.5">
                                {SUGGESTED_PROMPTS.slice(0, 4).map((prompt, i) => (
                                    <button
                                        key={i}
                                        onClick={() => sendMessage(prompt)}
                                        className="text-[10px] font-bold px-3 py-1.5 bg-slate-50 hover:bg-orange-50 hover:text-orange-600 border border-slate-200 hover:border-orange-200 rounded-lg transition-all duration-200 text-slate-600 whitespace-nowrap"
                                    >
                                        {prompt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Input Area */}
                    <div className="px-4 py-3 border-t border-slate-100 bg-white flex-shrink-0">
                        <div className="flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 focus-within:border-orange-300 focus-within:ring-4 focus-within:ring-orange-50 transition-all">
                            <textarea
                                ref={inputRef}
                                id="aero-assistant-input"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Ask Aero anything about your operations..."
                                disabled={isLoading}
                                rows={1}
                                className="flex-1 bg-transparent resize-none text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none disabled:opacity-60 max-h-24 overflow-y-auto"
                                style={{ scrollbarWidth: 'none' }}
                            />
                            <button
                                onClick={() => sendMessage()}
                                disabled={!inputValue.trim() || isLoading}
                                className="w-8 h-8 flex-shrink-0 flex items-center justify-center bg-orange-600 hover:bg-orange-700 disabled:bg-slate-200 disabled:cursor-not-allowed text-white rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
                                aria-label="Send message"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                    <Send className="w-3.5 h-3.5" />
                                )}
                            </button>
                        </div>
                        <p className="text-center text-[9px] text-slate-400 font-bold tracking-wider mt-2 uppercase">
                            Press Enter to send · Shift+Enter for new line
                        </p>
                    </div>
                </div>
            </div>
        </>
    )
}
