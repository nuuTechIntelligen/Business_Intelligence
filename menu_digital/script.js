// ======================================================
// CONFIGURACIÓN DE SHEETDB & WHATSAPP
// ======================================================
const SHEETDB_URL = "https://sheetdb.io/api/v1/sq3j6nb77cl27"; // <-- Pega tu URL de SheetDB aquí
const NUMERO_WHATSAPP = "5215512345678"; 

let productosGlobales = [];
let productoSeleccionado = null;
let montoSeleccionadoActual = 20;
let montoMinimoActual = 10;
let limiteIngredientesActual = 0;
let carrito = [];
let ultimoPedidoGenerado = null;
let temporizadorKiosko = null;

// Días en español
const DIAS_SEMANA = ['DOMINGO', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];

// ======================================================
// 1. CARGA DINÁMICA Y FILTRADO POR DÍA
// ======================================================
document.addEventListener('DOMContentLoaded', () => {
    cargarMenuDesdeSheetDB();
});

async function cargarMenuDesdeSheetDB() {
    try {
        const respuesta = await fetch(SHEETDB_URL);
        const productos = await respuesta.json();
        productosGlobales = productos;

        const diaHoy = DIAS_SEMANA[new Date().getDay()];

        // 1. Filtrar productos habilitados para el día de hoy
        const productosHoy = productos.filter(p => {
            const diasConfig = (p.dias_disponible || 'TODOS').toUpperCase();
            if (diasConfig === 'TODOS' || diasConfig.trim() === '') return true;
            return diasConfig.includes(diaHoy);
        });

        // 2. Renderizar Banner de Especiales del Día
        renderizarBannerEspeciales(productosHoy);

        // 3. Renderizar Catálogo en 2 Columnas
        renderizarMenu(productosHoy);
        iniciarNavegacionScroll();
    } catch (error) {
        console.error("Error al cargar datos desde SheetDB:", error);
        document.getElementById('menu-sections-container').innerHTML = `
            <div class="loading-state">
                <p style="color: #D32F2F; font-weight: 700;">⚠️ No se pudo cargar el menú en este momento. Por favor recarga la página.</p>
            </div>
        `;
    }
}

// Renderiza el banner horizontal con imágenes debajo del botón amarillo
function renderizarBannerEspeciales(productos) {
    const bannerContainer = document.getElementById('heroBannerContainer');
    const bannerTrack = document.getElementById('bannerSliderTrack');
    if (!bannerContainer || !bannerTrack) return;

    // Buscar productos con destacado_banner = 'SI' y disponibles
    const destacados = productos.filter(p => 
        String(p.destacado_banner).toUpperCase() === 'SI' && 
        String(p.disponible).toUpperCase() === 'SI'
    );

    if (destacados.length === 0) {
        bannerContainer.style.display = 'none';
        return;
    }

    bannerTrack.innerHTML = '';
    destacados.forEach(prod => {
        const card = document.createElement('div');
        card.className = 'banner-item-card';
        card.onclick = () => abrirModalPersonalizacion(prod.id);

        const precioTxt = prod.venta_por_monto === 'SI' ? 'A Granel' : `$${parseFloat(prod.precio || 0).toFixed(2)}`;

        card.innerHTML = `
            <div class="banner-img" style="background-image: url('${prod.imagen || 'images/exhibidor_botanas.jpg'}');"></div>
            <div class="banner-info">
                <strong>${prod.nombre}</strong>
                <span>${precioTxt}</span>
            </div>
        `;
        bannerTrack.appendChild(card);
    });

    bannerContainer.style.display = 'block';
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
            const estaDisponible = String(prod.disponible).toUpperCase() === 'SI';
            const precioDisplay = prod.venta_por_monto === 'SI' ? 'A Granel' : `$${parseFloat(prod.precio || 0).toFixed(2)}`;

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
// 2. MODAL Y PERSONALIZACIÓN DE INGREDIENTES
// ======================================================
function abrirModalPersonalizacion(productoId) {
    const prod = productosGlobales.find(p => p.id == productoId);
    if (!prod || String(prod.disponible).toUpperCase() !== 'SI') return;

    productoSeleccionado = prod;

    document.getElementById('modalProductTitle').textContent = prod.nombre;
    document.getElementById('modalProductDesc').textContent = prod.descripcion || '';
    document.getElementById('modalProductPrice').textContent = prod.venta_por_monto === 'SI' ? '$20.00' : `$${parseFloat(prod.precio).toFixed(2)}`;

    // Configuración de Límite de Ingredientes (Mini Hot Cakes, etc.)
    limiteIngredientesActual = parseInt(prod.max_ingredientes || '0');
    actualizarBadgeLimiteIngredientes(0);

    // Configuración de Venta por Monto y Límite Mínimo
    const amountGroup = document.getElementById('modalAmountGroup');
    if (prod.venta_por_monto === 'SI') {
        amountGroup.style.display = 'block';
        montoMinimoActual = parseFloat(prod.monto_minimo || '10');
        renderizarPillsMontoDinámicas(prod.montos_sugeridos, montoMinimoActual);
    } else {
        amountGroup.style.display = 'none';
    }

    renderizarOpcionesModal('modalBaseGroup', 'modalBaseTitle', 'modalBaseOptions', prod.grupo_base_nombre, prod.grupo_base_opciones, 'radio', 'grupo_base');
    renderizarOpcionesModal('modalIngredientsGroup', 'modalIngredientsTitle', 'modalIngredientsOptions', prod.grupo_ingredientes_nombre, prod.grupo_ingredientes_opciones, 'checkbox', 'grupo_ing');
    renderizarOpcionesModal('modalSaucesGroup', 'modalSaucesTitle', 'modalSaucesOptions', prod.grupo_salsas_nombre, prod.grupo_salsas_opciones, 'radio', 'grupo_salsa');

    document.getElementById('productModal').classList.add('active');
}

// Renderiza pills basadas en la columna 'montos_sugeridos' de Google Sheets
function renderizarPillsMontoDinámicas(montosConfig, montoMinimo) {
    const pillsContainer = document.getElementById('modalAmountPills');
    const inputCustom = document.getElementById('modalCustomAmount');
    const hintMin = document.getElementById('modalMinAmountMsg');
    if (!pillsContainer) return;

    let listaMontos = [20, 30, 50, 100];
    if (montosConfig && montosConfig.trim() !== '') {
        listaMontos = montosConfig.split(',').map(m => parseFloat(m.trim())).filter(m => !isNaN(m));
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
        };
        pillsContainer.appendChild(pill);
    });

    // Pill de "Otro monto"
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
        if (val < montoMinimo) {
            hintMin.textContent = `⚠️ El monto mínimo es de $${montoMinimo.toFixed(2)}`;
        } else {
            hintMin.textContent = '';
        }
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

    if (!opcionesTexto || opcionesTexto.trim() === '') {
        groupEl.style.display = 'none';
        containerEl.innerHTML = '';
        return;
    }

    groupEl.style.display = 'block';
    titleEl.textContent = nombreGrupo || 'Selecciona tus opciones';

    const opciones = opcionesTexto.split(',').map(o => o.trim()).filter(o => o.length > 0);
    containerEl.innerHTML = '';

    let searchInput = groupEl.querySelector('.modal-search-input');
    if (opciones.length > 8) {
        if (!searchInput) {
            searchInput = document.createElement('input');
            searchInput.type = 'text';
            searchInput.className = 'modal-search-input';
            searchInput.placeholder = '🔍 Buscar opción... (ej. Cheto, Takis, Fresa)';
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
        const label = document.createElement('label');
        label.className = 'option-chip';
        label.innerHTML = `
            <input type="${inputType}" name="${inputName}" value="${op}" ${inputType === 'radio' && index === 0 ? 'checked' : ''} onchange="manejarCambioIngredientes(this)">
            <span>${op}</span>
        `;
        containerEl.appendChild(label);
    });
}

// Control dinámico de checkboxes según 'max_ingredientes'
function manejarCambioIngredientes(inputEl) {
    if (inputEl.type !== 'checkbox' || limiteIngredientesActual <= 0) return;

    const checkboxes = document.querySelectorAll('input[name="grupo_ing"]');
    const seleccionados = Array.from(checkboxes).filter(cb => cb.checked);
    const totalSeleccionados = seleccionados.length;

    actualizarBadgeLimiteIngredientes(totalSeleccionados);

    if (totalSeleccionados >= limiteIngredientesActual) {
        checkboxes.forEach(cb => {
            if (!cb.checked) {
                cb.disabled = true;
                cb.closest('.option-chip').classList.add('disabled');
            }
        });
    } else {
        checkboxes.forEach(cb => {
            cb.disabled = false;
            cb.closest('.option-chip').classList.remove('disabled');
        });
    }
}

function actualizarBadgeLimiteIngredientes(actuales) {
    const badge = document.getElementById('modalIngredientsLimitBadge');
    if (!badge) return;

    if (limiteIngredientesActual > 0) {
        badge.style.display = 'inline-block';
        badge.textContent = `${actuales} de ${limiteIngredientesActual} permitidos`;
        if (actuales >= limiteIngredientesActual) {
            badge.className = 'limit-badge complete';
        } else {
            badge.className = 'limit-badge';
        }
    } else {
        badge.style.display = 'none';
    }
}

function cerrarModal() {
    document.getElementById('productModal').classList.remove('active');
    productoSeleccionado = null;
}

function confirmarAgregarAlCarrito() {
    if (!productoSeleccionado) return;

    let precioFinal = parseFloat(productoSeleccionado.precio || 0);

    if (productoSeleccionado.venta_por_monto === 'SI') {
        if (isNaN(montoSeleccionadoActual) || montoSeleccionadoActual < montoMinimoActual) {
            alert(`El monto mínimo para este producto es de $${montoMinimoActual.toFixed(2)}`);
            return;
        }
        precioFinal = montoSeleccionadoActual;
    }

    const baseSeleccionada = document.querySelector('input[name="grupo_base"]:checked')?.value || '';
    const ingredientesSeleccionados = Array.from(document.querySelectorAll('input[name="grupo_ing"]:checked')).map(cb => cb.value);
    const salsaSeleccionada = document.querySelector('input[name="grupo_salsa"]:checked')?.value || '';

    carrito.push({
        id_unico: Date.now() + Math.random(),
        nombre: productoSeleccionado.nombre,
        precio: precioFinal,
        base: baseSeleccionada,
        ingredientes: ingredientesSeleccionados,
        salsa: salsaSeleccionada,
        esPorMonto: productoSeleccionado.venta_por_monto === 'SI'
    });

    actualizarBarraCarrito();
    cerrarModal();

    const cartBar = document.getElementById('cartBar');
    cartBar.style.transform = 'scale(1.03)';
    setTimeout(() => cartBar.style.transform = 'scale(1)', 150);
}

function actualizarBarraCarrito() {
    const totalCount = carrito.length;
    const totalPrice = carrito.reduce((sum, item) => sum + item.precio, 0);

    document.getElementById('cartCount').textContent = `${totalCount} ${totalCount === 1 ? 'producto' : 'productos'}`;
    document.getElementById('cartTotal').textContent = `$${totalPrice.toFixed(2)}`;
}

// ======================================================
// 3. CHECKOUT, TURNOS Y REINICIO KIOSKO
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
        if (item.salsa) extras.push(`Salsa: ${item.salsa}`);

        div.innerHTML = `
            <div class="checkout-item-details">
                <strong>${item.nombre}</strong>
                <p>${extras.join(' | ') || 'Sin ingredientes adicionales'}</p>
            </div>
            <div style="display:flex; align-items:center;">
                <span class="checkout-item-price">$${item.precio.toFixed(2)}</span>
                <button type="button" class="btn-remove-item" onclick="eliminarDelCarrito(${index})">&times;</button>
            </div>
        `;
        itemsContainer.appendChild(div);
    });

    document.getElementById('checkoutTotalPrice').textContent = `$${total.toFixed(2)}`;
    document.getElementById('checkoutModal').classList.add('active');
}

function cerrarModalCheckout() {
    document.getElementById('checkoutModal').classList.remove('active');
}

function eliminarDelCarrito(index) {
    carrito.splice(index, 1);
    actualizarBarraCarrito();
    if (carrito.length === 0) {
        cerrarModalCheckout();
    } else {
        abrirModalCheckout();
    }
}

function cambiarTipoPedido(tipo) {
    const storeLabel = document.getElementById('typeStoreLabel');
    const pickupLabel = document.getElementById('typePickupLabel');
    const phoneGroup = document.getElementById('phoneInputGroup');

    if (tipo === 'tienda') {
        storeLabel.classList.add('active');
        pickupLabel.classList.remove('active');
        if (phoneGroup) phoneGroup.style.display = 'none';
    } else {
        pickupLabel.classList.add('active');
        storeLabel.classList.remove('active');
        if (phoneGroup) phoneGroup.style.display = 'block';
    }
}

function obtenerSiguienteTurno(tipo) {
    const prefijo = tipo === 'tienda' ? 'T' : 'R';
    const claveStorage = `turno_${prefijo}_consecutivo`;
    let actual = parseInt(localStorage.getItem(claveStorage) || '0') + 1;
    if (actual > 99) actual = 1;
    localStorage.setItem(claveStorage, actual);

    const numeroFormateado = actual < 10 ? `0${actual}` : `${actual}`;
    return `#${prefijo}-${numeroFormateado}`;
}

function procesarGeneracionTurno() {
    const nombreCliente = document.getElementById('clientNameInput').value.trim();
    if (!nombreCliente) {
        alert("Por favor ingresa tu nombre para identificar tu pedido.");
        return;
    }

    const tipoPedido = document.querySelector('input[name="orderType"]:checked').value;
    const telefonoCliente = document.getElementById('clientPhoneInput') ? document.getElementById('clientPhoneInput').value.trim() : '';
    const numeroTurno = obtenerSiguienteTurno(tipoPedido);
    const total = carrito.reduce((sum, item) => sum + item.precio, 0);

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
        fecha: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        fecha_completa: new Date().toISOString()
    };

    // Guardar para pantalla de cocina
    const pedidosActuales = JSON.parse(localStorage.getItem('engordadera_pedidos_cocina') || '[]');
    pedidosActuales.push(ultimoPedidoGenerado);
    localStorage.setItem('engordadera_pedidos_cocina', JSON.stringify(pedidosActuales));

    cerrarModalCheckout();
    mostrarBoletoTurno(ultimoPedidoGenerado);
}

function mostrarBoletoTurno(pedido) {
    const badgeType = document.getElementById('ticketBadgeType');
    const paymentAlert = document.getElementById('ticketPaymentAlert');

    document.getElementById('ticketNumberDisplay').textContent = pedido.turno;
    document.getElementById('ticketClientName').textContent = `Cliente: ${pedido.cliente}`;

    if (pedido.tipo === 'tienda') {
        badgeType.textContent = '🏪 CONSUMO EN TIENDA';
        badgeType.className = 'ticket-badge badge-tienda';
        paymentAlert.className = 'ticket-payment-alert alert-tienda';
        paymentAlert.innerHTML = `
            <strong>💵 Pago en Mostrador:</strong><br>
            Pagarás <strong>$${pedido.total.toFixed(2)}</strong> al momento de recibir tus botanas preparadas.
        `;
    } else {
        badgeType.textContent = '🛍️ PARA RECOGER';
        badgeType.className = 'ticket-badge badge-recoger';
        paymentAlert.className = 'ticket-payment-alert alert-recoger';
        paymentAlert.innerHTML = `
            <strong>⚠️ Pago Previo Requerido:</strong><br>
            Para comenzar a preparar tu orden de <strong>$${pedido.total.toFixed(2)}</strong>, por favor envía tu pedido por WhatsApp y adjunta tu comprobante.
        `;
    }

    document.getElementById('ticketModal').classList.add('active');
    iniciarCuentaRegresivaKiosko(7);
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
    if (temporizadorKiosko) clearInterval(temporizadorKiosko);
    document.getElementById('ticketModal').classList.remove('active');
    reiniciarParaNuevoPedido();
}

function reiniciarParaNuevoPedido() {
    if (temporizadorKiosko) clearInterval(temporizadorKiosko);
    carrito = [];
    actualizarBarraCarrito();
    document.getElementById('clientNameInput').value = '';
    if (document.getElementById('clientPhoneInput')) document.getElementById('clientPhoneInput').value = '';
    document.getElementById('ticketModal').classList.remove('active');
}

function enviarComprobanteWhatsApp() {
    if (!ultimoPedidoGenerado) return;
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
        if (item.salsa) mensaje += `   • Salsa: ${item.salsa}\n`;
    });

    mensaje += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
    mensaje += `💰 *TOTAL A PAGAR:* *$${p.total.toFixed(2)}*\n\n`;

    if (p.tipo === 'recoger') {
        mensaje += `📸 *(Adjunto aquí mi comprobante de pago para iniciar la preparación)*`;
    } else {
        mensaje += `📍 *(Pagaré en mostrador al recibir mi turno)*`;
    }

    const url = `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
}

// ======================================================
// 4. AUTOSCROLL HORIZONTAL DE NAVEGACIÓN
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
