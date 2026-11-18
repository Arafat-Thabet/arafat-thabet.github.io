(function () {
    const storageKey = 'arafat-portfolio-lang';

    function getPreferredLang() {
        const saved = localStorage.getItem(storageKey);
        if (saved === 'en' || saved === 'ar') {
            return saved;
        }

        return 'en';
    }

    function setLang(lang) {
        localStorage.setItem(storageKey, lang);
        if (window.PortfolioI18n) {
            window.PortfolioI18n.applyTranslations(lang);
        }
    }

    function initLangToggle() {
        const btn = document.getElementById('lang-toggle');
        if (!btn) {
            return;
        }

        btn.addEventListener('click', () => {
            const current = document.documentElement.lang === 'ar' ? 'ar' : 'en';
            setLang(current === 'ar' ? 'en' : 'ar');
        });
    }

    function initMobileNav() {
        const toggle = document.getElementById('nav-toggle');
        const menu = document.getElementById('nav-menu');
        if (!toggle || !menu) {
            return;
        }

        toggle.addEventListener('click', () => {
            const open = menu.classList.toggle('hidden');
            toggle.setAttribute('aria-expanded', String(!open));
        });

        menu.querySelectorAll('a').forEach((link) => {
            link.addEventListener('click', () => {
                menu.classList.add('hidden');
                toggle.setAttribute('aria-expanded', 'false');
            });
        });
    }

    function initYear() {
        const yearEl = document.getElementById('year');
        if (yearEl) {
            yearEl.textContent = String(new Date().getFullYear());
        }
    }

    setLang(getPreferredLang());
    initLangToggle();
    initMobileNav();
    initYear();
})();