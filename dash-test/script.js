/* =========================================================================
   PROYECTO: AGENDA DE SEGUROS (CONNY CRM)
   PARTE 1: CONFIGURACIÓN, DIVISAS EN TIEMPO REAL Y MOTOR DE FILTROS (V2.5)
   ========================================================================= */

const API_URL = 'https://sheetdb.io/api/v1/v3rg9i21440di?sheet=Base_Datos'; 

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
async function cargarBaseDeDatos() {
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

// 2. DESPLIEGUE COMPLETO DE LA TARJETA DEL CLIENTE EN PANTALLA
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

    const txtAreaObs = document.getElementById('txa-observaciones');
    if (txtAreaObs) {
        txtAreaObs.value = c.observaciones || ''; 
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

// 8. ACTUALIZAR OBSERVACIONES EN GOOGLE SHEETS EN TIEMPO REAL
async function guardarObservacionEnSheets() {
    if (!clienteSeleccionado) {
        alert("⚠️ Por favor, selecciona primero un cliente.");
        return;
    }

    const txtArea = document.getElementById('txa-observaciones');
    const btnGuardar = document.getElementById('btn-guardar-nota');
    if (!txtArea || !btnGuardar) return;

    const nuevaNota = txtArea.value.trim();
    const idPoliza = clienteSeleccionado.id;

    // UX 3: Bloqueo de doble clic dinámico evitando cargas dobles accidentales ("Enviando... ⏳")
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
                    observaciones: nuevaNota
                }
            })
        });

        const resultado = await response.json();

        if (response.ok && resultado.updated && resultado.updated > 0) {
            clienteSeleccionado.observaciones = nuevaNota;
            const index = baseDatosCompleta.findIndex(item => item.id === idPoliza);
            if (index !== -1) baseDatosCompleta[index].observaciones = nuevaNota;

            txtArea.style.borderColor = "#25D366";
            txtArea.style.boxShadow = "0 0 0 3px rgba(37, 211, 102, 0.2)";
            
            setTimeout(() => {
                txtArea.style.borderColor = "";
                txtArea.style.boxShadow = "";
            }, 1500);

            alert("✅ Nota guardada exitosamente en Google Sheets.");
        } else {
            throw new Error("No se afectaron filas en el servidor.");
        }

    } catch (error) {
        console.error("❌ Error guardando la nota en SheetDB:", error);
        alert("🚨 Hubo un problema al conectar con el servidor. Verifica tu conexión e inténtalo de nuevo.");
    } finally {
        // Al terminar el ciclo, liberamos el botón a su estado normal de guardado
        btnGuardar.disabled = false;
        btnGuardar.innerText = "Guardar Nota 💾";
    }
}

// DISPARADOR GLOBAL DE INICIALIZACIÓN
document.addEventListener('DOMContentLoaded', cargarBaseDeDatos);
