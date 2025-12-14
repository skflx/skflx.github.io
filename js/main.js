// main.js - Dynamic color extraction and site functionality

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all functionality
    initTheme();
    initMobileMenu();
    initScrollAnimations();
    initTabs();
    initSmoothScroll();
    initActiveNav();
    updateResidencyStatus();

    // Extract colors from hero image
    const heroImage = document.querySelector('.hero-image');
    if (heroImage) {
        if (heroImage.complete) {
            extractColorsFromImage(heroImage);
        } else {
            heroImage.addEventListener('load', () => extractColorsFromImage(heroImage));
        }
    }
});

// ===== DYNAMIC COLOR EXTRACTION =====
function extractColorsFromImage(img) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Use a smaller size for faster processing
    const sampleSize = 100;
    canvas.width = sampleSize;
    canvas.height = sampleSize;

    try {
        ctx.drawImage(img, 0, 0, sampleSize, sampleSize);
        const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize);
        const pixels = imageData.data;

        // Extract dominant colors using color quantization
        const colors = extractDominantColors(pixels, 5);

        if (colors.length >= 3) {
            // Convert to matte (desaturated) versions
            const matteColors = colors.map(color => toMatteColor(color));

            // Apply colors to CSS variables
            applyDynamicColors(matteColors);
        }

        document.body.classList.add('color-loaded');
        document.body.classList.remove('color-loading');
    } catch (e) {
        // CORS or other error - use fallback colors
        console.log('Using fallback colors');
        document.body.classList.add('color-loaded');
    }
}

function extractDominantColors(pixels, numColors) {
    const colorCounts = {};

    // Sample every 4th pixel for performance
    for (let i = 0; i < pixels.length; i += 16) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const a = pixels[i + 3];

        if (a < 128) continue; // Skip transparent pixels

        // Quantize to reduce color space
        const qr = Math.round(r / 32) * 32;
        const qg = Math.round(g / 32) * 32;
        const qb = Math.round(b / 32) * 32;

        const key = `${qr},${qg},${qb}`;
        colorCounts[key] = (colorCounts[key] || 0) + 1;
    }

    // Sort by frequency and get top colors
    const sortedColors = Object.entries(colorCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, numColors * 3) // Get more candidates
        .map(([key]) => {
            const [r, g, b] = key.split(',').map(Number);
            return { r, g, b };
        });

    // Filter out colors that are too similar, too dark, or too light
    const distinctColors = [];
    for (const color of sortedColors) {
        const brightness = (color.r * 299 + color.g * 587 + color.b * 114) / 1000;

        // Skip very dark or very light colors
        if (brightness < 30 || brightness > 230) continue;

        // Check if color is distinct from already selected colors
        const isDistinct = distinctColors.every(existing => {
            const distance = Math.sqrt(
                Math.pow(color.r - existing.r, 2) +
                Math.pow(color.g - existing.g, 2) +
                Math.pow(color.b - existing.b, 2)
            );
            return distance > 50;
        });

        if (isDistinct) {
            distinctColors.push(color);
            if (distinctColors.length >= numColors) break;
        }
    }

    // If we don't have enough colors, add some variations
    while (distinctColors.length < numColors && distinctColors.length > 0) {
        const base = distinctColors[0];
        distinctColors.push({
            r: Math.min(255, base.r + 30),
            g: Math.min(255, base.g + 30),
            b: Math.min(255, base.b + 30)
        });
    }

    return distinctColors;
}

function toMatteColor(color) {
    // Convert to HSL
    const r = color.r / 255;
    const g = color.g / 255;
    const b = color.b / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }

    // Reduce saturation for matte effect (40-60% of original)
    s = s * 0.5;

    // Adjust lightness to be in a good range for UI
    l = Math.max(0.35, Math.min(0.65, l));

    // Convert back to RGB
    return hslToRgb(h, s, l);
}

function hslToRgb(h, s, l) {
    let r, g, b;

    if (s === 0) {
        r = g = b = l;
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    };
}

function rgbToHex(color) {
    return '#' + [color.r, color.g, color.b]
        .map(x => x.toString(16).padStart(2, '0'))
        .join('');
}

function applyDynamicColors(colors) {
    const root = document.documentElement;

    if (colors[0]) {
        root.style.setProperty('--color-primary', rgbToHex(colors[0]));
        root.style.setProperty('--color-primary-matte', rgbToHex(lightenColor(colors[0], 10)));
    }

    if (colors[1]) {
        root.style.setProperty('--color-secondary', rgbToHex(colors[1]));
        root.style.setProperty('--color-secondary-matte', rgbToHex(lightenColor(colors[1], 10)));
    }

    if (colors[2]) {
        root.style.setProperty('--color-accent', rgbToHex(colors[2]));
        root.style.setProperty('--color-accent-matte', rgbToHex(lightenColor(colors[2], 10)));
    }

    // Store colors for persistence
    localStorage.setItem('sk_dynamic_colors', JSON.stringify(colors.map(rgbToHex)));
}

function lightenColor(color, percent) {
    return {
        r: Math.min(255, Math.round(color.r + (255 - color.r) * (percent / 100))),
        g: Math.min(255, Math.round(color.g + (255 - color.g) * (percent / 100))),
        b: Math.min(255, Math.round(color.b + (255 - color.b) * (percent / 100)))
    };
}

// ===== DARK MODE =====
function initTheme() {
    const themeToggle = document.querySelector('.theme-toggle');
    if (!themeToggle) return;

    // Check for saved theme preference or system preference
    const savedTheme = localStorage.getItem('sk_theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
    }

    themeToggle.addEventListener('click', toggleTheme);

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('sk_theme')) {
            document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
        }
    });
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('sk_theme', newTheme);
}

// ===== MOBILE MENU =====
function initMobileMenu() {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');

    if (!mobileMenuBtn || !navLinks) return;

    mobileMenuBtn.addEventListener('click', () => {
        navLinks.classList.toggle('active');

        // Toggle icon
        const icon = mobileMenuBtn.querySelector('svg');
        if (icon) {
            const isOpen = navLinks.classList.contains('active');
            icon.innerHTML = isOpen
                ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>'
                : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>';
        }
    });

    // Close menu when clicking on a link
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
        });
    });
}

// ===== SCROLL ANIMATIONS =====
function initScrollAnimations() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
        document.querySelectorAll('.reveal').forEach(el => {
            el.classList.add('revealed');
        });
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    document.querySelectorAll('.reveal').forEach(el => {
        observer.observe(el);
    });
}

// ===== TABS =====
function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    if (tabButtons.length === 0) return;

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');

            // Update buttons
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // Update content
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === targetTab) {
                    content.classList.add('active');
                }
            });
        });
    });

    // Activate first tab by default
    if (!document.querySelector('.tab-btn.active')) {
        tabButtons[0]?.classList.add('active');
        tabContents[0]?.classList.add('active');
    }
}

// ===== SMOOTH SCROLL =====
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#') return;

            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                const headerHeight = document.querySelector('.header')?.offsetHeight || 0;
                const targetPosition = target.offsetTop - headerHeight - 20;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// ===== ACTIVE NAV =====
function initActiveNav() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    document.querySelectorAll('.nav-links a').forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage || (currentPage === '' && href === 'index.html')) {
            link.classList.add('active');
        }
    });
}

// ===== RESIDENCY STATUS =====
function updateResidencyStatus() {
    const statusElement = document.getElementById('pgy-status');
    if (!statusElement) return;

    const startDate = new Date('2024-07-01');
    const now = new Date();

    let yearDiff = now.getFullYear() - startDate.getFullYear();
    let pgyLevel = yearDiff + 1;

    // If we haven't reached July yet in the current year
    if (now.getMonth() < 6) {
        pgyLevel--;
    }

    if (pgyLevel < 1) pgyLevel = 1;

    statusElement.textContent = `PGY-${pgyLevel}`;
}

// ===== CONTACT FORM =====
function initContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Sending...';
        submitBtn.disabled = true;

        try {
            const formData = new FormData(form);
            const response = await fetch(form.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                // Show success message
                const successEl = document.querySelector('.form-success');
                if (successEl) {
                    successEl.classList.add('show');
                    form.style.display = 'none';
                }
            } else {
                throw new Error('Form submission failed');
            }
        } catch (error) {
            alert('There was an error sending your message. Please try again or use the social links to contact me.');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });
}

// Initialize contact form if on contact page
if (document.getElementById('contact-form')) {
    initContactForm();
}
