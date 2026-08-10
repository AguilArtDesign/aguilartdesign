const header = document.querySelector("[data-header]");
const menuToggle = document.querySelector("[data-menu-toggle]");
const nav = document.querySelector("[data-nav]");


function updateHeader() {
    if (!header) return;

    header.classList.toggle(
        "is-scrolled",
        window.scrollY > 18
    );
}


function closeMenu() {
    if (!menuToggle || !nav) return;

    nav.classList.remove("is-open");
    menuToggle.classList.remove("is-active");

    document.body.classList.remove("menu-open");

    menuToggle.setAttribute(
        "aria-expanded",
        "false"
    );
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
}


updateHeader();


window.addEventListener(
    "scroll",
    updateHeader,
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
        closeMenu
    );

});


window.addEventListener("resize", () => {

    if (window.innerWidth > 820) {
        closeMenu();
    }

});