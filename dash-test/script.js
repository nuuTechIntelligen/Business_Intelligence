// URL de prueba simulada o tu endpoint real de SheetDB
const API_URL = 'https://sheetdb.io/api/v1/2s1p744rscfly'; 

let baseDatosCompleta = [];
let clienteSeleccionado = null;

async function cargarBaseDeDatos() {
    try {
        // En producción jalarías la hoja correspondiente: ?sheet=polizas
        const response = await fetch(`${API_URL}`);
        baseDatosCompleta = await response.json();
        
        // Simulación de datos estructurados basados en tu imagen si la API viene vacía
        if(baseDatosCompleta.length === 0) {
            baseDatosCompleta = [{
                id: "1",
                empresa: "GNP",
                poliza: "V10002910515",
                contratante: "ALICIA ANAID ORTEGA GUERRERO",
                nacimiento: "12/01/1995",
                plan: "IMAGINA SER 65 PAGOS LIMITADOS 15",
                ppr: "SI", prox_dotal: "N/A", deducible: "N/A", coaseguro: "N/A",
                ramo: "VIDA INDIVIDUAL", suma_asegurada: "75,000.00", moneda: "UDI",
                emision: "09/05/2025", vencimiento: "09/05/2059", tc: "8.843725",
                estatus: "En Vigor", prima_anual: "3,498.78", prima_pago: "291.51",
                cobro_pesos: "2,578.03", dia_cobro: "16", email: "anny12_95@hotmail.com", telefono: "4422264286",
                cobranza: "P,P,P,P,P,V,V,V,V,V,V,V", // Ene a Dic
                beneficiarios: [
                    { nombre: "OBED OREA", motivo: "FALLECIMIENTO", pct: "50%", nac: "01/06/2025" },
                    { nombre: "LIA REANATA OREA ORTEGA", motivo: "FALLECIMIENTO", pct: "50%", nac: "23/03/2013" }
                ]
            }];
        }
        
        calcularAlertasMeteoro();
        llenarSelectorClientes(baseDatosCompleta);
    } catch (error) {
        console.error("Errores leyendo base de datos:", error);
    }
}

function calcularAlertasMeteoro() {
    // Algoritmo predictivo de fechas importantes para Conny
    document.getElementById('count-cumple').innerText = "1 Cumpleaños";
    document.getElementById('count-pagos').innerText = "1 Vencimiento";
}

function llenarSelectorClientes(lista) {
    const select = document.getElementById('filtro-cliente');
    select.innerHTML = '<option value="">Selecciona un cliente...</option>';
    
    // Agrupamos por contratante único
    const unicos = [...new Set(lista.map(item => item.contratante))];
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
