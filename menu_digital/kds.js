// ======================================================
// KDS & FINANZAS & POS MOSTRADOR LA ENGORDADERA
// ======================================================
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzoB4Q5crNsK8UC4oGRpFE8qJWPaHPhhxqdrRO6hNZB1grViQRnkPmxdpRwqhbeno8gqw/exec"; 
let INTERVALO_SEGUNDOS = 4;

let pedidosGlobalesSheets = [];
let productosMenuPOS = [];
let carritoPOS = [];
let filtroEstacionActual = 'TODAS';
let turnosConocidosEnCola = new Set();
let primerCargaRealizada = false;
let audioContext = null;
let pedidoTemporalParaTiempo = null;
let pedidoModalActivo = null;
let metodoPagoSeleccionadoModal = '';

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
    crearBarraDiagnostico();
    iniciarReloj();
    
    document.addEventListener('click', desbloquearAudioNativo, { once: true });
    document.addEventListener('touchstart', desbloquearAudioNativo, { once: true });

    iniciarKDS();
    cargarProductosParaPOS();
    setInterval(consultarPedidosNube, INTERVALO_SEGUNDOS * 1000);
    setInterval(actualizarSemaforosTiempo, 1000);
});

function desbloquearAudioNativo() {
    try {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
    } catch (e) {
        console.warn("AudioContext no disponible:", e);
    }
}

function emitirCampanaNuevoPedido() {
    try {
        desbloquearAudioNativo();
        if (!audioContext) return;

        const ahora = audioContext.currentTime;

        const osc1 = audioContext.createOscillator();
        const gain1 = audioContext.createGain();
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(880, ahora);
        gain1.gain.setValueAtTime(0.3, ahora);
        gain1.gain.exponentialRampToValueAtTime(0.001, ahora + 0.35);
        osc1.connect(gain1);
        gain1.connect(audioContext.destination);
        osc1.start(ahora);
        osc1.stop(ahora + 0.35);

        const osc2 = audioContext.createOscillator();
        const gain2 = audioContext.createGain();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(1174.66, ahora + 0.12);
        gain2.gain.setValueAtTime(0.4, ahora + 0.12);
        gain2.gain.exponentialRampToValueAtTime(0.001, ahora + 0.6);
        osc2.connect(gain2);
        gain2.connect(audioContext.destination);
        osc2.start(ahora + 0.12);
        osc2.stop(ahora + 0.6);
    } catch (e) {
        console.warn("No se pudo reproducir sintetizador:", e);
    }
}

function crearBarraDiagnostico() {
    if (document.getElementById('kdsDebugBar')) return;
    const bar = document.createElement('div');
    bar.id = 'kdsDebugBar';
    bar.style.cssText = 'position:fixed; bottom:12px; left:12px; background:#0F172A; color:#F8FAFC; padding:8px 14px; border-radius:12px; font-family:monospace; font-size:0.75rem; z-index:99999; box-shadow:0 4px 14px rgba(0,0,0,0.5); border:1px solid #334155; display:flex; align-items:center; gap:8px;';
    bar.innerHTML = `<span>⏳ Conectando con Google Sheets...</span>`;
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

async function enviarPeticionAppsScript(payload) {
    if (!WEB_APP_URL || WEB_APP_URL.includes("TU_SCRIPT_ID")) return;
    try {
        await fetch(WEB_APP_URL, {
            method: 'POST',
            mode: 'no-cors', // Evita bloqueos de CORS en navegadores
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload)
        });
    } catch (e) {
        console.warn("Error enviando acción a Sheets:", e);
    }
}

async function consultarPedidosNube() {
    if (!WEB_APP_URL || WEB_APP_URL.includes("TU_SCRIPT_ID")) return;

    try {
        let res = await fetch(`${WEB_APP_URL}?sheet=Ventas_Historicas&t=${Date.now()}`);
        let data = await res.json();

        if (!Array.isArray(data)) {
            actualizarBarraDiagnostico(`Apps Script: ${data.error || 'Respuesta inválida'}`, true);
            return;
        }

        actualizarBarraDiagnostico(`Sheets Conectado | ${data.length} pedidos | Sinc: ${new Date().toLocaleTimeString()}`);

        pedidosGlobalesSheets = data.map((fila, index) => {
            const turnoVal = String(obtenerCampoFlexible(fila, ['turno', 'id_turno', 'ticket']) || `#T-${index + 1}`).trim();
            const clienteVal = obtenerCampoFlexible(fila, ['cliente', 'nombre']) || 'Cliente';
            const telefonoVal = String(obtenerCampoFlexible(fila, ['telefono', 'tel', 'celular']) || '');
            
            const tipoRaw = normalizarTextoClave(obtenerCampoFlexible(fila, ['tipo', 'tipo_pedido']) || 'tienda');
            const tipoVal = (tipoRaw.includes('recog') || tipoRaw.includes('llevar')) ? 'recoger' : 'tienda';

            const totalVal = parseFloat(obtenerCampoFlexible(fila, ['total', 'monto']) || 0);
            const fechaVal = obtenerCampoFlexible(fila, ['fecha', 'hora', 'fecha_completa']) || new Date().toISOString();
            const detalleVal = obtenerCampoFlexible(fila, ['detalle', 'descripcion', 'productos']) || '';
            const itemsJsonVal = obtenerCampoFlexible(fila, ['items_json', 'items', 'json']);

            const pagadoRaw = String(obtenerCampoFlexible(fila, ['pagado', 'pago', 'status_pago']) || '').toLowerCase().trim();
            const estaPagado = (tipoVal === 'tienda') || (pagadoRaw.startsWith('si') || pagadoRaw === 'true' || pagadoRaw === '1' || pagadoRaw === 'pagado');

            let items = [];
            try {
                if (itemsJsonVal && String(itemsJsonVal).trim().startsWith('[')) {
                    items = JSON.parse(itemsJsonVal);
                } else if (detalleVal) {
                    items = detalleVal.split('//').map(d => ({ nombre: d.trim(), extras: [], ingredientes: [], base: '', salsa: '', precio: 0 }));
                }
            } catch (e) {
                items = [{ nombre: detalleVal || 'Botana', extras: [], ingredientes: [], base: '', salsa: '', precio: totalVal }];
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
                pagado_detalle: pagadoRaw,
                fecha_completa: fechaVal,
                estado: estadoRaw,
                items: items,
                detalle_crudo: detalleVal
            };
        });

        const turnosActualesCola = pedidosGlobalesSheets.filter(p => p.estado === 'cola').map(p => p.turno);
        
        if (primerCargaRealizada) {
            const hayNuevos = turnosActualesCola.some(t => !turnosConocidosEnCola.has(t));
            if (hayNuevos) {
                emitirCampanaNuevoPedido();
                destellarColumnaCola();
            }
        } else {
            primerCargaRealizada = true;
        }

        turnosConocidosEnCola = new Set(turnosActualesCola);

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

function destellarColumnaCola() {
    const colCola = document.getElementById('col-cola');
    if (!colCola) return;
    colCola.style.transition = 'box-shadow 0.3s ease';
    colCola.style.boxShadow = '0 0 25px rgba(245, 158, 11, 0.9)';
    setTimeout(() => {
        colCola.style.boxShadow = 'none';
    }, 1800);
}

function renderizarTableroKanban() {
    const contCola = document.getElementById('containerCola');
    const contPrep = document.getElementById('containerPrep');
    const contListos = document.getElementById('containerListos');

    if (!contCola || !contPrep || !contListos) return;

    let pedidos = pedidosGlobalesSheets.filter(p => {
        const est = String(p.estado || '').toLowerCase().trim();
        return est !== 'cancelado' && est !== 'rechazado' && est !== 'entregado';
    });

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
    const esRecoger = String(pedido.tipo).toLowerCase().includes('recog');
    const telefonoLimpio = String(pedido.telefono || '').replace(/\D/g, '');
    const turnoAtributo = pedido.turno.replace(/"/g, '&quot;');

    let itemsHTML = '';
    if (pedido.items && pedido.items.length > 0) {
        pedido.items.forEach((it, idx) => {
            let detalles = [];
            if (it.base) detalles.push(`Base: <span style="color:#FFF;">${it.base}</span>`);
            if (it.ingredientes && it.ingredientes.length > 0) detalles.push(`Con: <span style="color:#FFF;">${it.ingredientes.join(', ')}</span>`);
            if (it.extras && it.extras.length > 0) detalles.push(`Extras: <span style="color:#F59E0B; font-weight:600;">${it.extras.join(', ')}</span>`);
            if (it.salsa) detalles.push(`Salsa: <span style="color:#F472B6;">${it.salsa}</span>`);

            itemsHTML += `
                <div class="kds-item-row" style="margin-bottom: 6px; border-bottom: 1px dashed rgba(255,255,255,0.1); padding-bottom: 4px;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <strong style="color: #F8FAFC; font-size: 0.95rem;">${idx + 1}. 🍿 ${it.nombre}</strong>
                        ${it.precio ? `<span style="color:#F59E0B; font-size:0.85rem; font-weight:700;">$${parseFloat(it.precio).toFixed(2)}</span>` : ''}
                    </div>
                    <p style="color: #94A3B8; font-size: 0.78rem; margin: 2px 0 0 0; line-height: 1.35;">${detalles.join(' | ') || 'Clásico'}</p>
                </div>
            `;
        });
    } else if (pedido.detalle_crudo) {
        itemsHTML = `<div style="color:#CBD5E1; font-size:0.85rem; margin-bottom:6px;">${pedido.detalle_crudo}</div>`;
    }

    let botonesAccionHTML = '';

    if (pedido.estado === 'cola') {
        botonesAccionHTML = `
            <button type="button" class="btn-card-action" style="flex:1.2; background:#10B981; color:#FFF; border:none; padding:10px; border-radius:8px; font-weight:700; cursor:pointer;" onclick="manejarAccionBoton(event, 'aceptar', '${turnoAtributo}', '${telefonoLimpio}')">
                <i class="fa-solid fa-check"></i> Aceptar
            </button>
            <button type="button" class="btn-card-action" title="Rechazar Pedido" style="background:#DC2626; color:#FFF; border:none; padding:10px 10px; border-radius:8px; font-weight:700; cursor:pointer;" onclick="manejarAccionBoton(event, 'rechazar', '${turnoAtributo}', '${telefonoLimpio}')">
                <i class="fa-solid fa-xmark"></i> Rechazar
            </button>
        `;
    } else if (pedido.estado === 'preparando') {
        if (esRecoger && telefonoLimpio.length >= 10) {
            botonesAccionHTML = `
                <button type="button" class="btn-card-action" style="flex:1.2; background:#10B981; color:#FFF; border:none; padding:10px; border-radius:8px; font-weight:700; cursor:pointer;" onclick="manejarAccionBoton(event, 'listo', '${turnoAtributo}', '${telefonoLimpio}')">
                    <i class="fa-solid fa-check-double"></i> Listo
                </button>
                <button type="button" class="btn-card-action" title="Avisar por WhatsApp" style="background:#25D366; color:#FFF; border:none; padding:10px 12px; border-radius:8px; font-weight:700; cursor:pointer;" onclick="manejarAccionBoton(event, 'avisar', '${turnoAtributo}', '${telefonoLimpio}')">
                    <i class="fa-solid fa-bell"></i> Avisar
                </button>
            `;
        } else {
            botonesAccionHTML = `
                <button type="button" class="btn-card-action" style="flex:1; background:#10B981; color:#FFF; border:none; padding:10px; border-radius:8px; font-weight:700; cursor:pointer;" onclick="manejarAccionBoton(event, 'listo', '${turnoAtributo}', '${telefonoLimpio}')">
                    <i class="fa-solid fa-check-double"></i> Listo
                </button>
            `;
        }
    } else {
        botonesAccionHTML = `
            <button type="button" class="btn-card-action" style="flex:1; background:#475569; color:#FFF; border:none; padding:8px; border-radius:8px; font-weight:600; cursor:pointer; font-size:0.8rem;" onclick="manejarAccionBoton(event, 'entregado', '${turnoAtributo}', '${telefonoLimpio}')">
                <i class="fa-solid fa-box-archive"></i> Entregar
            </button>
        `;
    }

    const botonPagoHTML = pedido.pagado ? `
        <button type="button" title="Pago Confirmado" style="background:#14532D; color:#86EFAC; border:1px solid #166534; padding:3px 8px; border-radius:8px; font-size:0.72rem; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; gap:4px;" onclick="manejarAccionBoton(event, 'pago_no', '${turnoAtributo}', '')">
            <i class="fa-solid fa-circle-check"></i> Pagado
        </button>
    ` : `
        <button type="button" title="Clic para marcar como Pagado" style="background:#7F1D1D; color:#FCA5A5; border:1px solid #991B1B; padding:3px 8px; border-radius:8px; font-size:0.72rem; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; gap:4px;" onclick="manejarAccionBoton(event, 'pago_si', '${turnoAtributo}', '')">
            <i class="fa-solid fa-clock-rotate-left"></i> Pago Pendiente
        </button>
    `;

    return `
        <div class="kds-card state-${pedido.estado} ${semaforo.claseAlerta}" data-fecha="${pedido.fecha_completa}" onclick="abrirModalDetallePedido('${turnoAtributo}')" style="background:#1E293B; border-radius:12px; padding:12px; margin-bottom:12px; border:1.5px solid ${pedido.estado === 'cola' ? '#F59E0B' : '#334155'}; box-shadow:0 4px 10px rgba(0,0,0,0.2); cursor:pointer;">
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
                ${botonesAccionHTML}
                <button type="button" title="Eliminar Pedido" style="background:#7F1D1D; color:#FCA5A5; border:1px solid #991B1B; padding:8px 12px; border-radius:8px; cursor:pointer;" onclick="manejarAccionBoton(event, 'eliminar', '${turnoAtributo}', '')">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        </div>
    `;
}

// ======================================================
// DISPATCHER CENTRAL DE ACCIONES (SIN COLISIONES DE EVENTOS)
// ======================================================
async function manejarAccionBoton(e, accion, turno, telefono) {
    if (e) {
        e.stopPropagation();
        e.preventDefault();
    }

    const turnoLimpio = String(turno || '').trim();

    if (accion === 'aceptar') {
        await cambiarEstadoPedidoNube(turnoLimpio, 'preparando');
        if (telefono && String(telefono).replace(/\D/g, '').length >= 10) {
            abrirModalTiempoEstimado(turnoLimpio, telefono);
        }
    } 
    else if (accion === 'rechazar') {
        if (!confirm(`⚠️ ¿Deseas rechazar el pedido ${turnoLimpio}? Si pagó en línea, su dinero será devuelto a su cuenta.`)) return;

        // Quitar de la pantalla inmediatamente
        pedidosGlobalesSheets = pedidosGlobalesSheets.filter(p => String(p.turno).trim().toUpperCase() !== turnoLimpio.toUpperCase());
        renderizarTableroKanban();
        actualizarMetricasHeader();

        await enviarPeticionAppsScript({
            action: 'rechazar_y_reembolsar',
            turno: turnoLimpio,
            motivo: 'Saturación en cocina / Sin insumos'
        });

        if (telefono && String(telefono).replace(/\D/g, '').length >= 10) {
            const msg = encodeURIComponent(`🍿 *La Engordadera:* Hola. Lamentamos informarte que no pudimos tomar tu orden *${turnoLimpio}* por saturación en cocina.\n\n💸 Si realizaste tu pago en línea, tu dinero ha sido devuelto a tu cuenta.`);
            window.open(`https://wa.me/521${telefono}?text=${msg}`, '_blank');
        }
    }
    else if (accion === 'eliminar') {
        if (!confirm(`¿Deseas eliminar permanentemente el pedido ${turnoLimpio}?`)) return;

        pedidosGlobalesSheets = pedidosGlobalesSheets.filter(p => String(p.turno).trim().toUpperCase() !== turnoLimpio.toUpperCase());
        renderizarTableroKanban();
        actualizarMetricasHeader();

        await enviarPeticionAppsScript({
            action: 'eliminar_pedido',
            sheet: 'Ventas_Historicas',
            turno: turnoLimpio
        });
    }
    else if (accion === 'listo') {
        await cambiarEstadoPedidoNube(turnoLimpio, 'listo');
    }
    else if (accion === 'entregado') {
        await cambiarEstadoPedidoNube(turnoLimpio, 'entregado');
    }
    else if (accion === 'avisar') {
        const msg = encodeURIComponent(`🍿 *La Engordadera:* ¡Tu pedido *${turnoLimpio}* ya está LISTO para recoger! 🎉 Puedes pasar a mostrador por él.`);
        window.open(`https://wa.me/521${telefono}?text=${msg}`, '_blank');
    }
    else if (accion === 'pago_si') {
        await alternarEstadoPagoNube(turnoLimpio, true);
    }
    else if (accion === 'pago_no') {
        await alternarEstadoPagoNube(turnoLimpio, false);
    }
}

// ======================================================
// CAMBIO DE ESTADOS Y SINCRONIZACIÓN
// ======================================================
async function cambiarEstadoPedidoNube(turno, nuevoEstado) {
    const idx = pedidosGlobalesSheets.findIndex(p => String(p.turno).trim().toUpperCase() === String(turno).trim().toUpperCase());
    if (idx !== -1) {
        pedidosGlobalesSheets[idx].estado = nuevoEstado;
        renderizarTableroKanban();
        actualizarMetricasHeader();
    }

    await enviarPeticionAppsScript({
        action: 'actualizar_estado',
        sheet: 'Ventas_Historicas',
        turno: turno,
        estado: nuevoEstado
    });
}

async function alternarEstadoPagoNube(turno, nuevoEstadoPago, metodoOpcional = '') {
    const idx = pedidosGlobalesSheets.findIndex(p => String(p.turno).trim().toUpperCase() === String(turno).trim().toUpperCase());
    if (idx !== -1) {
        pedidosGlobalesSheets[idx].pagado = nuevoEstadoPago;
        renderizarTableroKanban();
    }

    const textoPago = nuevoEstadoPago ? (metodoOpcional ? `SI (${metodoOpcional})` : 'SI') : 'NO';
    await enviarPeticionAppsScript({
        action: 'actualizar_pago',
        sheet: 'Ventas_Historicas',
        turno: turno,
        pagado: textoPago
    });
}

// ======================================================
// MODAL DE DETALLE INTERACTIVO KDS
// ======================================================
function abrirModalDetallePedido(turno) {
    const pedido = pedidosGlobalesSheets.find(p => String(p.turno).trim().toUpperCase() === String(turno).trim().toUpperCase());
    if (!pedido) return;

    pedidoModalActivo = pedido;
    metodoPagoSeleccionadoModal = '';

    document.getElementById('modalTurno').textContent = pedido.turno;
    document.getElementById('modalCliente').textContent = `Cliente: ${pedido.cliente}`;
    document.getElementById('modalTelefono').textContent = pedido.telefono || 'Sin registrar';
    document.getElementById('modalTotalMonto').textContent = `$${parseFloat(pedido.total || 0).toFixed(2)}`;

    const esTienda = String(pedido.tipo).toLowerCase().includes('tienda');
    const badgeTipo = document.getElementById('modalBadgeTipo');
    badgeTipo.style.background = esTienda ? '#0284C7' : '#EA580C';
    badgeTipo.style.color = '#FFF';
    badgeTipo.textContent = esTienda ? '🏪 EN TIENDA' : '🛍️ PARA RECOGER';

    const contactBox = document.getElementById('modalContactActions');
    contactBox.innerHTML = '';
    const telLimpio = String(pedido.telefono || '').replace(/\D/g, '');
    if (telLimpio.length >= 10) {
        contactBox.innerHTML = `
            <a href="tel:${telLimpio}" class="btn-card-action" style="background:#3B82F6; color:#FFF; padding:5px 10px; border-radius:6px; text-decoration:none;"><i class="fa-solid fa-phone"></i></a>
            <a href="https://wa.me/521${telLimpio}" target="_blank" class="btn-card-action" style="background:#25D366; color:#FFF; padding:5px 10px; border-radius:6px; text-decoration:none;"><i class="fa-brands fa-whatsapp"></i></a>
        `;
    }

    const itemsList = document.getElementById('modalItemsList');
    if (pedido.items && pedido.items.length > 0) {
        itemsList.innerHTML = pedido.items.map((it, idx) => `
            <div style="margin-bottom:8px; padding-bottom:6px; border-bottom:1px dashed #334155;">
                <div style="display:flex; justify-content:space-between;">
                    <strong style="color:#F59E0B; font-size:0.95rem;">${idx + 1}. 🍿 ${it.nombre}</strong>
                    <span style="color:#10B981; font-weight:700;">$${parseFloat(it.precio || 0).toFixed(2)}</span>
                </div>
                <div style="font-size:0.8rem; color:#CBD5E1; margin-top:3px; line-height:1.35;">
                    ${it.base ? `• Base: <strong>${it.base}</strong><br>` : ''}
                    ${it.ingredientes && it.ingredientes.length > 0 ? `• Con: <strong>${it.ingredientes.join(', ')}</strong><br>` : ''}
                    ${it.extras && it.extras.length > 0 ? `• Extras: <strong style="color:#F472B6;">${it.extras.join(', ')}</strong><br>` : ''}
                    ${it.salsa ? `• Salsa: <strong>${it.salsa}</strong>` : ''}
                </div>
            </div>
        `).join('');
    } else {
        itemsList.innerHTML = `<p style="font-size:0.85rem; color:#CBD5E1;">${pedido.detalle_crudo || 'Sin detalles'}</p>`;
    }

    const paySelector = document.getElementById('modalPaySelectorWrapper');
    const pickupNotice = document.getElementById('modalPickupPayNotice');
    if (esTienda) {
        paySelector.style.display = 'block';
        pickupNotice.style.display = 'none';
    } else {
        paySelector.style.display = 'none';
        pickupNotice.style.display = 'block';
    }

    document.querySelectorAll('.kds-pay-btn').forEach(btn => btn.classList.remove('active'));

    const modal = document.getElementById('kdsDetailModal');
    if (modal) modal.classList.add('active');
}

function seleccionarMetodoPagoModal(metodo, btnEl) {
    metodoPagoSeleccionadoModal = metodo;
    document.querySelectorAll('.kds-pay-btn').forEach(b => b.classList.remove('active'));
    btnEl.classList.add('active');
}

function cerrarModalDetallePedido() {
    const modal = document.getElementById('kdsDetailModal');
    if (modal) modal.classList.remove('active');
    pedidoModalActivo = null;
}

async function cambiarEstadoDesdeModal(nuevoEstado) {
    if (!pedidoModalActivo) return;
    const turno = pedidoModalActivo.turno;
    const esTienda = String(pedidoModalActivo.tipo).toLowerCase().includes('tienda');

    if (esTienda && metodoPagoSeleccionadoModal) {
        await alternarEstadoPagoNube(turno, true, metodoPagoSeleccionadoModal);
    }

    await cambiarEstadoPedidoNube(turno, nuevoEstado);
    cerrarModalDetallePedido();
}

function abrirModalTiempoEstimado(turno, telefono) {
    pedidoTemporalParaTiempo = { turno, telefono };
    
    const modal = document.getElementById('timeModal');
    const desc = document.getElementById('timeModalClientDesc');
    if (desc) desc.textContent = `Indica en cuántos minutos estará listo el turno ${turno}:`;

    if (modal) {
        modal.classList.add('active');
        modal.style.display = 'flex';
    }
}

function confirmarTiempoYNotificar(minutos) {
    if (pedidoTemporalParaTiempo) {
        const turno = pedidoTemporalParaTiempo.turno;
        const tel = pedidoTemporalParaTiempo.telefono;
        const msg = encodeURIComponent(`🍿 *La Engordadera:* Tu pedido *${turno}* fue ACEPTADO y ya está en preparación 🔥. Estará listo en aproximadamente *${minutos} minutos*. ¡Te esperamos!`);
        window.open(`https://wa.me/521${tel}?text=${msg}`, '_blank');
    }
    cerrarModalTiempo();
}

function cerrarModalTiempo() {
    const modal = document.getElementById('timeModal');
    if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
    }
    pedidoTemporalParaTiempo = null;
}

function reiniciarContadorTurnos() {
    if (!confirm("¿Deseas reiniciar los turnos? El siguiente pedido volverá a comenzar en #T-01 y #R-01.")) return;
    localStorage.removeItem('turno_T_consecutivo');
    localStorage.removeItem('turno_R_consecutivo');
    alert("✅ Consecutivos de turno reiniciados a 0.");
}

function limpiarEntregadosAntiguos() {
    pedidosGlobalesSheets = pedidosGlobalesSheets.filter(p => p.estado !== 'listo' && p.estado !== 'entregado');
    renderizarTableroKanban();
    actualizarMetricasHeader();
}

function calcularSemaforoTiempo(fechaISO) {
    const ahora = new Date();
    let creacion = new Date(fechaISO);

    if (isNaN(creacion.getTime())) {
        const match = String(fechaISO).match(/(\d{1,2}):(\d{2})/);
        if (match) {
            creacion = new Date();
            creacion.setHours(parseInt(match[1], 10), parseInt(match[2], 10), 0, 0);
        }
    }

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

// ======================================================
// POS MOSTRADOR
// ======================================================
async function cargarProductosParaPOS() {
    if (!WEB_APP_URL || WEB_APP_URL.includes("TU_SCRIPT_ID")) return;
    try {
        const res = await fetch(`${WEB_APP_URL}?sheet=Productos`);
        const prods = await res.json();
        if (Array.isArray(prods)) {
            productosMenuPOS = prods;
            renderizarBotoneraPOS();
        }
    } catch (e) {
        console.warn("No se cargó menú para POS.");
    }
}

function renderizarBotoneraPOS() {
    const grid = document.getElementById('posProductsGrid');
    if (!grid) return;

    grid.innerHTML = '';
    productosMenuPOS.forEach(p => {
        const precioNum = parseFloat(p.precio || 0);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'pos-product-card';
        btn.innerHTML = `
            <strong style="font-size: 0.9rem; color: #F8FAFC; display: block; margin-bottom: 4px; font-family:var(--font-heading);">${p.nombre}</strong>
            <span style="color: var(--primary-pink); font-weight: 700; font-size: 1.05rem; font-family:var(--font-heading);">$${precioNum.toFixed(2)}</span>
        `;
        btn.onclick = () => agregarItemPOS(p.nombre, precioNum);
        grid.appendChild(btn);
    });
}

function agregarItemPOS(nombre, precio) {
    carritoPOS.push({ nombre, precio: parseFloat(precio) || 0 });
    renderizarCarritoPOS();
}

function agregarItemManualPOS() {
    const concept = document.getElementById('posCustomConcept').value.trim() || 'Botana Libre';
    const price = parseFloat(document.getElementById('posCustomPrice').value) || 0;

    if (price <= 0) {
        alert("Ingresa un monto válido");
        return;
    }

    carritoPOS.push({ nombre: concept, precio: price });
    document.getElementById('posCustomConcept').value = '';
    document.getElementById('posCustomPrice').value = '';
    renderizarCarritoPOS();
}

function renderizarCarritoPOS() {
    const list = document.getElementById('posCartItemsList');
    const totalEl = document.getElementById('posTotalCobro');
    if (!list || !totalEl) return;

    if (carritoPOS.length === 0) {
        list.innerHTML = '<p style="color: #64748B; text-align: center; margin: 30px 0;">No hay productos seleccionados</p>';
        totalEl.textContent = '$0.00';
        return;
    }

    let total = 0;
    list.innerHTML = carritoPOS.map((item, idx) => {
        total += item.precio;
        return `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px dashed #334155;">
                <span style="color: #F8FAFC; font-size: 0.9rem;">${item.nombre}</span>
                <div>
                    <strong style="color: var(--primary-pink); margin-right: 8px;">$${item.precio.toFixed(2)}</strong>
                    <button type="button" onclick="eliminarItemPOS(${idx})" style="background: transparent; color: #EF4444; border: none; font-size: 1.1rem; cursor: pointer;">&times;</button>
                </div>
            </div>
        `;
    }).join('');

    totalEl.textContent = `$${total.toFixed(2)}`;
}

function eliminarItemPOS(index) {
    carritoPOS.splice(index, 1);
    renderizarCarritoPOS();
}

function vaciarCarritoPOS() {
    carritoPOS = [];
    document.getElementById('posClientInput').value = '';
    renderizarCarritoPOS();
}

async function registrarVentaManualPOS() {
    if (carritoPOS.length === 0) {
        alert("Agrega al menos un producto para cobrar.");
        return;
    }

    const clienteInput = document.getElementById('posClientInput').value.trim() || 'Cliente Mostrador';
    const despacharYa = document.getElementById('posMarkReadyDirectly').checked;
    const total = carritoPOS.reduce((sum, it) => sum + it.precio, 0);

    let turnoManual = '#T-' + Math.floor(Math.random() * 90 + 10);
    if (pedidosGlobalesSheets.length > 0) {
        let max = 0;
        pedidosGlobalesSheets.forEach(p => {
            const m = String(p.turno || '').match(/^#?T-(\d+)/i);
            if (m && parseInt(m[1], 10) > max) max = parseInt(m[1], 10);
        });
        turnoManual = `#T-${max + 1 < 10 ? '0' + (max + 1) : max + 1}`;
    }

    const puntosGanados = Math.max(1, Math.floor(total * 0.1));

    if (WEB_APP_URL && clienteInput.length >= 3) {
        await enviarPeticionAppsScript({
            action: 'procesar_puntos',
            sheet: 'Clientes_Lealtad',
            telefono: clienteInput.replace(/\D/g, '') || clienteInput,
            nombre: clienteInput,
            puntos_ganados: puntosGanados,
            meta_puntos: 100
        });
    }

    const payloadVenta = {
        action: 'insertar_venta',
        sheet: 'Ventas_Historicas',
        data: {
            turno: turnoManual,
            cliente: clienteInput,
            telefono: clienteInput,
            tipo: 'tienda',
            total: total,
            pagado: 'SI',
            fecha: new Date().toISOString(),
            estado: despacharYa ? 'listo' : 'cola',
            items_json: JSON.stringify(carritoPOS),
            detalle: carritoPOS.map(i => i.nombre + ' ($' + i.precio + ')').join(' | ')
        }
    };

    await enviarPeticionAppsScript(payloadVenta);

    alert(`✅ ¡Venta cobrada con éxito!\nTurno: ${turnoManual}\nTotal: $${total.toFixed(2)}\nPuntos sumados: +${puntosGanados} pts`);
    vaciarCarritoPOS();
    await consultarPedidosNube();
    mostrarVista(despacharYa ? 'pos' : 'kds');
}

function mostrarVista(vista) {
    const vistaKDS = document.getElementById('vistaKDS');
    const vistaPOS = document.getElementById('vistaPOS');
    const vistaFin = document.getElementById('vistaFinanzas');
    
    const btnKDS = document.getElementById('tabBtnKDS');
    const btnPOS = document.getElementById('tabBtnPOS');
    const btnFin = document.getElementById('tabBtnFinanzas');
    
    const filters = document.getElementById('stationFiltersHeader');
    const metrics = document.getElementById('kdsMetricsHeader');

    if (vistaKDS) vistaKDS.style.display = 'none';
    if (vistaPOS) vistaPOS.style.display = 'none';
    if (vistaFin) vistaFin.style.display = 'none';

    btnKDS.classList.remove('active');
    btnPOS.classList.remove('active');
    btnFin.classList.remove('active');

    if (vista === 'kds') {
        vistaKDS.style.display = 'grid';
        btnKDS.classList.add('active');
        if (filters) filters.style.display = 'flex';
        if (metrics) metrics.style.display = 'flex';
    } else if (vista === 'pos') {
        vistaPOS.style.display = 'block';
        btnPOS.classList.add('active');
        if (filters) filters.style.display = 'none';
        if (metrics) metrics.style.display = 'none';
        renderizarCarritoPOS();
    } else {
        vistaFin.style.display = 'block';
        btnFin.classList.add('active');
        if (filters) filters.style.display = 'none';
        if (metrics) metrics.style.display = 'flex';
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
                    borderColor: '#E91E63',
                    backgroundColor: 'rgba(233, 30, 99, 0.15)',
                    fill: true,
                    tension: 0.3,
                    borderWidth: 3,
                    pointBackgroundColor: '#E91E63',
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
                    backgroundColor: ['#E91E63', '#10B981', '#0284C7', '#FFC107', '#8B5CF6'],
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

    await enviarPeticionAppsScript({
        action: 'borrar_historial',
        sheet: 'Ventas_Historicas'
    });

    alert("✅ El historial financiero ha sido reiniciado.");
}
