// ==================== DARK MODE ==================== 
const themeToggle = document.querySelector('.theme-toggle');
const htmlElement = document.documentElement;
const THEME_KEY = 'theme';

const getSystemTheme = () =>
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

// Charger le thème sauvegardé, sinon conserver celui injecté dans le <head>, sinon fallback système.
const savedTheme = localStorage.getItem(THEME_KEY);
const initialTheme = htmlElement.getAttribute('data-theme') || savedTheme || getSystemTheme();
htmlElement.setAttribute('data-theme', initialTheme);

const syncThemeToggleA11y = () => {
    if (!themeToggle) {
        return;
    }
    const isDark = htmlElement.getAttribute('data-theme') === 'dark';
    themeToggle.setAttribute('aria-pressed', String(isDark));
    themeToggle.setAttribute('aria-label', isDark ? 'Activer le thème clair' : 'Activer le thème sombre');
};

const setTheme = (theme, shouldPersist = true) => {
    if (htmlElement.getAttribute('data-theme') === theme) {
        syncThemeToggleA11y();
        return;
    }

    htmlElement.setAttribute('data-theme', theme);

    if (shouldPersist) {
        localStorage.setItem(THEME_KEY, theme);
    }

    syncThemeToggleA11y();
};

syncThemeToggleA11y();

// Toggle du thème
if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        const currentTheme = htmlElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        setTheme(newTheme, true);
    });
}

// ==================== HAMBURGER MENU ==================== 
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');
const navLinksItems = document.querySelectorAll('.nav-link');
const navItems = document.querySelectorAll('.nav-item');

if (menuToggle && navLinks) {
    if (!navLinks.id) {
        navLinks.id = 'primary-navigation';
    }
    menuToggle.setAttribute('aria-controls', navLinks.id);
    menuToggle.setAttribute('aria-expanded', 'false');
}

const setMenuState = (isOpen) => {
    if (!menuToggle || !navLinks) {
        return;
    }
    menuToggle.classList.toggle('active', isOpen);
    navLinks.classList.toggle('active', isOpen);
    menuToggle.setAttribute('aria-expanded', String(isOpen));
};

if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
        const isOpen = !navLinks.classList.contains('active');
        setMenuState(isOpen);
        navItems.forEach(item => item.classList.remove('active'));
    });

    // Fermer le menu quand on clique sur un lien (sauf ceux avec dropdown sur mobile)
    navLinksItems.forEach(link => {
        link.addEventListener('click', (e) => {
            const parentItem = link.parentElement;
            const hasDropdown = parentItem && parentItem.classList.contains('nav-item') && parentItem.querySelector('.nav-dropdown');

            // Sur mobile, premier tap ouvre le dropdown, second tap navigue normalement.
            if (window.innerWidth <= 768 && hasDropdown) {
                const isOpen = parentItem.classList.contains('active');
                if (!isOpen) {
                    e.preventDefault();
                    navItems.forEach(item => {
                        if (item !== parentItem) {
                            item.classList.remove('active');
                        }
                    });
                    parentItem.classList.add('active');
                    return;
                }
            }

            // Sinon, on ferme le menu et on laisse le lien naviguer
            setMenuState(false);
            navItems.forEach(item => item.classList.remove('active'));
        });
    });

    // Les liens dans les dropdowns ferment toujours le menu
    document.querySelectorAll('.nav-dropdown a').forEach(link => {
        link.addEventListener('click', () => {
            setMenuState(false);
            // Fermer tous les dropdowns actifs
            navItems.forEach(item => item.classList.remove('active'));
        });
    });

    // Fermer le menu si on clique en dehors
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.nav-container')) {
            setMenuState(false);
            navItems.forEach(item => item.classList.remove('active'));
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            setMenuState(false);
            navItems.forEach(item => item.classList.remove('active'));
        }
    });
}


// ==================== RESPONSIVE NAV RESET ==================== 
const mobileBreakpoint = 768;
let wasMobile = window.innerWidth <= mobileBreakpoint;

const disableNavTransitions = () => {
    if (!navLinks) {
        return;
    }
    navLinks.classList.add('no-transition');
    htmlElement.classList.add('no-nav-transitions');
    window.setTimeout(() => {
        navLinks.classList.remove('no-transition');
        htmlElement.classList.remove('no-nav-transitions');
    }, 120);
};

const resetNavState = () => {
    setMenuState(false);
    navItems.forEach(item => item.classList.remove('active'));
};

window.addEventListener('resize', () => {
    const isMobile = window.innerWidth <= mobileBreakpoint;
    if (isMobile !== wasMobile) {
        disableNavTransitions();
        resetNavState();
    }
    wasMobile = isMobile;
});

// ==================== SMOOTH SCROLL ==================== 
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ==================== SCROLL ANIMATIONS ==================== 
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('reveal-visible');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// ==================== PROJECT TAG FILTERS ==================== 
function setupProjectFilters() {
    const filterBar = document.querySelector('.project-filter-bar');
    if (!filterBar) {
        return;
    }

    const projectGrid = document.querySelector('[data-project-grid]');
    if (!projectGrid) {
        return;
    }

    const filterButtons = Array.from(filterBar.querySelectorAll('.project-filter-btn'));
    const allButton = filterBar.querySelector('.project-filter-btn-all');
    const projectCards = Array.from(projectGrid.querySelectorAll('.project-card'));
    const emptyState = document.querySelector('#work .project-filter-empty');
    const activeFilters = new Set();

    const buttonByFilter = new Map(
        filterButtons.map((button) => [(button.dataset.filter || '').toLowerCase(), button])
    );

    projectCards.forEach((card, index) => {
        card.dataset.defaultOrder = String(index);
    });

    const readTags = (value) =>
        value
            .split(',')
            .map((tag) => tag.trim().toLowerCase())
            .filter(Boolean);

    const countMatches = (tags) =>
        tags.reduce((count, tag) => (activeFilters.has(tag) ? count + 1 : count), 0);

    const syncButtons = () => {
        filterButtons.forEach((button) => {
            const key = (button.dataset.filter || '').toLowerCase();
            const isActive = key === 'all' ? activeFilters.size === 0 : activeFilters.has(key);
            button.classList.toggle('active', isActive);
            button.setAttribute('aria-pressed', String(isActive));
        });
    };

    const applyFilter = () => {
        const visibleCards = [];
        const noFilter = activeFilters.size === 0;

        projectCards.forEach((card) => {
            const primaryTags = readTags(card.dataset.primary || '');
            const secondaryTags = readTags(card.dataset.secondary || '');
            const primaryMatches = countMatches(primaryTags);
            const secondaryMatches = countMatches(secondaryTags);
            const isVisible = noFilter || primaryMatches > 0 || secondaryMatches > 0;

            card.classList.toggle('is-filtered-out', !isVisible);
            if (isVisible) {
                visibleCards.push({
                    card,
                    primaryMatches,
                    secondaryMatches,
                    order: Number(card.dataset.defaultOrder || 0),
                });
            }
        });

        visibleCards.sort((a, b) => {
            if (a.primaryMatches !== b.primaryMatches) {
                return b.primaryMatches - a.primaryMatches;
            }
            if (a.secondaryMatches !== b.secondaryMatches) {
                return b.secondaryMatches - a.secondaryMatches;
            }
            return a.order - b.order;
        });

        visibleCards.forEach(({ card }) => projectGrid.appendChild(card));

        if (emptyState) {
            emptyState.hidden = visibleCards.length > 0;
        }

        syncButtons();
    };

    filterButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const key = (button.dataset.filter || '').toLowerCase();
            if (!key || key === 'all') {
                activeFilters.clear();
                applyFilter();
                return;
            }

            if (activeFilters.has(key)) {
                activeFilters.delete(key);
            } else {
                activeFilters.add(key);
            }

            applyFilter();
        });
    });

    const params = new URLSearchParams(window.location.search);
    const initial = params.get('tags') || params.get('tag') || '';
    readTags(initial).forEach((tag) => {
        if (buttonByFilter.has(tag) && tag !== 'all') {
            activeFilters.add(tag);
        }
    });

    if (allButton && activeFilters.size === 0) {
        allButton.classList.add('active');
        allButton.setAttribute('aria-pressed', 'true');
    }

    applyFilter();
}

// Observer les éléments à animer
document.addEventListener('DOMContentLoaded', () => {
    setupProjectFilters();

    const animatedElements = document.querySelectorAll('.project-card, .content-section, .about-section');
    animatedElements.forEach(el => {
        el.classList.add('reveal');
        observer.observe(el);
    });
});

// ==================== NAVIGATION BAR ON SCROLL ==================== 
// Shadow is handled purely in CSS to keep it consistent.
