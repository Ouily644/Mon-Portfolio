// ==================== DARK MODE ==================== 
const themeToggle = document.querySelector('.theme-toggle');
const htmlElement = document.documentElement;

// Charger le thème sauvegardé ou utiliser la préférence système
const savedTheme = localStorage.getItem('theme');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

if (savedTheme) {
    htmlElement.setAttribute('data-theme', savedTheme);
    htmlElement.style.colorScheme = savedTheme;
} else if (prefersDark) {
    htmlElement.setAttribute('data-theme', 'dark');
    htmlElement.style.colorScheme = 'dark';
}

// Toggle du thème
if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        const currentTheme = htmlElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        htmlElement.setAttribute('data-theme', newTheme);
        htmlElement.style.colorScheme = newTheme;
        localStorage.setItem('theme', newTheme);
    });
}

// ==================== HAMBURGER MENU ==================== 
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');
const navLinksItems = document.querySelectorAll('.nav-link');
const navItems = document.querySelectorAll('.nav-item');

if (menuToggle) {
    menuToggle.addEventListener('click', () => {
        menuToggle.classList.toggle('active');
        navLinks.classList.toggle('active');
        navItems.forEach(item => item.classList.remove('active'));
    });

    // Fermer le menu quand on clique sur un lien (sauf ceux avec dropdown sur mobile)
    navLinksItems.forEach(link => {
        link.addEventListener('click', (e) => {
            const parentItem = link.parentElement;
            const hasDropdown = parentItem && parentItem.classList.contains('nav-item') && parentItem.querySelector('.nav-dropdown');

            // Sur mobile, si le lien possède un dropdown, on toggle le dropdown au lieu de naviguer
            if (window.innerWidth <= 768 && hasDropdown) {
                e.preventDefault();
                navItems.forEach(item => {
                    if (item !== parentItem) {
                        item.classList.remove('active');
                    }
                });
                parentItem.classList.toggle('active');
                return;
            }

            // Sinon, on ferme le menu et on laisse le lien naviguer
            menuToggle.classList.remove('active');
            navLinks.classList.remove('active');
            navItems.forEach(item => item.classList.remove('active'));
        });
    });

    // Les liens dans les dropdowns ferment toujours le menu
    document.querySelectorAll('.nav-dropdown a').forEach(link => {
        link.addEventListener('click', () => {
            menuToggle.classList.remove('active');
            navLinks.classList.remove('active');
            // Fermer tous les dropdowns actifs
            navItems.forEach(item => item.classList.remove('active'));
        });
    });

    // Fermer le menu si on clique en dehors
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.nav-container')) {
            menuToggle.classList.remove('active');
            navLinks.classList.remove('active');
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
    if (menuToggle) {
        menuToggle.classList.remove('active');
    }
    if (navLinks) {
        navLinks.classList.remove('active');
    }
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

// Observer les éléments à animer
document.addEventListener('DOMContentLoaded', () => {
    const animatedElements = document.querySelectorAll('.project-card, .content-section, .about-section');
    animatedElements.forEach(el => {
        el.classList.add('reveal');
        observer.observe(el);
    });
});

// ==================== NAVIGATION BAR ON SCROLL ==================== 
// Shadow is handled purely in CSS to keep it consistent.

// ==================== CURSOR EFFECT (OPTIONAL) ==================== 
// Effet de hover subtil sur les cards
const projectCards = document.querySelectorAll('.project-card');

projectCards.forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
    });
});

// ==================== PRELOAD IMAGES ==================== 
// Fonction pour précharger les images quand elles sont ajoutées
function preloadImages() {
    const images = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                imageObserver.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
}

document.addEventListener('DOMContentLoaded', preloadImages);
