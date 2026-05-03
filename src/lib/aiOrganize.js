/**
 * AI Organization — client library
 * Replace `doOrganize` body with real API call when backend is ready.
 */

const MOCK_MODE = true // set to false + add API key for real AI

/**
 * Organize content using AI.
 * Returns an async generator that yields partial results (streaming feel).
 *
 * Usage:
 *   for await (const update of doOrganize(content)) {
 *     setSuggestions(prev => ({ ...prev, ...update }))
 *   }
 */
export async function* doOrganize(content) {
  if (!content || content.trim().length < 10) {
    yield { error: 'Content too short to analyze.' }
    return
  }

  // Simulate streaming with realistic delays
  const lines = buildMockSuggestions(content)

  for (const { delay, data } of lines) {
    await sleep(delay + Math.random() * 80)
    yield data
  }
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

function buildMockSuggestions(content) {
  const lower = content.toLowerCase()

  let project = 'Inbox'
  const projectKeywords = [
    [/auth|login|password|token|jwt|session/i, 'Auth'],
    [/dashboard|ui|component|design|figma/i, 'UI/Design'],
    [/api|endpoint|route|rest|graphql/i, 'API'],
    [/database|schema|migration|sql|query/i, 'Database'],
    [/test|vitest|jest|playwright|unit/i, 'Testing'],
    [/deploy|ci|cd|pipeline|github|vercel/i, 'DevOps'],
    [/refactor|cleanup|tech.?debt/i, 'Tech Debt'],
    [/feature|build|ship|feature.?flag/i, 'Features'],
    [/bug|fix|issue|patch|hotfix/i, 'Bug Fixes'],
    [/docs?|readme|documentation/i, 'Docs'],
  ]
  for (const [re, label] of projectKeywords) {
    if (re.test(content)) { project = label; break }
  }

  let priority = 2
  if (/asap|urgent|critical|must|blocker|breaking/i.test(lower)) priority = 1
  else if (/when.?possible|eventually|maybe|someday|low.?priority/i.test(lower)) priority = 3

  const taskPatterns = [
    /need to\s+([^.,]+)/gi, /should\s+([^.,]+)/gi, /have to\s+([^.,]+)/gi,
    /add\s+([^.,]+)/gi, /fix\s+([^.,]+)/gi, /write\s+([^.,]+)/gi,
    /build\s+([^.,]+)/gi, /create\s+([^.,]+)/gi, /update\s+([^.,]+)/gi,
    /look into\s+([^.,]+)/gi, /schedule\s+([^.,]+)/gi, /research\s+([^.,]+)/gi,
    /refactor\s+([^.,]+)/gi, /deploy\s+([^.,]+)/gi, /test\s+([^.,]+)/gi,
    /implement\s+([^.,]+)/gi,
  ]
  const rawTasks = []
  taskPatterns.forEach(p => {
    let m; while ((m = p.exec(content)) !== null) {
      const t = m[1].trim().replace(/[,.]+$/, '')
      if (t.length > 5 && t.length < 80) rawTasks.push(cap(t))
    }
  })
  const subtasks = rawTasks.slice(0, 5).map((text, i) => ({
    id: `ai-${Date.now()}-${i}`, text, done: false,
  }))

  const tagPatterns = [
    [/react|vue|angular|svelte/i, 'frontend'], [/node|python|go|rust|java/i, 'backend'],
    [/css|style|theme|design/i, 'styling'], [/api|fetch|axios/i, 'api'],
    [/test|spec|assert/i, 'testing'], [/bug|fix|issue/i, 'bug'],
    [/refactor|clean|optimize/i, 'refactor'], [/docs?|readme/i, 'docs'],
    [/mobile|responsive|ios|android/i, 'mobile'], [/perf|speed|load|bundle/i, 'performance'],
  ]
  const tagCandidates = []
  tagPatterns.forEach(([re, tag]) => { if (re.test(lower)) tagCandidates.push(tag) })
  const tags = [...new Set(tagCandidates)].slice(0, 4)

  // Returns array of { delay, data } — doOrganize yields with delay
  return [
    { delay: 150, data: { project: project[0] } },
    { delay: 200, data: { project } },
    { delay: 180, data: { priority } },
    ...(subtasks.length > 0 ? [
      { delay: 250, data: { subtasks: subtasks.slice(0, 1) } },
      ...(subtasks.length > 1 ? [{ delay: 200, data: { subtasks: subtasks.slice(0, 2) } }] : []),
      { delay: 150, data: { subtasks } },
    ] : []),
    ...(tags.length > 0 ? [
      { delay: 200, data: { tags: tags.slice(0, 2) } },
      { delay: 150, data: { tags } },
    ] : []),
    { delay: 100, data: { done: true } },
  ]
}

function cap(s) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
