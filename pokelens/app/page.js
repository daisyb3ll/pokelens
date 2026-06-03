import Pokedex from './components/Pokedex'
import CameraScanner from './components/CameraScanner'

export default async function Home() {
  const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=20')
  const data = await response.json()

  const pokemon = await Promise.all(
    data.results.map((p) => fetch(p.url).then((res) => res.json()))
  )

  return (
    <main className="pt-24 min-h-screen">
      <Pokedex initialPokemon={pokemon} />
    </main>
  )
}