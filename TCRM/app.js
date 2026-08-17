/**
 * CRM Talentum - Lógica de Control Operativo y Financiero
 */

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycby3mVfFIE3fNUN_G_ox6vvnGnCosxfvcu-ievTYTqlQypvrfjSZC6i7BlwjogDdUHIl/exec";

// Base de datos reactiva en memoria / Demo inicial
let DB = {
  clientes: [
    { id_cliente: "CLI-001", nombre_comercial: "TechSolutions MX", region: "Querétaro" },
    { id_cliente: "CLI-002", nombre_comercial: "Logística Bajío", region: "Bajío" }
  ],
  vacantes: [
    {
      id_vacante: "VAC-101",
      id_cliente: "CLI-001",
      titulo_puesto: "Líder de Desarrollo Fullstack",
      region: "Querétaro",
      fee_pactado_total: 28000,
      monto_adelanto: 14000,
      fecha_inicio_proceso: "2026-08-05",
      estatus_vacante: "En Proceso",
      fecha_contratacion: "",
      dias_garantia_pactados: 60,
      garantia_aplicada: "No"
    },
    {
      id_vacante: "VAC-102",
      id_cliente: "CLI-002",
      titulo_puesto: "Coordinador de Almacén",
      region: "Bajío",
      fee_pactado_total: 16000,
      monto_adelanto: 8000,
      fecha_inicio_proceso: "2026-07-10",
      estatus_vacante: "Contratado",
      fecha_contratacion: "2026-08-01",
      dias_garantia_pactados: 30,
      garantia_aplicada: "No"
    }
  ],
  gastos: [
    { id_vacante: "VAC-101", monto: 1250, categoria: "Facebook Ads" },
    { id_vacante: "VAC-101", monto: 450, categoria: "Psicometría" },
    { id_vacante: "VAC-102", monto: 600, categoria: "Facebook Ads" }
  ],
  horas: [
    { id_vacante: "VAC-101", horas_invertidas: 12, costo_por_hora: 150 },
    { id_vacante: "VAC-102", horas_invertidas: 8, costo_por_hora: 150 }
  ]
};

let filtroEstadoActual = "En Proceso";

// Inicialización de la aplicación
document.addEventListener("DOMContentLoaded", () => {
  setupEventListeners();
  poblarSelectVacantes();
  renderizarApp();
});

function setupEventListeners() {
  document.getElementById("btnReload").addEventListener("click", cargarDatosDesdeAPI);
  document.getElementById("inputSearch").addEventListener("input", renderizarApp);
  document.getElementById("btnFab").addEventListener("click", abrirModalGasto);
  document.getElementById("btnCloseModal").addEventListener("click", cerrarModalGasto);
  document.getElementById("modalBackdrop").addEventListener("click", cerrarModalGasto);
  document.getElementById("formGasto").addEventListener("submit", guardarGasto);

  // Delegación de eventos para chips de filtro
  document.getElementById("filterChipsContainer").addEventListener("click", (e) => {
    const btn = e.target.closest(".chip-filter");
    if (!btn) return;
    
    filtroEstadoActual = btn.getAttribute("data-filter");
    document.querySelectorAll(".chip-filter").forEach(b => {
      b.classList.remove("chip-active", "bg-indigo-600", "text-white", "shadow-sm");
      b.classList.add("chip-inactive");
    });
    btn.classList.remove("chip-inactive");
    btn.classList.add("chip-active");

    renderizarApp();
  });
}

function renderizarApp() {
  const container = document.getElementById("vacantesContainer");
  const searchVal = document.getElementById("inputSearch").value.toLowerCase().trim();
  container.innerHTML = "";

  let totalFees = 0;
  let totalGastos = 0;

  const vacantesFiltradas = DB.vacantes.filter(v => {
    const cliente = DB.clientes.find(c => c.id_cliente === v.id_cliente);
    const matchSearch = v.titulo_puesto.toLowerCase().includes(searchVal) || 
                        (cliente && cliente.nombre_comercial.toLowerCase().includes(searchVal)) ||
                        v.region.toLowerCase().includes(searchVal);

    if (!matchSearch) return false;

    if (filtroEstadoActual === "Todas") return true;
    if (filtroEstadoActual === "En Proceso") return v.estatus_vacante === "En Proceso";
    if (filtroEstadoActual === "Contratado") return v.estatus_vacante === "Contratado";
    if (filtroEstadoActual === "Garantia") return v.estatus_vacante === "Contratado" && calcularDiasGarantia(v).diasRestantes > 0;
    return true;
  });

  vacantesFiltradas.forEach(v => {
    const cliente = DB.clientes.find(c => c.id_cliente === v.id_cliente) || { nombre_comercial: "Cliente General" };
    
    // Cálculo financiero por vacante
    const gastosVacante = DB.gastos.filter(g => g.id_vacante === v.id_vacante).reduce((sum, g) => sum + Number(g.monto), 0);
    const costoHoras = DB.horas.filter(h => h.id_vacante === v.id_vacante).reduce((sum, h) => sum + (Number(h.horas_invertidas) * Number(h.costo_por_hora)), 0);
    
    const costoTotal = gastosVacante + costoHoras;
    const margenNeto = Number(v.fee_pactado_total) - costoTotal;
    const margenPorcentaje = v.fee_pactado_total > 0 ? Math.round((margenNeto / v.fee_pactado_total) * 100) : 0;

    if (v.estatus_vacante === "En Proceso") totalFees += Number(v.fee_pactado_total);
    totalGastos += gastosVacante;

    const infoGarantia = calcularDiasGarantia(v);

    // Componente Tarjeta
    const card = document.createElement("div");
    card.className = "bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm relative overflow-hidden";
    
    card.innerHTML = `
      <div class="flex items-start justify-between gap-2">
        <div>
          <span class="text-[11px] font-bold tracking-wide uppercase text-indigo-600">${cliente.nombre_comercial}</span>
          <h3 class="text-sm font-bold text-slate-900 leading-tight mt-0.5">${v.titulo_puesto}</h3>
        </div>
        <span class="text-[11px] px-2 py-0.5 rounded-md font-semibold ${v.estatus_vacante === 'En Proceso' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}">
          ${v.estatus_vacante}
        </span>
      </div>

      <div class="flex items-center gap-3 mt-2 text-xs text-slate-500">
        <span><i class="ph ph-map-pin"></i> ${v.region}</span>
        <span><i class="ph ph-calendar"></i> Inicio: ${v.fecha_inicio_proceso}</span>
      </div>

      ${v.estatus_vacante === 'Contratado' ? `
        <div class="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
          <div class="flex items-center gap-1.5">
            <i class="ph-shield-check text-base ${infoGarantia.color}"></i>
            <span class="font-medium text-slate-700">Garantía (${v.dias_garantia_pactados}d):</span>
          </div>
          <span class="font-bold ${infoGarantia.color}">${infoGarantia.texto}</span>
        </div>
      ` : ''}

      <!-- Desglose Financiero -->
      <div class="mt-3 pt-3 border-t border-slate-100 grid grid-cols-3 gap-1 text-center">
        <div>
          <span class="text-[10px] text-slate-400 font-semibold block">FEE TOTAL</span>
          <span class="text-xs font-bold text-slate-800">$${Number(v.fee_pactado_total).toLocaleString()}</span>
        </div>
        <div>
          <span class="text-[10px] text-slate-400 font-semibold block">INVERTIDO</span>
          <span class="text-xs font-bold text-rose-500">$${costoTotal.toLocaleString()}</span>
        </div>
        <div>
          <span class="text-[10px] text-slate-400 font-semibold block">MARGEN</span>
          <span class="text-xs font-black ${margenPorcentaje >= 40 ? 'text-emerald-600' : 'text-amber-500'}">${margenPorcentaje}%</span>
        </div>
      </div>

      <!-- Acciones Rápidas -->
      <div class="mt-3.5 flex gap-2">
        <button data-action="gasto" data-id="${v.id_vacante}" class="btn-card-gasto flex-1 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 active:scale-95 transition-all flex items-center justify-center gap-1">
          <i class="ph ph-receipt"></i> + Gasto
        </button>
        ${v.estatus_vacante === 'Contratado' && infoGarantia.diasRestantes > 0 && v.garantia_aplicada === 'No' ? `
          <button data-action="garantia" data-id="${v.id_vacante}" class="btn-card-garantia flex-1 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl text-xs font-bold active:scale-95 transition-all flex items-center justify-center gap-1 border border-amber-200">
            <i class="ph ph-arrow-counter-clockwise"></i> Garantía
          </button>
        ` : ''}
      </div>
    `;

    // Asignar listeners a los botones de la tarjeta
    card.querySelector(".btn-card-gasto").addEventListener("click", () => abrirModalGastoPara(v.id_vacante));
    const btnGarantia = card.querySelector(".btn-card-garantia");
    if (btnGarantia) {
      btnGarantia.addEventListener("click", () => aplicarGarantia(v.id_vacante));
    }

    container.appendChild(card);
  });

  document.getElementById("totalFeesActivos").textContent = `$${totalFees.toLocaleString()}`;
  document.getElementById("totalInversion").textContent = `$${totalGastos.toLocaleString()}`;
}

function calcularDiasGarantia(vacante) {
  if (!vacante.fecha_contratacion) return { diasRestantes: 0, texto: "Sin fecha", color: "text-slate-400" };
  
  const contratacion = new Date(vacante.fecha_contratacion);
  const finGarantia = new Date(contratacion);
  finGarantia.setDate(contratacion.getDate() + Number(vacante.dias_garantia_pactados));
  
  const hoy = new Date();
  const diffTime = finGarantia - hoy;
  const diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (vacante.garantia_aplicada !== "No") {
    return { diasRestantes: 0, texto: "Garantía Consumida", color: "text-purple-600" };
  }
  if (diasRestantes <= 0) {
    return { diasRestantes: 0, texto: "Vencida", color: "text-rose-500" };
  }
  if (diasRestantes <= 15) {
    return { diasRestantes, texto: `${diasRestantes} días (Por vencer)`, color: "text-amber-500" };
  }
  return { diasRestantes, texto: `${diasRestantes} días restantes`, color: "text-emerald-600" };
}

function poblarSelectVacantes() {
  const select = document.getElementById("modalVacanteSelect");
  select.innerHTML = DB.vacantes.map(v => `<option value="${v.id_vacante}">${v.titulo_puesto}</option>`).join("");
}

// CONTROL DEL BOTTOM SHEET
function abrirModalGasto() {
  const backdrop = document.getElementById("modalBackdrop");
  const sheet = document.getElementById("modalSheet");
  backdrop.classList.remove("hidden");
  setTimeout(() => {
    backdrop.classList.remove("opacity-0");
    sheet.classList.remove("translate-y-full");
  }, 10);
}

function abrirModalGastoPara(idVacante) {
  document.getElementById("modalVacanteSelect").value = idVacante;
  abrirModalGasto();
}

function cerrarModalGasto() {
  const backdrop = document.getElementById("modalBackdrop");
  const sheet = document.getElementById("modalSheet");
  backdrop.classList.add("opacity-0");
  sheet.classList.add("translate-y-full");
  setTimeout(() => {
    backdrop.classList.add("hidden");
  }, 300);
}

async function guardarGasto(e) {
  e.preventDefault();
  const idVacante = document.getElementById("modalVacanteSelect").value;
  const categoria = document.getElementById("modalCategoria").value;
  const monto = parseFloat(document.getElementById("modalMonto").value);

  // Registro en estado local para reflejo inmediato en UI
  DB.gastos.push({ id_vacante: idVacante, categoria, monto });
  
  cerrarModalGasto();
  document.getElementById("modalMonto").value = "";
  renderizarApp();

  // Sincronización asíncrona con Apps Script
  if (APPS_SCRIPT_URL !== "TU_APPS_SCRIPT_URL_AQUI") {
    try {
      await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({
          action: "create",
          targetSheet: "GASTOS_INVERSION",
          payload: [`GST-${Date.now()}`, idVacante, categoria, monto, new Date().toISOString()]
        })
      });
    } catch (err) {
      console.error("Error guardando en Google Sheets:", err);
    }
  }
}

function aplicarGarantia(idVacante) {
  if (confirm("¿Confirmas aplicar la garantía de reposición para esta vacante?")) {
    const v = DB.vacantes.find(item => item.id_vacante === idVacante);
    if (v) {
      v.garantia_aplicada = "Sí (En reposición)";
      renderizarApp();
    }
  }
}

async function cargarDatosDesdeAPI() {
  if (APPS_SCRIPT_URL === "TU_APPS_SCRIPT_URL_AQUI") return;
  try {
    const res = await fetch(`${APPS_SCRIPT_URL}?action=getDashboardData`);
    const data = await res.json();
    DB = data;
    poblarSelectVacantes();
    renderizarApp();
  } catch (err) {
    console.error("Error al obtener datos:", err);
  }
}
