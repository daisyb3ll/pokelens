'use client'
import { supabase } from '../lib/supabase'
import { useRef, useState, useEffect } from 'react'

export default function CameraScanner() {
    const videoRef = useRef(null)
    const canvasRef = useRef(null)
    const [scanning, setScanning] = useState(false)
    const [stream, setStream] = useState(null)
    const [result, setResult] = useState(null)
    const [loading, setLoading] = useState(false)

    const startCamera = async () => {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true })
        setStream(mediaStream)
        setScanning(true)
    }

    useEffect(() => {
        if (scanning && videoRef.current && stream) {
            videoRef.current.srcObject = stream
        }
    }, [scanning, stream])

    const capture = async () => {
        const canvas = canvasRef.current
        const video = videoRef.current
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        canvas.getContext('2d').drawImage(video, 0, 0)
        const base64 = canvas.toDataURL('image/jpeg').split(',')[1]
        await scanImage(base64)
    }

    const scanImage = async (base64) => {
        setLoading(true)
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_VISION_API_KEY

        const response = await fetch(
            `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
            {
                method: 'POST',
                body: JSON.stringify({
                    requests: [{
                        image: { content: base64 },
                        features: [
                            { type: 'LABEL_DETECTION', maxResults: 10 },
                            { type: 'WEB_DETECTION', maxResults: 10 }
                        ]
                    }]
                })
            }
        )

        const data = await response.json()
        console.log('full response:', data)

        // web detection is better for recognizing characters
        const webEntities = data.responses[0].webDetection?.webEntities || []
        const labels = data.responses[0].labelAnnotations || []

        // combine all detected text
        const allTerms = [
            ...webEntities.map(e => e.description?.toLowerCase()),
            ...labels.map(l => l.description?.toLowerCase())
        ].filter(Boolean)

        console.log('all terms:', allTerms)

        // fetch full pokemon list and try to match
        const pokemonList = await fetch('https://pokeapi.co/api/v2/pokemon?limit=10000')
        const pokemonData = await pokemonList.json()
        const pokemonNames = pokemonData.results.map(p => p.name)

        const match = allTerms.find(term => pokemonNames.includes(term))

        if (match) {
            const pokemonResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${match}`)
            const pokemon = await pokemonResponse.json()
            setResult(pokemon)

            // auto save to pokédex
            const { data: { session } } = await supabase.auth.getSession()
            if (session) {
                const { data: existing } = await supabase
                    .from('saved_pokemon')
                    .select('id')
                    .eq('user_id', session.user.id)
                    .eq('pokemon_id', pokemon.id)
                    .single()

                if (!existing) {
                    await supabase.from('saved_pokemon').insert({
                        user_id: session.user.id,
                        pokemon_id: pokemon.id,
                        pokemon_name: pokemon.name,
                        sprite_url: pokemon.sprites.front_default
                    })
                }
            }
        } else {
            setResult('not found')
        }
        setLoading(false)
    }


    return (
        <div className="flex flex-col items-center gap-4">
            {!scanning ? (
                <button
                    onClick={startCamera}
                    className="px-6 py-3 bg-pink-400 text-white rounded-full text-lg"
                    style={{ fontFamily: 'VT323, monospace' }}
                >
                    📷 scan pokémon
                </button>
            ) : (
                <div className="flex flex-col items-center gap-4">
                    <video ref={videoRef} autoPlay className="rounded-2xl border border-pink-200 w-80" />
                    <canvas ref={canvasRef} className="hidden" />
                    <button
                        onClick={capture}
                        className="px-6 py-3 bg-pink-400 text-white rounded-full text-lg"
                        style={{ fontFamily: 'VT323, monospace' }}
                    >
                        {loading ? 'scanning...' : '⚡ capture!'}
                    </button>
                </div>
            )}

            {result && result !== 'not found' && (
                <div className="border border-pink-200 rounded-2xl p-4 text-center">
                    <p className="text-pink-400" style={{ fontFamily: 'VT323, monospace' }}>found!</p>
                    <img src={result.sprites.front_default} alt={result.name} className="w-24 h-24 mx-auto" />
                    <p className="text-2xl" style={{ fontFamily: 'VT323, monospace' }}>{result.name}</p>
                </div>
            )}

            {result === 'not found' && (
                <p className="text-gray-400" style={{ fontFamily: 'VT323, monospace' }}>
                    no pokémon detected... try again!
                </p>
            )}
        </div>
    )
}