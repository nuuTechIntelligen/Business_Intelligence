// ======================================================
// KDS EN LA NUBE - LA ENGORDADERA
// ======================================================
const SHEETDB_INPUT = "TU_ID_O_URL_AQUI"; 
const INTERVALO_CONSULTA_SEGUNDOS = 4; // Consulta Google Sheets cada 4s

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
    // Inicializar sonido de alerta de nuevo pedido
    audioAlerta = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    
    iniciarKDS();
    setInterval(consultarPedidosNube, INTERVALO_CONSULTA_SEGUNDOS * 1000);
    setInterval(actualizarSemaforosTiempo, 1000); // Actualiza semáforos de tiempo cada segundo
});

async function iniciarKDS() {
    await consultarPedidosNube();
}

// 1. Consulta en vivo a Google Sheets
async function consultarPedidosNube() {
    if (!SHEETDB_ID) return;

    try {
        const url = `https://sheetdb.io/api/v1/${SHEETDB_ID}?sheet=Ventas_Historicas`;
        const res = await fetch(url);
        const data = await res.json();

        if (!Array.isArray(data)) return;

        // Filtrar pedidos activos (no archivados ni entregados antiguos)
        const pedidosProcesados = data.map(fila => {
            let items = [];
            try {
                items = fila.items_json ? JSON.parse(fila.items_json) : [];
            } catch (e) {
                items = [{ nombre: fila.detalle || 'Botana', extras: [], precio: fila.total }];
            }

            return {
                turno: fila.turno,
                cliente: fila.cliente,
                telefono: fila.telefono,
                tipo: fila.tipo,
                total: parseFloat(fila.total || 0),
                fecha_completa: fila.fecha || new Date().toISOString(),
                estado: (fila.estado || 'cola').toLowerCase(),
                items: items
            };
        });

        // Solo mostrar pedidos pendientes en cocina (cola y preparando)
        const activos = pedidosProcesados.filter(p => p.estado === 'cola' || p.estado === 'preparando');

        // Detectar si entró un pedido nuevo para sonar la alerta
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
        console.warn("Error sincronizando KDS con la nube:", error);
    }
}

function reproducirAlertaSonora() {
    if (audioAlerta) {
        audioAlerta.play().catch(e => console.log("Interacción requerida para audio"));
    }
}

// 2. Renderizado de Comandas en Pantalla
function renderizarTarjetasKDS() {
    const grid = document.getElementById('kdsOrdersGrid');
    if (!grid) return;

    // Aplicar Filtro de Estación
    let pedidosFiltrados = pedidosKDS;
    if (filtroEstacionActual !== 'TODOS') {
        pedidosFiltrados = pedidosKDS.filter(p => {
            return p.items.some(item => (item.estacion || 'CALIENTE').toUpperCase() === filtroEstacionActual);
        });
    }

    if (pedidosFiltrados.length === 0) {
        grid.innerHTML = `
            <div class="kds-empty-state">
                <i class="fa-solid fa-clipboard-check"></i>
                <h3>¡Todo al día!</h3>
                <p>No hay órdenes pendientes en este momento.</p>
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
                <div class="kds-item-row">
                    <strong>${idx + 1}. ${it.nombre}</strong>
                    <p>${extras.join(' | ') || 'Estándar'}</p>
                </div>
            `;
        });

        tarjeta.innerHTML = `
            <div class="kds-card-header">
                <span class="kds-turno-badge">${pedido.turno}</span>
                <span class="kds-type-tag ${pedido.tipo === 'tienda' ? 'tienda' : 'recoger'}">
                    ${pedido.tipo === 'tienda' ? '🏪 TIENDA' : '🛍️ RECOGER'}
                </span>
                <div class="kds-timer-badge" id="timer-${pedido.turno.replace(/[^a-zA-Z0-9]/g, '')}">
                    <i class="fa-solid fa-clock"></i> ${semaforo.tiempoFormateado}
                </div>
            </div>

            <div class="kds-card-client">
                <span>👤 ${pedido.cliente}</span>
            </div>

            <div class="kds-card-items">
                ${itemsHTML}
            </div>

            <div class="kds-card-actions">
                ${pedido.estado === 'cola' ? `
                    <button class="btn-kds-action btn-start" onclick="cambiarEstadoPedidoNube('${pedido.turno}', 'preparando')">
                        <i class="fa-solid fa-fire"></i> Preparar
                    </button>
                ` : `
                    <button class="btn-kds-action btn-ready" onclick="cambiarEstadoPedidoNube('${pedido.turno}', 'listo')">
                        <i class="fa-solid fa-check-double"></i> Marcar Listo
                    </button>
                `}
            </div>
        `;

        grid.appendChild(tarjeta);
    });
}

// 3. Cambio de Estado en Tiempo Real hacia Google Sheets
async function cambiarEstadoPedidoNube(turno, nuevoEstado) {
    // Actualización visual instantánea
    const index = pedidosKDS.findIndex(p => p.turno === turno);
    if (index !== -1) {
        if (nuevoEstado === 'listo') {
            pedidosKDS.splice(index, 1);
        } else {
            pedidosKDS[index].estado = nuevoEstado;
        }
        renderizarTarjetasKDS();
    }

    // Actualización PATCH en Google Sheets
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

// 4. Semáforo Inteligente de Tiempos
function calcularSemaforoTiempo(fechaISO) {
    const ahora = new Date();
    const creacion = new Date(fechaISO);
    const diffMinutos = Math.floor((ahora - creacion) / 60000);
    const diffSegundos = Math.floor(((ahora - creacion) % 60000) / 1000);

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
            card.classList.remove('timer-green', 'timer-yellow', 'timer-red-blink');
            card.classList.add(semaforo.claseAlerta);
        }
    });
}

// 5. Filtros por Estación
function filtrarEstacion(estacion) {
    filtroEstacionActual = estacion.toUpperCase();
    const btns = document.querySelectorAll('.kds-filter-btn');
    btns.forEach(b => b.classList.remove('active'));
    
    const activo = Array.from(btns).find(b => b.textContent.toUpperCase().includes(filtroEstacionActual));
    if (activo) activo.classList.add('active');

    renderizarTarjetasKDS();
}

// 6. Métricas de Resumen del Día
function actualizarMetricasKDS(todosLosPedidos) {
    const countPendientes = pedidosKDS.length;
    const countListos = todosLosPedidos.filter(p => p.estado === 'listo').length;
    const totalVenta = todosLosPedidos.reduce((sum, p) => sum + p.total, 0);

    const pendEl = document.getElementById('metricPendingCount');
    const readyEl = document.getElementById('metricReadyCount');
    const salesEl = document.getElementById('metricSalesTotal');

    if (pendEl) pendEl.textContent = countPendientes;
    if (readyEl) readyEl.textContent = countListos;
    if (salesEl) salesEl.textContent = `$${totalVenta.toFixed(2)}`;
}
