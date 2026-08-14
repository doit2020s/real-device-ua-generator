const CHROME_PLATFORMS = { desktop: ['win', 'mac'], android: ['android'], ios: ['ios'] };

function compareVersions(a, b) {
  const pa = String(a).split('.').map(Number);
  const pb = String(b).split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i += 1) {
    const diff = (pb[i] || 0) - (pa[i] || 0);
    if (diff) return diff;
  }
  return 0;
}

function newestPerMajor(values, limit = 8) {
  const seen = new Set();
  return [...new Set(values)].sort(compareVersions).filter((version) => {
    const key = String(version).split('.')[0];
    if (seen.has(key) || seen.size >= limit) return false;
    seen.add(key);
    return true;
  });
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'real-device-ua-generator/1.1' },
    signal: AbortSignal.timeout(15000)
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json();
}

async function loadChrome() {
  const entries = await Promise.all(Object.entries(CHROME_PLATFORMS).map(async ([bucket, platforms]) => {
    const values = [];
    for (const platform of platforms) {
      const data = await fetchJson(`https://versionhistory.googleapis.com/v1/chrome/platforms/${platform}/channels/stable/versions?pageSize=100`);
      values.push(...(data.versions || []).map((item) => item.version));
    }
    return [bucket, newestPerMajor(values)];
  }));
  return Object.fromEntries(entries);
}

async function loadEdge() {
  const products = await fetchJson('https://edgeupdates.microsoft.com/api/products?view=enterprise');
  const stable = products.find((product) => product.Product === 'Stable');
  if (!stable) throw new Error('Edge Stable product was not returned');
  const versions = newestPerMajor((stable.Releases || []).map((release) => release.ProductVersion));
  return { desktop: versions, android: [...versions], ios: [...versions] };
}

export async function refreshBrowserData(fallback) {
  const [chrome, edge] = await Promise.allSettled([loadChrome(), loadEdge()]);
  const sources = {
    chrome: chrome.status === 'fulfilled'
      ? { ok: true, label: 'Google Chrome VersionHistory', versions: chrome.value }
      : { ok: false, label: 'Google Chrome VersionHistory', error: chrome.reason.message, versions: fallback.sources.chrome.versions },
    edge: edge.status === 'fulfilled'
      ? { ok: true, label: 'Microsoft Edge Update API', versions: edge.value }
      : { ok: false, label: 'Microsoft Edge Update API', error: edge.reason.message, versions: fallback.sources.edge.versions },
    safari: { ...fallback.sources.safari, cached: true }
  };
  return {
    verifiedAt: new Date().toISOString(),
    mode: chrome.status === 'fulfilled' || edge.status === 'fulfilled' ? 'live' : 'cached',
    sources
  };
}
