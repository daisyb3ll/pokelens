import CameraScanner from '../components/CameraScanner'

export default function ScanPage() {
    return (
        <main className="pt-24 min-h-screen">
            <div className="flex justify-center mb-6">
                <h1 className="text-4xl text-pink-400" style={{ fontFamily: 'VT323, monospace' }}>
                    pokéscanner 📷
                </h1>
            </div>
            <CameraScanner />
        </main>
    )
}