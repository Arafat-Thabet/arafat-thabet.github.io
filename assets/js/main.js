(function () {
    const storageKey = 'arafat-portfolio-lang';
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let lbOpen = false;
    let lbIndex = 0;
    let lbTrigger = null;
    let spyLockId = '';
    let spyTimer = 0;
    let scrollTicking = false;

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
            const hidden = menu.classList.toggle('hidden');
            toggle.setAttribute('aria-expanded', String(!hidden));
            positionNavIndicator();
        });

        menu.querySelectorAll('a').forEach((link) => {
            link.addEventListener('click', () => {
                if (window.matchMedia('(max-width: 1039px)').matches) {
                    menu.classList.add('hidden');
                    toggle.setAttribute('aria-expanded', 'false');
                }
                if (link.hasAttribute('data-spy')) {
                    spyLockId = link.getAttribute('href').slice(1);
                    window.clearTimeout(spyTimer);
                    spyTimer = window.setTimeout(() => {
                        spyLockId = '';
                    }, 900);
                    setActiveNav(spyLockId);
                }
            });
        });
    }

    function initYear() {
        const yearEl = document.getElementById('year');
        if (yearEl) {
            yearEl.textContent = String(new Date().getFullYear());
        }
    }

    function updateProgress() {
        const bar = document.getElementById('scroll-progress');
        if (!bar) {
            return;
        }
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const progress = max > 0 ? window.scrollY / max : 0;
        bar.style.transform = 'scaleX(' + progress + ')';
    }

    function positionNavIndicator() {
        const menu = document.getElementById('nav-menu');
        if (!menu) {
            return;
        }
        const indicator = menu.querySelector('.nav-indicator');
        const active = menu.querySelector('.nav-link.is-active');
        if (!indicator) {
            return;
        }
        const mobileClosed = menu.classList.contains('hidden') && window.matchMedia('(max-width: 1039px)').matches;
        if (!active || mobileClosed) {
            indicator.style.opacity = '0';
            return;
        }
        const menuRect = menu.getBoundingClientRect();
        const rect = active.getBoundingClientRect();
        indicator.style.opacity = '1';
        indicator.style.width = rect.width + 'px';
        indicator.style.height = rect.height + 'px';
        indicator.style.transform = 'translate(' + (rect.left - menuRect.left - menu.clientLeft) + 'px,' + (rect.top - menuRect.top - menu.clientTop) + 'px)';
    }

    function setActiveNav(id) {
        const links = document.querySelectorAll('#nav-menu a[data-spy]');
        links.forEach((link) => {
            const on = id && link.getAttribute('href') === '#' + id;
            link.classList.toggle('is-active', on);
            if (on) {
                link.setAttribute('aria-current', 'location');
            } else {
                link.removeAttribute('aria-current');
            }
        });
        positionNavIndicator();
    }

    function updateSpy() {
        if (!document.getElementById('nav-menu')) {
            return;
        }
        if (spyLockId) {
            setActiveNav(spyLockId);
            return;
        }
        const ids = ['about', 'skills', 'work', 'experience', 'education', 'contact'];
        let best = '';
        let bestDist = Infinity;
        const scored = [];
        ids.forEach((id) => {
            const el = document.getElementById(id);
            if (!el) {
                return;
            }
            const top = el.getBoundingClientRect().top;
            if (top > window.innerHeight * 0.72) {
                return;
            }
            const dist = Math.abs(top - 110);
            scored.push({ id, dist });
            if (dist < bestDist) {
                bestDist = dist;
                best = id;
            }
        });
        const tied = scored.filter((item) => Math.abs(item.dist - bestDist) < 24).map((item) => item.id);
        if (tied.length > 1) {
            const current = document.querySelector('#nav-menu a[data-spy].is-active');
            const currentId = current ? current.getAttribute('href').slice(1) : '';
            best = tied.indexOf(currentId) !== -1 ? currentId : tied[0];
        }
        setActiveNav(best);
    }

    function updateTimeline() {
        const timeline = document.getElementById('timeline');
        if (!timeline) {
            return;
        }
        const rect = timeline.getBoundingClientRect();
        const mid = window.innerHeight * 0.5;
        const progress = rect.height > 0 ? (mid - rect.top) / rect.height : 0;
        const clamped = Math.min(1, Math.max(0, progress));
        timeline.style.setProperty('--beam', String(clamped));
        const beamPx = clamped * rect.height;
        const stations = [...timeline.querySelectorAll('.tl-station')];
        let closest = null;
        let best = Infinity;
        const inView = rect.bottom > 0 && rect.top < window.innerHeight;
        stations.forEach((station) => {
            const node = station.querySelector('.tl-node');
            if (node) {
                const nodeMid = node.getBoundingClientRect().top - rect.top + node.offsetHeight / 2;
                station.classList.toggle('is-lit', nodeMid <= beamPx + 4);
            }
            const box = station.getBoundingClientRect();
            const center = box.top + box.height / 2;
            const dist = Math.abs(center - mid);
            if (inView && dist < best) {
                best = dist;
                closest = station;
            }
        });
        stations.forEach((station) => {
            station.classList.toggle('is-current-step', station === closest);
        });
        document.querySelectorAll('.year-nav a').forEach((link) => {
            const on = closest && link.getAttribute('href') === '#' + closest.id;
            link.classList.toggle('is-active', Boolean(on));
        });
    }

    function initSpotlight() {
        if (!window.matchMedia('(hover: hover)').matches) {
            return;
        }
        document.querySelectorAll('.spot').forEach((el) => {
            el.addEventListener('pointermove', (event) => {
                const rect = el.getBoundingClientRect();
                if (!rect.width || !rect.height) {
                    return;
                }
                const x = ((event.clientX - rect.left) / rect.width) * 100;
                const y = ((event.clientY - rect.top) / rect.height) * 100;
                el.style.setProperty('--mouse-x', x + '%');
                el.style.setProperty('--mouse-y', y + '%');
            });
        });
    }

    function initTilt() {
        if (!window.matchMedia('(hover: hover)').matches || reduceMotion.matches) {
            return;
        }
        document.querySelectorAll('[data-tilt]').forEach((el) => {
            el.addEventListener('pointermove', (event) => {
                const rect = el.getBoundingClientRect();
                const px = (event.clientX - rect.left) / rect.width;
                const py = (event.clientY - rect.top) / rect.height;
                const rx = (0.5 - py) * 8;
                const ry = (px - 0.5) * 8;
                el.style.transition = 'none';
                el.style.transform = 'perspective(900px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg)';
                el.style.setProperty('--glare-x', (px * 100) + '%');
                el.style.setProperty('--glare-y', (py * 100) + '%');
            });
            el.addEventListener('pointerleave', () => {
                el.style.transition = 'transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)';
                el.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg)';
            });
        });
    }

    function initReveal() {
        const items = document.querySelectorAll('.reveal');
        if (!items.length) {
            return;
        }
        if (reduceMotion.matches || !('IntersectionObserver' in window)) {
            items.forEach((el) => el.classList.add('is-visible'));
            return;
        }
        items.forEach((el) => {
            const siblings = el.parentElement ? [...el.parentElement.querySelectorAll(':scope > .reveal')] : [];
            const index = siblings.indexOf(el);
            if (index > 0) {
                el.style.setProperty('--d', (index * 70) + 'ms');
            }
        });
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) {
                    return;
                }
                entry.target.classList.add('is-visible');
                entry.target.addEventListener('transitionend', () => {
                    entry.target.style.removeProperty('--d');
                }, { once: true });
                observer.unobserve(entry.target);
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
        items.forEach((el) => observer.observe(el));
    }

    function projectCards() {
        return [...document.querySelectorAll('#work-grid .project-card')].filter((card) => !card.hidden);
    }

    function renderLightbox() {
        const cards = projectCards();
        const card = cards[lbIndex];
        const img = document.getElementById('lb-img');
        if (!card || !img) {
            return;
        }
        const source = card.querySelector('img');
        const title = card.querySelector('h3');
        const desc = card.querySelector('.project-desc');
        img.src = source ? source.src : '';
        img.alt = source ? source.alt : '';
        document.getElementById('lb-title').textContent = title ? title.textContent : '';
        document.getElementById('lb-desc').textContent = desc ? desc.textContent : '';
    }

    function closeLightbox() {
        const dialog = document.getElementById('lightbox');
        if (!dialog) {
            return;
        }
        dialog.hidden = true;
        document.body.classList.remove('lb-open');
        lbOpen = false;
        if (lbTrigger && typeof lbTrigger.focus === 'function') {
            lbTrigger.focus();
        }
    }

    function openLightbox(card) {
        const cards = projectCards();
        const index = cards.indexOf(card);
        if (index < 0) {
            return;
        }
        lbIndex = index;
        lbTrigger = document.activeElement;
        lbOpen = true;
        const dialog = document.getElementById('lightbox');
        dialog.hidden = false;
        document.body.classList.add('lb-open');
        renderLightbox();
        const closeBtn = dialog.querySelector('.lb-close');
        if (closeBtn) {
            closeBtn.focus();
        }
    }

    function stepLightbox(delta) {
        const cards = projectCards();
        if (!cards.length) {
            return;
        }
        lbIndex = (lbIndex + delta + cards.length) % cards.length;
        renderLightbox();
    }

    function focusable(root) {
        return [...root.querySelectorAll('button, [href], input, select, textarea')].filter((el) => !el.disabled && !el.hidden && el.tabIndex >= 0);
    }

    function onLightboxKey(event) {
        if (!lbOpen) {
            return;
        }
        const dialog = document.getElementById('lightbox');
        if (event.key === 'Escape') {
            event.preventDefault();
            closeLightbox();
            return;
        }
        if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
            event.preventDefault();
            const rtl = document.documentElement.dir === 'rtl';
            const forward = rtl ? event.key === 'ArrowLeft' : event.key === 'ArrowRight';
            stepLightbox(forward ? 1 : -1);
            return;
        }
        if (event.key !== 'Tab' || !dialog) {
            return;
        }
        const nodes = focusable(dialog);
        if (!nodes.length) {
            return;
        }
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    }

    function hideCard(card) {
        card.classList.remove('is-shown');
        if (reduceMotion.matches) {
            card.hidden = true;
            return;
        }
        const finish = (event) => {
            if (event && event.target && (event.target !== card || event.propertyName !== 'opacity')) {
                return;
            }
            card.removeEventListener('transitionend', finish);
            if (!card.classList.contains('is-shown')) {
                card.hidden = true;
            }
        };
        card.addEventListener('transitionend', finish);
        window.setTimeout(finish, 420);
    }

    function showCard(card) {
        card.hidden = false;
        if (reduceMotion.matches) {
            card.classList.add('is-shown');
            return;
        }
        requestAnimationFrame(() => {
            card.classList.add('is-shown');
        });
    }

    function initFilters() {
        const buttons = [...document.querySelectorAll('[data-filter]')];
        const cards = [...document.querySelectorAll('#work-grid .project-card')];
        if (!buttons.length || !cards.length) {
            return;
        }

        function apply(key) {
            if (lbOpen) {
                closeLightbox();
            }
            buttons.forEach((btn) => {
                const on = btn.dataset.filter === key;
                btn.setAttribute('aria-selected', on ? 'true' : 'false');
                btn.tabIndex = on ? 0 : -1;
            });
            cards.forEach((card) => {
                const show = key === 'all' || card.dataset.category === key;
                if (show) {
                    showCard(card);
                } else {
                    hideCard(card);
                }
            });
        }

        buttons.forEach((btn, index) => {
            btn.addEventListener('click', () => apply(btn.dataset.filter));
            btn.addEventListener('keydown', (event) => {
                const rtl = document.documentElement.dir === 'rtl';
                const nextKey = rtl ? 'ArrowLeft' : 'ArrowRight';
                const prevKey = rtl ? 'ArrowRight' : 'ArrowLeft';
                let next = index;
                if (event.key === 'Home') next = 0;
                else if (event.key === 'End') next = buttons.length - 1;
                else if (event.key === nextKey) next = (index + 1) % buttons.length;
                else if (event.key === prevKey) next = (index - 1 + buttons.length) % buttons.length;
                else return;
                event.preventDefault();
                buttons[next].focus();
                apply(buttons[next].dataset.filter);
            });
        });
    }

    function initLightbox() {
        const dialog = document.getElementById('lightbox');
        if (!dialog) {
            return;
        }
        document.querySelectorAll('#work-grid .project-card').forEach((card) => {
            card.addEventListener('click', (event) => {
                if (event.target.closest('a')) {
                    return;
                }
                openLightbox(card);
            });
        });
        dialog.addEventListener('click', (event) => {
            if (event.target === dialog || event.target.closest('[data-lb-close]')) {
                closeLightbox();
            }
        });
        const prev = dialog.querySelector('.lb-prev');
        const next = dialog.querySelector('.lb-next');
        if (prev) prev.addEventListener('click', () => stepLightbox(-1));
        if (next) next.addEventListener('click', () => stepLightbox(1));
        document.addEventListener('keydown', onLightboxKey);
    }

    function initYearNav() {
        const links = document.querySelectorAll('.year-nav a');
        links.forEach((link) => {
            link.addEventListener('click', () => {
                const id = link.getAttribute('href').slice(1);
                const el = document.getElementById(id);
                document.querySelectorAll('.tl-station').forEach((station) => {
                    station.classList.toggle('is-year-focus', station === el);
                });
                window.setTimeout(() => {
                    if (!el) {
                        return;
                    }
                    el.focus({ preventScroll: true });
                    window.setTimeout(() => el.classList.remove('is-year-focus'), 1600);
                }, reduceMotion.matches ? 0 : 450);
            });
        });
    }

    function initCopyEmail() {
        const button = document.getElementById('copy-email');
        const toast = document.getElementById('toast');
        if (!button || !toast) {
            return;
        }
        let timer = 0;
        button.addEventListener('click', async () => {
            const email = 'arafat.733011506@gmail.com';
            try {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(email);
                } else {
                    throw new Error('clipboard unavailable');
                }
            } catch (error) {
                const area = document.createElement('textarea');
                area.value = email;
                area.setAttribute('readonly', '');
                area.style.position = 'fixed';
                area.style.insetInlineStart = '-999px';
                document.body.appendChild(area);
                area.select();
                document.execCommand('copy');
                area.remove();
            }
            const lang = document.documentElement.lang === 'ar' ? 'ar' : 'en';
            toast.textContent = window.PortfolioI18n.translations[lang].copied;
            toast.hidden = false;
            window.clearTimeout(timer);
            timer = window.setTimeout(() => {
                toast.hidden = true;
            }, 2200);
        });
    }

    function onLangChange() {
        requestAnimationFrame(() => {
            positionNavIndicator();
            updateTimeline();
            if (lbOpen) {
                renderLightbox();
            }
            const toast = document.getElementById('toast');
            if (toast && !toast.hidden && window.PortfolioI18n) {
                const lang = document.documentElement.lang === 'ar' ? 'ar' : 'en';
                toast.textContent = window.PortfolioI18n.translations[lang].copied;
            }
        });
    }

    function onScroll() {
        if (scrollTicking) {
            return;
        }
        scrollTicking = true;
        requestAnimationFrame(() => {
            updateProgress();
            updateTimeline();
            updateSpy();
            scrollTicking = false;
        });
    }

    setLang(getPreferredLang());
    initLangToggle();
    initMobileNav();
    initYear();
    initSpotlight();
    initTilt();
    initReveal();
    initFilters();
    initLightbox();
    initYearNav();
    initCopyEmail();
    document.addEventListener('portfolio:lang', onLangChange);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', () => {
        positionNavIndicator();
        updateTimeline();
    });
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => {
            positionNavIndicator();
        });
    }
    updateProgress();
    updateTimeline();
    updateSpy();
})();
