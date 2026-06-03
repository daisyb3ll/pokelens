export default function PokemonCard({ pokemon }) {
    return (
        <div>
            <img src={pokemon.sprites.front_default} alt={pokemon.name} />
            <h2 className= "text-">{pokemon.name}</h2>
            <p>{pokemon.types.map(t => t.type.name).join(', ')}</p>
        </div>
    )
}