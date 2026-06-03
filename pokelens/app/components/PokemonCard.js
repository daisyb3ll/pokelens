import Link from 'next/link'

export default function PokemonCard({ pokemon }) {
    return (
        <Link href={`/pokemon/${pokemon.id}`}>
            <div className="border border-pink-200 rounded-2xl p-4 bg-white relative cursor-pointer hover:border-pink-400 transition-colors">
                <p className="absolute top-2 right-3 text-xs text-gray-400" style={{ fontFamily: 'VT323, monospace' }}>
                    HP {pokemon.stats[0].base_stat}
                </p>
                <div className="flex flex-col items-center">
                    <img src={pokemon.sprites.front_default} alt={pokemon.name} className="w-20 h-20" />
                    <h2 className="text-xl mt-1" style={{ fontFamily: 'VT323, monospace' }}>
                        {pokemon.name}
                    </h2>
                    <div className="flex justify-between w-full mt-2 text-sm text-gray-400">
                        <p>#{pokemon.id}</p>
                        <p>{pokemon.types.map(t => t.type.name).join(' • ')}</p>
                    </div>
                </div>
            </div>
        </Link>
    )
}