'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Auth from '../components/Auth'
import Link from 'next/link'

const getRegion = (id) => {
    if (id <= 151) return 'Kanto'
    if (id <= 251) return 'Johto'
    if (id <= 386) return 'Hoenn'
    if (id <= 493) return 'Sinnoh'
    if (id <= 649) return 'Unova'
    if (id <= 721) return 'Kalos'
    if (id <= 809) return 'Alola'
    if (id <= 905) return 'Galar'
    return 'Paldea'
}

const regionTotals = {
    Kanto: 151, Johto: 100, Hoenn: 135, Sinnoh: 107,
    Unova: 156, Kalos: 72, Alola: 88, Galar: 96, Paldea: 120
}

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

    const byRegion = savedPokemon.reduce((acc, p) => {
        const region = getRegion(p.pokemon_id)
        acc[region] = (acc[region] || 0) + 1
        return acc
    }, {})

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
                        your pokédex 🌸
                    </h1>
                    <button
                        onClick={() => supabase.auth.signOut()}
                        className="text-sm text-gray-400 hover:text-pink-400"
                    >
                        sign out
                    </button>
                </div>

                {/* stats */}
                <div className="w-full mb-8">
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="bg-pink-50 rounded-2xl p-4 text-center border border-pink-200">
                            <p className="text-4xl text-pink-400" style={{ fontFamily: 'VT323, monospace' }}>
                                {savedPokemon.length}
                            </p>
                            <p className="text-xs text-gray-400 font-semibold mt-1">caught</p>
                        </div>
                        <div className="bg-pink-50 rounded-2xl p-4 text-center border border-pink-200">
                            <p className="text-4xl text-pink-400" style={{ fontFamily: 'VT323, monospace' }}>
                                {Object.keys(byRegion).length}
                            </p>
                            <p className="text-xs text-gray-400 font-semibold mt-1">regions explored</p>
                        </div>
                        <div className="bg-pink-50 rounded-2xl p-4 text-center border border-pink-200">
                            <p className="text-4xl text-pink-400" style={{ fontFamily: 'VT323, monospace' }}>
                                {Math.round((savedPokemon.length / 1025) * 100)}%
                            </p>
                            <p className="text-xs text-gray-400 font-semibold mt-1">complete</p>
                        </div>
                    </div>

                    <h2 className="text-2xl text-pink-400 mb-3" style={{ fontFamily: 'VT323, monospace' }}>by region</h2>
                    <div className="flex flex-col gap-2 mb-6">
                        {Object.entries(regionTotals).map(([region, total]) => {
                            const caught = byRegion[region] || 0
                            const pct = Math.round((caught / total) * 100)
                            return (
                                <div key={region}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-500 font-semibold">{region}</span>
                                        <span className="text-pink-400" style={{ fontFamily: 'VT323, monospace' }}>
                                            {caught}/{total}
                                        </span>
                                    </div>
                                    <div className="w-full bg-pink-100 rounded-full h-2">
                                        <div
                                            className="bg-pink-400 h-2 rounded-full transition-all"
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
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