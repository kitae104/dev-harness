#!/usr/bin/env node
// dev-harness 프로젝트 생성기.
//
//   node scripts/new-project.mjs --name my-shop [--package com.acme.myshop]
//        [--addons fastapi,spring-ai] [--ai-provider openai|anthropic|ollama]
//        [--out ../my-shop] [--no-git] [--dry-run]
//
// 동작 순서
//   1. templates/s-r 를 대상 폴더로 복사 (빌드 산출물, .env 제외)
//   2. 선택한 확장 모듈의 files/ 를 그 위에 덮어쓰기
//   3. 모든 텍스트 파일의 `@addon:<slot>` 표시 줄을 확장 모듈의 조각으로 교체 (없으면 줄 삭제)
//   4. 자리표시자 이름(com.example.app, AppApplication, app) 을 새 프로젝트 이름으로 변경
//   5. 임의의 JWT_SECRET 으로 .env 생성, .harness.json 기록, git init
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

// 복사하지 않을 경로 (어느 깊이에서든 이름이 일치하면 제외)
const SKIP_NAMES = new Set([
  'node_modules', 'dist', 'build', '.gradle', 'bin', 'out', '.venv', '__pycache__',
  '.pytest_cache', '.ruff_cache', '.idea', '.DS_Store', '.env', '.verify-cache',
])

const MARKER = /@addon:([a-z0-9-]+)/

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
  const snake = name.replace(/-/g, '_')
  const words = name.split('-')
  const pascal = words.map((w) => w[0].toUpperCase() + w.slice(1)).join('')
  const title = words.map((w) => w[0].toUpperCase() + w.slice(1)).join(' ')
  const javaPackage = pkg ?? `com.example.${compact}`
  if (!/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/.test(javaPackage)) {
    fail(`Java 패키지 형식이 아닙니다: "${javaPackage}" (예: com.acme.myshop)`)
  }
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

export function listAddons() {
  if (!fs.existsSync(ADDONS_DIR)) return []
  return fs.readdirSync(ADDONS_DIR).filter((d) => fs.existsSync(path.join(ADDONS_DIR, d, 'addon.json'))).sort()
}

export function loadAddon(id) {
  const dir = path.join(ADDONS_DIR, id)
  const manifestPath = path.join(dir, 'addon.json')
  if (!fs.existsSync(manifestPath)) {
    fail(`알 수 없는 확장 모듈: "${id}" (사용 가능: ${listAddons().join(', ') || '없음'})`)
  }
  return { id, dir, ...JSON.parse(fs.readFileSync(manifestPath, 'utf8')) }
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

// slot 이름 → 삽입할 조각 문자열 목록
export function collectSlots(addons, options) {
  const slots = new Map()
  for (const addon of addons) {
    for (const [slot, entries] of Object.entries(addon.slots ?? {})) {
      for (const entry of [].concat(entries)) {
        const file = path.join(addon.dir, expandOptions(entry, options))
        // 옵션별 조각({aiProvider} 등)은 해당 값의 파일이 없으면 건너뜀
        if (!fs.existsSync(file)) continue
        const text = fs.readFileSync(file, 'utf8').replace(/^\n+|\n+$/g, '')
        if (!slots.has(slot)) slots.set(slot, [])
        slots.get(slot).push(text)
      }
    }
  }
  return slots
}

// ---------- 파일 유틸 ----------

function walk(dir, base = dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_NAMES.has(entry.name)) continue
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

export function injectSlots(text, slots, usedSlots) {
  if (!text.includes('@addon:')) return text
  const lines = text.split('\n')
  const out = []
  for (const line of lines) {
    const m = line.match(MARKER)
    if (!m) {
      out.push(line)
      continue
    }
    const pieces = slots.get(m[1])
    if (pieces) {
      usedSlots.add(m[1])
      // 여러 줄짜리 조각(서비스 블록, 문서 절 등)은 빈 줄로 구분합니다.
      const sep = pieces.some((piece) => piece.includes('\n')) ? '\n\n' : '\n'
      out.push(...pieces.join(sep).split('\n'))
    }
  }
  // 표시 줄이 빠지면서 생긴 연속 빈 줄과 파일 끝 빈 줄 정리
  return out.join('\n').replace(/\n{3,}/g, '\n\n').replace(/\n{2,}$/, '\n')
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
  } else if (p === 'frontend/index.html') {
    s = s.replace('<title>App</title>', `<title>${n.title}</title>`)
  } else if (p === 'frontend/src/components/Layout.tsx') {
    s = s.replace(/^(\s+)App$/m, `$1${n.title}`).replace('© {YEAR} App', `© {YEAR} ${n.title}`)
  } else if (p === 'fastapi/pyproject.toml' || p === 'fastapi/uv.lock') {
    s = s.replace(/^name = "app-fastapi"$/m, `name = "${n.name}-fastapi"`)
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
  const addonIds = [...new Set(opts.addons ?? [])]
  const addons = addonIds.map(loadAddon)
  const options = resolveOptions(addons, opts.options ?? {})
  const out = path.resolve(opts.out ?? defaultOut(names.name))

  if (fs.existsSync(out) && fs.readdirSync(out).length > 0) {
    fail(`대상 폴더가 비어 있지 않습니다: ${out}`)
  }

  // 1~2. 템플릿 + 확장 모듈 파일을 메모리에 모음 (rel → Buffer, mode)
  const files = new Map()
  const collect = (root) => {
    for (const rel of walk(root)) {
      const full = path.join(root, rel)
      files.set(rel, { buf: fs.readFileSync(full), mode: fs.statSync(full).mode })
    }
  }
  collect(BASE_DIR)
  for (const addon of addons) {
    const filesDir = path.join(addon.dir, 'files')
    if (fs.existsSync(filesDir)) collect(filesDir)
    // 옵션별 파일 묶음 (예: files-ollama/)
    for (const [key, value] of Object.entries(options)) {
      const variantDir = path.join(addon.dir, `files-${value}`)
      if (addon.options?.[key] && fs.existsSync(variantDir)) collect(variantDir)
    }
  }

  // 3~4. 조각 삽입, 이름 변경
  const slots = collectSlots(addons, options)
  const usedSlots = new Set()
  const result = new Map()
  for (const [rel, { buf, mode }] of files) {
    const target = renamePath(rel, names)
    if (isBinary(buf)) {
      result.set(target, { buf, mode })
      continue
    }
    let text = buf.toString('utf8')
    text = injectSlots(text, slots, usedSlots)
    text = renameContent(rel, text, names)
    result.set(target, { buf: Buffer.from(text, 'utf8'), mode })
  }
  const unused = [...slots.keys()].filter((s) => !usedSlots.has(s))
  if (unused.length) fail(`템플릿에서 찾지 못한 slot: ${unused.join(', ')} (templates/s-r 의 @addon 표시를 확인하세요)`)

  // .env (git 에 올라가지 않음): 예시를 복사하고 JWT 비밀값만 새로 만듦.
  // DB 비밀번호는 로컬 bootRun 기본값과 맞추기 위해 예시 값을 그대로 둡니다.
  const envExample = result.get('.env.example')?.buf.toString('utf8')
  if (envExample) {
    const env = envExample.replace(/^JWT_SECRET=.*$/m, `JWT_SECRET=${randomBytes(48).toString('base64')}`)
    result.set('.env', { buf: Buffer.from(env, 'utf8'), mode: 0o600 })
  }

  const meta = {
    generator: 'dev-harness',
    template: BASE_TEMPLATE,
    addons: addonIds,
    options,
    name: names.name,
    javaPackage: names.javaPackage,
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
    run('init', '-q', '-b', 'main')
    run('add', '-A')
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
      addons: { type: 'string', default: '' },
      'ai-provider': { type: 'string' },
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
  --package <패키지>      Java 패키지 (기본: com.example.<이름에서 하이픈 제거>)
  --addons <a,b>          확장 모듈 (${listAddons().join(', ')})
  --ai-provider <값>      spring-ai 모델 제공자: openai | anthropic | ollama (기본 openai)
  --out <폴더>            생성 위치 (기본: ./<이름>, dev-harness 안에서 실행하면 ../<이름>)
  --no-git                git init / 첫 커밋 생략
  --dry-run               파일을 쓰지 않고 결과 목록만 출력
  --list-addons           확장 모듈 목록`)
    return
  }

  if (values['list-addons']) {
    for (const id of listAddons()) console.log(`${id}\t${loadAddon(id).description ?? ''}`)
    return
  }

  const res = generate({
    name: values.name,
    package: values.package,
    addons: values.addons.split(',').map((s) => s.trim()).filter(Boolean),
    options: { aiProvider: values['ai-provider'] },
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
  console.log(`✔ 프로젝트 생성 완료: ${res.out}
  이름        ${res.names.name}
  패키지      ${res.names.javaPackage}
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
