'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

interface ClientPortalProps {
    children: React.ReactNode
    selector: string
}

export default function ClientPortal({ children, selector }: ClientPortalProps) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        return () => setMounted(false)
    }, [])

    return mounted ? createPortal(children, document.querySelector(selector) as HTMLElement) : null
}
