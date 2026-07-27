document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================================================
    // 1. HEADER SCROLL EFFECT
    // ==========================================================================
    const header = document.querySelector('.header');
    
    const handleScroll = () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    };
    
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Call once on load to handle pre-scrolled states

    // ==========================================================================
    // 2. MOBILE MENU TOGGLE
    // ==========================================================================
    const navToggle = document.querySelector('.nav-toggle');
    const nav = document.querySelector('.nav');
    const navLinks = document.querySelectorAll('.nav-link');
    
    const toggleMenu = () => {
        const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
        navToggle.setAttribute('aria-expanded', !isExpanded);
        nav.classList.toggle('open');
        
        // Prevent body scroll when menu is open on mobile
        document.body.style.overflow = isExpanded ? 'auto' : 'hidden';
    };
    
    const closeMenu = () => {
        navToggle.setAttribute('aria-expanded', 'false');
        nav.classList.remove('open');
        document.body.style.overflow = 'auto';
    };
    
    navToggle.addEventListener('click', toggleMenu);
    
    // Close menu when a link is clicked
    navLinks.forEach(link => {
        link.addEventListener('click', closeMenu);
    });

    // ==========================================================================
    // 3. SMOOTH SCROLLING AND ACTIVE STATE LINK HIGHLIGHT
    // ==========================================================================
    const sections = document.querySelectorAll('section');
    
    const activeLinkHandler = () => {
        let currentSectionId = '';
        const scrollPosition = window.scrollY + 150; // offset for nav header
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                currentSectionId = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSectionId}`) {
                link.classList.add('active');
            }
        });
    };
    
    window.addEventListener('scroll', activeLinkHandler);
    activeLinkHandler(); // Run on init

    // ==========================================================================
    // 4. FAQ ACCORDION
    // ==========================================================================
    const faqQuestions = document.querySelectorAll('.faq-question');
    
    faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
            const item = question.parentElement;
            const answer = item.querySelector('.faq-answer');
            const isActive = item.classList.contains('active');
            
            // Close all other open items
            document.querySelectorAll('.faq-item').forEach(otherItem => {
                if (otherItem !== item && otherItem.classList.contains('active')) {
                    otherItem.classList.remove('active');
                    otherItem.querySelector('.faq-answer').style.maxHeight = '0px';
                    otherItem.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
                }
            });
            
            // Toggle current item
            if (isActive) {
                item.classList.remove('active');
                answer.style.maxHeight = '0px';
                question.setAttribute('aria-expanded', 'false');
            } else {
                item.classList.add('active');
                answer.style.maxHeight = answer.scrollHeight + 'px';
                question.setAttribute('aria-expanded', 'true');
            }
        });
    });

    // ==========================================================================
    // 5. WHATSAPP CATALOG CAROUSEL
    // ==========================================================================
    const track = document.getElementById('carouselTrack');
    const prevBtn = document.getElementById('carouselPrevBtn');
    const nextBtn = document.getElementById('carouselNextBtn');
    const dotsNav = document.getElementById('carouselDots');
    
    if (track && prevBtn && nextBtn && dotsNav) {
        const slides = Array.from(track.children);
        const dots = Array.from(dotsNav.children);
        let currentIndex = 0;
        
        const moveToSlide = (index) => {
            if (index < 0) {
                index = slides.length - 1;
            } else if (index >= slides.length) {
                index = 0;
            }
            
            currentIndex = index;
            
            // Translate the track using percentage
            track.style.transform = `translateX(-${currentIndex * 100}%)`;
            
            // Update active dot
            dots.forEach(dot => dot.classList.remove('active'));
            dots[currentIndex].classList.add('active');
        };
        
        // Next button click
        nextBtn.addEventListener('click', () => {
            moveToSlide(currentIndex + 1);
        });
        
        // Prev button click
        prevBtn.addEventListener('click', () => {
            moveToSlide(currentIndex - 1);
        });
        
        // Dots click
        dotsNav.addEventListener('click', (e) => {
            const targetDot = e.target.closest('.dot');
            if (!targetDot) return;
            
            const targetIndex = dots.indexOf(targetDot);
            moveToSlide(targetIndex);
        });
        
        // Support swipe gestures on mobile
        let startX = 0;
        let endX = 0;
        
        track.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
        }, { passive: true });
        
        track.addEventListener('touchmove', (e) => {
            endX = e.touches[0].clientX;
        }, { passive: true });
        
        track.addEventListener('touchend', () => {
            const difference = startX - endX;
            if (Math.abs(difference) > 50) {
                if (difference > 0) {
                    moveToSlide(currentIndex + 1);
                } else {
                    moveToSlide(currentIndex - 1);
                }
            }
            startX = 0;
            endX = 0;
        });
        
        // Auto play every 5 seconds, paused on hover
        let autoPlayTimer = setInterval(() => {
            moveToSlide(currentIndex + 1);
        }, 5000);
        
        const resetAutoPlay = () => {
            clearInterval(autoPlayTimer);
            autoPlayTimer = setInterval(() => {
                moveToSlide(currentIndex + 1);
            }, 5000);
        };
        
        nextBtn.addEventListener('click', resetAutoPlay);
        prevBtn.addEventListener('click', resetAutoPlay);
        dots.forEach(dot => dot.addEventListener('click', resetAutoPlay));
        track.addEventListener('touchend', resetAutoPlay);
    }
});
