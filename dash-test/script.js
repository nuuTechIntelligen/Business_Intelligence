const API_URL = 'https://sheetdb.io/api/v1/v3rg9i21440di?sheet=Base_Datos'; 

let baseDatosCompleta = []; 
let clienteSeleccionado = null; 
let udiValorActualGlobal = 8.8437; 

async function consultarUDIRealTime() {
    udiValorActualGlobal = 8.8437; 
    const badge = document.getElementById('udi-val-live');
    if(badge) badge.innerText = udiValorActualGlobal.toFixed(4);
}

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
    const diaHoy = hoy.getDate();
    const mesHoy = hoy.getMonth(); 
    const añoHoy = hoy.getFullYear();

    if (!baseDatosCompleta || baseDatosCompleta.length === 0) return;

    let cumpleaniosSemana = [];
    let proximosCobros = [];
    let polizasVencidas = [];

    baseDatosCompleta.forEach(c => {
        if (c.nacimiento && c.nacimiento.includes('/')) {
            const partes = c.nacimiento.split('/');
            const diaNac = parseInt(partes[0]);
            const mesNac = parseInt(partes[1]) - 1;
            
            let fechaCumpleEsteAño = new Date(añoHoy, mesNac, diaNac);
            const diffTiempo = fechaCumpleEsteAño - hoy;
            const diffDias = Math.ceil(diffTiempo / (1000 * 60 * 60 * 24));
            
            if (diffDias >= 0 && diffDias <= 7) {
                cumpleaniosSemana.push({ data: c, diasPara: diffDias });
            }
        }

        const diaCobroNum = parseInt(c.dia_cobro || 0);
        const esEstatusVencido = c.estatus && String(c.estatus).toLowerCase() === "vencido";
        const tieneLetraV = c.cobranza && c.cobranza.includes("V");

        if (esEstatusVencido || tieneLetraV) {
            if (diaCobroNum >= diaHoy && diaCobroNum <= (diaHoy + 7)) {
                const diasFaltantes = diaCobroNum - diaHoy;
                proximosCobros.push({ data: c, diasRestantes: diasFaltantes });
            } else if (diaCobroNum < diaHoy || esEstatusVencido) {
                const diasRetraso = diaCobroNum < diaHoy ? (diaHoy - diaCobroNum) : 15; 
                polizasVencidas.push({ data: c, diasAtraso: diasRetraso });
            }
        }
    });

    const countCumpleEl = document.getElementById('count-cumple');
    if(countCumpleEl) countCumpleEl.innerText = `${cumpleaniosSemana.length} Cumpleaños`;
    const listCumpleEl = document.getElementById('list-cumple-alert');
    if(listCumpleEl) {
        listCumpleEl.innerHTML = cumpleaniosSemana.length > 0 ? '' : '<div class="alert-empty-msg">Sin birthdays esta semana</div>';
        cumpleaniosSemana.sort((a,b) => a.diasPara - b.diasPara).forEach(item => {
            const tagDia = item.diasPara === 0 ? "¡HOY!" : `en ${item.diasPara} d`;
            listCumpleEl.innerHTML += `<div class="alert-name-item" onclick="seleccionarClientePorNombre('${item.data.contratante}')">🎉 ${item.data.contratante} <small>${tagDia}</small></div>`;
        });
    }

    const countProximosEl = document.getElementById('count-proximos');
    if(countProximosEl) countProximosEl.innerText = `${proximosCobros.length} Por Vencer`;
    const listProximosEl = document.getElementById('list-proximos-alert');
    if(listProximosEl) {
        listProximosEl.innerHTML = proximosCobros.length > 0 ? '' : '<div class="alert-empty-msg">Sin cobros próximos</div>';
        proximosCobros.sort((a,b) => a.diasRestantes - b.diasRestantes).forEach(item => {
            const tagProx = item.diasRestantes === 0 ? "Cobrar HOY" : `Faltan ${item.diasRestantes} d`;
            listProximosEl.innerHTML += `<div class="alert-name-item alert-item-warn" onclick="seleccionarClientePorNombre('${item.data.contratante}')">⏳ ${item.data.contratante} <small>${tagProx}</small></div>`;
        });
    }

    const countVencidasEl = document.getElementById('count-vencidas');
    if(countVencidasEl) countVencidasEl.innerText = `${polizasVencidas.length} Vencidas`;
    const listVencidasEl = document.getElementById('list-vencidas-alert');
    if(listVencidasEl) {
        listVencidasEl.innerHTML = polizasVencidas.length > 0 ? '' : '<div class="alert-empty-msg">Cartera al día</div>';
        polizasVencidas.sort((a,b) => b.diasAtraso - a.diasAtraso).forEach(item => {
            listVencidasEl.innerHTML += `<div class="alert-name-item alert-item-danger" onclick="seleccionarClientePorNombre('${item.data.contratante}')">🚨 ${item.data.contratante} <small>Atraso: ${item.diasAtraso}d</small></div>`;
        });
    }
}

function seleccionarClientePorNombre(nombre) {
    const selectCliente = document.getElementById('filtro-cliente');
    if(selectCliente) {
        selectCliente.value = nombre;
        cargarDatosCliente();
    }
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

function desplegarInformacionPantalla() {
    if(!clienteSeleccionado) return;
    const c = clienteSeleccionado;
    
    const safeInject = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.innerText = value;
    };

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

    try {
        const rfcEl = document.getElementById('txt-rfc');
        const regimenEl = document.getElementById('txt-regimen');
        const cpEl = document.getElementById('txt-cp-postal');
        const dirEl = document.getElementById('txt-direccion');
        if (rfcEl && regimenEl && cpEl && dirEl) {
            rfcEl.innerText = c.rfc;
            regimenEl.innerText = c.regimen;
            cpEl.innerText = c.cp_postal;
            dirEl.innerText = c.direccion;
        }
    } catch (err) {}

    const wrapperAsegurados = document.getElementById('wrapper-asegurados');
    if(wrapperAsegurados) {
        wrapperAsegurados.innerHTML = '';
        const listaAsegurados = c.asegurados ? c.asegurados.split(',') : [c.contratante];
        listaAsegurados.forEach(asegurado => {
            wrapperAsegurados.innerHTML += `<div class="sub-cell font-bold" style="border:none; padding:4px 12px;">👤 ${asegurado.trim()}</div>`;
        });
    }

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

    // INTERVENCIÓN DEFINITIVA: Render agrupado en un solo bloque unificado por beneficiario para móviles
    const gridBen = document.getElementById('grid-beneficiarios');
    if(gridBen) {
        gridBen.innerHTML = '';
        if(c.beneficiarios && c.beneficiarios.length > 0) {
            c.beneficiarios.forEach(b => {
                gridBen.innerHTML += `
                    <div class="beneficiary-card-group">
                        <div class="sub-cell"><span>Beneficiario:</span> <strong>${b.nombre || '-'}</strong></div>
                        <div class="sub-cell"><span>Motivo:</span> <strong>${b.motivo || '-'}</strong></div>
                        <div class="sub-cell"><span>Porcentaje:</span> <strong class="tag-pago" style="background-color: var(--navy-light);">${b.pct || '-'}</strong></div>
                        <div class="sub-cell"><span>Fecha Nacimiento:</span> <strong>${b.nac || '-'}</strong></div>
                    </div>
                `;
            });
        } else {
            gridBen.innerHTML = `<div class="cell text-center" style="grid-column: span 4; color: #a0aec0; font-style: italic; padding: 15px;">Sin beneficiarios registrados en este plan.</div>`;
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

function conmutarAcordeon(idLista) {
    const listaObjetivo = document.getElementById(idLista);
    if (!listaObjetivo) return;
    const estaAbierta = listaObjetivo.classList.contains('active');
    document.querySelectorAll('.alert-names-list').forEach(lista => {
        lista.classList.remove('active');
    });
    if (!estaAbierta) {
        listaObjetivo.classList.add('active');
    }
}

document.addEventListener('DOMContentLoaded', cargarBaseDeDatos);
