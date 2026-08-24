// ======================================================
// KDS & FINANZAS LA ENGORDADERA (NUBE GOOGLE SHEETS)
// ======================================================
const SHEETDB_INPUT = "sq3j6nb77cl27"; 
const INTERVALO_SEGUNDOS = 4;

function obtenerIdLimpioSheetDB(input) {
    if (!input || input.includes("TU_ID")) return "";
    return input.trim().replace(/^https?:\/\/sheetdb\.io\/api\/v1\//i, "").split("?")[0].replace(/\/$/, "");
}

const SHEETDB_ID = obtenerIdLimpioSheetDB(SHEETDB_INPUT);

let pedidosGlobalesSheets = [];
let filtroEstacionActual = 'TODAS';
let ultimoTurnoRegistrado = '';
let audioAlerta = null;
let pedidoTemporalParaTiempo = null;

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
    
    iniciarReloj();
    iniciarKDS();
    setInterval(consultarPedidosNube, INTERVALO_SEGUNDOS * 1000);
    setInterval(actualizarSemaforosTiempo, 1000);
});

function iniciarReloj() {
    setInterval(() => {
        const clockEl = document.getElementById('liveClock');
        if (clockEl) {
            clockEl.textContent = new Date().toLocaleTimeString();
        }
    }, 1000);
}

async function iniciarKDS() {
    if (!SHEETDB_ID) {
        console.error("❌ Falta configurar SHEETDB_ID en kds.js");
        return;
    }
    await consultarPedidosNube();
}

async function consultarPedidosNube() {
    if (!SHEETDB_ID) return;

    try {
        let url = `https://sheetdb.io/api/v1/${SHEETDB_ID}?sheet=Ventas_Historicas`;
        let res = await fetch(url);
        let data = await res.json();

        if (data && data.error && data.error.includes("not found")) {
            url = `https://sheetdb.io/api/v1/${SHEETDB_ID}?sheet=Ventas%20Historicas`;
            res = await fetch(url);
            data = await res.json();
        }

        if (!Array.isArray(data)) return;

        pedidosGlobalesSheets = data.map((fila, index) => {
            const turnoVal = obtenerCampoFlexible(fila, ['turno', 'id_turno', 'ticket']) || `#T-${index + 1}`;
            const clienteVal = obtenerCampoFlexible(fila, ['cliente', 'nombre']) || 'Cliente';
            const telefonoVal = obtenerCampoFlexible(fila, ['telefono', 'tel', 'celular']) || '';
            const tipoVal = obtenerCampoFlexible(fila, ['tipo', 'tipo_pedido']) || 'tienda';
            const totalVal = parseFloat(obtenerCampoFlexible(fila, ['total', 'monto']) || 0);
            const fechaVal = obtenerCampoFlexible(fila, ['fecha', 'hora', 'fecha_completa']) || new Date().toISOString();
            const detalleVal = obtenerCampoFlexible(fila, ['detalle', 'descripcion', 'productos']) || '';
            const itemsJsonVal = obtenerCampoFlexible(fila, ['items_json', 'items', 'json']);

            let items = [];
            try {
                if (itemsJsonVal && String(itemsJsonVal).trim().startsWith('[')) {
                    items = JSON.parse(itemsJsonVal);
                } else if (detalleVal) {
                    items = detalleVal.split('|').map(d => ({ nombre: d.trim(), extras: [], precio: 0 }));
                }
            } catch (e) {
                items = [{ nombre: detalleVal || 'Botana Preparada', extras: [], precio: totalVal }];
            }

            let estadoRaw = String(obtenerCampoFlexible(fila, ['estado', 'status']) || 'cola').toLowerCase().trim();
            if (!estadoRaw || estadoRaw === 'undefined') estadoRaw = 'cola';

            return {
                turno: turnoVal,
                cliente: clienteVal,
                telefono: telefonoVal,
                tipo: tipoVal.toLowerCase().trim(),
                total: totalVal,
                fecha_completa: fechaVal,
                estado: estadoRaw,
                items: items
            };
        });

        // Alerta de nuevo pedido en cola
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
        actualizarModuloFinanzas();
    } catch (error) {
        console.error("Error al consultar Sheets:", error);
    }
}

// ======================================================
// RENDERIZADO DE LAS 3 COLUMNAS KANBAN
// ======================================================
function renderizarTableroKanban() {
    const contCola = document.getElementById('containerCola');
    const contPrep = document.getElementById('containerPrep');
    const contListos = document.getElementById('containerListos');

    if (!contCola || !contPrep || !contListos) return;

    let pedidos = pedidosGlobalesSheets;
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

    contCola.innerHTML = enCola.map(p => crearTarjetaHTML(p)).join('') || '<div class="kds-empty-column">Sin pedidos en cola</div>';
    contPrep.innerHTML = enPrep.map(p => crearTarjetaHTML(p)).join('') || '<div class="kds-empty-column">Nada en preparación</div>';
    contListos.innerHTML = listos.map(p => crearTarjetaHTML(p)).join('') || '<div class="kds-empty-column">Sin pedidos listos</div>';
}

function crearTarjetaHTML(pedido) {
    const semaforo = calcularSemaforoTiempo(pedido.fecha_completa);
    const turnoEscapado = encodeURIComponent(pedido.turno);

    let itemsHTML = '';
    pedido.items.forEach((it, idx) => {
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
            <button class="btn-card-action" style="width:100%; background:#F59E0B; color:#000; border:none; padding:10px; border-radius:8px; font-weight:700; cursor:pointer;" onclick="iniciarPreparacionPedido('${turnoEscapado}', '${pedido.tipo}', '${pedido.telefono}')">
                <i class="fa-solid fa-fire"></i> Iniciar Preparación
            </button>
        `;
    } else if (pedido.estado === 'preparando') {
        botonAccion = `
            <button class="btn-card-action" style="width:100%; background:#10B981; color:#FFF; border:none; padding:10px; border-radius:8px; font-weight:700; cursor:pointer;" onclick="cambiarEstadoPedidoNube('${turnoEscapado}', 'listo')">
                <i class="fa-solid fa-check-double"></i> Marcar Listo
            </button>
        `;
    } else {
        botonAccion = `
            <button class="btn-card-action" style="width:100%; background:#475569; color:#FFF; border:none; padding:8px; border-radius:8px; font-weight:600; cursor:pointer; font-size:0.8rem;" onclick="cambiarEstadoPedidoNube('${turnoEscapado}', 'entregado')">
                <i class="fa-solid fa-box-archive"></i> Entregar / Archivar
            </button>
        `;
    }

    return `
        <div class="kds-card state-${pedido.estado} ${semaforo.claseAlerta}" data-fecha="${pedido.fecha_completa}" style="background:#1E293B; border-radius:12px; padding:12px; margin-bottom:12px; border:1px solid #334155; box-shadow:0 4px 10px rgba(0,0,0,0.2);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <span style="font-size:1.4rem; font-weight:800; color:#F59E0B;">${pedido.turno}</span>
                <span style="background:${pedido.tipo === 'tienda' ? '#0284C7' : '#EA580C'}; color:#FFF; padding:2px 8px; border-radius:10px; font-size:0.72rem; font-weight:700;">
                    ${pedido.tipo === 'tienda' ? '🏪 EN TIENDA' : '🛍️ RECOGER'}
                </span>
                <span class="kds-timer-badge" style="font-weight:700; font-size:0.85rem;">
                    <i class="fa-solid fa-clock"></i> ${semaforo.tiempoFormateado}
                </span>
            </div>

            <div style="font-size:0.85rem; color:#94A3B8; margin-bottom:8px;">
                👤 Cliente: <strong style="color:#F8FAFC;">${pedido.cliente}</strong>
            </div>

            <div style="margin-bottom:10px;">
                ${itemsHTML}
            </div>

            ${botonAccion}
        </div>
    `;
}

// Manejo de Modal de Tiempo para Pedidos "Para Recoger"
function iniciarPreparacionPedido(turnoEscapado, tipo, telefono) {
    if (tipo === 'recoger' && telefono && telefono.length === 10) {
        pedidoTemporalParaTiempo = { turnoEscapado, telefono };
        const modal = document.getElementById('timeModal');
        if (modal) {
            modal.classList.add('active');
            return;
        }
    }
    cambiarEstadoPedidoNube(turnoEscapado, 'preparando');
}

function confirmarTiempoYNotificar(minutos) {
    if (pedidoTemporalParaTiempo) {
        const msg = encodeURIComponent(`🍿 *La Engordadera:* Tu pedido *${decodeURIComponent(pedidoTemporalParaTiempo.turnoEscapado)}* ya está en preparación 🔥. Estará listo en aproximadamente *${minutos} minutos*. ¡Te esperamos!`);
        window.open(`https://wa.me/521${pedidoTemporalParaTiempo.telefono}?text=${msg}`, '_blank');
        cambiarEstadoPedidoNube(pedidoTemporalParaTiempo.turnoEscapado, 'preparando');
    }
    cerrarModalTiempo();
}

function cerrarModalTiempo() {
    const modal = document.getElementById('timeModal');
    if (modal) modal.classList.remove('active');
    if (pedidoTemporalParaTiempo) {
        cambiarEstadoPedidoNube(pedidoTemporalParaTiempo.turnoEscapado, 'preparando');
    }
    pedidoTemporalParaTiempo = null;
}

// ======================================================
// ACTUALIZACIÓN DIRECTA A GOOGLE SHEETS
// ======================================================
async function cambiarEstadoPedidoNube(turnoEncoded, nuevoEstado) {
    const turnoReal = decodeURIComponent(turnoEncoded);

    const index = pedidosGlobalesSheets.findIndex(p => p.turno === turnoReal);
    if (index !== -1) {
        pedidosGlobalesSheets[index].estado = nuevoEstado;
        renderizarTableroKanban();
        actualizarMetricasHeader();
    }

    if (!SHEETDB_ID) return;

    try {
        const patchUrl = `https://sheetdb.io/api/v1/${SHEETDB_ID}/turno/${encodeURIComponent(turnoReal)}?sheet=Ventas_Historicas`;
        await fetch(patchUrl, {
            method: 'PATCH',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                data: { estado: nuevoEstado }
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

// ======================================================
// UTILIDADES: SEMÁFORO Y TIEMPOS
// ======================================================
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

// ======================================================
// VISTAS Y FILTROS
// ======================================================
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

// ======================================================
// MÓDULO DE CORTE Y FINANZAS
// ======================================================
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

    // Renderizar tabla
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
