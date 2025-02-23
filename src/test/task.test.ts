import { task } from '../task'
import { fs } from '../fs'
import { exec } from '../exec'
import * as path from 'path'
import { logger } from '../logger'
import { sleep } from '../utils'

jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000

const fixturesDir = `${__dirname}/fixtures`
const snapsDir = `${fixturesDir}/snaps`
const UpdateSnap = process.env.UPDATE_SNAP === '1'

function normal(s: string) {
  s = s.replace(/[\/\\][\w\/\\]+foy/g, 'foy').trim()
  s = s.replace(/\s*at[^\n]*?(\n|$)/g, '')
  // simply hack
  s = s.replace(/.pnpm\/[^\/]+\/node_modules/,'')
  return s
}
function test(cmd: string) {
  let out = 'Not initialized'
  let snap = ''
  return {
    name: cmd,
    it() {
      it(cmd, () => {
        expect(normal(out)).toBe(normal(snap))
      })
    },
    async init() {
      let p = await exec(`ts-node ./src/cli.ts --config ${fixturesDir}/${cmd}`).catch(er => er)
      out = normal(p.stdout + p.stderr)
      let snapFile = snapsDir + '/' + cmd.replace(/[^\w-]/g, '_')
      if (UpdateSnap) {
        // tslint:disable-next-line:no-floating-promises
        fs.outputFile(snapFile, out)
        out = snap = ''
        return null
      }
      snap = await fs.readFile(snapFile, 'utf8')
    }
  }
}

describe('task', function () {
  let tests = [
    test(`Foyfile1.ts aa -a 1 -b 1 -d`),
    test(`Foyfile1.ts aa -h`),
    test(`Foyfile1.ts -h`),
    test(`Foyfile1.ts aa -a`),
    test(`Foyfile1.ts aa -a bb`),
    test(`Foyfile1.ts bb`),
    test(`Foyfile1.ts cc`),
    test(`Foyfile1.ts dd`),
    test(`Foyfile1.ts ee`),
    test(`Foyfile1.ts ff`),
    test(`Foyfile1.ts force`),
    test(`Foyfile1.ts notForce`),
    test(`Foyfile1.ts sync`),
    test(`Foyfile1.ts async`),
    test(`Foyfile1.ts async:priority`),
    test(`Foyfile1.ts resolveOptions -c 123`),
    test(`Foyfile1.ts resolveOptions`),
    test(`Foyfile1.ts pushpopd`),
    test(`Foyfile2.ts start`),
    test(`Foyfile2.ts error`),
    test(`Foyfile2.ts ns1:t1`),
    test(`Foyfile2.ts ns1:error`),
    test(`Foyfile2.ts ns1:ns2:t2`),
    test(`Foyfile2.ts exec`),
  ]
  beforeAll(async () => {
    if (UpdateSnap) {
      await fs.rmrf(snapsDir)
    }
    await Promise.all(tests.map(t => t.init())).catch(logger.error)
    console.log('init')
  }, 600 * 1000)
  tests.forEach(t => t.it())
})

describe('loading', async () => {
  it('loading', async () => {
    await expectAsync(exec(`ts-node ./src/cli.ts --config ${fixturesDir}/Foyfile2.ts start`)).toBeResolved()
  })
})
