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

export default function Pokedex({ initialPokemon }) {
    const [search, setSearch] = useState('')
    const [selectedType, setSelectedType] = useState('all')
    const [pokemon, setPokemon] = useState(initialPokemon)
    const [offset, setOffset] = useState(20)
    const [loadingMore, setLoadingMore] = useState(false)
    const [searchResult, setSearchResult] = useState(null)
    const [searchLoading, setSearchLoading] = useState(false)

    const getEvolutionChain = async (pokemonData) => {
        const speciesResponse = await fetch(pokemonData.species.url)
        const species = await speciesResponse.json()

        const evoResponse = await fetch(species.evolution_chain.url)
        const evoData = await evoResponse.json()

        // recursively get all branches
        const names = []

        const traverse = (node) => {
            names.push(node.species.name)
            node.evolves_to.forEach(next => traverse(next))
        }

        traverse(evoData.chain)

        return names
    }

    const handleSearch = async (e) => {
        const value = e.target.value
        setSearch(value)
        setSearchResult(null)

        if (value.length > 2) {
            setSearchLoading(true)
            const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${value.toLowerCase()}`)
            if (response.ok) {
                const found = await response.json()

                // get evolution chain
                const evoNames = await getEvolutionChain(found)

                // fetch all pokemon in the chain
                const evoChain = await Promise.all(
                    evoNames.map(name =>
                        fetch(`https://pokeapi.co/api/v2/pokemon/${name}`).then(r => r.json())
                    )
                )

                setSearchResult(evoChain)
            }
            setSearchLoading(false)
        }
    }

    const loadMore = async () => {
        setLoadingMore(true)
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=20&offset=${offset}`)
        const data = await response.json()
        const newPokemon = await Promise.all(
            data.results.map((p) => fetch(p.url).then((res) => res.json()))
        )
        setPokemon(prev => [...prev, ...newPokemon])
        setOffset(prev => prev + 20)
        setLoadingMore(false)
    }

    const filtered = searchResult
        ? searchResult
        : pokemon.filter(p => {
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
                onChange={handleSearch}
                className="border border-pink-200 rounded-full px-4 py-2 w-full mb-4 outline-none"
            />
            {searchLoading && <p className="text-pink-400 text-sm mb-4" style={{ fontFamily: 'VT323, monospace' }}>searching...</p>}
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
            <div className="flex justify-center mt-8 mb-8">
                {!searchResult && offset < 1025 && (
                    <button
                        onClick={loadMore}
                        className="px-6 py-3 bg-pink-400 text-white rounded-full text-lg"
                        style={{ fontFamily: 'VT323, monospace' }}
                    >
                        {loadingMore ? 'loading...' : 'load more pokémon'}
                    </button>
                )}
            </div>
        </div>
    )
}