import Link from 'next/link'

import SaveButton from '../../components/SaveButton'


export default async function PokemonPage({ params }) {
    const { id } = await params
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`)
    const pokemon = await response.json()

    return (
        <main className="min-h-screen p-8 max-w-2xl mx-auto">

            <Link href="/" className="text-pink-400 text-sm mb-6 inline-block hover:text-pink-600">
                ← back to pokédex
            </Link>

            <div className="border border-pink-200 rounded-2xl p-6 bg-white">

                {/* header */}
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-gray-400 text-sm">#{pokemon.id}</p>
                        <h1 className="text-5xl text-pink-400" style={{ fontFamily: 'VT323, monospace' }}>
                            {pokemon.name}
                        </h1>
                        <div className="flex gap-2 mt-2">
                            {pokemon.types.map(t => (
                                <span key={t.type.name} className="px-3 py-1 bg-pink-100 text-pink-400 rounded-full text-sm">
                                    {t.type.name}
                                </span>
                            ))}
                        </div>
                        <SaveButton pokemon={pokemon} />
                    </div>
                    <div className="flex flex-col items-center">
                        <img src={pokemon.sprites.front_default} alt={pokemon.name} className="w-32 h-32" />
                        <p className="text-xs text-gray-400">normal</p>
                    </div>
                    <div className="flex flex-col items-center">
                        <img src={pokemon.sprites.front_shiny} alt={pokemon.name} className="w-32 h-32" />
                        <p className="text-xs text-gray-400">✨ shiny</p>
                    </div>
                </div>

                {/* basic info */}
                <div className="grid grid-cols-2 gap-4 mt-6 text-sm text-gray-500">
                    <div className="bg-pink-50 rounded-xl p-3">
                        <p className="text-xs text-gray-400">height</p>
                        <p className="text-lg" style={{ fontFamily: 'VT323, monospace' }}>{pokemon.height / 10}m</p>
                    </div>
                    <div className="bg-pink-50 rounded-xl p-3">
                        <p className="text-xs text-gray-400">weight</p>
                        <p className="text-lg" style={{ fontFamily: 'VT323, monospace' }}>{pokemon.weight / 10}kg</p>
                    </div>
                    <div className="bg-pink-50 rounded-xl p-3">
                        <p className="text-xs text-gray-400">base experience</p>
                        <p className="text-lg" style={{ fontFamily: 'VT323, monospace' }}>{pokemon.base_experience}</p>
                    </div>
                    <div className="bg-pink-50 rounded-xl p-3">
                        <p className="text-xs text-gray-400">abilities</p>
                        <p className="text-lg" style={{ fontFamily: 'VT323, monospace' }}>
                            {pokemon.abilities.map(a => a.ability.name).join(', ')}
                        </p>
                    </div>
                </div>

                {/* stats */}
                <div className="mt-6">
                    <h2 className="text-2xl text-pink-400 mb-3" style={{ fontFamily: 'VT323, monospace' }}>stats</h2>
                    {pokemon.stats.map(stat => (
                        <div key={stat.stat.name} className="mb-3">
                            <div className="flex justify-between text-sm text-gray-400 mb-1">
                                <span>{stat.stat.name}</span>
                                <span>{stat.base_stat}</span>
                            </div>
                            <div className="w-full bg-pink-100 rounded-full h-2">
                                <div
                                    className="bg-pink-400 h-2 rounded-full"
                                    style={{ width: `${(stat.base_stat / 255) * 100}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>

                {/* moves */}
                <div className="mt-6">
                    <h2 className="text-2xl text-pink-400 mb-3" style={{ fontFamily: 'VT323, monospace' }}>moves</h2>
                    <div className="flex flex-wrap gap-2">
                        {pokemon.moves.slice(0, 20).map(m => (
                            <span key={m.move.name} className="px-3 py-1 bg-pink-50 text-pink-400 rounded-full text-sm">
                                {m.move.name}
                            </span>
                        ))}
                    </div>
                </div>

            </div>
        </main>
    )
}