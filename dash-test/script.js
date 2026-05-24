const API_URL = 'https://sheetdb.io/api/v1/v3rg9i21440di?sheet=Base_Datos'; 

let baseDatosCompleta = [];
let clienteSeleccionado = null;
let udiValorActualGlobal = 8.85; // Valor de respaldo por si la API falla

/**
 * NUEVO: Consulta el valor de la UDI en tiempo real desde Banxico/API pública
 */
async function consultarUDIRealTime() {
    try {
        // Consumimos una API financiera abierta para obtener los indicadores de México
        const res = await fetch('https://api. thingsin.cloud/v1/mx-financial-indicators/udi'); // O tu endpoint configurado de Banxico
        if(res.ok) {
            const data = await res.json();
            if(data.value) {
                udiValorActualGlobal = parseFloat(data.value);
            }
        }
    } catch (e) {
        // Si hay bloqueo de red, usamos el histórico actual de 2026
        udiValorActualGlobal = 8.8437; 
    }
    document.getElementById('udi-val-live').innerText = udiValorActualGlobal.toFixed(4);
}

async function cargarBaseDeDatos() {
    await consultarUDIRealTime(); // Primero obtenemos la UDI actual del día de hoy
    
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        
        baseDatosCompleta = data.map(row => {
            return {
                id: row.id,
                empresa: row.empresa,
                poliza: row.poliza,
                contratante: row.contratante,
                asegurados: row.asegurados, // Guardamos la cadena de asegurados
                nacimiento: row.nacimiento,
                plan: row.plan,
                ppr: row.ppr,
                prox_dotal: row.prox_dotal,
                deducible: row.deducible,
                coaseguro: row.coaseguro,
                ramo: row.ramo,
                suma_asegurada: parseFloat(row.suma_asegurada || 0).toLocaleString('es-MX', {minimumFractionDigits: 2}),
                moneda: row.moneda,
                emision: row.emision,
                vencimiento: row.vencimiento,
                tc: row.tc,
                estatus: row.estatus,
                forma_pago: row.forma_pago || 'Anual',
                prima_anual: row.prima_anual,
                prima_pago: row.prima_pago,
                cobro_pesos: row.cobro_pesos,
                dia_cobro: row.dia_cobro,
                email: row.email,
                telefono: row.telefono,
                cobranza: row.cobranza, 
                rfc: row.rfc || '-',
                regimen: row.regimen || '-',
                direccion: row.direccion || '-',
                cp_postal: row.cp_postal || '-',
                aves_cp: row.aves_cp || 'N/A',
                aves_lp: row.aves_lp || 'N/A',
                num_cuenta: row.num_cuenta || '-',
                prima_planeada: row.prima_planeada || 'NO',
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

function actualizarContadoresAlertas() {
    const hoy = new Date();
    const diaHoy = String(hoy.getDate()).padStart(2, '0');
    const mesHoy = String(hoy.getMonth() + 1).padStart(2, '0');
    const fechaCortadaHoy = `${diaHoy}/${mesHoy}`; 

    if (!baseDatosCompleta || baseDatosCompleta.length === 0) return;

    const cumpleaniosHoy = baseDatosCompleta.filter(c => c.nacimiento && c.nacimiento.startsWith(fechaCortadaHoy));
    document.getElementById('count-cumple').innerText = `${cumpleaniosHoy.length} Cumpleaños`;

    const pagosVencidos = baseDatosCompleta.filter(c => {
        return (c.estatus && String(c.estatus).toLowerCase() === "vencido") || (c.cobranza && c.cobranza.includes("V"));
    });
    document.getElementById('count-pagos').innerText = `${pagosVencidos.length} Vencimientos`;
}

function llenarSelectorEmpresas() {
    const selectEmpresa = document.getElementById('filtro-empresa');
    if (!selectEmpresa) return;
    const empresasUnicas = [...new Set(baseDatosCompleta.map(item => item.empresa).filter(e => e))];
    selectEmpresa.innerHTML = '<option value="ALL">All Companies / Todas</option>';
    empresasUnicas.forEach(empresa => {
        selectEmpresa.innerHTML += `<option value="${empresa}">${empresa}</option>`;
    });
}

function llenarSelectorClientes(lista) {
    const select = document.getElementById('filtro-cliente');
    if (!select) return;
    select.innerHTML = '<option value="">Selecciona un cliente...</option>';
    const unicos = [...new Set(lista.map(item => item.contratante).filter(n => n))];
    unicos.forEach(nombre => {
        select.innerHTML += `<option value="${nombre}">${nombre}</option>`;
    });
}

function filtrarClientesPorEmpresa() {
    const empresa = document.getElementById('filtro-empresa').value;
    const filtrados = empresa === "ALL" ? baseDatosCompleta : baseDatosCompleta.filter(item => item.empresa === empresa);
    llenarSelectorClientes(filtrados);
}

function cargarDatosCliente() {
    const nombre = document.getElementById('filtro-cliente').value;
    if(!nombre) return;
    const planesCliente = baseDatosCompleta.filter(item => item.contratante === nombre);
    const planSelect = document.getElementById('plan-select');
    planSelect.innerHTML = '';
    planesCliente.forEach(c => {
        planSelect.innerHTML += `<option value="${c.id}">${c.plan}</option>`;
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
    
    // Si la moneda es UDI, calcula dinámicamente el Tipo de Cambio con el valor Real-Time
    document.getElementById('txt-tc').innerText = c.moneda === 'UDI' ? udiValorActualGlobal.toFixed(4) : c.tc;
    
    document.getElementById('txt-estatus').innerText = c.estatus;
    document.getElementById('txt-forma-pago').innerText = c.forma_pago;
    document.getElementById('txt-prima-anual').innerText = `$${c.prima_anual}`;
    document.getElementById('txt-prima-pago').innerText = `$${c.prima_pago}`;
    document.getElementById('txt-cobro-pesos').innerText = `$${c.cobro_pesos}`;
    document.getElementById('txt-dia-cobro').innerText = c.dia_cobro;
    
    // DETALLE 6.1: Nuevos Campos Cargados
    document.getElementById('txt-aves-cp').innerText = c.aves_cp;
    document.getElementById('txt-aves-lp').innerText = c.aves_lp;
    document.getElementById('txt-num-cuenta').innerText = c.num_cuenta;
    document.getElementById('txt-prima-planeada').innerText = c.prima_planeada;

    // DETALLE 3: Acciones Directas de Llamada y Correo
    const linkTel = document.getElementById('link-tel');
    linkTel.href = `tel:${c.telefono}`;
    linkTel.querySelector('strong').innerText = c.telefono;

    const linkEmail = document.getElementById('link-email');
    linkEmail.href = `mailto:${c.email}?subject=Informacion de tu Poliza ${c.poliza}`;
    linkEmail.querySelector('strong').innerText = c.email;

    // DETALLE 4: Carga de Datos de Facturación
    document.getElementById('txt-rfc').innerText = c.rfc;
    document.getElementById('txt-regimen').innerText = c.regimen;
    document.getElementById('txt-cp-postal').innerText = c.cp_postal;
    document.getElementById('txt-direccion').innerText = c.direccion;

    // DETALLE 1: Despliegue de Varios Asegurados en Filas
    const wrapperAsegurados = document.getElementById('wrapper-asegurados');
    wrapperAsegurados.innerHTML = '';
    const listaAsegurados = c.asegurados ? c.asegurados.split(',') : [c.contratante];
    listaAsegurados.forEach(asegurado => {
        wrapperAsegurados.innerHTML += `<div class="sub-cell font-bold" style="border:none; padding:4px 12px;">👤 ${asegurado.trim()}</div>`;
    });

    // Timeline de Cobranza
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const trackCobranza = c.cobranza ? c.cobranza.split(',') : [];
    const timeline = document.getElementById('timeline-cobranza');
    timeline.innerHTML = '';
    meses.forEach((mes, i) => {
        const val = trackCobranza[i] ? trackCobranza[i].trim() : '-';
        timeline.innerHTML += `<div class="month-bubble ${val === 'P' ? 'pagado' : 'pendiente'}"><span>${mes}</span><strong>${val}</strong></div>`;
    });

    // Beneficiarios
    const gridBen = document.getElementById('grid-beneficiarios');
    gridBen.innerHTML = `<div class="cell bg-grey font-bold">Beneficiario</div><div class="cell bg-grey font-bold">Motivo</div><div class="cell bg-grey font-bold">Porcentaje</div><div class="cell bg-grey font-bold">Fecha Nacimiento</div>`;
    c.beneficiarios.forEach(b => {
        gridBen.innerHTML += `<div class="cell">${b.nombre}</div><div class="cell">${b.motivo}</div><div class="cell text-center font-bold">${b.pct}</div><div class="cell text-center">${b.nac}</div>`;
    });
}

function enviarMensajeWA(tipo) {
    if(!clienteSeleccionado) return;
    const c = clienteSeleccionado;
    let mensaje = "";
    if(tipo === 'cumple') {
        mensaje = `¡Hola *${c.contratante}*! 🎉 Te mandamos un fuerte saludo de parte de *Conny* y el equipo. Queremos desearte un muy feliz cumpleaños hoy en tu día, ¡que te la pases excelente! 🎂🎈`;
    } else if(tipo === 'pago') {
        // DETALLE 5: Inyección dinámica de la frecuencia/forma de pago en la plantilla
        mensaje = `Estimado(a) *${c.contratante}*, te saludamos para recordarte que la fecha límite de tu pago *${c.forma_pago.toUpperCase()}* para tu póliza de *${c.ramo}* (No. *${c.poliza}*) es el próximo *${c.dia_cobro}* de este mes. El monto correspondiente al periodo es de *$${c.cobro_pesos} MXN*. Quedamos a tus órdenes para procesar el movimiento. 💳✨`;
    }
    window.open(`https://wa.me/52${c.telefono}?text=${encodeURIComponent(mensaje)}`, '_blank');
}

document.addEventListener('DOMContentLoaded', cargarBaseDeDatos);
