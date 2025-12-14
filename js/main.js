// main.js - JS functionality for SK's personal website

document.addEventListener('DOMContentLoaded', function() {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Mobile Navigation Toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', function() {
            navLinks.classList.toggle('active');
        });
    }

    // Residency Status Update
    updateResidencyStatus();

    // Initialize scroll-triggered card animations
    if (!prefersReducedMotion) {
        initScrollAnimations();
    } else {
        // Immediately reveal all cards if user prefers reduced motion
        document.querySelectorAll('.project-card, .interest-card, .tech-card, .contact-card, .research-item, .art-item, .music-project').forEach(card => {
            card.classList.add('card-revealed');
        });
    }

    // Project Tabs Functionality
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    if (tabButtons.length > 0) {
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.getAttribute('data-tab');

                // Update active tab button
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                // Crossfade: fade out current, then fade in target
                const currentActive = document.querySelector('.tab-content.active');

                if (currentActive) {
                    currentActive.style.animation = 'tabFadeOut 0.2s ease forwards';
                    setTimeout(() => {
                        currentActive.classList.remove('active');
                        currentActive.style.animation = '';

                        // Show target tab content
                        const targetContent = document.getElementById(targetTab);
                        if (targetContent) {
                            targetContent.classList.add('active');
                        }
                    }, 200);
                } else {
                    // No current active, just show the target
                    const targetContent = document.getElementById(targetTab);
                    if (targetContent) {
                        targetContent.classList.add('active');
                    }
                }
            });
        });
        
        // Set first tab as active by default if none are active
        const hasActive = Array.from(tabButtons).some(btn => btn.classList.contains('active'));
        if (!hasActive && tabButtons[0] && tabContents[0]) {
            tabButtons[0].classList.add('active');
            tabContents[0].classList.add('active');
        }
    }
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 100,
                    behavior: 'smooth'
                });
                
                // Close mobile menu if open
                if (navLinks.classList.contains('active')) {
                    navLinks.classList.remove('active');
                }
            }
        });
    });
    
    // Theme Switcher Logic
    initThemeSwitcher();

    // Active Navigation State
    highlightActiveLink();
});

// Highlight the current page in the navigation
function highlightActiveLink() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-links a');

    navLinks.forEach(link => {
        const linkPage = link.getAttribute('href');
        if (linkPage === currentPage) {
            link.classList.add('active');
        }
    });
}

// Scroll-triggered animations using Intersection Observer
function initScrollAnimations() {
    const cards = document.querySelectorAll('.project-card, .interest-card, .tech-card, .contact-card, .research-item, .art-item, .music-project, .project-detail, .clinical-content');

    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                // Stagger the animation with a delay
                setTimeout(() => {
                    entry.target.classList.add('card-revealed');
                }, index * 100); // 100ms delay between each card

                // Stop observing once revealed
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    cards.forEach(card => observer.observe(card));
}

function initThemeSwitcher() {
    const toggle = document.getElementById('themeToggle');
    const panel = document.getElementById('themePanel');
    const themeBtns = document.querySelectorAll('.theme-btn');
    const typeBtns = document.querySelectorAll('.type-btn');

    if (!toggle || !panel) return;

    // TODO: Check if first visit and add pulse animation to toggle
    // if (!localStorage.getItem('sk_visited')) {
    //     toggle.classList.add('first-visit');
    //     localStorage.setItem('sk_visited', 'true');
    // }

    // Toggle Panel
    toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        panel.classList.toggle('active');

        // TODO: Morph icon from bars to X when panel opens
        // TODO: Add sequential fade-in for menu items when opening
    });

    // Close panel when clicking outside
    document.addEventListener('click', (e) => {
        if (!panel.contains(e.target) && !toggle.contains(e.target)) {
            panel.classList.remove('active');
        }
    });

    // Load Saved Preference
    const savedTheme = localStorage.getItem('sk_theme') || 'theme-slate';
    const savedType = localStorage.getItem('sk_type') || 'type-minimal';

    applyTheme(savedTheme);
    applyType(savedType);

    // Theme Buttons
    themeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const theme = btn.getAttribute('data-theme');
            applyTheme(theme);
            localStorage.setItem('sk_theme', theme);
        });
    });

    // Type Buttons
    typeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.getAttribute('data-type');
            applyType(type);
            localStorage.setItem('sk_type', type);
        });
    });

    function applyTheme(themeClass) {
        // Dynamically remove all theme classes
        const allThemes = Array.from(themeBtns).map(btn => btn.getAttribute('data-theme'));
        document.body.classList.remove(...allThemes);

        // Add the new theme
        document.body.classList.add(themeClass);

        // Update active state in UI
        themeBtns.forEach(btn => {
            if (btn.getAttribute('data-theme') === themeClass) {
                btn.classList.add('selected');
            } else {
                btn.classList.remove('selected');
            }
        });
    }

    function applyType(typeClass) {
        // Remove all type classes
        document.body.classList.remove('type-modern', 'type-editorial', 'type-minimal');
        document.body.classList.add(typeClass);

        // Update active state in UI
        typeBtns.forEach(btn => {
            if (btn.getAttribute('data-type') === typeClass) {
                btn.classList.add('selected');
            } else {
                btn.classList.remove('selected');
            }
        });
    }
}

function updateResidencyStatus() {
    const statusElement = document.getElementById('pgy-status');
    if (!statusElement) return;

    const startDate = new Date('2024-07-01');
    const now = new Date();

    // Calculate the difference in years
    let yearDiff = now.getFullYear() - startDate.getFullYear();

    // If we haven't reached July yet in the current year, subtract 1 from the difference
    // However, since "PGY-1" corresponds to year difference of 0 (2024-2024),
    // we actually want PGY-1 when diff is 0.
    // If now is May 2025, diff is 1. But we are still in PGY-1.
    // If now is July 2025, diff is 1. We are PGY-2.

    // Logic:
    // PGY Level = (Current Year - Start Year) + 1
    // IF (Current Month < July), Subtract 1.

    let pgyLevel = yearDiff + 1;
    if (now.getMonth() < 6) { // Month is 0-indexed. 6 is July.
        pgyLevel--;
    }

    // Safety check for pre-residency
    if (pgyLevel < 1) pgyLevel = 1;

    statusElement.textContent = `PGY-${pgyLevel}`;
}

// ===== FUTURE ENHANCEMENT FUNCTIONS =====

// TODO: Implement smart header (hide on scroll down, show on scroll up)
/*
function initSmartHeader() {
    const header = document.querySelector('header');
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;

        if (currentScroll <= 0) {
            header.classList.remove('scroll-up');
            return;
        }

        if (currentScroll > lastScroll && !header.classList.contains('scroll-down')) {
            header.classList.remove('scroll-up');
            header.classList.add('scroll-down');
        } else if (currentScroll < lastScroll && header.classList.contains('scroll-down')) {
            header.classList.remove('scroll-down');
            header.classList.add('scroll-up');
        }
        lastScroll = currentScroll;
    });
}
*/

// TODO: Add scroll progress indicator
/*
function initScrollProgress() {
    const progressBar = document.createElement('div');
    progressBar.className = 'scroll-progress';
    document.body.appendChild(progressBar);

    window.addEventListener('scroll', () => {
        const winScroll = document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        progressBar.style.width = scrolled + '%';
    });
}
*/

// TODO: Add parallax effect for hero section
/*
function initParallax() {
    const hero = document.querySelector('.hero');
    const heroContent = document.querySelector('.hero-content');
    const profileImg = document.querySelector('.profile-img');

    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const parallaxSpeed = 0.5;

        if (scrolled < hero.offsetHeight) {
            heroContent.style.transform = `translateY(${scrolled * parallaxSpeed}px)`;
            if (profileImg) {
                profileImg.style.transform = `translateY(${scrolled * parallaxSpeed * 0.3}px)`;
            }
        }
    });
}
*/

// TODO: Add button ripple effect
/*
function addRippleEffect() {
    const buttons = document.querySelectorAll('.btn');

    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            ripple.classList.add('ripple');

            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;

            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';

            this.appendChild(ripple);

            setTimeout(() => ripple.remove(), 600);
        });
    });
}
*/

// TODO: Utility function - Throttle
/*
function throttle(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
*/
