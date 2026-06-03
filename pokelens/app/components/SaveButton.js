'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function SaveButton({ pokemon }) {
    const [saved, setSaved] = useState(false)
    const [session, setSession] = useState(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
            if (session) checkIfSaved(session)
        })
    }, [])

    const checkIfSaved = async (session) => {
        const { data } = await supabase
            .from('saved_pokemon')
            .select('*')
            .eq('user_id', session.user.id)
            .eq('pokemon_id', pokemon.id)
        setSaved(data && data.length > 0)
    }

    const handleSave = async () => {
        if (!session) {
            alert('log in to save pokemon!')
            return
        }
        setLoading(true)
        if (saved) {
            await supabase
                .from('saved_pokemon')
                .delete()
                .eq('user_id', session.user.id)
                .eq('pokemon_id', pokemon.id)
            setSaved(false)
        } else {
            await supabase
                .from('saved_pokemon')
                .insert({
                    user_id: session.user.id,
                    pokemon_id: pokemon.id,
                    pokemon_name: pokemon.name,
                    sprite_url: pokemon.sprites.front_default
                })
            setSaved(true)
        }
        setLoading(false)
    }

    return (
        <button
            onClick={handleSave}
            className={`px-6 py-2 rounded-full text-lg mt-4 ${saved
                    ? 'bg-pink-100 text-pink-400 border border-pink-400'
                    : 'bg-pink-400 text-white'
                }`}
            style={{ fontFamily: 'VT323, monospace' }}
        >
            {loading ? 'saving...' : saved ? 'saved!' : 'save pokémon'}
        </button>
    )
}