/* ---- Semantic Scholar citation widgets ---- */
const S2_PAPERS = {
    "pup3dgs": "3046a843ca616b00c6c11f1fec3a1585ed8fd7c9",
    "speedy-splat": "941ada3e24e6f54bb49cfaeff998f4f5cbac5a38",
    // "transfira": "333a9c5cb722e495e475d93ccc7dc04cbec3aae4",
    // "splatsure": "4cb5fc84a62133f6f3b0cc85bd3420336d5576a8",
    // "speede3dgs": "e3e599bd7dbf757e85483a21bbadaed3d4de1fcb",
    // "addressing_bias": "1bfd832d88253ee37ae06ee07195711b892b885d"
};

const CACHE_KEY = "s2-cite-cache";
const CACHE_TTL = 12 * 60 * 60 * 1000; // 12 hours

async function fetchCites(id) {
    const response = await fetch(
        `https://api.semanticscholar.org/graph/v1/paper/${id}?fields=citationCount`
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const { citationCount } = await response.json();
    return citationCount ?? 0;
}

function updateCitationDisplay(slug, count) {
    const span = document.getElementById(`cites-${slug}`);
    if (span && count > 0) {
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

    // Batch requests for papers that need updates
    const fetchPromises = [];
    const slugsToFetch = [];

    for (const [slug, id] of Object.entries(S2_PAPERS)) {
        const cached = cache[id];

        // Display cached value immediately if valid
        if (cached && now - cached.ts < CACHE_TTL) {
            updateCitationDisplay(slug, cached.c);
            continue;
        }

        // Queue for fetch
        slugsToFetch.push({ slug, id });
        fetchPromises.push(
            fetchCites(id)
                .then(count => ({ slug, id, count, success: true }))
                .catch(err => {
                    console.warn(`S2 fetch failed for ${slug}:`, err.message);
                    return { slug, id, count: cached?.c ?? 0, success: false };
                })
        );
    }

    // Fetch all in parallel and update
    if (fetchPromises.length > 0) {
        const results = await Promise.allSettled(fetchPromises);

        results.forEach(result => {
            if (result.status === 'fulfilled') {
                const { slug, id, count, success } = result.value;
                updateCitationDisplay(slug, count);

                // Only update cache if fetch was successful
                if (success) {
                    cache[id] = { c: count, ts: now };
                }
            }
        });

        try {
            sessionStorage.setItem(CACHE_KEY, JSON.stringify(cache));
        } catch (err) {
            console.warn("Failed to save citation cache", err);
        }
    }
})();