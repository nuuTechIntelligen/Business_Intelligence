/* =========================================================================
   PROYECTO: AGENDA DE SEGUROS (CONNY CRM)
   PARTE 1: CONFIGURACIÓN, DIVISAS EN TIEMPO REAL Y MOTOR DE FILTROS (V2.5)
   ========================================================================= */

const API_URL = 'https://sheetdb.io/api/v1/o6q7vkecjanvw?sheet=Base_Datos'; 
//https://sheetdb.io/api/v1/o6q7vkecjanvw

let baseDatosCompleta = []; 
let clienteSeleccionado = null; 
let udiValorActualGlobal = 8.8437; 
let usdValorActualGlobal = 17.5000; 

// FUNCIÓN AUXILIAR DE UX: Formateador estandarizado de moneda financiera
function formatearAmonedaLocal(valor) {
    if (valor === undefined || valor === null || valor === '-') return "$0.00 MXN";
    // Limpiamos caracteres extraños por si viene ya pre-formateado
    const numero = parseFloat(String(valor).replace(/[^0-9.-]+/g, ""));
    if (isNaN(numero)) return "$0.00 MXN";
    
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 2
    }).format(numero) + ' MXN';
}

// 1. CONSULTA DE DIVISAS EN TIEMPO REAL (UDI Y DÓLAR)
async function consultarDivisasRealTime() {
    // Valores de respaldo por si fallan las APIs externas
    udiValorActualGlobal = 8.8437; 
    usdValorActualGlobal = 17.5000; 

    // A) Consultamos el valor real de la UDI en tiempo real (Vía código internacional MXV)
    try {
        const resUdi = await fetch('https://open.er-api.com/v6/latest/USD');
        if (resUdi.ok) {
            const dataUdi = await resUdi.json();
            if (dataUdi && dataUdi.rates && dataUdi.rates.MXN && dataUdi.rates.MXV) {
                const usdEnPesos = parseFloat(dataUdi.rates.MXN);
                const usdEnUdis = parseFloat(dataUdi.rates.MXV);
                
                udiValorActualGlobal = usdEnPesos / usdEnUdis;
                console.log("🚀 [Éxito Absoluto] UDI calculada en vivo sin CORS:", udiValorActualGlobal);
            }
        } else {
            console.warn("⚠️ El servidor financiero respondió con un error para la UDI:", resUdi.status);
        }
    } catch (err) {
        console.warn("⚠️ No se pudo calcular la UDI en tiempo real, usando valor de respaldo.", err);
    }
    
    const badgeUdi = document.getElementById('udi-val-live');
    if(badgeUdi) badgeUdi.innerText = udiValorActualGlobal.toFixed(4);

    // B) Consultamos el valor real del Dólar (USD)
    try {
        const resUsd = await fetch('https://open.er-api.com/v6/latest/USD');
        if (resUsd.ok) {
            const dataUsd = await resUsd.json();
            if (dataUsd && dataUsd.rates && dataUsd.rates.MXN) {
                usdValorActualGlobal = parseFloat(dataUsd.rates.MXN);
            }
        }
    } catch (err) {
        console.warn("⚠️ No se pudo obtener el dólar en tiempo real, usando valor de respaldo.", err);
    }

    const badgeUsd = document.getElementById('usd-val-live');
    if(badgeUsd) badgeUsd.innerText = `$${usdValorActualGlobal.toFixed(2)} MXN`;
}

// 2. CARGA MAESTRA DE DATOS DESDE GOOGLE SHEETS
// 2. CARGA MAESTRA DE DATOS DESDE GOOGLE SHEETS
async function cargarBaseDeDatos() {
    const loader = document.getElementById('loading-overlay');
    if (loader) loader.classList.remove('hidden');
    
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
                emision: row.emision || '-',      
                vencimiento: row.vencimiento || '-', 
                auditoria: row.auditoria || '-',         
                observaciones: row.observaciones || '', 
                historial_gestion: row.historial_gestion || '', // Nuevo campo acumulativo
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
                b1_nombre: row.b1_nombre || '',
                b1_motivo: row.b1_motivo || '',
                b1_pct: row.b1_pct || '',
                b1_nac: row.b1_nac || '',
                b2_nombre: row.b2_nombre || '',
                b2_motivo: row.b2_motivo || '',
                b2_pct: row.b2_pct || '',
                b2_nac: row.b2_nac || '',
                beneficiarios: [
                    { nombre: row.b1_nombre, motivo: row.b1_motivo, pct: row.b1_pct, nac: row.b1_nac },
                    { nombre: row.b2_nombre, motivo: row.b2_motivo, pct: row.b2_pct, nac: row.b2_nac }
                ].filter(b => b.nombre && b.nombre !== "N/A" && b.nombre !== ""),
                beneficiarios_raw: {
                    b1_nombre: row.b1_nombre || '',
                    b1_motivo: row.b1_motivo || '',
                    b1_pct: row.b1_pct || '',
                    b1_nac: row.b1_nac || '',
                    b2_nombre: row.b2_nombre || '',
                    b2_motivo: row.b2_motivo || '',
                    b2_pct: row.b2_pct || '',
                    b2_nac: row.b2_nac || ''
                }
            };
        });

        actualizarContadoresAlertas();
        llenarSelectorEmpresas();
        llenarSelectorClientes(baseDatosCompleta);
        calcularMetricasGlobales(); // Actualiza el panel global financiero
    } catch (error) {
        console.error("❌ Error sincronizando datos desde SheetDB / Excel:", error);
    } finally {
        if (loader) {
            setTimeout(() => {
                loader.classList.add('hidden');
            }, 600); // Suaviza la transición inicial
        }
    }
}

// 3. CONTROLADORES DE FILTROS
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
    select.innerHTML = '<option value="...指定">Selecciona un cliente...</option>';
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
   PARTE 2.2: ALERTAS MULTI-ROL Y DESPLIEGUE DE INFORMACIÓN EN PANTALLA
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

    baseDatosCompleta.forEach(c => {
        evaluarCumple(c.nacimiento, c.contratante, c, 'contratante');

        if (c.asegurados && c.asegurados.includes(',')) {
            const listaAsegurados = c.asegurados.split(',');
            listaAsegurados.forEach(aseg => {
                const nombreLimpio = aseg.trim();
                if(nombreLimpio !== c.contratante) {
                    evaluarCumple(c.nacimiento, nombreLimpio, c, 'asegurado');
                }
            });
        }

        if (c.beneficiarios && c.beneficiarios.length > 0) {
            c.beneficiarios.forEach(b => {
                evaluarCumple(b.nac, b.nombre, c, 'beneficiario');
            });
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

function desplegarInformacionPantalla() {
    if(!clienteSeleccionado) return;
    const c = clienteSeleccionado;
    
    const safeInject = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.innerText = value;
    };

    safeInject('lbl-contratante', c.contratante);
    safeInject('txt-poliza', c.poliza);
    safeInject('txt-emision', c.emision);          
    safeInject('txt-vencimiento', c.vencimiento);  
    safeInject('txt-nacimiento', c.nacimiento);
    safeInject('txt-auditoria', c.auditoria);      
    safeInject('txt-ppr', c.ppr);
    safeInject('txt-dotal', c.prox_dotal);
    safeInject('txt-deducible', c.deducible);
    safeInject('txt-coaseguro', c.coaseguro);
    
    safeInject('txt-ramo', c.ramo);
    safeInject('txt-suma', c.suma_asegurada);
    safeInject('txt-moneda', c.moneda);
    
    const tcValue = c.moneda === 'UDI' ? udiValorActualGlobal.toFixed(4) : (c.moneda === 'USD' ? usdValorActualGlobal.toFixed(2) : c.tc);
    safeInject('txt-tc', tcValue);
    
    safeInject('txt-estatus', c.estatus);
    safeInject('txt-forma-pago', c.forma_pago);
    
    // UX 1: Aplicación del formateo dinámico monetario de salida ($60,000.00 MXN)
    safeInject('txt-prima-anual', formatearAmonedaLocal(c.prima_anual));
    safeInject('txt-prima-pago', formatearAmonedaLocal(c.prima_pago));
    safeInject('txt-cobro-pesos', formatearAmonedaLocal(c.cobro_pesos));
    
    safeInject('txt-dia-cobro', c.dia_cobro);
    safeInject('txt-aves-cp', c.aves_cp);
    safeInject('txt-aves-lp', c.aves_lp);
    safeInject('txt-num-cuenta', c.num_cuenta);
    safeInject('txt-prima-planeada', c.prima_planeada);

    // Limpiar input de nueva nota y desplegar el historial de gestión
    const txtAreaNota = document.getElementById('txa-nueva-nota');
    if (txtAreaNota) txtAreaNota.value = '';
    desplegarHistorialGestion(c);

    // Calcular y desplegar barra de progreso de pago anual por cliente
    const progreso = calcularProgresoPago(c);
    const txtProgresoPct = document.getElementById('txt-progreso-pct');
    const barProgresoPago = document.getElementById('bar-progreso-pago');
    
    if (txtProgresoPct) {
        txtProgresoPct.innerText = `${progreso.pct}% (${progreso.pagados}/${progreso.totales} pagos)`;
    }
    if (barProgresoPago) {
        barProgresoPago.style.width = `${progreso.pct}%`;
        if (progreso.pct === 100) {
            barProgresoPago.style.backgroundColor = '#25D366'; // Verde completado
        } else if (progreso.pct >= 50) {
            barProgresoPago.style.backgroundColor = '#134074'; // Navy estándar
        } else {
            barProgresoPago.style.backgroundColor = '#ff9f1c'; // Naranja advertencia
        }
    }

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

    try {
        document.getElementById('txt-rfc').innerText = c.rfc;
        document.getElementById('txt-regimen').innerText = c.regimen;
        document.getElementById('txt-cp-postal').innerText = c.cp_postal;
        document.getElementById('txt-direccion').innerText = c.direccion;
    } catch (err) {}

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
    } 
    // UX 2: Optimización completa del disparador de cobranza por WhatsApp con monto formateado profesionalmente
    else if(tipo === 'pago') {
        const montoFormateadoPerfecto = formatearAmonedaLocal(c.cobro_pesos);
        const fechaLimiteFormato = c.dia_cobro && c.dia_cobro !== '-' ? `el próximo *${c.dia_cobro}* de este mes` : 'en los próximos días';

        mensaje = `Estimado(a) *${c.contratante}*, te saludamos con gusto para recordarte que la fecha límite de tu pago *${c.forma_pago.toUpperCase()}* para tu póliza de *${c.ramo}* (No. *${c.poliza}*) es ${fechaLimiteFormato}.%0A%0A` +
                  `*Monto correspondiente al periodo:* ${montoFormateadoPerfecto}%0A%0A` +
                  `Quedamos a tus completas órdenes para apoyarte a procesar tu movimiento de manera segura. ¡Excelente día! 💳✨`;
    }
    
    // Si el tipo es 'pago', ya metimos los saltos de línea con %0A directamente en el string para preservar la estructura visual del chat
    const textoFinalURL = tipo === 'pago' ? mensaje : encodeURIComponent(mensaje);
    window.open(`https://wa.me/52${c.telefono}?text=${textoFinalURL}`, '_blank');
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

// =========================================================================
// FUNCIONES DE LA FASE 2: MÉTRICAS, PROGRESO, HISTORIAL Y CRUD (V3.0)
// =========================================================================

// 1. CÁLCULO DE AVANCE DE PAGO ANUAL POR CLIENTE
function calcularProgresoPago(c) {
    const trackCobranza = c.cobranza ? c.cobranza.split(',') : [];
    const countP = trackCobranza.filter(v => v.trim().toUpperCase() === 'P').length;
    let totalPagosEsperados = 12;
    
    const forma = String(c.forma_pago).toLowerCase();
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

// 2. OBTENER TASA DE CAMBIO
function obtenerTC(moneda, tcDefecto) {
    if (moneda === 'UDI') return udiValorActualGlobal;
    if (moneda === 'USD') return usdValorActualGlobal;
    return parseFloat(tcDefecto) || 1.0;
}

// 3. OBTENER EL COBRO MENSUAL/PERIODO EN PESOS
function obtenerCobroPesos(c) {
    if (c.cobro_pesos && c.cobro_pesos !== '-') {
        const num = parseFloat(String(c.cobro_pesos).replace(/[^0-9.-]+/g, ""));
        if (!isNaN(num)) return num;
    }
    const tc = obtenerTC(c.moneda, c.tc);
    const primaPagoNum = parseFloat(c.prima_pago) || 0;
    return primaPagoNum * tc;
}

// 4. CALCULAR MÉTRICAS GLOBALES E INYECTAR EN LA INTERFAZ
function calcularMetricasGlobales() {
    let totalPrimasVigentes = 0;
    let totalRecaudado = 0;
    let totalPendiente = 0;
    
    let ingresosMensuales = Array(12).fill(0);
    let pendientesMensuales = Array(12).fill(0);
    
    baseDatosCompleta.forEach(c => {
        const esVigente = c.estatus && c.estatus.toLowerCase() === 'vigente';
        const tc = obtenerTC(c.moneda, c.tc);
        
        if (esVigente) {
            const primaAnualNum = parseFloat(c.prima_anual) || 0;
            totalPrimasVigentes += primaAnualNum * tc;
        }
        
        const trackCobranza = c.cobranza ? c.cobranza.split(',') : [];
        const cobroPesos = obtenerCobroPesos(c);
        
        trackCobranza.forEach((estado, i) => {
            if (i >= 12) return;
            const val = estado.trim().toUpperCase();
            if (val === 'P') {
                ingresosMensuales[i] += cobroPesos;
                totalRecaudado += cobroPesos;
            } else if (val === 'V' || (esVigente && val === '-')) {
                pendientesMensuales[i] += cobroPesos;
                totalPendiente += cobroPesos;
            }
        });
    });
    
    const elVigentes = document.getElementById('total-primas-vigentes');
    const elRecaudado = document.getElementById('total-recaudado');
    const elPendiente = document.getElementById('total-pendiente');
    
    if (elVigentes) elVigentes.innerText = formatearAmonedaLocal(totalPrimasVigentes);
    if (elRecaudado) elRecaudado.innerText = formatearAmonedaLocal(totalRecaudado);
    if (elPendiente) elPendiente.innerText = formatearAmonedaLocal(totalPendiente);
    
    // Renderizar gráfico de barras mensuales
    const monthlyGrid = document.getElementById('monthly-income-grid');
    if (monthlyGrid) {
        monthlyGrid.innerHTML = '';
        const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const maxIngreso = Math.max(...ingresosMensuales, 1);
        
        meses.forEach((mes, i) => {
            const ing = ingresosMensuales[i];
            const pctAltura = Math.round((ing / maxIngreso) * 100);
            const titleTooltip = `Cobrado: ${formatearAmonedaLocal(ing)}\nPendiente: ${formatearAmonedaLocal(pendientesMensuales[i])}`;
            
            monthlyGrid.innerHTML += `
                <div class="monthly-bar-container" title="${titleTooltip}">
                    <div class="monthly-bar-label">${mes}</div>
                    <div class="monthly-bar-track">
                        <div class="monthly-bar-fill" style="height: ${pctAltura}%;"></div>
                    </div>
                    <div class="monthly-bar-val">${formatAbrevMonto(ing)}</div>
                </div>
            `;
        });
    }
}

// Abreviar números financieros grandes
function formatAbrevMonto(valor) {
    if (valor >= 1000000) {
        return `$${(valor / 1000000).toFixed(1)}M`;
    }
    if (valor >= 1000) {
        return `$${(valor / 1000).toFixed(1)}k`;
    }
    return `$${valor.toFixed(0)}`;
}

// 5. DESPLEGAR EL HISTORIAL DE GESTIÓN EN MODO LECTURA
function desplegarHistorialGestion(c) {
    const container = document.getElementById('history-log-container');
    if (!container) return;
    container.innerHTML = '';
    
    let notes = [];
    if (c.historial_gestion && c.historial_gestion.trim() !== '') {
        notes = c.historial_gestion.split(' - ').filter(n => n.trim() !== '');
    } else if (c.observaciones && c.observaciones.trim() !== '') {
        // Soporte de retrocompatibilidad para notas antiguas
        notes = [c.observaciones];
    }
    
    if (notes.length === 0) {
        container.innerHTML = '<div class="alert-empty-msg">No hay notas registradas para este cliente.</div>';
        return;
    }
    
    // Las notas se muestran de la más nueva a la más antigua
    const notesToShow = [...notes];
    notesToShow.reverse().forEach(note => {
        const matchDate = note.match(/^\[(\d{1,2}\/\d{1,2}\/\d{4})\]:\s*(.*)$/);
        let fecha = 'Nota';
        let texto = note;
        
        if (matchDate) {
            fecha = matchDate[1];
            texto = matchDate[2];
        }
        
        container.innerHTML += `
            <div class="history-item">
                <div class="history-date">📅 ${fecha}</div>
                <div class="history-text">${texto}</div>
            </div>
        `;
    });
}

// 6. AGREGAR NUEVA NOTA Y CONCATENAR AL HISTORIAL
async function guardarNuevaNotaHistorial() {
    if (!clienteSeleccionado) {
        alert("⚠️ Por favor, selecciona primero un cliente.");
        return;
    }

    const txtArea = document.getElementById('txa-nueva-nota');
    const btnGuardar = document.getElementById('btn-guardar-nota');
    if (!txtArea || !btnGuardar) return;

    const nuevaNota = txtArea.value.trim();
    if (nuevaNota === '') {
        alert("⚠️ Por favor, escribe una nota antes de guardar.");
        return;
    }

    // Obtener fecha actual en formato DD/MM/YYYY
    const hoy = new Date();
    const dia = String(hoy.getDate()).padStart(2, '0');
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const anio = hoy.getFullYear();
    const fechaHoy = `${dia}/${mes}/${anio}`;

    const nuevoRegistro = `[${fechaHoy}]: ${nuevaNota}`;
    const viejaNota = clienteSeleccionado.historial_gestion || '';
    const notaConcatenada = viejaNota.trim() !== '' ? `${viejaNota} - ${nuevoRegistro}` : nuevoRegistro;
    
    const idPoliza = clienteSeleccionado.id;

    btnGuardar.disabled = true;
    btnGuardar.innerText = "Enviando... ⏳";

    try {
        const apiRaiz = API_URL.split('?')[0]; 
        const urlCorrecta = `${apiRaiz}/id/${idPoliza}?sheet=Base_Datos`;

        const response = await fetch(urlCorrecta, {
            method: 'PUT',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                data: {
                    historial_gestion: notaConcatenada
                }
            })
        });

        const resultado = await response.json();

        if (response.ok && resultado.updated && resultado.updated > 0) {
            clienteSeleccionado.historial_gestion = notaConcatenada;
            const index = baseDatosCompleta.findIndex(item => item.id === idPoliza);
            if (index !== -1) baseDatosCompleta[index].historial_gestion = notaConcatenada;

            txtArea.value = '';
            desplegarHistorialGestion(clienteSeleccionado);

            txtArea.style.borderColor = "#25D366";
            txtArea.style.boxShadow = "0 0 0 3px rgba(37, 211, 102, 0.2)";
            
            setTimeout(() => {
                txtArea.style.borderColor = "";
                txtArea.style.boxShadow = "";
            }, 1500);

            alert("✅ Nota añadida al historial exitosamente.");
        } else {
            throw new Error("No se afectaron filas en el servidor.");
        }

    } catch (error) {
        console.error("❌ Error guardando la nota en SheetDB:", error);
        alert("🚨 Hubo un problema al conectar con el servidor. Verifica tu conexión e inténtalo de nuevo.");
    } finally {
        btnGuardar.disabled = false;
        btnGuardar.innerText = "Agregar Nota 💾";
    }
}

// 7. GENERAR ID SECUENCIAL
function generarSiguienteID() {
    let maxNum = 0;
    baseDatosCompleta.forEach(c => {
        if (c.id && c.id.startsWith('P-')) {
            const num = parseInt(c.id.replace('P-', ''));
            if (!isNaN(num) && num > maxNum) {
                maxNum = num;
            }
        }
    });
    const siguienteNum = maxNum + 1;
    return `P-${String(siguienteNum).padStart(3, '0')}`;
}

// 8. CONTROLADORES DEL MODAL DE CLIENTES (CRUD)
function abrirModalCliente(esNuevo) {
    const modal = document.getElementById('client-modal');
    if (!modal) return;
    
    const form = document.getElementById('client-form');
    if (form) form.reset();
    
    const actionInput = document.getElementById('form-action');
    const idInput = document.getElementById('form-id');
    const title = document.getElementById('modal-title');
    
    if (esNuevo) {
        if (actionInput) actionInput.value = 'create';
        if (idInput) idInput.value = '';
        if (title) title.innerText = 'Nuevo Cliente / Póliza';
        
        const elCobranza = document.getElementById('form-cobranza');
        if (elCobranza) elCobranza.value = 'P,-,-,-,-,-,-,-,-,-,-,-';
    } else {
        if (!clienteSeleccionado) {
            alert("⚠️ Por favor, selecciona primero un cliente para editar.");
            return;
        }
        if (actionInput) actionInput.value = 'edit';
        if (idInput) idInput.value = clienteSeleccionado.id;
        if (title) title.innerText = `Editar Cliente: ${clienteSeleccionado.contratante} (ID: ${clienteSeleccionado.id})`;
        
        // Llenar campos
        const val = (id) => document.getElementById(id);
        
        if (val('form-contratante')) val('form-contratante').value = clienteSeleccionado.contratante || '';
        if (val('form-empresa')) val('form-empresa').value = clienteSeleccionado.empresa || '';
        if (val('form-poliza')) val('form-poliza').value = clienteSeleccionado.poliza || '';
        if (val('form-ramo')) val('form-ramo').value = clienteSeleccionado.ramo || '';
        if (val('form-plan')) val('form-plan').value = clienteSeleccionado.plan || '';
        if (val('form-estatus')) val('form-estatus').value = clienteSeleccionado.estatus || 'Vigente';
        
        if (val('form-suma-asegurada')) {
            const rawSuma = parseFloat(String(clienteSeleccionado.suma_asegurada).replace(/[^0-9.-]+/g, ""));
            val('form-suma-asegurada').value = isNaN(rawSuma) ? 0 : rawSuma;
        }
        
        if (val('form-moneda')) val('form-moneda').value = clienteSeleccionado.moneda || 'MXN';
        if (val('form-tc')) val('form-tc').value = clienteSeleccionado.tc || '';
        if (val('form-forma-pago')) val('form-forma-pago').value = clienteSeleccionado.forma_pago || 'Anual';
        
        if (val('form-prima-anual')) {
            const rawPrimaAnual = parseFloat(String(clienteSeleccionado.prima_anual).replace(/[^0-9.-]+/g, ""));
            val('form-prima-anual').value = isNaN(rawPrimaAnual) ? 0 : rawPrimaAnual;
        }
        if (val('form-prima-pago')) {
            const rawPrimaPago = parseFloat(String(clienteSeleccionado.prima_pago).replace(/[^0-9.-]+/g, ""));
            val('form-prima-pago').value = isNaN(rawPrimaPago) ? 0 : rawPrimaPago;
        }
        
        if (val('form-cobro-pesos')) val('form-cobro-pesos').value = clienteSeleccionado.cobro_pesos || '';
        if (val('form-dia-cobro')) val('form-dia-cobro').value = clienteSeleccionado.dia_cobro || '';
        if (val('form-emision')) val('form-emision').value = clienteSeleccionado.emision || '';
        if (val('form-vencimiento')) val('form-vencimiento').value = clienteSeleccionado.vencimiento || '';
        if (val('form-nacimiento')) val('form-nacimiento').value = clienteSeleccionado.nacimiento || '';
        if (val('form-auditoria')) val('form-auditoria').value = clienteSeleccionado.auditoria || '';
        
        if (val('form-ppr')) val('form-ppr').value = clienteSeleccionado.ppr || 'NO';
        if (val('form-prox-dotal')) val('form-prox-dotal').value = clienteSeleccionado.prox_dotal || 'N/A';
        if (val('form-deducible')) val('form-deducible').value = clienteSeleccionado.deducible || 'N/A';
        if (val('form-coaseguro')) val('form-coaseguro').value = clienteSeleccionado.coaseguro || 'N/A';
        if (val('form-aves-cp')) val('form-aves-cp').value = clienteSeleccionado.aves_cp || 'N/A';
        if (val('form-aves-lp')) val('form-aves-lp').value = clienteSeleccionado.aves_lp || 'N/A';
        if (val('form-num-cuenta')) val('form-num-cuenta').value = clienteSeleccionado.num_cuenta || '';
        if (val('form-prima-planeada')) val('form-prima-planeada').value = clienteSeleccionado.prima_planeada || 'NO';
        
        if (val('form-telefono')) val('form-telefono').value = clienteSeleccionado.telefono || '';
        if (val('form-email')) val('form-email').value = clienteSeleccionado.email || '';
        if (val('form-rfc')) val('form-rfc').value = clienteSeleccionado.rfc || '';
        if (val('form-regimen')) val('form-regimen').value = clienteSeleccionado.regimen || '';
        if (val('form-cp-postal')) val('form-cp-postal').value = clienteSeleccionado.cp_postal || '';
        if (val('form-direccion')) val('form-direccion').value = clienteSeleccionado.direccion || '';
        
        if (val('form-asegurados')) val('form-asegurados').value = clienteSeleccionado.asegurados || '';
        if (val('form-cobranza')) val('form-cobranza').value = clienteSeleccionado.cobranza || 'P,-,-,-,-,-,-,-,-,-,-,-';
        
        const b = clienteSeleccionado.beneficiarios_raw || {};
        if (val('form-b1-nombre')) val('form-b1-nombre').value = b.b1_nombre || '';
        if (val('form-b1-motivo')) val('form-b1-motivo').value = b.b1_motivo || '';
        if (val('form-b1-pct')) val('form-b1-pct').value = b.b1_pct || '';
        if (val('form-b1-nac')) val('form-b1-nac').value = b.b1_nac || '';
        
        if (val('form-b2-nombre')) val('form-b2-nombre').value = b.b2_nombre || '';
        if (val('form-b2-motivo')) val('form-b2-motivo').value = b.b2_motivo || '';
        if (val('form-b2-pct')) val('form-b2-pct').value = b.b2_pct || '';
        if (val('form-b2-nac')) val('form-b2-nac').value = b.b2_nac || '';
    }
    
    modal.classList.remove('hidden');
}

function cerrarModalCliente() {
    const modal = document.getElementById('client-modal');
    if (modal) modal.classList.add('hidden');
}

// 9. GUARDAR NUEVO O ACTUALIZAR
async function guardarFormularioCliente(event) {
    event.preventDefault();
    
    const action = document.getElementById('form-action').value;
    const id = document.getElementById('form-id').value;
    const btnSubmit = document.getElementById('btn-submit-form');
    
    const payload = {
        id: action === 'create' ? generarSiguienteID() : id,
        empresa: document.getElementById('form-empresa').value.trim(),
        poliza: document.getElementById('form-poliza').value.trim(),
        contratante: document.getElementById('form-contratante').value.trim(),
        asegurados: document.getElementById('form-asegurados').value.trim(),
        nacimiento: document.getElementById('form-nacimiento').value.trim(),
        plan: document.getElementById('form-plan').value.trim(),
        ppr: document.getElementById('form-ppr').value,
        prox_dotal: document.getElementById('form-prox-dotal').value.trim() || 'N/A',
        deducible: document.getElementById('form-deducible').value.trim() || 'N/A',
        coaseguro: document.getElementById('form-coaseguro').value.trim() || 'N/A',
        ramo: document.getElementById('form-ramo').value.trim(),
        suma_asegurada: document.getElementById('form-suma-asegurada').value.trim(),
        moneda: document.getElementById('form-moneda').value,
        emision: document.getElementById('form-emision').value.trim() || '-',
        vencimiento: document.getElementById('form-vencimiento').value.trim() || '-',
        tc: document.getElementById('form-tc').value.trim() || '1.0',
        estatus: document.getElementById('form-estatus').value,
        forma_pago: document.getElementById('form-forma-pago').value,
        prima_anual: document.getElementById('form-prima-anual').value.trim(),
        prima_pago: document.getElementById('form-prima-pago').value.trim(),
        cobro_pesos: document.getElementById('form-cobro-pesos').value.trim(),
        dia_cobro: document.getElementById('form-dia-cobro').value.trim() || '-',
        email: document.getElementById('form-email').value.trim(),
        telefono: document.getElementById('form-telefono').value.trim(),
        cobranza: document.getElementById('form-cobranza').value.trim() || 'P,-,-,-,-,-,-,-,-,-,-,-',
        rfc: document.getElementById('form-rfc').value.trim() || 'N/A',
        regimen: document.getElementById('form-regimen').value.trim() || 'N/A',
        direccion: document.getElementById('form-direccion').value.trim() || 'N/A',
        cp_postal: document.getElementById('form-cp-postal').value.trim() || 'N/A',
        aves_cp: document.getElementById('form-aves-cp').value.trim() || 'N/A',
        aves_lp: document.getElementById('form-aves-lp').value.trim() || 'N/A',
        num_cuenta: document.getElementById('form-num-cuenta').value.trim() || '-',
        prima_planeada: document.getElementById('form-prima-planeada').value,
        b1_nombre: document.getElementById('form-b1-nombre').value.trim() || 'N/A',
        b1_motivo: document.getElementById('form-b1-motivo').value.trim() || 'N/A',
        b1_pct: document.getElementById('form-b1-pct').value.trim() || 'N/A',
        b1_nac: document.getElementById('form-b1-nac').value.trim() || 'N/A',
        b2_nombre: document.getElementById('form-b2-nombre').value.trim() || 'N/A',
        b2_motivo: document.getElementById('form-b2-motivo').value.trim() || 'N/A',
        b2_pct: document.getElementById('form-b2-pct').value.trim() || 'N/A',
        b2_nac: document.getElementById('form-b2-nac').value.trim() || 'N/A',
        auditoria: document.getElementById('form-auditoria').value.trim() || '-'
    };
    
    if (action === 'edit' && clienteSeleccionado) {
        payload.observaciones = clienteSeleccionado.observaciones || '';
        payload.historial_gestion = clienteSeleccionado.historial_gestion || '';
    } else {
        payload.observaciones = '';
        payload.historial_gestion = '';
    }
    
    btnSubmit.disabled = true;
    btnSubmit.innerText = "Guardando... ⏳";
    
    const apiRaiz = API_URL.split('?')[0];
    let url = `${apiRaiz}?sheet=Base_Datos`;
    let method = 'POST';
    let bodyData = { data: [payload] };
    
    if (action === 'edit') {
        url = `${apiRaiz}/id/${payload.id}?sheet=Base_Datos`;
        method = 'PUT';
        bodyData = { data: payload };
    }
    
    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(bodyData)
        });
        
        const result = await response.json();
        
        if (response.ok && (result.created || result.updated)) {
            alert(action === 'create' ? "✅ Cliente creado exitosamente." : "✅ Póliza actualizada exitosamente.");
            cerrarModalCliente();
            
            const mappedItem = {
                id: payload.id,
                empresa: payload.empresa,
                poliza: payload.poliza,
                contratante: payload.contratante,
                asegurados: payload.asegurados,
                nacimiento: payload.nacimiento,
                plan: payload.plan,
                ppr: payload.ppr,
                prox_dotal: payload.prox_dotal,
                deducible: payload.deducible,
                coaseguro: payload.coaseguro,
                ramo: payload.ramo,
                suma_asegurada: parseFloat(payload.suma_asegurada || 0).toLocaleString('es-MX', {minimumFractionDigits: 2}),
                moneda: payload.moneda,
                emision: payload.emision,
                vencimiento: payload.vencimiento,
                auditoria: payload.auditoria,
                observaciones: payload.observaciones,
                historial_gestion: payload.historial_gestion,
                tc: payload.tc,
                estatus: payload.estatus,
                forma_pago: payload.forma_pago,
                prima_anual: payload.prima_anual,
                prima_pago: payload.prima_pago,
                cobro_pesos: payload.cobro_pesos,
                dia_cobro: payload.dia_cobro,
                email: payload.email,
                telefono: payload.telefono,
                cobranza: payload.cobranza,
                rfc: payload.rfc,
                regimen: payload.regimen,
                direccion: payload.direccion,
                cp_postal: payload.cp_postal,
                aves_cp: payload.aves_cp,
                aves_lp: payload.aves_lp,
                num_cuenta: payload.num_cuenta,
                prima_planeada: payload.prima_planeada,
                beneficiarios: [
                    { nombre: payload.b1_nombre, motivo: payload.b1_motivo, pct: payload.b1_pct, nac: payload.b1_nac },
                    { nombre: payload.b2_nombre, motivo: payload.b2_motivo, pct: payload.b2_pct, nac: payload.b2_nac }
                ].filter(b => b.nombre && b.nombre !== "N/A" && b.nombre !== ""),
                beneficiarios_raw: {
                    b1_nombre: payload.b1_nombre,
                    b1_motivo: payload.b1_motivo,
                    b1_pct: payload.b1_pct,
                    b1_nac: payload.b1_nac,
                    b2_nombre: payload.b2_nombre,
                    b2_motivo: payload.b2_motivo,
                    b2_pct: payload.b2_pct,
                    b2_nac: payload.b2_nac
                }
            };
            
            if (action === 'create') {
                baseDatosCompleta.push(mappedItem);
            } else {
                const idx = baseDatosCompleta.findIndex(item => item.id === payload.id);
                if (idx !== -1) {
                    baseDatosCompleta[idx] = mappedItem;
                }
            }
            
            actualizarContadoresAlertas();
            llenarSelectorEmpresas();
            
            const currentEmpresa = document.getElementById('filtro-empresa').value;
            const listToUse = currentEmpresa === 'ALL' ? baseDatosCompleta : baseDatosCompleta.filter(i => i.empresa === currentEmpresa);
            llenarSelectorClientes(listToUse);
            
            const selectCliente = document.getElementById('filtro-cliente');
            if (selectCliente) {
                selectCliente.value = payload.contratante;
                cargarDatosCliente();
            }
            
            calcularMetricasGlobales();
        } else {
            throw new Error("No se pudo confirmar la acción en el servidor.");
        }
    } catch (error) {
        console.error("Error al guardar el formulario:", error);
        alert("🚨 Error de conexión o proceso. Detalles: " + error.message);
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerText = action === 'create' ? "Guardar Cliente 💾" : "Actualizar Póliza 💾";
    }
}

document.addEventListener('DOMContentLoaded', cargarBaseDeDatos);

