/**
 * CRM Talentum - Lógica de Control Operativo y Financiero
 */

const APPS_SCRIPT_URL = "TU_APPS_SCRIPT_URL_AQUI";

let DB = {
  clientes: [
    { id_cliente: "CLI-001", nombre_comercial: "TechSolutions MX", region: "Querétaro" },
    { id_cliente: "CLI-002", nombre_comercial: "Logística Bajío", region: "Bajío" }
  ],
  servicios: [
    { id_servicio: "SRV-001", nombre_servicio: "Reclutamiento Operativo", dias_garantia_defecto: 30 },
    { id_servicio: "SRV-002", nombre_servicio: "Mandos Medios / Especialistas", dias_garantia_defecto: 60 },
    { id_servicio: "SRV-003", nombre_servicio: "Headhunting Directivo", dias_garantia_defecto: 90 }
  ],
  vacantes: [
    {
      id_vacante: "VAC-101",
      id_cliente: "CLI-001",
      titulo_puesto: "Líder de Desarrollo Fullstack",
      region: "Querétaro",
      id_servicio: "SRV-002",
      fee_pactado_total: 28000,
      monto_adelanto: 14000,
      fecha_inicio_proceso: "2026-08-05",
      estatus_vacante: "En Proceso",
      fecha_contratacion: "",
      candidato_contratado: "",
      dias_garantia_pactados: 60,
      garantia_aplicada: "No",
      descripcion_perfil: "Perfil Senior con React, Node.js y Cloud."
    },
    {
      id_vacante: "VAC-102",
      id_cliente: "CLI-002",
      titulo_puesto: "Coordinador de Almacén",
      region: "Bajío",
      id_servicio: "SRV-001",
      fee_pactado_total: 16000,
      monto_adelanto: 8000,
      fecha_inicio_proceso: "2026-07-10",
      estatus_vacante: "Contratado",
      fecha_contratacion: "2026-08-01",
      candidato_contratado: "Roberto Sánchez",
      dias_garantia_pactados: 30,
      garantia_aplicada: "No",
      descripcion_perfil: "Experiencia en inventarios y manejo de ERP."
    }
  ],
  gastos: [
    { id_vacante: "VAC-101", categoria: "Facebook Ads", monto: 1250, fecha_gasto: "2026-08-08" },
    { id_vacante: "VAC-101", categoria: "Psicometría", monto: 450, fecha_gasto: "2026-08-10" },
    { id_vacante: "VAC-102", categoria: "Facebook Ads", monto: 600, fecha_gasto: "2026-07-15" }
  ],
  horas: [
    { id_vacante: "VAC-101", horas_invertidas: 12, costo_por_hora: 150 },
    { id_vacante: "VAC-102", horas_invertidas: 8, costo_por_hora: 150 }
  ]
};

let currentTab = "vacantes";
let filtroEstadoActual = "En Proceso";
let activeModalSheet = null;
let vacanteSeleccionadaExpediente = null;

document.addEventListener("DOMContentLoaded", () => {
  setupEventListeners();
  poblarSelects();
  cargarDatosDesdeAPI();
});

function setupEventListeners() {
  document.getElementById("btnReload").addEventListener("click", cargarDatosDesdeAPI);
  document.getElementById("inputSearch").addEventListener("input", renderizarApp);
  
  // Bottom Nav
  document.getElementById("navBtnVacantes").addEventListener("click", () => switchTab("vacantes"));
  document.getElementById("navBtnAnalytics").addEventListener("click", () => switchTab("analytics"));

  // FAB
  document.getElementById("btnFab").addEventListener("click", toggleFabMenu);
  document.getElementById("btnOpenModalVacante").addEventListener("click", () => { toggleFabMenu(); openModal("modalSheetVacante"); });
  document.getElementById("btnOpenModalHora").addEventListener("click", () => { toggleFabMenu(); openModal("modalSheetHora"); });

  // Cerrar modales
  document.getElementById("modalBackdrop").addEventListener("click", closeModal);
  document.querySelectorAll(".btn-close-modal").forEach(b => b.addEventListener("click", closeModal));

  // Toggles de Nuevo Cliente y Nuevo Servicio
  document.getElementById("btnToggleNuevoCliente").addEventListener("click", () => {
    document.getElementById("boxNuevoCliente").classList.toggle("hidden");
  });
  document.getElementById("btnToggleNuevoServicio").addEventListener("click", () => {
    document.getElementById("boxNuevoServicio").classList.toggle("hidden");
  });
  document.getElementById("btnGuardarNuevoServicio").addEventListener("click", guardarNuevoServicio);

  document.getElementById("modalVacanteServicio").addEventListener("change", actualizarValoresServicio);

  // Formularios
  document.getElementById("formGasto").addEventListener("submit", guardarGasto);
  document.getElementById("formHora").addEventListener("submit", guardarHora);
  document.getElementById("formVacante").addEventListener("submit", guardarVacante);
  document.getElementById("formContratar").addEventListener("submit", procesarContratacion);

  // Acciones en Expediente
  document.getElementById("btnExpedienteAgregarGasto").addEventListener("click", () => {
    if (vacanteSeleccionadaExpediente) {
      document.getElementById("modalGastoVacante").value = vacanteSeleccionadaExpediente.id_vacante;
      openModal("modalSheetGasto");
    }
  });

  document.getElementById("btnExpFinalizar").addEventListener("click", () => {
    if (vacanteSeleccionadaExpediente) {
      abrirModalContratar(vacanteSeleccionadaExpediente);
    }
  });

  document.getElementById("btnExpEliminar").addEventListener("click", () => {
    if (vacanteSeleccionadaExpediente && confirm(`¿Deseas eliminar la vacante ${vacanteSeleccionadaExpediente.titulo_puesto}?`)) {
      DB.vacantes = DB.vacantes.filter(v => String(v.id_vacante) !== String(vacanteSeleccionadaExpediente.id_vacante));
      closeModal();
      renderizarApp();
    }
  });

  document.getElementById("btnVerPerfilPuesto").addEventListener("click", () => {
    if (vacanteSeleccionadaExpediente) {
      alert(`Perfil de Puesto:\n\n${vacanteSeleccionadaExpediente.descripcion_perfil || 'Sin descripción detallada.'}`);
    }
  });

  // Filtros
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

function switchTab(tab) {
  currentTab = tab;
  const viewVacantes = document.getElementById("viewVacantes");
  const viewAnalytics = document.getElementById("viewAnalytics");
  const searchSection = document.getElementById("searchSection");
  const filterChips = document.getElementById("filterChipsContainer");
  const headerSubtext = document.getElementById("headerSubtext");
  const fabContainer = document.getElementById("fabContainer");

  const btnVacantes = document.getElementById("navBtnVacantes");
  const btnAnalytics = document.getElementById("navBtnAnalytics");

  if (tab === "vacantes") {
    viewVacantes.classList.remove("hidden");
    viewAnalytics.classList.add("hidden");
    searchSection.classList.remove("hidden");
    filterChips.classList.remove("hidden");
    fabContainer.classList.remove("hidden");
    headerSubtext.textContent = "Control de Procesos";

    btnVacantes.className = "nav-item flex flex-col items-center gap-1 text-indigo-600 font-bold transition-colors";
    btnAnalytics.className = "nav-item flex flex-col items-center gap-1 text-slate-400 font-semibold hover:text-slate-600 transition-colors";
    renderizarApp();
  } else {
    viewVacantes.classList.add("hidden");
    viewAnalytics.classList.remove("hidden");
    searchSection.classList.add("hidden");
    filterChips.classList.add("hidden");
    fabContainer.classList.add("hidden");
    headerSubtext.textContent = "Métricas Financieras";

    btnVacantes.className = "nav-item flex flex-col items-center gap-1 text-slate-400 font-semibold hover:text-slate-600 transition-colors";
    btnAnalytics.className = "nav-item flex flex-col items-center gap-1 text-indigo-600 font-bold transition-colors";
    renderizarAnaliticas();
  }
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

// GUARDAR NUEVO SERVICIO EN CATÁLOGO
function guardarNuevoServicio() {
  const nombre = document.getElementById("nuevoServicioNombre").value.trim();
  const dias = parseInt(document.getElementById("nuevoServicioGarantia").value) || 30;

  if (!nombre) {
    alert("Ingresa un nombre para el servicio");
    return;
  }

  const idServicio = `SRV-${Date.now().toString().slice(-4)}`;
  const nuevoSrv = { id_servicio: idServicio, nombre_servicio: nombre, dias_garantia_defecto: dias, porcentaje_fee_defecto: 1.0 };
  
  DB.servicios.push(nuevoSrv);
  poblarSelects();
  document.getElementById("modalVacanteServicio").value = idServicio;
  document.getElementById("nuevaVacanteGarantia").value = dias;
  document.getElementById("boxNuevoServicio").classList.add("hidden");
  document.getElementById("nuevoServicioNombre").value = "";

  sendToAppsScript({
    action: "create",
    targetSheet: "CAT_SERVICIOS",
    payload: [idServicio, nombre, dias, 1.0]
  });
}

function renderizarApp() {
  if (currentTab === "analytics") {
    renderizarAnaliticas();
    return;
  }

  const container = document.getElementById("vacantesContainer");
  const searchVal = document.getElementById("inputSearch").value.toLowerCase().trim();
  container.innerHTML = "";

  let totalFees = 0;
  let totalGastos = 0;

  const vacantesFiltradas = DB.vacantes.filter(v => {
    const cliente = DB.clientes.find(c => String(c.id_cliente) === String(v.id_cliente));
    const matchSearch = v.titulo_puesto.toLowerCase().includes(searchVal) || 
                        (cliente && cliente.nombre_comercial.toLowerCase().includes(searchVal)) ||
                        (v.region && v.region.toLowerCase().includes(searchVal));

    if (!matchSearch) return false;
    if (filtroEstadoActual === "Todas") return true;
    if (filtroEstadoActual === "En Proceso") return v.estatus_vacante === "En Proceso";
    if (filtroEstadoActual === "Contratado") return v.estatus_vacante === "Contratado";
    if (filtroEstadoActual === "Garantia") return v.estatus_vacante === "Contratado" && calcularDiasGarantia(v).diasRestantes > 0;
    return true;
  });

  vacantesFiltradas.forEach(v => {
    const cliente = DB.clientes.find(c => String(c.id_cliente) === String(v.id_cliente)) || { nombre_comercial: "Cliente General" };
    const gastosVacante = DB.gastos.filter(g => String(g.id_vacante) === String(v.id_vacante)).reduce((sum, g) => sum + Number(g.monto), 0);
    const horasVacante = DB.horas.filter(h => String(h.id_vacante) === String(v.id_vacante));
    const totalHoras = horasVacante.reduce((sum, h) => sum + Number(h.horas_invertidas), 0);
    const costoHoras = horasVacante.reduce((sum, h) => sum + (Number(h.horas_invertidas) * Number(h.costo_por_hora)), 0);
    
    const costoTotal = gastosVacante + costoHoras;
    const margenNeto = Number(v.fee_pactado_total) - costoTotal;
    const margenPorcentaje = v.fee_pactado_total > 0 ? Math.round((margenNeto / v.fee_pactado_total) * 100) : 0;

    if (v.estatus_vacante === "En Proceso") totalFees += Number(v.fee_pactado_total);
    totalGastos += gastosVacante;

    const infoGarantia = calcularDiasGarantia(v);

    const card = document.createElement("div");
    card.className = "bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm relative overflow-hidden cursor-pointer active:scale-[0.99] transition-transform";
    
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
        <span><i class="ph ph-map-pin"></i> ${v.region || 'N/A'}</span>
        <span><i class="ph ph-clock"></i> ${totalHoras} hrs</span>
      </div>

      ${v.estatus_vacante === 'Contratado' ? `
        <div class="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
          <div class="flex items-center gap-1.5">
            <i class="ph ph-shield-check text-base ${infoGarantia.color}"></i>
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

      <div class="mt-3.5 flex flex-wrap gap-2">
        <button class="btn-card-gasto flex-1 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 active:scale-95 transition-all flex items-center justify-center gap-1">
          <i class="ph ph-receipt"></i> + Gasto
        </button>
        <button class="btn-card-hora flex-1 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 active:scale-95 transition-all flex items-center justify-center gap-1">
          <i class="ph ph-clock"></i> + Horas
        </button>
        ${v.estatus_vacante === 'En Proceso' ? `
          <button class="btn-card-contratar w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold active:scale-95 transition-all flex items-center justify-center gap-1 border border-emerald-200">
            <i class="ph ph-check-circle"></i> Marcar Contratada
          </button>
        ` : ''}
      </div>
    `;

    // Clic en la tarjeta abre el Expediente Completo
    card.addEventListener("click", (e) => {
      if (!e.target.closest("button")) {
        abrirExpediente(v);
      }
    });

    card.querySelector(".btn-card-gasto").addEventListener("click", (e) => {
      e.stopPropagation();
      document.getElementById("modalGastoVacante").value = v.id_vacante;
      openModal("modalSheetGasto");
    });

    card.querySelector(".btn-card-hora").addEventListener("click", (e) => {
      e.stopPropagation();
      document.getElementById("modalHoraVacante").value = v.id_vacante;
      openModal("modalSheetHora");
    });

    const btnContratar = card.querySelector(".btn-card-contratar");
    if (btnContratar) {
      btnContratar.addEventListener("click", (e) => {
        e.stopPropagation();
        abrirModalContratar(v);
      });
    }

    container.appendChild(card);
  });

  document.getElementById("totalFeesActivos").textContent = `$${totalFees.toLocaleString()}`;
  document.getElementById("totalInversion").textContent = `$${totalGastos.toLocaleString()}`;
}

// ==========================================
// EXPEDIENTE DETALLADO (MODAL OSCURA)
// ==========================================
function abrirExpediente(vacante) {
  vacanteSeleccionadaExpediente = vacante;
  const cliente = DB.clientes.find(c => String(c.id_cliente) === String(vacante.id_cliente)) || { nombre_comercial: "Empresa", region: "General" };
  const servicio = DB.servicios.find(s => String(s.id_servicio) === String(vacante.id_servicio)) || { nombre_servicio: "Reclutamiento" };

  // Gastos de esta vacante
  const gastosVacante = DB.gastos.filter(g => String(g.id_vacante) === String(vacante.id_vacante));
  const totalGastos = gastosVacante.reduce((sum, g) => sum + Number(g.monto || 0), 0);
  
  const horasVacante = DB.horas.filter(h => String(h.id_vacante) === String(vacante.id_vacante));
  const costoHoras = horasVacante.reduce((sum, h) => sum + (Number(h.horas_invertidas || 0) * Number(h.costo_por_hora || 0)), 0);

  const inversionTotal = totalGastos + costoHoras;
  const feeTotal = Number(vacante.fee_pactado_total || 0);
  const gananciaNeta = feeTotal - inversionTotal;

  // Días de proceso
  let diasProceso = 0;
  if (vacante.fecha_inicio_proceso) {
    const p = vacante.fecha_inicio_proceso.split("-");
    const inicio = new Date(p[0], p[1]-1, p[2]);
    const fin = vacante.fecha_contratacion ? new Date(vacante.fecha_contratacion.split("-")[0], vacante.fecha_contratacion.split("-")[1]-1, vacante.fecha_contratacion.split("-")[2]) : new Date();
    diasProceso = Math.max(1, Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24)));
  }

  // Poblar datos superiores
  document.getElementById("expPuesto").textContent = vacante.titulo_puesto;
  document.getElementById("expSubtitulo").textContent = `${cliente.nombre_comercial} • Región ${vacante.region || cliente.region}`;

  document.getElementById("expFee").textContent = `$${feeTotal.toLocaleString()}`;
  document.getElementById("expInversion").textContent = `$${inversionTotal.toLocaleString()}`;
  document.getElementById("expGanancia").textContent = `$${gananciaNeta.toLocaleString()}`;
  document.getElementById("expDiasCierre").textContent = `${diasProceso} días`;

  // Panel Información
  const badgeEstatus = document.getElementById("expBadgeEstatus");
  badgeEstatus.textContent = vacante.estatus_vacante;
  badgeEstatus.className = vacante.estatus_vacante === "En Proceso" 
    ? "px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30"
    : "px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30";

  document.getElementById("expFechaInicio").textContent = vacante.fecha_inicio_proceso || "--";
  document.getElementById("expFechaContratacion").textContent = vacante.fecha_contratacion || "En proceso";
  document.getElementById("expCandidato").textContent = vacante.candidato_contratado || "No asignado aún";
  document.getElementById("expTipoServicio").textContent = servicio.nombre_servicio;

  // Panel Garantía
  document.getElementById("expGarantiaPactada").textContent = `${vacante.dias_garantia_pactados} días`;
  
  if (vacante.fecha_contratacion) {
    const p = vacante.fecha_contratacion.split("-");
    const fc = new Date(p[0], p[1]-1, p[2]);
    fc.setDate(fc.getDate() + Number(vacante.dias_garantia_pactados));
    document.getElementById("expGarantiaLimite").textContent = fc.toISOString().split("T")[0];
  } else {
    document.getElementById("expGarantiaLimite").textContent = "N/A";
  }

  const infoGarantia = calcularDiasGarantia(vacante);
  document.getElementById("expGarantiaEstatus").textContent = infoGarantia.texto;

  // Render Historial de Gastos
  const tableGastos = document.getElementById("expHistorialGastosTable");
  tableGastos.innerHTML = "";

  if (gastosVacante.length === 0 && horasVacante.length === 0) {
    tableGastos.innerHTML = `<tr><td colspan="2" class="py-3 text-center text-slate-500 italic">No hay gastos registrados aún</td></tr>`;
  } else {
    gastosVacante.forEach(g => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="py-2 text-slate-300">${g.categoria}</td>
        <td class="py-2 text-right text-rose-400 font-bold">$${Number(g.monto).toLocaleString()}</td>
      `;
      tableGastos.appendChild(tr);
    });

    if (costoHoras > 0) {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="py-2 text-slate-300">Horas de Consultoría</td>
        <td class="py-2 text-right text-amber-400 font-bold">$${costoHoras.toLocaleString()}</td>
      `;
      tableGastos.appendChild(tr);
    }
  }

  document.getElementById("expHistorialTotalMonto").textContent = `$${inversionTotal.toLocaleString()}`;

  // Botón finalizar visibilidad
  const btnFinalizar = document.getElementById("btnExpFinalizar");
  if (vacante.estatus_vacante === "Contratado") {
    btnFinalizar.classList.add("hidden");
  } else {
    btnFinalizar.classList.remove("hidden");
  }

  openModal("modalExpediente");
}

// ANALÍTICAS
function renderizarAnaliticas() {
  const totalFacturado = DB.vacantes.reduce((sum, v) => sum + Number(v.fee_pactado_total || 0), 0);
  const totalGastosPauta = DB.gastos.reduce((sum, g) => sum + Number(g.monto || 0), 0);
  const totalHorasHH = DB.horas.reduce((sum, h) => sum + (Number(h.horas_invertidas || 0) * Number(h.costo_por_hora || 0)), 0);
  const totalHorasCantidad = DB.horas.reduce((sum, h) => sum + Number(h.horas_invertidas || 0), 0);

  const costoTotalGeneral = totalGastosPauta + totalHorasHH;
  const utilidadNetaTotal = totalFacturado - costoTotalGeneral;
  const margenGlobalPorcentaje = totalFacturado > 0 ? Math.round((utilidadNetaTotal / totalFacturado) * 100) : 0;
  const roas = totalGastosPauta > 0 ? (totalFacturado / totalGastosPauta).toFixed(1) : "N/A";

  document.getElementById("kpiUtilidadNeta").textContent = `$${utilidadNetaTotal.toLocaleString()}`;
  document.getElementById("kpiMargenGlobal").textContent = `${margenGlobalPorcentaje}% Margen`;
  document.getElementById("kpiFacturadoTotal").textContent = `$${totalFacturado.toLocaleString()}`;
  document.getElementById("kpiGastoPautaTotal").textContent = `$${totalGastosPauta.toLocaleString()}`;
  document.getElementById("kpiCostoHorasTotal").textContent = `$${totalHorasHH.toLocaleString()}`;
  document.getElementById("kpiRoas").textContent = roas === "N/A" ? "N/A" : `${roas}x`;
  document.getElementById("kpiHorasTotales").textContent = `${totalHorasCantidad} hrs`;

  // Desglose de Gastos
  const containerBreakdown = document.getElementById("breakdownGastos");
  containerBreakdown.innerHTML = "";

  const categorias = {};
  DB.gastos.forEach(g => {
    categorias[g.categoria] = (categorias[g.categoria] || 0) + Number(g.monto);
  });
  if (totalHorasHH > 0) {
    categorias["Horas de Consultoría"] = totalHorasHH;
  }

  const granTotalInvertido = totalGastosPauta + totalHorasHH;

  Object.keys(categorias).forEach(cat => {
    const monto = categorias[cat];
    const pct = granTotalInvertido > 0 ? Math.round((monto / granTotalInvertido) * 100) : 0;

    const row = document.createElement("div");
    row.innerHTML = `
      <div class="flex justify-between text-xs font-semibold text-slate-700 mb-1">
        <span>${cat}</span>
        <span>$${monto.toLocaleString()} <span class="text-slate-400 font-normal">(${pct}%)</span></span>
      </div>
      <div class="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
        <div class="bg-indigo-600 h-2 rounded-full" style="width: ${pct}%"></div>
      </div>
    `;
    containerBreakdown.appendChild(row);
  });

  // Rentabilidad por Cliente
  const containerClientes = document.getElementById("tablaRentabilidadClientes");
  containerClientes.innerHTML = "";

  DB.clientes.forEach(c => {
    const vacantesCliente = DB.vacantes.filter(v => String(v.id_cliente) === String(c.id_cliente));
    if (vacantesCliente.length === 0) return;

    const facturadoCliente = vacantesCliente.reduce((sum, v) => sum + Number(v.fee_pactado_total || 0), 0);
    const idsVacantes = vacantesCliente.map(v => String(v.id_vacante));

    const gastosCliente = DB.gastos
      .filter(g => idsVacantes.includes(String(g.id_vacante)))
      .reduce((sum, g) => sum + Number(g.monto || 0), 0);

    const horasCliente = DB.horas
      .filter(h => idsVacantes.includes(String(h.id_vacante)))
      .reduce((sum, h) => sum + (Number(h.horas_invertidas || 0) * Number(h.costo_por_hora || 0)), 0);

    const netoCliente = facturadoCliente - (gastosCliente + horasCliente);
    const margenCliente = facturadoCliente > 0 ? Math.round((netoCliente / facturadoCliente) * 100) : 0;

    const card = document.createElement("div");
    card.className = "p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between";
    card.innerHTML = `
      <div>
        <h4 class="text-xs font-bold text-slate-900">${c.nombre_comercial}</h4>
        <span class="text-[11px] text-slate-500">${vacantesCliente.length} proceso(s) | Facturado: $${facturadoCliente.toLocaleString()}</span>
      </div>
      <div class="text-right">
        <span class="text-xs font-black ${netoCliente >= 0 ? 'text-emerald-600' : 'text-rose-500'}">+$${netoCliente.toLocaleString()}</span>
        <span class="text-[10px] font-bold block text-slate-400">${margenCliente}% neto</span>
      </div>
    `;
    containerClientes.appendChild(card);
  });
}

function calcularDiasGarantia(vacante) {
  if (!vacante.fecha_contratacion) return { diasRestantes: 0, texto: "Sin fecha", color: "text-slate-400" };
  
  const partes = String(vacante.fecha_contratacion).split("-");
  const contratacion = new Date(partes[0], partes[1] - 1, partes[2]);
  const finGarantia = new Date(contratacion);
  finGarantia.setDate(contratacion.getDate() + Number(vacante.dias_garantia_pactados));
  
  const hoy = new Date();
  hoy.setHours(0,0,0,0);
  const diffTime = finGarantia - hoy;
  const diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (vacante.garantia_aplicada !== "No") return { diasRestantes: 0, texto: "Consumida", color: "text-purple-600" };
  if (diasRestantes <= 0) return { diasRestantes: 0, texto: "Vencida", color: "text-rose-500" };
  if (diasRestantes <= 15) return { diasRestantes, texto: `${diasRestantes}d (Por vencer)`, color: "text-amber-500" };
  return { diasRestantes, texto: `${diasRestantes}d restantes`, color: "text-emerald-600" };
}

// MODAL CONTRATAR
function abrirModalContratar(vacante) {
  document.getElementById("modalContratarIdVacante").value = vacante.id_vacante;
  document.getElementById("modalContratarTitulo").textContent = `${vacante.titulo_puesto}`;
  document.getElementById("modalContratarNombreCandidato").value = vacante.candidato_contratado || "";
  document.getElementById("modalContratarFecha").value = new Date().toISOString().split("T")[0];
  openModal("modalSheetContratar");
}

async function procesarContratacion(e) {
  e.preventDefault();
  const idVacante = document.getElementById("modalContratarIdVacante").value;
  const fecha = document.getElementById("modalContratarFecha").value;
  const candidato = document.getElementById("modalContratarNombreCandidato").value;

  const vacante = DB.vacantes.find(v => String(v.id_vacante) === String(idVacante));
  if (vacante) {
    vacante.estatus_vacante = "Contratado";
    vacante.fecha_contratacion = fecha;
    vacante.candidato_contratado = candidato;
  }

  closeModal();
  renderizarApp();

  sendToAppsScript({
    action: "updateContratacion",
    targetSheet: "VACANTES",
    id_vacante: idVacante,
    fecha_contratacion: fecha
  });
}

// PERSISTENCIA DE GASTO
async function guardarGasto(e) {
  e.preventDefault();
  const idVacante = document.getElementById("modalGastoVacante").value;
  const categoria = document.getElementById("modalGastoCategoria").value;
  const monto = parseFloat(document.getElementById("modalGastoMonto").value);

  DB.gastos.push({ id_vacante: idVacante, categoria, monto, fecha_gasto: new Date().toISOString().split('T')[0] });
  closeModal();
  document.getElementById("modalGastoMonto").value = "";
  renderizarApp();

  sendToAppsScript({
    action: "create",
    targetSheet: "GASTOS_INVERSION",
    payload: [`GST-${Date.now()}`, idVacante, categoria, monto, new Date().toISOString().split('T')[0]]
  });
}

// PERSISTENCIA DE HORAS
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

// PERSISTENCIA DE VACANTE
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
    const c = DB.clientes.find(item => String(item.id_cliente) === String(idCliente));
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
    candidato_contratado: "",
    dias_garantia_pactados: parseInt(document.getElementById("nuevaVacanteGarantia").value),
    garantia_aplicada: "No",
    descripcion_perfil: ""
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
  if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL === "TU_APPS_SCRIPT_URL_AQUI") return;
  try {
    await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
      mode: "no-cors"
    });
    console.log("✓ Sincronizado con Apps Script:", payload.action);
  } catch (err) {
    console.error("Error al sincronizar con Apps Script:", err);
  }
}

async function cargarDatosDesdeAPI() {
  if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL === "TU_APPS_SCRIPT_URL_AQUI") return;
  try {
    const res = await fetch(`${APPS_SCRIPT_URL}?action=getDashboardData`);
    const data = await res.json();
    if (data.vacantes && data.vacantes.length > 0) {
      DB = data;
      poblarSelects();
      renderizarApp();
    }
  } catch (err) {
    console.error("Error al obtener datos:", err);
  }
}
