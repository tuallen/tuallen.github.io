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

    // padding-bottom comes from a stylesheet and only changes with the media
    // query, so read it once instead of on every frame of the animation — this
    // runs 60x/s while the list expands and getComputedStyle forces a recalc.
    let itemPaddingBottom = parseFloat(getComputedStyle(thirdItem).paddingBottom);

    // Dot centre = li.offsetTop + half the date's line box (see the CSS, which
    // derives the same offset). The rail's CSS `top` is that same value, so the
    // two cancel and the height to any dot is simply li.offsetTop.
    const updateRail = () => {
        if (expanded) {
            // Solid rail from first dot to last dot
            const height = lastItem.offsetTop;
            list.style.setProperty("--rail-height", `${height}px`);
            list.style.setProperty("--rail-bg", "var(--border-color)");
        } else {
            // Rail from first dot, solid to third dot, then fades to the last text baseline.
            // Text baseline ≈ li bottom minus padding-bottom minus half-leading.
            const dotEnd = thirdItem.offsetTop;
            const textEnd = thirdItem.offsetTop + thirdItem.offsetHeight - itemPaddingBottom;
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
            // Re-read the cached padding here rather than on window resize: this
            // fires for any size change, including the media-query switch that
            // actually alters it, and runs before updateRail uses the value.
            itemPaddingBottom = parseFloat(getComputedStyle(thirdItem).paddingBottom);
            updateRail();
        });
    });
    observer.observe(list);

    // Initial rail after collapse transition settles
    setTimeout(updateRail, 400);

    // When an expanded timeline collapses, the date/dot used as the control can
    // move upward by several screenfuls. Keep that point anchored in the viewport
    // while the existing item transitions run, so collapse and navigation feel like
    // one motion rather than a collapse followed by a separate scroll. The page's
    // normal smooth anchor scrolling is temporarily disabled because it would queue
    // these per-frame corrections and replay them after the collapse.
    let scrollFollowFrame = null;
    const scrollCancelEvents = ["wheel", "touchstart", "pointerdown", "keydown"];
    let previousInlineScrollBehavior = null;

    const cancelScrollFollow = () => {
        if (scrollFollowFrame !== null) {
            cancelAnimationFrame(scrollFollowFrame);
            scrollFollowFrame = null;
        }
        scrollCancelEvents.forEach(type => {
            window.removeEventListener(type, cancelScrollFollow, true);
        });
        if (previousInlineScrollBehavior !== null) {
            document.documentElement.style.scrollBehavior = previousInlineScrollBehavior;
            previousInlineScrollBehavior = null;
        }
    };

    const cssTimeToMilliseconds = value => {
        value = value.trim();
        if (value.endsWith("ms")) return parseFloat(value) || 0;
        if (value.endsWith("s")) return (parseFloat(value) || 0) * 1000;
        return 0;
    };

    const collapseTransitionMilliseconds = () => items.reduce((longest, item) => {
        const style = getComputedStyle(item);
        const durations = style.transitionDuration.split(",").map(cssTimeToMilliseconds);
        const delays = style.transitionDelay.split(",").map(cssTimeToMilliseconds);
        const count = Math.max(durations.length, delays.length);
        for (let i = 0; i < count; i++) {
            longest = Math.max(
                longest,
                durations[i % durations.length] + delays[i % delays.length]
            );
        }
        return longest;
    }, 0);

    const followAnchorDuringCollapse = (anchor, anchorTop) => {
        cancelScrollFollow();
        previousInlineScrollBehavior = document.documentElement.style.scrollBehavior;
        document.documentElement.style.scrollBehavior = "auto";
        scrollCancelEvents.forEach(type => {
            window.addEventListener(type, cancelScrollFollow, { capture: true, passive: true });
        });

        const endTime = performance.now() + collapseTransitionMilliseconds() + 50;
        const follow = now => {
            if (expanded) {
                cancelScrollFollow();
                return;
            }

            const delta = anchor.getBoundingClientRect().top - anchorTop;
            if (Math.abs(delta) > 0.25) window.scrollBy(0, delta);

            if (now < endTime) scrollFollowFrame = requestAnimationFrame(follow);
            else cancelScrollFollow();
        };
        scrollFollowFrame = requestAnimationFrame(follow);
    };

    const dates = items.map(item => item.querySelector(".news-date"));
    const nearestDate = clientY => dates.reduce((nearest, date) => {
        if (!nearest) return date;
        return Math.abs(date.getBoundingClientRect().top - clientY)
            < Math.abs(nearest.getBoundingClientRect().top - clientY) ? date : nearest;
    }, null);

    const toggle = collapseAnchor => {
        const anchorTop = collapseAnchor ? collapseAnchor.getBoundingClientRect().top : 0;
        cancelScrollFollow();
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

        if (!expanded && collapseAnchor) {
            followAnchorDuringCollapse(collapseAnchor, anchorTop);
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

    sidebarClick.addEventListener("click", e => {
        toggle(expanded ? nearestDate(e.clientY) : null);
    });
    sidebarClick.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggle(expanded ? dates[dates.length - 1] : null);
        }
    });

    // Clicking any date also toggles
    list.querySelectorAll(".news-date").forEach(date => {
        date.addEventListener("click", () => toggle(expanded ? date : null));
    });
});
