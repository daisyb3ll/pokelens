// imports
import PokemonCard from './components/PokemonCard'
export default async function Home() {
  const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=20')
  const data = await response.json()

  const pokemon = await Promise.all(
    data.results.map((p) => fetch(p.url).then((res) => res.json()))
  )

  return (
    <main className= "flex justify-center">
      <div className= "flex-col">
        <div className= "flex justify-center">
          <h1 className="text-red-400 font-bold text-4xl py-10">pokélens</h1>
        </div>
      <div className="grid grid-cols-4 gap-20 max-w-4xl mx-auto"> 
        {pokemon.map((p) => (
          <PokemonCard key={p.id} pokemon={p} />
        ))}
      </div>
      </div>
    </main>
  )
}