import PokeBoothClient from '../components/PokeBoothClient'

export default function PokeBoothPage() {
    return (
        <main className="pt-24 min-h-screen">
            <div className="flex justify-center mb-6">
                <h1 className="text-4xl text-pink-400" style={{ fontFamily: 'VT323, monospace' }}>
                    pokébooth 📷
                </h1>
            </div>
            <PokeBoothClient />
        </main>
    )
}