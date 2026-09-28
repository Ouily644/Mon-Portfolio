(() => {
    'use strict';

    // Réglages visuels de la navigation : modifier ici, puis recharger la page.
    const GLASS_SETTINGS = {
        resolution: 4,
        refraction: 0.015,
        bevelDepth: 0.04,
        bevelWidth: 0.12,
        frost: 1,
        specular: true,
        lightTint: 'rgba(255, 250, 245, 0.08)',
        darkTint: 'rgba(20, 22, 30, 0.18)',
    };

    const nav = document.querySelector('.nav');
    if (!nav || new URLSearchParams(location.search).get('glass') === 'off') return;

    const libraryUrl = new URL('assets/vendor/liquidgl/liquidGL.js', document.currentScript.src);
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    const reducedTransparency = matchMedia('(prefers-reduced-transparency: reduce)');
    let libraryPromise;
    let lens;
    let generation = 0;
    let refreshTimer;
    let startupTimer;
    let failed = false;
    const surface = document.createElement('div');
    surface.className = 'nav-glass';
    surface.setAttribute('aria-hidden', 'true');
    nav.setAttribute('data-liquid-ignore', '');
    nav.prepend(surface);

    const tint = () => document.documentElement.dataset.theme === 'dark'
        ? GLASS_SETTINGS.darkTint : GLASS_SETTINGS.lightTint;
    const disabled = () => failed || reducedMotion.matches || reducedTransparency.matches || navigator.connection?.saveData;

    const stop = () => {
        generation++;
        clearTimeout(refreshTimer);
        clearTimeout(startupTimer);
        delete nav.dataset.glass;
        lens?.destroy();
        lens = undefined;
    };

    const fallback = () => {
        failed = true;
        stop();
    };

    const loadLibrary = () => {
        if (!libraryPromise) {
            libraryPromise = new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = libraryUrl.href;
                script.onload = resolve;
                script.onerror = reject;
                document.head.append(script);
            });
        }
        return libraryPromise;
    };

    // API du renderer vérifiée sur la version vendue (voir assets/vendor/liquidgl/README.md).
    // Une capture après un changement de thème, d'image ou de filtre évite un fond périmé.
    const refresh = () => {
        clearTimeout(refreshTimer);
        refreshTimer = setTimeout(async () => {
            const renderer = lens?.renderer;
            if (!renderer || disabled()) return;
            try {
                await renderer.captureSnapshot();
            } catch {
                fallback();
            }
        }, 300);
    };

    const start = async () => {
        if (disabled() || lens) return;
        const run = ++generation;
        try {
            await loadLibrary();
            if (run !== generation || disabled()) return;
            lens = window.liquidGL({
                target: '.nav-glass',
                snapshot: 'body',
                content: false,
                zIndex: 1001,
                engine: 'auto',
                resolution: GLASS_SETTINGS.resolution,
                refraction: GLASS_SETTINGS.refraction,
                bevelDepth: GLASS_SETTINGS.bevelDepth,
                bevelWidth: GLASS_SETTINGS.bevelWidth,
                frost: GLASS_SETTINGS.frost,
                specular: GLASS_SETTINGS.specular,
                tint: tint(),
                shadow: false,
                tilt: false,
                interaction: 'none',
                reveal: 'none',
                on: {
                    init() {
                        if (run !== generation) return;
                        clearTimeout(startupTimer);
                        nav.dataset.glass = 'ready';
                    },
                },
            });
            if (!lens?.renderer) {
                fallback();
                return;
            }
            lens.renderer.canvas.setAttribute('aria-hidden', 'true');
            lens.renderer.canvas.addEventListener('webglcontextlost', fallback, { once: true });
            window.liquidGL.registerDynamic('.reveal, .fade-in, .fade-in-delay');
            startupTimer = setTimeout(() => {
                if (nav.dataset.glass !== 'ready') fallback();
            }, 8000);
        } catch {
            fallback();
        }
    };

    const preferencesChanged = () => disabled() ? stop() : void start();
    reducedMotion.addEventListener('change', preferencesChanged);
    reducedTransparency.addEventListener('change', preferencesChanged);

    new MutationObserver(() => {
        lens?.setTint(tint());
        refresh();
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    const grid = document.querySelector('[data-project-grid]');
    if (grid) new MutationObserver(refresh).observe(grid, { childList: true });
    document.addEventListener('load', (event) => {
        if (event.target instanceof HTMLImageElement) refresh();
    }, true);
    window.addEventListener('pagehide', stop);
    window.addEventListener('pageshow', (event) => {
        if (event.persisted) void start();
    });

    const scheduleStart = () => {
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => void start(), { timeout: 1500 });
        } else {
            setTimeout(() => void start(), 100);
        }
    };
    if (document.readyState === 'complete') scheduleStart();
    else window.addEventListener('load', scheduleStart, { once: true });
})();
