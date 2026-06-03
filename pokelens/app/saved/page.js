'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Auth from '../components/Auth'
import Link from 'next/link'

export default function SavedPage() {
    const [session, setSession] = useState(null)
    const [savedPokemon, setSavedPokemon] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
            setLoading(false)
        })

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session)
        })

        return () => subscription.unsubscribe()
    }, [])

    useEffect(() => {
        if (session) loadSaved()
    }, [session])

    const loadSaved = async () => {
        const { data } = await supabase
            .from('saved_pokemon')
            .select('*')
            .eq('user_id', session.user.id)
        setSavedPokemon(data || [])
    }

    if (loading) return (
        <main className="pt-24 min-h-screen flex justify-center">
            <p className="text-pink-400" style={{ fontFamily: 'VT323, monospace' }}>loading...</p>
        </main>
    )

    if (!session) return (
        <main className="pt-24 min-h-screen flex justify-center">
            <Auth />
        </main>
    )

    return (
        <main className="pt-24 min-h-screen">
            <div className="max-w-4xl mx-auto px-4">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-4xl text-pink-400" style={{ fontFamily: 'VT323, monospace' }}>
                        your pokémon 🌸
                    </h1>
                    <button
                        onClick={() => supabase.auth.signOut()}
                        className="text-sm text-gray-400 hover:text-pink-400"
                    >
                        sign out
                    </button>
                </div>
                {savedPokemon.length === 0 ? (
                    <p className="text-gray-400" style={{ fontFamily: 'VT323, monospace' }}>
                        no saved pokémon yet! go catch some 🌸
                    </p>
                ) : (
                    <div className="grid grid-cols-4 gap-4">
                        {savedPokemon.map(p => (
                            <Link href={`/pokemon/${p.pokemon_id}`} key={p.id}>
                                <div className="border border-pink-200 rounded-2xl p-4 bg-white text-center">
                                    <img src={p.sprite_url} alt={p.pokemon_name} className="w-20 h-20 mx-auto" />
                                    <p style={{ fontFamily: 'VT323, monospace' }} className="text-lg text-pink-400">{p.pokemon_name}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </main>
    )
}