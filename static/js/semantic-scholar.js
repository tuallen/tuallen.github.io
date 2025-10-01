/* ---- Semantic Scholar citation widgets ---- */
const S2_PAPERS = {
    "speede3dgs": "e3e599bd7dbf757e85483a21bbadaed3d4de1fcb",
    "speedy-splat": "941ada3e24e6f54bb49cfaeff998f4f5cbac5a38",
    "pup3dgs": "3046a843ca616b00c6c11f1fec3a1585ed8fd7c9"
};

async function fetchCites(id) {
    const r = await fetch(
        `https://api.semanticscholar.org/graph/v1/paper/${id}?fields=citationCount`
    );
    if (!r.ok) throw new Error(r.status);
    const { citationCount } = await r.json();
    return citationCount ?? 0;
}

(async () => {
    const key = "s2-cite-cache", ttl = 1000 * 60 * 60 * 12; // 12 hours
    const now = Date.now();
    let cache = JSON.parse(sessionStorage.getItem(key) || "{}");

    for (const [slug, id] of Object.entries(S2_PAPERS)) {
        const span = document.getElementById(`cites-${slug}`);
        if (!span) continue;

        if (cache[id] && now - cache[id].ts < ttl) {
            if (cache[id].c > 0) span.textContent = ` ❞ ${cache[id].c}`;
            continue;
        }

        try {
            const c = await fetchCites(id);
            if (c > 0) {
                span.textContent = ` ❞ ${c}`;
                cache[id] = { c, ts: now };
            }
        } catch (err) {
            console.warn(`S² fetch failed for ${slug}`, err);
        }
    }
    sessionStorage.setItem(key, JSON.stringify(cache));
})();