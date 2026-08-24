// ======================================================
// KDS EN LA NUBE - LA ENGORDADERA (MOTOR DIRECTO Y SEGURO)
// ======================================================
const SHEETDB_INPUT = "sq3j6nb77cl27"; 
const INTERVALO_CONSULTA_SEGUNDOS = 4;

function obtenerIdLimpioSheetDB(input) {
    if (!input || input.includes("TU_ID")) return "";
    return input.trim().replace(/^https?:\/\/sheetdb\.io\/api\/v1\//i, "").split("?")[0].replace(/\/$/, "");
}

const SHEETDB_ID = obtenerIdLimpioSheetDB(SHEETDB_INPUT);

let pedidosKDS = [];
let filtroEstacionActual = 'TODOS';
let ultimoTurnoRegistrado = '';
let audioAlerta = null;

// Lector flexible insensible a mayúsculas/minúsculas
function obtenerCampo(obj, posiblesNombres) {
    if (!obj || typeof obj !== 'object') return '';
    const keys = Object.keys(obj);
    for (let p of posiblesNombres) {
        const pNorm = p.toLowerCase().trim();
        for (let k of keys) {
            if (k.toLowerCase().trim() === pNorm) {
                return obj[k];
            }
        }
    }
    return '';
}

document.addEventListener('DOMContentLoaded', () => {
    audioAlerta = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    
    iniciarKDS();
    setInterval(consultarPedidosNube, INTERVALO_CONSULTA_SEGUNDOS * 1000);
    setInterval(actualizarSemaforosTiempo, 1000);
});

async function iniciarKDS() {
    console.log("🍳 Iniciando KDS con SheetDB ID:", SHEETDB_ID);
    await consultarPedidosNube();
}

async function consultarPedidosNube() {
    if (!SHEETDB_ID) {
        console.error("❌ Falta configurar el SHEETDB_ID en kds.js");
        return;
    }

    try {
        const url = `https://sheetdb.io/api/v1/${SHEETDB_ID}?sheet=Ventas_Historicas`;
        const res = await fetch(url);
        const data = await res.json();

        if (!Array.isArray(data)) {
            console.warn("⚠️ Respuesta de SheetDB no es un array:", data);
            return;
        }

        console.log(`📥 [KDS] ${data.length} filas leídas de Ventas_Historicas`);

        const pedidosProcesados = data.map(fila => {
            const turnoVal = obtenerCampo(fila, ['turno', 'id_turno', 'ticket']) || '#T-00';
            const clienteVal = obtenerCampo(fila, ['cliente', 'nombre']) || 'Cliente';
            const telefonoVal = obtenerCampo(fila, ['telefono', 'tel', 'celular']) || '';
            const tipoVal = obtenerCampo(fila, ['tipo', 'tipo_pedido']) || 'tienda';
            const totalVal = parseFloat(obtenerCampo(fila, ['total', 'monto']) || 0);
            const fechaVal = obtenerCampo(fila, ['fecha', 'hora', 'fecha_completa']) || new Date().toISOString();
            const detalleVal = obtenerCampo(fila, ['detalle', 'descripcion', 'productos']) || '';
            const itemsJsonVal = obtenerCampo(fila, ['items_json', 'items', 'json']);

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

            // Normalización del estado
            let estadoRaw = String(obtenerCampo(fila, ['estado', 'status']) || 'cola').toLowerCase().trim();
            if (!estadoRaw || estadoRaw === 'undefined' || estadoRaw === '') estadoRaw = 'cola';

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

        // Filtrar comandas activas (cola o preparando)
        const activos = pedidosProcesados.filter(p => p.estado === 'cola' || p.estado === 'preparando');
        console.log(`🔥 [KDS] Comandas activas en cocina (${activos.length}):`, activos);

        if (activos.length > 0) {
            const ultimoTurno = activos[activos.length - 1].turno;
            if (ultimoTurnoRegistrado !== '' && ultimoTurnoRegistrado !== ultimoTurno) {
                reproducirAlertaSonora();
            }
            ultimoTurnoRegistrado = ultimoTurno;
        }

        pedidosKDS = activos;
        renderizarTarjetasKDS();
        actualizarMetricasKDS(pedidosProcesados);
    } catch (error) {
        console.error("❌ Error consultando KDS en la nube:", error);
    }
}

function reproducirAlertaSonora() {
    if (audioAlerta) {
        audioAlerta.play().catch(() => console.log("Audio esperando interacción"));
    }
}

function renderizarTarjetasKDS() {
    const grid = document.getElementById('kdsOrdersGrid');
    if (!grid) {
        console.error("❌ No existe el contenedor con id 'kdsOrdersGrid'");
        return;
    }

    let pedidosFiltrados = pedidosKDS;
    if (filtroEstacionActual !== 'TODOS') {
        pedidosFiltrados = pedidosKDS.filter(p => {
            return p.items.some(item => (item.estacion || 'CALIENTE').toUpperCase() === filtroEstacionActual);
        });
    }

    if (pedidosFiltrados.length === 0) {
        grid.innerHTML = `
            <div class="kds-empty-state" style="grid-column: 1 / -1; text-align: center; padding: 50px 20px; color: #888;">
                <i class="fa-solid fa-clipboard-check" style="font-size: 3rem; color: #10B981; margin-bottom: 10px;"></i>
                <h3 style="font-family: sans-serif; font-size: 1.3rem; color: #333;">¡Todo al día!</h3>
                <p style="font-size: 0.9rem;">No hay órdenes pendientes en este momento.</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = '';
    pedidosFiltrados.forEach(pedido => {
        const tarjeta = document.createElement('div');
        const semaforo = calcularSemaforoTiempo(pedido.fecha_completa);
        
        tarjeta.className = `kds-card state-${pedido.estado} ${semaforo.claseAlerta}`;
        tarjeta.setAttribute('data-fecha', pedido.fecha_completa);

        let itemsHTML = '';
        pedido.items.forEach((it, idx) => {
            let extras = [];
            if (it.base) extras.push(`Base: ${it.base}`);
            if (it.ingredientes && it.ingredientes.length > 0) extras.push(`Con: ${it.ingredientes.join(', ')}`);
            if (it.extras && it.extras.length > 0) extras.push(`Extra: ${it.extras.join(', ')}`);
            if (it.salsa) extras.push(`Salsa: ${it.salsa}`);

            itemsHTML += `
                <div class="kds-item-row" style="margin-bottom: 8px; border-bottom: 1px dashed #eee; padding-bottom: 6px;">
                    <strong style="font-size: 0.95rem; color: #111;">${idx + 1}. ${it.nombre}</strong>
                    <p style="font-size: 0.8rem; color: #666; margin: 2px 0 0 0;">${extras.join(' | ') || 'Estándar'}</p>
                </div>
            `;
        });

        // Escapar comillas para evitar errores en onclick
        const turnoEscapado = encodeURIComponent(pedido.turno);

        tarjeta.innerHTML = `
            <div class="kds-card-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                <span class="kds-turno-badge" style="font-size:1.4rem; font-weight:800; color:#E91E63;">${pedido.turno}</span>
                <span class="kds-type-tag" style="background:#FFF3E0; color:#E65100; padding:3px 8px; border-radius:12px; font-size:0.75rem; font-weight:700;">
                    ${pedido.tipo === 'tienda' ? '🏪 TIENDA' : '🛍️ RECOGER'}
                </span>
                <div class="kds-timer-badge" style="font-weight:700; font-size:0.85rem;">
                    <i class="fa-solid fa-clock"></i> ${semaforo.tiempoFormateado}
                </div>
            </div>

            <div class="kds-card-client" style="margin-bottom:10px; font-weight:600; color:#333;">
                <span>👤 ${pedido.cliente}</span>
            </div>

            <div class="kds-card-items">
                ${itemsHTML}
            </div>

            <div class="kds-card-actions" style="margin-top:14px;">
                ${pedido.estado === 'cola' ? `
                    <button class="btn-kds-action btn-start" style="width:100%; background:#FF9800; color:white; border:none; padding:10px; border-radius:10px; font-weight:700; cursor:pointer;" onclick="cambiarEstadoPedidoNube('${turnoEscapado}', 'preparando')">
                        <i class="fa-solid fa-fire"></i> Preparar
                    </button>
                ` : `
                    <button class="btn-kds-action btn-ready" style="width:100%; background:#10B981; color:white; border:none; padding:10px; border-radius:10px; font-weight:700; cursor:pointer;" onclick="cambiarEstadoPedidoNube('${turnoEscapado}', 'listo')">
                        <i class="fa-solid fa-check-double"></i> Marcar Listo
                    </button>
                `}
            </div>
        `;

        grid.appendChild(tarjeta);
    });
}

// 3. Actualización Robusta hacia SheetDB
async function cambiarEstadoPedidoNube(turnoEncoded, nuevoEstado) {
    const turnoReal = decodeURIComponent(turnoEncoded);
    console.log(`🔄 Cambiando estado de ${turnoReal} a "${nuevoEstado}"...`);

    // 1. Cambio visual instantáneo en pantalla
    const index = pedidosKDS.findIndex(p => p.turno === turnoReal);
    if (index !== -1) {
        if (nuevoEstado === 'listo') {
            pedidosKDS.splice(index, 1);
        } else {
            pedidosKDS[index].estado = nuevoEstado;
        }
        renderizarTarjetasKDS();
    }

    if (!SHEETDB_ID) return;

    // 2. Envío a SheetDB con URL limpia y codificada
    try {
        const patchUrl = `https://sheetdb.io/api/v1/${SHEETDB_ID}/turno/${encodeURIComponent(turnoReal)}?sheet=Ventas_Historicas`;
        const res = await fetch(patchUrl, {
            method: 'PATCH',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                data: {
                    estado: nuevoEstado
                }
            })
        });

        const resData = await res.json();
        console.log(`✅ [SheetDB] Resultado de actualización:`, resData);
    } catch (e) {
        console.error("❌ Error enviando PATCH a SheetDB:", e);
    }
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

function filtrarEstacion(estacion) {
    filtroEstacionActual = estacion.toUpperCase();
    const btns = document.querySelectorAll('.kds-filter-btn');
    btns.forEach(b => b.classList.remove('active'));
    
    const activo = Array.from(btns).find(b => b.textContent.toUpperCase().includes(filtroEstacionActual));
    if (activo) activo.classList.add('active');

    renderizarTarjetasKDS();
}

function actualizarMetricasKDS(todosLosPedidos) {
    const countPendientes = pedidosKDS.length;
    const countListos = todosLosPedidos.filter(p => p.estado === 'listo').length;
    const totalVenta = todosLosPedidos.reduce((sum, p) => sum + (p.total || 0), 0);

    const pendEl = document.getElementById('metricPendingCount');
    const readyEl = document.getElementById('metricReadyCount');
    const salesEl = document.getElementById('metricSalesTotal');

    if (pendEl) pendEl.textContent = countPendientes;
    if (readyEl) readyEl.textContent = countListos;
    if (salesEl) salesEl.textContent = `$${totalVenta.toFixed(2)}`;
}
