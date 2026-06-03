'use client'
import { supabase } from '../lib/supabase'
import { useRef, useState, useEffect } from 'react'

export default function PokeBoothClient() {
    const videoRef = useRef(null)
    const canvasRef = useRef(null)
    const [stream, setStream] = useState(null)
    const [scanning, setScanning] = useState(false)
    const [detectedPokemon, setDetectedPokemon] = useState(null)
    const [loading, setLoading] = useState(false)
    const [photo, setPhoto] = useState(null)
    const [evolutionChain, setEvolutionChain] = useState([])
    const [strip, setStrip] = useState(null)
    const [countdown, setCountdown] = useState(null)
    const [showPhoto, setShowPhoto] = useState(false)
    const [showStrip, setShowStrip] = useState(false)

    const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))

    const countdownFrom = async (n) => {
        for (let i = n; i > 0; i--) {
            setCountdown(i)
            await wait(1000)
        }
        setCountdown(null)
    }

    const typeFrameColors = {
        fire: '#FF6B35',
        water: '#4FC3F7',
        grass: '#81C784',
        electric: '#FFD54F',
        psychic: '#F48FB1',
        bug: '#AED581',
        normal: '#B0BEC5',
        poison: '#CE93D8',
        flying: '#80DEEA',
        ground: '#FFCC02',
        rock: '#A1887F',
        ghost: '#9575CD',
        dragon: '#7986CB',
        dark: '#616161',
        steel: '#90A4AE',
        fairy: '#F8BBD9',
        fighting: '#EF9A9A',
        ice: '#B3E5FC',
    }

    const startCamera = async () => {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true })
        setStream(mediaStream)
        setScanning(true)
    }

    const generateBrailleArt = async (spriteUrl, targetWidth, targetHeight) => {
        const spriteCanvas = document.createElement('canvas')
        const spriteCtx = spriteCanvas.getContext('2d')
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.src = spriteUrl
        await new Promise(resolve => { img.onload = resolve })
        spriteCanvas.width = targetWidth
        spriteCanvas.height = targetHeight
        spriteCtx.drawImage(img, 0, 0, targetWidth, targetHeight)
        const pixels = spriteCtx.getImageData(0, 0, targetWidth, targetHeight).data

        const dotOffsets = [
            [0, 0], [0, 1], [0, 2],
            [1, 0], [1, 1], [1, 2],
            [0, 3], [1, 3]
        ]

        const getBrightness = (x, y) => {
            if (x >= targetWidth || y >= targetHeight) return 0
            const i = (y * targetWidth + x) * 4
            const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2], a = pixels[i + 3]
            if (a < 128) return 0
            return (r * 0.299 + g * 0.587 + b * 0.114) < 128 ? 1 : 0
        }

        let result = ''
        const rows = Math.floor(targetHeight / 4)
        const cols = Math.floor(targetWidth / 2)
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                let brailleIndex = 0
                dotOffsets.forEach(([dx, dy], bit) => {
                    if (getBrightness(col * 2 + dx, row * 4 + dy)) {
                        brailleIndex |= (1 << bit)
                    }
                })
                result += String.fromCharCode(0x2800 + brailleIndex)
            }
            result += '\n'
        }
        return result
    }

    const getEvolutionChain = async (pokemon) => {
        const speciesRes = await fetch(pokemon.species.url)
        const species = await speciesRes.json()
        const evoRes = await fetch(species.evolution_chain.url)
        const evoData = await evoRes.json()
        const names = []
        const traverse = (node) => {
            names.push(node.species.name)
            node.evolves_to.forEach(next => traverse(next))
        }
        traverse(evoData.chain)
        const chain = await Promise.all(
            names.map(name => fetch(`https://pokeapi.co/api/v2/pokemon/${name}`).then(r => r.json()))
        )
        setEvolutionChain(chain)
    }

    useEffect(() => {
        if (scanning && videoRef.current && stream) {
            videoRef.current.srcObject = stream
        }
    }, [scanning, stream])

    const scanAndDetect = async () => {
        setLoading(true)
        const canvas = canvasRef.current
        const video = videoRef.current
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        canvas.getContext('2d').drawImage(video, 0, 0)
        const base64 = canvas.toDataURL('image/jpeg').split(',')[1]

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
        const webEntities = data.responses[0].webDetection?.webEntities || []
        const labels = data.responses[0].labelAnnotations || []
        const allTerms = [
            ...webEntities.map(e => e.description?.toLowerCase()),
            ...labels.map(l => l.description?.toLowerCase())
        ].filter(Boolean)

        const pokemonList = await fetch('https://pokeapi.co/api/v2/pokemon?limit=10000')
        const pokemonData = await pokemonList.json()
        const pokemonNames = pokemonData.results.map(p => p.name)
        const match = allTerms.find(term => pokemonNames.includes(term))

        if (match) {
            const pokemonResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${match}`)
            const pokemon = await pokemonResponse.json()
            setDetectedPokemon(pokemon)
            await getEvolutionChain(pokemon)


            // save to pokedex ← goes here
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
        }
        setLoading(false)
    }

    const drawFrame = async (ctx, video, detectedPokemon, evolutionChain) => {
        const FRAME = 80
        const WIDTH = video.videoWidth + FRAME * 2
        const HEIGHT = video.videoHeight + FRAME * 2 + 60

        const type = detectedPokemon?.types[0]?.type?.name || 'normal'
        const frameColor = typeFrameColors[type] || '#F4C0D1'

        ctx.fillStyle = frameColor
        ctx.fillRect(0, 0, WIDTH, HEIGHT)

        ctx.fillStyle = 'rgba(255,255,255,0.2)'
        for (let x = 0; x < WIDTH; x += 20) {
            for (let y = 0; y < HEIGHT; y += 20) {
                if (x < FRAME || x > WIDTH - FRAME || y < FRAME + 40 || y > HEIGHT - FRAME - 60) {
                    ctx.fillRect(x, y, 6, 6)
                }
            }
        }

        const borderSize = 8
        const gap = 12
        const innerX = FRAME - gap
        const innerY = FRAME + 40 - gap
        const innerW = video.videoWidth + gap * 2
        const innerH = video.videoHeight + gap * 2
        ctx.fillStyle = 'rgba(255,255,255,0.41)'
        for (let x = innerX; x < innerX + innerW; x += borderSize) {
            ctx.fillRect(x, innerY, borderSize - 1, borderSize - 1)
            ctx.fillRect(x, innerY + innerH - borderSize, borderSize - 1, borderSize - 1)
        }
        for (let y = innerY; y < innerY + innerH; y += borderSize) {
            ctx.fillRect(innerX, y, borderSize - 1, borderSize - 1)
            ctx.fillRect(innerX + innerW - borderSize, y, borderSize - 1, borderSize - 1)
        }

        ctx.drawImage(video, FRAME, FRAME + 40, video.videoWidth, video.videoHeight)

        if (detectedPokemon) {
            const braille = await generateBrailleArt(detectedPokemon.sprites.front_default, 120, 200)
            ctx.globalAlpha = 0.5
            ctx.fillStyle = '#ffffff'
            ctx.font = '20px monospace'
            ctx.textAlign = 'left'
            const lines = braille.split('\n')
            const startX = FRAME + video.videoWidth / 5
            const startY = FRAME + 1 + video.videoHeight / 3
            lines.forEach((line, i) => { ctx.fillText(line, startX, startY + i * 11) })
            ctx.globalAlpha = 1
        }

        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 80px VT323, monospace'
        ctx.textAlign = 'center'
        ctx.fillText(detectedPokemon ? detectedPokemon.name.toUpperCase() : 'POKÉBOOTH', WIDTH / 2, 65)

        ctx.fillStyle = 'rgba(255,255,255,0.3)'
        ctx.roundRect(WIDTH / 2 - 40, 82, 80, 22, 10)
        ctx.fill()
        ctx.fillStyle = '#ffffff'
        ctx.font = '14px VT323, monospace'
        ctx.fillText(type.toUpperCase(), WIDTH / 2, 98)

        ctx.font = '20px serif'
        ctx.textAlign = 'center'
        const decorLeft = ['✦', '★', '◆', '✦', '★', '◆', '✦', '★']
        const decorRight = ['♦', '✿', '❋', '♦', '✿', '❋', '♦', '✿']
        decorLeft.forEach((d, i) => {
            ctx.fillStyle = 'rgba(255,255,255,0.7)'
            ctx.fillText(d, FRAME / 2, FRAME + 80 + i * 40)
        })
        decorRight.forEach((d, i) => {
            ctx.fillStyle = 'rgba(255,255,255,0.7)'
            ctx.fillText(d, WIDTH - FRAME / 2, FRAME + 80 + i * 40)
        })

        if (detectedPokemon) {
            if (evolutionChain.length > 0) {
                const positions = evolutionChain.map((_, i) => {
                    const side = i % 2
                    let x, y
                    if (side === 0) {
                        x = 0
                        y = FRAME + 40 + (i / evolutionChain.length) * (HEIGHT - FRAME * 2 - 200) + Math.random() * 30
                    } else {
                        x = WIDTH - 150
                        y = FRAME + 40 + (i / evolutionChain.length) * (HEIGHT - FRAME * 2 - 200) + Math.random() * 30
                    }
                    return { x, y }
                })
                for (let i = 0; i < evolutionChain.length; i++) {
                    const evo = evolutionChain[i]
                    const { x, y } = positions[i]
                    const evoImg = new Image()
                    evoImg.crossOrigin = 'anonymous'
                    evoImg.src = evo.sprites.front_default
                    await new Promise(resolve => { evoImg.onload = resolve })
                    ctx.imageSmoothingEnabled = false
                    ctx.globalAlpha = 1
                    const size = evo.id === detectedPokemon.id ? 200 : 140
                    ctx.drawImage(evoImg, x, y, size, size)
                }
                ctx.globalAlpha = 1
            } else {
                const spriteImg = new Image()
                spriteImg.crossOrigin = 'anonymous'
                spriteImg.src = detectedPokemon.sprites.front_default
                await new Promise(resolve => { spriteImg.onload = resolve })
                ctx.imageSmoothingEnabled = false
                ctx.drawImage(spriteImg, 5, FRAME + 50, 90, 90)
            }

            ctx.fillStyle = '#ffffff'
            ctx.font = '30px VT323, monospace'
            ctx.textAlign = 'left'
            ctx.fillText(`#${String(detectedPokemon.id).padStart(3, '0')}`, FRAME + 10, HEIGHT - 20)
            ctx.textAlign = 'center'
            ctx.fillText(`HP: ${detectedPokemon.stats[0].base_stat}`, WIDTH / 3, HEIGHT - 20)
            ctx.fillText(`ATK: ${detectedPokemon.stats[1].base_stat}`, WIDTH / 2, HEIGHT - 20)
            ctx.fillText(`DEF: ${detectedPokemon.stats[2].base_stat}`, (WIDTH / 3) * 2, HEIGHT - 20)
            ctx.textAlign = 'right'
            ctx.fillText(`SPD: ${detectedPokemon.stats[5].base_stat}`, WIDTH - FRAME - 10, HEIGHT - 20)
        }

        return { WIDTH, HEIGHT }
    }

    const takePhoto = async () => {
        const canvas = canvasRef.current
        const video = videoRef.current
        const FRAME = 80
        canvas.width = video.videoWidth + FRAME * 2
        canvas.height = video.videoHeight + FRAME * 2 + 60
        const ctx = canvas.getContext('2d')
        await drawFrame(ctx, video, detectedPokemon, evolutionChain)
        setPhoto(canvas.toDataURL('image/png'))
        setShowPhoto(false)
        setPhoto(canvas.toDataURL('image/png'))
        setShowPhoto(false)

        setTimeout(() => {
            document.getElementById('photo-result')?.scrollIntoView({ behavior: 'smooth' })

            // mechanical slot reveal
            const slot = document.getElementById('photo-slot')
            if (!slot) return

            setShowPhoto(true)
            slot.style.height = '0px'

            const targetHeight = canvas.height * (slot.offsetWidth / canvas.width)
            let currentHeight = 0

            const reveal = () => {
                currentHeight += 8 // pixels per frame — change for speed

                // random micro-stutter for mechanical feel
                if (Math.random() > 0.85) {
                    setTimeout(() => requestAnimationFrame(reveal), 80)
                    return
                }

                slot.style.height = `${Math.min(currentHeight, targetHeight)}px`

                if (currentHeight < targetHeight) {
                    requestAnimationFrame(reveal)
                } else {
                    slot.style.height = 'auto'
                }
            }

            requestAnimationFrame(reveal)
        }, 200)
    }

    const takeStrip = async () => {
        const frames = []
        const video = videoRef.current

        for (let i = 0; i < 4; i++) {
            await countdownFrom(3)
            setCountdown('📷')
            await wait(300)
            setCountdown(null)

            const FRAME = 80
            const frameCanvas = document.createElement('canvas')
            frameCanvas.width = video.videoWidth + FRAME * 2
            frameCanvas.height = video.videoHeight + FRAME * 2 + 60
            const ctx = frameCanvas.getContext('2d')
            await drawFrame(ctx, video, detectedPokemon, evolutionChain)
            frames.push(frameCanvas)
            await wait(500)
        }

        const stripCanvas = document.createElement('canvas')
        const totalHeight = frames.reduce((sum, f) => sum + f.height + 10, 0)
        stripCanvas.width = frames[0].width
        stripCanvas.height = totalHeight
        const stripCtx = stripCanvas.getContext('2d')
        stripCtx.fillStyle = '#ffffff'
        stripCtx.fillRect(0, 0, stripCanvas.width, stripCanvas.height)
        let currentY = 0
        for (const frame of frames) {
            stripCtx.drawImage(frame, 0, currentY)
            currentY += frame.height + 10
        }
        setStrip(stripCanvas.toDataURL('image/png'))
        setShowStrip(false)
        setTimeout(() => {
            setShowStrip(true)
            document.getElementById('strip-result')?.scrollIntoView({ behavior: 'smooth' })
        }, 100)
    }

    const downloadPhoto = () => {
        const link = document.createElement('a')
        link.download = `pokebooth-${detectedPokemon?.name || 'photo'}.png`
        link.href = photo
        link.click()
    }

    return (
        <div className="max-w-2xl mx-auto px-4 flex flex-col items-center gap-6">
            {!scanning ? (
                <button
                    onClick={startCamera}
                    className="px-6 py-3 bg-pink-400 text-white rounded-full text-lg"
                    style={{ fontFamily: 'VT323, monospace' }}
                >
                    📷 open camera
                </button>
            ) : (
                <div className="flex flex-col items-center gap-4 w-full">
                    <div className="relative w-full">
                        <video ref={videoRef} autoPlay className="rounded-2xl border border-pink-200 w-full" />
                        {detectedPokemon && (
                            <img
                                src={detectedPokemon.sprites.front_default}
                                alt={detectedPokemon.name}
                                className="absolute bottom-2 right-2 w-24 h-24"
                                style={{ imageRendering: 'pixelated' }}
                            />
                        )}
                        {detectedPokemon && (
                            <div className="absolute top-2 left-2 bg-white/80 rounded-xl px-3 py-1">
                                <p className="text-pink-400 text-lg" style={{ fontFamily: 'VT323, monospace' }}>
                                    {detectedPokemon.name} detected! ✨
                                </p>
                            </div>
                        )}
                        {countdown && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-2xl">
                                <p className="text-white text-8xl font-bold" style={{ fontFamily: 'VT323, monospace' }}>
                                    {countdown}
                                </p>
                            </div>
                        )}
                    </div>
                    <canvas ref={canvasRef} className="hidden" />
                    <div className="flex gap-4">
                        <button
                            onClick={scanAndDetect}
                            className="px-6 py-3 bg-pink-200 text-pink-600 rounded-full text-lg"
                            style={{ fontFamily: 'VT323, monospace' }}
                        >
                            {loading ? 'scanning...' : '🔍 scan pokémon'}
                        </button>
                        <button
                            onClick={takeStrip}
                            className="px-6 py-3 bg-purple-400 text-white rounded-full text-lg"
                            style={{ fontFamily: 'VT323, monospace' }}
                        >
                            🎞️ photo strip!
                        </button>
                        <button
                            onClick={takePhoto}
                            className="px-6 py-3 bg-pink-400 text-white rounded-full text-lg"
                            style={{ fontFamily: 'VT323, monospace' }}
                        >
                            ⚡ snap!
                        </button>
                    </div>
                </div>
            )}

            {strip && (
                <div id="strip-result" className="flex flex-col items-center gap-3">
                    <p className="text-pink-400 text-xl" style={{ fontFamily: 'VT323, monospace' }}>
                        your pokébooth strip! 🌸
                    </p>
                    <div className="overflow-hidden rounded-2xl border border-pink-200 w-64">
                        {showStrip && (
                            <img key={strip} src={strip} alt="pokebooth strip" className="w-full slot-out" />
                        )}
                    </div>
                    <button
                        onClick={() => {
                            const link = document.createElement('a')
                            link.download = `pokebooth-strip-${detectedPokemon?.name || 'photo'}.png`
                            link.href = strip
                            link.click()
                        }}
                        className="px-6 py-2 bg-pink-400 text-white rounded-full"
                        style={{ fontFamily: 'VT323, monospace' }}
                    >
                        💾 download strip
                    </button>
                </div>
            )}

            {photo && (
                <div id="photo-result" className="flex flex-col items-center gap-3 w-full">
                    <p className="text-pink-400 text-xl" style={{ fontFamily: 'VT323, monospace' }}>
                        your pokébooth photo! 🌸
                    </p>
                    <div
                        id="photo-slot"
                        className="overflow-hidden rounded-2xl border border-pink-200 w-full"
                        style={{ height: showPhoto ? 'auto' : '0px', transition: 'none' }}
                    >
                        {showPhoto && <img key={photo} src={photo} alt="pokebooth" className="w-full" />}
                    </div>
                    <button
                        onClick={downloadPhoto}
                        className="px-6 py-2 bg-pink-400 text-white rounded-full"
                        style={{ fontFamily: 'VT323, monospace' }}
                    >
                        💾 download photo
                    </button>
                </div>
            )}
        </div>
    )
}