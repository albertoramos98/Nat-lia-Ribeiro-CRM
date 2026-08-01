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
    // 5. LEAD FORM CAPTURE AND SUBMISSION HANDLER
    // ==========================================================================
    const leadForm = document.getElementById('lead-capture-form');
    
    if (leadForm) {
        leadForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const submitBtn = document.getElementById('btn-submit-lead');
            
            // Get form values
            const name = document.getElementById('lead-name').value.trim();
            const email = document.getElementById('lead-email').value.trim();
            const whatsapp = document.getElementById('lead-whatsapp').value.trim();
            const company = document.getElementById('lead-company').value.trim();
            const revenue = document.getElementById('lead-revenue').value;
            const challenge = document.getElementById('lead-challenge').value;
            
            // Set loading state
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="btn-loader">Enviando dados...</span>';
            
            // Create lead object
            const leadData = {
                name,
                email,
                whatsapp,
                company,
                revenue,
                challenge,
                timestamp: new Date().toISOString()
            };
            
            // Simulate API Request (e.g. 1.8s delay)
            setTimeout(() => {
                // Save to LocalStorage for demonstration/persistence
                try {
                    const existingLeads = JSON.parse(localStorage.getItem('leads') || '[]');
                    existingLeads.push(leadData);
                    localStorage.setItem('leads', JSON.stringify(existingLeads));
                } catch (err) {
                    console.error('Error saving lead to localStorage:', err);
                }
                
                // Render Success State inside the form wrapper
                const formWrapper = document.querySelector('.contact-form-wrapper');
                formWrapper.innerHTML = `
                    <div class="success-card">
                        <div class="success-icon-wrapper">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                <polyline points="22 4 12 14.01 9 11.01"></polyline>
                            </svg>
                        </div>
                        <h3 class="success-title">Pedido enviado com sucesso!</h3>
                        <p class="success-desc">Olá, <strong>${name}</strong>! Recebi seus dados. Vamos fazer um diagnóstico comercial completo para a <strong>${company}</strong>.</p>
                        
                        <div class="success-steps">
                            <h4>Próximos Passos:</h4>
                            <ul>
                                <li>Análise prévia do segmento e canais da sua clínica.</li>
                                <li>Contato comercial direto para agendamento dos 30 minutos.</li>
                                <li>Elaboração do seu Score Comercial inicial.</li>
                            </ul>
                        </div>
                        
                        <div class="redirect-notice">
                            <div class="spinner"></div>
                            <span>Redirecionando para o WhatsApp da Natália em instantes...</span>
                        </div>
                    </div>
                `;
                
                // Format whatsapp message link
                const waBaseUrl = "https://wa.me/5534991922080";
                const waMessage = `Olá Natália, acabei de enviar meus dados no site para agendar o diagnóstico express:\n\n` + 
                                  `• Nome: ${name}\n` +
                                  `• Clínica/Consultório: ${company}\n` +
                                  `• WhatsApp: ${whatsapp}\n` +
                                  `• Faturamento: ${revenue}\n` +
                                  `• Maior gargalo: ${challenge}`;
                                  
                const waFormattedUrl = `${waBaseUrl}?text=${encodeURIComponent(waMessage)}`;
                
                // Redirect after 3.5 seconds
                setTimeout(() => {
                    window.open(waFormattedUrl, '_blank');
                }, 3500);
                
            }, 1800);
        });
        
        // Simple Input Masking / Helper for WhatsApp input
        const whatsappInput = document.getElementById('lead-whatsapp');
        if (whatsappInput) {
            whatsappInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length > 11) value = value.slice(0, 11);
                
                // Apply simple mask: (XX) XXXXX-XXXX or (XX) XXXX-XXXX
                if (value.length > 10) {
                    e.target.value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
                } else if (value.length > 6) {
                    e.target.value = `(${value.slice(0, 2)}) ${value.slice(2, 6)}-${value.slice(6)}`;
                } else if (value.length > 2) {
                    e.target.value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
                } else if (value.length > 0) {
                    e.target.value = `(${value}`;
                }
            });
        }
    }

});

