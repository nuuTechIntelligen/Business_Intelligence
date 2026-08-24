// ======================================================
// MENU LA ENGORDADERA (BARRA PÍLDORA + MERCADO PAGO DINÁMICO + PERSISTENCIA)
// ======================================================
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzoB4Q5crNsK8UC4oGRpFE8qJWPaHPhhxqdrRO6hNZB1grViQRnkPmxdpRwqhbeno8gqw/exec"; 
const NUMERO_WHATSAPP = "5215512345678"; 

// Variables dinámicas desde Google Sheets
let PREMIO_LEALTAD = "1 Botana Mediana Gratis 🍿";
let PUNTOS_META_PREMIO = 100;
let ESCALA_PUNTOS_COMPRA = "5-20:1, 21-50:3, 51-100:6, 101-200:15, 201-9999:25";
let LINK_MERCADOPAGO = "https://mercadopago.com.mx";
let CLABE_BANCARIA = "123456789012345678";
let BANCO_TITULAR = "Mercado Pago / La Engordadera";

// Enlaces de Redes Sociales y Google Maps
let LINK_FACEBOOK = "";
let LINK_INSTAGRAM = "";
let LINK_GOOGLE_MAPS = "https://maps.google.com";
let LINK_WHATSAPP_DIRECTO = "";

let productosGlobales = [];
let productoSeleccionado = null;
let montoSeleccionadoActual = 20;
let montoMinimoActual = 10;
let limiteIngredientesActual = 0;
let carrito = [];
let ultimoPedidoGenerado = null;
let temporizadorKiosko = null;
let whatsappEnviadoConfirmado = false;

let bannersPromoActivos = [];
let indiceBannerActual = 0;
let temporizadorAutoplayBanner = null;

const DIAS_SEMANA = ['DOMINGO', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];

function limpiarTexto(txt) {
    if (!txt) return '';
    return String(txt)
        .toUpperCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}

function obtenerPropiedadFlexible(obj, clavesPosibles) {
    if (!obj || typeof obj !== 'object') return '';
    const llaves = Object.keys(obj);
    for (let cp of clavesPosibles) {
        const cpNormal = limpiarTexto(cp).replace(/[^A-Z0-9]/g, '');
        for (let k of llaves) {
            const kNormal = limpiarTexto(k).replace(/[^A-Z0-9]/g, '');
            if (kNormal === cpNormal) return obj[k];
        }
    }
    return '';
}

function parsearExtraConCosto(textoOpcion) {
    const str = String(textoOpcion).trim();
    const match = str.match(/^(.*?)(?:\s*\(\s*\+\s*\$?\s*([\d\.]+)\s*\))?$/);
    if (match && match[2]) {
        return {
            nombreLimpio: match[1].trim(),
            costoExtra: parseFloat(match[2]),
            textoCompleto: str
        };
    }
    return { nombreLimpio: str, costoExtra: 0, textoCompleto: str };
}

function calcularPuntosPorMonto(total) {
    if (!ESCALA_PUNTOS_COMPRA || total < 5) return 0;
    const rangos = ESCALA_PUNTOS_COMPRA.split(',').map(r => r.trim());
    for (let r of rangos) {
        const partes = r.split(':');
        if (partes.length === 2) {
            const lims = partes[0].split('-');
            const min = parseFloat(lims[0]);
            const max = parseFloat(lims[1]);
            const pts = parseInt(partes[1], 10);
            if (total >= min && total <= max) {
                return pts;
            }
        }
    }
    return Math.floor(total * 0.1);
}

function obtenerInfoCuatrimestreActual() {
    const ahora = new Date();
    const anio = ahora.getFullYear();
    const mes = ahora.getMonth();

    if (mes <= 3) {
        return { id: `C1-${anio}`, nombre: `1er Cuatrimestre ${anio}`, vence: `30 de Abril de ${anio}` };
    } else if (mes <= 7) {
        return { id: `C2-${anio}`, nombre: `2do Cuatrimestre ${anio}`, vence: `31 de Agosto de ${anio}` };
    } else {
        return { id: `C3-${anio}`, nombre: `3er Cuatrimestre ${anio}`, vence: `31 de Diciembre de ${anio}` };
    }
}

// ======================================================
// 1. INICIALIZACIÓN
// ======================================================
document.addEventListener('DOMContentLoaded', () => {
    actualizarBarraPildoraCarrito();
    renderizarRedesSocialesFooter();
    cargarMenuDesdeWebApp();
    cargarConfiguracionGlobal();
    verificarPedidoActivoEnAlmacenamiento();
});

function verificarPedidoActivoEnAlmacenamiento() {
    const guardado = localStorage.getItem('engordadera_ultimo_pedido_activo');
    if (guardado) {
        try {
            const p = JSON.parse(guardado);
            if (p && p.tipo === 'recoger') {
                ultimoPedidoGenerado = p;
                mostrarBoletoTurno(p, true);
            }
        } catch (e) {}
    }
}

async function cargarConfiguracionGlobal() {
    if (!WEB_APP_URL || WEB_APP_URL.includes("TU_SCRIPT_ID")) {
        renderizarRedesSocialesFooter();
        return;
    }

    try {
        const res = await fetch(`${WEB_APP_URL}?sheet=Configuracion`);
        const config = await res.json();
        
        if (Array.isArray(config)) {
            config.forEach(fila => {
                const clave = limpiarTexto(obtenerPropiedadFlexible(fila, ['clave', 'key', 'nombre', 'propiedad', 'campo']));
                const valor = String(obtenerPropiedadFlexible(fila, ['valor', 'value', 'link', 'enlace', 'dato']) || '').trim();

                if (!clave || !valor) return;

                if (clave.includes('PREMIO')) PREMIO_LEALTAD = valor;
                else if (clave.includes('PUNTOS_META') || clave.includes('META')) PUNTOS_META_PREMIO = parseInt(valor, 10) || 100;
                else if (clave.includes('ESCALA')) ESCALA_PUNTOS_COMPRA = valor;
                else if (clave.includes('MERCADOPAGO') || clave.includes('MP')) LINK_MERCADOPAGO = valor;
                else if (clave.includes('CLABE')) CLABE_BANCARIA = valor;
                else if (clave.includes('TITULAR') || clave.includes('BANCO')) BANCO_TITULAR = valor;
                
                else if (clave.includes('FACEBOOK') || clave.includes('FB')) LINK_FACEBOOK = valor;
                else if (clave.includes('INSTAGRAM') || clave.includes('IG')) LINK_INSTAGRAM = valor;
                else if (clave.includes('MAPS') || clave.includes('GOOGLE') || clave.includes('UBICACION') || clave.includes('OPINION')) LINK_GOOGLE_MAPS = valor;
                else if (clave.includes('WHATSAPP') || clave.includes('WA')) LINK_WHATSAPP_DIRECTO = valor;
            });

            renderizarRedesSocialesFooter();
        }
    } catch (e) {
        renderizarRedesSocialesFooter();
    }
}

function renderizarRedesSocialesFooter() {
    const waLink = LINK_WHATSAPP_DIRECTO || `https://wa.me/${NUMERO_WHATSAPP}`;
    const mapsLink = LINK_GOOGLE_MAPS || "https://maps.google.com";
    
    const pcContainer = document.getElementById('footerSocialIconsDesktop');
    if (pcContainer) {
        pcContainer.innerHTML = `
            ${LINK_FACEBOOK ? `<a href="${LINK_FACEBOOK}" target="_blank" class="social-pill-btn" style="background:#1877F2;"><i class="fa-brands fa-facebook-f"></i> Facebook</a>` : ''}
            ${LINK_INSTAGRAM ? `<a href="${LINK_INSTAGRAM}" target="_blank" class="social-pill-btn" style="background:linear-gradient(45deg, #F58529, #DD2A7B, #8134AF);"><i class="fa-brands fa-instagram"></i> Instagram</a>` : ''}
            <a href="${mapsLink}" target="_blank" class="social-pill-btn" style="background:#EA4335;"><i class="fa-solid fa-location-dot"></i> Opiniones en Google Maps</a>
            <a href="${waLink}" target="_blank" class="social-pill-btn" style="background:#25D366;"><i class="fa-brands fa-whatsapp"></i> WhatsApp Directo</a>
        `;
    }

    const mobileContainer = document.getElementById('footerSocialIconsMobile');
    if (mobileContainer) {
        mobileContainer.innerHTML = `
            ${LINK_FACEBOOK ? `<a href="${LINK_FACEBOOK}" target="_blank" class="social-modal-card-btn" style="background:#1877F2;"><i class="fa-brands fa-facebook-f"></i> <span>Síguenos en Facebook</span></a>` : ''}
            ${LINK_INSTAGRAM ? `<a href="${LINK_INSTAGRAM}" target="_blank" class="social-modal-card-btn" style="background:linear-gradient(45deg, #F58529, #DD2A7B, #8134AF);"><i class="fa-brands fa-instagram"></i> <span>Síguenos en Instagram</span></a>` : ''}
            <a href="${mapsLink}" target="_blank" class="social-modal-card-btn" style="background:#EA4335;"><i class="fa-solid fa-location-dot"></i> <span>Califícanos en Google Maps</span></a>
            <a href="${waLink}" target="_blank" class="social-modal-card-btn" style="background:#25D366;"><i class="fa-brands fa-whatsapp"></i> <span>Escríbenos por WhatsApp</span></a>
        `;
    }
}

function abrirModalRedesMovil() {
    const modal = document.getElementById('socialModalOverlay');
    if (modal) {
        modal.classList.add('active');
        modal.style.display = 'flex';
    }
}

function cerrarModalRedesMovil() {
    const modal = document.getElementById('socialModalOverlay');
    if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
    }
}

async function cargarMenuDesdeWebApp() {
    try {
        const respuesta = await fetch(`${WEB_APP_URL}?sheet=Productos`);
        const productos = await respuesta.json();

        if (!Array.isArray(productos) || productos.length === 0) {
            throw new Error("No se pudieron obtener los productos.");
        }

        productosGlobales = productos;
        const diaHoy = DIAS_SEMANA[new Date().getDay()];

        const productosHoy = productos.filter(p => {
            const diasConfig = limpiarTexto(obtenerPropiedadFlexible(p, ['dias_disponible', 'dias', 'diasdisponible']));
            if (!diasConfig || diasConfig === 'TODOS' || diasConfig === '') return true;
            return diasConfig.includes(diaHoy);
        });

        renderizarGaleriaPromos(productosHoy);
        renderizarMenu(productosHoy.length > 0 ? productosHoy : productos);
        iniciarNavegacionScroll();
    } catch (error) {
        document.getElementById('menu-sections-container').innerHTML = `
            <div style="text-align:center; padding:50px 20px;">
                <p style="color:#D32F2F; font-weight:700; font-size:1.1rem;">⚠️ No se pudo cargar el menú en la nube.</p>
                <small style="color:#666;">Verifica la conexión con tu Google Apps Script.</small>
            </div>
        `;
    }
}

// ======================================================
// 2. CARRUSEL DE PROMOS
// ======================================================
function renderizarGaleriaPromos(productos) {
    const bannerContainer = document.getElementById('heroBannerContainer');
    const sliderTrack = document.getElementById('bannerSliderTrack');
    const dotsContainer = document.getElementById('promoDotsContainer');
    if (!bannerContainer || !sliderTrack || !dotsContainer) return;

    if (temporizadorAutoplayBanner) clearInterval(temporizadorAutoplayBanner);

    bannersPromoActivos = productos.filter(p => {
        const esDestacado = limpiarTexto(obtenerPropiedadFlexible(p, ['destacado_banner', 'destacado', 'banner'])) === 'SI';
        const estaDisp = limpiarTexto(obtenerPropiedadFlexible(p, ['disponible', 'activo'])) === 'SI';
        const imgBanner = obtenerPropiedadFlexible(p, ['imagen_banner', 'img_banner', 'banner_img', 'banner_imagen']);
        return esDestacado && estaDisp && imgBanner && imgBanner.trim() !== '';
    });

    if (bannersPromoActivos.length === 0) {
        bannerContainer.style.display = 'none';
        return;
    }

    sliderTrack.innerHTML = '';
    dotsContainer.innerHTML = '';
    indiceBannerActual = 0;

    bannersPromoActivos.forEach((prod, idx) => {
        const imgBanner = obtenerPropiedadFlexible(prod, ['imagen_banner', 'img_banner', 'banner_img', 'banner_imagen']);
        const tituloPromo = obtenerPropiedadFlexible(prod, ['titulo_promo', 'promo_titulo', 'titulo_banner', 'promo']) || prod.nombre;
        const esPorMonto = limpiarTexto(obtenerPropiedadFlexible(prod, ['venta_por_monto', 'por_monto'])) === 'SI';
        const precioDisplay = esPorMonto ? 'A Granel' : `$${parseFloat(prod.precio || 0).toFixed(2)}`;

        const slide = document.createElement('div');
        slide.className = 'promo-slide';
        slide.onclick = () => abrirModalPersonalizacion(prod.id);

        slide.innerHTML = `
            <img src="${imgBanner}" alt="${prod.nombre}" class="promo-banner-image">
            <div class="promo-slide-overlay">
                <div class="promo-slide-info">
                    <h4>${tituloPromo}</h4>
                    <p>${prod.nombre} | ${precioDisplay}</p>
                </div>
                <button type="button" class="btn-promo-action">
                    <i class="fa-solid fa-cart-plus"></i> Pedir Promo
                </button>
            </div>
        `;
        sliderTrack.appendChild(slide);

        const dot = document.createElement('div');
        dot.className = `promo-dot ${idx === 0 ? 'active' : ''}`;
        dot.onclick = () => irAlBanner(idx);
        dotsContainer.appendChild(dot);
    });

    bannerContainer.style.display = 'block';
    actualizarPosicionSlider();

    if (bannersPromoActivos.length > 1) {
        temporizadorAutoplayBanner = setInterval(() => {
            moverBannerManual(1);
        }, 4500);
    }
}

function moverBannerManual(direccion) {
    if (bannersPromoActivos.length <= 1) return;
    indiceBannerActual += direccion;
    if (indiceBannerActual >= bannersPromoActivos.length) indiceBannerActual = 0;
    else if (indiceBannerActual < 0) indiceBannerActual = bannersPromoActivos.length - 1;
    actualizarPosicionSlider();
}

function irAlBanner(indice) {
    indiceBannerActual = indice;
    actualizarPosicionSlider();
}

function actualizarPosicionSlider() {
    const sliderTrack = document.getElementById('bannerSliderTrack');
    const dots = document.querySelectorAll('.promo-dot');
    if (!sliderTrack) return;

    sliderTrack.style.transform = `translateX(-${indiceBannerActual * 100}%)`;
    dots.forEach((dot, idx) => {
        if (idx === indiceBannerActual) dot.classList.add('active');
        else dot.classList.remove('active');
    });
}

function renderizarMenu(productos) {
    const navContainer = document.getElementById('nav-categories-container');
    const sectionsContainer = document.getElementById('menu-sections-container');

    const categorias = {};
    productos.forEach(p => {
        const catId = p.categoria_id || 'otros';
        if (!categorias[catId]) {
            categorias[catId] = {
                id: catId,
                nombre: p.categoria_nombre || catId,
                emoji: p.categoria_emoji || '🍿',
                color: p.categoria_color || 'color-pink',
                productos: []
            };
        }
        categorias[catId].productos.push(p);
    });

    navContainer.innerHTML = '';
    let primeraCat = true;
    Object.values(categorias).forEach(cat => {
        const btn = document.createElement('button');
        btn.className = `nav-btn ${primeraCat ? 'active' : ''}`;
        btn.setAttribute('data-target', cat.id);
        btn.innerHTML = `${cat.emoji} <span class="nav-btn-text ${cat.color}">${cat.nombre}</span>`;
        navContainer.appendChild(btn);
        primeraCat = false;
    });

    sectionsContainer.innerHTML = '';
    Object.values(categorias).forEach(cat => {
        const section = document.createElement('section');
        section.id = cat.id;
        section.className = 'menu-section';

        let cardsHTML = '';
        cat.productos.forEach(prod => {
            const estaDisponible = limpiarTexto(obtenerPropiedadFlexible(prod, ['disponible', 'activo'])) === 'SI';
            const esPorMonto = limpiarTexto(obtenerPropiedadFlexible(prod, ['venta_por_monto', 'por_monto'])) === 'SI';
            const precioDisplay = esPorMonto ? 'A Granel' : `$${parseFloat(prod.precio || 0).toFixed(2)}`;

            cardsHTML += `
                <div class="card ${!estaDisponible ? 'agotado' : ''}" onclick="manejarClicTarjeta(${prod.id}, ${estaDisponible})">
                    ${!estaDisponible ? '<div class="badge-agotado">Agotado</div>' : ''}
                    <div class="card-img-placeholder" style="background-image: url('${prod.imagen || 'images/exhibidor_botanas.jpg'}');"></div>
                    <div class="card-body">
                        <h3>${prod.nombre}</h3>
                        <p class="card-desc">${prod.descripcion || ''}</p>
                        <div class="card-footer">
                            <span class="price">${precioDisplay}</span>
                            <button class="btn-add ${!estaDisponible ? 'disabled' : ''}">
                                <i class="fa-solid fa-cart-plus"></i> ${estaDisponible ? 'Pedir' : 'Agotado'}
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });

        section.innerHTML = `
            <div class="section-header">
                <h2>${cat.emoji} <span class="section-title ${cat.color}">${cat.nombre}</span></h2>
                <p>Elige tu botana favorita y personalízala a tu gusto.</p>
            </div>
            <div class="grid-container">
                ${cardsHTML}
            </div>
        `;
        sectionsContainer.appendChild(section);
    });
}

function manejarClicTarjeta(productoId, estaDisponible) {
    if (!estaDisponible) return;
    abrirModalPersonalizacion(productoId);
}

// ======================================================
// 3. MODAL Y PERSONALIZACIÓN
// ======================================================
function abrirModalPersonalizacion(productoId) {
    const prod = productosGlobales.find(p => p.id == productoId);
    if (!prod || limpiarTexto(obtenerPropiedadFlexible(prod, ['disponible', 'activo'])) !== 'SI') return;

    productoSeleccionado = prod;
    const esPorMonto = limpiarTexto(obtenerPropiedadFlexible(prod, ['venta_por_monto', 'por_monto'])) === 'SI';

    document.getElementById('modalProductTitle').textContent = prod.nombre;
    document.getElementById('modalProductDesc').textContent = prod.descripcion || '';
    document.getElementById('modalProductPrice').textContent = esPorMonto ? '$20.00' : `$${parseFloat(prod.precio || 0).toFixed(2)}`;

    const rawMax = obtenerPropiedadFlexible(prod, ['max_ingredientes', 'maxingredientes', 'limite_ingredientes', 'max']);
    const numMax = parseInt(String(rawMax).trim(), 10);
    limiteIngredientesActual = (!isNaN(numMax) && numMax > 0) ? numMax : 0;

    const amountGroup = document.getElementById('modalAmountGroup');
    if (esPorMonto) {
        amountGroup.style.display = 'block';
        montoMinimoActual = parseFloat(obtenerPropiedadFlexible(prod, ['monto_minimo', 'minimo', 'montominimo']) || '10');
        renderizarPillsMontoDinámicas(obtenerPropiedadFlexible(prod, ['montos_sugeridos', 'montos']), montoMinimoActual);
    } else {
        amountGroup.style.display = 'none';
    }

    const baseNombre = obtenerPropiedadFlexible(prod, ['grupo_base_nombre', 'base_nombre']) || 'Selecciona tu Base';
    const baseOpciones = obtenerPropiedadFlexible(prod, ['grupo_base_opciones', 'base_opciones', 'bases']);

    const ingNombre = obtenerPropiedadFlexible(prod, ['grupo_ingredientes_nombre', 'ingredientes_nombre', 'grupo_ingrediente_nombre']) || '¿Qué ingredientes le ponemos?';
    const ingOpciones = obtenerPropiedadFlexible(prod, ['grupo_ingredientes_opciones', 'ingredientes_opciones', 'grupo_ingrediente_opciones', 'ingredientes']);

    const extrasNombre = obtenerPropiedadFlexible(prod, ['grupo_extras_nombre', 'extras_nombre', 'grupo_extra_nombre']) || '🧀 Extras / Toppings Adicionales';
    const extrasOpciones = obtenerPropiedadFlexible(prod, ['grupo_extras_opciones', 'extras_opciones', 'grupo_extra_opciones', 'extras']);

    const salsaNombre = obtenerPropiedadFlexible(prod, ['grupo_salsas_nombre', 'salsa_nombre', 'grupo_salsa_nombre']) || 'Selecciona tu Salsa';
    const salsaOpciones = obtenerPropiedadFlexible(prod, ['grupo_salsas_opciones', 'salsas_opciones', 'grupo_salsa_opciones', 'salsas']);

    renderizarOpcionesModal('modalBaseGroup', 'modalBaseTitle', 'modalBaseOptions', baseNombre, baseOpciones, 'radio', 'grupo_base');
    renderizarOpcionesModal('modalIngredientsGroup', 'modalIngredientsTitle', 'modalIngredientsOptions', ingNombre, ingOpciones, 'checkbox', 'grupo_ing');
    renderizarOpcionesModal('modalExtrasGroup', 'modalExtrasTitle', 'modalExtrasOptions', extrasNombre, extrasOpciones, 'checkbox_extras', 'grupo_extras');
    renderizarOpcionesModal('modalSaucesGroup', 'modalSaucesTitle', 'modalSaucesOptions', salsaNombre, salsaOpciones, 'radio', 'grupo_salsa');

    actualizarBadgeLimiteIngredientes(0);
    actualizarPrecioEnVivoModal();

    document.getElementById('productModal').classList.add('active');
}

function renderizarPillsMontoDinámicas(montosConfig, montoMinimo) {
    const pillsContainer = document.getElementById('modalAmountPills');
    const inputCustom = document.getElementById('modalCustomAmount');
    const hintMin = document.getElementById('modalMinAmountMsg');
    if (!pillsContainer) return;

    let listaMontos = [20, 30, 50, 100];
    if (montosConfig && String(montosConfig).trim() !== '') {
        listaMontos = String(montosConfig).split(',').map(m => parseFloat(m.trim())).filter(m => !isNaN(m));
    }

    montoSeleccionadoActual = listaMontos[0] || montoMinimo;
    document.getElementById('modalProductPrice').textContent = `$${montoSeleccionadoActual.toFixed(2)}`;

    pillsContainer.innerHTML = '';
    listaMontos.forEach((monto, idx) => {
        const pill = document.createElement('button');
        pill.type = 'button';
        pill.className = `amount-pill ${idx === 0 ? 'active' : ''}`;
        pill.textContent = `$${monto}`;
        pill.onclick = () => {
            montoSeleccionadoActual = monto;
            document.getElementById('modalCustomWrapper').style.display = 'none';
            document.getElementById('modalProductPrice').textContent = `$${monto.toFixed(2)}`;
            hintMin.textContent = '';
            actualizarClasesPills();
            actualizarPrecioEnVivoModal();
        };
        pillsContainer.appendChild(pill);
    });

    const pillOtro = document.createElement('button');
    pillOtro.type = 'button';
    pillOtro.className = 'amount-pill';
    pillOtro.textContent = 'Otro ✏️';
    pillOtro.onclick = () => {
        const customWrapper = document.getElementById('modalCustomWrapper');
        customWrapper.style.display = 'flex';
        inputCustom.min = montoMinimo;
        inputCustom.value = montoSeleccionadoActual;
        inputCustom.focus();
        hintMin.textContent = `* Cantidad mínima: $${montoMinimo.toFixed(2)}`;
        actualizarClasesPills();
    };
    pillsContainer.appendChild(pillOtro);

    inputCustom.oninput = () => {
        const val = parseFloat(inputCustom.value) || 0;
        montoSeleccionadoActual = val;
        document.getElementById('modalProductPrice').textContent = `$${val.toFixed(2)}`;
        if (val < montoMinimo) hintMin.textContent = `⚠️ El monto mínimo es de $${montoMinimo.toFixed(2)}`;
        else hintMin.textContent = '';
        actualizarPrecioEnVivoModal();
    };
}

function actualizarClasesPills() {
    const pills = document.querySelectorAll('.amount-pill');
    pills.forEach(p => p.classList.remove('active'));
    pills.forEach(p => {
        if (p.textContent === `$${montoSeleccionadoActual}` || (p.textContent.includes('Otro') && document.getElementById('modalCustomWrapper').style.display === 'flex')) {
            p.classList.add('active');
        }
    });
}

function renderizarOpcionesModal(groupId, titleId, containerId, nombreGrupo, opcionesTexto, inputType, inputName) {
    const groupEl = document.getElementById(groupId);
    const titleEl = document.getElementById(titleId);
    const containerEl = document.getElementById(containerId);

    if (!opcionesTexto || String(opcionesTexto).trim() === '') {
        groupEl.style.display = 'none';
        containerEl.innerHTML = '';
        return;
    }

    groupEl.style.display = 'block';
    titleEl.textContent = nombreGrupo || 'Selecciona tus opciones';

    const opciones = String(opcionesTexto).split(',').map(o => o.trim()).filter(o => o.length > 0);
    containerEl.innerHTML = '';

    let searchInput = groupEl.querySelector('.modal-search-input');
    if (opciones.length > 8) {
        if (!searchInput) {
            searchInput = document.createElement('input');
            searchInput.type = 'text';
            searchInput.className = 'modal-search-input';
            searchInput.placeholder = '🔍 Buscar opción...';
            groupEl.insertBefore(searchInput, containerEl);
        }
        searchInput.value = '';
        searchInput.style.display = 'block';

        searchInput.oninput = (e) => {
            const query = e.target.value.toLowerCase();
            const chips = containerEl.querySelectorAll('.option-chip');
            chips.forEach(chip => {
                const text = chip.querySelector('span').textContent.toLowerCase();
                chip.style.display = text.includes(query) ? 'flex' : 'none';
            });
        };
    } else if (searchInput) {
        searchInput.style.display = 'none';
    }

    opciones.forEach((op, index) => {
        const parsed = parsearExtraConCosto(op);
        const chipDiv = document.createElement('div');
        chipDiv.className = 'option-chip';
        chipDiv.setAttribute('data-value', parsed.nombreLimpio);
        chipDiv.setAttribute('data-costo', parsed.costoExtra);

        const realInputType = inputType.startsWith('checkbox') ? 'checkbox' : 'radio';
        const isRadioDefault = (realInputType === 'radio' && index === 0);
        if (isRadioDefault) chipDiv.classList.add('selected');

        chipDiv.innerHTML = `
            <input type="${realInputType}" name="${inputName}" value="${parsed.nombreLimpio}" ${isRadioDefault ? 'checked' : ''} style="pointer-events:none;">
            <span>${op}</span>
        `;

        chipDiv.onclick = (e) => {
            e.preventDefault();
            toggleOpcion(containerId, chipDiv, inputType);
        };

        containerEl.appendChild(chipDiv);
    });
}

function toggleOpcion(containerId, chipDiv, inputType) {
    const container = document.getElementById(containerId);
    const input = chipDiv.querySelector('input');

    if (inputType === 'radio') {
        const allChips = container.querySelectorAll('.option-chip');
        allChips.forEach(c => {
            c.classList.remove('selected');
            c.querySelector('input').checked = false;
        });
        chipDiv.classList.add('selected');
        input.checked = true;
        actualizarPrecioEnVivoModal();
        return;
    }

    if (chipDiv.classList.contains('disabled') && !input.checked) return;

    input.checked = !input.checked;
    if (input.checked) chipDiv.classList.add('selected');
    else chipDiv.classList.remove('selected');

    if (containerId === 'modalIngredientsOptions') recalcularLimiteIngredientes();
    actualizarPrecioEnVivoModal();
}

function recalcularLimiteIngredientes() {
    const container = document.getElementById('modalIngredientsOptions');
    if (!container) return;

    const chips = Array.from(container.querySelectorAll('.option-chip'));
    const seleccionados = chips.filter(c => c.querySelector('input').checked);
    const total = seleccionados.length;

    actualizarBadgeLimiteIngredientes(total);

    if (limiteIngredientesActual > 0) {
        if (total >= limiteIngredientesActual) {
            chips.forEach(c => {
                const cb = c.querySelector('input');
                if (!cb.checked) c.classList.add('disabled');
                else c.classList.remove('disabled');
            });
        } else {
            chips.forEach(c => c.classList.remove('disabled'));
        }
    } else {
        chips.forEach(c => c.classList.remove('disabled'));
    }
}

function actualizarBadgeLimiteIngredientes(actuales) {
    const badge = document.getElementById('modalIngredientsLimitBadge');
    if (!badge) return;

    if (limiteIngredientesActual > 0) {
        badge.style.display = 'inline-block';
        badge.textContent = `${actuales} de ${limiteIngredientesActual} permitidos`;
        badge.className = actuales >= limiteIngredientesActual ? 'limit-badge complete' : 'limit-badge';
    } else {
        badge.style.display = 'none';
    }
}

function actualizarPrecioEnVivoModal() {
    if (!productoSeleccionado) return;

    const esPorMonto = limpiarTexto(obtenerPropiedadFlexible(productoSeleccionado, ['venta_por_monto', 'por_monto'])) === 'SI';
    let basePrice = esPorMonto ? montoSeleccionadoActual : parseFloat(productoSeleccionado.precio || 0);

    let extraCost = 0;
    const chipsExtras = document.querySelectorAll('#modalExtrasOptions .option-chip');
    chipsExtras.forEach(chip => {
        const input = chip.querySelector('input');
        if (input && input.checked) extraCost += parseFloat(chip.getAttribute('data-costo') || 0);
    });

    const finalPrice = basePrice + extraCost;
    const btnPriceEl = document.getElementById('modalBtnLivePrice');
    if (btnPriceEl) btnPriceEl.textContent = `$${finalPrice.toFixed(2)}`;
}

function cerrarModal() {
    document.getElementById('productModal').classList.remove('active');
    productoSeleccionado = null;
}

function confirmarAgregarAlCarrito() {
    if (!productoSeleccionado) return;

    const esPorMonto = limpiarTexto(obtenerPropiedadFlexible(productoSeleccionado, ['venta_por_monto', 'por_monto'])) === 'SI';
    let basePrice = esPorMonto ? montoSeleccionadoActual : parseFloat(productoSeleccionado.precio || 0);

    if (esPorMonto && (isNaN(montoSeleccionadoActual) || montoSeleccionadoActual < montoMinimoActual)) {
        alert(`El monto mínimo para este producto es de $${montoMinimoActual.toFixed(2)}`);
        return;
    }

    const baseSeleccionada = document.querySelector('#modalBaseOptions input[type="radio"]:checked')?.value || '';
    const ingredientesSeleccionados = Array.from(document.querySelectorAll('#modalIngredientsOptions input[type="checkbox"]:checked')).map(cb => cb.value);
    const salsaSeleccionada = document.querySelector('#modalSaucesOptions input[type="radio"]:checked')?.value || '';

    let extraCostTotal = 0;
    let extrasDetalle = [];
    const chipsExtras = document.querySelectorAll('#modalExtrasOptions .option-chip');
    chipsExtras.forEach(chip => {
        const input = chip.querySelector('input');
        if (input && input.checked) {
            const cost = parseFloat(chip.getAttribute('data-costo') || 0);
            extraCostTotal += cost;
            extrasDetalle.push(cost > 0 ? `${chip.getAttribute('data-value')} (+$${cost})` : chip.getAttribute('data-value'));
        }
    });

    if (limiteIngredientesActual > 0 && ingredientesSeleccionados.length === 0) {
        alert(`Por favor elige al menos 1 ingrediente para tu orden.`);
        return;
    }

    const estacion = obtenerPropiedadFlexible(productoSeleccionado, ['estacion_cocina', 'estacion']) || 'CALIENTE';

    carrito.push({
        id_unico: Date.now() + Math.random(),
        nombre: productoSeleccionado.nombre,
        precio: basePrice + extraCostTotal,
        base: baseSeleccionada,
        ingredientes: ingredientesSeleccionados,
        extras: extrasDetalle,
        salsa: salsaSeleccionada,
        estacion: estacion,
        esPorMonto: esPorMonto
    });

    actualizarBarraPildoraCarrito();
    cerrarModal();
}

// ======================================================
// 4. RENDERIZADO DE BARRA PÍLDORA HÍBRIDA (OPCIÓN A + B)
// ======================================================
function actualizarBarraPildoraCarrito() {
    const totalCount = carrito.length;
    const totalPrice = carrito.reduce((sum, item) => sum + item.precio, 0);

    const barEl = document.getElementById('cartBar');
    const badgeEl = document.getElementById('cartCountBadge');
    const totalDisplayEl = document.getElementById('cartTotalDisplay');
    const chipsContainer = document.getElementById('cartMiniChipsContainer');

    if (!barEl) return;

    if (totalCount === 0) {
        barEl.style.display = 'none';
        return;
    }

    barEl.style.display = 'flex';
    if (badgeEl) badgeEl.textContent = totalCount;
    if (totalDisplayEl) totalDisplayEl.textContent = `$${totalPrice.toFixed(2)}`;

    if (chipsContainer) {
        chipsContainer.innerHTML = carrito.slice(-3).map(item => `
            <span class="mini-snack-chip">
                🍿 ${item.nombre.length > 14 ? item.nombre.substring(0, 12) + '...' : item.nombre}
            </span>
        `).join('');
    }
}

// ======================================================
// 5. UPSELLING & CHECKOUT
// ======================================================
function iniciarFlujoCheckout() {
    if (carrito.length === 0) {
        alert("¡Tu pedido está vacío! Elige una botana para comenzar.");
        return;
    }

    const upsellCandidates = productosGlobales.filter(p => {
        const esUp = limpiarTexto(obtenerPropiedadFlexible(p, ['es_upsell', 'upsell'])) === 'SI';
        const estaDisp = limpiarTexto(obtenerPropiedadFlexible(p, ['disponible', 'activo'])) === 'SI';
        const yaEnCarrito = carrito.some(item => item.nombre === p.nombre);
        return esUp && estaDisp && !yaEnCarrito;
    });

    if (upsellCandidates.length > 0) mostrarModalUpsell(upsellCandidates);
    else abrirModalCheckout();
}

function mostrarModalUpsell(candidatos) {
    const list = document.getElementById('upsellItemsList');
    if (!list) {
        abrirModalCheckout();
        return;
    }

    list.innerHTML = '';
    candidatos.slice(0, 3).forEach(prod => {
        const card = document.createElement('div');
        card.className = 'upsell-card';
        card.innerHTML = `
            <div class="upsell-info">
                <strong>${prod.nombre}</strong>
                <span>+$${parseFloat(prod.precio || 0).toFixed(2)}</span>
            </div>
            <button class="btn-add-upsell" onclick="agregarUpsellDirecto(${prod.id})">
                + Agregar
            </button>
        `;
        list.appendChild(card);
    });

    document.getElementById('upsellModal').classList.add('active');
}

function agregarUpsellDirecto(prodId) {
    const prod = productosGlobales.find(p => p.id == prodId);
    if (prod) {
        carrito.push({
            id_unico: Date.now() + Math.random(),
            nombre: prod.nombre,
            precio: parseFloat(prod.precio || 0),
            base: '',
            ingredientes: [],
            extras: [],
            salsa: '',
            estacion: obtenerPropiedadFlexible(prod, ['estacion_cocina', 'estacion']) || 'FRIA',
            esPorMonto: false
        });
        actualizarBarraPildoraCarrito();
    }
    cerrarUpsellYAbrirCheckout();
}

function cerrarUpsellYAbrirCheckout() {
    document.getElementById('upsellModal').classList.remove('active');
    abrirModalCheckout();
}

// ======================================================
// 6. CONSULTA DE PUNTOS
// ======================================================
function abrirModalConsultaLealtad() {
    document.getElementById('loyaltyQueryResult').style.display = 'none';
    document.getElementById('queryPhoneInput').value = '';
    document.getElementById('loyaltyQueryModal').classList.add('active');
}

function cerrarModalConsultaLealtad() {
    document.getElementById('loyaltyQueryModal').classList.remove('active');
}

async function consultarSellosEnSheets() {
    const tel = document.getElementById('queryPhoneInput').value.trim().replace(/\D/g, '');
    if (!tel || tel.length < 10) {
        alert("Por favor ingresa tu número de celular a 10 dígitos.");
        return;
    }

    try {
        const res = await fetch(`${WEB_APP_URL}?sheet=Clientes_Lealtad&action=search&telefono=${tel}`);
        const data = await res.json();
        
        let puntos = 0;
        let nombre = 'Cliente';
        const infoCuatri = obtenerInfoCuatrimestreActual();

        if (Array.isArray(data) && data.length > 0) {
            const c = data[0];
            const cuatriCliente = String(c.cuatrimestre_vigente || '').trim();
            
            if (cuatriCliente === infoCuatri.id) {
                puntos = parseInt(c.puntos_acumulados || '0', 10);
            } else {
                puntos = 0;
            }
            nombre = c.nombre || 'Cliente';
        }

        const container = document.getElementById('queryStampsContainer');
        container.innerHTML = `
            <div style="text-align:center; padding:10px 0; width:100%;">
                <div style="font-size:2.4rem; font-weight:800; color:#E91E63;">⭐ ${puntos} <span style="font-size:1.1rem; color:#6B7280;">/ ${PUNTOS_META_PREMIO} pts</span></div>
                <small style="color:#4B5563; display:block; margin-top:4px;">Periodo: <strong>${infoCuatri.nombre}</strong> (Vence: ${infoCuatri.vence})</small>
            </div>
        `;

        const porcentaje = Math.min(100, Math.round((puntos / PUNTOS_META_PREMIO) * 100));
        document.getElementById('queryProgressBar').style.width = `${porcentaje}%`;
        document.getElementById('queryProgressText').textContent = puntos >= PUNTOS_META_PREMIO 
            ? `🎉 ¡Felicidades ${nombre}! Alcanzaste la meta. Recompensa disponible: ${PREMIO_LEALTAD}.` 
            : `Hola ${nombre}, llevas ${puntos} de ${PUNTOS_META_PREMIO} puntos acumulados en este cuatrimestre.`;

        document.getElementById('loyaltyQueryResult').style.display = 'block';
    } catch (e) {
        alert("No se pudo consultar el saldo en este momento.");
    }
}

// ======================================================
// 7. CHECKOUT & GENERACIÓN DINÁMICA
// ======================================================
function abrirModalCheckout() {
    if (carrito.length === 0) {
        alert("¡Tu pedido está vacío! Elige una botana para comenzar.");
        return;
    }

    const itemsContainer = document.getElementById('checkoutItemsList');
    itemsContainer.innerHTML = '';
    let total = 0;

    carrito.forEach((item, index) => {
        total += item.precio;
        const div = document.createElement('div');
        div.className = 'checkout-item';
        
        let extras = [];
        if (item.base) extras.push(`Base: ${item.base}`);
        if (item.ingredientes.length > 0) extras.push(`Con: ${item.ingredientes.join(', ')}`);
        if (item.extras && item.extras.length > 0) extras.push(`Extras: ${item.extras.join(', ')}`);
        if (item.salsa) extras.push(`Salsa: ${item.salsa}`);

        div.innerHTML = `
            <div class="checkout-item-details">
                <strong>${item.nombre}</strong>
                <p>${extras.join(' | ') || 'Clásico'}</p>
            </div>
            <div style="display:flex; align-items:center;">
                <span class="checkout-item-price">$${item.precio.toFixed(2)}</span>
                <button type="button" class="btn-remove-item" onclick="eliminarDelCarrito(${index})">&times;</button>
            </div>
        `;
        itemsContainer.appendChild(div);
    });

    document.getElementById('checkoutTotalPrice').textContent = `$${total.toFixed(2)}`;

    const loyaltyBox = document.getElementById('loyaltyCheckoutBox');
    const phoneInput = document.getElementById('clientPhoneInput');
    const phoneHint = document.getElementById('loyaltyPhoneHint');

    const puntosEstimados = calcularPuntosPorMonto(total);
    const infoCuatri = obtenerInfoCuatrimestreActual();

    if (puntosEstimados > 0) {
        loyaltyBox.style.display = 'block';
        loyaltyBox.innerHTML = `
            <strong style="color:#854D0E;">⭐ ¡Esta compra suma +${puntosEstimados} PUNTOS de Lealtad!</strong><br>
            <small style="color:#A16207;">Válidos para el <strong>${infoCuatri.nombre}</strong> (Meta: ${PUNTOS_META_PREMIO} pts = ${PREMIO_LEALTAD}).</small>
        `;
        phoneInput.required = true;
        phoneHint.textContent = "* Ingresa tu celular a 10 dígitos para abonar tus puntos.";
    } else {
        loyaltyBox.style.display = 'none';
        phoneInput.required = false;
        phoneHint.textContent = "(Opcional para consumo en tienda)";
    }

    document.getElementById('checkoutModal').classList.add('active');
}

function cerrarModalCheckout() {
    document.getElementById('checkoutModal').classList.remove('active');
}

function eliminarDelCarrito(index) {
    carrito.splice(index, 1);
    actualizarBarraPildoraCarrito();
    if (carrito.length === 0) cerrarModalCheckout();
    else abrirModalCheckout();
}

function cambiarTipoPedido(tipo) {
    const storeLabel = document.getElementById('typeStoreLabel');
    const pickupLabel = document.getElementById('typePickupLabel');

    if (tipo === 'tienda') {
        storeLabel.classList.add('active');
        pickupLabel.classList.remove('active');
    } else {
        pickupLabel.classList.add('active');
        storeLabel.classList.remove('active');
    }
}

async function obtenerSiguienteTurnoGlobal(tipo) {
    const prefijo = tipo === 'tienda' ? 'T' : 'R';
    
    if (!WEB_APP_URL || WEB_APP_URL.includes("TU_SCRIPT_ID")) {
        const rnd = Math.floor(Math.random() * 90 + 10);
        return `#${prefijo}-${rnd}`;
    }

    try {
        const res = await fetch(`${WEB_APP_URL}?sheet=Ventas_Historicas`);
        const ventas = await res.json();

        if (Array.isArray(ventas) && ventas.length > 0) {
            let maxConsecutivo = 0;
            const regexTurno = new RegExp(`^#?${prefijo}-(\\d+)`, 'i');

            ventas.forEach(v => {
                const turnoStr = String(v.turno || '').trim();
                const match = turnoStr.match(regexTurno);
                if (match && match[1]) {
                    const num = parseInt(match[1], 10);
                    if (!isNaN(num) && num > maxConsecutivo) maxConsecutivo = num;
                }
            });

            const siguiente = maxConsecutivo + 1;
            const formateado = siguiente < 10 ? `0${siguiente}` : `${siguiente}`;
            return `#${prefijo}-${formateado}`;
        }
    } catch (e) {
        console.warn("Usando respaldo de turno:", e);
    }

    const horaFallback = new Date().getMinutes();
    const segFallback = new Date().getSeconds();
    return `#${prefijo}-${horaFallback}${segFallback}`;
}

async function procesarGeneracionTurno() {
    const nombreCliente = document.getElementById('clientNameInput').value.trim();
    if (!nombreCliente) {
        alert("Por favor ingresa tu nombre para identificar tu pedido.");
        return;
    }

    const tipoPedido = document.querySelector('input[name="orderType"]:checked').value;
    const telefonoCliente = document.getElementById('clientPhoneInput').value.trim().replace(/\D/g, '');
    const total = carrito.reduce((sum, item) => sum + item.precio, 0);
    const puntosGanados = calcularPuntosPorMonto(total);

    if (puntosGanados > 0 && (!telefonoCliente || telefonoCliente.length < 10)) {
        alert("Para acumular tus puntos de lealtad, por favor ingresa tu celular a 10 dígitos.");
        return;
    }

    const btnSubmit = document.getElementById('btnSubmitOrder');
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generando turno...';

    const numeroTurno = await obtenerSiguienteTurnoGlobal(tipoPedido);

    let infoPuntos = { puntosGanados: 0, puntosTotales: 0, premioDesbloqueado: false };
    if (puntosGanados > 0 && telefonoCliente.length === 10) {
        infoPuntos = await procesarPuntosEnGoogleSheets(telefonoCliente, nombreCliente, puntosGanados);
    }

    ultimoPedidoGenerado = {
        id_pedido: 'PED-' + Date.now(),
        turno: numeroTurno,
        tipo: tipoPedido,
        cliente: nombreCliente,
        telefono: telefonoCliente,
        items: [...carrito],
        total: total,
        estado: 'cola',
        pagado: tipoPedido === 'tienda',
        puntos: infoPuntos,
        fecha: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        fecha_completa: new Date().toISOString()
    };

    if (tipoPedido === 'recoger') {
        localStorage.setItem('engordadera_ultimo_pedido_activo', JSON.stringify(ultimoPedidoGenerado));
    }

    await respaldarVentaEnGoogleSheets(ultimoPedidoGenerado);

    btnSubmit.disabled = false;
    btnSubmit.innerHTML = '<i class="fa-solid fa-ticket"></i> Confirmar y Generar Turno';

    cerrarModalCheckout();
    mostrarBoletoTurno(ultimoPedidoGenerado);
}

async function procesarPuntosEnGoogleSheets(telefono, nombre, puntosGanados) {
    if (!WEB_APP_URL || WEB_APP_URL.includes("TU_SCRIPT_ID")) {
        return { puntosGanados: puntosGanados, puntosTotales: puntosGanados, premioDesbloqueado: false };
    }

    try {
        const payload = {
            action: 'procesar_puntos',
            sheet: 'Clientes_Lealtad',
            telefono: telefono,
            nombre: nombre,
            puntos_ganados: puntosGanados,
            meta_puntos: PUNTOS_META_PREMIO
        };

        const res = await fetch(WEB_APP_URL, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        return await res.json();
    } catch (err) {
        return { puntosGanados: puntosGanados, puntosTotales: puntosGanados, premioDesbloqueado: false };
    }
}

async function respaldarVentaEnGoogleSheets(pedido) {
    if (!WEB_APP_URL || WEB_APP_URL.includes("TU_SCRIPT_ID")) return;
    try {
        const payload = {
            action: 'insertar_venta',
            sheet: 'Ventas_Historicas',
            data: {
                turno: pedido.turno,
                cliente: pedido.cliente,
                telefono: pedido.telefono || '',
                tipo: pedido.tipo,
                total: pedido.total,
                pagado: pedido.pagado ? 'SI' : 'NO',
                fecha: pedido.fecha_completa,
                estado: 'cola',
                items_json: JSON.stringify(pedido.items),
                detalle: pedido.items.map(i => {
                    let txt = `${i.nombre} ($${i.precio})`;
                    if (i.extras && i.extras.length > 0) txt += ` [Extras: ${i.extras.join(', ')}]`;
                    return txt;
                }).join(' | ')
            }
        };

        await fetch(WEB_APP_URL, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    } catch (e) {
        console.error("Error al insertar venta en Sheets:", e);
    }
}

// ======================================================
// 8. PANTALLA DE BOLETO DIGITAL & PAGO EXACTO
// ======================================================
async function mostrarBoletoTurno(pedido, esRestaurado = false) {
    whatsappEnviadoConfirmado = false;
    const badgeType = document.getElementById('ticketBadgeType');
    const paymentAlert = document.getElementById('ticketPaymentAlert');
    const onlinePaymentCard = document.getElementById('onlinePaymentContainer');
    const loyaltyBanner = document.getElementById('ticketLoyaltyBanner');
    const btnClose = document.getElementById('btnTicketModalClose');
    const countdownEl = document.getElementById('kioskCountdown');
    const btnWa = document.getElementById('btnTicketWhatsApp');
    const btnFinish = document.getElementById('btnFinishOrder');
    const btnFinishText = document.getElementById('btnFinishText');
    const btnWaText = document.getElementById('btnWaText');

    document.getElementById('ticketNumberDisplay').textContent = pedido.turno;
    document.getElementById('ticketClientName').textContent = `Cliente: ${pedido.cliente}`;

    if (pedido.puntos && pedido.puntos.puntosGanados > 0) {
        loyaltyBanner.style.display = 'block';
        if (pedido.puntos.premioDesbloqueado) {
            loyaltyBanner.innerHTML = `
                <div class="reward-unlocked-card">
                    <h4>🎁 ¡RECOMPENSA DE PUNTOS DESBLOQUEADA!</h4>
                    <p>¡Felicidades! Has alcanzado la meta. <strong>Reclama en mostrador: ${PREMIO_LEALTAD}</strong>.</p>
                </div>
            `;
        } else {
            loyaltyBanner.innerHTML = `
                <div style="background:#FEF9C3; border:1px solid #FDE047; border-radius:10px; padding:8px; font-size:0.8rem; color:#854D0E;">
                    ⭐ <strong>¡Sumaste +${pedido.puntos.puntosGanados} puntos!</strong> Llevas <strong>${pedido.puntos.puntosTotales} de ${PUNTOS_META_PREMIO} puntos</strong> en este cuatrimestre.
                </div>
            `;
        }
    } else {
        loyaltyBanner.style.display = 'none';
    }

    if (pedido.tipo === 'tienda') {
        badgeType.textContent = '🏪 CONSUMO EN TIENDA';
        badgeType.className = 'ticket-badge badge-tienda';
        paymentAlert.className = 'ticket-payment-alert alert-tienda';
        paymentAlert.innerHTML = `
            <strong>💵 Pago en Mostrador:</strong><br>
            Pagarás <strong>$${pedido.total.toFixed(2)}</strong> al momento de recibir tus botanas preparadas.
        `;
        if (onlinePaymentCard) onlinePaymentCard.style.display = 'none';
        if (btnClose) btnClose.style.display = 'block';
        if (btnWaText) btnWaText.textContent = 'Enviar Pedido a WhatsApp';
        if (btnFinishText) btnFinishText.textContent = 'Terminar y Hacer Nuevo Pedido';
        
        iniciarCuentaRegresivaKiosko(20);
    } else {
        if (temporizadorKiosko) clearInterval(temporizadorKiosko);
        if (countdownEl) countdownEl.textContent = '';
        if (btnClose) btnClose.style.display = 'none';

        badgeType.textContent = '🛍️ PARA RECOGER';
        badgeType.className = 'ticket-badge badge-recoger';
        paymentAlert.className = 'ticket-payment-alert alert-recoger';
        paymentAlert.innerHTML = `
            <strong>⚠️ Pago Previo Requerido:</strong><br>
            Para iniciar tu orden, realiza tu pago exacto y envía el comprobante por WhatsApp.
        `;
        
        if (onlinePaymentCard) {
            onlinePaymentCard.style.display = 'block';
            document.getElementById('ticketGiantAmountDisplay').textContent = `$${pedido.total.toFixed(2)}`;
            document.getElementById('ticketMpTotal').textContent = `$${pedido.total.toFixed(2)}`;
            document.getElementById('bankTitularText').textContent = BANCO_TITULAR;
            document.getElementById('clabeNumberText').textContent = CLABE_BANCARIA;
            document.getElementById('transferConceptoTurno').textContent = pedido.turno;
        }

        if (btnWaText) btnWaText.textContent = '📲 Paso Final: Enviar Comprobante por WhatsApp';
        if (btnFinishText) btnFinishText.textContent = 'Ya envié mi comprobante (Cerrar)';

        solicitarLinkDinamicoMercadoPago(pedido);
    }

    document.getElementById('ticketModal').classList.add('active');
}

async function solicitarLinkDinamicoMercadoPago(pedido) {
    const btnMp = document.getElementById('btnMercadoPagoLink');
    const loadingHint = document.getElementById('mpLoadingHint');
    if (!btnMp) return;

    btnMp.href = LINK_MERCADOPAGO;
    if (loadingHint) loadingHint.style.display = 'block';

    if (!WEB_APP_URL || WEB_APP_URL.includes("TU_SCRIPT_ID")) {
        if (loadingHint) loadingHint.style.display = 'none';
        return;
    }

    try {
        const payload = {
            action: 'crear_preferencia_mp',
            turno: pedido.turno,
            cliente: pedido.cliente,
            total: pedido.total,
            items: pedido.items
        };

        const res = await fetch(WEB_APP_URL, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        const data = await res.json();

        if (data.init_point) {
            btnMp.href = data.init_point;
            if (loadingHint) {
                loadingHint.textContent = '⚡ Enlace dinámico listo con monto exacto';
                loadingHint.style.color = '#10B981';
            }
        } else {
            if (loadingHint) loadingHint.style.display = 'none';
        }
    } catch (e) {
        if (loadingHint) loadingHint.style.display = 'none';
    }
}

function copiarMontoExacto() {
    if (!ultimoPedidoGenerado) return;
    const montoStr = ultimoPedidoGenerado.total.toFixed(2);
    navigator.clipboard.writeText(montoStr).then(() => {
        alert(`✅ Monto exacto copiado: $${montoStr}`);
    }).catch(() => prompt("Copia el monto:", montoStr));
}

function copiarClabeAlPortapapeles() {
    navigator.clipboard.writeText(CLABE_BANCARIA).then(() => {
        const btn = document.getElementById('btnCopyClabe');
        if (btn) {
            const originalHTML = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-check"></i> ¡Copiada!';
            btn.classList.add('copied');
            setTimeout(() => {
                btn.innerHTML = originalHTML;
                btn.classList.remove('copied');
            }, 2000);
        }
    }).catch(err => prompt("Copia la CLABE:", CLABE_BANCARIA));
}

function copiarConceptoTurno() {
    if (!ultimoPedidoGenerado) return;
    const turno = ultimoPedidoGenerado.turno;
    navigator.clipboard.writeText(turno).then(() => {
        const btn = document.getElementById('btnCopyConcept');
        if (btn) {
            const orig = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-check"></i> ¡Copiado!';
            setTimeout(() => btn.innerHTML = orig, 2000);
        }
    }).catch(() => prompt("Copia el turno:", turno));
}

function iniciarCuentaRegresivaKiosko(segundosRestantes) {
    if (temporizadorKiosko) clearInterval(temporizadorKiosko);
    
    const countEl = document.getElementById('kioskCountdown');
    if (countEl) countEl.textContent = `Pantalla se reinicia en ${segundosRestantes}s...`;

    temporizadorKiosko = setInterval(() => {
        segundosRestantes--;
        if (countEl) countEl.textContent = `Pantalla se reinicia en ${segundosRestantes}s...`;
        
        if (segundosRestantes <= 0) {
            clearInterval(temporizadorKiosko);
            reiniciarParaNuevoPedido();
        }
    }, 1000);
}

function cerrarTicketModal() {
    if (ultimoPedidoGenerado && ultimoPedidoGenerado.tipo === 'recoger' && !whatsappEnviadoConfirmado) {
        if (!confirm("⚠️ ¿Ya enviaste tu comprobante por WhatsApp? Si cierras la ventana asegúrate de haber realizado tu pago.")) {
            return;
        }
    }
    
    if (temporizadorKiosko) clearInterval(temporizadorKiosko);
    localStorage.removeItem('engordadera_ultimo_pedido_activo');
    document.getElementById('ticketModal').classList.remove('active');
    reiniciarParaNuevoPedido();
}

function reiniciarParaNuevoPedido() {
    if (temporizadorKiosko) clearInterval(temporizadorKiosko);
    carrito = [];
    actualizarBarraPildoraCarrito();
    document.getElementById('clientNameInput').value = '';
    document.getElementById('clientPhoneInput').value = '';
    document.getElementById('ticketModal').classList.remove('active');
}

function enviarComprobanteWhatsApp() {
    if (!ultimoPedidoGenerado) return;
    whatsappEnviadoConfirmado = true;
    if (temporizadorKiosko) clearInterval(temporizadorKiosko);

    const p = ultimoPedidoGenerado;
    let mensaje = `🍿 *LA ENGORDADERA - NUEVO PEDIDO*\n`;
    mensaje += `━━━━━━━━━━━━━━━━━━━━━\n`;
    mensaje += `🎫 *TURNO:* *${p.turno}*\n`;
    mensaje += `👤 *Cliente:* ${p.cliente}\n`;
    mensaje += `📍 *Tipo:* ${p.tipo === 'tienda' ? '🏪 En Tienda' : '🛍️ Para Recoger'}\n`;
    mensaje += `🕒 *Hora:* ${p.fecha}\n`;
    mensaje += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
    mensaje += `📝 *DETALLE DE BOTANAS:*\n`;

    p.items.forEach((item, index) => {
        mensaje += `\n*${index + 1}. ${item.nombre}* ($${item.precio.toFixed(2)})\n`;
        if (item.base) mensaje += `   • Base: ${item.base}\n`;
        if (item.ingredientes.length > 0) mensaje += `   • Con: ${item.ingredientes.join(', ')}\n`;
        if (item.extras && item.extras.length > 0) mensaje += `   • Extras: ${item.extras.join(', ')}\n`;
        if (item.salsa) mensaje += `   • Salsa: ${item.salsa}\n`;
    });

    mensaje += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
    mensaje += `💰 *TOTAL A PAGAR:* *$${p.total.toFixed(2)}*\n`;

    if (p.puntos && p.puntos.puntosGanados > 0) {
        if (p.puntos.premioDesbloqueado) {
            mensaje += `🎁 *¡RECOMPENSA GANADA!:* Meta alcanzada (${PREMIO_LEALTAD})\n`;
        } else {
            mensaje += `⭐ *PUNTOS ACUMULADOS:* Llevo ${p.puntos.puntosTotales}/${PUNTOS_META_PREMIO} pts (+${p.puntos.puntosGanados} en esta orden)\n`;
        }
    }

    mensaje += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
    mensaje += p.tipo === 'recoger' ? `📸 *(Adjunto aquí mi comprobante de pago para iniciar la preparación)*` : `📍 *(Pagaré en mostrador al recibir mi turno)*`;

    const url = `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
}

// ======================================================
// 9. AUTOSCROLL HORIZONTAL DE NAVEGACIÓN
// ======================================================
function iniciarNavegacionScroll() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const navWrapper = document.querySelector('.nav-scroll-wrapper');

    function centrarBotonActivo(btn) {
        if (!navWrapper || !btn) return;
        const wrapperWidth = navWrapper.clientWidth;
        const btnOffsetLeft = btn.offsetLeft;
        const btnWidth = btn.clientWidth;
        const targetScrollLeft = btnOffsetLeft - (wrapperWidth / 2) + (btnWidth / 2);

        navWrapper.scrollTo({ left: targetScrollLeft, behavior: 'smooth' });
    }

    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            navButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const targetId = button.getAttribute('data-target');
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.scrollIntoView({ behavior: 'smooth' });
            }
            centrarBotonActivo(button);
        });
    });

    window.addEventListener('scroll', () => {
        let current = '';
        const sections = document.querySelectorAll('.menu-section');

        sections.forEach(section => {
            const sectionTop = section.offsetTop - 140;
            if (window.pageYOffset >= sectionTop) {
                current = section.getAttribute('id');
            }
        });

        navButtons.forEach(btn => {
            if (btn.getAttribute('data-target') === current) {
                if (!btn.classList.contains('active')) {
                    navButtons.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    centrarBotonActivo(btn);
                }
            }
        });
    });
}
