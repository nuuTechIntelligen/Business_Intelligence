// ======================================================
// CONFIGURACIÓN DE SHEETDB & WHATSAPP
// ======================================================
const SHEETDB_URL = "https://sheetdb.io/api/v1/TU_ID_AQUI"; // <-- Pega tu URL de SheetDB aquí
const NUMERO_WHATSAPP = "5215512345678"; 

let productosGlobales = [];
let productoSeleccionado = null;
let montoSeleccionadoActual = 20;
let carrito = [];

// ======================================================
// 1. CARGA DINÁMICA DESDE SHEETDB
// ======================================================
document.addEventListener('DOMContentLoaded', () => {
    cargarMenuDesdeSheetDB();
});

async function cargarMenuDesdeSheetDB() {
    try {
        const respuesta = await fetch(SHEETDB_URL);
        const productos = await respuesta.json();
        productosGlobales = productos;

        renderizarMenu(productos);
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

function renderizarMenu(productos) {
    const navContainer = document.getElementById('nav-categories-container');
    const sectionsContainer = document.getElementById('menu-sections-container');

    // 1. Agrupar productos por categoría
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

    // 2. Renderizar Botones de Navegación
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

    // 3. Renderizar Secciones de Productos en Cuadrícula
    sectionsContainer.innerHTML = '';
    Object.values(categorias).forEach(cat => {
        const section = document.createElement('section');
        section.id = cat.id;
        section.className = 'menu-section';

        let cardsHTML = '';
        cat.productos.forEach(prod => {
            const estaDisponible = String(prod.disponible).toUpperCase() === 'SI';
            const precioDisplay = prod.venta_por_monto === 'SI' ? 'A Granel' : `$${parseFloat(prod.precio || 0).toFixed(2)}`;

            // Toda la tarjeta lleva el evento onclick para abrir el modal
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

    // Manejo de Venta por Monto con Pills Rápidas
    const amountGroup = document.getElementById('modalAmountGroup');
    if (prod.venta_por_monto === 'SI') {
        amountGroup.style.display = 'block';
        montoSeleccionadoActual = parseFloat(prod.precio) || 20;
        renderizarPillsMonto();
    } else {
        amountGroup.style.display = 'none';
    }

    // Grupo Base (Radio buttons)
    renderizarOpcionesModal('modalBaseGroup', 'modalBaseTitle', 'modalBaseOptions', prod.grupo_base_nombre, prod.grupo_base_opciones, 'radio', 'grupo_base');

    // Grupo Ingredientes (Checkboxes)
    renderizarOpcionesModal('modalIngredientsGroup', 'modalIngredientsTitle', 'modalIngredientsOptions', prod.grupo_ingredientes_nombre, prod.grupo_ingredientes_opciones, 'checkbox', 'grupo_ing');

    // Grupo Salsas (Radio buttons)
    renderizarOpcionesModal('modalSaucesGroup', 'modalSaucesTitle', 'modalSaucesOptions', prod.grupo_salsas_nombre, prod.grupo_salsas_opciones, 'radio', 'grupo_salsa');

    document.getElementById('productModal').classList.add('active');
}

// Renderiza los botones de monto rápido ($20, $30, $50, $100, Otro)
function renderizarPillsMonto() {
    const pillsContainer = document.getElementById('modalAmountPills');
    if (!pillsContainer) return;

    const montosFrecuentes = [20, 30, 50, 100];
    pillsContainer.innerHTML = '';

    montosFrecuentes.forEach(monto => {
        const pill = document.createElement('button');
        pill.type = 'button';
        pill.className = `amount-pill ${montoSeleccionadoActual === monto ? 'active' : ''}`;
        pill.textContent = `$${monto}`;
        pill.onclick = () => {
            montoSeleccionadoActual = monto;
            document.getElementById('modalCustomWrapper').style.display = 'none';
            document.getElementById('modalProductPrice').textContent = `$${monto.toFixed(2)}`;
            actualizarClasesPills();
        };
        pillsContainer.appendChild(pill);
    });

    // Opción "Otro monto"
    const pillOtro = document.createElement('button');
    pillOtro.type = 'button';
    pillOtro.className = `amount-pill ${!montosFrecuentes.includes(montoSeleccionadoActual) ? 'active' : ''}`;
    pillOtro.textContent = 'Otro ✏️';
    pillOtro.onclick = () => {
        const customWrapper = document.getElementById('modalCustomWrapper');
        customWrapper.style.display = 'flex';
        const inputCustom = document.getElementById('modalCustomAmount');
        inputCustom.focus();
        montoSeleccionadoActual = parseFloat(inputCustom.value) || 20;
        document.getElementById('modalProductPrice').textContent = `$${montoSeleccionadoActual.toFixed(2)}`;
        actualizarClasesPills();
    };
    pillsContainer.appendChild(pillOtro);

    // Evento de escritura libre en el input
    const inputCustom = document.getElementById('modalCustomAmount');
    inputCustom.oninput = () => {
        const val = parseFloat(inputCustom.value) || 0;
        montoSeleccionadoActual = val;
        document.getElementById('modalProductPrice').textContent = `$${val.toFixed(2)}`;
    };
}

function actualizarClasesPills() {
    const pills = document.querySelectorAll('.amount-pill');
    pills.forEach(p => p.classList.remove('active'));
    // Vuelve a pintar el activo
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

    const opciones = opcionesTexto.split(',').map(o => o.trim());
    containerEl.innerHTML = '';

    opciones.forEach((op, index) => {
        const label = document.createElement('label');
        label.className = 'option-chip';
        label.innerHTML = `
            <input type="${inputType}" name="${inputName}" value="${op}" ${inputType === 'radio' && index === 0 ? 'checked' : ''}>
            <span>${op}</span>
        `;
        containerEl.appendChild(label);
    });
}

function cerrarModal() {
    document.getElementById('productModal').classList.remove('active');
    productoSeleccionado = null;
}

function confirmarAgregarAlCarrito() {
    if (!productoSeleccionado) return;

    let precioFinal = parseFloat(productoSeleccionado.precio || 0);

    if (productoSeleccionado.venta_por_monto === 'SI') {
        if (isNaN(montoSeleccionadoActual) || montoSeleccionadoActual <= 0) {
            alert("Por favor ingresa o selecciona un monto válido.");
            return;
        }
        precioFinal = montoSeleccionadoActual;
    }

    const baseSeleccionada = document.querySelector('input[name="grupo_base"]:checked')?.value || '';
    const ingredientesSeleccionados = Array.from(document.querySelectorAll('input[name="grupo_ing"]:checked')).map(cb => cb.value);
    const salsaSeleccionada = document.querySelector('input[name="grupo_salsa"]:checked')?.value || '';

    carrito.push({
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

// ======================================================
// 3. ACTUALIZACIÓN DEL CARRITO Y WHATSAPP
// ======================================================
function actualizarBarraCarrito() {
    const totalCount = carrito.length;
    const totalPrice = carrito.reduce((sum, item) => sum + item.precio, 0);

    document.getElementById('cartCount').textContent = `${totalCount} ${totalCount === 1 ? 'producto' : 'productos'}`;
    document.getElementById('cartTotal').textContent = `$${totalPrice.toFixed(2)}`;
}

function enviarPedidoWhatsApp() {
    if (carrito.length === 0) {
        alert("¡Tu pedido está vacío! Toca cualquier botana para prepararla y agregarla.");
        return;
    }

    let mensaje = "Hola *La Engordadera* 🍿🌶️, me gustaría hacer el siguiente pedido:\n\n";
    let total = 0;

    carrito.forEach((item, index) => {
        total += item.precio;
        mensaje += `*${index + 1}. ${item.nombre}* - $${item.precio.toFixed(2)}\n`;

        if (item.base) {
            mensaje += `   • _Base:_ ${item.base}\n`;
        }
        if (item.ingredientes && item.ingredientes.length > 0) {
            mensaje += `   • _Con:_ ${item.ingredientes.join(', ')}\n`;
        }
        if (item.salsa) {
            mensaje += `   • _Salsa:_ ${item.salsa}\n`;
        }
        mensaje += "\n";
    });

    mensaje += `*Total Estimado:* $${total.toFixed(2)}\n`;
    mensaje += "\n📍 *Dirección de Entrega / Recolección:* (Escribe aquí tu dirección o si pasas a sucursal)";

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
