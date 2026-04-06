const { execSync } = require('node:child_process')
const { readFileSync, statSync } = require('node:fs')
const { resolve } = require('node:path')

const MAX_SCAN_BYTES = 1024 * 1024
const SCAN_EXCLUDE_FILES = new Set(['scripts/check-secrets.cjs'])

const riskyPatterns = [
  {
    name: 'Private key block',
    regex: /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/,
  },
  {
    name: 'Google API key literal',
    regex: /AIza[0-9A-Za-z\-_]{35}/,
  },
  {
    name: 'Service account private key field',
    regex: /"private_key"\s*:\s*"-----BEGIN PRIVATE KEY-----/,
  },
  {
    name: 'Stripe secret key literal',
    regex: /sk_(?:live|test)_[0-9a-zA-Z]{16,}/,
  },
]

const getTrackedFiles = () => {
  const output = execSync('git ls-files', { encoding: 'utf-8' })
  return output
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

const isLikelyText = (filePath) => {
  const lower = filePath.toLowerCase()
  const binaryLikeExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.ico', '.pdf', '.zip', '.mp4', '.woff', '.woff2']
  return !binaryLikeExtensions.some((ext) => lower.endsWith(ext))
}

const findMatches = (filePath) => {
  const absolutePath = resolve(filePath)
  let stats

  try {
    stats = statSync(absolutePath)
  } catch {
    return []
  }

  if (!stats.isFile() || stats.size > MAX_SCAN_BYTES || !isLikelyText(filePath)) {
    return []
  }

  const content = readFileSync(absolutePath, 'utf-8')
  return riskyPatterns
    .filter((pattern) => pattern.regex.test(content))
    .map((pattern) => pattern.name)
}

const trackedFiles = getTrackedFiles()
const criticalTrackedFiles = trackedFiles.filter(
  (filePath) => filePath === '.env' || filePath.endsWith('/.env') || filePath.endsWith('serviceAccountKey.json')
)

const findings = []

for (const filePath of trackedFiles) {
  if (SCAN_EXCLUDE_FILES.has(filePath)) {
    continue
  }

  const matches = findMatches(filePath)
  if (matches.length > 0) {
    findings.push({ filePath, matches })
  }
}

if (criticalTrackedFiles.length > 0 || findings.length > 0) {
  console.error('Secret scan failed. Remove sensitive material before commit/deploy.')

  if (criticalTrackedFiles.length > 0) {
    console.error('\nTracked sensitive files:')
    for (const filePath of criticalTrackedFiles) {
      console.error(`- ${filePath}`)
    }
  }

  if (findings.length > 0) {
    console.error('\nPotential secret patterns found:')
    for (const finding of findings) {
      console.error(`- ${finding.filePath}: ${finding.matches.join(', ')}`)
    }
  }

  console.error('\nIf a key was exposed, rotate it and move secrets to environment variables or secret manager.')
  process.exit(1)
}

console.log('Secret scan passed.')