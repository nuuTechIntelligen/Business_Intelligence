// ======================================================
// CONFIGURACIÓN DE SHEETDB & WHATSAPP
// ======================================================
const SHEETDB_URL = "https://sheetdb.io/api/v1/sq3j6nb77cl27"; // <-- Tu URL de Productos
const SHEETDB_VENTAS_URL = "https://sheetdb.io/api/v1/sq3j6nb77cl27?sheet=Ventas_Historicas"; // <-- URL para respaldo en la nube
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

function obtenerPropiedadFlexible(obj, clavesPosibles) {
    if (!obj || typeof obj !== 'object') return '';
    const llaves = Object.keys(obj);
    for (let cp of clavesPosibles) {
        const cpNormal = limpiarTexto(cp).replace(/[^A-Z0-9]/g, '');
        for (let k of llaves) {
            const kNormal = limpiarTexto(k).replace(/[^A-Z0-9]/g, '');
            if (kNormal === cpNormal) {
                return obj[k];
            }
        }
    }
    return '';
}

// Extrae el nombre y el costo extra de cadenas como: "Queso extra (+$8)"
function parsearExtraConCosto(textoOpcion) {
    const match = String(textoOpcion).match(/^(.*?)(?:\s*\(\s*\+\s*\$?\s*([\d\.]+)\s*\))?$/);
    if (match) {
        return {
            nombreLimpio: match[1].trim(),
            costoExtra: match[2] ? parseFloat(match[2]) : 0,
            textoCompleto: textoOpcion
        };
    }
    return { nombreLimpio: textoOpcion, costoExtra: 0, textoCompleto: textoOpcion };
}

// ======================================================
// 1. CARGA DINÁMICA Y FILTRADO POR DÍA
// ======================================================
document.addEventListener('DOMContentLoaded', () => {
    cargarMenuDesdeSheetDB();
    actualizarUILealtad();
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
            const diasConfig = limpiarTexto(obtenerPropiedadFlexible(p, ['dias_disponible', 'dias', 'diasdisponible']));
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

    const destacados = productos.filter(p => {
        const esDestacado = limpiarTexto(obtenerPropiedadFlexible(p, ['destacado_banner', 'destacado', 'banner'])) === 'SI';
        const estaDisp = limpiarTexto(obtenerPropiedadFlexible(p, ['disponible', 'activo'])) === 'SI';
        return esDestacado && estaDisp;
    });

    if (destacados.length === 0) {
        bannerContainer.style.display = 'none';
        return;
    }

    bannerTrack.innerHTML = '';
    destacados.forEach(prod => {
        const card = document.createElement('div');
        card.className = 'banner-item-card';
        card.onclick = () => abrirModalPersonalizacion(prod.id);

        const esPorMonto = limpiarTexto(obtenerPropiedadFlexible(prod, ['venta_por_monto', 'por_monto'])) === 'SI';
        const precioTxt = esPorMonto ? 'A Granel' : `$${parseFloat(prod.precio || 0).toFixed(2)}`;

        const imgBannerCustom = obtenerPropiedadFlexible(prod, ['imagen_banner', 'img_banner', 'banner_img', 'banner_imagen']);
        const imgFinal = imgBannerCustom && imgBannerCustom.trim() !== '' ? imgBannerCustom : (prod.imagen || 'images/exhibidor_botanas.jpg');

        card.innerHTML = `
            <div class="banner-img" style="background-image: url('${imgFinal}');"></div>
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
// 2. MODAL Y PERSONALIZACIÓN DE INGREDIENTES Y EXTRAS
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

    // Venta por Monto
    const amountGroup = document.getElementById('modalAmountGroup');
    if (esPorMonto) {
        amountGroup.style.display = 'block';
        montoMinimoActual = parseFloat(obtenerPropiedadFlexible(prod, ['monto_minimo', 'minimo', 'montominimo']) || '10');
        renderizarPillsMontoDinámicas(obtenerPropiedadFlexible(prod, ['montos_sugeridos', 'montos']), montoMinimoActual);
    } else {
        amountGroup.style.display = 'none';
    }

    // Opciones
    const baseNombre = obtenerPropiedadFlexible(prod, ['grupo_base_nombre', 'base_nombre']) || 'Selecciona tu Base';
    const baseOpciones = obtenerPropiedadFlexible(prod, ['grupo_base_opciones', 'base_opciones', 'bases']);

    const ingNombre = obtenerPropiedadFlexible(prod, ['grupo_ingredientes_nombre', 'ingredientes_nombre', 'grupo_ingrediente_nombre']) || '¿Qué ingredientes le ponemos?';
    const ingOpciones = obtenerPropiedadFlexible(prod, ['grupo_ingredientes_opciones', 'ingredientes_opciones', 'grupo_ingrediente_opciones', 'ingredientes']);

    const extrasNombre = obtenerPropiedadFlexible(prod, ['grupo_extras_nombre', 'extras_nombre']) || '🧀 Extras / Toppings Adicionales';
    const extrasOpciones = obtenerPropiedadFlexible(prod, ['grupo_extras_opciones', 'extras_opciones', 'extras']);

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
        if (val < montoMinimo) {
            hintMin.textContent = `⚠️ El monto mínimo es de $${montoMinimo.toFixed(2)}`;
        } else {
            hintMin.textContent = '';
        }
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

    if (chipDiv.classList.contains('disabled') && !input.checked) {
        return;
    }

    input.checked = !input.checked;
    if (input.checked) {
        chipDiv.classList.add('selected');
    } else {
        chipDiv.classList.remove('selected');
    }

    if (containerId === 'modalIngredientsOptions') {
        recalcularLimiteIngredientes();
    }
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
                if (!cb.checked) {
                    c.classList.add('disabled');
                } else {
                    c.classList.remove('disabled');
                }
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
        if (actuales >= limiteIngredientesActual) {
            badge.className = 'limit-badge complete';
        } else {
            badge.className = 'limit-badge';
        }
    } else {
        badge.style.display = 'none';
    }
}

function actualizarPrecioEnVivoModal() {
    if (!productoSeleccionado) return;

    const esPorMonto = limpiarTexto(obtenerPropiedadFlexible(productoSeleccionado, ['venta_por_monto', 'por_monto'])) === 'SI';
    let basePrice = esPorMonto ? montoSeleccionadoActual : parseFloat(productoSeleccionado.precio || 0);

    // Suma de extras con costo adicional
    let extraCost = 0;
    const chipsExtras = document.querySelectorAll('#modalExtrasOptions .option-chip');
    chipsExtras.forEach(chip => {
        const input = chip.querySelector('input');
        if (input && input.checked) {
            extraCost += parseFloat(chip.getAttribute('data-costo') || 0);
        }
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

    // Extras seleccionados con desglose
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
// 3. UPSELLING AUTOMÁTICO (SUGERENCIAS CRUZADAS)
// ======================================================
function iniciarFlujoCheckout() {
    if (carrito.length === 0) {
        alert("¡Tu pedido está vacío! Elige una botana para comenzar.");
        return;
    }

    // Buscar productos marcados con es_upsell = SI que no estén ya en el carrito
    const upsellCandidates = productosGlobales.filter(p => {
        const esUp = limpiarTexto(obtenerPropiedadFlexible(p, ['es_upsell', 'upsell'])) === 'SI';
        const estaDisp = limpiarTexto(obtenerPropiedadFlexible(p, ['disponible', 'activo'])) === 'SI';
        const yaEnCarrito = carrito.some(item => item.nombre === p.nombre);
        return esUp && estaDisp && !yaEnCarrito;
    });

    if (upsellCandidates.length > 0) {
        mostrarModalUpsell(upsellCandidates);
    } else {
        abrirModalCheckout();
    }
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
        actualizarBarraCarrito();
    }
    cerrarUpsellYAbrirCheckout();
}

function cerrarUpsellYAbrirCheckout() {
    document.getElementById('upsellModal').classList.remove('active');
    abrirModalCheckout();
}

// ======================================================
// 4. TARJETA DE LEALTAD DIGITAL (SELLOS 1-8)
// ======================================================
function obtenerSellosActuales() {
    return parseInt(localStorage.getItem('engordadera_sellos_lealtad') || '0', 10);
}

function agregarSelloLealtad() {
    let sellos = obtenerSellosActuales() + 1;
    if (sellos > 8) sellos = 1; // Reinicia ciclo
    localStorage.setItem('engordadera_sellos_lealtad', sellos);
    actualizarUILealtad();
}

function actualizarUILealtad() {
    const sellos = obtenerSellosActuales();
    const heroEl = document.getElementById('heroStampCount');
    if (heroEl) heroEl.textContent = `${sellos}/8`;

    const container = document.getElementById('loyaltyStampsContainer');
    const progressBar = document.getElementById('loyaltyProgressBar');
    const progressText = document.getElementById('loyaltyProgressText');

    if (container) {
        container.innerHTML = '';
        for (let i = 1; i <= 8; i++) {
            const slot = document.createElement('div');
            slot.className = `stamp-slot ${i <= sellos ? 'stamped' : ''}`;
            slot.innerHTML = i <= sellos ? '<i class="fa-solid fa-stamp"></i>' : `${i}`;
            container.appendChild(slot);
        }
    }

    if (progressBar) {
        progressBar.style.width = `${(sellos / 8) * 100}%`;
    }

    if (progressText) {
        progressText.textContent = sellos === 8 
            ? "🎉 ¡Felicidades! Tienes 8 sellos. Tu próxima botana mediana es GRATIS." 
            : `${sellos} de 8 sellos acumulados`;
    }
}

function abrirModalLealtad() {
    actualizarUILealtad();
    document.getElementById('loyaltyModal').classList.add('active');
}

function cerrarModalLealtad() {
    document.getElementById('loyaltyModal').classList.remove('active');
}

// ======================================================
// 5. CHECKOUT, TURNOS Y RESPALDO EN LA NUBE
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

async function procesarGeneracionTurno() {
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

    // 1. Guardar en Storage para KDS local
    const pedidosActuales = JSON.parse(localStorage.getItem('engordadera_pedidos_cocina') || '[]');
    pedidosActuales.push(ultimoPedidoGenerado);
    localStorage.setItem('engordadera_pedidos_cocina', JSON.stringify(pedidosActuales));

    // 2. Sumar sello de lealtad
    agregarSelloLealtad();

    // 3. Respaldo asíncrono en Google Sheets (Ventas_Historicas)
    respaldarVentaEnGoogleSheets(ultimoPedidoGenerado);

    cerrarModalCheckout();
    mostrarBoletoTurno(ultimoPedidoGenerado);
}

// Envío a Google Sheets sin congelar la pantalla
async function respaldarVentaEnGoogleSheets(pedido) {
    if (!SHEETDB_VENTAS_URL || SHEETDB_VENTAS_URL.includes("TU_ID_AQUI")) return;
    try {
        const payload = {
            data: [{
                turno: pedido.turno,
                cliente: pedido.cliente,
                telefono: pedido.telefono || '',
                tipo: pedido.tipo,
                total: pedido.total,
                fecha: pedido.fecha_completa,
                detalle: pedido.items.map(i => `${i.nombre} ($${i.precio})`).join(', ')
            }]
        };

        fetch(SHEETDB_VENTAS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).catch(err => console.warn("Error en respaldo de Sheets:", err));
    } catch (e) {
        console.warn("No se pudo enviar respaldo de venta:", e);
    }
}

function mostrarBoletoTurno(pedido) {
    const badgeType = document.getElementById('ticketBadgeType');
    const paymentAlert = document.getElementById('ticketPaymentAlert');
    const qrContainer = document.getElementById('qrPaymentContainer');

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
        if (qrContainer) qrContainer.style.display = 'none';
    } else {
        badgeType.textContent = '🛍️ PARA RECOGER';
        badgeType.className = 'ticket-badge badge-recoger';
        paymentAlert.className = 'ticket-payment-alert alert-recoger';
        paymentAlert.innerHTML = `
            <strong>⚠️ Pago Previo Requerido:</strong><br>
            Para comenzar a preparar tu orden de <strong>$${pedido.total.toFixed(2)}</strong>, realiza tu pago por transferencia o QR y envía el comprobante por WhatsApp.
        `;
        if (qrContainer) {
            qrContainer.style.display = 'block';
            document.getElementById('qrConceptoTurno').textContent = pedido.turno;
        }
    }

    document.getElementById('ticketModal').classList.add('active');
    iniciarCuentaRegresivaKiosko(10);
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
        if (item.extras && item.extras.length > 0) mensaje += `   • Extras: ${item.extras.join(', ')}\n`;
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
// 6. AUTOSCROLL HORIZONTAL DE NAVEGACIÓN
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
