document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-aad-flow]").forEach(initAADFlow);
});

function initAADFlow(flow) {
    const content = flow.querySelector(".aad-flow__content");
    const nodes = [...flow.querySelectorAll("[data-flow-node]")];
    const connectors = [...flow.querySelectorAll("[data-flow-connector]")];

    /* Configuración de velocidad */
    const BORDER_DURATION = 1200;
    const CONNECTOR_DURATION = 700;
    const ACTIVE_HOLD = 180;
    const FINAL_HOLD = 900;
    const LOOP_PAUSE = 650;
    const EASING = "cubic-bezier(.45,0,.2,1)";

    let running = false;
    let started = false;
    let inViewport = false;
    let pageVisible = !document.hidden;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const visibilityWaiters = new Set();
    const activeWaits = new Set();

    function canAnimate() {
        return inViewport && pageVisible && !reducedMotion.matches;
    }

    function waitUntilPlayable() {
        if (canAnimate()) return Promise.resolve();

        return new Promise(resolve => {
            visibilityWaiters.add(resolve);
        });
    }

    function wait(ms) {
        return new Promise(resolve => {
            const state = {
                remaining: ms,
                timer: null,
                startedAt: 0,
                done: false,
                pause() {
                    if (this.done || this.timer === null) return;

                    clearTimeout(this.timer);
                    this.timer = null;
                    this.remaining = Math.max(0, this.remaining - (performance.now() - this.startedAt));
                },
                resume() {
                    if (this.done || this.timer !== null || !canAnimate()) return;

                    if (this.remaining <= 0) {
                        this.finish();
                        return;
                    }

                    this.startedAt = performance.now();
                    this.timer = setTimeout(() => this.finish(), this.remaining);
                },
                finish() {
                    if (this.done) return;

                    this.done = true;
                    if (this.timer !== null) clearTimeout(this.timer);
                    this.timer = null;
                    activeWaits.delete(this);
                    resolve();
                }
            };

            activeWaits.add(state);
            state.resume();
        });
    }

    function syncPlayback() {
        const playable = canAnimate();

        flow.getAnimations({ subtree: true }).forEach(animation => {
            if (playable) {
                if (animation.playState === "paused") animation.play();
            } else if (animation.playState === "running") {
                animation.pause();
            }
        });

        activeWaits.forEach(state => {
            if (playable) state.resume();
            else state.pause();
        });

        if (playable && visibilityWaiters.size) {
            const waiters = [...visibilityWaiters];
            visibilityWaiters.clear();
            waiters.forEach(resolve => resolve());
        }
    }

    function getLayoutMode() {
        if (window.matchMedia("(max-width: 767px)").matches) return "mobile";
        if (window.matchMedia("(max-width: 1080px)").matches) return "tablet";
        return "desktop";
    }

    function getFlowWidth() {
        const styles = getComputedStyle(flow);
        const value = parseFloat(styles.getPropertyValue("--flow-width"));
        return Number.isFinite(value) ? value : 1.7;
    }

    function ensureBorderPaths(node) {
        const svg = node.querySelector(".aad-flow-border");
        let paths = [...svg.querySelectorAll("path")];

        if (paths.length < 2) {
            const secondPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
            secondPath.classList.add("aad-flow-border__secondary");
            svg.appendChild(secondPath);
            paths = [...svg.querySelectorAll("path")];
        }

        return { svg, primary: paths[0], secondary: paths[1] };
    }

    /* Crear borde SVG real */
    function buildBorderPath(node) {
        const { svg, primary, secondary } = ensureBorderPaths(node);
        const rect = node.getBoundingClientRect();
        const width = Math.max(1, rect.width);
        const height = Math.max(1, rect.height);
        const strokeWidth = getFlowWidth();
        const styles = getComputedStyle(node);
        const cssRadius = parseFloat(styles.borderTopLeftRadius) || 20;
        const inset = strokeWidth / 2;
        const radius = Math.max(0, Math.min(cssRadius - inset, width / 2, height / 2));
        const mode = getLayoutMode();
        const index = nodes.indexOf(node);

        svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

        const x1 = inset;
        const y1 = inset;
        const x2 = width - inset;
        const y2 = height - inset;
        const midX = width / 2;
        const midY = height / 2;

        const paths = [];

        const singleRightCCW = `
            M ${x2} ${midY}
            L ${x2} ${y1 + radius}
            Q ${x2} ${y1} ${x2 - radius} ${y1}
            L ${x1 + radius} ${y1}
            Q ${x1} ${y1} ${x1} ${y1 + radius}
            L ${x1} ${y2 - radius}
            Q ${x1} ${y2} ${x1 + radius} ${y2}
            L ${x2 - radius} ${y2}
            Q ${x2} ${y2} ${x2} ${y2 - radius}
            L ${x2} ${midY}
        `;

        const singleBottomCCW = `
            M ${midX} ${y2}
            L ${x2 - radius} ${y2}
            Q ${x2} ${y2} ${x2} ${y2 - radius}
            L ${x2} ${y1 + radius}
            Q ${x2} ${y1} ${x2 - radius} ${y1}
            L ${x1 + radius} ${y1}
            Q ${x1} ${y1} ${x1} ${y1 + radius}
            L ${x1} ${y2 - radius}
            Q ${x1} ${y2} ${x1 + radius} ${y2}
            L ${midX} ${y2}
        `;

        const singleLeftCW = `
            M ${x1} ${midY}
            L ${x1} ${y1 + radius}
            Q ${x1} ${y1} ${x1 + radius} ${y1}
            L ${x2 - radius} ${y1}
            Q ${x2} ${y1} ${x2} ${y1 + radius}
            L ${x2} ${y2 - radius}
            Q ${x2} ${y2} ${x2 - radius} ${y2}
            L ${x1 + radius} ${y2}
            Q ${x1} ${y2} ${x1} ${y2 - radius}
            L ${x1} ${midY}
        `;

        const singleTopCW = `
            M ${midX} ${y1}
            L ${x2 - radius} ${y1}
            Q ${x2} ${y1} ${x2} ${y1 + radius}
            L ${x2} ${y2 - radius}
            Q ${x2} ${y2} ${x2 - radius} ${y2}
            L ${x1 + radius} ${y2}
            Q ${x1} ${y2} ${x1} ${y2 - radius}
            L ${x1} ${y1 + radius}
            Q ${x1} ${y1} ${x1 + radius} ${y1}
            L ${midX} ${y1}
        `;

        const splitLeftUpper = `
            M ${x1} ${midY}
            L ${x1} ${y1 + radius}
            Q ${x1} ${y1} ${x1 + radius} ${y1}
            L ${x2 - radius} ${y1}
            Q ${x2} ${y1} ${x2} ${y1 + radius}
            L ${x2} ${midY}
        `;

        const splitLeftLower = `
            M ${x1} ${midY}
            L ${x1} ${y2 - radius}
            Q ${x1} ${y2} ${x1 + radius} ${y2}
            L ${x2 - radius} ${y2}
            Q ${x2} ${y2} ${x2} ${y2 - radius}
            L ${x2} ${midY}
        `;

        const splitTopRight = `
            M ${midX} ${y1}
            L ${x2 - radius} ${y1}
            Q ${x2} ${y1} ${x2} ${y1 + radius}
            L ${x2} ${y2 - radius}
            Q ${x2} ${y2} ${x2 - radius} ${y2}
            L ${midX} ${y2}
        `;

        const splitTopLeft = `
            M ${midX} ${y1}
            L ${x1 + radius} ${y1}
            Q ${x1} ${y1} ${x1} ${y1 + radius}
            L ${x1} ${y2 - radius}
            Q ${x1} ${y2} ${x1 + radius} ${y2}
            L ${midX} ${y2}
        `;

        /* Tablet — WooCommerce: dos líneas desde arriba que cierran en la derecha. */
        const tabletTopToRightShort = `
            M ${midX} ${y1}
            L ${x2 - radius} ${y1}
            Q ${x2} ${y1} ${x2} ${y1 + radius}
            L ${x2} ${midY}
        `;

        const tabletTopToRightLong = `
            M ${midX} ${y1}
            L ${x1 + radius} ${y1}
            Q ${x1} ${y1} ${x1} ${y1 + radius}
            L ${x1} ${y2 - radius}
            Q ${x1} ${y2} ${x1 + radius} ${y2}
            L ${x2 - radius} ${y2}
            Q ${x2} ${y2} ${x2} ${y2 - radius}
            L ${x2} ${midY}
        `;

        /* Tablet — Automatización: dos líneas desde la izquierda que cierran abajo. */
        const tabletLeftToBottomShort = `
            M ${x1} ${midY}
            L ${x1} ${y2 - radius}
            Q ${x1} ${y2} ${x1 + radius} ${y2}
            L ${midX} ${y2}
        `;

        const tabletLeftToBottomLong = `
            M ${x1} ${midY}
            L ${x1} ${y1 + radius}
            Q ${x1} ${y1} ${x1 + radius} ${y1}
            L ${x2 - radius} ${y1}
            Q ${x2} ${y1} ${x2} ${y1 + radius}
            L ${x2} ${y2 - radius}
            Q ${x2} ${y2} ${x2 - radius} ${y2}
            L ${midX} ${y2}
        `;

        if (mode === "desktop") {
            if (index === 0) {
                /* WordPress: derecha → antihorario → derecha. */
                paths.push({ path: primary, d: singleRightCCW });
            } else if (index === 1 || index === 2) {
                /* WooCommerce / n8n: dos líneas desde la izquierda que cierran a la derecha. */
                paths.push(
                    { path: primary, d: splitLeftUpper },
                    { path: secondary, d: splitLeftLower }
                );
            } else {
                /* APIs: izquierda → horario → izquierda. */
                paths.push({ path: primary, d: singleLeftCW });
            }
        } else if (mode === "mobile") {
            if (index === 0) {
                /* WordPress: abajo → antihorario → abajo. */
                paths.push({ path: primary, d: singleBottomCCW });
            } else if (index === 1 || index === 2) {
                /* WooCommerce / n8n: dos líneas desde arriba que cierran abajo. */
                paths.push(
                    { path: primary, d: splitTopRight },
                    { path: secondary, d: splitTopLeft }
                );
            } else {
                /* APIs: arriba → horario → arriba. */
                paths.push({ path: primary, d: singleTopCW });
            }
        } else {
            /* Tablet: recorrido propio para la cuadrícula de 2 columnas. */
            if (index === 0) {
                /* WordPress: abajo → antihorario → abajo. */
                paths.push({ path: primary, d: singleBottomCCW });
            } else if (index === 1) {
                /* WooCommerce: dos líneas desde arriba que cierran juntas en la derecha. */
                paths.push(
                    { path: primary, d: tabletTopToRightShort },
                    { path: secondary, d: tabletTopToRightLong }
                );
            } else if (index === 2) {
                /* Automatización: dos líneas desde la izquierda que cierran juntas abajo. */
                paths.push(
                    { path: primary, d: tabletLeftToBottomShort },
                    { path: secondary, d: tabletLeftToBottomLong }
                );
            } else {
                /* APIs: arriba → horario → arriba. */
                paths.push({ path: primary, d: singleTopCW });
            }
        }

        [primary, secondary].forEach(path => {
            path.getAnimations().forEach(animation => animation.cancel());
            path.style.opacity = "0";
        });

        const borderData = paths.map(item => {
            item.path.setAttribute("d", item.d);
            const length = item.path.getTotalLength();
            item.path.style.strokeDasharray = `${length}`;
            item.path.style.strokeDashoffset = `${length}`;
            item.path.style.opacity = "0";
            return { path: item.path, length };
        });

        const activePaths = new Set(borderData.map(item => item.path));
        [primary, secondary].forEach(path => {
            if (!activePaths.has(path)) {
                path.removeAttribute("d");
                path.style.strokeDasharray = "none";
                path.style.strokeDashoffset = "0";
                path.style.opacity = "0";
            }
        });

        node._aadBorderData = borderData;
    }

    function buildAllBorders() {
        nodes.forEach(buildBorderPath);
    }

    /* Ruta especial WooCommerce → Automatización para Tablet */
    function ensureTabletRoute(connector) {
        let svg = connector.querySelector(".aad-flow-tablet-route");
        if (svg) return svg;

        const ns = "http://www.w3.org/2000/svg";
        svg = document.createElementNS(ns, "svg");
        svg.classList.add("aad-flow-tablet-route");
        svg.setAttribute("aria-hidden", "true");
        svg.setAttribute("preserveAspectRatio", "none");

        const base = document.createElementNS(ns, "path");
        base.classList.add("aad-flow-tablet-route__base");

        const progress = document.createElementNS(ns, "path");
        progress.classList.add("aad-flow-tablet-route__progress");

        const particle = document.createElementNS(ns, "circle");
        particle.classList.add("aad-flow-tablet-route__particle");
        particle.setAttribute("r", "3");

        svg.append(base, progress, particle);
        connector.appendChild(svg);
        return svg;
    }

    function buildTabletRoute() {
        const connector = connectors[1];
        const svg = ensureTabletRoute(connector);
        const base = svg.querySelector(".aad-flow-tablet-route__base");
        const progress = svg.querySelector(".aad-flow-tablet-route__progress");
        const particle = svg.querySelector(".aad-flow-tablet-route__particle");

        if (getLayoutMode() !== "tablet") {
            svg.removeAttribute("viewBox");
            base.removeAttribute("d");
            progress.removeAttribute("d");
            return null;
        }

        const contentRect = content.getBoundingClientRect();
        const wooRect = nodes[1].getBoundingClientRect();
        const n8nRect = nodes[2].getBoundingClientRect();
        const width = Math.max(1, contentRect.width);
        const height = Math.max(1, contentRect.height);

        const startX = wooRect.right - contentRect.left;
        const startY = wooRect.top + wooRect.height / 2 - contentRect.top;
        const endX = n8nRect.left - contentRect.left;
        const endY = n8nRect.top + n8nRect.height / 2 - contentRect.top;
        const midX = (startX + endX) / 2;
        const corner = Math.min(14, Math.abs(startY - endY) / 4, Math.abs(endX - startX) / 4);

        /* Sale de WooCommerce hacia la derecha, sube por el centro y entra a Automatización. */
        const d = `
            M ${startX} ${startY}
            H ${midX - corner}
            Q ${midX} ${startY} ${midX} ${startY - corner}
            V ${endY + corner}
            Q ${midX} ${endY} ${midX + corner} ${endY}
            H ${endX}
        `;

        svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
        base.setAttribute("d", d);
        progress.setAttribute("d", d);

        const length = progress.getTotalLength();
        progress.style.strokeDasharray = `${length}`;
        progress.style.strokeDashoffset = `${length}`;
        progress.style.opacity = "0";

        const firstPoint = progress.getPointAtLength(0);
        particle.setAttribute("cx", firstPoint.x);
        particle.setAttribute("cy", firstPoint.y);
        particle.style.opacity = "0";

        connector.dataset.routeLength = length;
        return { svg, progress, particle, length };
    }

    buildAllBorders();
    ensureTabletRoute(connectors[1]);
    buildTabletRoute();

    /* Recalcular si Elementor cambia dimensiones antes de iniciar el loop */
    const resizeObserver = new ResizeObserver(() => {
        if (!running) {
            buildAllBorders();
            buildTabletRoute();
        }
    });
    nodes.forEach(node => resizeObserver.observe(node));
    resizeObserver.observe(content);

    /* Reset */
    function resetNode(node) {
        buildBorderPath(node);

        node.classList.remove("is-active");

        const allPaths = [...node.querySelectorAll(".aad-flow-border path")];
        allPaths.forEach(path => {
            path.getAnimations().forEach(animation => animation.cancel());
            path.style.opacity = "0";
        });

        (node._aadBorderData || []).forEach(({ path, length }) => {
            path.style.strokeDasharray = `${length}`;
            path.style.strokeDashoffset = `${length}`;
            path.style.opacity = "0";
        });
    }

    function resetConnector(connector) {
        const index = connectors.indexOf(connector);
        const progress = connector.querySelector(".aad-flow-connector__progress");
        const particle = connector.querySelector(".aad-flow-connector__particle");
        const mode = getLayoutMode();

        progress.getAnimations().forEach(animation => animation.cancel());
        particle.getAnimations().forEach(animation => animation.cancel());
        progress.style.opacity = "0";
        particle.style.opacity = "0";

        if (mode === "tablet" && index === 1) {
            const route = buildTabletRoute();
            if (route) {
                route.progress.getAnimations().forEach(animation => animation.cancel());
                route.particle.getAnimations().forEach(animation => animation.cancel());
                route.progress.style.strokeDasharray = `${route.length}`;
                route.progress.style.strokeDashoffset = `${route.length}`;
                route.progress.style.opacity = "0";
                route.particle.style.opacity = "0";
            }
            return;
        }

        if (mode === "mobile" || mode === "tablet") {
            progress.style.width = "var(--flow-width)";
            progress.style.height = "0%";
            particle.style.top = "0%";
            particle.style.left = "50%";
        } else {
            progress.style.width = "0%";
            progress.style.height = "var(--flow-width)";
            particle.style.left = "0%";
            particle.style.top = "50%";
        }
    }

    function resetAll() {
        nodes.forEach(resetNode);
        connectors.forEach(resetConnector);
    }

    /* Animar caja */
    async function animateNode(node) {
        await waitUntilPlayable();
        buildBorderPath(node);

        const borderData = node._aadBorderData || [];
        node.classList.add("is-active");

        const animations = borderData.map(({ path, length }) => {
            path.style.opacity = "1";

            return path.animate(
                [
                    { strokeDashoffset: length, opacity: 1 },
                    { strokeDashoffset: 0, opacity: 1 }
                ],
                {
                    duration: BORDER_DURATION,
                    easing: EASING,
                    fill: "forwards"
                }
            );
        });

        await Promise.all(animations.map(animation => animation.finished.catch(() => {})));

        borderData.forEach(({ path }) => {
            path.style.strokeDashoffset = "0";
            path.style.opacity = "1";
        });

        await wait(ACTIVE_HOLD);
    }

    /* Apagar caja */
    async function fadeNode(node) {
        await waitUntilPlayable();
        const borderData = node._aadBorderData || [];
        const animations = borderData.map(({ path }) => path.animate(
            [{ opacity: 1 }, { opacity: 0 }],
            { duration: 350, easing: "ease", fill: "forwards" }
        ));

        await Promise.all(animations.map(animation => animation.finished.catch(() => {})));
        node.classList.remove("is-active");
    }

    function followSvgParticle(animation, path, particle, length) {
        return new Promise(resolve => {
            const tick = async () => {
                await waitUntilPlayable();

                const timing = animation.effect.getComputedTiming();
                const progress = timing.progress;

                if (progress !== null) {
                    const point = path.getPointAtLength(length * progress);
                    particle.setAttribute("cx", point.x);
                    particle.setAttribute("cy", point.y);
                }

                if (animation.playState === "finished" || animation.playState === "idle") {
                    resolve();
                    return;
                }

                requestAnimationFrame(tick);
            };

            requestAnimationFrame(tick);
        });
    }

    async function animateTabletBridge(connector) {
        await waitUntilPlayable();
        const route = buildTabletRoute();
        if (!route) return;

        route.progress.style.opacity = "1";
        route.particle.style.opacity = "1";

        const animation = route.progress.animate(
            [
                { strokeDashoffset: route.length, opacity: 1 },
                { strokeDashoffset: 0, opacity: 1 }
            ],
            {
                duration: CONNECTOR_DURATION,
                easing: EASING,
                fill: "forwards"
            }
        );

        const particleFollow = followSvgParticle(
            animation,
            route.progress,
            route.particle,
            route.length
        );

        await Promise.all([
            animation.finished.catch(() => {}),
            particleFollow
        ]);

        route.particle.animate(
            [{ opacity: 1 }, { opacity: 0 }],
            { duration: 180, fill: "forwards" }
        );

        route.progress.animate(
            [{ opacity: 1 }, { opacity: 0 }],
            { duration: 300, delay: 100, fill: "forwards" }
        );
    }

    /* Animar conector */
    async function animateConnector(connector) {
        await waitUntilPlayable();
        const index = connectors.indexOf(connector);
        const mode = getLayoutMode();

        if (mode === "tablet" && index === 1) {
            await animateTabletBridge(connector);
            return;
        }

        const progress = connector.querySelector(".aad-flow-connector__progress");
        const particle = connector.querySelector(".aad-flow-connector__particle");

        progress.style.opacity = "1";
        particle.style.opacity = "1";

        let progressAnimation;
        let particleAnimation;

        if (mode === "mobile" || mode === "tablet") {
            progressAnimation = progress.animate(
                [{ height: "0%" }, { height: "100%" }],
                {
                    duration: CONNECTOR_DURATION,
                    easing: EASING,
                    fill: "forwards"
                }
            );

            particleAnimation = particle.animate(
                [
                    { top: "0%", opacity: 1 },
                    { top: "100%", opacity: 1 }
                ],
                {
                    duration: CONNECTOR_DURATION,
                    easing: EASING,
                    fill: "forwards"
                }
            );
        } else {
            progressAnimation = progress.animate(
                [{ width: "0%" }, { width: "100%" }],
                {
                    duration: CONNECTOR_DURATION,
                    easing: EASING,
                    fill: "forwards"
                }
            );

            particleAnimation = particle.animate(
                [
                    { left: "0%", opacity: 1 },
                    { left: "100%", opacity: 1 }
                ],
                {
                    duration: CONNECTOR_DURATION,
                    easing: EASING,
                    fill: "forwards"
                }
            );
        }

        await Promise.all([
            progressAnimation.finished.catch(() => {}),
            particleAnimation.finished.catch(() => {})
        ]);

        particle.animate(
            [{ opacity: 1 }, { opacity: 0 }],
            { duration: 180, fill: "forwards" }
        );

        progress.animate(
            [{ opacity: 1 }, { opacity: 0 }],
            { duration: 300, delay: 100, fill: "forwards" }
        );
    }

    /* Secuencia principal */
    async function runFlow() {
        if (running) return;
        running = true;

        while (true) {
            await waitUntilPlayable();
            resetAll();

            await animateNode(nodes[0]);
            await animateConnector(connectors[0]);
            fadeNode(nodes[0]);

            await animateNode(nodes[1]);
            await animateConnector(connectors[1]);
            fadeNode(nodes[1]);

            await animateNode(nodes[2]);
            await animateConnector(connectors[2]);
            fadeNode(nodes[2]);

            await animateNode(nodes[3]);
            await wait(FINAL_HOLD);
            await fadeNode(nodes[3]);
            await wait(LOOP_PAUSE);
        }
    }

    /* Reproducir solo mientras el flow sea visible */
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            inViewport = entry.isIntersecting && entry.intersectionRatio > 0;

            if (inViewport && !started && !reducedMotion.matches) {
                started = true;
                runFlow();
            }

            syncPlayback();
        });
    }, { threshold: [0, 0.15] });

    observer.observe(flow);

    /* También detener trabajo cuando la pestaña queda en segundo plano */
    document.addEventListener("visibilitychange", () => {
        pageVisible = !document.hidden;
        syncPlayback();
    });

    /* Respetar la preferencia del sistema para reducir movimiento */
    const handleReducedMotionChange = () => {
        if (!reducedMotion.matches && inViewport && !started) {
            started = true;
            runFlow();
        }

        syncPlayback();
    };

    if (typeof reducedMotion.addEventListener === "function") {
        reducedMotion.addEventListener("change", handleReducedMotionChange);
    } else {
        reducedMotion.addListener(handleReducedMotionChange);
    }
}
