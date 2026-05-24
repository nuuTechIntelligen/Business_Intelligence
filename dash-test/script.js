// Agrega el parámetro ?sheet=Base_Datos para forzar a la API a leer la pestaña correcta
const API_URL = 'https://sheetdb.io/api/v1/pw56k97827k1u'; 

let baseDatosCompleta = [];
let clienteSeleccionado = null;

async function cargarBaseDeDatos() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        
        // Mapeamos y estructuramos las filas del Excel al formato JSON del Dashboard
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
                cobranza: row.cobranza, // Lee la cadena "P,P,P..." del Excel
                // Estructura los beneficiarios desde las columnas horizontales del Excel
                beneficiarios: [
                    { nombre: row.b1_nombre, motivo: row.b1_motivo, pct: row.b1_pct, nac: row.b1_nac },
                    { nombre: row.b2_nombre, motivo: row.b2_motivo, pct: row.b2_pct, nac: row.b2_nac }
                ].filter(b => b.nombre && b.nombre !== "N/A") // Descarta beneficiarios vacíos
            };
        });

        actualizarContadoresAlertas();
        llenarSelectorEmpresas();
        llenarSelectorClientes(baseDatosCompleta);
    } catch (error) {
        console.error("❌ Error sincronizando datos desde SheetDB / Excel:", error);
    }
}

// Lógica inteligente para las Alertas Tempranas de Conny
function actualizarContadoresAlertas() {
    const hoy = new Date();
    const diaHoy = String(hoy.getDate()).padStart(2, '0');
    const mesHoy = String(hoy.getMonth() + 1).padStart(2, '0');
    const fechaCortadaHoy = `${diaHoy}/${mesHoy}`; // DD/MM

    // 1. Contador de Cumpleaños
    const cumpleaniosHoy = baseDatosCompleta.filter(c => c.nacimiento.startsWith(fechaCortadaHoy));
    document.getElementById('count-cumple').innerText = `${cumpleaniosHoy.length} Cumpleaños`;

    // 2. Contador de Pagos Vencidos (Pólizas con estatus Vencido o cadena con 'V' en el mes actual)
    const pagosVencidos = baseDatosCompleta.filter(c => c.estatus === "Vencido" || c.cobranza.includes("V"));
    document.getElementById('count-pagos').innerText = `${pagosVencidos.length} Vencimientos`;
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

    // Buscamos todas las pólizas/planes de ese cliente
    const planesCliente = baseDatosCompleta.filter(item => item.contratante === nombre);
    
    const planSelect = document.getElementById('plan-select');
    planSelect.innerHTML = '';
    
    planesCliente.forEach((c, index) => {
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

    // Pintar Línea de Cobranza (Ene - Dic)
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const trackCobranza = c.cobranza.split(',');
    const timeline = document.getElementById('timeline-cobranza');
    timeline.innerHTML = '';
    
    meses.forEach((mes, i) => {
        const item = document.createElement('div');
        item.className = `month-bubble ${trackCobranza[i] === 'P' ? 'pagado' : 'pendiente'}`;
        item.innerHTML = `<span>${mes}</span><strong>${trackCobranza[i] || '-'}</strong>`;
        timeline.appendChild(item);
    });

    // Cargar Beneficiarios
    const gridBen = document.getElementById('grid-beneficiarios');
    // Limpiar filas viejas manteniendo el header
    gridBen.innerHTML = `
        <div class="cell bg-grey font-bold">Beneficiario</div>
        <div class="cell bg-grey font-bold">Motivo</div>
        <div class="cell bg-grey font-bold">Porcentaje</div>
        <div class="cell bg-grey font-bold">Fecha Nacimiento</div>`;
        
    c.beneficiarios.forEach(b => {
        gridBen.innerHTML += `
            <div class="cell">${b.nombre}</div>
            <div class="cell">${b.motivo}</div>
            <div class="cell text-center font-bold">${b.pct}</div>
            <div class="cell text-center">${b.nac}</div>`;
    });
}

/**
 * LA MEJORA QUE CONVENCIÓ A CONNY: Motores de WhatsApp Automatizados
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
        mensaje = `Estimado(a) *${c.contratante}*, te saludamos para recordarte que la fecha límite de pago para tu póliza de *${c.ramo}* (No. *${c.poliza}*) es el próximo *${c.dia-cobro}* de este mes. El monto correspondiente al periodo es de *$${c.cobro_pesos} MXN*. Quedamos a tus órdenes para procesar el movimiento. 💳✨`;
    }
    
    window.open(`https://wa.me/52${c.telefono}?text=${encodeURIComponent(mensaje)}`, '_blank');
}

document.addEventListener('DOMContentLoaded', cargarBaseDeDatos);
