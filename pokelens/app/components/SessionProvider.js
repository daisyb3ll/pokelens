'use client'

import { useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function SessionProvider({ children }) {
    useEffect(() => {
        supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN') {
                console.log('signed in!', session)
            }
        })
    }, [])

    return children
}