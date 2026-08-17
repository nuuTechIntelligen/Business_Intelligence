document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // 1. Menú Móvil
    // ==========================================
    const mobileMenuBtn = document.getElementById('mobile-menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileNavLinks = mobileMenu ? mobileMenu.querySelectorAll('a') : [];

    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });

        mobileNavLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.add('hidden');
            });
        });
    }

    // ==========================================
    // 2. Active Link on Scroll
    // ==========================================
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('nav a[href^="#"]');

    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (window.pageYOffset >= sectionTop - sectionHeight / 3) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href && href.startsWith('#')) {
                link.classList.remove('text-primary', 'font-bold', 'border-b-2', 'border-primary', 'pb-1');
                link.classList.add('text-secondary');
                if (href.slice(1) === current) {
                    link.classList.remove('text-secondary');
                    link.classList.add('text-primary', 'font-bold', 'border-b-2', 'border-primary', 'pb-1');
                }
            }
        });
    });

    // ==========================================
    // 3. Carrusel Dinámico de Testimonios
    // ==========================================
    const track = document.getElementById('carousel-track');
    const prevBtn = document.getElementById('prev-testimonio');
    const nextBtn = document.getElementById('next-testimonio');
    const dotsContainer = document.getElementById('carousel-dots');
    
    if (track && prevBtn && nextBtn) {
        const slides = track.querySelectorAll('.carousel-slide');
        let currentIndex = 0;

        const getSlidesPerView = () => window.innerWidth >= 768 ? 2 : 1;
        const getMaxIndex = () => Math.max(0, slides.length - getSlidesPerView());

        // Generar puntos indicadores
        const updateDots = () => {
            if (!dotsContainer) return;
            dotsContainer.innerHTML = '';
            const totalSteps = getMaxIndex() + 1;
            for (let i = 0; i < totalSteps; i++) {
                const dot = document.createElement('button');
                dot.className = `h-2.5 rounded-full transition-all duration-300 ${
                    i === currentIndex ? 'w-8 bg-primary-container' : 'w-2.5 bg-outline-variant'
                }`;
                dot.setAttribute('aria-label', `Ir al testimonio ${i + 1}`);
                dot.addEventListener('click', () => moveToSlide(i));
                dotsContainer.appendChild(dot);
            }
        };

        const moveToSlide = (index) => {
            const maxIndex = getMaxIndex();
            currentIndex = Math.max(0, Math.min(index, maxIndex));
            const slideWidthPercentage = 100 / getSlidesPerView();
            track.style.transform = `translateX(-${currentIndex * slideWidthPercentage}%)`;
            updateDots();
        };

        nextBtn.addEventListener('click', () => {
            if (currentIndex >= getMaxIndex()) {
                moveToSlide(0);
            } else {
                moveToSlide(currentIndex + 1);
            }
        });

        prevBtn.addEventListener('click', () => {
            if (currentIndex <= 0) {
                moveToSlide(getMaxIndex());
            } else {
                moveToSlide(currentIndex - 1);
            }
        });

        window.addEventListener('resize', () => {
            moveToSlide(currentIndex);
        });

        updateDots();
    }

    // ==========================================
    // 4. Modal para Agendar Cita
    // ==========================================
    const appointmentModal = document.getElementById('appointment-modal');
    const openModalBtns = document.querySelectorAll('[data-open-modal]');
    const closeModalBtns = document.querySelectorAll('[data-close-modal]');

    const openModal = () => {
        if (!appointmentModal) return;
        appointmentModal.classList.remove('hidden');
        document.body.classList.add('overflow-hidden');
    };

    const closeModal = () => {
        if (!appointmentModal) return;
        appointmentModal.classList.add('hidden');
        document.body.classList.remove('overflow-hidden');
    };

    openModalBtns.forEach(btn => btn.addEventListener('click', (e) => {
        e.preventDefault();
        openModal();
    }));

    closeModalBtns.forEach(btn => btn.addEventListener('click', closeModal));

    if (appointmentModal) {
        appointmentModal.addEventListener('click', (e) => {
            if (e.target === appointmentModal) closeModal();
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && appointmentModal && !appointmentModal.classList.contains('hidden')) {
            closeModal();
        }
    });

    // ==========================================
    // 5. Envío Funcional de Formularios (Feedback)
    // ==========================================
    const handleFormSubmit = (formId, successMsg) => {
        const form = document.getElementById(formId);
        if (!form) return;

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn ? submitBtn.innerText : '';

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerText = 'Enviando...';
            }

            // Simulación de envío
            setTimeout(() => {
                form.reset();
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerText = originalText;
                }
                alert(successMsg);
                if (formId === 'modal-appointment-form') {
                    closeModal();
                }
            }, 800);
        });
    };

    handleFormSubmit('contact-form', '¡Gracias por contactar a Talentum! Un asesor se comunicará contigo en breve.');
    handleFormSubmit('modal-appointment-form', '¡Cita solicitada exitosamente! Nos pondremos en contacto para confirmar el horario.');
});
