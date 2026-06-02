export default async function Home() {
  const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=20')
  const data = await response.json()

  const pokemon = await Promise.all(
    data.results.map((p) => fetch(p.url).then((res) => res.json()))
  )

  return (
    <main>
      <h1>pokélens </h1>
      {pokemon.map((p) => (
        <div key={p.id}>
          <img src={p.sprites.front_default} alt={p.name} />
          <h2>{p.name}</h2>
          <p>{p.types.map(t => t.type.name).join(', ')}</p>
        </div>
      ))}
    </main>
  )
}