import { useEffect, useRef, useState } from 'react'

type SpeechRecognitionType = {
  start: () => void
  stop: () => void
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
}

declare global {
  interface Window {
    webkitSpeechRecognition?: new () => SpeechRecognitionType
    SpeechRecognition?: new () => SpeechRecognitionType
  }
}

export function useVoiceNotes() {
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const recRef = useRef<SpeechRecognitionType | null>(null)

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return
    const rec = new SR()
    rec.continuous = true
    rec.interimResults = true
    rec.lang = 'en-US'
    rec.onresult = (event) => {
      const text = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join(' ')
      setTranscript(text)
    }
    recRef.current = rec
  }, [])

  const start = () => {
    recRef.current?.start()
    setListening(true)
  }

  const stop = () => {
    recRef.current?.stop()
    setListening(false)
  }

  return { listening, transcript, start, stop }
}
