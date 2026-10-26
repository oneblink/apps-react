/**
 * Fails if the median time of any benchmark in a `vitest bench --outputJson`
 * report exceeds its limit (in milliseconds) in `limits.json`.
 *
 * When `GITHUB_STEP_SUMMARY` is set, also appends a markdown table of the
 * results to the GitHub Actions job summary.
 *
 * Usage: node tests/performance/check-limits.mjs <report.json>
 */
import { appendFile, readFile } from 'node:fs/promises'
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
/** @type {Array<{ groupName: string, benchmarkName: string, median: string, mean: string, limit: string, ofLimit: string, result: string }>} */
const rows = []

for (const file of report.files) {
  for (const group of file.groups) {
    // "tests/performance/large-form.bench.tsx > 200 entries across 20 pages"
    const groupName = group.fullName.split(' > ').slice(1).join(' > ')
    for (const benchmark of group.benchmarks) {
      const name = `${groupName} > ${benchmark.name}`
      measured.add(name)
      const limit = limits[groupName]?.[benchmark.name]
      const median = formatMs(benchmark.median)
      const mean = formatMs(benchmark.mean)
      if (limit === undefined) {
        failures.push(`${name}: no limit set in limits.json`)
        rows.push({
          groupName,
          benchmarkName: benchmark.name,
          median,
          mean,
          limit: '—',
          ofLimit: '—',
          result: 'no limit',
        })
        continue
      }
      const result = `${name}: median ${benchmark.median.toFixed(1)}ms (limit ${limit}ms)`
      const over = benchmark.median > limit
      if (over) {
        failures.push(result)
      } else {
        console.log(`✓ ${result}`)
      }
      rows.push({
        groupName,
        benchmarkName: benchmark.name,
        median,
        mean,
        limit: formatMs(limit),
        ofLimit: `${((benchmark.median / limit) * 100).toFixed(1)}%`,
        result: over ? 'over limit' : 'pass',
      })
    }
  }
}

for (const [groupName, benchmarks] of Object.entries(limits)) {
  for (const benchmarkName of Object.keys(benchmarks)) {
    const name = `${groupName} > ${benchmarkName}`
    if (!measured.has(name)) {
      failures.push(`${name}: limit set but the benchmark did not run`)
      rows.push({
        groupName,
        benchmarkName,
        median: '—',
        mean: '—',
        limit: formatMs(benchmarks[benchmarkName]),
        ofLimit: '—',
        result: 'did not run',
      })
    }
  }
}

if (failures.length) {
  for (const failure of failures) {
    console.error(`✗ ${failure}`)
  }
}

const summaryPath = process.env.GITHUB_STEP_SUMMARY
if (summaryPath) {
  await appendFile(summaryPath, renderSummary(rows, failures.length))
}

if (failures.length) {
  process.exit(1)
}

/**
 * @param {number} value
 * @returns {string}
 */
function formatMs(value) {
  return `${value.toLocaleString('en-US', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} ms`
}

/**
 * @param {string} value
 * @returns {string}
 */
function cell(value) {
  return value.replaceAll('|', '\\|').replaceAll('\n', ' ')
}

/**
 * @param {Array<{ groupName: string, benchmarkName: string, median: string, mean: string, limit: string, ofLimit: string, result: string }>} summaryRows
 * @param {number} failureCount
 * @returns {string}
 */
function renderSummary(summaryRows, failureCount) {
  const lines = [
    '## Benchmark results',
    '',
    failureCount
      ? `❌ ${failureCount} ${failureCount === 1 ? 'benchmark' : 'benchmarks'} failed.`
      : '✅ All benchmarks are within their limits.',
    '',
  ]

  /** @type {Map<string, typeof summaryRows>} */
  const groups = new Map()
  for (const row of summaryRows) {
    const groupRows = groups.get(row.groupName) ?? []
    groupRows.push(row)
    groups.set(row.groupName, groupRows)
  }

  for (const [groupName, groupRows] of groups) {
    lines.push(`### ${groupName}`, '')
    lines.push(
      '| Benchmark | Median | Mean | Limit | % of limit | Result |',
      '| --- | ---: | ---: | ---: | ---: | --- |',
    )
    for (const row of groupRows) {
      const result = row.result === 'pass' ? '✅ pass' : `❌ **${row.result}**`
      lines.push(
        `| ${cell(row.benchmarkName)} | ${row.median} | ${row.mean} | ${row.limit} | ${row.ofLimit} | ${result} |`,
      )
    }
    lines.push('')
  }

  return `${lines.join('\n')}\n`
}
