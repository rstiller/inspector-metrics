#!/bin/bash
#
# compat-smoke.sh
#
# Verifies that the freshly built workspace packages still work on a
# (legacy) Node.js runtime, even though the project is developed on a
# modern one. It builds a plain npm "consumer" project that depends on the
# built artifacts via `file:` references (mirroring how `pnpm publish`
# would make the packages consumable) and smoke-tests it: a native module
# or registry dependency that no longer supports the old runtime fails here
# before a release.
#
# Usage: COMPAT_PKG_DIR=/path/to/downloaded-artifacts bash test-env/compat-smoke.sh
#
# Expected layout under $COMPAT_PKG_DIR:
#   packages/<name>/build/...
#   packages/<name>/package.json
#
set -euo pipefail

PKG_DIR="${COMPAT_PKG_DIR:?COMPAT_PKG_DIR must point at the downloaded build artifacts}"

if [ ! -d "${PKG_DIR}/packages" ]; then
  echo "FATAL: no 'packages/' directory under ${PKG_DIR}" >&2
  exit 1
fi

# inspector-metrics is the API core every consumer gets;
# inspector-prometheus is one reporter (no required external native dep)
# as the "typical consumer" artifact.
CORE="inspector-metrics"
REPORTER="inspector-prometheus"
PKGS=("${CORE}" "${REPORTER}")

WORK="$(mktemp -d /tmp/inspector-compat.XXXXXX)"
trap 'rm -rf "${WORK}"' EXIT

# 1) materialise the published artifacts (build output + manifest)
for name in "${PKGS[@]}"; do
  dst="${WORK}/${name}"
  mkdir -p "${dst}"
  cp "${PKG_DIR}/packages/${name}/package.json" "${dst}/package.json"
  cp -r "${PKG_DIR}/packages/${name}/build" "${dst}/build"
done

# 2) pnpm's `workspace:` protocol is not installable by plain npm;
#    rewrite it to an absolute `file:` spec pointing at the materialized dir.
for name in "${PKGS[@]}"; do
  pj="${WORK}/${name}/package.json"
  python3 - "$pj" "${WORK}" <<'PY'
import json, sys
pj, work = sys.argv[1], sys.argv[2]
with open(pj, encoding='utf-8') as f:
    d = json.load(f)
for section in ('dependencies', 'peerDependencies', 'optionalDependencies', 'devDependencies'):
    for k, v in list((d.get(section) or {}).items()):
        if isinstance(v, str) and v.startswith('workspace:'):
            d[section][k] = 'file:' + work + '/' + k
with open(pj, 'w', encoding='utf-8') as f:
    json.dump(d, f, indent=4)
    f.write('\n')
PY
done

# 3) consumer project: npm resolves registry deps for the current Node
#    version; hoisting into WORK/node_modules (an ancestor of the
#    materialized package dirs) makes all transitive deps resolvable.
cat > "${WORK}/package.json" <<EOF
{
  "name": "inspector-metrics-compat-smoke",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "${CORE}": "file:./${CORE}",
    "${REPORTER}": "file:./${REPORTER}"
  }
}
EOF

echo ">>> node $(node -v), npm $(npm -v)"
echo ">>> npm install in consumer (resolves registry deps for this Node version) ..."
( cd "${WORK}" && npm install --no-audit --no-fund --loglevel=error )

# 4) smoke test against the installed consumer project
echo ">>> smoke test: require + basic API usage on Node $(node -v)"
( cd "${WORK}" && node - <<'NODE'
;(async () => {
  const im = require('inspector-metrics')
  const rep = require('inspector-prometheus')

  const registry = new im.MetricRegistry()

  const counter = registry.newCounter('smoke_counter')
  counter.increment()
  counter.increment(2)
  if (counter.getCount() !== 3) throw new Error('counter value mismatch: ' + counter.getCount())

  const meter = registry.newMeter('smoke_meter')
  meter.mark(1)

  const timer = registry.newTimer('smoke_timer')
  timer.time(() => 1 + 1)

  const histogram = registry.newHistogram('smoke_histogram')
  histogram.update(5)

  const gauge = new im.SimpleGauge('smoke_gauge')
  gauge.setValue(42)
  registry.registerMetric(gauge, 'smoke', 'gauge for smoke test')

  if (typeof rep.PrometheusMetricReporter !== 'function') throw new Error('PrometheusMetricReporter not exported')
  const reporter = new rep.PrometheusMetricReporter({})
  reporter.addMetricRegistry(registry)
  const rendered = await reporter.getMetricsString()
  if (typeof rendered !== 'string' || rendered.trim().length === 0) throw new Error('prometheus render produced no output')

  console.log('compat smoke OK: registry + counter/meter/timer/histogram/gauge + Prometheus render all work')
  console.log('--- rendered (first 200 chars) ---')
  console.log(rendered.slice(0, 200))
})().catch(err => {
  console.error('COMPAT SMOKE FAILED:', err)
  process.exit(1)
})
NODE
)

echo ">>> COMPAT CHECK PASSED on Node $(node -v)"
