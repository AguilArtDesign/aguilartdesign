const STORAGE_KEY = "aguilart-theme";
const root = document.documentElement;

function getTheme() {
    return root.dataset.theme === "light" ? "light" : "dark";
}

function updateThemeColor(theme) {
    const meta = document.querySelector('meta[name="theme-color"]');

    if (!meta) return;

    meta.setAttribute(
        "content",
        theme === "dark" ? "#000000" : "#ffffff"
    );
}

function updateThemeButtons(theme) {
    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
        const isLight = theme === "light";

        button.setAttribute(
            "aria-label",
            isLight ? "Activar tema oscuro" : "Activar tema claro"
        );

        button.setAttribute(
            "aria-pressed",
            String(isLight)
        );

        button.dataset.themeCurrent = theme;
    });
}

function setTheme(theme, persist = true) {
    const normalizedTheme = theme === "light" ? "light" : "dark";

    root.dataset.theme = normalizedTheme;

    updateThemeColor(normalizedTheme);
    updateThemeButtons(normalizedTheme);

    if (persist) {
        try {
            localStorage.setItem(STORAGE_KEY, normalizedTheme);
        } catch {
            // El sitio sigue funcionando aunque localStorage no esté disponible.
        }
    }

    window.dispatchEvent(
        new CustomEvent("themechange", {
            detail: {
                theme: normalizedTheme
            }
        })
    );
}

function toggleTheme() {
    setTheme(
        getTheme() === "dark"
            ? "light"
            : "dark"
    );
}

document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
    button.addEventListener("click", toggleTheme);
});

updateThemeColor(getTheme());
updateThemeButtons(getTheme());