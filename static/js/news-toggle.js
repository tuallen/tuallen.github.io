/* ---- News timeline: collapse/expand with animated dots sidebar ---- */
document.addEventListener("DOMContentLoaded", () => {
    const VISIBLE_COUNT = 3;

    const list = document.querySelector(".news-timeline");
    if (!list) return;

    const items = Array.from(list.querySelectorAll(":scope > li"));
    if (items.length <= VISIBLE_COUNT) return;

    const hiddenCount = items.length - VISIBLE_COUNT;

    // Mark hidden items
    items.forEach((li, i) => {
        if (i >= VISIBLE_COUNT) li.classList.add("news-hidden");
    });

    // The third item (last visible when collapsed) gets the down-arrow
    const thirdItem = items[VISIBLE_COUNT - 1];
    thirdItem.classList.add("news-arrow-down");

    // The last item gets the up-arrow when expanded
    const lastItem = items[items.length - 1];

    // Invisible click area over the entire dot-sidebar column
    const sidebarClick = document.createElement("div");
    sidebarClick.className = "news-sidebar-click";
    sidebarClick.setAttribute("role", "button");
    sidebarClick.setAttribute("tabindex", "0");
    sidebarClick.setAttribute("aria-label", `Show ${hiddenCount} more news items`);
    list.prepend(sidebarClick);

    // Start collapsed, then mark as JS-ready so CSS switches from display:none to animated collapse
    list.classList.add("is-collapsed");
    list.classList.add("js-ready");
    let expanded = false;

    // Dot center = li.offsetTop + 9 (dot: top 3px + radius 6px).
    // Rail CSS top = 9px (first dot center).
    // Rail height to a dot = li.offsetTop (the +9's cancel).
    const updateRail = () => {
        if (expanded) {
            // Solid rail from first dot to last dot
            const height = lastItem.offsetTop;
            list.style.setProperty("--rail-height", `${height}px`);
            list.style.setProperty("--rail-bg", "var(--border-color)");
        } else {
            // Rail from first dot, solid to third dot, then fades to the last text baseline.
            // Text baseline ≈ li bottom minus padding-bottom minus half-leading.
            const pb = parseFloat(getComputedStyle(thirdItem).paddingBottom);
            const dotEnd = thirdItem.offsetTop;
            const textEnd = thirdItem.offsetTop + thirdItem.offsetHeight - pb;
            const solidStop = dotEnd / textEnd * 100;
            list.style.setProperty("--rail-height", `${textEnd}px`);
            list.style.setProperty("--rail-bg",
                `linear-gradient(to bottom, var(--border-color) ${solidStop}%, transparent)`);
        }
    };

    // Reactively update rail when layout changes (resize, text wrap, orientation).
    // Coalesce into a frame: updateRail writes custom properties on the very element
    // being observed, so responding synchronously risks re-entrant notifications
    // ("ResizeObserver loop completed with undelivered notifications").
    let railQueued = false;
    const observer = new ResizeObserver(() => {
        if (railQueued) return;
        railQueued = true;
        requestAnimationFrame(() => {
            railQueued = false;
            updateRail();
        });
    });
    observer.observe(list);

    // Initial rail after collapse transition settles
    setTimeout(updateRail, 400);

    const toggle = () => {
        expanded = !expanded;

        if (expanded) {
            list.classList.remove("is-collapsed");
            thirdItem.classList.remove("news-arrow-down");
            lastItem.classList.add("news-arrow-up");
            sidebarClick.setAttribute("aria-label", "Show fewer news items");
        } else {
            lastItem.classList.remove("news-arrow-up");
            thirdItem.classList.add("news-arrow-down");
            list.classList.add("is-collapsed");
            sidebarClick.setAttribute("aria-label", `Show ${hiddenCount} more news items`);
        }

        // Track the rail every frame for the length of the item transition. The
        // ResizeObserver alone would keep up, but it coalesces into the next frame
        // and stops firing once the <ul> settles; driving it directly keeps the
        // rail exactly level with the dots as they move.
        updateRail();
        const start = performance.now();
        const follow = () => {
            updateRail();
            // 0.35s max-height + 0.42s longest stagger, plus a frame of slack.
            if (performance.now() - start < 800) requestAnimationFrame(follow);
        };
        requestAnimationFrame(follow);

        sidebarClick.setAttribute("aria-expanded", String(expanded));
    };

    sidebarClick.setAttribute("aria-expanded", "false");

    sidebarClick.addEventListener("click", toggle);
    sidebarClick.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggle();
        }
    });

    // Clicking any date also toggles
    list.querySelectorAll(".news-date").forEach(date => {
        date.addEventListener("click", toggle);
    });
});
