import { type FormEvent, useEffect, useRef, useState } from 'react'
import { aiApi } from '../api/ai.ts'
import { ApiError } from '../api/client.ts'

interface Message {
  role: 'user' | 'assistant'
  text: string
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || sending) return
    setMessages((prev) => [...prev, { role: 'user', text }])
    setInput('')
    setSending(true)
    setError(null)
    try {
      const { reply } = await aiApi.chat(text)
      setMessages((prev) => [...prev, { role: 'assistant', text: reply }])
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '요청을 처리하지 못했습니다.')
    } finally {
      setSending(false)
    }
  }

  const handleReset = async () => {
    await aiApi.reset().catch(() => undefined)
    setMessages([])
    setError(null)
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-3xl flex-col px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">AI 채팅</h1>
        <button
          type="button"
          onClick={handleReset}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-100"
        >
          새 대화
        </button>
      </div>
      <div className="mt-6 flex-1 space-y-3 overflow-y-auto rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        {messages.length === 0 && <p className="text-sm text-slate-500">무엇이든 물어보세요.</p>}
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
            <p
              className={`max-w-[80%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm ${
                m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-900'
              }`}
            >
              {m.text}
            </p>
          </div>
        ))}
        {sending && <p className="text-sm text-slate-500">답변을 기다리는 중…</p>}
        <div ref={bottomRef} />
      </div>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="메시지를 입력하세요"
          className="flex-1 rounded-md border border-slate-300 px-3 py-2"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="rounded-md bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          보내기
        </button>
      </form>
    </div>
  )
}
