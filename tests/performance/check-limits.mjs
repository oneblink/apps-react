/**
 * Fails if the median time of any benchmark in a `vitest bench --outputJson`
 * report exceeds its limit (in milliseconds) in `limits.json`.
 *
 * Usage: node tests/performance/check-limits.mjs <report.json>
 */
import { readFile } from 'node:fs/promises'
import process from 'node:process'

const [reportPath] = process.argv.slice(2)
if (!reportPath) {
  console.error('Usage: node tests/performance/check-limits.mjs <report.json>')
  process.exit(1)
}

const limits = JSON.parse(
  await readFile(new URL('./limits.json', import.meta.url), 'utf8'),
)
const report = JSON.parse(await readFile(reportPath, 'utf8'))

const failures = []
const measured = new Set()

for (const file of report.files) {
  for (const group of file.groups) {
    // "tests/performance/large-form.bench.tsx > 200 entries across 20 pages"
    const groupName = group.fullName.split(' > ').slice(1).join(' > ')
    for (const benchmark of group.benchmarks) {
      const name = `${groupName} > ${benchmark.name}`
      measured.add(name)
      const limit = limits[groupName]?.[benchmark.name]
      if (limit === undefined) {
        failures.push(`${name}: no limit set in limits.json`)
        continue
      }
      const result = `${name}: median ${benchmark.median.toFixed(1)}ms (limit ${limit}ms)`
      if (benchmark.median > limit) {
        failures.push(result)
      } else {
        console.log(`✓ ${result}`)
      }
    }
  }
}

for (const [groupName, benchmarks] of Object.entries(limits)) {
  for (const benchmarkName of Object.keys(benchmarks)) {
    const name = `${groupName} > ${benchmarkName}`
    if (!measured.has(name)) {
      failures.push(`${name}: limit set but the benchmark did not run`)
    }
  }
}

if (failures.length) {
  for (const failure of failures) {
    console.error(`✗ ${failure}`)
  }
  process.exit(1)
}
