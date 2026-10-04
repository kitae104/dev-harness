#!/usr/bin/env node
// dev-harness 프로젝트 생성기.
//
//   node scripts/new-project.mjs --name my-shop [--package com.acme.myshop]
//        [--backend spring|fastapi] [--frontend react|next]
//        [--addons fastapi,spring-ai,llm,ml] [--ai-provider openai|anthropic|ollama] [--ml-device cpu|cuda]
//        [--out ../my-shop] [--no-git] [--dry-run]
//
// 동작 순서
//   1. templates/s-r 를 대상 폴더로 복사 (빌드 산출물, .env 제외)
//   2. 백엔드·프론트엔드를 바꾸면 해당 폴더(backend/, frontend/)를 빼고 templates/stacks/<부분>-<id>/files/ 를 덮어쓰기
//   3. 선택한 확장 모듈의 files/ (와 files-<값>/) 를 그 위에 덮어쓰기
//   4. `@block:<이름>` ~ `@endblock` 구간을 스택의 조각으로 교체 (없으면 표시 줄만 삭제하고 내용 유지)
//   5. `@addon:<slot>` 표시 줄을 확장 모듈의 조각으로 교체 (없으면 줄 삭제)
//   6. 자리표시자 이름(com.example.app, AppApplication, app) 을 새 프로젝트 이름으로 변경
//   7. 임의의 비밀값(JWT_SECRET 등)으로 .env 생성, .harness.json 기록, git init
//
// 외부 의존성 없이 Node 20+ 표준 라이브러리만 사용합니다.

import { execFileSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'

const HARNESS_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const TEMPLATES = path.join(HARNESS_ROOT, 'templates')
const BASE_TEMPLATE = 's-r'
const BASE_DIR = path.join(TEMPLATES, 's-r')
const ADDONS_DIR = path.join(TEMPLATES, 'addons')
const STACKS_DIR = path.join(TEMPLATES, 'stacks')

// 기본 템플릿(s-r)이 가진 백엔드·프론트엔드. 다른 값을 고르면 templates/stacks/<부분>-<값> 이 그 폴더를 대신합니다.
export const PARTS = { backend: 'spring', frontend: 'react' }

// .env 를 만들 때 임의 값으로 채우는 비밀값
const RANDOM_SECRETS = { JWT_SECRET: () => randomBytes(48).toString('base64'), JUPYTER_TOKEN: () => randomBytes(24).toString('hex') }

// 복사하지 않을 경로 (어느 깊이에서든 이름이 일치하면 제외)
const SKIP_NAMES = new Set([
  'node_modules', 'dist', 'build', '.gradle', 'bin', 'out', '.venv', '__pycache__',
  '.pytest_cache', '.ruff_cache', '.next', 'next-env.d.ts', '.idea', '.vscode', '.DS_Store', 'Thumbs.db', '.env', '.verify-cache',
  'settings.local.json', // Claude Code 개인 설정
])
// 템플릿 폴더에서 직접 실행·빌드해 본 흔적 (.env.local, *.tsbuildinfo, 로그 등)
const SKIP_PATTERNS = [/^\.env\..+/, /\.tsbuildinfo$/, /\.log$/]
const isSkipped = (name) => SKIP_NAMES.has(name) || (name !== '.env.example' && SKIP_PATTERNS.some((re) => re.test(name)))

// 줄바꿈을 CRLF 로 유지해야 하는 Windows 전용 파일. 나머지 텍스트 파일은 LF 로 맞춥니다
// (Windows 에서 저장소를 받아 CRLF 가 되었더라도 gradlew 등이 리눅스 컨테이너에서 동작하도록).
const CRLF_FILES = /\.(bat|cmd|ps1)$/i
// 실행 권한이 필요한 파일 (Windows 에서는 파일 권한이 없어 이름으로 지정)
const EXECUTABLE = /(^|[\\/])(gradlew|[^\\/]+\.sh)$/

// Java 예약어는 패키지 이름에 쓸 수 없습니다.
const JAVA_RESERVED = new Set(`abstract assert boolean break byte case catch char class const continue default do double
else enum extends final finally float for goto if implements import instanceof int interface long native new package
private protected public return short static strictfp super switch synchronized this throw throws transient try void
volatile while true false null _ var record yield sealed permits`.split(/\s+/))

const MARKER = /@addon:([a-z0-9-]+)/
const BLOCK_START = /@block:([a-z0-9-]+)/
const BLOCK_END = /@endblock\b/

export function fail(message) {
  const err = new Error(message)
  err.userFacing = true
  throw err
}

// ---------- 이름 처리 ----------

export function deriveNames({ name, pkg }) {
  if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(name)) {
    fail(`프로젝트 이름은 소문자, 숫자, 하이픈만 쓸 수 있고 소문자로 시작해야 합니다: "${name}"`)
  }
  if (name.length > 40) fail('프로젝트 이름은 40자 이하로 지어 주세요.')
  const compact = name.replace(/-/g, '')
  if (!pkg && JAVA_RESERVED.has(compact)) {
    fail(`"${compact}" 은 Java 예약어라 패키지 이름이 될 수 없습니다. --package 로 직접 지정하거나 다른 이름을 쓰세요.`)
  }
  const snake = name.replace(/-/g, '_')
  const words = name.split('-')
  const pascal = words.map((w) => w[0].toUpperCase() + w.slice(1)).join('')
  const title = words.map((w) => w[0].toUpperCase() + w.slice(1)).join(' ')
  const javaPackage = pkg ?? `com.example.${compact}`
  if (!/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/.test(javaPackage)) {
    fail(`Java 패키지 형식이 아닙니다: "${javaPackage}" (예: com.acme.myshop)`)
  }
  const reserved = javaPackage.split('.').find((part) => JAVA_RESERVED.has(part))
  if (reserved) fail(`Java 패키지에 예약어 "${reserved}" 를 쓸 수 없습니다: "${javaPackage}"`)
  const group = javaPackage.split('.').slice(0, -1).join('.')
  return {
    name, // my-shop        : Compose 프로젝트, 컨테이너 접두어, rootProject, spring.application.name
    snake, // my_shop       : DB 이름, DB 사용자
    pascal, // MyShop       : MyShopApplication
    title, // My Shop       : 화면에 보이는 서비스 이름
    javaPackage, // com.acme.myshop
    group, // com.acme
  }
}

// ---------- 확장 모듈 ----------

// hidden 확장 모듈은 다른 모듈이 includes 로 끌어오는 공용 조각이라 목록에 보이지 않습니다.
export function listAddons({ hidden = false } = {}) {
  if (!fs.existsSync(ADDONS_DIR)) return []
  return fs
    .readdirSync(ADDONS_DIR)
    .filter((d) => fs.existsSync(path.join(ADDONS_DIR, d, 'addon.json')))
    .filter((d) => hidden || !readJson(path.join(ADDONS_DIR, d, 'addon.json')).hidden)
    .sort()
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

export function loadAddon(id) {
  const dir = path.join(ADDONS_DIR, id)
  const manifestPath = path.join(dir, 'addon.json')
  if (!fs.existsSync(manifestPath)) {
    fail(`알 수 없는 확장 모듈: "${id}" (사용 가능: ${listAddons().join(', ') || '없음'})`)
  }
  return { id, dir, ...readJson(manifestPath) }
}

// 부분(backend, frontend)별로 고를 수 있는 값. 기본값 + templates/stacks/<부분>-<값>
export function listStacks(part) {
  const extra = fs.existsSync(STACKS_DIR)
    ? fs.readdirSync(STACKS_DIR).filter((d) => d.startsWith(`${part}-`) && fs.existsSync(path.join(STACKS_DIR, d, 'stack.json')))
    : []
  return [PARTS[part], ...extra.map((d) => d.slice(part.length + 1)).sort()]
}

export function loadStack(part, id) {
  const choices = listStacks(part)
  if (!choices.includes(id)) fail(`알 수 없는 ${part}: "${id}" (사용 가능: ${choices.join(', ')})`)
  if (id === PARTS[part]) return null
  const dir = path.join(STACKS_DIR, `${part}-${id}`)
  return { id: `${part}-${id}`, part, dir, ...readJson(path.join(dir, 'stack.json')) }
}

// 확장 모듈 목록 확정: includes 로 딸려 오는 모듈을 더하고, requires(스택 조건)·conflicts 를 검사합니다.
export function resolveAddons(ids, stack) {
  const order = []
  const visit = (id, from) => {
    if (order.some((a) => a.id === id)) return
    const addon = loadAddon(id)
    if (addon.hidden && !from) fail(`"${id}" 은 다른 확장 모듈이 함께 쓰는 공용 조각이라 직접 고를 수 없습니다.`)
    for (const [part, allowed] of Object.entries(addon.requires ?? {})) {
      const list = [].concat(allowed)
      if (!list.includes(stack[part])) {
        fail(`${addon.id} 확장 모듈은 ${part} 가 ${list.join(' 또는 ')} 일 때만 쓸 수 있습니다 (지금: ${stack[part]}).${addon.requiresHint ? ' ' + addon.requiresHint : ''}`)
      }
    }
    order.push(addon)
    for (const inc of addon.includes ?? []) visit(inc, id)
  }
  for (const id of ids) visit(id)
  for (const addon of order) {
    const clash = (addon.conflicts ?? []).find((c) => order.some((a) => a.id === c))
    if (clash) fail(`${addon.id} 와 ${clash} 확장 모듈은 함께 쓸 수 없습니다.`)
  }
  return order
}

// 확장 모듈 옵션 값 결정: 명령행 값 → 기본값, 허용 목록 검사
export function resolveOptions(addons, given) {
  const options = {}
  for (const addon of addons) {
    for (const [key, spec] of Object.entries(addon.options ?? {})) {
      const value = given[key] ?? spec.default
      if (spec.choices && !spec.choices.includes(value)) {
        fail(`${addon.id} 의 ${key} 값은 ${spec.choices.join(' | ')} 중 하나여야 합니다: "${value}"`)
      }
      options[key] = value
    }
  }
  return options
}

function expandOptions(text, options) {
  return text.replace(/\{(\w+)\}/g, (m, key) => (key in options ? options[key] : m))
}

function readPiece(file) {
  return fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n').replace(/^\n+|\n+$/g, '')
}

// slot 이름 → 삽입할 조각 문자열 목록. vars 는 옵션 값과 스택({backend}, {frontend}) 값입니다.
export function collectSlots(layers, vars) {
  const slots = new Map()
  for (const layer of layers) {
    for (const [slot, entries] of Object.entries(layer.slots ?? {})) {
      for (const entry of [].concat(entries)) {
        const file = path.join(layer.dir, expandOptions(entry, vars))
        // 값별 조각({aiProvider}, {frontend} 등)은 해당 값의 파일이 없으면 건너뜀
        if (!fs.existsSync(file)) continue
        if (!slots.has(slot)) slots.set(slot, [])
        slots.get(slot).push(readPiece(file))
      }
    }
  }
  return slots
}

// block 이름 → 대신 넣을 내용. 같은 block 을 두 스택이 바꾸면 오류입니다.
export function collectBlocks(layers, vars) {
  const blocks = new Map()
  for (const layer of layers) {
    for (const [name, entry] of Object.entries(layer.blocks ?? {})) {
      const file = path.join(layer.dir, expandOptions(entry, vars))
      if (!fs.existsSync(file)) fail(`${layer.id} 의 block 파일이 없습니다: ${entry}`)
      if (blocks.has(name)) fail(`block "${name}" 을 두 곳에서 바꾸려고 합니다 (${blocks.get(name).from}, ${layer.id})`)
      blocks.set(name, { text: readPiece(file), from: layer.id })
    }
  }
  return blocks
}

// ---------- 파일 유틸 ----------

function walk(dir, base = dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (isSkipped(entry.name)) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, base, out)
    else if (entry.isFile()) out.push(path.relative(base, full))
  }
  return out
}

function copyTree(src, dest) {
  for (const rel of walk(src)) {
    const target = path.join(dest, rel)
    fs.mkdirSync(path.dirname(target), { recursive: true })
    fs.copyFileSync(path.join(src, rel), target)
    fs.chmodSync(target, fs.statSync(path.join(src, rel)).mode)
  }
}

function isBinary(buf) {
  return buf.subarray(0, 8000).includes(0)
}

// ---------- 변환 ----------

// `@block:<이름>` 줄부터 `@endblock` 줄까지를 바꿉니다. 바꿀 내용이 없으면 표시 줄만 지우고 원래 내용을 둡니다.
export function replaceBlocks(text, blocks, usedBlocks, rel = '') {
  if (!text.includes('@block:')) return text
  const out = []
  let current = null
  for (const line of text.split('\n')) {
    const start = line.match(BLOCK_START)
    if (start) {
      if (current) fail(`${rel}: block "${current}" 이 닫히기 전에 "${start[1]}" 이 시작됩니다`)
      current = start[1]
      const replacement = blocks.get(current)
      if (replacement) {
        usedBlocks.add(current)
        out.push(...replacement.text.split('\n'))
      }
      continue
    }
    if (BLOCK_END.test(line)) {
      if (!current) fail(`${rel}: 짝이 없는 @endblock`)
      current = null
      continue
    }
    if (!current || !blocks.has(current)) out.push(line)
  }
  if (current) fail(`${rel}: block "${current}" 이 닫히지 않았습니다`)
  return out.join('\n')
}

export function injectSlots(text, slots, usedSlots) {
  if (!text.includes('@addon:')) return text
  const lines = text.split('\n')
  const out = []
  let dropBlank = false
  for (const line of lines) {
    const m = line.match(MARKER)
    if (!m) {
      // 지운 표시 줄의 앞뒤가 모두 빈 줄이면 빈 줄 하나만 남깁니다 (원래 있던 빈 줄 개수는 그대로).
      if (dropBlank && line.trim() === '') {
        dropBlank = false
        continue
      }
      dropBlank = false
      out.push(line)
      continue
    }
    const pieces = slots.get(m[1])
    if (pieces) {
      usedSlots.add(m[1])
      // 여러 줄짜리 조각(서비스 블록, 문서 절 등)은 빈 줄로 구분합니다.
      const sep = pieces.some((piece) => piece.includes('\n')) ? '\n\n' : '\n'
      out.push(...pieces.join(sep).split('\n'))
    } else {
      dropBlank = out.length > 0 && out[out.length - 1].trim() === ''
    }
  }
  // 파일 끝 빈 줄 정리
  return out.join('\n').replace(/\n{2,}$/, '\n')
}

// 자리표시자 → 새 이름. 파일 경로(템플릿 기준 상대 경로)에 따라 적용 규칙이 다릅니다.
export function renameContent(rel, text, n) {
  const p = rel.split(path.sep).join('/')
  let s = text
    .replaceAll('com.example.app', n.javaPackage)
    .replaceAll('AppApplication', `${n.pascal}Application`)

  if (p === 'docker-compose.yml') {
    s = s
      .replace(/\$\{COMPOSE_PROJECT_NAME:-app\}/g, `\${COMPOSE_PROJECT_NAME:-${n.name}}`)
      .replace(/\$\{(DB_NAME|DB_USERNAME|DB_PASSWORD):-app\}/g, `\${$1:-${n.snake}}`)
  } else if (p === '.env.example') {
    s = s
      .replace(/^COMPOSE_PROJECT_NAME=app$/m, `COMPOSE_PROJECT_NAME=${n.name}`)
      .replace(/^(DB_NAME|DB_USERNAME|DB_PASSWORD)=app$/gm, `$1=${n.snake}`)
  } else if (p === 'backend/settings.gradle') {
    s = s.replace("rootProject.name = 'app'", `rootProject.name = '${n.name}'`)
  } else if (p === 'backend/build.gradle') {
    s = s.replace("group = 'com.example'", `group = '${n.group}'`)
  } else if (p === 'backend/src/main/resources/application.yml') {
    s = s
      .replace(/^(\s+name:) app$/m, `$1 ${n.name}`)
      .replace('localhost:5432/app}', `localhost:5432/${n.snake}}`)
      .replace(/\$\{(DB_USERNAME|DB_PASSWORD):app\}/g, `\${$1:${n.snake}}`)
  } else if (p === 'README.md') {
    s = s
      .replace(/^# .*$/m, `# ${n.title}`)
      .replaceAll('com/example/app/', `${n.javaPackage.split('.').join('/')}/`)
  } else if (p === 'frontend/index.html') {
    s = s.replace('<title>App</title>', `<title>${n.title}</title>`)
  } else if (p === 'frontend/src/config/site.ts') {
    s = s.replace("name: 'App',", `name: '${n.title}',`)
  } else if (/^(fastapi|backend|ml)\/(pyproject\.toml|uv\.lock)$/.test(p)) {
    // 파이썬 프로젝트 이름: app-fastapi, app-backend, app-ml
    s = s.replace(/^name = "app-(fastapi|backend|ml)"$/m, `name = "${n.name}-$1"`)
  } else if (p === 'backend/app/core/config.py') {
    s = s.replace(/^(\s+db_(?:name|username|password): str = )"app"$/gm, `$1"${n.snake}"`)
  } else if (p === 'frontend/package.json' || p === 'frontend/package-lock.json') {
    s = s.replace(/"name": "frontend"/g, `"name": "${n.name}-frontend"`)
  }
  return s
}

export function renamePath(rel, n) {
  const from = ['com', 'example', 'app'].join(path.sep)
  const to = n.javaPackage.split('.').join(path.sep)
  let out = rel
  for (const root of ['src/main/java', 'src/test/java']) {
    const prefix = path.join('backend', root, from) + path.sep
    if (out.startsWith(prefix)) out = path.join('backend', root, to, out.slice(prefix.length))
  }
  return out.replace(/AppApplication(\w*)\.java$/, `${n.pascal}Application$1.java`)
}

// ---------- 생성 ----------

// --out 이 없으면 현재 폴더 아래에 만듭니다. 단, dev-harness 저장소 안에서 실행하면 저장소 옆(형제 폴더)에 만듭니다.
function defaultOut(name) {
  const cwd = process.cwd()
  const inside = cwd === HARNESS_ROOT || cwd.startsWith(HARNESS_ROOT + path.sep)
  return inside ? path.join(path.dirname(HARNESS_ROOT), name) : path.join(cwd, name)
}

export function generate(opts) {
  const names = deriveNames({ name: opts.name, pkg: opts.package })
  const stack = { ...PARTS, ...Object.fromEntries(Object.entries(opts.stack ?? {}).filter(([, v]) => v)) }
  const stackLayers = Object.keys(PARTS).map((part) => loadStack(part, stack[part])).filter(Boolean)
  const addons = resolveAddons([...new Set(opts.addons ?? [])], stack)
  const options = resolveOptions(addons, opts.options ?? {})
  const vars = { ...options, ...stack }
  const layers = [...stackLayers, ...addons]
  const out = path.resolve(opts.out ?? defaultOut(names.name))

  if (fs.existsSync(out) && fs.readdirSync(out).length > 0) {
    fail(`대상 폴더가 비어 있지 않습니다: ${out}`)
  }

  // 1~3. 템플릿 + 스택 + 확장 모듈 파일을 메모리에 모음 (rel → Buffer, mode)
  const files = new Map()
  const collect = (root) => {
    for (const rel of walk(root)) {
      const full = path.join(root, rel)
      files.set(rel, { buf: fs.readFileSync(full), mode: fs.statSync(full).mode })
    }
  }
  collect(BASE_DIR)
  for (const layer of stackLayers) {
    // 바꾸는 부분의 기본 파일(backend/ 또는 frontend/)과 remove 에 적힌 경로를 먼저 뺍니다.
    const removed = [`${layer.part}/`, ...(layer.remove ?? [])]
    for (const rel of [...files.keys()]) {
      const p = rel.split(path.sep).join('/')
      if (removed.some((r) => (r.endsWith('/') ? p.startsWith(r) : p === r))) files.delete(rel)
    }
  }
  for (const layer of layers) {
    const filesDir = path.join(layer.dir, 'files')
    if (fs.existsSync(filesDir)) collect(filesDir)
    // 값별 파일 묶음 (예: files-next/, files-fastapi/, files-ollama/)
    for (const [key, value] of Object.entries(vars)) {
      const variantDir = path.join(layer.dir, `files-${value}`)
      if ((key in PARTS || layer.options?.[key]) && fs.existsSync(variantDir)) collect(variantDir)
    }
  }

  // 4~6. block 교체, 조각 삽입, 이름 변경
  const blocks = collectBlocks(stackLayers, vars)
  const slots = collectSlots(layers, vars)
  const usedBlocks = new Set()
  const usedSlots = new Set()
  const result = new Map()
  for (const [rel, { buf, mode }] of files) {
    const target = renamePath(rel, names)
    if (isBinary(buf)) {
      result.set(target, { buf, mode })
      continue
    }
    let text = buf.toString('utf8').replace(/\r\n/g, '\n')
    text = replaceBlocks(text, blocks, usedBlocks, rel)
    text = injectSlots(text, slots, usedSlots)
    text = renameContent(rel, text, names)
    if (CRLF_FILES.test(rel)) text = text.replace(/\n/g, '\r\n')
    result.set(target, { buf: Buffer.from(text, 'utf8'), mode: EXECUTABLE.test(rel) ? 0o755 : mode })
  }
  const unusedBlocks = [...blocks.keys()].filter((b) => !usedBlocks.has(b))
  if (unusedBlocks.length) fail(`템플릿에서 찾지 못한 block: ${unusedBlocks.join(', ')} (@block 표시를 확인하세요)`)
  const unused = [...slots.keys()].filter((s) => !usedSlots.has(s))
  if (unused.length) fail(`템플릿에서 찾지 못한 slot: ${unused.join(', ')} (templates/s-r 의 @addon 표시를 확인하세요)`)

  // .env (git 에 올라가지 않음): 예시를 복사하고 비밀값(JWT_SECRET 등)만 새로 만듦.
  // DB 비밀번호는 로컬 개발 서버 기본값과 맞추기 위해 예시 값을 그대로 둡니다.
  const envExample = result.get('.env.example')?.buf.toString('utf8')
  if (envExample) {
    let env = envExample
    for (const [key, make] of Object.entries(RANDOM_SECRETS)) {
      env = env.replace(new RegExp(`^${key}=.*$`, 'm'), () => `${key}=${make()}`)
    }
    result.set('.env', { buf: Buffer.from(env, 'utf8'), mode: 0o600 })
  }

  const meta = {
    generator: 'dev-harness',
    template: BASE_TEMPLATE,
    stack,
    addons: addons.filter((a) => !a.hidden).map((a) => a.id),
    options,
    name: names.name,
    ...(stack.backend === 'spring' ? { javaPackage: names.javaPackage } : {}),
    createdAt: new Date().toISOString().slice(0, 10),
    harnessCommit: gitHead(HARNESS_ROOT),
  }
  result.set('.harness.json', { buf: Buffer.from(JSON.stringify(meta, null, 2) + '\n'), mode: 0o644 })

  if (opts.dryRun) return { out, names, meta, files: [...result.keys()].sort() }

  for (const [rel, { buf, mode }] of result) {
    const target = path.join(out, rel)
    fs.mkdirSync(path.dirname(target), { recursive: true })
    fs.writeFileSync(target, buf)
    fs.chmodSync(target, mode & 0o777)
  }

  let git = 'skipped'
  if (opts.git !== false) git = initGit(out)
  return { out, names, meta, files: [...result.keys()].sort(), git }
}

function gitHead(dir) {
  try {
    return execFileSync('git', ['-C', dir, 'rev-parse', '--short', 'HEAD'], { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim()
  } catch {
    return null
  }
}

function initGit(dir) {
  try {
    const run = (...args) => execFileSync('git', ['-C', dir, ...args], { stdio: 'ignore' })
    run('init', '-q')
    run('symbolic-ref', 'HEAD', 'refs/heads/main') // git 2.28 미만은 init -b 가 없음
    run('add', '-A')
    // Windows 에서는 파일 권한이 기록되지 않으므로 실행 파일을 명시 (CI 의 ./gradlew 용)
    const executables = execFileSync('git', ['-C', dir, 'ls-files'], { encoding: 'utf8' })
      .split('\n')
      .filter((f) => EXECUTABLE.test(f))
    if (executables.length) run('update-index', '--chmod=+x', '--', ...executables)
    try {
      run('commit', '-q', '-m', 'Initial commit from dev-harness template')
      return 'committed'
    } catch {
      return 'initialized (커밋 실패: git user.name / user.email 설정 필요)'
    }
  } catch {
    return 'skipped (git 없음)'
  }
}

// ---------- CLI ----------

function main(argv) {
  const { values } = parseArgs({
    args: argv,
    options: {
      name: { type: 'string' },
      package: { type: 'string' },
      backend: { type: 'string', default: PARTS.backend },
      frontend: { type: 'string', default: PARTS.frontend },
      addons: { type: 'string', default: '' },
      'ai-provider': { type: 'string' },
      'ml-device': { type: 'string' },
      out: { type: 'string' },
      'no-git': { type: 'boolean', default: false },
      'dry-run': { type: 'boolean', default: false },
      'list-addons': { type: 'boolean', default: false },
      help: { type: 'boolean', short: 'h', default: false },
    },
  })

  if (values.help || (!values.name && !values['list-addons'])) {
    console.log(`사용법: node scripts/new-project.mjs --name <이름> [옵션]

  --name <이름>           프로젝트 이름 (소문자, 숫자, 하이픈. 예: my-shop)
  --package <패키지>      Java 패키지, Spring 백엔드일 때 (기본: com.example.<이름에서 하이픈 제거>)
  --backend <값>          백엔드: ${listStacks('backend').join(' | ')} (기본 ${PARTS.backend})
  --frontend <값>         프론트엔드: ${listStacks('frontend').join(' | ')} (기본 ${PARTS.frontend})
  --addons <a,b>          확장 모듈 (${listAddons().join(', ')})
  --ai-provider <값>      spring-ai, llm 모델 제공자: openai | anthropic | ollama (기본 openai)
  --ml-device <값>        ml 작업 공간의 PyTorch: cpu | cuda (기본 cpu, cuda 는 NVIDIA GPU)
  --out <폴더>            생성 위치 (기본: ./<이름>, dev-harness 안에서 실행하면 ../<이름>)
  --no-git                git init / 첫 커밋 생략
  --dry-run               파일을 쓰지 않고 결과 목록만 출력
  --list-addons           백엔드·프론트엔드 선택지와 확장 모듈 목록`)
    return
  }

  if (values['list-addons']) {
    for (const part of Object.keys(PARTS)) console.log(`${part}\t${listStacks(part).join(', ')}`)
    console.log('')
    for (const id of listAddons()) {
      const addon = loadAddon(id)
      const req = Object.entries(addon.requires ?? {}).map(([k, v]) => `${k}=${[].concat(v).join('|')}`)
      console.log(`${id}\t${addon.description ?? ''}${req.length ? ` (조건: ${req.join(', ')})` : ''}`)
    }
    return
  }

  const res = generate({
    name: values.name,
    package: values.package,
    stack: { backend: values.backend, frontend: values.frontend },
    addons: values.addons.split(',').map((s) => s.trim()).filter(Boolean),
    options: { aiProvider: values['ai-provider'], mlDevice: values['ml-device'] },
    out: values.out,
    git: !values['no-git'],
    dryRun: values['dry-run'],
  })

  if (values['dry-run']) {
    console.log(res.files.join('\n'))
    return
  }
  const addonText = res.meta.addons.length ? res.meta.addons.join(', ') : '없음'
  const opt = Object.entries(res.meta.options).map(([k, v]) => `${k}=${v}`).join(', ')
  const { backend, frontend } = res.meta.stack
  console.log(`✔ 프로젝트 생성 완료: ${res.out}
  이름        ${res.names.name}
  구성        backend=${backend}, frontend=${frontend}${res.meta.javaPackage ? `\n  패키지      ${res.meta.javaPackage}` : ''}
  확장 모듈   ${addonText}${opt ? ` (${opt})` : ''}
  파일        ${res.files.length}개
  git         ${res.git}

다음 단계
  cd ${path.relative(process.cwd(), res.out) || '.'}
  make up        # 전체 스택 실행 (.env 는 생성 시 임의 비밀값으로 만들어졌습니다)
  make down      # 이 프로젝트 컨테이너만 종료`)
}

// 스킬 실행기(.claude/skills/*/generate.mjs)도 이 함수를 부릅니다.
export function run(argv) {
  try {
    main(argv)
  } catch (err) {
    if (err.userFacing) {
      console.error(`✖ ${err.message}`)
      process.exit(1)
    }
    throw err
  }
}

const isMain = process.argv[1] && fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url))
if (isMain) run(process.argv.slice(2))
