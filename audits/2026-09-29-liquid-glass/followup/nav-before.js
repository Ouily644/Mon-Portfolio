(() => {
    'use strict';

    // Réglages visuels de la navigation : modifier ici, puis recharger la page.
    const GLASS_SETTINGS = {
        resolution: 1.5,
        refraction: 0.015,
        bevelDepth: 0.04,
        bevelWidth: 0.12,
        frost: 1.4,
        specular: false,
        lightTint: 'rgba(255, 250, 245, 0.08)',
        darkTint: 'rgba(20, 22, 30, 0.18)',
    };

    // Essai des sous-menus : enabled: false ou ?dropdown-glass=off pour revenir au CSS.
    const DROPDOWN_GLASS_SETTINGS = {
        enabled: true,
        openDelayMs: 0,
        refraction: 0.012,
        bevelDepth: 0.035,
        bevelWidth: 0.1,
        frost: 2,
        specular: false,
    };

    // Panneau mobile : enabled: false ou ?mobile-glass=off pour comparer.
    const MOBILE_GLASS_SETTINGS = {
        enabled: true,
        openDelayMs: 0,
        refraction: 0.012,
        bevelDepth: 0.035,
        bevelWidth: 0.1,
        frost: 2,
        specular: false,
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

    const mobile = matchMedia('(max-width: 768px)');
    const mobilePanel = nav.querySelector('.nav-links');
    const dropdowns = [mobilePanel, ...nav.querySelectorAll('.nav-dropdown')].filter(Boolean).map((panel, index) => {
        const isMobilePanel = panel === mobilePanel;
        const decoration = document.createElement('div');
        decoration.className = isMobilePanel ? 'mobile-menu-glass' : 'dropdown-glass';
        decoration.id = `dropdown-glass-${index}`;
        decoration.setAttribute('aria-hidden', 'true');
        panel.prepend(decoration);
        return { panel, decoration, isMobilePanel,
            settings: isMobilePanel ? MOBILE_GLASS_SETTINGS : DROPDOWN_GLASS_SETTINGS,
            query: isMobilePanel ? 'mobile-glass' : 'dropdown-glass',
            item: panel.parentElement, lens: null, timer: null, timeout: null, generation: 0, failed: false };
    });
    const closeDropdown = (entry) => {
        entry.generation++;
        clearTimeout(entry.timer);
        clearTimeout(entry.timeout);
        entry.timer = null;
        delete entry.panel.dataset.glass;
        entry.lens?.destroy();
        entry.lens = null;
        mobilePanel.querySelectorAll('.mobile-glass-viewport:empty').forEach(viewport => viewport.remove());
    };
    const stopDropdowns = () => dropdowns.forEach(closeDropdown);
    const dropdownOpen = ({ item, isMobilePanel }) => {
        if (isMobilePanel) return mobile.matches && mobilePanel.classList.contains('active');
        return mobile.matches
            ? mobilePanel.classList.contains('active') && item.classList.contains('active')
            : item.matches(':hover, :focus-within');
    };
    const syncDropdowns = () => {
        const enabled = nav.dataset.glass === 'ready' && !disabled();
        dropdowns.forEach((entry) => {
            if (!enabled || !entry.settings.enabled || new URLSearchParams(location.search).get(entry.query) === 'off' ||
                entry.failed || !dropdownOpen(entry)) return closeDropdown(entry);
            if (entry.lens || entry.timer) return;
            // Délai réglable avant d'activer le verre à l'ouverture du menu.
            entry.timer = setTimeout(() => {
                entry.timer = null;
                if (disabled() || nav.dataset.glass !== 'ready' || !dropdownOpen(entry)) return;
                const run = ++entry.generation;
                const fallbackDropdown = () => {
                    if (run !== entry.generation) return;
                    entry.failed = true;
                    closeDropdown(entry);
                };
                try {
                    entry.lens = window.liquidGL({
                        ...entry.settings,
                        target: `#${entry.decoration.id}`,
                        snapshot: 'body',
                        resolution: 1,
                        content: false,
                        // Sur ordinateur, partager le renderer de la barre de navigation.
                        zIndex: mobile.matches ? 901 : 1001,
                        engine: 'auto',
                        tint: tint(),
                        shadow: false,
                        tilt: false,
                        interaction: 'none',
                        reveal: 'none',
                        on: { init() {
                            if (run !== entry.generation) return;
                            clearTimeout(entry.timeout);
                            entry.panel.dataset.glass = 'ready';
                        } },
                    });
                    if (!entry.lens?.renderer) return fallbackDropdown();
                    entry.lens.renderer.canvas.setAttribute('aria-hidden', 'true');
                    // Le canvas a la taille de l'écran : le contenir évite une zone
                    // de défilement vide au-dessous des liens du menu mobile.
                    const canvas = entry.lens.renderer.canvas;
                    if (mobile.matches && !canvas.parentElement.classList.contains('mobile-glass-viewport')) {
                        const viewport = document.createElement('div');
                        viewport.className = 'mobile-glass-viewport';
                        viewport.setAttribute('aria-hidden', 'true');
                        viewport.setAttribute('data-liquid-ignore', '');
                        mobilePanel.prepend(viewport);
                        viewport.append(canvas);
                    }
                    if (entry.lens.renderer !== lens.renderer) {
                        entry.lens.renderer.canvas.addEventListener('webglcontextlost', fallbackDropdown, { once: true });
                    }
                    entry.timeout = setTimeout(() => {
                        if (entry.panel.dataset.glass !== 'ready') fallbackDropdown();
                    }, 8000);
                } catch {
                    fallbackDropdown();
                }
            }, entry.settings.openDelayMs);
        });
    };
    dropdowns.filter(entry => !entry.isMobilePanel).forEach(({ item }) => {
        item.addEventListener('mouseenter', syncDropdowns);
        item.addEventListener('mouseleave', syncDropdowns);
        item.addEventListener('focusin', syncDropdowns);
        item.addEventListener('focusout', () => queueMicrotask(syncDropdowns));
    });
    new MutationObserver(syncDropdowns).observe(nav.querySelector('.nav-links'), {
        subtree: true, attributes: true, attributeFilter: ['class'],
    });
    // Garder le fond aligné sur la zone visible lorsque le menu défile.
    mobilePanel.addEventListener('scroll', () => {
        mobilePanel.style.setProperty('--mobile-menu-scroll', `${mobilePanel.scrollTop}px`);
    }, { passive: true });
    mobile.addEventListener('change', () => {
        stopDropdowns();
        syncDropdowns();
    });

    const stop = () => {
        generation++;
        clearTimeout(refreshTimer);
        clearTimeout(startupTimer);
        delete nav.dataset.glass;
        stopDropdowns();
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
                const renderers = new Set([renderer, ...dropdowns.map(entry => entry.lens?.renderer).filter(Boolean)]);
                await Promise.all(Array.from(renderers, current => current.captureSnapshot()));
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
                        syncDropdowns();
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
        dropdowns.forEach(entry => entry.lens?.setTint(tint()));
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
