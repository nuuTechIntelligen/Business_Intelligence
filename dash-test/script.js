// URL de integración oficial vinculada a la pestaña de datos del Excel en SheetDB
const API_URL = 'https://sheetdb.io/api/v1/v3rg9i21440di?sheet=Base_Datos'; 

// Repositorios de datos globales de la aplicación en memoria
let baseDatosCompleta = []; 
let clienteSeleccionado = null; 
let udiValorActualGlobal = 8.8437; // Indicador financiero oficial de 2026

/**
 * MOTOR DE INDICADORES: Setea el valor oficial de la UDI de manera local
 */
async function consultarUDIRealTime() {
    udiValorActualGlobal = 8.8437; 
    const badge = document.getElementById('udi-val-live');
    if(badge) {
        badge.innerText = udiValorActualGlobal.toFixed(4);
    }
}

/**
 * CONEXIÓN CORE: Descarga la información del Excel vía API SheetDB
 */
async function cargarBaseDeDatos() {
    await consultarUDIRealTime(); 
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        
        baseDatosCompleta = data.map(row => {
            return {
                id: row.id,
                empresa: row.empresa,
                poliza: row.poliza,
                contratante: row.contratante,
                asegurados: row.asegurados, 
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
    const countCumpleEl = document.getElementById('count-cumple');
    if(countCumpleEl) countCumpleEl.innerText = `${cumpleaniosHoy.length} Cumpleaños`;

    const pagosVencidos = baseDatosCompleta.filter(c => {
        return (c.estatus && String(c.estatus).toLowerCase() === "vencido") || (c.cobranza && c.cobranza.includes("V"));
    });
    const countPagosEl = document.getElementById('count-pagos');
    if(countPagosEl) countPagosEl.innerText = `${pagosVencidos.length} Vencimientos`;
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
    if(!planSelect) return;
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

/**
 * PINTOR DE INTERFAZ: Renderiza la información usando inyecciones seguras protegidas (Safe Inject)
 */
function desplegarInformacionPantalla() {
    if(!clienteSeleccionado) return;
    const c = clienteSeleccionado;
    
    // FUNCIÓN INTERNA DE SEGURIDAD: Inyecta datos solo si el ID existe en el HTML activo
    const safeInject = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.innerText = value;
    };

    // Inyección protegida de datos generales y comerciales
    safeInject('lbl-contratante', c.contratante);
    safeInject('txt-poliza', c.poliza);
    safeInject('txt-nacimiento', c.nacimiento);
    safeInject('txt-ppr', c.ppr);
    safeInject('txt-dotal', c.prox_dotal);
    safeInject('txt-deducible', c.deducible);
    safeInject('txt-coaseguro', c.coaseguro);
    
    safeInject('txt-ramo', c.ramo);
    safeInject('txt-suma', c.suma_asegurada);
    safeInject('txt-moneda', c.moneda);
    safeInject('txt-emision', c.emision);
    safeInject('txt-vencimiento', c.vencimiento);
    
    const tcValue = c.moneda === 'UDI' ? udiValorActualGlobal.toFixed(4) : c.tc;
    safeInject('txt-tc', tcValue);
    
    safeInject('txt-estatus', c.estatus);
    safeInject('txt-forma-pago', c.forma_pago);
    safeInject('txt-prima-anual', `$${c.prima_anual}`);
    safeInject('txt-prima-pago', `$${c.prima_pago}`);
    safeInject('txt-cobro-pesos', `$${c.cobro_pesos}`);
    safeInject('txt-dia-cobro', c.dia_cobro);
    
    safeInject('txt-aves-cp', c.aves_cp);
    safeInject('txt-aves-lp', c.aves_lp);
    safeInject('txt-num-cuenta', c.num_cuenta);
    safeInject('txt-prima-planeada', c.prima_planeada);

    // Acciones de contacto
    const linkTel = document.getElementById('link-tel');
    if(linkTel && c.telefono) {
        linkTel.href = `tel:${c.telefono}`;
        const strong = linkTel.querySelector('strong');
        if(strong) strong.innerText = c.telefono;
    }

    const linkEmail = document.getElementById('link-email');
    if(linkEmail && c.email) {
        linkEmail.href = `mailto:${c.email}?subject=Informacion de tu Poliza ${c.poliza}`;
        const strong = linkEmail.querySelector('strong');
        if(strong) strong.innerText = c.email;
    }

    // Datos fiscales
    safeInject('txt-rfc', c.rfc);
    safeInject('txt-regimen', c.regimen);
    safeInject('txt-cp-postal', c.cp_postal);
    safeInject('txt-direccion', c.direccion);

    // Render de Asegurados
    const wrapperAsegurados = document.getElementById('wrapper-asegurados');
    if(wrapperAsegurados) {
        wrapperAsegurados.innerHTML = '';
        const listaAsegurados = c.asegurados ? c.asegurados.split(',') : [c.contratante];
        listaAsegurados.forEach(asegurado => {
            wrapperAsegurados.innerHTML += `<div class="sub-cell font-bold" style="border:none; padding:4px 12px;">👤 ${asegurado.trim()}</div>`;
        });
    }

    // Render de Timeline Cobranza
    const timeline = document.getElementById('timeline-cobranza');
    if(timeline) {
        timeline.innerHTML = '';
        const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const trackCobranza = c.cobranza ? c.cobranza.split(',') : [];
        meses.forEach((mes, i) => {
            const val = trackCobranza[i] ? trackCobranza[i].trim() : '-';
            timeline.innerHTML += `<div class="month-bubble ${val === 'P' ? 'pagado' : 'pendiente'}"><span>${mes}</span><strong>${val}</strong></div>`;
        });
    }

    // Render de Beneficiarios
    const gridBen = document.getElementById('grid-beneficiarios');
    if(gridBen) {
        gridBen.innerHTML = `<div class="cell bg-grey font-bold">Beneficiario</div><div class="cell bg-grey font-bold">Motivo</div><div class="cell bg-grey font-bold">Porcentaje</div><div class="cell bg-grey font-bold">Fecha Nacimiento</div>`;
        if(c.beneficiarios && c.beneficiarios.length > 0) {
            c.beneficiarios.forEach(b => {
                gridBen.innerHTML += `<div class="cell">${b.nombre || '-'}</div><div class="cell">${b.motivo || '-'}</div><div class="cell text-center font-bold">${b.pct || '-'}</div><div class="cell text-center">${b.nac || '-'}</div>`;
            });
        }
    }
}

function enviarMensajeWA(tipo) {
    if(!clienteSeleccionado) return;
    const c = clienteSeleccionado;
    let mensaje = "";
    if(tipo === 'cumple') {
        mensaje = `¡Hola *${c.contratante}*! 🎉 Te mandamos un fuerte saludo de parte de *Conny* y el equipo. Queremos desearte un muy feliz cumpleaños hoy en tu día, ¡que te la pases excelente! 🎂🎈`;
    } else if(tipo === 'pago') {
        mensaje = `Estimado(a) *${c.contratante}*, te saludamos para recordarte que la fecha límite de tu pago *${c.forma_pago.toUpperCase()}* para tu póliza de *${c.ramo}* (No. *${c.poliza}*) es el próximo *${c.dia_cobro}* de este mes. El monto correspondiente al periodo es de *$${c.cobro_pesos} MXN*. Quedamos a tus órdenes para procesar el movimiento. 💳✨`;
    }
    window.open(`https://wa.me/52${c.telefono}?text=${encodeURIComponent(mensaje)}`, '_blank');
}

document.addEventListener('DOMContentLoaded', cargarBaseDeDatos);
