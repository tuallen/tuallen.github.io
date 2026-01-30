/* ---- GitHub Stars widgets ---- */
const GITHUB_REPOS = {
    "tuallen-speede3dgs": "tuallen/speede3dgs",
    "pranav-asthana-splatsure": "pranav-asthana/splatsure",
    "tuallen-transfira": "tuallen/transfira",
    "j-alex-hanson-speedy-splat": "j-alex-hanson/speedy-splat",
    "j-alex-hanson-gaussian-splatting-pup": "j-alex-hanson/gaussian-splatting-pup"
};

const GH_CACHE_KEY = "gh-stars-cache";
const GH_CACHE_TTL = 12 * 60 * 60 * 1000; // 12 hours

async function fetchStars(repo) {
    const response = await fetch(`https://api.github.com/repos/${repo}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const { stargazers_count } = await response.json();
    return stargazers_count ?? 0;
}

function updateStarsDisplay(slug, count) {
    const span = document.getElementById(`stars-${slug}`);
    if (span && count > 0) {
        span.textContent = ` ${count}`;
    }
}

(async () => {
    const now = Date.now();
    let cache = {};

    try {
        cache = JSON.parse(sessionStorage.getItem(GH_CACHE_KEY) || "{}");
    } catch (err) {
        console.warn("Failed to parse GitHub stars cache", err);
    }

    const fetchPromises = [];

    for (const [slug, repo] of Object.entries(GITHUB_REPOS)) {
        const cached = cache[repo];

        // Display cached value immediately if valid
        if (cached && now - cached.ts < GH_CACHE_TTL) {
            updateStarsDisplay(slug, cached.stars);
            continue;
        }

        // Queue for fetch
        fetchPromises.push(
            fetchStars(repo)
                .then(stars => ({ slug, repo, stars, success: true }))
                .catch(err => {
                    console.warn(`GitHub fetch failed for ${repo}:`, err.message);
                    return { slug, repo, stars: cached?.stars ?? 0, success: false };
                })
        );
    }

    // Fetch all in parallel and update
    if (fetchPromises.length > 0) {
        const results = await Promise.allSettled(fetchPromises);

        results.forEach(result => {
            if (result.status === 'fulfilled') {
                const { slug, repo, stars, success } = result.value;
                updateStarsDisplay(slug, stars);

                // Only update cache if fetch was successful
                if (success) {
                    cache[repo] = { stars, ts: now };
                }
            }
        });

        try {
            sessionStorage.setItem(GH_CACHE_KEY, JSON.stringify(cache));
        } catch (err) {
            console.warn("Failed to save GitHub stars cache", err);
        }
    }
})();