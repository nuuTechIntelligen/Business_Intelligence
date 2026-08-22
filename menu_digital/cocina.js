<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>KDS Despacho & Finanzas | La Engordadera</title>
    
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@600;700&family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">
    
    <link rel="stylesheet" href="cocina.css">
</head>
<body>

    <!-- BARRA SUPERIOR DE COCINA -->
    <header class="kds-header">
        <div class="kds-brand">
            <span class="logo-emoji">🍿</span>
            <div>
                <h1>KDS LA ENGORDADERA</h1>
                <small>Sistema de Despacho & Finanzas</small>
            </div>
        </div>

        <!-- Pestañas de Vista: Tablero vs Finanzas -->
        <div class="kds-tabs">
            <button class="kds-tab-btn active" id="tabBtnKDS" onclick="mostrarVista('kds')">
                <i class="fa-solid fa-utensils"></i> Comandas
            </button>
            <button class="kds-tab-btn" id="tabBtnFinanzas" onclick="mostrarVista('finanzas')">
                <i class="fa-solid fa-chart-line"></i> Corte & Finanzas
            </button>
        </div>

        <div class="kds-metrics" id="kdsMetricsHeader">
            <div class="metric-pill"><span class="metric-label">Cola:</span> <strong id="metricCola">0</strong></div>
            <div class="metric-pill active-prep"><span class="metric-label">Prep:</span> <strong id="metricPrep">0</strong></div>
            <div class="metric-pill done"><span class="metric-label">Listos:</span> <strong id="metricListos">0</strong></div>
        </div>

        <div class="kds-actions">
            <span class="live-clock" id="liveClock">00:00:00</span>
        </div>
    </header>

    <!-- VISTA 1: TABLERO KANBAN DE COCINA -->
    <main class="kds-board" id="vistaKDS">
        
        <!-- COLUMNA 1: COLA -->
        <section class="kds-column" id="col-cola">
            <div class="column-header col-header-cola">
                <h2>🟡 En Cola (<span id="countCola">0</span>)</h2>
            </div>
            <div class="orders-container" id="containerCola"></div>
        </section>

        <!-- COLUMNA 2: PREPARACIÓN -->
        <section class="kds-column" id="col-prep">
            <div class="column-header col-header-prep">
                <h2>🟠 En Preparación (<span id="countPrep">0</span>)</h2>
            </div>
            <div class="orders-container" id="containerPrep"></div>
        </section>

        <!-- COLUMNA 3: LISTOS -->
        <section class="kds-column" id="col-listos">
            <div class="column-header col-header-listos">
                <h2>🟢 Listos (<span id="countListos">0</span>)</h2>
            </div>
            <div class="orders-container" id="containerListos"></div>
        </section>

    </main>

    <!-- VISTA 2: PANEL DE FINANZAS Y VENTAS -->
    <section class="finance-panel" id="vistaFinanzas" style="display: none;">
        <div class="finance-grid">
            <div class="finance-card">
                <h3>Venta Total del Día</h3>
                <strong id="finTotalVentas">$0.00</strong>
                <small id="finTotalPedidos">0 pedidos completados</small>
            </div>
            <div class="finance-card">
                <h3>Venta En Tienda</h3>
                <strong id="finVentaTienda" class="text-tienda">$0.00</strong>
                <small id="finPedidosTienda">0 órdenes</small>
            </div>
            <div class="finance-card">
                <h3>Venta Para Recoger</h3>
                <strong id="finVentaRecoger" class="text-recoger">$0.00</strong>
                <small id="finPedidosRecoger">0 órdenes</small>
            </div>
            <div class="finance-card">
                <h3>Ticket Promedio</h3>
                <strong id="finTicketPromedio">$0.00</strong>
                <small>Por cliente</small>
            </div>
        </div>

        <div class="finance-table-wrapper">
            <div class="table-header-flex">
                <h2>Historial de Órdenes del Día</h2>
                <button class="btn-export" onclick="exportarReporteVentasCSV()">
                    <i class="fa-solid fa-file-excel"></i> Descargar Reporte (Excel)
                </button>
            </div>
            <table class="finance-table">
                <thead>
                    <tr>
                        <th>Turno</th>
                        <th>Hora</th>
                        <th>Cliente</th>
                        <th>Tipo</th>
                        <th>Detalle de Botanas</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody id="financeTableBody">
                    <!-- Filas inyectadas dinámicamente -->
                </tbody>
            </table>
        </div>
    </section>

    <!-- MODAL SELECCIÓN DE TIEMPO ESTIMADO -->
    <div class="modal-time-overlay" id="timeModal">
        <div class="modal-time-card">
            <h3>⏱️ Tiempo Estimado de Preparación</h3>
            <p id="timeModalClientDesc">Indica en cuántos minutos estará listo:</p>
            <div class="time-buttons-grid">
                <button class="btn-time-opt" onclick="confirmarTiempoYNotificar(10)">10 min</button>
                <button class="btn-time-opt" onclick="confirmarTiempoYNotificar(15)">15 min</button>
                <button class="btn-time-opt" onclick="confirmarTiempoYNotificar(20)">20 min</button>
                <button class="btn-time-opt" onclick="confirmarTiempoYNotificar(30)">30 min</button>
            </div>
            <button class="btn-cancel-time" onclick="cerrarModalTiempo()">Solo Iniciar sin Notificar</button>
        </div>
    </div>

    <!-- AUDIO NOTIFICACIÓN -->
    <audio id="orderNotificationSound" preload="auto">
        <source src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" type="audio/mpeg">
    </audio>

    <script src="cocina.js"></script>
</body>
</html>
