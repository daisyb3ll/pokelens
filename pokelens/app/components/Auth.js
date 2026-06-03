'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Auth() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [sent, setSent] = useState(false)

    const handleLogin = async (e) => {
        e.preventDefault()
        setLoading(true)
        const { error } = await supabase.auth.signInWithOtp({ email })
        if (error) {
            alert(error.message)
        } else {
            setSent(true)
        }
        setLoading(false)
    }

    if (sent) {
        return (
            <div className="text-center">
                <p className="text-2xl text-pink-400" style={{ fontFamily: 'VT323, monospace' }}>
                    check your email! 🌸
                </p>
                <p className="text-gray-400 text-sm mt-2">we sent you a magic link to log in</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col items-center gap-4 max-w-sm mx-auto">
            <p className="text-2xl text-pink-400" style={{ fontFamily: 'VT323, monospace' }}>
                log in to save pokémon
            </p>
            <input
                type="email"
                placeholder="your email..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border border-pink-200 rounded-full px-4 py-2 w-full outline-none"
            />
            <button
                onClick={handleLogin}
                className="px-6 py-2 bg-pink-400 text-white rounded-full w-full"
                style={{ fontFamily: 'VT323, monospace' }}
            >
                {loading ? 'sending...' : 'send magic link ✨'}
            </button>
        </div>
    )
}