const elements = document.querySelectorAll(".reveal");

if (
    elements.length &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
) {
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {

                if (!entry.isIntersecting) return;

                entry.target.classList.add("is-visible");

                observer.unobserve(entry.target);

            });
        },
        {
            threshold: 0.12,
            rootMargin: "0px 0px -40px 0px"
        }
    );

    elements.forEach((element) => {
        observer.observe(element);
    });
} else {
    elements.forEach((element) => {
        element.classList.add("is-visible");
    });
}