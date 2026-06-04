/* =========================================================================
   PROYECTO: AGENDA DE SEGUROS (CONNY CRM)
   PARTE 1: CONFIGURACIÓN, DIVISAS EN TIEMPO REAL Y MOTOR DE FILTROS
   ========================================================================= */

const API_URL = 'https://sheetdb.io/api/v1/v3rg9i21440di?sheet=Base_Datos'; 

let baseDatosCompleta = []; 
let clienteSeleccionado = null; 
let udiValorActualGlobal = 8.8437; 
let usdValorActualGlobal = 17.5000; // Valor de respaldo por si falla la API externa

// 1. CONSULTA DE DIVISAS EN TIEMPO REAL (UDI Y DÓLAR)
async function consultarDivisasRealTime() {
    // A) Fijamos el valor de la UDI acordado
    udiValorActualGlobal = 8.8437; 
    const badgeUdi = document.getElementById('udi-val-live');
    if(badgeUdi) badgeUdi.innerText = udiValorActualGlobal.toFixed(4);

    // B) Consultamos el valor real del Dólar (USD) usando una API abierta de finanzas
    try {
        const res = await fetch('https://open.er-api.com/v6/latest/USD');
        if (res.ok) {
            const data = await res.json();
            // Calculamos el inverso de USD a MXN (la API da 1 USD = X monedas mundiales)
            if (data && data.rates && data.rates.MXN) {
                usdValorActualGlobal = parseFloat(data.rates.MXN);
            }
        }
    } catch (err) {
        console.warn("⚠️ No se pudo obtener el dólar en tiempo real, usando valor de respaldo.", err);
    }

    // Dibujamos el valor del dólar en su nuevo componente superior
    const badgeUsd = document.getElementById('usd-val-live');
    if(badgeUsd) badgeUsd.innerText = `$${usdValorActualGlobal.toFixed(2)} MXN`;
}

// 2. CARGA MAESTRA DE DATOS DESDE GOOGLE SHEETS VIA SHEETDB
async function cargarBaseDeDatos() {
    // Descargamos primero los valores de las monedas para tenerlos listos
    await consultarDivisasRealTime(); 
    
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
                emision: row.emision || '-',      // Capturamos la nueva fecha solicitada
                vencimiento: row.vencimiento || '-', // Capturamos la nueva fecha solicitada
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
                // Mapeo detallado de beneficiarios con sus cumpleaños
                beneficiarios: [
                    { nombre: row.b1_nombre, motivo: row.b1_motivo, pct: row.b1_pct, nac: row.b1_nac },
                    { nombre: row.b2_nombre, motivo: row.b2_motivo, pct: row.b2_pct, nac: row.b2_nac }
                ].filter(b => b.nombre && b.nombre !== "N/A" && b.nombre !== "") 
            };
        });

        // Ejecutamos los componentes visuales iniciales de control
        actualizarContadoresAlertas();
        llenarSelectorEmpresas();
        llenarSelectorClientes(baseDatosCompleta);
    } catch (error) {
        console.error("❌ Error sincronizando datos desde SheetDB / Excel:", error);
    }
}

// 3. CONTROLADORES DE LOS SELECTORES (FILTROS)
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

function seleccionarClientePorNombre(nombre) {
    const selectCliente = document.getElementById('filtro-cliente');
    if(selectCliente) {
        selectCliente.value = nombre;
        cargarDatosCliente();
    }
}

/* --- FIN DE LA PARTE 1 --- */
/* =========================================================================
   PARTE 2: ALERTAS MULTI-ROL, RENDERIZADO EN PANTALLA Y ACCIONES DE WHATSAPP
   ========================================================================= */

// 1. EVALUACIÓN DE ALERTAS TEMPRANAS (CON DETECCIÓN DE ROLES)
function actualizarContadoresAlertas() {
    const hoy = new Date();
    const diaHoy = hoy.getDate();
    const mesHoy = hoy.getMonth(); 
    const añoHoy = hoy.getFullYear();

    if (!baseDatosCompleta || baseDatosCompleta.length === 0) return;

    let cumpleaniosSemana = [];
    let proximosCobros = [];
    let polizasVencidas = [];

    // Función auxiliar para calcular si un cumpleaños cae en los próximos 7 días
    const evaluarCumple = (fechaTexto, nombrePersona, clienteRaiz, rol) => {
        if (!fechaTexto || !fechaTexto.includes('/')) return;
        const partes = fechaTexto.split('/');
        const diaNac = parseInt(partes[0]);
        const mesNac = parseInt(partes[1]) - 1;
        
        let fechaCumpleEsteAño = new Date(añoHoy, mesNac, diaNac);
        const diffTiempo = fechaCumpleEsteAño - hoy;
        const diffDias = Math.ceil(diffTiempo / (1000 * 60 * 60 * 24));
        
        if (diffDias >= 0 && diffDias <= 7) {
            cumpleaniosSemana.push({ 
                nombre: nombrePersona, 
                clienteAsociado: clienteRaiz, 
                diasPara: diffDias, 
                rol: rol 
            });
        }
    };

    // Escaneamos la base de datos completa
    baseDatosCompleta.forEach(c => {
        // A) Evaluamos al Contratante
        evaluarCumple(c.nacimiento, c.contratante, c, 'contratante');

        // B) Evaluamos a los Asegurados independientes
        if (c.asegurados && c.asegurados.includes(',')) {
            const listaAsegurados = c.asegurados.split(',');
            listaAsegurados.forEach(aseg => {
                const nombreLimpio = aseg.trim();
                if(nombreLimpio !== c.contratante) {
                    // Nota: Si en tu Excel agregas una columna para el nacimiento de cada asegurado, 
                    // aquí la mapearíamos; por ahora usa la del plan para alertar al núcleo familiar.
                    evaluarCumple(c.nacimiento, nombreLimpio, c, 'asegurado');
                }
            });
        }

        // C) Evaluamos a los Beneficiarios
        if (c.beneficiarios && c.beneficiarios.length > 0) {
            c.beneficiarios.forEach(b => {
                evaluarCumple(b.nac, b.nombre, c, 'beneficiario');
            });
        }

        // D) Filtro y procesamiento de Cobranza/Vencimientos
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

    // 2. CONSTRUCCIÓN VISUAL DEL ACORDEÓN DE CUMPLEAÑOS (CON ROLES)
    const countCumpleEl = document.getElementById('count-cumple');
    if(countCumpleEl) countCumpleEl.innerText = `${cumpleaniosSemana.length} Cumpleaños`;
    const listCumpleEl = document.getElementById('list-cumple-alert');
    if(listCumpleEl) {
        listCumpleEl.innerHTML = cumpleaniosSemana.length > 0 ? '' : '<div class="alert-empty-msg">Sin birthdays esta semana</div>';
        
        // Ordenamos por cercanía de días
        cumpleaniosSemana.sort((a,b) => a.diasPara - b.diasPara).forEach(item => {
            const tagDia = item.diasPara === 0 ? "¡HOY!" : `en ${item.diasPara} d`;
            
            // Definimos el texto y la clase CSS del Rol para Conny
            let claseRol = 'role-contratante';
            let textoRol = 'Contratante';
            if (item.rol === 'asegurado') { claseRol = 'role-asegurado'; textoRol = 'Asegurado'; }
            if (item.rol === 'beneficiario') { claseRol = 'role-beneficiario'; textoRol = 'Beneficiario'; }

            listCumpleEl.innerHTML += `
                <div class="alert-name-item" onclick="seleccionarClientePorNombre('${item.clienteAsociado.contratante}')">
                    🎉 ${item.nombre} 
                    <span class="role-badge ${claseRol}">${textoRol}</span>
                    <div class="right-tags">
                        <small>${tagDia}</small>
                    </div>
                </div>`;
        });
    }

    // 3. CONSTRUCCIÓN VISUAL DE ALERTAS DE COBRANZA
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

// 4. DESPLIEGUE COMPLETO DE LA TARJETA DEL CLIENTE EN PANTALLA
function desplegarInformacionPantalla() {
    if(!clienteSeleccionado) return;
    const c = clienteSeleccionado;
    
    const safeInject = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.innerText = value;
    };

    // Inyección de textos básicos e identificadores nuevos
    safeInject('lbl-contratante', c.contratante);
    safeInject('txt-poliza', c.poliza);
    safeInject('txt-emision', c.emision);          // Nueva Fecha Emisión colocada en su bloque lógico
    safeInject('txt-vencimiento', c.vencimiento);  // Nueva Fecha Término colocada en su bloque lógico
    safeInject('txt-nacimiento', c.nacimiento);
    safeInject('txt-ppr', c.ppr);
    safeInject('txt-dotal', c.prox_dotal);
    safeInject('txt-deducible', c.deducible);
    safeInject('txt-coaseguro', c.coaseguro);
    
    safeInject('txt-ramo', c.ramo);
    safeInject('txt-suma', c.suma_asegurada);
    safeInject('txt-moneda', c.moneda);
    
    // Cálculo inteligente del Tipo de Cambio dinámico
    const tcValue = c.moneda === 'UDI' ? udiValorActualGlobal.toFixed(4) : (c.moneda === 'USD' ? usdValorActualGlobal.toFixed(2) : c.tc);
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

    // Links directos nativos de llamadas y correos
    const linkTel = document.getElementById('link-tel');
    if(linkTel && c.telefono) {
        linkTel.href = `tel:${c.telefono}`;
        const strong = linkTel.querySelector('strong');
        if(strong) strong.innerText = c.telefono;
    }

    const linkEmail = document.getElementById('link-email');
    if(linkEmail && c.email) {
        linkEmail.href = `mailto:${c.email}?subject=Información de tu Póliza ${c.poliza}`;
        const strong = linkEmail.querySelector('strong');
        if(strong) strong.innerText = c.email;
    }

    // Datos de Facturación SAT
    try {
        document.getElementById('txt-rfc').innerText = c.rfc;
        document.getElementById('txt-regimen').innerText = c.regimen;
        document.getElementById('txt-cp-postal').innerText = c.cp_postal;
        document.getElementById('txt-direccion').innerText = c.direccion;
    } catch (err) {}

    // RENDERIZADO DE ASEGURADOS CON SU PROPIO BOTÓN DE WHATSAPP
    const wrapperAsegurados = document.getElementById('wrapper-asegurados');
    if(wrapperAsegurados) {
        wrapperAsegurados.innerHTML = '';
        const listaAsegurados = c.asegurados ? c.asegurados.split(',') : [c.contratante];
        listaAsegurados.forEach(asegurado => {
            const nombreLimpio = asegurado.trim();
            wrapperAsegurados.innerHTML += `
                <div class="sub-cell font-bold" style="border:none; padding:4px 12px; display:flex; justify-content:space-between; align-items:center;">
                    <span>👤 ${nombreLimpio}</span>
                    <button class="btn-inline-wa" onclick="enviarMensajeTerceros('asegurado', '${nombreLimpio}')">📲 WA</button>
                </div>`;
        });
    }

    // Cronograma Anual de Cobranza (Ene - Dic)
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

    // RENDERIZADO DE BENEFICIARIOS CON COLUMNA DE ACCIÓN INDEPENDIENTE (WA)
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
                        <div class="sub-cell" style="display:flex; justify-content:space-between; align-items:center;">
                            <span>Acciones:</span> 
                            <button class="btn-inline-wa" onclick="enviarMensajeTerceros('beneficiario', '${b.nombre.trim()}')">📲 Felicitación (WA)</button>
                        </div>
                    </div>`;
            });
        } else {
            gridBen.innerHTML = `<div class="cell text-center" style="grid-column: span 4; color: #a0aec0; font-style: italic; padding: 15px;">Sin beneficiarios registrados en este plan.</div>`;
        }
    }
}

// 5. ACCIONES DIRECTAS DE WHATSAPP (CONTRATANTE)
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

// 6. NUEVA FUNCIÓN: MENSAJES PERSONALIZADOS A ASEGURADOS Y BENEFICIARIOS
function enviarMensajeTerceros(rol, nombrePersona) {
    if(!clienteSeleccionado) return;
    const c = clienteSeleccionado;
    let mensaje = "";
    
    if(rol === 'asegurado') {
        mensaje = `¡Hola *${nombrePersona}*! 🎉 Te escribo de parte de *Conny*. Queremos desearte un muy feliz cumpleaños. Es un honor para nosotros saber que estás protegido a través de la póliza de seguro de la familia. ¡Que pases un día extraordinario! 🎂✨`;
    } else if(rol === 'beneficiario') {
        mensaje = `¡Hola *${nombrePersona}*! 🌟 Te mando un afectuoso saludo de parte de *Conny*. Aprovechamos este día tan especial para desearte un muy feliz cumpleaños, esperando que pases un día lleno de alegría junto a tus seres queridos. ¡Muchas felicidades! 🎂🎈`;
    }
    
    // Al ser familiares o dependientes, por seguridad abrimos el chat directo a tu número base de contacto para que Conny lo asigne o use el teléfono registrado.
    window.open(`https://wa.me/52${c.telefono}?text=${encodeURIComponent(mensaje)}`, '_blank');
}

// 7. COMPONENTE DE ACORDEÓN PARA LAS ALERTAS
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

// DISPARADOR GLOBAL DE INICIALIZACIÓN
document.addEventListener('DOMContentLoaded', cargarBaseDeDatos);
