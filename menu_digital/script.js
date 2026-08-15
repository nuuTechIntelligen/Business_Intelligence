// ======================================================
// CONFIGURACIÓN DE SHEETDB & WHATSAPP
// ======================================================
const SHEETDB_URL = "https://sheetdb.io/api/v1/TU_ID_AQUI"; // <-- Pega aquí tu URL de SheetDB
const NUMERO_WHATSAPP = "5215512345678"; 

let productosGlobales = [];
let productoSeleccionado = null;
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
        document.getElementById('loadingState').innerHTML = `
            <p style="color: red;">⚠️ Ocurrió un error al cargar el menú. Por favor recarga la página.</p>
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

    // 3. Renderizar Secciones de Productos
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
                <div class="card ${!estaDisponible ? 'agotado' : ''}">
                    ${!estaDisponible ? '<div class="badge-agotado">Agotado</div>' : ''}
                    <div class="card-img-placeholder" style="background-image: url('${prod.imagen || 'images/exhibidor_botanas.jpg'}');"></div>
                    <div class="card-body">
                        <h3>${prod.nombre}</h3>
                        <p class="card-desc">${prod.descripcion || ''}</p>
                        <div class="card-footer">
                            <span class="price">${precioDisplay}</span>
                            <button class="btn-add ${!estaDisponible ? 'disabled' : ''}" onclick="abrirModalPersonalizacion(${prod.id})">
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
            </div>
            <div class="grid-container">
                ${cardsHTML}
            </div>
        `;
        sectionsContainer.appendChild(section);
    });
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
    document.getElementById('modalProductPrice').textContent = prod.venta_por_monto === 'SI' ? 'Monto Libre' : `$${parseFloat(prod.precio).toFixed(2)}`;

    // Manejo de Venta por Monto
    const amountGroup = document.getElementById('modalAmountGroup');
    if (prod.venta_por_monto === 'SI') {
        amountGroup.style.display = 'block';
        document.getElementById('modalCustomAmount').value = prod.precio || 20;
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
        const montoInput = parseFloat(document.getElementById('modalCustomAmount').value);
        if (isNaN(montoInput) || montoInput <= 0) {
            alert("Por favor ingresa un monto válido.");
            return;
        }
        precioFinal = montoInput;
    }

    // Obtener elecciones
    const baseSeleccionada = document.querySelector('input[name="grupo_base"]:checked')?.value || '';
    
    const ingredientesSeleccionados = Array.from(document.querySelectorAll('input[name="grupo_ing"]:checked')).map(cb => cb.value);
    
    const salsaSeleccionada = document.querySelector('input[name="grupo_salsa"]:checked')?.value || '';

    // Crear ítem de pedido personalizado
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
        alert("¡Tu pedido está vacío! Haz clic en 'Pedir' en cualquier botana para agregarla.");
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
