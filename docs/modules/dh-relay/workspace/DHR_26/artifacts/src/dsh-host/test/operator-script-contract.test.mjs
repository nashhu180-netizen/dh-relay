import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const source = await readFile(
  new URL('../../../scripts/Invoke-Dhr26Pilot.ps1', import.meta.url),
  'utf8',
)

test('operator script isolates DSH Home and pins the approved rc.7 target', () => {
  assert.match(source, /\$env:DSH_HOME = \$dshHome/)
  assert.match(source, /@deepseek-ai\/dsh@0\.1\.0-rc\.7/)
  assert.match(source, /expected rc\.6 or rc\.7 at entry/)
  assert.match(source, /upgrade-rc7-failure\.txt/)
  assert.match(source, /globally npm-installed @deepseek-ai\/dsh not found/)
})

test('operator script validates install, disable, uninstall, cleanup, and reinstall', () => {
  assert.match(source, /'plugin', '--profile', \$Profile, 'add', \$hostRoot/)
  assert.match(source, /RELAY_PILOT_HOST_DISABLED = '1'/)
  assert.match(source, /'remove', '@dh-relay\/dsh-relay-pilot-host'/)
  assert.match(source, /ctx\.relayPilot remains after uninstall/)
  assert.match(source, /DHR26_EARLY_DELIVERY: first ctx\.relayPilot call succeeded/)
  assert.match(source, /client-recon\.json/)
  assert.match(source, /Leave the isolated profile installed and enabled for DHR_49/)
})

test('native commands are captured and the script refuses a partial version chain', () => {
  assert.doesNotMatch(source, /^\s*(node|npm|pnpm|dsh)\s+/m)
  assert.match(source, /DHR26_HOST_EVIDENCE_COMPLETE_VERSION_CHAIN_INCOMPLETE/)
  assert.match(source, /version chain is incomplete/)
  assert.match(source, /if \(\$upgradeAttempted -and \$afterVersion -ne '0\.1\.0-rc\.7'\)/)
  assert.match(source, /Invoke-Captured -File 'npm' -Arguments @\('pack', \$hostRoot, '--dry-run'\)/)
})
