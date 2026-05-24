/**
 * VARIABLES GLOBALES
 */
const API_URL = 'https://sheetdb.io/api/v1/pw56k97827k1u?sheet=Base_Datos'; 

let baseDatosCompleta = [];
let clienteSeleccionado = null;

/**
 * CARGA INICIAL: Conexión con la API de SheetDB
 */
async function cargarBaseDeDatos() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        
        // Mapeamos y estructuramos las filas del Excel al formato JSON
        baseDatosCompleta = data.map(row => {
            return {
                id: row.id,
                empresa: row.empresa,
                poliza: row.poliza,
                contratante: row.contratante,
                nacimiento: row.nacimiento,
                plan: row.plan,
                ppr: row.ppr,
                prox_dotal: row.prox_dotal,
                deducible: row.deducible,
                coaseguro: row.coaseguro,
                ramo: row.ramo,
                suma_asegurada: parseFloat(row.suma_asegurada).toLocaleString('es-MX', {minimumFractionDigits: 2}),
                moneda: row.moneda,
                emision: row.emision,
                vencimiento: row.vencimiento,
                tc: row.tc,
                estatus: row.estatus,
                prima_anual: row.prima_anual,
                prima_pago: row.prima_pago,
                cobro_pesos: row.cobro_pesos,
                dia_cobro: row.dia_cobro,
                email: row.email,
                telefono: row.telefono,
                cobranza: row.cobranza, 
                beneficiarios: [
                    { nombre: row.b1_nombre, motivo: row.b1_motivo, pct: row.b1_pct, nac: row.b1_nac },
                    { nombre: row.b2_nombre, motivo: row.b2_motivo, pct: row.b2_pct, nac: row.b2_nac }
                ].filter(b => b.nombre && b.nombre !== "N/A" && b.nombre !== "") 
            };
        });

        actualizarContadoresAlertas();
        llenarSelectorEmpresas();
        llenarSelectorClientes(baseDatosCompleta);
    } catch (error) {
        console.error("❌ Error sincronizando datos desde SheetDB / Excel:", error);
    }
}

/**
 * ALERTAS TEMPRANAS: Procesamiento de fechas e impagos
 */
function actualizarContadoresAlertas() {
    const hoy = new Date();
    const diaHoy = String(hoy.getDate()).padStart(2, '0');
    const mesHoy = String(hoy.getMonth() + 1).padStart(2, '0');
    const fechaCortadaHoy = `${diaHoy}/${mesHoy}`; 

    if (!baseDatosCompleta || baseDatosCompleta.length === 0) {
        document.getElementById('count-cumple').innerText = "0 Cumpleaños";
        document.getElementById('count-pagos').innerText = "0 Vencimientos";
        return;
    }

    const cumpleaniosHoy = baseDatosCompleta.filter(c => {
        return c.nacimiento && typeof c.nacimiento === 'string' && c.nacimiento.startsWith(fechaCortadaHoy);
    });
    document.getElementById('count-cumple').innerText = `${cumpleaniosHoy.length} Cumpleaños`;

    const pagosVencidos = baseDatosCompleta.filter(c => {
        const estatusVencido = c.estatus && String(c.estatus).toLowerCase() === "vencido";
        const cobranzaVencida = c.cobranza && typeof c.cobranza === 'string' && c.cobranza.includes("V");
        return estatusVencido || cobranzaVencida;
    });
    document.getElementById('count-pagos').innerText = `${pagosVencidos.length} Vencimientos`;
}

/**
 * FILTROS DINÁMICOS Y SELECTORES
 */
function llenarSelectorEmpresas() {
    const selectEmpresa = document.getElementById('filtro-empresa');
    if (!selectEmpresa) return;

    const empresasUnicas = [...new Set(baseDatosCompleta.map(item => item.empresa).filter(e => e))];
    selectEmpresa.innerHTML = '<option value="ALL">All Companies / Todas</option>';
    
    empresasUnicas.forEach(empresa => {
        const option = document.createElement('option');
        option.value = empresa;
        option.text = empresa;
        selectEmpresa.appendChild(option);
    });
}

function llenarSelectorClientes(lista) {
    const select = document.getElementById('filtro-cliente');
    if (!select) return;
    select.innerHTML = '<option value="">Selecciona un cliente...</option>';
    
    // Filtramos nombres únicos de contratantes
    const unicos = [...new Set(lista.map(item => item.contratante).filter(n => n))];
    unicos.forEach(nombre => {
        const option = document.createElement('option');
        option.value = nombre;
        option.text = nombre;
        select.appendChild(option);
    });
}

function filtrarClientesPorEmpresa() {
    const empresa = document.getElementById('filtro-empresa').value;
    if (empresa === "ALL") {
        llenarSelectorClientes(baseDatosCompleta);
    } else {
        const filtrados = baseDatosCompleta.filter(item => item.empresa === empresa);
        llenarSelectorClientes(filtrados);
    }
}

function cargarDatosCliente() {
    const nombre = document.getElementById('filtro-cliente').value;
    if(!nombre) return;

    const planesCliente = baseDatosCompleta.filter(item => item.contratante === nombre);
    const planSelect = document.getElementById('plan-select');
    planSelect.innerHTML = '';
    
    planesCliente.forEach((c) => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.text = c.plan;
        planSelect.appendChild(opt);
    });

    clienteSeleccionado = planesCliente[0];
    desplegarInformacionPantalla();
}

function actualizarPlanEspecifico() {
    const idPlan = document.getElementById('plan-select').value;
    clienteSeleccionado = baseDatosCompleta.find(item => item.id === idPlan);
    desplegarInformacionPantalla();
}

/**
 * RENDERIZADO VISUAL EN LA TARJETA
 */
function desplegarInformacionPantalla() {
    if(!clienteSeleccionado) return;
    
    const c = clienteSeleccionado;
    document.getElementById('lbl-contratante').innerText = c.contratante;
    document.getElementById('txt-poliza').innerText = c.poliza;
    document.getElementById('txt-nacimiento').innerText = c.nacimiento;
    document.getElementById('txt-ppr').innerText = c.ppr;
    document.getElementById('txt-dotal').innerText = c.prox_dotal;
    document.getElementById('txt-deducible').innerText = c.deducible;
    document.getElementById('txt-coaseguro').innerText = c.coaseguro;
    
    document.getElementById('txt-ramo').innerText = c.ramo;
    document.getElementById('txt-suma').innerText = c.suma_asegurada;
    document.getElementById('txt-moneda').innerText = c.moneda;
    document.getElementById('txt-emision').innerText = c.emision;
    document.getElementById('txt-vencimiento').innerText = c.vencimiento;
    document.getElementById('txt-tc').innerText = c.tc;
    
    document.getElementById('txt-estatus').innerText = c.estatus;
    document.getElementById('txt-prima-anual').innerText = `$${c.prima_anual}`;
    document.getElementById('txt-prima-pago').innerText = `$${c.prima_pago}`;
    document.getElementById('txt-cobro-pesos').innerText = `$${c.cobro_pesos}`;
    document.getElementById('txt-dia-cobro').innerText = c.dia_cobro;

    // Control del Timeline de Cobranza (Ene - Dic)
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const trackCobranza = c.cobranza ? c.cobranza.split(',') : [];
    const timeline = document.getElementById('timeline-cobranza');
    timeline.innerHTML = '';
    
    meses.forEach((mes, i) => {
        const val = trackCobranza[i] ? trackCobranza[i].trim() : '-';
        const item = document.createElement('div');
        item.className = `month-bubble ${val === 'P' ? 'pagado' : 'pendiente'}`;
        item.innerHTML = `<span>${mes}</span><strong>${val}</strong>`;
        timeline.appendChild(item);
    });

    // Control de Beneficiarios Dinámicos
    const gridBen = document.getElementById('grid-beneficiarios');
    gridBen.innerHTML = `
        <div class="cell bg-grey font-bold">Beneficiario</div>
        <div class="cell bg-grey font-bold">Motivo</div>
        <div class="cell bg-grey font-bold">Porcentaje</div>
        <div class="cell bg-grey font-bold">Fecha Nacimiento</div>`;
        
    if(c.beneficiarios && c.beneficiarios.length > 0) {
        c.beneficiarios.forEach(b => {
            gridBen.innerHTML += `
                <div class="cell">${b.nombre || '-'}</div>
                <div class="cell">${b.motivo || '-'}</div>
                <div class="cell text-center font-bold">${b.pct || '-'}</div>
                <div class="cell text-center">${b.nac || '-'}</div>`;
        });
    }
}

/**
 * DISPARADORES WHATSAPP CRM
 */
function enviarMensajeWA(tipo) {
    if(!clienteSeleccionado) {
        alert("Por favor selecciona un cliente primero.");
        return;
    }
    
    const c = clienteSeleccionado;
    let mensaje = "";
    
    if(tipo === 'cumple') {
        mensaje = `¡Hola *${c.contratante}*! 🎉 Te mandamos un fuerte saludo de parte de *Conny* y el equipo. Queremos desearte un muy feliz cumpleaños hoy en tu día, ¡que te la pases excelente! 🎂🎈`;
    } else if(tipo === 'pago') {
        mensaje = `Estimado(a) *${c.contratante}*, te saludamos para recordarte que la fecha límite de pago para tu póliza de *${c.ramo}* (No. *${c.poliza}*) es el próximo *${c.dia_cobro}* de este mes. El monto correspondiente al periodo es de *$${c.cobro_pesos} MXN*. Quedamos a tus órdenes para procesar el movimiento. 💳✨`;
    }
    
    window.open(`https://wa.me/52${c.telefono}?text=${encodeURIComponent(mensaje)}`, '_blank');
}

// Inicialización de la App al cargar el DOM
document.addEventListener('DOMContentLoaded', cargarBaseDeDatos);
