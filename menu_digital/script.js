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

const DIAS_SEMANA = ['DOMINGO', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];

function limpiarTexto(txt) {
    if (!txt) return '';
    return String(txt)
        .toUpperCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}

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
        
        if (!Array.isArray(productos)) {
            throw new Error("Formato de datos no válido desde SheetDB");
        }

        productosGlobales = productos;

        const diaHoy = DIAS_SEMANA[new Date().getDay()];

        const productosHoy = productos.filter(p => {
            const diasConfig = limpiarTexto(p.dias_disponible);
            if (!diasConfig || diasConfig === 'TODOS' || diasConfig === '') return true;
            return diasConfig.includes(diaHoy);
        });

        renderizarBannerEspeciales(productosHoy);
        renderizarMenu(productosHoy.length > 0 ? productosHoy : productos);
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

function renderizarBannerEspeciales(productos) {
    const bannerContainer = document.getElementById('heroBannerContainer');
    const bannerTrack = document.getElementById('bannerSliderTrack');
    if (!bannerContainer || !bannerTrack) return;

    const destacados = productos.filter(p => 
        limpiarTexto(p.destacado_banner) === 'SI' && 
        limpiarTexto(p.disponible) === 'SI'
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

        const esPorMonto = limpiarTexto(prod.venta_por_monto) === 'SI';
        const precioTxt = esPorMonto ? 'A Granel' : `$${parseFloat(prod.precio || 0).toFixed(2)}`;

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
            const estaDisponible = limpiarTexto(prod.disponible) === 'SI';
            const esPorMonto = limpiarTexto(prod.venta_por_monto) === 'SI';
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
// 2. MODAL Y PERSONALIZACIÓN DE INGREDIENTES
// ======================================================
function abrirModalPersonalizacion(productoId) {
    const prod = productosGlobales.find(p => p.id == productoId);
    if (!prod || limpiarTexto(prod.disponible) !== 'SI') return;

    productoSeleccionado = prod;

    const esPorMonto = limpiarTexto(prod.venta_por_monto) === 'SI';

    document.getElementById('modalProductTitle').textContent = prod.nombre;
    document.getElementById('modalProductDesc').textContent = prod.descripcion || '';
    document.getElementById('modalProductPrice').textContent = esPorMonto ? '$20.00' : `$${parseFloat(prod.precio || 0).toFixed(2)}`;

    // Parseo numérico estricto de max_ingredientes
    let maxVal = 0;
    if (prod.max_ingredientes !== undefined && prod.max_ingredientes !== null && String(prod.max_ingredientes).trim() !== '') {
        const parsed = parseInt(String(prod.max_ingredientes).trim(), 10);
        if (!isNaN(parsed) && parsed > 0) {
            maxVal = parsed;
        }
    }
    limiteIngredientesActual = maxVal;

    // Venta por Monto
    const amountGroup = document.getElementById('modalAmountGroup');
    if (esPorMonto) {
        amountGroup.style.display = 'block';
        montoMinimoActual = parseFloat(prod.monto_minimo || '10');
        renderizarPillsMontoDinámicas(prod.montos_sugeridos, montoMinimoActual);
    } else {
        amountGroup.style.display = 'none';
    }

    // Opciones
    const baseNombre = prod.grupo_base_nombre || 'Selecciona tu Base';
    const baseOpciones = prod.grupo_base_opciones || prod.grupo_bases_opciones || '';

    const ingNombre = prod.grupo_ingredientes_nombre || prod.grupo_ingrediente_nombre || '¿Qué ingredientes le ponemos?';
    const ingOpciones = prod.grupo_ingredientes_opciones || prod.grupo_ingrediente_opciones || '';

    const salsaNombre = prod.grupo_salsas_nombre || prod.grupo_salsa_nombre || 'Selecciona tu Salsa';
    const salsaOpciones = prod.grupo_salsas_opciones || prod.grupo_salsa_opciones || '';

    renderizarOpcionesModal('modalBaseGroup', 'modalBaseTitle', 'modalBaseOptions', baseNombre, baseOpciones, 'radio', 'grupo_base_input');
    renderizarOpcionesModal('modalIngredientsGroup', 'modalIngredientsTitle', 'modalIngredientsOptions', ingNombre, ingOpciones, 'checkbox', 'grupo_ing_input');
    renderizarOpcionesModal('modalSaucesGroup', 'modalSaucesTitle', 'modalSaucesOptions', salsaNombre, salsaOpciones, 'radio', 'grupo_salsa_input');

    actualizarBadgeLimiteIngredientes(0);

    document.getElementById('productModal').classList.add('active');
}

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
            searchInput.placeholder = '🔍 Buscar opción... (ej. Fresa, Nuez, Nutella)';
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
        const chipDiv = document.createElement('div');
        chipDiv.className = 'option-chip';

        const isRadioDefault = (inputType === 'radio' && index === 0);
        if (isRadioDefault) chipDiv.classList.add('selected');

        const inputId = `${inputName}_${index}_${Date.now()}`;

        chipDiv.innerHTML = `
            <input type="${inputType}" name="${inputName}" id="${inputId}" value="${op}" ${isRadioDefault ? 'checked' : ''}>
            <span>${op}</span>
        `;

        const inputInside = chipDiv.querySelector('input');

        // Manejador de clic directo sobre el chip
        chipDiv.onclick = (e) => {
            if (e.target !== inputInside) {
                if (inputType === 'checkbox') {
                    if (!inputInside.disabled) {
                        inputInside.checked = !inputInside.checked;
                        inputInside.dispatchEvent(new Event('change'));
                    }
                } else if (inputType === 'radio') {
                    inputInside.checked = true;
                    inputInside.dispatchEvent(new Event('change'));
                }
            }
        };

        inputInside.onchange = () => {
            if (inputType === 'checkbox') {
                controlarCheckboxesIngredientes();
            } else if (inputType === 'radio') {
                const siblingChips = containerEl.querySelectorAll('.option-chip');
                siblingChips.forEach(c => c.classList.remove('selected'));
                chipDiv.classList.add('selected');
            }
        };

        containerEl.appendChild(chipDiv);
    });
}

function controlarCheckboxesIngredientes() {
    const container = document.getElementById('modalIngredientsOptions');
    if (!container) return;

    const chips = Array.from(container.querySelectorAll('.option-chip'));
    const checkboxes = chips.map(c => c.querySelector('input[type="checkbox"]'));
    const seleccionados = checkboxes.filter(cb => cb.checked);
    const totalSeleccionados = seleccionados.length;

    // Actualizar estilos seleccionados
    chips.forEach(chip => {
        const cb = chip.querySelector('input[type="checkbox"]');
        if (cb.checked) {
            chip.classList.add('selected');
        } else {
            chip.classList.remove('selected');
        }
    });

    actualizarBadgeLimiteIngredientes(totalSeleccionados);

    // Límite de ingredientes activo
    if (limiteIngredientesActual > 0) {
        if (totalSeleccionados >= limiteIngredientesActual) {
            chips.forEach(chip => {
                const cb = chip.querySelector('input[type="checkbox"]');
                if (!cb.checked) {
                    cb.disabled = true;
                    chip.classList.add('disabled');
                } else {
                    cb.disabled = false;
                    chip.classList.remove('disabled');
                }
            });
        } else {
            chips.forEach(chip => {
                const cb = chip.querySelector('input[type="checkbox"]');
                cb.disabled = false;
                chip.classList.remove('disabled');
            });
        }
    } else {
        chips.forEach(chip => {
            const cb = chip.querySelector('input[type="checkbox"]');
            cb.disabled = false;
            chip.classList.remove('disabled');
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

    const esPorMonto = limpiarTexto(productoSeleccionado.venta_por_monto) === 'SI';
    let precioFinal = parseFloat(productoSeleccionado.precio || 0);

    if (esPorMonto) {
        if (isNaN(montoSeleccionadoActual) || montoSeleccionadoActual < montoMinimoActual) {
            alert(`El monto mínimo para este producto es de $${montoMinimoActual.toFixed(2)}`);
            return;
        }
        precioFinal = montoSeleccionadoActual;
    }

    const baseSeleccionada = document.querySelector('#modalBaseOptions input[type="radio"]:checked')?.value || '';
    const ingredientesSeleccionados = Array.from(document.querySelectorAll('#modalIngredientsOptions input[type="checkbox"]:checked')).map(cb => cb.value);
    const salsaSeleccionada = document.querySelector('#modalSaucesOptions input[type="radio"]:checked')?.value || '';

    if (limiteIngredientesActual > 0 && ingredientesSeleccionados.length === 0) {
        alert(`Por favor elige al menos 1 ingrediente para tu orden.`);
        return;
    }

    carrito.push({
        id_unico: Date.now() + Math.random(),
        nombre: productoSeleccionado.nombre,
        precio: precioFinal,
        base: baseSeleccionada,
        ingredientes: ingredientesSeleccionados,
        salsa: salsaSeleccionada,
        esPorMonto: esPorMonto
    });

    actualizarBarraCarrito();
    cerrarModal();

    const cartBar = document.getElementById('cartBar');
    if (cartBar) {
        cartBar.style.transform = 'scale(1.03)';
        setTimeout(() => cartBar.style.transform = 'scale(1)', 150);
    }
}

function actualizarBarraCarrito() {
    const totalCount = carrito.length;
    const totalPrice = carrito.reduce((sum, item) => sum + item.precio, 0);

    const countEl = document.getElementById('cartCount');
    const totalEl = document.getElementById('cartTotal');
    if (countEl) countEl.textContent = `${totalCount} ${totalCount === 1 ? 'producto' : 'productos'}`;
    if (totalEl) totalEl.textContent = `$${totalPrice.toFixed(2)}`;
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
