export default function PokemonCard({ pokemon }) {
    return (
        <div className ="border border-pink-200 rounded-2xl p-4">
            <div className="flex-col">
                <div className="flex justify-center">
                    <img src={pokemon.sprites.front_default} alt={pokemon.name} />
                </div>
                <div className= "flex justify-center">
                        <h2 className="text-2xl">{pokemon.name}</h2>
                </div>
                <div className="flex justify-between">
                    <p>{pokemon.id}</p>
                    <p>{pokemon.types.map(t => t.type.name).join(' • ')}</p>
                </div>
            </div>

        </div>
    )
}