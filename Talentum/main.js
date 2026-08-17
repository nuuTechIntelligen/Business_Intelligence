document.addEventListener('DOMContentLoaded', () => {
    // Número oficial de Talentum Consultoría
    const TALENTUM_PHONE = '524427965332';

    // =======================================================
    // GESTOR CENTRALIZADO DE TESTIMONIOS
    // Agrega, edita o elimina elementos directamente de esta lista
    // =======================================================
    const testimoniosData = [
        {
            iniciales: "DR",
            nombre: "Daniel Ramírez",
            puesto: "Director General - Resort Pacífico",
            comentario: "La precisión con la que Talentum seleccionó a nuestro equipo gerencial para la nueva apertura hotelera superó todas las expectativas. Entienden perfectamente el ritmo del sector HORECA."
        },
        {
            iniciales: "ML",
            nombre: "Mariana López",
            puesto: "Gerente de RH - Industrial del Bajío",
            comentario: "Implementar los nuevos procesos de RRHH con Yareli y su equipo transformó nuestro clima laboral en menos de 6 meses. La consultoría fue profesional, empática y muy práctica."
        },
        {
            iniciales: "CG",
            nombre: "Carlos Gutiérrez",
            puesto: "Director de Operaciones - Grupo Logístico",
            comentario: "El soporte en turnos rotativos y posiciones operativas para planta fue inmediato. Tienen un dominio real de la industria en Querétaro y el Bajío."
        },
        {
            iniciales: "SV",
            nombre: "Sofía Valenzuela",
            puesto: "Directora de Finanzas - Cadena Gastronómica",
            comentario: "Excelente acompañamiento en la estructuración de perfiles y tabuladores de sueldos. Se nota la experiencia y cercanía en cada sesión de trabajo."
        }
    ];

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
    // 3. Renderizado y Control del Carrusel
    // ==========================================
    const track = document.getElementById('carousel-track');
    const prevBtn = document.getElementById('prev-testimonio');
    const nextBtn = document.getElementById('next-testimonio');
    const dotsContainer = document.getElementById('carousel-dots');

    if (track && prevBtn && nextBtn) {
        // Inyección dinámica de HTML
        track.innerHTML = testimoniosData.map(item => `
            <div class="carousel-slide px-4">
                <div class="p-10 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl italic relative shadow-sm h-full flex flex-col justify-between">
                    <span class="material-symbols-outlined absolute top-8 right-10 text-6xl text-primary-container opacity-20 select-none">format_quote</span>
                    <p class="font-body-lg text-lg mb-8 text-secondary">
                        "${item.comentario}"
                    </p>
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 bg-surface-dim rounded-full flex items-center justify-center font-bold text-on-surface select-none">${item.iniciales}</div>
                        <div>
                            <p class="font-bold text-on-background not-italic">${item.nombre}</p>
                            <p class="text-sm text-secondary not-italic">${item.puesto}</p>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        let currentIndex = 0;
        const getSlidesPerView = () => window.innerWidth >= 768 ? 2 : 1;
        const getMaxIndex = () => Math.max(0, testimoniosData.length - getSlidesPerView());

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
