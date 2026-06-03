import Link from 'next/link'

export default function NavBar() {
    return (
        <nav className="fixed top-0 left-0 w-full bg-white border-b border-pink-200 z-50">
            <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
                <Link href="/" className="text-2xl text-pink-400" style={{ fontFamily: 'VT323, monospace' }}>
                    pokélens
                </Link>
                <div className="flex gap-6">
                    <Link href="/" className="text-pink-400 hover:text-pink-600 text-sm font-semibold">
                        poképedia
                    </Link>
                    <Link href="/scan" className="text-pink-400 hover:text-pink-600 text-sm font-semibold">
                        pokevision
                    </Link>
                    <Link href="/saved" className="text-pink-400 hover:text-pink-600 text-sm font-semibold">
                        pokédex
                    </Link>
                    <Link href="/pokebooth" className="text-pink-400 hover:text-pink-600 text-sm font-semibold">
                        pokébooth
                    </Link>
                </div>
            </div>
        </nav>
    )
}