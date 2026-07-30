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

    // Start collapsed
    list.classList.add("is-collapsed");
    let expanded = false;

    const getRailHeight = (target) => {
        const listRect = list.getBoundingClientRect();
        const targetRect = target.getBoundingClientRect();
        const dotCenter = targetRect.top + 11 - listRect.top;
        return Math.max(0, dotCenter - 8);
    };

    // Set initial collapsed rail height
    list.style.setProperty("--rail-height", `${getRailHeight(thirdItem)}px`);

    const toggle = () => {
        expanded = !expanded;

        if (expanded) {
            // Pre-measure expanded height before animating
            list.style.transition = "none";
            list.classList.remove("is-collapsed");
            items.forEach(li => li.style.transition = "none");
            const expandedHeight = getRailHeight(lastItem);
            list.classList.add("is-collapsed");
            // Force reflow so the browser registers the collapsed state
            void list.offsetHeight;
            items.forEach(li => li.style.transition = "");
            list.style.transition = "";

            // Now animate open
            list.classList.remove("is-collapsed");
            thirdItem.classList.remove("news-arrow-down");
            lastItem.classList.add("news-arrow-up");
            sidebarClick.setAttribute("aria-label", "Show fewer news items");
            list.style.setProperty("--rail-height", `${expandedHeight}px`);
        } else {
            list.style.setProperty("--rail-height", `${getRailHeight(thirdItem)}px`);
            lastItem.classList.remove("news-arrow-up");
            thirdItem.classList.add("news-arrow-down");
            list.classList.add("is-collapsed");
            sidebarClick.setAttribute("aria-label", `Show ${hiddenCount} more news items`);
        }

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
