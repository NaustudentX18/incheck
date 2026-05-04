/**
 * LLM Service — connects InCheck to Ollama
 *
 * Architecture:
 *   Primary:   Ollama direct (localhost:11434) — same-host dev
 *   Secondary: Open WebUI proxy (localhost:3000) — if Ollama is remote
 *   Fallback:  Web Speech API already handled in ttsService.js
 *
 * Models:
 *   mistral:7b        — main chat/organize model (4GB, fast)
 *   qwen3:8b          — smarter, slower, nightly deep work
 *   qwen2.5:1.5b      — quick responses, TTS companion
 *   qwen3:4b-instruct — code-specific tasks
 *
 * Usage:
 *   import { llmService } from './llmService'
 *   await llmService.chat({ messages, model })          // streaming
 *   await llmService.complete({ prompt, model })       // one-shot
 *   await llmService.embed({ input })                  // embeddings
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// --- Config store ---
const useSettings = create(
  persist(
    (set) => ({
      ollamaUrl: 'http://100.124.255.77:11434',
      model: 'mistral:7b',
      deepModel: 'qwen3:8b',
      quickModel: 'qwen2.5:1.5b',
      embedModel: 'nomic-embed-text:latest',
      temperature: 0.7,
      maxTokens: 512,
      setOllamaUrl: (url) => set({ ollamaUrl: url }),
      setModel: (model) => set({ model }),
    }),
    { name: 'incheck-llm-settings' }
  )
)

// --- Streaming fetch helper ---
async function ollamaFetch(endpoint, body, { signal } = {}) {
  const config = useSettings.getState()
  const base = config.ollamaUrl
  const res = await fetch(`${base}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Ollama ${res.status}: ${text || endpoint}`)
  }
  return res
}

// --- Non-streaming ---
async function ollamaPost(endpoint, body, { signal } = {}) {
  const res = await ollamaFetch(endpoint, body, { signal })
  return res.json()
}

// --- Streaming (yields text chunks) ---
async function* ollamaStream(endpoint, body, { signal } = {}) {
  const res = await ollamaFetch(endpoint, { ...body, stream: true }, { signal })
  const reader = res.body.getReader()
  const decoder = new TextDecoder()

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const text = decoder.decode(value, { stream: false })
      for (const line of text.split('\n')) {
        if (!line.trim()) continue
        try {
          const json = JSON.parse(line)
          if (json.error) throw new Error(json.error)
          yield json.response || ''
        } catch (e) {
          if (e.message !== 'Unexpected end of JSON input') throw e
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}

// --- Model list (cached) ---
let _models = null
let _modelsFetched = null

async function getModels(forceRefresh = false) {
  if (_models && !forceRefresh) return _models
  const config = useSettings.getState()
  try {
    const res = await fetch(`${config.ollamaUrl}/api/tags`, { signal: AbortSignal.timeout(3000) })
    if (res.ok) {
      const data = await res.json()
      _models = (data.models || []).map(m => m.name)
    }
  } catch { /* use cached or empty */ }
  if (!_models) _models = ['mistral:7b', 'qwen3:8b', 'qwen2.5:1.5b']
  return _models
}

// --- System prompts ---
const SYSTEM_ORGANIZE = `You are an ADHD productivity assistant. Analyze the user's brain dump and extract actionable items.

Respond ONLY with valid JSON in this exact structure:
{
  "project": "ProjectName",
  "priority": 1|2|3,
  "subtasks": [{"id": "ai-1", "text": "Concrete action step", "done": false}, ...],
  "tags": ["tag1", "tag2"],
  "summary": "One-sentence summary of what this means"
}

Rules:
- project: infer from context, or "Inbox" if unclear. Max 3 words.
- priority: 1=urgent/asap, 2=normal, 3=defer/low
- subtasks: extract 1-5 specific, concrete action steps. Each should be a single verb phrase under 15 words.
- tags: 1-4 tags matching topic keywords
- NEVER ask questions. NEVER add explanation outside the JSON.
- If content is too vague, return minimal structure with project "Inbox" and empty arrays.`

const SYSTEM_FOCUS_COMPANION = `You are a calm, encouraging focus companion for someone with ADHD. Keep responses very brief (1-3 sentences max). Offer gentle nudges, not commands. Be warm but not cheesy. Respond only with the encouragement text, no quotes or preamble.`

const SYSTEM_SUMMARIZE = `You are a reading comprehension assistant. The user is about to listen to this text via text-to-speech. Provide a 1-2 sentence summary of what this section covers, and suggest any pronunciation notes for technical terms (write them as: "word → pronunciation").`

const SYSTEM_SUGGEST = `You are an ADHD task suggestion engine. Based on the user's recent captures, suggest the single most important next action they should focus on. Respond with ONLY a JSON object: {"suggestion": "One specific actionable task", "reason": "Why this matters now", "energy": "low|medium|high"}`

// --- Main LLM class ---
class LLMService {
  constructor() {
    this._abortController = null
    this._status = 'idle' // 'idle' | 'loading' | 'error'
    this._error = null
    this._listeners = new Set()
  }

  get status() { return this._status }
  get error() { return this._error }
  get models() { return getModels() }

  onStatusChange(fn) {
    this._listeners.add(fn)
    return () => this._listeners.delete(fn)
  }

  _setStatus(s, err = null) {
    this._status = s
    this._error = err
    this._listeners.forEach(fn => fn(s, err))
  }

  _abort() {
    if (this._abortController) {
      this._abortController.abort()
      this._abortController = null
    }
  }

  /**
   * Chat — streaming or one-shot
   * @param {Object} opts
   * @param {Array<{role:string, content:string}>} opts.messages
   * @param {string} [opts.model]
   * @param {string} [opts.system]
   * @param {number} [opts.temperature]
   * @param {number} [opts.maxTokens]
   * @param {boolean} [opts.stream]
   * @param {AbortSignal} [opts.signal]
   */
  async chat({ messages, model, system, temperature, maxTokens, stream = true, signal } = {}) {
    const config = useSettings.getState()
    const resolvedModel = model || config.model
    const resolvedTemp = temperature ?? config.temperature
    const resolvedMax = maxTokens ?? config.maxTokens
    const fullMessages = system
      ? [{ role: 'system', content: system }, ...messages]
      : messages

    const body = {
      model: resolvedModel,
      messages: fullMessages,
      options: { temperature: resolvedTemp, num_predict: resolvedMax },
      stream,
    }

    this._abort()
    this._abortController = new AbortController()
    const ctrlSignal = signal || this._abortController.signal

    if (stream) {
      return this._streamChat(body, ctrlSignal)
    } else {
      const res = await ollamaPost('/api/chat', body, { signal: ctrlSignal })
      return { text: res.message?.content || '', done: true }
    }
  }

  async* _streamChat(body, signal) {
    this._setStatus('loading')
    try {
      let full = ''
      for await (const chunk of ollamaStream('/api/chat', body, { signal })) {
        full += chunk
        yield { text: chunk, partial: full }
      }
      yield { text: '', done: true, full }
      this._setStatus('idle')
    } catch (e) {
      if (e.name !== 'AbortError') this._setStatus('error', e.message)
      yield { text: '', done: true, error: e.message }
    }
  }

  /**
   * Complete — one-shot text generation
   */
  async complete({ prompt, model, system, temperature, maxTokens, signal } = {}) {
    const config = useSettings.getState()
    const body = {
      model: model || config.model,
      prompt: system ? `${system}\n\n${prompt}` : prompt,
      options: {
        temperature: temperature ?? config.temperature,
        num_predict: maxTokens ?? config.maxTokens,
      },
      stream: false,
    }
    try {
      this._setStatus('loading')
      const res = await ollamaPost('/api/generate', body, { signal })
      this._setStatus('idle')
      return res.response?.trim() || ''
    } catch (e) {
      this._setStatus('error', e.message)
      throw e
    }
  }

  /**
   * Embeddings — for semantic search
   */
  async embed({ input, model } = {}) {
    const config = useSettings.getState()
    const embedModel = model || config.embedModel || 'nomic-embed-text:latest'
    const text = typeof input === 'string' ? input : input.join('\n')
    const res = await ollamaPost('/api/embeddings', { model: embedModel, prompt: text })
    return res.embedding || []
  }

  /**
   * Organize — stream AI suggestions for a brain dump
   */
  async* organize(content) {
    yield { project: '', priority: 2, subtasks: [], tags: [], done: false, loading: true }

    try {
      const messages = [
        { role: 'user', content: `Brain dump:\n${content}` }
      ]

      let accumulated = { project: '', priority: 2, subtasks: [], tags: [], summary: '' }
      let jsonBuffer = ''
      let inJson = false
      let done = false

      for await (const { text, done: chunkDone } of this.chat({
        messages,
        system: SYSTEM_ORGANIZE,
        maxTokens: 1024,
        stream: true,
      })) {
        jsonBuffer += text

        // Try to parse accumulated JSON as it comes in
        if (!done && jsonBuffer.includes('{')) {
          inJson = true
        }
        if (inJson && !done) {
          try {
            const parsed = JSON.parse(jsonBuffer)
            // Only update fields that are non-empty
            accumulated = {
              project: parsed.project || accumulated.project,
              priority: parsed.priority || accumulated.priority,
              subtasks: parsed.subtasks?.length ? parsed.subtasks : accumulated.subtasks,
              tags: parsed.tags?.length ? parsed.tags : accumulated.tags,
              summary: parsed.summary || accumulated.summary,
              done: parsed.project && parsed.subtasks?.length > 0,
            }
            yield { ...accumulated, done: false, loading: false }
          } catch {
            // Not complete JSON yet, keep buffering
          }
        }

        if (chunkDone && !done) {
          done = true
          // Final parse attempt
          try {
            const final = JSON.parse(jsonBuffer)
            yield { ...final, done: true, loading: false }
          } catch {
            yield { ...accumulated, done: true, loading: false }
          }
        }
      }
    } catch (e) {
      yield { error: e.message, done: true, loading: false }
    }
  }

  /**
   * Focus Companion — brief encouragement
   */
  async getCompanionMessage({ phase = 'work', sessionCount = 0, resistance = 3 } = {}) {
    const prompts = {
      work: `User is struggling through focus session #${sessionCount + 1}. Resistance level ${resistance}/5. Give one brief sentence of encouragement.`,
      break: 'User just finished a focus session. Give one brief sentence to help them rest.',
      stuck: 'User seems stuck. Give one brief actionable nudge to get moving.',
    }

    const config = useSettings.getState()
    try {
      const res = await this.complete({
        prompt: prompts[phase] || prompts.work,
        model: config.quickModel || 'qwen2.5:1.5b',
        system: SYSTEM_FOCUS_COMPANION,
        temperature: 0.9,
        maxTokens: 60,
      })
      return res
    } catch {
      // Fallback static messages
      const fallbacks = {
        work: ['You\'re doing the thing.', 'Just five more minutes.', 'One step at a time.'][sessionCount % 3],
        break: ['You earned this. Rest up.', 'Let your brain breathe.', 'Good work. Stretch it out.'][sessionCount % 3],
        stuck: ['Start anywhere. Not everywhere.', 'The first step is tiny.', 'Just open the file.'][sessionCount % 3],
      }
      return fallbacks[phase] || fallbacks.work
    }
  }

  /**
   * Suggest — smart next action recommendation
   * Returns { itemId, title, reason, energy }
   */
  async suggest({ items = [] } = {}) {
    const context = items.slice(0, 10).map((i, idx) => {
      const label = i.title || i.content?.slice(0, 60) || 'Untitled'
      return `${idx + 1}. "${label}" [${i.status}]`
    }).join('\n')

    const prompt = `Tasks:\n${context || '(no tasks)'}\n\nPick the most important one and respond with JSON only: {"itemIndex": 1, "reason": "why this matters now", "energy": "low|medium|high"}`

    try {
      const res = await this.complete({
        prompt,
        system: SYSTEM_SUGGEST,
        model: useSettings.getState().model,
        temperature: 0.8,
        maxTokens: 200,
      })
      // Try to parse JSON from response
      const match = res.match(/\{[\s\S]*\}/)
      if (match) {
        const parsed = JSON.parse(match[0])
        const idx = parsed.itemIndex
        if (idx != null && items[idx - 1]) {
          const item = items[idx - 1]
          return {
            itemId: item.id,
            title: item.title || item.content?.slice(0, 50) || 'Untitled',
            reason: parsed.reason || '',
            energy: parsed.energy || 'medium',
          }
        }
      }
      // Fallback: return first inbox item
      const fallback = items.find(i => i.status === 'inbox') || items[0]
      if (fallback) {
        return {
          itemId: fallback.id,
          title: fallback.title || fallback.content?.slice(0, 50) || 'Untitled',
          reason: 'Picked from your captures',
          energy: 'medium',
        }
      }
      return null
    } catch {
      return null
    }
  }

  /**
   * Ping — health check
   */
  async ping() {
    try {
      const config = useSettings.getState()
      const res = await fetch(`${config.ollamaUrl}/`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      })
      return res.ok
    } catch (err) {
      console.warn('[llmService] ping failed:', err.message)
      return false
    }
  }
}

export const llmService = new LLMService()
export { useSettings }
export default llmService
