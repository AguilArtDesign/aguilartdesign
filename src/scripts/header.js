const header = document.querySelector("[data-header]");
const menuToggle = document.querySelector("[data-menu-toggle]");
const nav = document.querySelector("[data-nav]");
const navLinks = nav
    ? [...nav.querySelectorAll('a[href^="#"]')]
    : [];
const desktopMenuQuery = window.matchMedia("(min-width: 821px)");

let headerFrame = 0;


function updateHeader() {
    if (!header) return;

    header.classList.toggle(
        "is-scrolled",
        window.scrollY > 18
    );

    const activeOffset = header.offsetHeight + 32;
    let activeLink = null;

    navLinks.forEach((link) => {
        const target = document.querySelector(link.hash);

        if (target && target.offsetTop <= window.scrollY + activeOffset) {
            activeLink = link;
        }
    });

    navLinks.forEach((link) => {
        if (link === activeLink) {
            link.setAttribute("aria-current", "page");
        } else {
            link.removeAttribute("aria-current");
        }
    });
}


function requestHeaderUpdate() {
    if (headerFrame) return;

    headerFrame = window.requestAnimationFrame(() => {
        updateHeader();
        headerFrame = 0;
    });
}


function closeMenu({ restoreFocus = false } = {}) {
    if (!menuToggle || !nav) return;

    const wasOpen = nav.classList.contains("is-open");

    nav.classList.remove("is-open");
    menuToggle.classList.remove("is-active");

    document.body.classList.remove("menu-open");

    menuToggle.setAttribute(
        "aria-expanded",
        "false"
    );

    menuToggle.setAttribute("aria-label", "Abrir menú");

    if (restoreFocus && wasOpen) {
        menuToggle.focus();
    }
}


function toggleMenu() {
    if (!menuToggle || !nav) return;

    const isOpen = nav.classList.toggle("is-open");

    menuToggle.classList.toggle(
        "is-active",
        isOpen
    );

    document.body.classList.toggle(
        "menu-open",
        isOpen
    );

    menuToggle.setAttribute(
        "aria-expanded",
        String(isOpen)
    );

    menuToggle.setAttribute(
        "aria-label",
        isOpen ? "Cerrar menú" : "Abrir menú"
    );

    if (isOpen) {
        nav.querySelector("a")?.focus();
    }
}


updateHeader();


window.addEventListener(
    "scroll",
    requestHeaderUpdate,
    {
        passive: true
    }
);


menuToggle?.addEventListener(
    "click",
    toggleMenu
);


nav?.querySelectorAll("a").forEach((link) => {

    link.addEventListener(
        "click",
        () => closeMenu()
    );

});


desktopMenuQuery.addEventListener("change", (event) => {
    if (event.matches) {
        closeMenu();
    }
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        closeMenu({ restoreFocus: true });
    }
});

document.addEventListener("click", (event) => {
    if (!nav || !menuToggle || !(event.target instanceof Node)) return;

    if (
        nav.classList.contains("is-open") &&
        !nav.contains(event.target) &&
        !menuToggle.contains(event.target)
    ) {
        closeMenu();
    }
});
