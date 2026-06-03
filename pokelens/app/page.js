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
      <div className="flex justify-center mb-6">
        <h1 className="text-white inline-block bg-red-400 px-6 py-2 rounded-2xl text-4xl" style={{ fontFamily: 'VT323, monospace' }}>
          pokélens
        </h1>
      </div>
      <div className="px-6 py-2">
        <CameraScanner />
      </div>
      <Pokedex initialPokemon={pokemon} />
    </main>
  )
}