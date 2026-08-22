// ======================================================
// GESTOR DE COMANDAS / PANTALLA DE COCINA (KDS)
// ======================================================

let pedidos = [];

document.addEventListener('DOMContentLoaded', () => {
    iniciarReloj();
    cargarPedidosDesdeStorage();

    // Escucha eventos automáticos cuando el cliente genera un pedido en index.html
    window.addEventListener('storage', (event) => {
        if (event.key === 'engordadera_pedidos_cocina') {
            cargarPedidosDesdeStorage(true);
        }
    });
});

function iniciarReloj() {
    const clock = document.getElementById('liveClock');
    setInterval(() => {
        const now = new Date();
        clock.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }, 1000);
}

function cargarPedidosDesdeStorage(reproducirSonido = false) {
    const guardados = localStorage.getItem('engordadera_pedidos_cocina');
    const anterioresCount = pedidos.length;

    if (guardados) {
        pedidos = JSON.parse(guardados);
    } else {
        pedidos = [];
    }

    if (reproducirSonido && pedidos.length > anterioresCount) {
        reproducirAlertaSonora();
    }

    renderizarTablero();
}

function guardarPedidosEnStorage() {
    localStorage.setItem('engordadera_pedidos_cocina', JSON.stringify(pedidos));
    renderizarTablero();
}

function reproducirAlertaSonora() {
    const audio = document.getElementById('orderNotificationSound');
    if (audio) {
        audio.play().catch(() => {});
    }
}

// ======================================================
// RENDERIZADO DEL TABLERO KANBAN
// ======================================================
function renderizarTablero() {
    const containerCola = document.getElementById('containerCola');
    const containerPrep = document.getElementById('containerPrep');
    const containerListos = document.getElementById('containerListos');

    containerCola.innerHTML = '';
    containerPrep.innerHTML = '';
    containerListos.innerHTML = '';

    let colaCount = 0;
    let prepCount = 0;
    let listosCount = 0;

    pedidos.forEach(p => {
        if (p.estado === 'entregado') return;

        const card = crearTarjetaComanda(p);

        if (p.estado === 'cola' || !p.estado) {
            containerCola.appendChild(card);
            colaCount++;
        } else if (p.estado === 'prep') {
            containerPrep.appendChild(card);
            prepCount++;
        } else if (p.estado === 'listo') {
            containerListos.appendChild(card);
            listosCount++;
        }
    });

    document.getElementById('countCola').textContent = colaCount;
    document.getElementById('countPrep').textContent = prepCount;
    document.getElementById('countListos').textContent = listosCount;

    document.getElementById('metricCola').textContent = colaCount;
    document.getElementById('metricPrep').textContent = prepCount;
    document.getElementById('metricListos').textContent = listosCount;
}

function crearTarjetaComanda(pedido) {
    const card = document.createElement('div');
    const esTienda = pedido.tipo === 'tienda';
    card.className = `order-card ${esTienda ? 'tienda' : 'recoger'}`;

    let itemsHTML = '';
    pedido.items.forEach((item, idx) => {
        let details = [];
        if (item.base) details.push(`Base: ${item.base}`);
        if (item.ingredientes && item.ingredientes.length > 0) details.push(`Con: ${item.ingredientes.join(', ')}`);
        if (item.salsa) details.push(`Salsa: ${item.salsa}`);

        itemsHTML += `
            <div class="order-item-row">
                <div class="order-item-title">${idx + 1}. ${item.nombre}</div>
                <div class="order-item-details">${details.join('<br>') || 'Clásico'}</div>
            </div>
        `;
    });

    // Control de Pago para Recoger
    let paymentBoxHTML = '';
    if (!esTienda) {
        const pagado = pedido.pagado === true;
        paymentBoxHTML = `
            <div class="payment-status-box ${pagado ? 'payment-done' : 'payment-pending'}">
                <span>${pagado ? '✓ Pago Confirmado' : '⚠️ Pago Pendiente'}</span>
                <button class="btn-toggle-pay" onclick="alternarEstadoPago('${pedido.id_pedido}')">
                    ${pagado ? 'Cambiar a Pendiente' : 'Marcar Pagado'}
                </button>
            </div>
        `;
    }

    // Botones según estado
    let actionBtnHTML = '';
    if (pedido.estado === 'cola' || !pedido.estado) {
        actionBtnHTML = `
            <button class="btn-kds btn-start" onclick="cambiarEstadoPedido('${pedido.id_pedido}', 'prep')">
                <i class="fa-solid fa-fire-burner"></i> Iniciar Preparación
            </button>
        `;
    } else if (pedido.estado === 'prep') {
        actionBtnHTML = `
            <button class="btn-kds btn-finish" onclick="cambiarEstadoPedido('${pedido.id_pedido}', 'listo')">
                <i class="fa-solid fa-circle-check"></i> Marcar Listo
            </button>
        `;
    } else if (pedido.estado === 'listo') {
        actionBtnHTML = `
            <button class="btn-kds btn-deliver" onclick="cambiarEstadoPedido('${pedido.id_pedido}', 'entregado')">
                <i class="fa-solid fa-hand-holding-heart"></i> Entregar al Cliente
            </button>
        `;
    }

    card.innerHTML = `
        <div class="order-card-header">
            <span class="order-turn-badge ${esTienda ? 'badge-tienda' : 'badge-recoger'}">${pedido.turno}</span>
            <div class="order-meta">
                <span class="order-type-tag ${esTienda ? 'tag-tienda' : 'tag-recoger'}">${esTienda ? '🏪 En Tienda' : '🛍️ Para Recoger'}</span>
                <span class="order-time">${pedido.fecha || ''}</span>
            </div>
        </div>

        <div class="order-client-name">👤 ${pedido.cliente}</div>
        
        ${paymentBoxHTML}

        <div class="order-items-list">
            ${itemsHTML}
        </div>

        <div class="card-actions">
            ${actionBtnHTML}
        </div>
    `;

    return card;
}

// ======================================================
// ACCIONES DE DESPACHO
// ======================================================
function cambiarEstadoPedido(idPedido, nuevoEstado) {
    const index = pedidos.findIndex(p => p.id_pedido === idPedido);
    if (index !== -1) {
        pedidos[index].estado = nuevoEstado;
        guardarPedidosEnStorage();
    }
}

function alternarEstadoPago(idPedido) {
    const index = pedidos.findIndex(p => p.id_pedido === idPedido);
    if (index !== -1) {
        pedidos[index].pagado = !pedidos[index].pagado;
        guardarPedidosEnStorage();
    }
}

function limpiarEntregadosAntiguos() {
    pedidos = pedidos.filter(p => p.estado !== 'entregado');
    guardarPedidosEnStorage();
}
