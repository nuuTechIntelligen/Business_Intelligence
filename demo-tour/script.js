// DATA MASTER: RUTAS PRINCIPALES, COMPLEMENTOS EXCLUSIVOS Y TARIFARIO ESCALONADO
const ESTRUCTURA_TOURS_VIAHA = {
    chichen: {
        titulo: "Chichén Itzá",
        categoria: "cultura",
        descripcion: "Descubre el esplendor de la capital del imperio maya. Una experiencia privada diseñada para conectar con la majestuosidad arqueológica antes de adentrarte en rincones coloniales o aguas sagradas.",
        complementos: [
            { id: "ch_zaci", nombre: "Cenote Zací / Valladolid", icono: "fa-water", precios: { 2: 3759, 3: 1300, 4: 1000 } },
            { id: "ch_izamal", nombre: "Pueblo Mágico Izamal", icono: "fa-building", precios: { 2: 3402, 3: 1150, 4: 900 } },
            { id: "ch_lolha", nombre: "Cenote Lol-Há", icono: "fa-droplet", precios: { 2: 3402, 3: 1150, 4: 900 } },
            { id: "ch_yodzonot", nombre: "Cenote Yodzonot", icono: "fa-water", precios: { 2: 3402, 3: 1150, 4: 900 } }
        ]
    },
    uxmal: {
        titulo: "Uxmal",
        categoria: "cultura",
        descripcion: "Admira la arquitectura del estilo Puuc en una de las ciudades mayas más imponentes y armónicas, complementada con haciendas históricas o talleres tradicionales.",
        complementos: [
            { id: "ux_choco", nombre: "Museo Choco-Story", icono: "fa-jar", precios: { 2: 3354.75, 3: 1150, 4: 900 } },
            { id: "ux_mucuyche", nombre: "Hacienda Mucuyché", icono: "fa-gopuram", precios: { 2: 3354.75, 3: 1150, 4: 900 } },
            { id: "ux_yaalutzil", nombre: "Cenote Yaal Utzil", icono: "fa-water", precios: { 2: 3354.75, 3: 1150, 4: 900 } }
        ]
    },
    coloradas: {
        titulo: "Coloradas Tour Day",
        categoria: "naturaleza",
        descripcion: "Un viaje visual inolvidable hacia las espectaculares lagunas rosa de Las Coloradas, pasando por la gastronomía de Motul y la naturaleza virgen de Playa Cancunito.",
        complementos: [
            { id: "col_principal", nombre: "Motul + Playa Cancunito", icono: "fa-umbrella-beach", precios: { 2: 4042.50, 3: 1350, 4: 1050 } }
        ]
    },
    celestun: {
        titulo: "Celestún",
        categoria: "naturaleza",
        descripcion: "Adéntrate en la reserva de la biosfera para admirar las colonias de flamencos rosas en su hábitat natural, recorriendo túneles de manglares en embarcaciones privadas.",
        complementos: [
            { id: "cel_bote", nombre: "Recorrido en Bote Eco", icono: "fa-ship", precios: { 2: 3370.50, 3: 1150, 4: 900 } },
            { id: "cel_lancha", nombre: "Paseo de Lancha Tradicional", icono: "fa-anchor", precios: { 2: 3370.50, 3: 1150, 4: 900 } }
        ]
    },
    cenotes: {
        titulo: "Ruta de Cenotes Privados",
        categoria: "naturaleza",
        descripcion: "Siente la pureza de las aguas subterráneas del Mayab. Recorridos exclusivos fuera del radar turístico masivo para nadar con absoluta libertad.",
        complementos: [
            { id: "cen_pixyah", nombre: "Cenotes Pixyah", icono: "fa-water", precios: { 2: 3087, 3: 1150, 4: 800 } },
            { id: "cen_tzabnah", nombre: "Grutas y Cenote Tzabnah", icono: "fa-mountain-sun", precios: { 2: 3087, 3: 1150, 4: 800 } },
            { id: "cen_homun", nombre: "Oasis de Cenotes Homún", icono: "fa-droplet", precios: { 2: 3087, 3: 1150, 4: 800 } }
        ]
    }
};

// DICCIONARIO TRADUCCIÓN BÁSICA PARA SOPORTE DE IDIOMAS GLOBAL
const DICCIONARIO_IDIOMAS = {
    es: { hero_title: "VÍA HA' MÉXICO", hero_badge: "✨ Sumérgete al Mayab", nav_agenda: "Agendar Llamada Directa" },
    en: { hero_title: "VIA HA' MEXICO", hero_badge: "✨ Immerse in the Mayab", nav_agenda: "Book Direct Call" },
    fr: { hero_title: "VIA HA' MEXICO", hero_badge: "✨ Plongez dans le Mayab", nav_agenda: "Prendre RDV" }
};

let flatpickrInstancia = null;

// INICIALIZACIÓN AL CARGAR LA PÁGINA
document.addEventListener("DOMContentLoaded", function() {
    // Configuración del calendario Flatpickr de soporte interno
    flatpickrInstancia = flatpickr("#calendario-agenda-inline", {
        minDate: "today",
        dateFormat: "Y-m-d"
    });
});

// CAMBIAR EL IDIOMA DEL CONTENIDO ESTÁTICO DE LA WEB
function cambiarIdiomaGlobal(idioma) {
    const elementos = document.querySelectorAll("[data-i18n]");
    elementos.forEach(el => {
        const llave = el.getAttribute("data-i18n");
        if (DICCIONARIO_IDIOMAS[idioma] && DICCIONARIO_IDIOMAS[idioma][llave]) {
            el.innerText = DICCIONARIO_IDIOMAS[idioma][llave];
        }
    });
}

// MANEJO DINÁMICO DEL STEPPER DE PASAJEROS
function modificarPasajeros(valor) {
    const campo = document.getElementById("campo-pasajeros");
    let actual = parseInt(campo.value) + valor;
    if (actual >= 1) {
        campo.value = actual;
        calcularPrecioFinal();
    }
}

// EVALUAR SI SE REQUIERE ESPECIFICAR OTRO IDIOMA PARA EL TOUR
function evaluarOtroIdioma(valor) {
    const contenedor = document.getElementById("contenedor-otro-idioma");
    if (valor === "Otro") {
        contenedor.classList.remove("oculto");
    } else {
        contenedor.classList.add("oculto");
    }
}

// ACTUALIZACIÓN DE INTERFAZ AL SELECCIONAR UN TOUR
function actualizarInterfazTour() {
    const llaveTour = document.getElementById("campo-tour-principal").value;
    if (!llaveTour) return;

    const dataTour = ESTRUCTURA_TOURS_VIAHA[llaveTour];

    // 1. Actualizar Columna de Información e Isologos Temáticos Dinámicos (Punto 9)
    document.getElementById("info-titulo-tour").innerText = dataTour.titulo;
    document.getElementById("info-descripcion-tour").innerText = dataTour.descripcion;

    const iconoContenedor = document.getElementById("isologo-tematico-contenedor");
    if (dataTour.categoria === "cultura") {
        iconoContenedor.innerHTML = '<i class="fa-solid fa-gopuram"></i>'; // Isologo de Cultura/Arqueología
        iconoContenedor.className = "isologo-dinamico-icono text-arena";
    } else {
        iconoContenedor.innerHTML = '<i class="fa-solid fa-water"></i>'; // Isologo de Naturaleza/Agua
        iconoContenedor.className = "isologo-dinamico-icono text-menta";
    }

    // 2. Renderizar Complementos como Radio Buttons Exclusivos (Punto 8)
    const contenedorGrid = document.getElementById("grid-radio-complementos");
    contenedorGrid.innerHTML = "";

    dataTour.complementos.forEach((comp, indice) => {
        const checked = indice === 0 ? "checked" : "";
        const htmlTarjeta = `
            <label class="tarjeta-radio">
                <input type="radio" name="complemento_exclusivo" value="${comp.id}" ${checked} onchange="calcularPrecioFinal()">
                <div class="radio-content">
                    <i class="fa-solid ${comp.icono}"></i>
                    <span>${comp.nombre}</span>
                </div>
            </label>
        `;
        contenedorGrid.insertAdjacentHTML("beforeend", htmlTarjeta);
    });

    // Mostrar secciones ocultas del formulario
    document.getElementById("contenedor-complementos").classList.remove("oculto");
    document.getElementById("contenedor-plus").classList.remove("oculto");

    calcularPrecioFinal();
}

// CÁLCULO ARITMÉTICO BAJO REGLAS ESCALONADAS REALES (Puntos 2, 3 y 4 pasajeros)
function calcularPrecioFinal() {
    const llaveTour = document.getElementById("campo-tour-principal").value;
    if (!llaveTour) return;

    const pasajeros = parseInt(document.getElementById("campo-pasajeros").value);
    const idCompSeleccionado = document.querySelector('input[name="complemento_exclusivo"]:checked')?.value;

    const dataTour = ESTRUCTURA_TOURS_VIAHA[llaveTour];
    const complementoObj = dataTour.complementos.find(c => c.id === idCompSeleccionado);

    if (!complementoObj) return;

    let costoTotal = 0;

    // Regla de negocio escalonada:
    if (pasajeros === 1 || pasajeros === 2) {
        costoTotal = complementoObj.precios[2]; // Tarifa corrida base para 2 personas
    } else if (pasajeros === 3) {
        costoTotal = complementoObj.precios[3] * 3;
    } else {
        costoTotal = complementoObj.precios[4] * pasajeros; // Precio congelado de 4 en adelante
    }

    // Formatear precio para el usuario
    document.getElementById("display-precio-total").innerText = new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
    }).format(costoTotal) + " MXN";
}

// CONSTRUCCIÓN E INYECCIÓN DE TEXTO DIRECTO PARA MENSAJE COMERCIAL DE WHATSAPP
// CONSTRUCCIÓN E INYECCIÓN DE TEXTO CON ICONOS / EMOJIS PARA EL MENSAJE DE WHATSAPP
function enviarCotizacionWhatsApp() {
    const nombre = document.getElementById("campo-nombre").value.trim();
    const llaveTour = document.getElementById("campo-tour-principal").value;

    if (!llaveTour || !nombre) {
        alert("Por favor ingresa tu nombre y selecciona una ruta antes de reservar.");
        return;
    }

    const pasajeros = document.getElementById("campo-pasajeros").value;
    let idiomaSeleccionado = document.getElementById("campo-idioma-tour").value;
    if (idiomaSeleccionado === "Otro") {
        idiomaSeleccionado = document.getElementById("campo-otro-idioma").value || "Otro idioma";
    }

    const dataTour = ESTRUCTURA_TOURS_VIAHA[llaveTour];
    const idCompSeleccionado = document.querySelector('input[name="complemento_exclusivo"]:checked')?.value;
    const complementoObj = dataTour.complementos.find(c => c.id === idCompSeleccionado);

    // Capturar Actividades Plus elegidas
    let extrasElegidos = [];
    document.querySelectorAll('input[name="actividad_plus"]:checked').forEach(cb => {
        extrasElegidos.push(cb.value);
    });
    const stringExtras = extrasElegidos.length > 0 ? extrasElegidos.join(", ") : "Ninguno";

    const precioFinalString = document.getElementById("display-precio-total").innerText;

    // Asignación de emoji principal según la categoría del tour
    const emojiCategoria = dataTour.categoria === "cultura" ? "🏛️" : "🌊";

    // Estructuración del mensaje comercial con emojis y formato enriquecido
    let mensajeTexto = `✨ *¡Hola VÍA HA' MÉXICO!* ✨\n\n`;
    mensajeTexto += `Me interesa diseñar una experiencia privada a la medida. Aquí están mis detalles:\n\n`;
    mensajeTexto += `👤 *Viajero Principal:* ${nombre}\n`;
    mensajeTexto += `${emojiCategoria} *Ruta Base:* ${dataTour.titulo}\n`;
    mensajeTexto += `🗺️ *Personalización:* ${complementoObj.nombre}\n`;
    mensajeTexto += `➕ *Actividades Plus:* ${stringExtras}\n`;
    mensajeTexto += `👥 *Pasajeros:* ${pasajeros} persona(s)\n`;
    mensajeTexto += `🗣️ *Idioma del Tour:* ${idiomaSeleccionado}\n`;
    mensajeTexto += `💰 *Costo Total Estimado:* ${precioFinalString}\n\n`;
    mensajeTexto += `🌿 _Al contratar este tour, sé que contribuyo al desarrollo sustentable de las comunidades del Mayab._\n\n`;
    mensajeTexto += `¿Tienen disponibilidad para coordinar los detalles de este itinerario?`;

    const numeroComercialViaHa = "525560040025"; // Número central de la empresa
    const urlFinalWA = `https://api.whatsapp.com/send?phone=${numeroComercialViaHa}&text=${encodeURIComponent(mensajeTexto)}`;
    
    window.open(urlFinalWA, "_blank");
}

// CONTROLADORES DE MODAL INTERACTIVA DE AGENDA
function abrirModalAgenda() {
    document.getElementById("modal-agenda-control").classList.remove("oculto");
}

fn_cerrarModalAgenda = function() {
    document.getElementById("modal-agenda-control").classList.add("oculto");
}
window.cerrarModalAgenda = fn_cerrarModalAgenda;

function confirmarLlamadaWhatsApp() {
    const fecha = document.getElementById("calendario-agenda-inline").value;
    const bloque = document.getElementById("campo-bloque-horario").value;

    if (!fecha) {
        alert("Por favor selecciona una fecha para la llamada.");
        return;
    }

    const mensajeAgenda = `¡Hola VÍA HA' MÉXICO! Me gustaría agendar una *Llamada Directa de Diseño* para planificar mi viaje:
• *Fecha Solicitada:* ${fecha}
• *Bloque de Horario:* ${bloque}

Agradezco su confirmación.`;

    const numeroComercialViaHa = "525560040025";
    const urlFinalAgenda = `https://api.whatsapp.com/send?phone=${numeroComercialViaHa}&text=${encodeURIComponent(mensajeAgenda)}`;
    
    window.open(urlFinalAgenda, "_blank");
    cerrarModalAgenda();
}
