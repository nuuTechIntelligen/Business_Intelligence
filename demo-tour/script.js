/**
 * VARIABLES GLOBALES Y DICCIONARIO DE IDIOMAS - VÍA HÁ MÉXICO
 */
let adultos = 1;
let ninos = 0;
let fp = null; 
let fechaSeleccionada = "";
let idiomaActual = "es";

const posicionesCarrusel = {
    cenotes: 0,
    chichen: 0,
    celestun: 0
};

const intervalosCarrusel = {
    cenotes: null,
    chichen: null,
    celestun: null
};

const API_URL = 'https://sheetdb.io/api/v1/2s1p744rscfly?sheet=bloqueos';

const traducciones = {
    es: {
        hero_title: "VÍA HA' MÉXICO", [cite: 33]
        hero_badge: "✨ SUMÉRGETE AL MAYAB", [cite: 34]
        pregunta_tour: "¿Qué paraíso quieres visitar hoy?",
        tour_cenotes: "Tour 4 Cenotes (Bici/Tren)",
        tour_chichen: "Chichén Itzá & Valladolid",
        tour_celestun: "Celestún (Flamencos & Manglares)",
        titulo_cenotes: "Detalles del Tour Cenotes",
        desc_cenotes: "Visita 4 maravillosos cenotes en el Mayab. Incluye bicicletas, chalecos de flotación y regaderas con un enfoque sustentable y de respeto local.", [cite: 7, 34]
        titulo_chichen: "Maravilla del Mundo Arqueológica", [cite: 92]
        desc_chichen: "Recorrido histórico guiado por la zona arqueológica, tiempo libre en el pueblo mágico de Valladolid y nado en cenote sagrado. Incluye buffet regional.", [cite: 92]
        titulo_celestun: "Inmersión en la Naturaleza Viva", [cite: 7, 34]
        desc_celestun: "Exploración en lancha por la biosfera para admirar la majestuosa parvada de flamencos rosas, navegación en túneles de manglar y tiempo libre de playa.", [cite: 46]
        reviews_text: "⭐ Descubre por qué nos recomiendan nuestros viajeros",
        btn_reviews: "Ver opiniones de clientes ↗",
        titulo_cotizador: "Cotiza tu experiencia a la medida", [cite: 10]
        label_nombre: "Nombre de quien solicita",
        ph_nombre: "Escribe tu nombre completo...",
        label_nacionalidad: "Perfil del Viajero",
        opt_nacional: "🇲🇽 Viajero Nacional",
        opt_extranjero: "✈️ Viajero Internacional",
        label_entradas: "Modalidad de Accesos",
        opt_sin_entradas: "Experiencia sin entradas incluidas",
        opt_con_entradas: "Experiencia con entradas incluidas",
        label_fecha: "Fecha de Inmersión", [cite: 34]
        ph_fecha: "Selecciona una fecha disponible...",
        label_adultos: "Adultos",
        label_ninos: "Niños (-12 años)",
        total_estimado: "Total Estimado (Viaje Personalizado Privado):", [cite: 4]
        btn_reservar: "Confirmar Disponibilidad",
        alert_nombre: "Por favor, ingresa tu nombre para personalizar tu itinerario.",
        alert_fecha: "Por favor, selecciona una fecha para tu viaje.",
        wa_saludo: "¡Hola! Me interesa cotizar una *EXPERIENCIA PERSONALIZADA* con *Vía Há México*:\n\n", [cite: 4, 33]
        wa_nombre: "👤 *Viajero Principal:*",
        wa_perfil: "🌍 *Origen:*",
        wa_accesos: "🎟️ *Accesos:*",
        wa_tour: "🌴 *Itinerario:*",
        wa_fecha: "📅 *Fecha Solicitada:*",
        wa_adultos: "👥 *Adultos:*",
        wa_ninos: "👶 *Niños:*",
        wa_total: "💰 *Presupuesto Estimado:*",
        wa_pregunta: "¿Tienen disponibilidad para armar este viaje a la medida?", [cite: 10]
        wa_txt_ext: "Tarifa Internacional (Entradas no incl.)",
        wa_txt_con: "Con entradas e impactos locales incluidos", [cite: 18]
        wa_txt_sin: "Sin entradas incluidas"
    },
    en: {
        hero_title: "VÍA HA' MÉXICO", [cite: 33]
        hero_badge: "✨ IMMERSE YOURSELF IN THE MAYAB", [cite: 34]
        pregunta_tour: "What paradise do you want to visit today?",
        tour_cenotes: "4 Cenotes Tour (Bike/Train)",
        tour_chichen: "Chichen Itza & Valladolid",
        tour_celestun: "Celestun (Flamingos & Mangroves)",
        titulo_cenotes: "Cenotes Tour Details",
        desc_cenotes: "Explore 4 marvelous cenotes in the Mayab region. Includes bikes, life jackets, and an eco-friendly local immersion.", [cite: 7, 34]
        titulo_chichen: "Archaeological Wonder of the World", [cite: 92]
        desc_chichen: "Guided historical tour across the archaeological site, free time in colonial Valladolid, and swimming in a sacred open cenote. Regional buffet included.", [cite: 92]
        titulo_celestun: "Living Nature Immersion", [cite: 7]
        desc_celestun: "Boat expedition through the biosphere to spot wild pink flamingos, navigation across mangrove tunnels, and pristine beach time.", [cite: 46]
        reviews_text: "⭐ Discover why our travelers recommend us",
        btn_reviews: "See customer reviews ↗",
        titulo_cotizador: "Quote your tailor-made experience", [cite: 10]
        label_nombre: "Lead Traveler Name",
        ph_nombre: "Enter your full name...",
        label_nacionalidad: "Traveler Profile",
        opt_nacional: "🇲🇽 Mexican / National Traveler",
        opt_extranjero: "✈️ International Traveler",
        label_entradas: "Tickets Modality",
        opt_sin_entradas: "Tour without tickets included",
        opt_con_entradas: "Tour with tickets included",
        label_fecha: "Immersion Date", [cite: 34]
        ph_fecha: "Select an available date...",
        label_adultos: "Adults",
        label_ninos: "Children (Under 12)",
        total_estimado: "Estimated Total (Private Tailor-made Service):", [cite: 4, 10]
        btn_reservar: "Check Availability",
        alert_nombre: "Please enter your name to customize your quote.",
        alert_fecha: "Please select an available date for your journey.",
        wa_saludo: "Hello! I am interested in booking a *TAILOR-MADE EXPERIENCE* with *Vía Há México*:\n\n", [cite: 4, 33, 10]
        wa_nombre: "👤 *Lead Traveler:*",
        wa_perfil: "🌍 *Profile:*",
        wa_accesos: "🎟 *Tickets:*",
        wa_tour: "🌴 *Itinerary:*",
        wa_fecha: "📅 *Date:*",
        wa_adultos: "👥 *Adultos:*",
        wa_ninos: "👶 *Children:*",
        wa_total: "💰 *Estimated Cost:*",
        wa_pregunta: "Do you have availability to arrange this custom experience?", [cite: 10]
        wa_txt_ext: "International Rate (Tickets not incl.)",
        wa_txt_con: "With admission tickets included",
        wa_txt_sin: "Without tickets included"
    }
};

async function inicializarSistema() {
    while (typeof flatpickr === 'undefined') {
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    try {
        inicializarCalendario();
        calcular();
        cargarBloqueos();
        actualizarLogosDinamicos(); 
        inicializarSoportesTactiles(); 
        
        const select = document.getElementById('tour-select');
        if (select) {
            activarAutoplayCarrusel(select.value);
        }
        
        const btnReviews = document.getElementById('btn-reviews');
        if (btnReviews) {
            btnReviews.addEventListener('click', function() {
                gtag('event', 'clic_testimonios', { 'destino_red': 'Instagram_Reviews' });
            });
        }
    } catch (error) {
        console.error("❌ Error en inicialización:", error.message);
    }
}

function inicializarCalendario() {
    const campoFecha = document.getElementById('fecha-reserva');
    if (!campoFecha) return;

    if (fp) fp.destroy(); 

    fp = flatpickr(campoFecha, {
        locale: idiomaActual === 'es' ? "es" : "default", 
        mode: "range", 
        minDate: "today", 
        dateFormat: "Y-m-d",
        altInput: true, 
        altFormat: "d/m/Y",
        altInputClass: "flatpickr-input",
        disableMobile: true,
        disable: [], 
        onChange: function(selectedDates, dateStr) {
            fechaSeleccionada = dateStr;
            gtag('event', 'interaccion_cotizador', {
                'tipo_accion': 'seleccion_fecha',
                'fecha_viaje': dateStr
            });
        }
    });
}

function moverCarrusel(idTour, direccion) {
    const track = document.getElementById(`track-${idTour}`);
    if (!track) return;
    const imagenes = track.querySelectorAll('img');
    const totalImagenes = imagenes.length;
    
    posicionesCarrusel[idTour] += direccion;
    
    if (posicionesCarrusel[idTour] >= totalImagenes) posicionesCarrusel[idTour] = 0;
    if (posicionesCarrusel[idTour] < 0) posicionesCarrusel[idTour] = totalImagenes - 1;
    
    const porcentajeMovimiento = posicionesCarrusel[idTour] * -100;
    track.style.transform = `translateX(${porcentajeMovimiento}%)`;

    gtag('event', 'interaccion_galeria', {
        'id_tour': idTour,
        'imagen_index': posicionesCarrusel[idTour]
    });
}

function activarAutoplayCarrusel(idTour) {
    if (intervalosCarrusel[idTour]) {
        clearInterval(intervalosCarrusel[idTour]);
    }
    intervalosCarrusel[idTour] = setInterval(() => {
        moverCarrusel(idTour, 1);
    }, 4000); 
}

function detenerAutoplayCarrusel(idTour) {
    if (intervalosCarrusel[idTour]) {
        clearInterval(intervalosCarrusel[idTour]);
        intervalosCarrusel[idTour] = null;
    }
}

function inicializarSoportesTactiles() {
    const contenedores = document.querySelectorAll('.carousel-container');
    
    contenedores.forEach(container => {
        let xInicial = null;
        const track = container.querySelector('.carousel-track');
        if(!track) return;
        const idTour = track.id.replace('track-', '');

        container.addEventListener('touchstart', (e) => {
            detenerAutoplayCarrusel(idTour);
            xInicial = e.touches[0].clientX;
        }, { passive: true });

        container.addEventListener('touchend', (e) => {
            if (!xInicial) return;
            let xFinal = e.changedTouches[0].clientX;
            let diferenciaX = xInicial - xFinal;

            if (Math.abs(diferenciaX) > 50) {
                if (diferenciaX > 0) {
                    moverCarrusel(idTour, 1); 
                } else {
                    moverCarrusel(idTour, -1); 
                }
            }
            xInicial = null;
            activarAutoplayCarrusel(idTour);
        }, { passive: true });
    });
}

function actualizarLogosDinamicos() {
    const select = document.getElementById('tour-select');
    if (!select) return;
    const urlLogo = select.options[select.selectedIndex].getAttribute('data-logo');
    
    document.querySelectorAll('.dynamic-tour-logo').forEach(img => {
        img.src = urlLogo;
    });
}

function aplicarTextosDeIdioma() {
    const t = traducciones[idiomaActual];

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key]) el.innerText = t[key];
    });

    document.querySelectorAll('[data-i18n-ph]').forEach(el => {
        const key = el.getAttribute('data-i18n-ph');
        if (t[key]) el.placeholder = t[key];
    });

    inicializarCalendario();
    cargarBloqueos(); 
    actualizarInterfaz();
    
    gtag('event', 'cambio_idioma', { 'idioma_seleccionado': idiomaActual });
}

function cambiarIdioma() {
    idiomaActual = document.getElementById('lang-switch').value;
    aplicarTextosDeIdioma();
}

function cargarBloqueos() {
    fetch(API_URL)
        .then(res => res.json())
        .then(data => {
            const fechas = data
                .filter(row => row.fecha && row.fecha.trim().length > 5)
                .map(row => row.fecha.trim());

            if (fp && typeof fp.set === 'function') {
                fp.set("disable", fechas);
            }
        })
        .catch(err => console.error("❌ Error conectando con SheetDB:", err));
}

function cambiarNacionalidad() {
    const nacionalidad = document.getElementById('nacionalidad-select').value;
    const wrapperEntradas = document.getElementById('wrapper-entradas');
    const entradasSelect = document.getElementById('entradas-select');

    if (nacionalidad === 'extranjero') {
        entradasSelect.value = 'sin';
        wrapperEntradas.style.display = 'none';
    } else {
        wrapperEntradas.style.display = 'block';
    }

    gtag('event', 'interaccion_cotizador', {
        'tipo_accion': 'cambio_nacionalidad',
        'perfil_usuario': nacionalidad
    });

    calcular();
}

function cambiarEntradas() {
    const modalidadEntradas = document.getElementById('entradas-select').value;
    gtag('event', 'interaccion_cotizador', {
        'tipo_accion': 'seleccion_entradas',
        'modalidad': modalidadEntradas
    });
    calcular();
}

function cambiarCant(tipo, cambio) {
    if (tipo === 'adultos') {
        if (adultos + cambio >= 1) adultos += cambio; 
        document.getElementById('qty-adultos').innerText = adultos;
    } else {
        if (ninos + cambio >= 0) ninos += cambio; 
        document.getElementById('qty-ninos').innerText = ninos;
    }
    
    gtag('event', 'interaccion_cotizador', {
        'tipo_accion': 'modificar_pasajeros',
        'categoria': tipo,
        'valor_actual': tipo === 'adultos' ? adultos : ninos
    });

    calcular(); 
}

function actualizarInterfaz() {
    const select = document.getElementById('tour-select');
    const selectedTour = select.value;
    
    Object.keys(intervalosCarrusel).forEach(tourKey => detenerAutoplayCarrusel(tourKey));

    document.querySelectorAll('.tour-info-card').forEach(card => card.classList.remove('active'));
    document.getElementById('info-' + selectedTour).classList.add('active');
    
    activarAutoplayCarrusel(selectedTour);
    actualizarLogosDinamicos(); 

    gtag('event', 'ver_tour', {
        'id_tour': selectedTour,
        'nombre_tour': select.options[select.selectedIndex].text
    });

    calcular();
}

function calcular() {
    const select = document.getElementById('tour-select');
    if(!select) return;

    const option = select.options[select.selectedIndex];
    const nacionalidad = document.getElementById('nacionalidad-select').value;
    const modalidadEntradas = document.getElementById('entradas-select').value;

    let precioAdulto = parseInt(option.getAttribute('data-adulto'));
    let precioNino = parseInt(option.getAttribute('data-nino'));

    if (nacionalidad === 'mexicano' && modalidadEntradas === 'con') {
        precioAdulto += parseInt(option.getAttribute('data-entrada-adulto')) || 0;
        precioNino += parseInt(option.getAttribute('data-entrada-nino')) || 0;
    }

    const total = (adultos * precioAdulto) + (ninos * precioNino);
    document.getElementById('total-display').innerText = `$${total.toLocaleString()} MXN`;
}

function enviarWhatsApp() {
    const t = traducciones[idiomaActual];
    const nombre = document.getElementById('nombre-cliente').value.trim();
    
    if (!nombre) {
        alert(t.alert_nombre);
        document.getElementById('nombre-cliente').focus();
        return;
    }

    if (!fechaSeleccionada) {
        alert(t.alert_fecha);
        return;
    }

    const select = document.getElementById('tour-select');
    const tourName = select.options[select.selectedIndex].text;
    const idTour = select.value;
    const total = document.getElementById('total-display').innerText;
    const nacionalidad = document.getElementById('nacionalidad-select').value;
    const modalidadEntradas = document.getElementById('entradas-select').value;

    let perfilTexto = nacionalidad === 'mexicano' ? t.opt_nacional : t.opt_extranjero;
    let entradasTexto = nacionalidad === 'extranjero' ? t.wa_txt_ext : (modalidadEntradas === 'con' ? t.wa_txt_con : t.wa_txt_sin);
    
    let mensaje = `${t.wa_saludo}`;
    mensaje += `${t.wa_nombre} ${nombre}\n`;
    mensaje += `${t.wa_perfil} ${perfilTexto}\n`;
    mensaje += `${t.wa_accesos} ${entradasTexto}\n`;
    mensaje += `${t.wa_tour} ${tourName}\n`;
    mensaje += `${t.wa_fecha} ${fechaSeleccionada}\n`;
    mensaje += `${t.wa_adultos} ${adultos}\n`;
    mensaje += `${t.wa_ninos} ${ninos}\n`;
    mensaje += `${t.wa_total} ${total}\n\n`;
    mensaje += `${t.wa_pregunta}`;

    gtag('event', 'click_whatsapp', {
        'nombre_viajero': nombre,
        'nombre_tour': tourName,
        'id_tour': idTour,
        'fecha_reserva': fechaSeleccionada,
        'total_cotizado': total,
        'cantidad_adultos': adultos,
        'cantidad_ninos': ninos,
        'perfil_nacionalidad': nacionalidad,
        'modalidad_entradas': modalidadEntradas,
        'idioma_reserva': idiomaActual
    });

    window.open(`https://wa.me/529992719285?text=${encodeURIComponent(mensaje)}`, '_blank'); [cite: 254]
}

document.addEventListener("DOMContentLoaded", inicializarSistema);
