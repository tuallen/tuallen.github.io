/* ---- Reveal section heading accent bars on scroll ---- */
document.addEventListener("DOMContentLoaded", () => {
    const headings = document.querySelectorAll("section > h1");
    if (!headings.length) return;

    // Skip animation entirely for reduced-motion users
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        headings.forEach(h => h.classList.add("in-view"));
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("in-view");
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.2 });

    headings.forEach(h => observer.observe(h));
});
