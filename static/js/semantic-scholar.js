/* ---- Semantic Scholar citation widgets ---- */

// Maps display slug -> paper ID (used for cache keying and fallback)
const S2_PAPERS = {
    "pup3dgs": "3046a843ca616b00c6c11f1fec3a1585ed8fd7c9",
    "speedy-splat": "941ada3e24e6f54bb49cfaeff998f4f5cbac5a38",
    "speede3dgs": "d1cebed3f0845908f4139149daf9bd40b7505e5b",
    "transfira": "333a9c5cb722e495e475d93ccc7dc04cbec3aae4",
    "splatsure": "4cb5fc84a62133f6f3b0cc85bd3420336d5576a8"
};

// Single author ID — one API call fetches all papers at once
const S2_AUTHOR_ID = "2306782092";

const CACHE_KEY = "s2-cite-cache";
const CACHE_TTL = 12 * 60 * 60 * 1000; // 12 hours

async function fetchAllCites() {
    const response = await fetch(
        `https://api.semanticscholar.org/graph/v1/author/${S2_AUTHOR_ID}/papers?fields=citationCount&limit=50`
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const { data } = await response.json();
    // Return a map of paperId -> citationCount
    return Object.fromEntries(data.map(p => [p.paperId, p.citationCount ?? 0]));
}

function updateCitationDisplay(slug, count) {
    const span = document.getElementById(`cites-${slug}`);
    if (span && count != null && count > 0) {
        span.textContent = ` ${count}`;
    }
}

(async () => {
    const now = Date.now();
    let cache = {};

    try {
        cache = JSON.parse(sessionStorage.getItem(CACHE_KEY) || "{}");
    } catch (err) {
        console.warn("Failed to parse citation cache", err);
    }

    // Build reverse map: paperId -> slug, and check which slugs still need fetching
    const idToSlug = Object.fromEntries(
        Object.entries(S2_PAPERS).map(([slug, id]) => [id, slug])
    );

    const needsFetch = Object.entries(S2_PAPERS).some(
        ([, id]) => !cache[id] || now - cache[id].ts >= CACHE_TTL
    );

    // Display any valid cached values immediately
    for (const [slug, id] of Object.entries(S2_PAPERS)) {
        const cached = cache[id];
        if (cached && now - cached.ts < CACHE_TTL) {
            updateCitationDisplay(slug, cached.c);
        }
    }

    // One API call for all papers
    if (needsFetch) {
        try {
            const citesById = await fetchAllCites();

            for (const [paperId, count] of Object.entries(citesById)) {
                const slug = idToSlug[paperId];
                if (!slug) continue; // paper not in our list

                updateCitationDisplay(slug, count);
                cache[paperId] = { c: count, ts: now };
            }

            try {
                sessionStorage.setItem(CACHE_KEY, JSON.stringify(cache));
            } catch (err) {
                console.warn("Failed to save citation cache", err);
            }
        } catch (err) {
            console.warn("S2 author fetch failed:", err.message);
            // Fall back to stale cache values if available
            for (const [slug, id] of Object.entries(S2_PAPERS)) {
                updateCitationDisplay(slug, cache[id]?.c ?? null);
            }
        }
    }
})();