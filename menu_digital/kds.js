// ======================================================
// KDS EN LA NUBE - LA ENGORDADERA (MOTOR ROBUSTO)
// ======================================================
const SHEETDB_INPUT = "TU_ID_O_URL_AQUI"; 
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
            console.warn("⚠️ Respuesta de SheetDB no es un arreglo:", data);
            return;
        }

        console.log(`📥 [KDS] ${data.length} registros obtenidos de Ventas_Historicas`);

        const pedidosProcesados = data.map(fila => {
            let items = [];
            try {
                if (fila.items_json && fila.items_json.trim().startsWith('[')) {
                    items = JSON.parse(fila.items_json);
                } else if (fila.detalle) {
                    items = fila.detalle.split('|').map(d => ({ nombre: d.trim(), extras: [], precio: 0 }));
                }
            } catch (e) {
                items = [{ nombre: fila.detalle || 'Botana', extras: [], precio: parseFloat(fila.total || 0) }];
            }

            // Normalizar estado (si está vacío se asume 'cola')
            let estadoRaw = String(fila.estado || 'cola').toLowerCase().trim();
            if (!estadoRaw || estadoRaw === 'undefined') estadoRaw = 'cola';

            return {
                turno: fila.turno || '#T-00',
                cliente: fila.cliente || 'Cliente',
                telefono: fila.telefono || '',
                tipo: (fila.tipo || 'tienda').toLowerCase().trim(),
                total: parseFloat(fila.total || 0),
                fecha_completa: fila.fecha || new Date().toISOString(),
                estado: estadoRaw,
                items: items
            };
        });

        // Mostrar todo lo que no esté marcado explícitamente como 'listo', 'entregado' o 'cancelado'
        const activos = pedidosProcesados.filter(p => p.estado === 'cola' || p.estado === 'preparando');
        console.log(`🔥 [KDS] Comandas activas para mostrar:`, activos);

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
        console.error("❌ Error en sincronización KDS:", error);
    }
}

function reproducirAlertaSonora() {
    if (audioAlerta) {
        audioAlerta.play().catch(() => console.log("Audio en espera de interacción"));
    }
}

function renderizarTarjetasKDS() {
    const grid = document.getElementById('kdsOrdersGrid');
    if (!grid) {
        console.error("❌ No se encontró el elemento HTML con id 'kdsOrdersGrid'");
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
                    <button class="btn-kds-action btn-start" style="width:100%; background:#FF9800; color:white; border:none; padding:10px; border-radius:10px; font-weight:700; cursor:pointer;" onclick="cambiarEstadoPedidoNube('${pedido.turno}', 'preparando')">
                        <i class="fa-solid fa-fire"></i> Preparar
                    </button>
                ` : `
                    <button class="btn-kds-action btn-ready" style="width:100%; background:#10B981; color:white; border:none; padding:10px; border-radius:10px; font-weight:700; cursor:pointer;" onclick="cambiarEstadoPedidoNube('${pedido.turno}', 'listo')">
                        <i class="fa-solid fa-check-double"></i> Marcar Listo
                    </button>
                `}
            </div>
        `;

        grid.appendChild(tarjeta);
    });
}

async function cambiarEstadoPedidoNube(turno, nuevoEstado) {
    const index = pedidosKDS.findIndex(p => p.turno === turno);
    if (index !== -1) {
        if (nuevoEstado === 'listo') {
            pedidosKDS.splice(index, 1);
        } else {
            pedidosKDS[index].estado = nuevoEstado;
        }
        renderizarTarjetasKDS();
    }

    if (!SHEETDB_ID) return;

    try {
        const patchUrl = `https://sheetdb.io/api/v1/${SHEETDB_ID}/turno/${encodeURIComponent(turno)}?sheet=Ventas_Historicas`;
        await fetch(patchUrl, {
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
        console.log(`✅ [SheetDB] Turno ${turno} actualizado a ${nuevoEstado}`);
    } catch (e) {
        console.error("Error al actualizar estado en Sheets:", e);
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
