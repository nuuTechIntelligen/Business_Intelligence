// URL de integración oficial vinculada a la pestaña de datos del Excel en SheetDB
const API_URL = 'https://sheetdb.io/api/v1/v3rg9i21440di?sheet=Base_Datos'; 

// Repositorios de datos globales de la aplicación en memoria
let baseDatosCompleta = []; // Almacena el JSON crudo devuelto por la API
let clienteSeleccionado = null; // Guarda el objeto del plan activo en pantalla
let udiValorActualGlobal = 8.85; // Valor pivote por si el cliente no tiene red

/**
 * MOTOR DE INDICADORES: Consulta el valor oficial de la UDI en tiempo real
 */
async function consultarUDIRealTime() {
    try {
        // Petición asíncrona a un gateway financiero abierto
        const res = await fetch('https://api.thingsin.cloud/v1/mx-financial-indicators/udi'); 
        if(res.ok) {
            const data = await res.json();
            if(data.value) {
                // Si la API responde con éxito, actualizamos la variable global
                udiValorActualGlobal = parseFloat(data.value);
            }
        }
    } catch (e) {
        // En caso de caída de servidor o bloqueo, se inyecta el histórico de desarrollo
        udiValorActualGlobal = 8.8437; 
    }
    // Inyectamos el valor recuperado en el badge de la barra superior
    const badge = document.getElementById('udi-val-live');
    if(badge) badge.innerText = udiValorActualGlobal.toFixed(4);
}

/**
 * CONEXIÓN CORE: Descarga la información del Excel y la procesa en un array tipado
 */
async function cargarBaseDeDatos() {
    // Primero garantizamos tener el valor de la UDI del día antes de pintar costos
    await consultarUDIRealTime(); 
    
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        
        // Mapeamos el arreglo plano de strings de Excel a un JSON de tipos correctos
        baseDatosCompleta = data.map(row => {
            return {
                id: row.id,
                empresa: row.empresa,
                poliza: row.poliza,
                contratante: row.contratante,
                asegurados: row.asegurados, // Almacena la cadena horizontal de nombres
                nacimiento: row.nacimiento,
                plan: row.plan,
                ppr: row.ppr,
                prox_dotal: row.prox_dotal,
                deducible: row.deducible,
                coaseguro: row.coaseguro,
                ramo: row.ramo,
                // Formateamos los números grandes a nomenclatura contable de forma nativa
                suma_asegurada: parseFloat(row.suma_asegurada || 0).toLocaleString('es-MX', {minimumFractionDigits: 2}),
                moneda: row.moneda,
                emision: row.emision,
                vencimiento: row.vencimiento,
                tc: row.tc,
                estatus: row.estatus,
                forma_pago: row.forma_pago || 'Anual', // Validamos nulos asignando forma default
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
                // Procesamiento de sub-arreglos horizontales para beneficiarios
                beneficiarios: [
                    { nombre: row.b1_nombre, motivo: row.b1_motivo, pct: row.b1_pct, nac: row.b1_nac },
                    { nombre: row.b2_nombre, motivo: row.b2_motivo, pct: row.b2_pct, nac: row.b2_nac }
                ].filter(b => b.nombre && b.nombre !== "N/A" && b.nombre !== "") // Limpieza de celdas vacías
            };
        });

        // Disparamos los constructores dinámicos de interfaz
        actualizarContadoresAlertas();
        llenarSelectorEmpresas();
        llenarSelectorClientes(baseDatosCompleta);
    } catch (error) {
        console.error("❌ Error sincronizando datos desde SheetDB / Excel:", error);
    }
}

/**
 * SISTEMA DE INTELIGENCIA DE NEGOCIO: Analiza fechas e impagos en segundo plano
 */
function actualizarContadoresAlertas() {
    const hoy = new Date();
    const diaHoy = String(hoy.getDate()).padStart(2, '0');
    const mesHoy = String(hoy.getMonth() + 1).padStart(2, '0');
    const fechaCortadaHoy = `${diaHoy}/${mesHoy}`; // Formato de comparación "DD/MM"

    if (!baseDatosCompleta || baseDatosCompleta.length === 0) return;

    // Filtro 1: Cuenta cuántos clientes cumplen años hoy ignorando el año de nacimiento
    const cumpleaniosHoy = baseDatosCompleta.filter(c => c.nacimiento && c.nacimiento.startsWith(fechaCortadaHoy));
    document.getElementById('count-cumple').innerText = `${cumpleaniosHoy.length} Cumpleaños`;

    // Filtro 2: Escanea pólizas en estatus crítico o con letras "V" (Vencido) en su historial de cobro
    const pagosVencidos = baseDatosCompleta.filter(c => {
        return (c.estatus && String(c.estatus).toLowerCase() === "vencido") || (c.cobranza && c.cobranza.includes("V"));
    });
    document.getElementById('count-pagos').innerText = `${pagosVencidos.length} Vencimientos`;
}

/**
 * COMPONENTES DE UI: Inicializadores de los filtros maestros superiores
 */
function llenarSelectorEmpresas() {
    const selectEmpresa = document.getElementById('filtro-empresa');
    if (!selectEmpresa) return;
    // Creamos una colección única (Set) de las aseguradoras presentes en el Excel
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
    // Obtenemos los nombres únicos de contratantes para no duplicar en el dropdown
    const unicos = [...new Set(lista.map(item => item.contratante).filter(n => n))];
    unicos.forEach(nombre => {
        select.innerHTML += `<option value="${nombre}">${nombre}</option>`;
    });
}

/**
 * CONTROL DE FLUJO EN CASCADA: Filtra los clientes según la empresa elegida
 */
function filtrarClientesPorEmpresa() {
    const empresa = document.getElementById('filtro-empresa').value;
    // Si elige "Todas" mandamos el array completo; si no, aplicamos filtro estricto
    const filtrados = empresa === "ALL" ? baseDatosCompleta : baseDatosCompleta.filter(item => item.empresa === empresa);
    llenarSelectorClientes(filtrados);
}

/**
 * SISTEMA MULTI-PLAN: Detecta si el cliente tiene más de una póliza y arma el dropdown interno
 */
function cargarDatosCliente() {
    const nombre = document.getElementById('filtro-cliente').value;
    if(!nombre) return;
    
    // Recuperamos todas las filas donde el contratante sea el seleccionado
    const planesCliente = baseDatosCompleta.filter(item => item.contratante === nombre);
    const planSelect = document.getElementById('plan-select');
    if(!planSelect) return;
    planSelect.innerHTML = '';
    
    // Llenamos el menú interno de la tarjeta con los nombres de los planes del cliente
    planesCliente.forEach(c => {
        planSelect.innerHTML += `<option value="${c.id}">${c.plan}</option>`;
    });
    // Por defecto activamos y desplegamos el primer plan encontrado
    clienteSeleccionado = planesCliente[0];
    desplegarInformacionPantalla();
}

// Cambia la tarjeta cuando el usuario conmuta el dropdown de planes dentro de la tarjeta
function actualizarPlanEspecifico() {
    const idPlan = document.getElementById('plan-select').value;
    clienteSeleccionado = baseDatosCompleta.find(item => item.id === idPlan);
    desplegarInformacionPantalla();
}

/**
 * PINTOR DE INTERFAZ: Renderiza toda la información dentro de las celdas de la tarjeta
 */
function desplegarInformacionPantalla() {
    if(!clienteSeleccionado) return;
    const c = clienteSeleccionado;
    
    // Inyección de textos planos en celdas de datos generales
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
    
    // OPERADOR FINANCIERO: Si es UDI, sobreescribimos el T.C. fijo usando el valor de la API en vivo
    document.getElementById('txt-tc').innerText = c.moneda === 'UDI' ? udiValorActualGlobal.toFixed(4) : c.tc;
    
    document.getElementById('txt-estatus').innerText = c.estatus;
    document.getElementById('txt-forma-pago').innerText = c.forma_pago;
    document.getElementById('txt-prima-anual').innerText = `$${c.prima_anual}`;
    document.getElementById('txt-prima-pago').innerText = `$${c.prima_pago}`;
    document.getElementById('txt-cobro-pesos').innerText = `$${c.cobro_pesos}`;
    document.getElementById('txt-dia-cobro').innerText = c.dia_cobro;
    
    document.getElementById('txt-aves-cp').innerText = c.aves_cp;
    document.getElementById('txt-aves-lp').innerText = c.aves_lp;
    document.getElementById('txt-num-cuenta').innerText = c.num_cuenta;
    document.getElementById('txt-prima-planeada').innerText = c.prima_planeada;

    // INTERACTIVIDAD DE CONTACTO: Armamos los hipervínculos nativos de llamada y correo
    const linkTel = document.getElementById('link-tel');
    if(linkTel) {
        linkTel.href = `tel:${c.telefono}`;
        linkTel.querySelector('strong').innerText = c.telefono;
    }

    const linkEmail = document.getElementById('link-email');
    if(linkEmail) {
        linkEmail.href = `mailto:${c.email}?subject=Informacion de tu Poliza ${c.poliza}`;
        linkEmail.querySelector('strong').innerText = c.email;
    }

    // Inyección del bloque fiscal de facturación
    document.getElementById('txt-rfc').innerText = c.rfc;
    document.getElementById('txt-regimen').innerText = c.regimen;
    document.getElementById('txt-cp-postal').innerText = c.cp_postal;
    document.getElementById('txt-direccion').innerText = c.direccion;

    // PROCESADOR DE LISTAS: Rompe la cadena de asegurados por sus comas y genera filas <div> individuales
    const wrapperAsegurados = document.getElementById('wrapper-asegurados');
    if(wrapperAsegurados) {
        wrapperAsegurados.innerHTML = '';
        const listaAsegurados = c.asegurados ? c.asegurados.split(',') : [c.contratante];
        listaAsegurados.forEach(asegurado => {
            wrapperAsegurados.innerHTML += `<div class="sub-cell font-bold" style="border:none; padding:4px 12px;">👤 ${asegurado.trim()}</div>`;
        });
    }

    // GENERADOR DE TIMELINE: Dibuja las 12 burbujas y les asigna color verde (P) o gris (-) según el Excel
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const trackCobranza = c.cobranza ? c.cobranza.split(',') : [];
    const timeline = document.getElementById('timeline-cobranza');
    if(timeline) {
        timeline.innerHTML = '';
        meses.forEach((mes, i) => {
            const val = trackCobranza[i] ? trackCobranza[i].trim() : '-';
            timeline.innerHTML += `<div class="month-bubble ${val === 'P' ? 'pagado' : 'pendiente'}"><span>${mes}</span><strong>${val}</strong></div>`;
        });
    }

    // TABLA DE BENEFICIARIOS: Limpia e inyecta dinámicamente las filas de herederos legales
    const gridBen = document.getElementById('grid-beneficiarios');
    if(gridBen) {
        gridBen.innerHTML = `<div class="cell bg-grey font-bold">Beneficiario</div><div class="cell bg-grey font-bold">Motivo</div><div class="cell bg-grey font-bold">Porcentaje</div><div class="cell bg-grey font-bold">Fecha Nacimiento</div>`;
        if(c.beneficiarios) {
            c.beneficiarios.forEach(b => {
                gridBen.innerHTML += `<div class="cell">${b.nombre}</div><div class="cell">${b.motivo}</div><div class="cell text-center font-bold">${b.pct}</div><div class="cell text-center">${b.nac}</div>`;
            });
        }
    }
}

/**
 * CRM WHATSAPP ENGINE: Cruza la información de la tarjeta para estructurar las plantillas dinámicas
 */
function enviarMensajeWA(tipo) {
    if(!clienteSeleccionado) return;
    const c = clienteSeleccionado;
    let mensaje = "";
    
    if(tipo === 'cumple') {
        // Plantilla 1: Felicitación de cumpleaños formal corporativa
        mensaje = `¡Hola *${c.contratante}*! 🎉 Te mandamos un fuerte saludo de parte de *Conny* y el equipo. Queremos desearte un muy feliz cumpleaños hoy en tu día, ¡que te la pases excelente! 🎂🎈`;
    } else if(tipo === 'pago') {
        // Plantilla 2: Cobranza persuasiva inyectando la frecuencia de pago (MENSUAL, ANUAL, etc.) capturada en Excel
        mensaje = `Estimado(a) *${c.contratante}*, te saludamos para recordarte que la fecha límite de tu pago *${c.forma_pago.toUpperCase()}* para tu póliza de *${c.ramo}* (No. *${c.poliza}*) es el próximo *${c.dia_cobro}* de este mes. El monto correspondiente al periodo es de *$${c.cobro_pesos} MXN*. Quedamos a tus órdenes para procesar el movimiento. 💳✨`;
    }
    // Dispara una nueva pestaña del navegador apuntando al API universal de WhatsApp
    window.open(`https://wa.me/52${c.telefono}?text=${encodeURIComponent(mensaje)}`, '_blank');
}

// Event listener que arranca la aplicación de manera segura una vez que el árbol HTML está construido
document.addEventListener('DOMContentLoaded', cargarBaseDeDatos);
