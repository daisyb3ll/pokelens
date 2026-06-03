'use client'

import { useState } from 'react'
import PokemonCard from './PokemonCard'

const types = ['all', 'fire', 'water', 'grass', 'electric', 'psychic', 'bug', 'normal', 'poison', 'flying']
const typeColors = {
    all: 'bg-pink-400 border-pink-400',
    fire: 'bg-orange-400 border-orange-400',
    water: 'bg-blue-400 border-blue-400',
    grass: 'bg-green-400 border-green-400',
    electric: 'bg-yellow-400 border-yellow-400',
    psychic: 'bg-purple-400 border-purple-400',
    bug: 'bg-lime-500 border-lime-500',
    normal: 'bg-gray-400 border-gray-400',
    poison: 'bg-violet-500 border-violet-500',
    flying: 'bg-sky-400 border-sky-400',
}

const typeTextColors = {
    all: 'text-pink-400 border-pink-400',
    fire: 'text-orange-400 border-orange-400',
    water: 'text-blue-400 border-blue-400',
    grass: 'text-green-400 border-green-400',
    electric: 'text-yellow-400 border-yellow-400',
    psychic: 'text-purple-400 border-purple-400',
    bug: 'text-lime-500 border-lime-500',
    normal: 'text-gray-400 border-gray-400',
    poison: 'text-violet-500 border-violet-500',
    flying: 'text-sky-400 border-sky-400',
}
export default function Pokedex({ pokemon }) {
    const [search, setSearch] = useState('')
    const [selectedType, setSelectedType] = useState('all')

    const filtered = pokemon.filter(p => {
        const matchesSearch = p.name.includes(search.toLowerCase())
        const matchesType = selectedType === 'all' || p.types.some(t => t.type.name === selectedType)
        return matchesSearch && matchesType
    })

    return (
        <div className="max-w-4xl mx-auto px-4">
            <input
                type="text"
                placeholder="search pokémon..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border border-pink-200 rounded-full px-4 py-2 w-full mb-4 outline-none"
            />
            <div className="flex gap-2 mb-6 flex-wrap">
                {types.map(type => (
                    <button
                        key={type}
                        onClick={() => setSelectedType(type)}
                        className={`rounded-full text-sm border px-4 py-1 ${selectedType === type
                                ? `${typeColors[type]} text-white`
                                : typeTextColors[type]
                            }`}
                    >
                        {type}
                    </button>
                ))}
            </div>
            <div className="grid grid-cols-4 gap-4">
                {filtered.map((p) => (
                    <PokemonCard key={p.id} pokemon={p} />
                ))}
            </div>
        </div>
    )
}