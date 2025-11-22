// main.js - JS functionality for SK's personal website

document.addEventListener('DOMContentLoaded', function() {
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
                
                // Show target tab content
                tabContents.forEach(content => {
                    content.classList.remove('active');
                    if (content.getAttribute('id') === targetTab) {
                        content.classList.add('active');
                    }
                });
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
    
    // Reveal animations on scroll
    const revealElements = document.querySelectorAll('.reveal');
    
    function checkReveal() {
        const windowHeight = window.innerHeight;
        const revealPoint = 150;
        
        revealElements.forEach(element => {
            const revealTop = element.getBoundingClientRect().top;
            
            if (revealTop < windowHeight - revealPoint) {
                element.classList.add('active');
            }
        });
    }
    
    // Run once on page load
    checkReveal();
    
    // Run on scroll
    window.addEventListener('scroll', checkReveal);

    // Theme Switcher Logic
    initThemeSwitcher();
});

function initThemeSwitcher() {
    const toggle = document.getElementById('themeToggle');
    const panel = document.getElementById('themePanel');
    const themeBtns = document.querySelectorAll('.theme-btn');
    const typeBtns = document.querySelectorAll('.type-btn');

    if (!toggle || !panel) return;

    // Toggle Panel
    toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        panel.classList.toggle('active');
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
        // Remove all theme classes
        document.body.classList.remove('theme-sage', 'theme-slate', 'theme-sand');
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
