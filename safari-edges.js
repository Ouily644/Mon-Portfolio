(() => {
    'use strict';

    // Essai mobile : background (défaut), cover, ou off pour retrouver l'original.
    // Chargé dans le head pour appliquer le viewport avant la mise en page.
    const DEFAULT_MODE = 'background';
    const requested = new URLSearchParams(location.search).get('edges');
    const mode = ['background', 'cover', 'off'].includes(requested) ? requested : DEFAULT_MODE;
    if (mode !== 'off') document.documentElement.dataset.safariEdges = mode;
    if (mode === 'cover') {
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) viewport.content += ', viewport-fit=cover';
    }

    // Conserver un mode de comparaison explicite dans les liens internes,
    // y compris ceux que les filtres ou le choix de langue mettent à jour.
    if (!['background', 'cover', 'off'].includes(requested)) return;
    const siteRoot = new URL('.', document.currentScript.src).pathname;
    const carryMode = (link) => {
        const href = link.getAttribute('href');
        if (!href || href.startsWith('#') || link.hasAttribute('download')) return;
        const url = new URL(href, location.href);
        if (url.origin !== location.origin || !url.pathname.startsWith(siteRoot) || !url.pathname.endsWith('.html')) return;
        url.searchParams.set('edges', mode);
        if (link.href !== url.href) link.href = url.href;
    };
    document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('a[href]').forEach(carryMode);
        new MutationObserver((records) => {
            records.forEach(({ target }) => carryMode(target));
        }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['href'] });
    });
})();
