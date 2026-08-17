/**
 * CRM Talentum - Lógica de Control Operativo y Financiero
 */

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycby3mVfFIE3fNUN_G_ox6vvnGnCosxfvcu-ievTYTqlQypvrfjSZC6i7BlwjogDdUHIl/exec";

let DB = {
  clientes: [
    { id_cliente: "CLI-001", nombre_comercial: "TechSolutions MX", region: "Querétaro" },
    { id_cliente: "CLI-002", nombre_comercial: "Logística Bajío", region: "Bajío" }
  ],
  servicios: [
    { id_servicio: "SRV-001", nombre_servicio: "Operativo", dias_garantia_defecto: 30 },
    { id_servicio: "SRV-002", nombre_servicio: "Mandos Medios", dias_garantia_defecto: 60 },
    { id_servicio: "SRV-003", nombre_servicio: "Headhunting", dias_garantia_defecto: 90 }
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
let activeModalSheet = null;

document.addEventListener("DOMContentLoaded", () => {
  setupEventListeners();
  poblarSelects();
  renderizarApp();
});

function setupEventListeners() {
  document.getElementById("btnReload").addEventListener("click", cargarDatosDesdeAPI);
  document.getElementById("inputSearch").addEventListener("input", renderizarApp);
  
  // FAB Toggle
  document.getElementById("btnFab").addEventListener("click", toggleFabMenu);
  document.getElementById("btnOpenModalVacante").addEventListener("click", () => { toggleFabMenu(); openModal("modalSheetVacante"); });
  document.getElementById("btnOpenModalHora").addEventListener("click", () => { toggleFabMenu(); openModal("modalSheetHora"); });

  // Cerrar modales
  document.getElementById("modalBackdrop").addEventListener("click", closeModal);
  document.querySelectorAll(".btn-close-modal").forEach(b => b.addEventListener("click", closeModal));

  // Toggle sección nuevo cliente
  document.getElementById("btnToggleNuevoCliente").addEventListener("click", () => {
    document.getElementById("boxNuevoCliente").classList.toggle("hidden");
  });

  // Envío de formularios
  document.getElementById("formGasto").addEventListener("submit", guardarGasto);
  document.getElementById("formHora").addEventListener("submit", guardarHora);
  document.getElementById("formVacante").addEventListener("submit", guardarVacante);

  // Filtros rápidos
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

function toggleFabMenu() {
  const menu = document.getElementById("fabMenu");
  const icon = document.getElementById("fabIcon");
  const isHidden = menu.classList.contains("hidden");
  
  if (isHidden) {
    menu.classList.remove("hidden");
    menu.classList.add("flex");
    icon.className = "ph ph-x-bold";
  } else {
    menu.classList.add("hidden");
    menu.classList.remove("flex");
    icon.className = "ph ph-plus-bold";
  }
}

function openModal(modalId) {
  closeModal();
  activeModalSheet = document.getElementById(modalId);
  const backdrop = document.getElementById("modalBackdrop");
  
  backdrop.classList.remove("hidden");
  setTimeout(() => {
    backdrop.classList.remove("opacity-0");
    activeModalSheet.classList.remove("translate-y-full");
  }, 10);
}

function closeModal() {
  if (activeModalSheet) {
    activeModalSheet.classList.add("translate-y-full");
    document.getElementById("modalBackdrop").classList.add("opacity-0");
    setTimeout(() => {
      document.getElementById("modalBackdrop").classList.add("hidden");
      activeModalSheet = null;
    }, 300);
  }
}

function poblarSelects() {
  const selectGasto = document.getElementById("modalGastoVacante");
  const selectHora = document.getElementById("modalHoraVacante");
  const optionsVacantes = DB.vacantes.map(v => `<option value="${v.id_vacante}">${v.titulo_puesto}</option>`).join("");
  selectGasto.innerHTML = optionsVacantes;
  selectHora.innerHTML = optionsVacantes;

  const selectClientes = document.getElementById("modalVacanteCliente");
  selectClientes.innerHTML = DB.clientes.map(c => `<option value="${c.id_cliente}">${c.nombre_comercial}</option>`).join("");

  const selectServicios = document.getElementById("modalVacanteServicio");
  selectServicios.innerHTML = DB.servicios.map(s => `<option value="${s.id_servicio}">${s.nombre_servicio}</option>`).join("");
}

function actualizarValoresServicio() {
  const srvId = document.getElementById("modalVacanteServicio").value;
  const srv = DB.servicios.find(s => s.id_servicio === srvId);
  if (srv) {
    document.getElementById("nuevaVacanteGarantia").value = srv.dias_garantia_defecto;
  }
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
    const gastosVacante = DB.gastos.filter(g => g.id_vacante === v.id_vacante).reduce((sum, g) => sum + Number(g.monto), 0);
    const horasVacante = DB.horas.filter(h => h.id_vacante === v.id_vacante);
    const totalHoras = horasVacante.reduce((sum, h) => sum + Number(h.horas_invertidas), 0);
    const costoHoras = horasVacante.reduce((sum, h) => sum + (Number(h.horas_invertidas) * Number(h.costo_por_hora)), 0);
    
    const costoTotal = gastosVacante + costoHoras;
    const margenNeto = Number(v.fee_pactado_total) - costoTotal;
    const margenPorcentaje = v.fee_pactado_total > 0 ? Math.round((margenNeto / v.fee_pactado_total) * 100) : 0;

    if (v.estatus_vacante === "En Proceso") totalFees += Number(v.fee_pactado_total);
    totalGastos += gastosVacante;

    const infoGarantia = calcularDiasGarantia(v);

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
        <span><i class="ph ph-clock"></i> ${totalHoras} hrs</span>
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

      <div class="mt-3.5 flex gap-2">
        <button data-id="${v.id_vacante}" class="btn-card-gasto flex-1 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 active:scale-95 transition-all flex items-center justify-center gap-1">
          <i class="ph ph-receipt"></i> + Gasto
        </button>
        <button data-id="${v.id_vacante}" class="btn-card-hora flex-1 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 active:scale-95 transition-all flex items-center justify-center gap-1">
          <i class="ph ph-clock"></i> + Horas
        </button>
      </div>
    `;

    card.querySelector(".btn-card-gasto").addEventListener("click", () => {
      document.getElementById("modalGastoVacante").value = v.id_vacante;
      openModal("modalSheetGasto");
    });

    card.querySelector(".btn-card-hora").addEventListener("click", () => {
      document.getElementById("modalHoraVacante").value = v.id_vacante;
      openModal("modalSheetHora");
    });

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
  
  const diffTime = finGarantia - new Date();
  const diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (vacante.garantia_aplicada !== "No") return { diasRestantes: 0, texto: "Consumida", color: "text-purple-600" };
  if (diasRestantes <= 0) return { diasRestantes: 0, texto: "Vencida", color: "text-rose-500" };
  if (diasRestantes <= 15) return { diasRestantes, texto: `${diasRestantes}d (Vence pronto)`, color: "text-amber-500" };
  return { diasRestantes, texto: `${diasRestantes}d restantes`, color: "text-emerald-600" };
}

// PERSISTENCIA DE GASTO
async function guardarGasto(e) {
  e.preventDefault();
  const idVacante = document.getElementById("modalGastoVacante").value;
  const categoria = document.getElementById("modalGastoCategoria").value;
  const monto = parseFloat(document.getElementById("modalGastoMonto").value);

  DB.gastos.push({ id_vacante: idVacante, categoria, monto });
  closeModal();
  document.getElementById("modalGastoMonto").value = "";
  renderizarApp();

  sendToAppsScript({
    action: "create",
    targetSheet: "GASTOS_INVERSION",
    payload: [`GST-${Date.now()}`, idVacante, categoria, monto, new Date().toISOString().split('T')[0]]
  });
}

// PERSISTENCIA DE HORAS (TIME TRACKING)
async function guardarHora(e) {
  e.preventDefault();
  const idVacante = document.getElementById("modalHoraVacante").value;
  const consultor = document.getElementById("modalHoraConsultor").value;
  const horas_invertidas = parseFloat(document.getElementById("modalHoraCantidad").value);
  const costo_por_hora = parseFloat(document.getElementById("modalHoraCosto").value);
  const etapa = document.getElementById("modalHoraEtapa").value;

  DB.horas.push({ id_vacante: idVacante, consultor, horas_invertidas, costo_por_hora, etapa });
  closeModal();
  document.getElementById("modalHoraCantidad").value = "";
  renderizarApp();

  sendToAppsScript({
    action: "create",
    targetSheet: "REGISTRO_HORAS",
    payload: [`TIM-${Date.now()}`, idVacante, consultor, horas_invertidas, costo_por_hora, etapa]
  });
}

// PERSISTENCIA DE VACANTE Y CLIENTE
async function guardarVacante(e) {
  e.preventDefault();
  let idCliente = document.getElementById("modalVacanteCliente").value;
  let region = "Querétaro";

  const boxNuevoCliente = document.getElementById("boxNuevoCliente");
  if (!boxNuevoCliente.classList.contains("hidden")) {
    const nombreCliente = document.getElementById("nuevoClienteNombre").value;
    region = document.getElementById("nuevoClienteRegion").value || "Querétaro";
    const wa = document.getElementById("nuevoClienteWhatsApp").value;
    
    idCliente = `CLI-${Date.now().toString().slice(-4)}`;
    DB.clientes.push({ id_cliente: idCliente, nombre_comercial: nombreCliente, region, contacto_whatsapp: wa });

    sendToAppsScript({
      action: "create",
      targetSheet: "CLIENTES",
      payload: [idCliente, nombreCliente, region, "", wa, "Activo"]
    });
  } else {
    const c = DB.clientes.find(item => item.id_cliente === idCliente);
    if (c) region = c.region;
  }

  const idVacante = `VAC-${Date.now().toString().slice(-4)}`;
  const nuevaVacante = {
    id_vacante: idVacante,
    id_cliente: idCliente,
    titulo_puesto: document.getElementById("nuevaVacantePuesto").value,
    region: region,
    id_servicio: document.getElementById("modalVacanteServicio").value,
    sueldo_base_perfil: 0,
    fee_pactado_total: parseFloat(document.getElementById("nuevaVacanteFee").value),
    monto_adelanto: parseFloat(document.getElementById("nuevaVacanteAnticipo").value),
    fecha_inicio_proceso: new Date().toISOString().split('T')[0],
    estatus_vacante: "En Proceso",
    fecha_contratacion: "",
    dias_garantia_pactados: parseInt(document.getElementById("nuevaVacanteGarantia").value),
    garantia_aplicada: "No"
  };

  DB.vacantes.unshift(nuevaVacante);
  closeModal();
  document.getElementById("formVacante").reset();
  boxNuevoCliente.classList.add("hidden");
  poblarSelects();
  renderizarApp();

  sendToAppsScript({
    action: "create",
    targetSheet: "VACANTES",
    payload: [
      nuevaVacante.id_vacante,
      nuevaVacante.id_cliente,
      nuevaVacante.titulo_puesto,
      nuevaVacante.region,
      nuevaVacante.id_servicio,
      nuevaVacante.sueldo_base_perfil,
      nuevaVacante.fee_pactado_total,
      nuevaVacante.monto_adelanto,
      nuevaVacante.fecha_inicio_proceso,
      nuevaVacante.estatus_vacante,
      "",
      nuevaVacante.dias_garantia_pactados,
      "",
      "",
      "No",
      ""
    ]
  });
}

async function sendToAppsScript(payload) {
  if (APPS_SCRIPT_URL === "TU_APPS_SCRIPT_URL_AQUI" || !APPS_SCRIPT_URL.startsWith("http")) {
    console.warn("⚠️ APPS_SCRIPT_URL no está configurada correctamente.");
    return;
  }

  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      // text/plain evita que el navegador haga preflight OPTIONS que GAS no soporta
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
      mode: "no-cors" // Permite completar el envío a GAS sin bloqueos de CORS
    });
    console.log("✓ Petición enviada a Google Apps Script:", payload);
  } catch (err) {
    console.error("❌ Error enviando datos a Google Sheets:", err);
  }
}

async function cargarDatosDesdeAPI() {
  if (APPS_SCRIPT_URL === "TU_APPS_SCRIPT_URL_AQUI") return;
  try {
    const res = await fetch(`${APPS_SCRIPT_URL}?action=getDashboardData`);
    const data = await res.json();
    if (data.vacantes) DB = data;
    poblarSelects();
    renderizarApp();
  } catch (err) {
    console.error("Error al obtener datos:", err);
  }
}
