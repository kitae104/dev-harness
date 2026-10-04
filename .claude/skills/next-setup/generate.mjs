// /next-setup 스킬 실행기. dev-harness 의 scripts/new-project.mjs 를 찾아 정해진 구성으로 실행합니다.
// ~/.claude/skills 에 심볼릭 링크로 설치해도 실제 경로를 따라가 저장소를 찾습니다.
// 저장소 위치를 직접 지정하려면 DEV_HARNESS_HOME 환경 변수를 쓰세요.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

// 이 명령의 기본 구성. 사용자가 같은 옵션을 뒤에 주면 그 값이 이깁니다.
const PRESET = ['--frontend', 'next']

const here = path.dirname(fs.realpathSync(fileURLToPath(import.meta.url)))
const root = process.env.DEV_HARNESS_HOME ?? path.resolve(here, '..', '..', '..')
const generator = path.join(root, 'scripts', 'new-project.mjs')
if (!fs.existsSync(generator)) {
  console.error(`✖ dev-harness 생성기를 찾지 못했습니다: ${generator}\n  DEV_HARNESS_HOME 을 dev-harness 저장소 경로로 지정하세요.`)
  process.exit(1)
}
const { run } = await import(pathToFileURL(generator).href)
run([...PRESET, ...process.argv.slice(2)])
