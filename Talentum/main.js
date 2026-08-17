document.addEventListener('DOMContentLoaded', () => {
    // Teléfono oficial de Talentum Consultoría
    const TALENTUM_PHONE = '524427965332';

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
    // 3. Carrusel de Testimonios
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

        const updateDots = () => {
            if (!dotsContainer) return;
            dotsContainer.innerHTML = '';
            const totalSteps = getMaxIndex() + 1;
            for (let i = 0; i < totalSteps; i++) {
                const dot = document.createElement('button');
                dot.className = `h-2.5 rounded-full transition-all duration-300 ${
                    i === currentIndex ? 'w-8 bg-primary-container' : 'w-2.5 bg-outline-variant'
                }`;
                dot.setAttribute('aria-label', `Testimonio ${i + 1}`);
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
            moveToSlide(currentIndex >= getMaxIndex() ? 0 : currentIndex + 1);
        });

        prevBtn.addEventListener('click', () => {
            moveToSlide(currentIndex <= 0 ? getMaxIndex() : currentIndex - 1);
        });

        window.addEventListener('resize', () => {
            moveToSlide(currentIndex);
        });

        updateDots();
    }

    // ==========================================
    // 4. Acordeón Interactivo FAQ
    // ==========================================
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const header = item.querySelector('.faq-header');
        if (header) {
            header.addEventListener('click', () => {
                const isActive = item.classList.contains('active');
                faqItems.forEach(i => i.classList.remove('active'));
                if (!isActive) {
                    item.classList.add('active');
                }
            });
        }
    });

    // ==========================================
    // 5. Modal para Agendar Cita
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
    // 6. Redirección a WhatsApp con Mensajes Formateados
    // ==========================================
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const nombre = document.getElementById('nombre').value.trim();
            const email = document.getElementById('email').value.trim();
            const servicioSelect = document.getElementById('servicio');
            const servicioText = servicioSelect.options[servicioSelect.selectedIndex].text;
            const mensaje = document.getElementById('mensaje').value.trim();

            const textoMensaje = `*¡Hola, Talentum Consultoría!* 👋\n\n` +
                `Deseo solicitar un *Diagnóstico Sin Costo*:\n\n` +
                `👤 *Nombre:* ${nombre}\n` +
                `✉️ *Correo:* ${email}\n` +
                `💼 *Sector / Servicio:* ${servicioText}\n` +
                `📝 *Necesidad:* ${mensaje}`;

            const urlWhatsApp = `https://wa.me/${TALENTUM_PHONE}?text=${encodeURIComponent(textoMensaje)}`;
            window.open(urlWhatsApp, '_blank');
            contactForm.reset();
        });
    }

    const modalAppointmentForm = document.getElementById('modal-appointment-form');
    if (modalAppointmentForm) {
        modalAppointmentForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const nombre = document.getElementById('modal-nombre').value.trim();
            const email = document.getElementById('modal-email').value.trim();
            const fecha = document.getElementById('modal-fecha').value;
            const modalidadSelect = document.getElementById('modal-modalidad');
            const modalidadText = modalidadSelect.options[modalidadSelect.selectedIndex].text;

            const textoMensaje = `*¡Hola, Talentum Consultoría!* 👋\n\n` +
                `Solicito *Agendar una Cita* de Diagnóstico:\n\n` +
                `👤 *Nombre:* ${nombre}\n` +
                `✉️ *Correo:* ${email}\n` +
                `📅 *Fecha Propuesta:* ${fecha}\n` +
                `💻 *Modalidad:* ${modalidadText}`;

            const urlWhatsApp = `https://wa.me/${TALENTUM_PHONE}?text=${encodeURIComponent(textoMensaje)}`;
            window.open(urlWhatsApp, '_blank');
            modalAppointmentForm.reset();
            closeModal();
        });
    }
});
