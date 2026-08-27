// ======================================================
// KDS (KITCHEN DISPLAY SYSTEM) - LA ENGORDADERA
// ======================================================
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzl9NiFg5WzBJGD9klSJijJVaziy9eOPiSvGhLPiakZeYJ26CVjE0FRuZgmWvSJ5w3wgg/exec"; 

let pedidosActivos = [];
let pedidoModalActual = null;
let metodoPagoSeleccionado = '';

document.addEventListener('DOMContentLoaded', () => {
    cargarPedidosCocina();
    setInterval(cargarPedidosCocina, 8000); // Polling cada 8s
    setInterval(actualizarTimersEnVivo, 1000); // Cronómetro en tiempo real cada segundo
});

async function cargarPedidosCocina() {
    if (!WEB_APP_URL || WEB_APP_URL.includes("REEMPLAZA_CON_TU_ID")) return;

    try {
        const res = await fetch(`${WEB_APP_URL}?sheet=Ventas_Historicas`);
        const ventas = await res.json();

        if (!Array.isArray(ventas)) return;

        // Filtrar pedidos no finalizados
        pedidosActivos = ventas.filter(v => {
            const est = String(v.estado || '').toLowerCase().trim();
            return est === 'cola' || est === 'preparando' || est === 'listo';
        }).reverse();

        renderizarTarjetasCocina();
    } catch (e) {
        console.warn("Error al cargar pedidos de cocina:", e);
    }
}

function renderizarTarjetasCocina() {
    const container = document.getElementById('kdsOrdersContainer');
    if (!container) return;

    let countPending = 0;
    let countPrep = 0;

    if (pedidosActivos.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; grid-column:1/-1; padding:60px 20px; color:#6B7280;">
                <i class="fa-solid fa-mug-hot" style="font-size:3rem; margin-bottom:12px; color:#4B5563;"></i>
                <h3 style="font-family:var(--font-heading); font-size:1.3rem; color:#9CA3AF;">No hay órdenes pendientes</h3>
                <p style="font-size:0.85rem;">Las nuevas botanas aparecerán aquí en tiempo real.</p>
            </div>
        `;
        document.getElementById('kdsCountPending').textContent = '0';
        document.getElementById('kdsCountPrep').textContent = '0';
        return;
    }

    container.innerHTML = '';

    pedidosActivos.forEach((p, idx) => {
        const estado = String(p.estado || 'cola').toLowerCase().trim();
        if (estado === 'cola') countPending++;
        if (estado === 'preparando') countPrep++;

        const pagado = String(p.pagado || 'NO').toUpperCase().trim().startsWith('SI');
        const esTienda = String(p.tipo || '').toLowerCase().trim() === 'tienda';

        // Parseo de items
        let itemsHTML = '';
        try {
            let itemsArray = [];
            if (p.items_json && p.items_json !== '') {
                itemsArray = JSON.parse(p.items_json);
            }
            
            if (Array.isArray(itemsArray) && itemsArray.length > 0) {
                itemsHTML = itemsArray.map(item => `
                    <div class="order-item-row">
                        <div class="order-item-title">
                            <strong>🍿 ${item.nombre}</strong>
                            <span style="color:#F472B6;">$${parseFloat(item.precio || 0).toFixed(2)}</span>
                        </div>
                        <div class="order-item-sub">
                            ${item.base ? `• <strong>Base:</strong> ${item.base}<br>` : ''}
                            ${item.ingredientes && item.ingredientes.length > 0 ? `• <strong>Con:</strong> ${item.ingredientes.join(', ')}<br>` : ''}
                            ${item.extras && item.extras.length > 0 ? `• <strong>Extras:</strong> <span style="color:#FCD34D;">${item.extras.join(', ')}</span><br>` : ''}
                            ${item.salsa ? `• <strong>Salsa:</strong> ${item.salsa}` : ''}
                        </div>
                    </div>
                `).join('');
            } else if (p.detalle) {
                itemsHTML = `<div class="order-item-row"><div class="order-item-sub">${p.detalle}</div></div>`;
            }
        } catch (e) {
            itemsHTML = `<div class="order-item-row"><div class="order-item-sub">${p.detalle || 'Detalle no disponible'}</div></div>`;
        }

        const card = document.createElement('div');
        card.className = 'order-card';
        card.onclick = (e) => {
            if (e.target.closest('.btn-kds')) return;
            abrirModalDetalleCocina(idx);
        };

        card.innerHTML = `
            <div class="order-card-header">
                <span class="order-turno">${p.turno || '#--'}</span>
                <span class="order-type-badge ${esTienda ? 'badge-tienda' : 'badge-recoger'}">
                    ${esTienda ? '🏪 En Tienda' : '🛍️ Recoger'}
                </span>
            </div>

            <div class="order-timer-bar">
                <span class="order-timer timer-normal" data-timestamp="${p.fecha || ''}">
                    <i class="fa-solid fa-stopwatch"></i> <span class="timer-display">00:00</span>
                </span>
                <span class="payment-status ${pagado ? 'pay-paid' : 'pay-pending'}">
                    ${pagado ? '✓ PAGADO' : '⏳ PENDIENTE PAGO'}
                </span>
            </div>

            <div class="order-card-body">
                <div style="font-weight:700; color:#F3F4F6; margin-bottom:8px; font-size:0.9rem;">
                    👤 ${p.cliente || 'Cliente'} ${p.telefono ? `<small style="color:#9CA3AF;">(${p.telefono})</small>` : ''}
                </div>
                ${itemsHTML}
            </div>

            <div class="order-card-footer">
                ${estado === 'cola' ? `
                    <button type="button" class="btn-kds btn-prep" onclick="cambiarEstadoRapido('${p.turno}', 'preparando')">
                        <i class="fa-solid fa-fire"></i> Preparar
                    </button>
                ` : ''}
                ${estado === 'preparando' ? `
                    <button type="button" class="btn-kds btn-ready" onclick="cambiarEstadoRapido('${p.turno}', 'listo')">
                        <i class="fa-solid fa-bell"></i> ¡Listo!
                    </button>
                ` : ''}
                ${estado === 'listo' ? `
                    <button type="button" class="btn-kds btn-delivered" onclick="cambiarEstadoRapido('${p.turno}', 'entregado')">
                        <i class="fa-solid fa-check"></i> Entregar
                    </button>
                ` : ''}
            </div>
        `;

        container.appendChild(card);
    });

    document.getElementById('kdsCountPending').textContent = countPending;
    document.getElementById('kdsCountPrep').textContent = countPrep;
    actualizarTimersEnVivo();
}

// TIMER EN TIEMPO REAL
function actualizarTimersEnVivo() {
    const timerEls = document.querySelectorAll('.order-timer');
    const ahora = new Date().getTime();

    timerEls.forEach(el => {
        const rawDate = el.getAttribute('data-timestamp');
        if (!rawDate) return;

        const fechaPedido = new Date(rawDate).getTime();
        if (isNaN(fechaPedido)) return;

        const diffSegundos = Math.floor((ahora - fechaPedido) / 1000);
        if (diffSegundos < 0) return;

        const minutos = Math.floor(diffSegundos / 60);
        const segundos = diffSegundos % 60;
        const display = `${minutos < 10 ? '0' : ''}${minutos}:${segundos < 10 ? '0' : ''}${segundos}`;

        const textSpan = el.querySelector('.timer-display');
        if (textSpan) textSpan.textContent = display;

        el.classList.remove('timer-normal', 'timer-warning', 'timer-danger');
        if (minutos < 5) el.classList.add('timer-normal');
        else if (minutos < 10) el.classList.add('timer-warning');
        else el.classList.add('timer-danger');
    });
}

// MODAL INTERACTIVO
function abrirModalDetalleCocina(index) {
    const p = pedidosActivos[index];
    if (!p) return;

    pedidoModalActual = p;
    metodoPagoSeleccionado = '';

    document.getElementById('modalTurno').textContent = p.turno || '#--';
    document.getElementById('modalCliente').textContent = `Cliente: ${p.cliente || 'Sin Nombre'}`;
    document.getElementById('modalTelefono').textContent = p.telefono || 'Sin registrar';
    document.getElementById('modalTotalMonto').textContent = `$${parseFloat(p.total || 0).toFixed(2)}`;

    const esTienda = String(p.tipo || '').toLowerCase().trim() === 'tienda';
    const badgeTipo = document.getElementById('modalBadgeTipo');
    badgeTipo.className = `order-type-badge ${esTienda ? 'badge-tienda' : 'badge-recoger'}`;
    badgeTipo.textContent = esTienda ? '🏪 EN TIENDA' : '🛍️ PARA RECOGER';

    // Contact Actions
    const contactBox = document.getElementById('modalContactActions');
    contactBox.innerHTML = '';
    if (p.telefono && p.telefono.length >= 10) {
        contactBox.innerHTML = `
            <a href="tel:${p.telefono}" class="btn-kds btn-prep" style="padding:4px 10px; text-decoration:none;"><i class="fa-solid fa-phone"></i></a>
            <a href="https://wa.me/52${p.telefono}" target="_blank" class="btn-kds btn-ready" style="padding:4px 10px; text-decoration:none;"><i class="fa-brands fa-whatsapp"></i></a>
        `;
    }

    // Desglose de Items
    const itemsBox = document.getElementById('modalItemsList');
    try {
        const itemsArray = JSON.parse(p.items_json || '[]');
        itemsBox.innerHTML = itemsArray.map(item => `
            <div style="margin-bottom:10px; padding-bottom:8px; border-bottom:1px dashed #374151;">
                <strong style="color:var(--primary-yellow); font-size:1.05rem;">🍿 ${item.nombre} ($${item.precio})</strong>
                <div style="font-size:0.82rem; color:#D1D5DB; margin-top:3px;">
                    ${item.base ? `• Base: <strong>${item.base}</strong><br>` : ''}
                    ${item.ingredientes && item.ingredientes.length > 0 ? `• Con: <strong>${item.ingredientes.join(', ')}</strong><br>` : ''}
                    ${item.extras && item.extras.length > 0 ? `• Extras: <strong style="color:#F472B6;">${item.extras.join(', ')}</strong><br>` : ''}
                    ${item.salsa ? `• Salsa: <strong>${item.salsa}</strong>` : ''}
                </div>
            </div>
        `).join('');
    } catch (e) {
        itemsBox.innerHTML = `<p style="font-size:0.85rem; color:#D1D5DB;">${p.detalle || 'Detalle no disponible'}</p>`;
    }

    document.querySelectorAll('.pay-method-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('kdsDetailModal').classList.add('active');
}

function seleccionarMetodoPago(metodo, btnEl) {
    metodoPagoSeleccionado = metodo;
    document.querySelectorAll('.pay-method-btn').forEach(b => b.classList.remove('active'));
    btnEl.classList.add('active');
}

function cerrarModalCocina() {
    document.getElementById('kdsDetailModal').classList.remove('active');
    pedidoModalActual = null;
}

async function cambiarEstadoDesdeModal(nuevoEstado) {
    if (!pedidoModalActual) return;
    await cambiarEstadoEnBackend(pedidoModalActual.turno, nuevoEstado, metodoPagoSeleccionado);
    cerrarModalCocina();
    cargarPedidosCocina();
}

async function cambiarEstadoRapido(turno, nuevoEstado) {
    await cambiarEstadoEnBackend(turno, nuevoEstado, '');
    cargarPedidosCocina();
}

async function cambiarEstadoEnBackend(turno, nuevoEstado, metodoPago) {
    try {
        const payload = {
            action: 'actualizar_estado_cocina',
            turno: turno,
            estado: nuevoEstado,
            metodo_pago: metodoPago
        };

        await fetch(WEB_APP_URL, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    } catch (e) {
        console.error("Error al actualizar estado:", e);
    }
}
