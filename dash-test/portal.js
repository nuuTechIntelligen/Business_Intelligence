const API_URL = 'https://sheetdb.io/api/v1/o6q7vkecjanvw';

// Formateador de moneda para la vista
function formatearAmonedaLocal(valor, moneda) {
    if (valor === undefined || valor === null || valor === '-') return "$0.00 " + (moneda || 'MXN');
    const numero = parseFloat(String(valor).replace(/[^0-9.-]+/g, ""));
    if (isNaN(numero)) return "$0.00 " + (moneda || 'MXN');
    
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 2
    }).format(numero) + ' ' + (moneda || 'MXN');
}

// Calcular progreso de pagos igual al CRM
function calcularProgresoPago(formaPago, cobranza) {
    const trackCobranza = cobranza ? cobranza.split(',') : [];
    const countP = trackCobranza.filter(v => v.trim().toUpperCase() === 'P').length;
    let totalPagosEsperados = 12;
    
    const forma = String(formaPago).toLowerCase();
    if (forma.includes('anual')) {
        totalPagosEsperados = 1;
    } else if (forma.includes('semestral')) {
        totalPagosEsperados = 2;
    } else if (forma.includes('trimestral')) {
        totalPagosEsperados = 4;
    } else if (forma.includes('mensual')) {
        totalPagosEsperados = 12;
    }
    
    const pct = Math.min(100, Math.round((countP / totalPagosEsperados) * 100));
    return {
        pct: pct,
        pagados: countP,
        totales: totalPagosEsperados
    };
}

// Autenticar cliente mediante búsqueda ultra-específica en SheetDB
async function autenticarCliente(event) {
    event.preventDefault();
    
    const rfc = document.getElementById('rfc-input').value.trim();
    const poliza = document.getElementById('poliza-input').value.trim();
    
    const loader = document.getElementById('loading-overlay');
    const errorMsg = document.getElementById('login-error');
    
    if (loader) loader.classList.remove('hidden');
    if (errorMsg) errorMsg.classList.add('hidden');
    
    try {
        // Hacemos una consulta ultra-específica usando los endpoints de búsqueda de SheetDB.io
        const searchUrl = `${API_URL}/search?rfc=${encodeURIComponent(rfc)}&poliza=${encodeURIComponent(poliza)}&sheet=Base_Datos`;
        
        const response = await fetch(searchUrl);
        if (!response.ok) {
            throw new Error("Error en respuesta del servidor");
        }
        
        const results = await response.json();
        
        // SheetDB devuelve un array. Si está vacío, no hay coincidencia.
        if (results && results.length > 0) {
            const cliente = results[0];
            desplegarDatosCliente(cliente);
        } else {
            if (errorMsg) errorMsg.classList.remove('hidden');
        }
    } catch (error) {
        console.error("❌ Error de autenticación en portal:", error);
        alert("🚨 Hubo un problema al conectar con el servidor. Verifica tu conexión e inténtalo de nuevo.");
    } finally {
        if (loader) loader.classList.add('hidden');
    }
}

// Sanitizar entradas contra Cross-Site Scripting (XSS)
function escapeHTML(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Desplegar la información en la pantalla del cliente
function desplegarDatosCliente(row) {
    const loginScreen = document.getElementById('login-screen');
    const dashboardScreen = document.getElementById('dashboard-screen');
    
    if (loginScreen) loginScreen.classList.add('hidden');
    if (dashboardScreen) dashboardScreen.classList.remove('hidden');
    
    // Inyectar datos en cabecera
    document.getElementById('lbl-contratante').innerText = row.contratante;
    document.getElementById('lbl-plan').innerText = row.plan;
    
    // Bloque 1: Detalles generales
    document.getElementById('txt-poliza').innerText = row.poliza;
    document.getElementById('txt-empresa').innerText = row.empresa;
    document.getElementById('txt-ramo').innerText = row.ramo;
    
    const estatusEl = document.getElementById('txt-estatus');
    if (estatusEl) {
        estatusEl.innerText = row.estatus;
        estatusEl.className = 'estatus-badge'; // reset
        if (String(row.estatus).toLowerCase() === 'vencido') {
            estatusEl.classList.add('vencido');
        }
    }
    
    // Bloque 2: Vigencia
    document.getElementById('txt-emision').innerText = row.emision || '-';
    document.getElementById('txt-vencimiento').innerText = row.vencimiento || '-';
    
    const sumaNum = parseFloat(row.suma_asegurada || 0);
    document.getElementById('txt-suma').innerText = isNaN(sumaNum) ? '-' : sumaNum.toLocaleString('es-MX', {minimumFractionDigits: 2});
    document.getElementById('txt-moneda').innerText = row.moneda;
    
    // Bloque 3: Pagos y progreso
    const progreso = calcularProgresoPago(row.forma_pago, row.cobranza);
    document.getElementById('txt-progreso-pct').innerText = `${progreso.pct}% (${progreso.pagados}/${progreso.totales} pagos)`;
    
    const barFill = document.getElementById('bar-progreso-pago');
    if (barFill) {
        barFill.style.width = `${progreso.pct}%`;
        if (progreso.pct === 100) {
            barFill.style.backgroundColor = '#25D366'; // Green
        } else if (progreso.pct >= 50) {
            barFill.style.backgroundColor = '#134074'; // Navy
        } else {
            barFill.style.backgroundColor = '#ff9f1c'; // Warning orange
        }
    }
    
    document.getElementById('txt-forma-pago').innerText = row.forma_pago || 'Anual';
    document.getElementById('txt-prima-pago').innerText = formatearAmonedaLocal(row.prima_pago, row.moneda);
    
    // Desplegar beneficiarios
    const gridBen = document.getElementById('grid-beneficiarios');
    if (gridBen) {
        gridBen.innerHTML = '';
        
        const beneficiarios = [
            { nombre: row.b1_nombre, motivo: row.b1_motivo, pct: row.b1_pct, nac: row.b1_nac },
            { nombre: row.b2_nombre, motivo: row.b2_motivo, pct: row.b2_pct, nac: row.b2_nac }
        ].filter(b => b.nombre && b.nombre !== "N/A" && b.nombre !== "");
        
        if (beneficiarios.length > 0) {
            beneficiarios.forEach(b => {
                gridBen.innerHTML += `
                    <div class="beneficiary-card">
                        <div class="beneficiary-name">👤 ${escapeHTML(b.nombre)}</div>
                        <div class="beneficiary-detail">
                            <span>Parentesco / Motivo:</span>
                            <strong>${escapeHTML(b.motivo || '-')}</strong>
                        </div>
                        <div class="beneficiary-detail">
                            <span>Porcentaje de Cobertura:</span>
                            <span class="beneficiary-pct-badge">${escapeHTML(b.pct || '-')}</span>
                        </div>
                        <div class="beneficiary-detail">
                            <span>Fecha Nacimiento:</span>
                            <strong>${escapeHTML(b.nac || '-')}</strong>
                        </div>
                    </div>
                `;
            });
        } else {
            gridBen.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: #a0aec0; font-style: italic; padding: 20px;">No se tienen beneficiarios registrados en esta póliza.</div>`;
        }
    }
}

// Salir del portal (Cerrar sesión)
function salirPortal() {
    const rfcInput = document.getElementById('rfc-input');
    const polizaInput = document.getElementById('poliza-input');
    
    if (rfcInput) rfcInput.value = '';
    if (polizaInput) polizaInput.value = '';
    
    const loginScreen = document.getElementById('login-screen');
    const dashboardScreen = document.getElementById('dashboard-screen');
    
    if (loginScreen) loginScreen.classList.remove('hidden');
    if (dashboardScreen) dashboardScreen.classList.add('hidden');
}
