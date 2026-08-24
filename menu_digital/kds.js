// ======================================================
// KDS & FINANZAS LA ENGORDADERA (GOOGLE APPS SCRIPT WEB APP)
// ======================================================
// Pega aquí la URL de tu Web App de Google Apps Script (termina en /exec)
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzoB4Q5crNsK8UC4oGRpFE8qJWPaHPhhxqdrRO6hNZB1grViQRnkPmxdpRwqhbeno8gqw/exec"; 
let INTERVALO_SEGUNDOS = 4;

let pedidosGlobalesSheets = [];
let filtroEstacionActual = 'TODAS';
let ultimoTurnoRegistrado = '';
let audioAlerta = null;
let pedidoTemporalParaTiempo = null;

let chartVentasDiasInstance = null;
let chartTopProductosInstance = null;

function normalizarTextoClave(txt) {
    if (!txt) return '';
    return String(txt).toLowerCase().replace(/[^a-z0-9]/g, '').trim();
}

function obtenerCampoFlexible(obj, posiblesNombres) {
    if (!obj || typeof obj !== 'object') return '';
    const keys = Object.keys(obj);
    for (let p of posiblesNombres) {
        const pNorm = normalizarTextoClave(p);
        for (let k of keys) {
            if (normalizarTextoClave(k) === pNorm) {
                return obj[k];
            }
        }
    }
    return '';
}

document.addEventListener('DOMContentLoaded', () => {
    audioAlerta = document.getElementById('orderNotificationSound') || new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    
    crearBarraDiagnostico();
    iniciarReloj();
    iniciarKDS();
    setInterval(consultarPedidosNube, INTERVALO_SEGUNDOS * 1000);
    setInterval(actualizarSemaforosTiempo, 1000);
});

// 1. Etiqueta de Conexión en Pantalla
function crearBarraDiagnostico() {
    if (document.getElementById('kdsDebugBar')) return;
    const bar = document.createElement('div');
    bar.id = 'kdsDebugBar';
    bar.style.cssText = 'position:fixed; bottom:12px; left:12px; background:#0F172A; color:#F8FAFC; padding:8px 14px; border-radius:12px; font-family:monospace; font-size:0.75rem; z-index:99999; box-shadow:0 4px 14px rgba(0,0,0,0.5); border:1px solid #334155; display:flex; align-items:center; gap:8px;';
    bar.innerHTML = `<span>⏳ Conectando con Google Apps Script...</span>`;
    document.body.appendChild(bar);
}

function actualizarBarraDiagnostico(mensaje, esError = false) {
    const bar = document.getElementById('kdsDebugBar');
    if (!bar) return;
    bar.style.background = esError ? '#991B1B' : '#0F172A';
    bar.innerHTML = `${esError ? '⚠️' : '🟢'} ${mensaje}`;
}

function iniciarReloj() {
    setInterval(() => {
        const clockEl = document.getElementById('liveClock');
        if (clockEl) clockEl.textContent = new Date().toLocaleTimeString();
    }, 1000);
}

async function iniciarKDS() {
    if (!WEB_APP_URL || WEB_APP_URL.includes("TU_SCRIPT_ID")) {
        actualizarBarraDiagnostico("ERROR: Falta colocar tu URL de Web App en kds.js", true);
        return;
    }
    await consultarPedidosNube();
}

async function consultarPedidosNube() {
    if (!WEB_APP_URL || WEB_APP_URL.includes("TU_SCRIPT_ID")) return;

    try {
        let res = await fetch(`${WEB_APP_URL}?sheet=Ventas_Historicas`);
        let data = await res.json();

        if (!Array.isArray(data)) {
            actualizarBarraDiagnostico(`Apps Script: ${data.error || 'Respuesta inválida'}`, true);
            return;
        }

        actualizarBarraDiagnostico(`Google Sheets Conectado (Ilimitado) | ${data.length} pedidos | Sinc: ${new Date().toLocaleTimeString()}`);

        pedidosGlobalesSheets = data.map((fila, index) => {
            const turnoVal = obtenerCampoFlexible(fila, ['turno', 'id_turno', 'ticket']) || `#T-${index + 1}`;
            const clienteVal = obtenerCampoFlexible(fila, ['cliente', 'nombre']) || 'Cliente';
            const telefonoVal = String(obtenerCampoFlexible(fila, ['telefono', 'tel', 'celular']) || '');
            
            // Normalización tolerante de Tipo (tienda vs recoger)
            const tipoRaw = normalizarTextoClave(obtenerCampoFlexible(fila, ['tipo', 'tipo_pedido']) || 'tienda');
            const tipoVal = (tipoRaw.includes('recog') || tipoRaw.includes('llevar')) ? 'recoger' : 'tienda';

            const totalVal = parseFloat(obtenerCampoFlexible(fila, ['total', 'monto']) || 0);
            const fechaVal = obtenerCampoFlexible(fila, ['fecha', 'hora', 'fecha_completa']) || new Date().toISOString();
            const detalleVal = obtenerCampoFlexible(fila, ['detalle', 'descripcion', 'productos']) || '';
            const itemsJsonVal = obtenerCampoFlexible(fila, ['items_json', 'items', 'json']);

            // Procesar estado de pago (SI / NO / true / false / pagado)
            const pagadoRaw = String(obtenerCampoFlexible(fila, ['pagado', 'pago', 'status_pago']) || '').toLowerCase().trim();
            const estaPagado = (tipoVal === 'tienda') || (pagadoRaw === 'si' || pagadoRaw === 'true' || pagadoRaw === '1' || pagadoRaw === 'pagado');

            let items = [];
            try {
                if (itemsJsonVal && String(itemsJsonVal).trim().startsWith('[')) {
                    items = JSON.parse(itemsJsonVal);
                } else if (detalleVal) {
                    items = detalleVal.split('|').map(d => ({ nombre: d.trim(), extras: [], precio: 0 }));
                }
            } catch (e) {
                items = [{ nombre: detalleVal || 'Botana', extras: [], precio: totalVal }];
            }

            let estadoRaw = String(obtenerCampoFlexible(fila, ['estado', 'status']) || 'cola').toLowerCase().trim();
            if (!estadoRaw || estadoRaw === 'undefined') estadoRaw = 'cola';

            return {
                turno: turnoVal,
                cliente: clienteVal,
                telefono: telefonoVal,
                tipo: tipoVal,
                total: totalVal,
                pagado: estaPagado,
                fecha_completa: fechaVal,
                estado: estadoRaw,
                items: items
            };
        });

        const pedidosCola = pedidosGlobalesSheets.filter(p => p.estado === 'cola');
        if (pedidosCola.length > 0) {
            const ultimoTurno = pedidosCola[pedidosCola.length - 1].turno;
            if (ultimoTurnoRegistrado !== '' && ultimoTurnoRegistrado !== ultimoTurno) {
                if (audioAlerta) audioAlerta.play().catch(() => {});
            }
            ultimoTurnoRegistrado = ultimoTurno;
        }

        renderizarTableroKanban();
        actualizarMetricasHeader();

        const vistaFin = document.getElementById('vistaFinanzas');
        if (vistaFin && vistaFin.style.display !== 'none') {
            actualizarModuloFinanzas();
        }
    } catch (error) {
        actualizarBarraDiagnostico(`Fallo de Red: ${error.message}`, true);
    }
}

// ======================================================
// 2. RENDERIZADO KANBAN (CON BADGE DE PAGO INTERACTIVO)
// ======================================================
function renderizarTableroKanban() {
    const contCola = document.getElementById('containerCola');
    const contPrep = document.getElementById('containerPrep');
    const contListos = document.getElementById('containerListos');

    if (!contCola || !contPrep || !contListos) return;

    let pedidos = pedidosGlobalesSheets.filter(p => p.estado !== 'cancelado');
    if (filtroEstacionActual !== 'TODAS') {
        pedidos = pedidos.filter(p => {
            return p.items.some(it => (it.estacion || 'CALIENTE').toUpperCase() === filtroEstacionActual);
        });
    }

    const enCola = pedidos.filter(p => p.estado === 'cola');
    const enPrep = pedidos.filter(p => p.estado === 'preparando');
    const listos = pedidos.filter(p => p.estado === 'listo');

    document.getElementById('countCola').textContent = enCola.length;
    document.getElementById('countPrep').textContent = enPrep.length;
    document.getElementById('countListos').textContent = listos.length;

    contCola.innerHTML = enCola.map(p => crearTarjetaHTML(p)).join('') || '<div class="kds-empty-column" style="text-align:center; padding:20px; color:#64748B;">Sin pedidos en cola</div>';
    contPrep.innerHTML = enPrep.map(p => crearTarjetaHTML(p)).join('') || '<div class="kds-empty-column" style="text-align:center; padding:20px; color:#64748B;">Nada en preparación</div>';
    contListos.innerHTML = listos.map(p => crearTarjetaHTML(p)).join('') || '<div class="kds-empty-column" style="text-align:center; padding:20px; color:#64748B;">Sin pedidos listos</div>';
}

function crearTarjetaHTML(pedido) {
    const semaforo = calcularSemaforoTiempo(pedido.fecha_completa);
    const turnoEscapado = encodeURIComponent(pedido.turno || '');
    const esRecoger = String(pedido.tipo).toLowerCase().includes('recog');
    const telefonoLimpio = String(pedido.telefono || '').replace(/\D/g, '');

    let itemsHTML = '';
    (pedido.items || []).forEach((it, idx) => {
        let extras = [];
        if (it.base) extras.push(`Base: ${it.base}`);
        if (it.ingredientes && it.ingredientes.length > 0) extras.push(`Con: ${it.ingredientes.join(', ')}`);
        if (it.extras && it.extras.length > 0) extras.push(`Extra: ${it.extras.join(', ')}`);
        if (it.salsa) extras.push(`Salsa: ${it.salsa}`);

        itemsHTML += `
            <div class="kds-item-row" style="margin-bottom: 6px; border-bottom: 1px dashed rgba(255,255,255,0.1); padding-bottom: 4px;">
                <strong style="color: #FFF; font-size: 0.95rem;">${idx + 1}. ${it.nombre}</strong>
                <p style="color: #94A3B8; font-size: 0.78rem; margin: 2px 0 0 0;">${extras.join(' | ') || 'Estándar'}</p>
            </div>
        `;
    });

    let botonAccion = '';
    if (pedido.estado === 'cola') {
        botonAccion = `
            <button class="btn-card-action" style="flex:1; background:#F59E0B; color:#000; border:none; padding:10px; border-radius:8px; font-weight:700; cursor:pointer;" onclick="iniciarPreparacionPedido('${turnoEscapado}', '${esRecoger ? 'recoger' : 'tienda'}', '${telefonoLimpio}')">
                <i class="fa-solid fa-fire"></i> Preparar
            </button>
        `;
    } else if (pedido.estado === 'preparando') {
        botonAccion = `
            <button class="btn-card-action" style="flex:1; background:#10B981; color:#FFF; border:none; padding:10px; border-radius:8px; font-weight:700; cursor:pointer;" onclick="cambiarEstadoPedidoNube('${turnoEscapado}', 'listo')">
                <i class="fa-solid fa-check-double"></i> Listo
            </button>
        `;
    } else {
        botonAccion = `
            <button class="btn-card-action" style="flex:1; background:#475569; color:#FFF; border:none; padding:8px; border-radius:8px; font-weight:600; cursor:pointer; font-size:0.8rem;" onclick="cambiarEstadoPedidoNube('${turnoEscapado}', 'entregado')">
                <i class="fa-solid fa-box-archive"></i> Entregar
            </button>
        `;
    }

    // Botón / Badge de Estado de Pago
    const botonPagoHTML = pedido.pagado ? `
        <button type="button" title="Pago Confirmado" style="background:#14532D; color:#86EFAC; border:1px solid #166534; padding:3px 8px; border-radius:8px; font-size:0.72rem; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; gap:4px;" onclick="alternarEstadoPagoNube('${turnoEscapado}', false)">
            <i class="fa-solid fa-circle-check"></i> Pagado
        </button>
    ` : `
        <button type="button" title="Clic para marcar como Pagado" style="background:#7F1D1D; color:#FCA5A5; border:1px solid #991B1B; padding:3px 8px; border-radius:8px; font-size:0.72rem; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; gap:4px;" onclick="alternarEstadoPagoNube('${turnoEscapado}', true)">
            <i class="fa-solid fa-clock-rotate-left"></i> Pago Pendiente
        </button>
    `;

    return `
        <div class="kds-card state-${pedido.estado} ${semaforo.claseAlerta}" data-fecha="${pedido.fecha_completa}" style="background:#1E293B; border-radius:12px; padding:12px; margin-bottom:12px; border:1px solid #334155; box-shadow:0 4px 10px rgba(0,0,0,0.2);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <span style="font-size:1.4rem; font-weight:800; color:#F59E0B;">${pedido.turno}</span>
                <div style="display:flex; align-items:center; gap:6px;">
                    <span style="background:${esRecoger ? '#EA580C' : '#0284C7'}; color:#FFF; padding:2px 8px; border-radius:10px; font-size:0.72rem; font-weight:700;">
                        ${esRecoger ? '🛍️ RECOGER' : '🏪 EN TIENDA'}
                    </span>
                    ${botonPagoHTML}
                </div>
                <span class="kds-timer-badge" style="font-weight:700; font-size:0.85rem;">
                    <i class="fa-solid fa-clock"></i> ${semaforo.tiempoFormateado}
                </span>
            </div>

            <div style="font-size:0.85rem; color:#94A3B8; margin-bottom:8px;">
                👤 Cliente: <strong style="color:#F8FAFC;">${pedido.cliente}</strong> ${telefonoLimpio ? `<span style="color:#F59E0B; font-size:0.78rem;">(📱 ${telefonoLimpio})</span>` : ''}
            </div>

            <div style="margin-bottom:10px;">
                ${itemsHTML}
            </div>

            <div style="display:flex; gap:6px; margin-top:8px;">
                ${botonAccion}
                <button title="Eliminar / Cancelar Pedido" style="background:#7F1D1D; color:#FCA5A5; border:1px solid #991B1B; padding:8px 12px; border-radius:8px; cursor:pointer;" onclick="eliminarPedidoIndividual('${turnoEscapado}')">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        </div>
    `;
}

// Alternar Estado de Pago (Pagado <-> Pago Pendiente)
async function alternarEstadoPagoNube(turnoEncoded, nuevoEstadoPago) {
    const turnoReal = decodeURIComponent(turnoEncoded);

    const index = pedidosGlobalesSheets.findIndex(p => p.turno === turnoReal);
    if (index !== -1) {
        pedidosGlobalesSheets[index].pagado = nuevoEstadoPago;
        renderizarTableroKanban();
    }

    if (!WEB_APP_URL || WEB_APP_URL.includes("TU_SCRIPT_ID")) return;

    try {
        await fetch(WEB_APP_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'actualizar_pago',
                sheet: 'Ventas_Historicas',
                turno: turnoReal,
                pagado: nuevoEstadoPago ? 'SI' : 'NO'
            })
        });
        console.log(`💵 Estado de pago del turno ${turnoReal} actualizado a: ${nuevoEstadoPago ? 'SI' : 'NO'}`);
    } catch (e) {
        console.warn("Error actualizando pago en Sheets:", e);
    }
}

// Eliminar Pedido en Google Sheets
async function eliminarPedidoIndividual(turnoEncoded) {
    const turnoReal = decodeURIComponent(turnoEncoded);
    if (!confirm(`¿Deseas eliminar el pedido ${turnoReal}?`)) return;

    const index = pedidosGlobalesSheets.findIndex(p => p.turno === turnoReal);
    if (index !== -1) {
        pedidosGlobalesSheets.splice(index, 1);
        renderizarTableroKanban();
        actualizarMetricasHeader();
    }

    if (!WEB_APP_URL || WEB_APP_URL.includes("TU_SCRIPT_ID")) return;

    try {
        await fetch(WEB_APP_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'eliminar_pedido',
                sheet: 'Ventas_Historicas',
                turno: turnoReal
            })
        });
        console.log(`🗑️ Pedido ${turnoReal} eliminado de Sheets`);
    } catch (e) {
        console.warn("Error eliminando pedido:", e);
    }
}

// Reiniciar el Contador de Turnos
function reiniciarContadorTurnos() {
    if (!confirm("¿Deseas reiniciar los turnos? El siguiente pedido volverá a comenzar en #T-01 y #R-01.")) return;
    localStorage.removeItem('turno_T_consecutivo');
    localStorage.removeItem('turno_R_consecutivo');
    alert("✅ Consecutivos de turno reiniciados a 0.");
}

// ======================================================
// MANEJO ROBUSTO DEL BOTÓN PREPARAR & MODAL DE TIEMPO
// ======================================================
function iniciarPreparacionPedido(turnoEscapado, tipo, telefono) {
    const turnoReal = decodeURIComponent(turnoEscapado);
    const telLimpio = String(telefono || '').replace(/\D/g, '');

    if (tipo === 'recoger' && telLimpio.length >= 10) {
        pedidoTemporalParaTiempo = { turnoEscapado: turnoEscapado, telefono: telLimpio };
        
        const modal = document.getElementById('timeModal');
        const desc = document.getElementById('timeModalClientDesc');
        if (desc) desc.textContent = `Indica en cuántos minutos estará listo el turno ${turnoReal}:`;

        if (modal) {
            modal.classList.add('active');
            modal.style.display = 'flex';
            return;
        }
    }
    
    cambiarEstadoPedidoNube(turnoEscapado, 'preparando');
}

function confirmarTiempoYNotificar(minutos) {
    if (pedidoTemporalParaTiempo && pedidoTemporalParaTiempo.turnoEscapado) {
        const turnoReal = decodeURIComponent(pedidoTemporalParaTiempo.turnoEscapado);
        const tel = pedidoTemporalParaTiempo.telefono;
        const msg = encodeURIComponent(`🍿 *La Engordadera:* Tu pedido *${turnoReal}* ya está en preparación 🔥. Estará listo en aproximadamente *${minutos} minutos*. ¡Te esperamos!`);
        
        window.open(`https://wa.me/521${tel}?text=${msg}`, '_blank');
        cambiarEstadoPedidoNube(pedidoTemporalParaTiempo.turnoEscapado, 'preparando');
    }
    cerrarModalTiempo();
}

function cerrarModalTiempo() {
    const modal = document.getElementById('timeModal');
    if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
    }
    if (pedidoTemporalParaTiempo && pedidoTemporalParaTiempo.turnoEscapado) {
        cambiarEstadoPedidoNube(pedidoTemporalParaTiempo.turnoEscapado, 'preparando');
    }
    pedidoTemporalParaTiempo = null;
}

async function cambiarEstadoPedidoNube(turnoEncoded, nuevoEstado) {
    const turnoReal = decodeURIComponent(turnoEncoded);

    const index = pedidosGlobalesSheets.findIndex(p => p.turno === turnoReal);
    if (index !== -1) {
        pedidosGlobalesSheets[index].estado = nuevoEstado;
        renderizarTableroKanban();
        actualizarMetricasHeader();
    }

    if (!WEB_APP_URL || WEB_APP_URL.includes("TU_SCRIPT_ID")) return;

    try {
        await fetch(WEB_APP_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'actualizar_estado',
                sheet: 'Ventas_Historicas',
                turno: turnoReal,
                estado: nuevoEstado
            })
        });
    } catch (e) {
        console.error("Error actualizando estado en Sheets:", e);
    }
}

function limpiarEntregadosAntiguos() {
    pedidosGlobalesSheets = pedidosGlobalesSheets.filter(p => p.estado !== 'listo' && p.estado !== 'entregado');
    renderizarTableroKanban();
    actualizarMetricasHeader();
}

function calcularSemaforoTiempo(fechaISO) {
    const ahora = new Date();
    const creacion = new Date(fechaISO);
    let diffMs = ahora - creacion;
    if (isNaN(diffMs) || diffMs < 0) diffMs = 0;

    const diffMinutos = Math.floor(diffMs / 60000);
    const diffSegundos = Math.floor((diffMs % 60000) / 1000);

    const minutosTxt = diffMinutos < 10 ? `0${diffMinutos}` : `${diffMinutos}`;
    const segundosTxt = diffSegundos < 10 ? `0${diffSegundos}` : `${diffSegundos}`;
    const tiempoFormateado = `${minutosTxt}:${segundosTxt}`;

    let claseAlerta = 'timer-green';
    if (diffMinutos >= 8 && diffMinutos < 15) {
        claseAlerta = 'timer-yellow';
    } else if (diffMinutos >= 15) {
        claseAlerta = 'timer-red-blink';
    }

    return { tiempoFormateado, claseAlerta };
}

function actualizarSemaforosTiempo() {
    const cards = document.querySelectorAll('.kds-card');
    cards.forEach(card => {
        const fecha = card.getAttribute('data-fecha');
        if (fecha) {
            const semaforo = calcularSemaforoTiempo(fecha);
            const timerEl = card.querySelector('.kds-timer-badge');
            if (timerEl) {
                timerEl.innerHTML = `<i class="fa-solid fa-clock"></i> ${semaforo.tiempoFormateado}`;
            }
        }
    });
}

function mostrarVista(vista) {
    const vistaKDS = document.getElementById('vistaKDS');
    const vistaFin = document.getElementById('vistaFinanzas');
    const btnKDS = document.getElementById('tabBtnKDS');
    const btnFin = document.getElementById('tabBtnFinanzas');
    const filters = document.getElementById('stationFiltersHeader');

    if (vista === 'kds') {
        vistaKDS.style.display = 'grid';
        vistaFin.style.display = 'none';
        btnKDS.classList.add('active');
        btnFin.classList.remove('active');
        if (filters) filters.style.display = 'flex';
    } else {
        vistaKDS.style.display = 'none';
        vistaFin.style.display = 'block';
        btnFin.classList.add('active');
        btnKDS.classList.remove('active');
        if (filters) filters.style.display = 'none';
        actualizarModuloFinanzas();
    }
}

function filtrarPorEstacion(estacion) {
    filtroEstacionActual = estacion.toUpperCase();
    const btns = document.querySelectorAll('.btn-station');
    btns.forEach(b => {
        if (b.getAttribute('data-station') === filtroEstacionActual) {
            b.classList.add('active');
        } else {
            b.classList.remove('active');
        }
    });
    renderizarTableroKanban();
}

function actualizarMetricasHeader() {
    const enCola = pedidosGlobalesSheets.filter(p => p.estado === 'cola').length;
    const enPrep = pedidosGlobalesSheets.filter(p => p.estado === 'preparando').length;
    const listos = pedidosGlobalesSheets.filter(p => p.estado === 'listo').length;

    const mCola = document.getElementById('metricCola');
    const mPrep = document.getElementById('metricPrep');
    const mListos = document.getElementById('metricListos');

    if (mCola) mCola.textContent = enCola;
    if (mPrep) mPrep.textContent = enPrep;
    if (mListos) mListos.textContent = listos;
}

function actualizarModuloFinanzas() {
    const ventas = pedidosGlobalesSheets;
    let totalGeneral = 0;
    let totalTienda = 0;
    let totalRecoger = 0;
    let pedidosTiendaCount = 0;
    let pedidosRecogerCount = 0;

    ventas.forEach(v => {
        totalGeneral += v.total;
        if (v.tipo === 'tienda') {
            totalTienda += v.total;
            pedidosTiendaCount++;
        } else {
            totalRecoger += v.total;
            pedidosRecogerCount++;
        }
    });

    const ticketProm = ventas.length > 0 ? (totalGeneral / ventas.length) : 0;

    const finTotal = document.getElementById('finTotalVentas');
    const finTotalPed = document.getElementById('finTotalPedidos');
    const finTienda = document.getElementById('finVentaTienda');
    const finPedTienda = document.getElementById('finPedidosTienda');
    const finRecoger = document.getElementById('finVentaRecoger');
    const finPedRecoger = document.getElementById('finPedidosRecoger');
    const finTicket = document.getElementById('finTicketPromedio');

    if (finTotal) finTotal.textContent = `$${totalGeneral.toFixed(2)}`;
    if (finTotalPed) finTotalPed.textContent = `${ventas.length} órdenes registradas`;
    if (finTienda) finTienda.textContent = `$${totalTienda.toFixed(2)}`;
    if (finPedTienda) finPedTienda.textContent = `${pedidosTiendaCount} órdenes`;
    if (finRecoger) finRecoger.textContent = `$${totalRecoger.toFixed(2)}`;
    if (finPedRecoger) finPedRecoger.textContent = `${pedidosRecogerCount} órdenes`;
    if (finTicket) finTicket.textContent = `$${ticketProm.toFixed(2)}`;

    const tbody = document.getElementById('financeTableBody');
    if (tbody) {
        tbody.innerHTML = ventas.map(v => `
            <tr>
                <td><strong>${v.turno}</strong></td>
                <td>${new Date(v.fecha_completa).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</td>
                <td>${v.cliente}</td>
                <td><span style="background:${v.tipo==='tienda'?'#0284C7':'#EA580C'}; color:#FFF; padding:2px 6px; border-radius:6px; font-size:0.75rem;">${v.tipo.toUpperCase()}</span></td>
                <td>${v.items.map(i => i.nombre).join(', ')}</td>
                <td><strong>$${v.total.toFixed(2)}</strong></td>
            </tr>
        `).join('');
    }

    renderizarGraficasFinancieras(ventas);
}

function renderizarGraficasFinancieras(ventas) {
    if (typeof Chart === 'undefined') return;

    const ventasPorFecha = {};
    ventas.forEach(v => {
        const fechaDia = v.fecha_completa ? v.fecha_completa.split('T')[0] : 'Hoy';
        ventasPorFecha[fechaDia] = (ventasPorFecha[fechaDia] || 0) + v.total;
    });

    const labelsDias = Object.keys(ventasPorFecha);
    const dataDias = Object.values(ventasPorFecha);

    const productosConteo = {};
    ventas.forEach(v => {
        v.items.forEach(it => {
            const nombreProd = it.nombre || 'Botana';
            productosConteo[nombreProd] = (productosConteo[nombreProd] || 0) + 1;
        });
    });

    const topProductosSorted = Object.entries(productosConteo)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    const labelsProds = topProductosSorted.map(p => p[0]);
    const dataProds = topProductosSorted.map(p => p[1]);

    const canvasDias = document.getElementById('chartVentasDias');
    if (canvasDias) {
        if (chartVentasDiasInstance) chartVentasDiasInstance.destroy();
        chartVentasDiasInstance = new Chart(canvasDias, {
            type: 'line',
            data: {
                labels: labelsDias.length > 0 ? labelsDias : ['Sin datos'],
                datasets: [{
                    label: 'Ventas ($MXN)',
                    data: dataDias.length > 0 ? dataDias : [0],
                    borderColor: '#F59E0B',
                    backgroundColor: 'rgba(245, 158, 11, 0.15)',
                    fill: true,
                    tension: 0.3,
                    borderWidth: 3,
                    pointBackgroundColor: '#F59E0B',
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: '#94A3B8', font: { family: 'Poppins' } } }
                },
                scales: {
                    x: { ticks: { color: '#94A3B8' }, grid: { color: '#334155' } },
                    y: { ticks: { color: '#94A3B8' }, grid: { color: '#334155' } }
                }
            }
        });
    }

    const canvasProds = document.getElementById('chartTopProductos');
    if (canvasProds) {
        if (chartTopProductosInstance) chartTopProductosInstance.destroy();
        chartTopProductosInstance = new Chart(canvasProds, {
            type: 'doughnut',
            data: {
                labels: labelsProds.length > 0 ? labelsProds : ['Sin ventas'],
                datasets: [{
                    data: dataProds.length > 0 ? dataProds : [1],
                    backgroundColor: ['#F59E0B', '#10B981', '#0284C7', '#EC4899', '#8B5CF6'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#94A3B8', font: { family: 'Poppins' } }
                    }
                }
            }
        });
    }
}

function exportarReporteVentasCSV() {
    if (pedidosGlobalesSheets.length === 0) {
        alert("No hay ventas registradas para exportar.");
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Turno,Cliente,Telefono,Tipo,Total,Fecha,Detalle\n";

    pedidosGlobalesSheets.forEach(p => {
        const detalleLimpio = p.items.map(i => i.nombre).join(' | ').replace(/,/g, ' ');
        csvContent += `"${p.turno}","${p.cliente}","${p.telefono}","${p.tipo}","${p.total}","${p.fecha_completa}","${detalleLimpio}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Ventas_LaEngordadera_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

async function borrarHistorialFinanciero() {
    if (!confirm("⚠️ ¿Estás seguro de reiniciar todo el historial? Se borrarán los datos de la tabla y las gráficas.")) return;

    pedidosGlobalesSheets = [];
    renderizarTableroKanban();
    actualizarMetricasHeader();
    actualizarModuloFinanzas();

    if (WEB_APP_URL) {
        try {
            await fetch(WEB_APP_URL, {
                method: 'POST',
                body: JSON.stringify({
                    action: 'borrar_historial',
                    sheet: 'Ventas_Historicas'
                })
            });
        } catch (e) {}
    }

    alert("✅ El historial financiero ha sido reiniciado.");
}
