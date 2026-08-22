// ======================================================
// GESTOR KDS, NOTIFICACIONES Y FINANZAS (COMPLETO)
// ======================================================

let pedidos = [];
let pedidoEnProcesoTiempo = null;
let chartVentasInstancia = null;
let chartProductosInstancia = null;

document.addEventListener('DOMContentLoaded', () => {
    iniciarReloj();
    cargarPedidosDesdeStorage();

    // Escucha cambios automáticos emitidos desde index.html
    window.addEventListener('storage', (event) => {
        if (event.key === 'engordadera_pedidos_cocina') {
            cargarPedidosDesdeStorage(true);
        }
    });
});

function iniciarReloj() {
    const clock = document.getElementById('liveClock');
    if (!clock) return;
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
        const audio = document.getElementById('orderNotificationSound');
        if (audio) audio.play().catch(() => {});
    }

    renderizarTablero();
    actualizarMetricasFinancieras();
}

function guardarPedidosEnStorage() {
    localStorage.setItem('engordadera_pedidos_cocina', JSON.stringify(pedidos));
    renderizarTablero();
    actualizarMetricasFinancieras();
}

// ======================================================
// 1. RENDERIZADO DEL TABLERO KANBAN DE COMANDAS
// ======================================================
function renderizarTablero() {
    const containerCola = document.getElementById('containerCola');
    const containerPrep = document.getElementById('containerPrep');
    const containerListos = document.getElementById('containerListos');

    if (!containerCola || !containerPrep || !containerListos) return;

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

    if (document.getElementById('countCola')) document.getElementById('countCola').textContent = colaCount;
    if (document.getElementById('countPrep')) document.getElementById('countPrep').textContent = prepCount;
    if (document.getElementById('countListos')) document.getElementById('countListos').textContent = listosCount;

    if (document.getElementById('metricCola')) document.getElementById('metricCola').textContent = colaCount;
    if (document.getElementById('metricPrep')) document.getElementById('metricPrep').textContent = prepCount;
    if (document.getElementById('metricListos')) document.getElementById('metricListos').textContent = listosCount;
}

function crearTarjetaComanda(pedido) {
    const card = document.createElement('div');
    const esTienda = pedido.tipo === 'tienda';
    card.className = `order-card ${esTienda ? 'tienda' : 'recoger'}`;

    let itemsHTML = '';
    (pedido.items || []).forEach((item, idx) => {
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

    let actionBtnHTML = '';
    if (pedido.estado === 'cola' || !pedido.estado) {
        actionBtnHTML = `
            <button class="btn-kds btn-start" onclick="solicitarTiempoOIniciar('${pedido.id_pedido}')">
                <i class="fa-solid fa-fire-burner"></i> Iniciar Preparación
            </button>
        `;
    } else if (pedido.estado === 'prep') {
        actionBtnHTML = `
            <button class="btn-kds btn-finish" onclick="marcarListoYNotificar('${pedido.id_pedido}')">
                <i class="fa-solid fa-circle-check"></i> Marcar Listo
            </button>
        `;
    } else if (pedido.estado === 'listo') {
        const btnNotifListo = !esTienda ? `
            <button class="btn-kds btn-wa-notify" onclick="notificarPedidoListoWhatsApp('${pedido.id_pedido}')">
                <i class="fa-brands fa-whatsapp"></i> Avisar "¡Listo!"
            </button>
        ` : '';

        actionBtnHTML = `
            ${btnNotifListo}
            <button class="btn-kds btn-deliver" onclick="entregarPedidoFinal('${pedido.id_pedido}')">
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

        <div class="order-client-name">👤 ${pedido.cliente} ${pedido.telefono ? `(${pedido.telefono})` : ''}</div>
        
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
// 2. NOTIFICACIONES DE TIEMPO ESTIMADO & LISTO (WHATSAPP)
// ======================================================
function solicitarTiempoOIniciar(idPedido) {
    const p = pedidos.find(item => item.id_pedido === idPedido);
    if (!p) return;

    if (p.tipo === 'recoger') {
        pedidoEnProcesoTiempo = p;
        document.getElementById('timeModalClientDesc').textContent = `¿En cuántos minutos estará listo el pedido de ${p.cliente} (${p.turno})?`;
        document.getElementById('timeModal').style.display = 'flex';
    } else {
        cambiarEstadoPedido(idPedido, 'prep');
    }
}

function cerrarModalTiempo() {
    if (pedidoEnProcesoTiempo) {
        cambiarEstadoPedido(pedidoEnProcesoTiempo.id_pedido, 'prep');
    }
    document.getElementById('timeModal').style.display = 'none';
    pedidoEnProcesoTiempo = null;
}

function confirmarTiempoYNotificar(minutos) {
    if (!pedidoEnProcesoTiempo) return;

    const p = pedidoEnProcesoTiempo;
    cambiarEstadoPedido(p.id_pedido, 'prep');
    document.getElementById('timeModal').style.display = 'none';

    const tel = p.telefono ? p.telefono.replace(/\D/g, '') : '';
    const numDestino = tel ? (tel.length === 10 ? `521${tel}` : tel) : '';

    let msg = `¡Hola *${p.cliente}*! 🍿 En *La Engordadera* ya comenzamos a preparar tu pedido *${p.turno}*.\n\n⏱️ Estará listo para recoger en aprox. *${minutos} minutos*. ¡Te esperamos calientito y crujiente! 🔥`;

    const url = numDestino ? `https://wa.me/${numDestino}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
    pedidoEnProcesoTiempo = null;
}

function marcarListoYNotificar(idPedido) {
    cambiarEstadoPedido(idPedido, 'listo');
    const p = pedidos.find(item => item.id_pedido === idPedido);
    if (p && p.tipo === 'recoger') {
        notificarPedidoListoWhatsApp(idPedido);
    }
}

function notificarPedidoListoWhatsApp(idPedido) {
    const p = pedidos.find(item => item.id_pedido === idPedido);
    if (!p) return;

    const tel = p.telefono ? p.telefono.replace(/\D/g, '') : '';
    const numDestino = tel ? (tel.length === 10 ? `521${tel}` : tel) : '';

    let msg = `¡Hola *${p.cliente}*! 🎉 Tu pedido *${p.turno}* ya está *¡LISTO EN MOSTRADOR!* en *La Engordadera*.\n\nPuedes pasar a recogerlo con tu número de turno. ¡Buen provecho! 🌶️🧀`;

    const url = numDestino ? `https://wa.me/${numDestino}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
}

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

function entregarPedidoFinal(idPedido) {
    const index = pedidos.findIndex(p => p.id_pedido === idPedido);
    if (index !== -1) {
        pedidos[index].estado = 'entregado';
        pedidos[index].hora_entrega = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        guardarPedidosEnStorage();
    }
}

function limpiarEntregadosAntiguos() {
    pedidos = pedidos.filter(p => p.estado !== 'entregado');
    guardarPedidosEnStorage();
}

// ======================================================
// 3. PANEL DE FINANZAS, ANALÍTICA Y GRÁFICAS
// ======================================================
function mostrarVista(vista) {
    const vKDS = document.getElementById('vistaKDS');
    const vFin = document.getElementById('vistaFinanzas');
    const bKDS = document.getElementById('tabBtnKDS');
    const bFin = document.getElementById('tabBtnFinanzas');
    const mHead = document.getElementById('kdsMetricsHeader');

    if (!vKDS || !vFin) return;

    if (vista === 'kds') {
        vKDS.style.display = 'grid';
        vFin.style.display = 'none';
        bKDS.classList.add('active');
        bFin.classList.remove('active');
        if (mHead) mHead.style.display = 'flex';
    } else {
        vKDS.style.display = 'none';
        vFin.style.display = 'block';
        bFin.classList.add('active');
        bKDS.classList.remove('active');
        if (mHead) mHead.style.display = 'none';
        actualizarMetricasFinancieras();
    }
}

function actualizarMetricasFinancieras() {
    let totalAcumulado = 0;
    let ventaTienda = 0;
    let ventaRecoger = 0;
    let pedidosTiendaCount = 0;
    let pedidosRecogerCount = 0;

    const ventasPorDia = {};
    const conteoProductos = {};

    const tableBody = document.getElementById('financeTableBody');
    if (tableBody) tableBody.innerHTML = '';

    pedidos.forEach(p => {
        const monto = parseFloat(p.total || 0);
        totalAcumulado += monto;

        if (p.tipo === 'tienda') {
            ventaTienda += monto;
            pedidosTiendaCount++;
        } else {
            ventaRecoger += monto;
            pedidosRecogerCount++;
        }

        const fechaDia = p.fecha_completa ? p.fecha_completa.split('T')[0] : (new Date().toISOString().split('T')[0]);
        ventasPorDia[fechaDia] = (ventasPorDia[fechaDia] || 0) + monto;

        if (p.items && Array.isArray(p.items)) {
            p.items.forEach(item => {
                const nombreLimpio = item.nombre || 'Botana';
                conteoProductos[nombreLimpio] = (conteoProductos[nombreLimpio] || 0) + 1;
            });
        }

        if (tableBody) {
            const tr = document.createElement('tr');
            const itemsResumen = (p.items || []).map(i => i.nombre).join(', ');

            tr.innerHTML = `
                <td><strong>${p.turno}</strong></td>
                <td><small>${fechaDia} ${p.fecha}</small></td>
                <td>${p.cliente}</td>
                <td><span class="order-type-tag ${p.tipo === 'tienda' ? 'tag-tienda' : 'tag-recoger'}">${p.tipo === 'tienda' ? 'Tienda' : 'Recoger'}</span></td>
                <td><small>${itemsResumen}</small></td>
                <td><strong>$${monto.toFixed(2)}</strong></td>
            `;
            tableBody.appendChild(tr);
        }
    });

    const totalCount = pedidos.length;
    const ticketProm = totalCount > 0 ? (totalAcumulado / totalCount) : 0;

    if (document.getElementById('finTotalVentas')) {
        document.getElementById('finTotalVentas').textContent = `$${totalAcumulado.toFixed(2)}`;
        document.getElementById('finTotalPedidos').textContent = `${totalCount} órdenes registradas`;
        document.getElementById('finVentaTienda').textContent = `$${ventaTienda.toFixed(2)}`;
        document.getElementById('finPedidosTienda').textContent = `${pedidosTiendaCount} órdenes`;
        document.getElementById('finVentaRecoger').textContent = `$${ventaRecoger.toFixed(2)}`;
        document.getElementById('finPedidosRecoger').textContent = `${pedidosRecogerCount} órdenes`;
        document.getElementById('finTicketPromedio').textContent = `$${ticketProm.toFixed(2)}`;
    }

    renderizarGraficas(ventasPorDia, conteoProductos);
}

function renderizarGraficas(ventasPorDia, conteoProductos) {
    if (typeof Chart === 'undefined') return;

    // 1. Gráfica de Ventas Diarias
    const ctxVentas = document.getElementById('chartVentasDias');
    if (ctxVentas) {
        const labelsDias = Object.keys(ventasPorDia).sort();
        const dataVentas = labelsDias.map(dia => ventasPorDia[dia]);

        if (chartVentasInstancia) chartVentasInstancia.destroy();

        chartVentasInstancia = new Chart(ctxVentas, {
            type: 'line',
            data: {
                labels: labelsDias.length ? labelsDias : ['Hoy'],
                datasets: [{
                    label: 'Ventas ($)',
                    data: dataVentas.length ? dataVentas : [0],
                    borderColor: '#34D399',
                    backgroundColor: 'rgba(52, 211, 153, 0.15)',
                    fill: true,
                    tension: 0.3,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: { ticks: { color: '#888' }, grid: { color: '#2A2A2A' } },
                    y: { ticks: { color: '#888' }, grid: { color: '#2A2A2A' } }
                }
            }
        });
    }

    // 2. Gráfica de Top Productos
    const ctxProductos = document.getElementById('chartTopProductos');
    if (ctxProductos) {
        const productosOrdenados = Object.entries(conteoProductos)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        const labelsProd = productosOrdenados.map(p => p[0]);
        const dataProd = productosOrdenados.map(p => p[1]);

        if (chartProductosInstancia) chartProductosInstancia.destroy();

        chartProductosInstancia = new Chart(ctxProductos, {
            type: 'doughnut',
            data: {
                labels: labelsProd.length ? labelsProd : ['Sin datos'],
                datasets: [{
                    data: dataProd.length ? dataProd : [1],
                    backgroundColor: ['#E91E63', '#FFCB05', '#00A8E8', '#7BC043', '#FB923C'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: { color: '#DDD', font: { size: 11 } }
                    }
                }
            }
        });
    }
}

function exportarReporteVentasCSV() {
    if (pedidos.length === 0) {
        alert("No hay ventas registradas.");
        return;
    }

    let csv = "Turno,Fecha,Hora,Cliente,Telefono,Tipo,Total,Estado,Detalle\n";
    pedidos.forEach(p => {
        const fechaDia = p.fecha_completa ? p.fecha_completa.split('T')[0] : '';
        const items = (p.items || []).map(i => `${i.nombre} ($${i.precio})`).join(' + ');
        csv += `"${p.turno}","${fechaDia}","${p.fecha}","${p.cliente}","${p.telefono || ''}","${p.tipo}",${p.total},"${p.estado}","${items}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Corte_Ventas_La_Engordadera_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
}

function borrarHistorialFinanciero() {
    if (confirm("⚠️ ¿Estás seguro de reiniciar el historial de ventas? Asegúrate de haber descargado tu reporte en CSV/Excel primero.")) {
        pedidos = [];
        guardarPedidosEnStorage();
    }
}
