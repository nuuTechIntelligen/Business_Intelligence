/**
 * CRM Talentum - Lógica de Control Operativo y Financiero
 * Catálogo Dinámico Unificado de Regiones (CAT_REGIONES)
 * Íconos Phosphor Corregidos y Animación FAB
 */

const APPS_SCRIPT_URL = "TU_APPS_SCRIPT_URL_AQUI";

let DB = {
  regiones: [
    { id_region: "REG-001", nombre_region: "Querétaro" },
    { id_region: "REG-002", nombre_region: "CDMX" },
    { id_region: "REG-003", nombre_region: "Bajío" },
    { id_region: "REG-004", nombre_region: "Remoto" }
  ],
  clientes: [
    { 
      id_cliente: "CLI-001", 
      nombre_comercial: "TechSolutions MX", 
      region: "Querétaro", 
      contacto_nombre: "Ing. Carlos Mendoza", 
      contacto_whatsapp: "4421234567", 
      contacto_email: "cmendoza@techsolutions.mx",
      estatus: "Activo" 
    },
    { 
      id_cliente: "CLI-002", 
      nombre_comercial: "Logística Bajío", 
      region: "Bajío", 
      contacto_nombre: "Lic. Laura Morales", 
      contacto_whatsapp: "4429876543", 
      contacto_email: "rh@logisticabajio.com",
      estatus: "Activo" 
    }
  ],
  servicios: [
    { id_servicio: "SRV-001", nombre_servicio: "Reclutamiento Operativo", dias_garantia_defecto: 30, sla_meta_dias: 15 },
    { id_servicio: "SRV-002", nombre_servicio: "Mandos Medios / Especialistas", dias_garantia_defecto: 60, sla_meta_dias: 25 },
    { id_servicio: "SRV-003", nombre_servicio: "Headhunting Directivo", dias_garantia_defecto: 90, sla_meta_dias: 40 }
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
      saldo_liquidado: "No",
      fecha_inicio_proceso: "2026-08-05",
      estatus_vacante: "En Proceso",
      fecha_contratacion: "",
      candidato_contratado: "",
      dias_garantia_pactados: 60,
      garantia_aplicada: "No",
      descripcion_perfil: "• Sueldo: $35,000 netos\n• Stack: React, Node.js, AWS\n• Horario: L-V 9:00 a 18:00\n• Prestaciones superiores a las de ley.",
      pipeline: { postulados: 18, filtro: 9, entrevistas: 5, terna: 3, oferta: 1 }
    },
    {
      id_vacante: "VAC-102",
      id_cliente: "CLI-002",
      titulo_puesto: "Coordinador de Almacén",
      region: "Bajío",
      id_servicio: "SRV-001",
      fee_pactado_total: 16000,
      monto_adelanto: 8000,
      saldo_liquidado: "Sí",
      fecha_inicio_proceso: "2026-07-10",
      estatus_vacante: "Contratado",
      fecha_contratacion: "2026-08-01",
      candidato_contratado: "Roberto Sánchez",
      dias_garantia_pactados: 30,
      garantia_aplicada: "No",
      descripcion_perfil: "• Sueldo: $18,000 brutos\n• Manejo indispensable de ERP SAP\n• Experiencia de 3 años con personal operativo a cargo.",
      pipeline: { postulados: 24, filtro: 12, entrevistas: 6, terna: 3, oferta: 1 }
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
let filtroRegionActual = "Todas";
let activeModalSheet = null;
let vacanteSeleccionadaExpediente = null;
let clienteAbiertoDetalle = null;

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function parsearFechaSegura(fechaRaw) {
  if (!fechaRaw) return null;
  if (fechaRaw instanceof Date && !isNaN(fechaRaw.getTime())) {
    const d = new Date(fechaRaw);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  
  const str = String(fechaRaw).trim();
  if (!str) return null;

  if (str.includes("-")) {
    const soloFecha = str.split("T")[0];
    const p = soloFecha.split("-");
    if (p.length === 3) {
      const year = parseInt(p[0], 10);
      const month = parseInt(p[1], 10) - 1;
      const day = parseInt(p[2], 10);
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) {
        d.setHours(0, 0, 0, 0);
        return d;
      }
    }
  }

  if (str.includes("/")) {
    const p = str.split("/");
    if (p.length === 3) {
      const day = parseInt(p[0], 10);
      const month = parseInt(p[1], 10) - 1;
      const year = parseInt(p[2], 10);
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) {
        d.setHours(0, 0, 0, 0);
        return d;
      }
    }
  }

  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    d.setHours(0, 0, 0, 0);
    return d;
  }

  return null;
}

function formatearFechaISO(dateObj) {
  if (!dateObj || isNaN(dateObj.getTime())) return "N/A";
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

window.cambiarPipeline = function(idVacante, etapa, delta) {
  const v = DB.vacantes.find(item => String(item.id_vacante) === String(idVacante));
  if (v && v.pipeline) {
    v.pipeline[etapa] = Math.max(0, (v.pipeline[etapa] || 0) + delta);
    renderPipelineVacante(v);
    renderizarAnaliticas();

    sendToAppsScript({
      action: "updatePipeline",
      targetSheet: "VACANTES",
      id_vacante: idVacante,
      pipeline: v.pipeline
    });
  }
};

document.addEventListener("DOMContentLoaded", () => {
  setupEventListeners();
  poblarSelects();
  
  const inputFechaInicio = document.getElementById("nuevaVacanteFechaInicio");
  if (inputFechaInicio) {
    inputFechaInicio.value = new Date().toISOString().split("T")[0];
  }

  cargarDatosDesdeAPI();
});

function setupEventListeners() {
  document.getElementById("btnReload").addEventListener("click", cargarDatosDesdeAPI);
  document.getElementById("inputSearch").addEventListener("input", renderizarApp);
  document.getElementById("selectFiltroRegion").addEventListener("change", (e) => {
    filtroRegionActual = e.target.value;
    renderizarApp();
  });
  
  // Bottom Nav
  document.getElementById("navBtnVacantes").addEventListener("click", () => switchTab("vacantes"));
  document.getElementById("navBtnAnalytics").addEventListener("click", () => switchTab("analytics"));
  document.getElementById("navBtnClientes").addEventListener("click", () => switchTab("clientes"));

  // FAB
  document.getElementById("btnFab").addEventListener("click", toggleFabMenu);
  document.getElementById("btnOpenModalVacante").addEventListener("click", () => { 
    toggleFabMenu(); 
    const inputFechaInicio = document.getElementById("nuevaVacanteFechaInicio");
    if (inputFechaInicio && !inputFechaInicio.value) {
      inputFechaInicio.value = new Date().toISOString().split("T")[0];
    }
    openModal("modalSheetVacante"); 
  });
  document.getElementById("btnOpenModalHora").addEventListener("click", () => { toggleFabMenu(); openModal("modalSheetHora"); });
  document.getElementById("btnOpenModalNuevoClienteDirecto").addEventListener("click", () => openModal("modalSheetNuevoClienteDirecto"));

  // Cerrar modales
  document.getElementById("modalBackdrop").addEventListener("click", closeModal);
  document.querySelectorAll(".btn-close-modal").forEach(b => {
    b.addEventListener("click", (e) => {
      e.stopPropagation();
      closeModal();
    });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });

  // Sincronizar región sugerida al cambiar de cliente en el modal de vacante
  document.getElementById("modalVacanteCliente").addEventListener("change", (e) => {
    const cli = DB.clientes.find(c => String(c.id_cliente) === String(e.target.value));
    if (cli && cli.region) {
      const selectReg = document.getElementById("nuevaVacanteRegionSelect");
      if (selectReg) selectReg.value = cli.region;
    }
  });

  // Toggles de Nuevo Cliente y Nuevo Servicio
  document.getElementById("btnToggleNuevoCliente").addEventListener("click", () => {
    document.getElementById("boxNuevoCliente").classList.toggle("hidden");
  });
  document.getElementById("btnToggleNuevoServicio").addEventListener("click", () => {
    document.getElementById("boxNuevoServicio").classList.toggle("hidden");
  });
  document.getElementById("btnGuardarNuevoServicio").addEventListener("click", guardarNuevoServicio);

  // Toggles de Nueva Región
  document.getElementById("btnToggleNuevaRegion").addEventListener("click", () => {
    document.getElementById("boxNuevaRegion").classList.toggle("hidden");
  });
  document.getElementById("btnGuardarNuevaRegion").addEventListener("click", () => {
    guardarNuevaRegion("inputNuevaRegionNombre", "boxNuevaRegion", "nuevaVacanteRegionSelect");
  });

  document.getElementById("btnToggleNuevaRegionCliente").addEventListener("click", () => {
    document.getElementById("boxNuevaRegionCliente").classList.toggle("hidden");
  });
  document.getElementById("btnGuardarNuevaRegionCliente").addEventListener("click", () => {
    guardarNuevaRegion("inputNuevaRegionNombreCliente", "boxNuevaRegionCliente", "clienteDirectoRegionSelect");
  });

  document.getElementById("modalVacanteServicio").addEventListener("change", actualizarValoresServicio);

  // Formularios
  document.getElementById("formGasto").addEventListener("submit", guardarGasto);
  document.getElementById("formHora").addEventListener("submit", guardarHora);
  document.getElementById("formVacante").addEventListener("submit", guardarVacante);
  document.getElementById("formContratar").addEventListener("submit", procesarContratacion);
  document.getElementById("formClienteDirecto").addEventListener("submit", guardarClienteDirecto);

  // Gasto directo dentro del Expediente
  document.getElementById("btnToggleGastoInline").addEventListener("click", () => {
    document.getElementById("formGastoInline").classList.toggle("hidden");
  });
  document.getElementById("btnCancelGastoInline").addEventListener("click", () => {
    document.getElementById("formGastoInline").classList.add("hidden");
  });
  document.getElementById("formGastoInline").addEventListener("submit", guardarGastoInlineExpediente);

  // Acordeón Perfil de Puesto
  document.getElementById("btnTogglePerfilPuesto").addEventListener("click", togglePerfilPuesto);

  // Observaciones inline
  document.getElementById("btnEditarObservaciones").addEventListener("click", () => {
    document.getElementById("inputObservaciones").value = vacanteSeleccionadaExpediente ? (vacanteSeleccionadaExpediente.descripcion_perfil || "") : "";
    document.getElementById("boxEditObservaciones").classList.remove("hidden");
  });
  document.getElementById("btnCancelarObs").addEventListener("click", () => {
    document.getElementById("boxEditObservaciones").classList.add("hidden");
  });
  document.getElementById("btnGuardarObs").addEventListener("click", guardarObservacionesInline);

  // Acciones en Expediente
  document.getElementById("btnExpFinalizar").addEventListener("click", () => {
    if (vacanteSeleccionadaExpediente) {
      abrirModalContratar(vacanteSeleccionadaExpediente);
    }
  });

  document.getElementById("btnExpGarantiaReactivar").addEventListener("click", reactivarPorGarantia);
  document.getElementById("btnEnviarReporteWhatsApp").addEventListener("click", enviarReportePipelineWhatsApp);

  document.getElementById("btnExpEliminar").addEventListener("click", () => {
    if (vacanteSeleccionadaExpediente && confirm(`¿Deseas eliminar la vacante ${vacanteSeleccionadaExpediente.titulo_puesto}?`)) {
      DB.vacantes = DB.vacantes.filter(v => String(v.id_vacante) !== String(vacanteSeleccionadaExpediente.id_vacante));
      closeModal();
      renderizarApp();
    }
  });

  // Filtros rápidos
  document.getElementById("filterChipsContainer").addEventListener("click", (e) => {
    const btn = e.target.closest(".chip-filter");
    if (!btn) return;
    filtroEstadoActual = btn.getAttribute("data-filter");
    document.querySelectorAll(".chip-filter").forEach(b => {
      b.className = "chip-filter px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap bg-[#131B2B] text-slate-300 border border-slate-800 hover:border-slate-700 transition-all";
    });
    btn.className = "chip-filter px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold shadow-md shadow-amber-500/20 transition-all";
    renderizarApp();
  });
}

function switchTab(tab) {
  currentTab = tab;
  const viewVacantes = document.getElementById("viewVacantes");
  const viewAnalytics = document.getElementById("viewAnalytics");
  const viewClientes = document.getElementById("viewClientes");
  const searchSection = document.getElementById("searchSection");
  const filterChips = document.getElementById("filterChipsContainer");
  const headerSubtext = document.getElementById("headerSubtext");
  const fabContainer = document.getElementById("fabContainer");

  const btnVacantes = document.getElementById("navBtnVacantes");
  const btnAnalytics = document.getElementById("navBtnAnalytics");
  const btnClientes = document.getElementById("navBtnClientes");

  [btnVacantes, btnAnalytics, btnClientes].forEach(b => {
    b.className = "nav-item flex flex-col items-center gap-1 text-slate-500 font-semibold hover:text-slate-300 transition-colors";
  });

  if (tab === "vacantes") {
    viewVacantes.classList.remove("hidden");
    viewAnalytics.classList.add("hidden");
    viewClientes.classList.add("hidden");
    searchSection.classList.remove("hidden");
    filterChips.classList.remove("hidden");
    fabContainer.classList.remove("hidden");
    headerSubtext.textContent = "Control de Procesos & Executive Search";
    btnVacantes.className = "nav-item flex flex-col items-center gap-1 text-amber-400 font-bold transition-colors";
    renderizarApp();
  } else if (tab === "analytics") {
    viewVacantes.classList.add("hidden");
    viewAnalytics.classList.remove("hidden");
    viewClientes.classList.add("hidden");
    searchSection.classList.add("hidden");
    filterChips.classList.add("hidden");
    fabContainer.classList.add("hidden");
    headerSubtext.textContent = "Métricas Financieras & ROAS";
    btnAnalytics.className = "nav-item flex flex-col items-center gap-1 text-amber-400 font-bold transition-colors";
    renderizarAnaliticas();
  } else if (tab === "clientes") {
    viewVacantes.classList.add("hidden");
    viewAnalytics.classList.add("hidden");
    viewClientes.classList.remove("hidden");
    searchSection.classList.add("hidden");
    filterChips.classList.add("hidden");
    fabContainer.classList.add("hidden");
    headerSubtext.textContent = "Directorio de Clientes & Contacto";
    btnClientes.className = "nav-item flex flex-col items-center gap-1 text-amber-400 font-bold transition-colors";
    renderizarDirectorioClientes();
  }
}

function toggleFabMenu() {
  const menu = document.getElementById("fabMenu");
  const icon = document.getElementById("fabIcon");
  const isHidden = menu.classList.contains("hidden");
  
  if (isHidden) {
    menu.classList.remove("hidden");
    menu.classList.add("flex");
    icon.className = "ph-bold ph-x transition-transform duration-300 rotate-90 text-2xl";
  } else {
    menu.classList.add("hidden");
    menu.classList.remove("flex");
    icon.className = "ph-bold ph-plus transition-transform duration-300 rotate-0 text-2xl";
  }
}

function openModal(modalId) {
  document.querySelectorAll(".bottom-sheet").forEach(m => m.classList.remove("modal-open"));

  activeModalSheet = document.getElementById(modalId);
  const backdrop = document.getElementById("modalBackdrop");

  if (!activeModalSheet) return;
  
  backdrop.classList.remove("hidden");
  setTimeout(() => {
    backdrop.classList.remove("opacity-0");
    activeModalSheet.classList.add("modal-open");
  }, 10);
}

function closeModal() {
  if (activeModalSheet) {
    activeModalSheet.classList.remove("modal-open");
    const backdrop = document.getElementById("modalBackdrop");
    backdrop.classList.add("opacity-0");
    setTimeout(() => {
      backdrop.classList.add("hidden");
      activeModalSheet = null;
    }, 300);
  }
}

function poblarSelects() {
  const selectGasto = document.getElementById("modalGastoVacante");
  const selectHora = document.getElementById("modalHoraVacante");
  const optionsVacantes = DB.vacantes.map(v => `<option value="${v.id_vacante}">${v.titulo_puesto}</option>`).join("");
  if (selectGasto) selectGasto.innerHTML = optionsVacantes;
  if (selectHora) selectHora.innerHTML = optionsVacantes;

  const selectClientes = document.getElementById("modalVacanteCliente");
  if (selectClientes) selectClientes.innerHTML = DB.clientes.map(c => `<option value="${c.id_cliente}">${c.nombre_comercial}</option>`).join("");

  const selectServicios = document.getElementById("modalVacanteServicio");
  if (selectServicios) selectServicios.innerHTML = DB.servicios.map(s => `<option value="${s.id_servicio}">${s.nombre_servicio}</option>`).join("");

  poblarSelectoresRegiones();
}

function poblarSelectoresRegiones() {
  const optionsRegiones = DB.regiones.map(r => `<option value="${r.nombre_region}">${r.nombre_region}</option>`).join("");

  const selectFiltroReg = document.getElementById("selectFiltroRegion");
  if (selectFiltroReg) {
    const prevVal = selectFiltroReg.value || "Todas";
    selectFiltroReg.innerHTML = `<option value="Todas">🌍 Todas</option>` + optionsRegiones;
    selectFiltroReg.value = prevVal;
  }

  const selectRegVacante = document.getElementById("nuevaVacanteRegionSelect");
  if (selectRegVacante) selectRegVacante.innerHTML = optionsRegiones;

  const selectRegCliente = document.getElementById("clienteDirectoRegionSelect");
  if (selectRegCliente) selectRegCliente.innerHTML = optionsRegiones;

  const selectRegClienteInline = document.getElementById("nuevoClienteRegionSelect");
  if (selectRegClienteInline) selectRegClienteInline.innerHTML = optionsRegiones;
}

function guardarNuevaRegion(inputId, boxId, targetSelectId) {
  const input = document.getElementById(inputId);
  const nombre = input ? input.value.trim() : "";

  if (!nombre) {
    alert("Ingresa un nombre para la región / estado");
    return;
  }

  const existe = DB.regiones.find(r => r.nombre_region.toLowerCase() === nombre.toLowerCase());
  let idRegion = existe ? existe.id_region : `REG-${Date.now().toString().slice(-4)}`;

  if (!existe) {
    const nuevaReg = { id_region: idRegion, nombre_region: nombre };
    DB.regiones.push(nuevaReg);
    poblarSelectoresRegiones();

    sendToAppsScript({
      action: "create",
      targetSheet: "CAT_REGIONES",
      payload: [idRegion, nombre]
    });
  }

  const targetSelect = document.getElementById(targetSelectId);
  if (targetSelect) targetSelect.value = nombre;

  const box = document.getElementById(boxId);
  if (box) box.classList.add("hidden");
  if (input) input.value = "";
}

function actualizarValoresServicio() {
  const srvId = document.getElementById("modalVacanteServicio").value;
  const srv = DB.servicios.find(s => s.id_servicio === srvId);
  if (srv) {
    const el = document.getElementById("nuevaVacanteGarantia");
    if (el) el.value = srv.dias_garantia_defecto;
  }
}

function guardarNuevoServicio() {
  const nombre = document.getElementById("nuevoServicioNombre").value.trim();
  const dias = parseInt(document.getElementById("nuevoServicioGarantia").value) || 30;

  if (!nombre) {
    alert("Ingresa un nombre para el servicio");
    return;
  }

  const idServicio = `SRV-${Date.now().toString().slice(-4)}`;
  const nuevoSrv = { id_servicio: idServicio, nombre_servicio: nombre, dias_garantia_defecto: dias, sla_meta_dias: 20 };
  
  DB.servicios.push(nuevoSrv);
  poblarSelects();
  document.getElementById("modalVacanteServicio").value = idServicio;
  document.getElementById("nuevaVacanteGarantia").value = dias;
  document.getElementById("boxNuevoServicio").classList.add("hidden");
  document.getElementById("nuevoServicioNombre").value = "";

  sendToAppsScript({
    action: "create",
    targetSheet: "CAT_SERVICIOS",
    payload: [idServicio, nombre, dias, 1.0, 20]
  });
}

function renderizarApp() {
  if (currentTab === "analytics") {
    renderizarAnaliticas();
    return;
  }
  if (currentTab === "clientes") {
    renderizarDirectorioClientes();
    return;
  }

  const container = document.getElementById("vacantesContainer");
  const searchVal = document.getElementById("inputSearch").value.toLowerCase().trim();
  container.innerHTML = "";

  let totalFees = 0;
  let totalGastos = 0;
  let totalPorCobrarGlobal = 0;

  const vacantesFiltradas = DB.vacantes.filter(v => {
    const cliente = DB.clientes.find(c => String(c.id_cliente) === String(v.id_cliente));
    const matchSearch = v.titulo_puesto.toLowerCase().includes(searchVal) || 
                        (cliente && cliente.nombre_comercial.toLowerCase().includes(searchVal)) ||
                        (v.region && v.region.toLowerCase().includes(searchVal));

    if (!matchSearch) return false;

    if (filtroRegionActual !== "Todas") {
      const reg = (v.region || (cliente ? cliente.region : "")).toLowerCase();
      if (!reg.includes(filtroRegionActual.toLowerCase())) return false;
    }

    if (filtroEstadoActual === "Todas") return true;
    if (filtroEstadoActual === "En Proceso") return v.estatus_vacante === "En Proceso";
    if (filtroEstadoActual === "Contratado") return v.estatus_vacante === "Contratado";
    if (filtroEstadoActual === "Garantia") return v.estatus_vacante === "Contratado" && calcularDiasGarantia(v).diasRestantes > 0;
    if (filtroEstadoActual === "Cobranza") {
      const saldo = Number(v.fee_pactado_total || 0) - Number(v.monto_adelanto || 0);
      return v.saldo_liquidado !== "Sí" && saldo > 0;
    }
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

    const saldoPendiente = (v.saldo_liquidado === "Sí") ? 0 : Math.max(0, Number(v.fee_pactado_total || 0) - Number(v.monto_adelanto || 0));
    if (saldoPendiente > 0) totalPorCobrarGlobal += saldoPendiente;

    if (v.estatus_vacante === "En Proceso") totalFees += Number(v.fee_pactado_total);
    totalGastos += gastosVacante;

    const infoGarantia = calcularDiasGarantia(v);
    const infoSla = calcularSlaProceso(v);

    const card = document.createElement("div");
    card.className = "bg-[#131B2B] rounded-2xl border border-slate-800/90 p-4 shadow-lg shadow-black/40 relative overflow-hidden cursor-pointer active:scale-[0.99] transition-all hover:border-amber-500/40";
    
    const badgeEstatusHTML = v.estatus_vacante === 'En Proceso' ? `
      <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
        <span class="relative flex h-2 w-2">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
        </span>
        En Proceso
      </span>
    ` : `
      <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
        <i class="ph-bold ph-check-circle text-xs"></i>
        Contratado
      </span>
    `;

    card.innerHTML = `
      <div class="flex items-start justify-between gap-2">
        <div>
          <span class="text-[11px] font-bold tracking-wider uppercase text-amber-400/90 block">${cliente.nombre_comercial}</span>
          <h3 class="text-sm font-bold text-white font-serif leading-tight mt-0.5">${v.titulo_puesto}</h3>
        </div>
        <div class="flex flex-col items-end gap-1">
          ${badgeEstatusHTML}
          ${saldoPendiente > 0 ? `
            <span class="text-[9px] px-2 py-0.5 rounded font-bold bg-rose-950/40 text-rose-300 border border-rose-800/40">
              Saldo: $${saldoPendiente.toLocaleString()}
            </span>
          ` : `
            <span class="text-[9px] px-2 py-0.5 rounded font-bold bg-emerald-950/40 text-emerald-300 border border-emerald-800/40">
              ✓ Pagado
            </span>
          `}
        </div>
      </div>

      <div class="flex items-center gap-3 mt-2 text-xs text-slate-400">
        <span><i class="ph-bold ph-map-pin text-amber-400"></i> ${v.region || 'N/A'}</span>
        <span><i class="ph-bold ph-clock text-amber-400"></i> ${totalHoras} hrs</span>
        <span class="${infoSla.color} font-semibold flex items-center gap-1">
          <i class="ph-bold ph-timer"></i> ${infoSla.texto}
        </span>
      </div>

      ${v.estatus_vacante === 'Contratado' ? `
        <div class="mt-3 p-2.5 rounded-xl bg-[#0F1626] border border-slate-800 flex items-center justify-between text-xs">
          <div class="flex items-center gap-1.5">
            <i class="ph-bold ph-shield-check text-base text-amber-400"></i>
            <span class="font-medium text-slate-300">Garantía (${v.dias_garantia_pactados}d):</span>
          </div>
          <span class="font-bold ${infoGarantia.color}">${infoGarantia.texto}</span>
        </div>
      ` : ''}

      <div class="mt-3 pt-3 border-t border-slate-800 grid grid-cols-3 gap-1 text-center">
        <div>
          <span class="text-[10px] text-slate-400 font-semibold block uppercase">Fee Total</span>
          <span class="text-xs font-bold text-amber-300">$${Number(v.fee_pactado_total).toLocaleString()}</span>
        </div>
        <div>
          <span class="text-[10px] text-slate-400 font-semibold block uppercase">Invertido</span>
          <span class="text-xs font-bold text-rose-400">$${costoTotal.toLocaleString()}</span>
        </div>
        <div>
          <span class="text-[10px] text-slate-400 font-semibold block uppercase">Margen</span>
          <span class="text-xs font-black ${margenPorcentaje >= 40 ? 'text-emerald-400' : 'text-amber-400'}">${margenPorcentaje}%</span>
        </div>
      </div>

      <div class="mt-3.5 flex flex-wrap gap-2">
        <button class="btn-card-gasto flex-1 py-2 bg-[#162032] hover:bg-[#1A2438] text-slate-200 border border-slate-700/60 rounded-xl text-xs font-bold active:scale-95 transition-all flex items-center justify-center gap-1">
          <i class="ph-bold ph-receipt text-amber-400"></i> + Gasto
        </button>
        <button class="btn-card-hora flex-1 py-2 bg-[#162032] hover:bg-[#1A2438] text-slate-200 border border-slate-700/60 rounded-xl text-xs font-bold active:scale-95 transition-all flex items-center justify-center gap-1">
          <i class="ph-bold ph-clock text-amber-400"></i> + Horas
        </button>
        ${v.estatus_vacante === 'En Proceso' ? `
          <button class="btn-card-contratar w-full py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-xl text-xs font-bold active:scale-95 transition-all flex items-center justify-center gap-1 shadow-md shadow-emerald-600/20">
            <i class="ph-bold ph-check-circle text-sm"></i> Marcar Contratada
          </button>
        ` : ''}
      </div>
    `;

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

  setText("totalFeesActivos", `$${totalFees.toLocaleString()}`);
  setText("totalPorCobrar", `$${totalPorCobrarGlobal.toLocaleString()}`);
  setText("totalInversion", `$${totalGastos.toLocaleString()}`);
}

function calcularSlaProceso(vacante) {
  const inicio = parsearFechaSegura(vacante.fecha_inicio_proceso);
  if (!inicio) return { dias: 0, texto: "Sin fecha", color: "text-slate-400" };
  
  const srv = DB.servicios.find(s => String(s.id_servicio) === String(vacante.id_servicio)) || { sla_meta_dias: 20 };
  const meta = srv.sla_meta_dias || 20;

  const fin = vacante.fecha_contratacion ? (parsearFechaSegura(vacante.fecha_contratacion) || new Date()) : new Date();
  const transcurridos = Math.max(1, Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24)));

  if (vacante.estatus_vacante === "Contratado") {
    return { dias: transcurridos, texto: `Cerrada en ${transcurridos}d`, color: transcurridos <= meta ? "text-emerald-400" : "text-amber-400" };
  }

  if (transcurridos > meta) return { dias: transcurridos, texto: `${transcurridos}d (SLA Excedido)`, color: "text-rose-400" };
  if (transcurridos >= meta - 3) return { dias: transcurridos, texto: `${transcurridos}/${meta}d (Por vencer)`, color: "text-amber-400" };
  return { dias: transcurridos, texto: `${transcurridos}/${meta}d SLA`, color: "text-cyan-400" };
}

function abrirExpediente(vacante) {
  vacanteSeleccionadaExpediente = vacante;
  const cliente = DB.clientes.find(c => String(c.id_cliente) === String(vacante.id_cliente)) || { nombre_comercial: "Empresa", region: "General", contacto_whatsapp: "" };
  const servicio = DB.servicios.find(s => String(s.id_servicio) === String(vacante.id_servicio)) || { nombre_servicio: "Reclutamiento", sla_meta_dias: 20 };

  const gastosVacante = DB.gastos.filter(g => String(g.id_vacante) === String(vacante.id_vacante));
  const totalGastos = gastosVacante.reduce((sum, g) => sum + Number(g.monto || 0), 0);
  
  const horasVacante = DB.horas.filter(h => String(h.id_vacante) === String(vacante.id_vacante));
  const costoHoras = horasVacante.reduce((sum, h) => sum + (Number(h.horas_invertidas || 0) * Number(h.costo_por_hora || 0)), 0);

  const inversionTotal = totalGastos + costoHoras;
  const feeTotal = Number(vacante.fee_pactado_total || 0);
  const gananciaNeta = feeTotal - inversionTotal;

  const infoSla = calcularSlaProceso(vacante);

  setText("expPuesto", vacante.titulo_puesto);
  setText("expSubtitulo", `${cliente.nombre_comercial} • Región ${vacante.region || cliente.region}`);

  const headerAcciones = document.getElementById("expAccionesContactoHeader");
  if (headerAcciones) {
    headerAcciones.innerHTML = `
      ${cliente.contacto_whatsapp ? `
        <a href="https://wa.me/52${limpiarTelefono(cliente.contacto_whatsapp)}?text=Hola%20${encodeURIComponent(cliente.contacto_nombre || cliente.nombre_comercial)},%20te%20contacto%20sobre%20la%20vacante%20de%20${encodeURIComponent(vacante.titulo_puesto)}" target="_blank" class="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs hover:bg-emerald-500/30">
          <i class="ph-bold ph-whatsapp-logo"></i>
        </a>
        <a href="tel:${limpiarTelefono(cliente.contacto_whatsapp)}" class="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs hover:bg-cyan-500/30">
          <i class="ph-bold ph-phone"></i>
        </a>
      ` : ''}
      ${cliente.contacto_email ? `
        <a href="mailto:${cliente.contacto_email}?subject=Seguimiento:%20${encodeURIComponent(vacante.titulo_puesto)}" class="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs hover:bg-amber-500/30">
          <i class="ph-bold ph-envelope"></i>
        </a>
      ` : ''}
    `;
  }

  setText("expFee", `$${feeTotal.toLocaleString()}`);
  setText("expInversion", `$${inversionTotal.toLocaleString()}`);
  setText("expGanancia", `$${gananciaNeta.toLocaleString()}`);
  setText("expSlaStatus", `${infoSla.dias} días`);

  renderPipelineVacante(vacante);

  const badgeEstatus = document.getElementById("expBadgeEstatus");
  if (badgeEstatus) {
    if (vacante.estatus_vacante === "En Proceso") {
      badgeEstatus.innerHTML = `
        <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
          <i class="ph-bold ph-circle-notch animate-spin text-amber-400"></i> En Proceso
        </span>
      `;
    } else {
      badgeEstatus.innerHTML = `
        <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
          <i class="ph-bold ph-check-circle text-emerald-400"></i> Contratado
        </span>
      `;
    }
  }

  const fechaInicioObj = parsearFechaSegura(vacante.fecha_inicio_proceso);
  const fechaContratacionObj = parsearFechaSegura(vacante.fecha_contratacion);

  setText("expFechaInicio", fechaInicioObj ? formatearFechaISO(fechaInicioObj) : "--");
  setText("expFechaContratacion", fechaContratacionObj ? formatearFechaISO(fechaContratacionObj) : "En proceso");
  setText("expCandidato", vacante.candidato_contratado || "No asignado aún");
  setText("expTipoServicio", servicio.nombre_servicio);

  const boxPerfil = document.getElementById("boxDetallePerfilPuesto");
  if (boxPerfil) {
    boxPerfil.classList.add("hidden");
    boxPerfil.textContent = vacante.descripcion_perfil || "Sin descripción detallada del puesto.";
  }
  setText("btnPerfilPuestoText", "Ver Perfil de Puesto");

  const anticipo = Number(vacante.monto_adelanto || 0);
  const saldo = (vacante.saldo_liquidado === "Sí") ? 0 : Math.max(0, feeTotal - anticipo);

  setText("expCobranzaAnticipo", `$${anticipo.toLocaleString()}`);
  
  const elSaldo = document.getElementById("expCobranzaSaldo");
  if (elSaldo) {
    elSaldo.textContent = saldo === 0 ? "✓ Liquidado (100%)" : `$${saldo.toLocaleString()} pendiente`;
    elSaldo.className = saldo === 0 ? "font-bold text-emerald-400" : "font-bold text-amber-400";
  }

  setText("expGarantiaPactada", `${vacante.dias_garantia_pactados} días`);
  
  if (fechaContratacionObj) {
    const fcLimite = new Date(fechaContratacionObj);
    fcLimite.setDate(fcLimite.getDate() + Number(vacante.dias_garantia_pactados || 30));
    setText("expGarantiaLimite", formatearFechaISO(fcLimite));
  } else {
    setText("expGarantiaLimite", "N/A");
  }

  const infoGarantia = calcularDiasGarantia(vacante);
  setText("expGarantiaEstatus", infoGarantia.texto);
  setText("expObservaciones", vacante.descripcion_perfil ? (vacante.descripcion_perfil.slice(0, 100) + "...") : "Sin observaciones registradas.");
  
  const boxEditObs = document.getElementById("boxEditObservaciones");
  if (boxEditObs) boxEditObs.classList.add("hidden");

  renderHistorialGastosExpediente(gastosVacante, costoHoras, inversionTotal);
  
  const formGastoIn = document.getElementById("formGastoInline");
  if (formGastoIn) formGastoIn.classList.add("hidden");

  const btnFinalizar = document.getElementById("btnExpFinalizar");
  const btnReactivarGarantia = document.getElementById("btnExpGarantiaReactivar");

  if (vacante.estatus_vacante === "Contratado") {
    if (btnFinalizar) btnFinalizar.classList.add("hidden");
    if (btnReactivarGarantia) {
      if (infoGarantia.diasRestantes > 0 && vacante.garantia_aplicada === "No") {
        btnReactivarGarantia.classList.remove("hidden");
      } else {
        btnReactivarGarantia.classList.add("hidden");
      }
    }
  } else {
    if (btnFinalizar) btnFinalizar.classList.remove("hidden");
    if (btnReactivarGarantia) btnReactivarGarantia.classList.add("hidden");
  }

  openModal("modalExpediente");
}

function renderPipelineVacante(vacante) {
  if (!vacante.pipeline) {
    vacante.pipeline = { postulados: 0, filtro: 0, entrevistas: 0, terna: 0, oferta: 0 };
  }

  const container = document.getElementById("pipelineContainer");
  if (!container) return;

  const p = vacante.pipeline;
  const etapas = [
    { key: "postulados", label: "Postulados", color: "text-amber-400" },
    { key: "filtro", label: "Filtro Tel.", color: "text-cyan-400" },
    { key: "entrevistas", label: "Entrevistas", color: "text-amber-300" },
    { key: "terna", label: "En Terna", color: "text-purple-400" },
    { key: "oferta", label: "Oferta", color: "text-emerald-400" }
  ];

  container.innerHTML = etapas.map(e => `
    <div class="p-2 rounded-xl bg-[#0F1626] border border-slate-800 flex flex-col items-center">
      <span class="text-xs font-black ${e.color}">${p[e.key] || 0}</span>
      <span class="text-[9px] font-bold text-slate-400 mt-0.5 leading-none">${e.label}</span>
      <div class="flex gap-1 mt-1.5">
        <button type="button" onclick="window.cambiarPipeline('${vacante.id_vacante}', '${e.key}', -1)" class="btn-pipeline-action w-4 h-4 rounded bg-[#162032] text-slate-300 text-[10px] flex items-center justify-center hover:bg-slate-700 active:scale-90">-</button>
        <button type="button" onclick="window.cambiarPipeline('${vacante.id_vacante}', '${e.key}', 1)" class="btn-pipeline-action w-4 h-4 rounded bg-[#162032] text-slate-300 text-[10px] flex items-center justify-center hover:bg-slate-700 active:scale-90">+</button>
      </div>
    </div>
  `).join("");

  const tasaCalificacion = (p.postulados > 0) ? Math.round((p.filtro / p.postulados) * 100) : 0;
  const efectividadTerna = (p.terna > 0) ? Math.round((p.oferta / p.terna) * 100) : 0;
  
  const gastosAds = DB.gastos.filter(g => String(g.id_vacante) === String(vacante.id_vacante) && g.categoria.includes("Ads")).reduce((s, g) => s + Number(g.monto || 0), 0);
  const costoPorEntrevista = (p.entrevistas > 0 && gastosAds > 0) ? Math.round(gastosAds / p.entrevistas) : 0;

  setText("ratioCalificacion", `${tasaCalificacion}%`);
  setText("ratioTerna", `${efectividadTerna}%`);
  setText("ratioCostoEntrevista", costoPorEntrevista > 0 ? `$${costoPorEntrevista}` : "$0");
}

function enviarReportePipelineWhatsApp() {
  if (!vacanteSeleccionadaExpediente) return;
  const v = vacanteSeleccionadaExpediente;
  const cliente = DB.clientes.find(c => String(c.id_cliente) === String(v.id_cliente));
  const wa = cliente ? limpiarTelefono(cliente.contacto_whatsapp) : "";

  const p = v.pipeline || { postulados: 0, filtro: 0, entrevistas: 0, terna: 0, oferta: 0 };
  const nombreContacto = cliente ? (cliente.contacto_nombre || cliente.nombre_comercial) : "estimado cliente";

  const mensaje = `👋 Hola ${nombreContacto}, te comparto el estatus actualizado de la vacante *${v.titulo_puesto}* en Talentum:%0A%0A` +
    `📊 *Avance del Proceso:*%0A` +
    `• 📥 *Postulados recibidos:* ${p.postulados || 0}%0A` +
    `• 📞 *Filtros telefónicos:* ${p.filtro || 0}%0A` +
    `• 👥 *Entrevistas realizadas:* ${p.entrevistas || 0}%0A` +
    `• 📑 *Candidatos en terna:* ${p.terna || 0}%0A` +
    `• 🎯 *Oferta / Finalista:* ${p.oferta || 0}%0A%0A` +
    `Quedo a tu disposición para cualquier duda. ¡Excelente día!`;

  if (wa) {
    window.open(`https://wa.me/52${wa}?text=${mensaje}`, "_blank");
  } else {
    alert("Este cliente no tiene registrado un número de WhatsApp.");
  }
}

function reactivarPorGarantia() {
  if (!vacanteSeleccionadaExpediente) return;
  if (confirm(`¿Confirmas aplicar reposición de garantía para la vacante ${vacanteSeleccionadaExpediente.titulo_puesto}? Esto abrirá un nuevo proceso con Fee $0 manteniendo el historial.`)) {
    vacanteSeleccionadaExpediente.garantia_aplicada = "Sí (En reposición)";

    const idNueva = `VAC-${Date.now().toString().slice(-4)}`;
    const vacanteReposicion = {
      id_vacante: idNueva,
      id_cliente: vacanteSeleccionadaExpediente.id_cliente,
      titulo_puesto: `${vacanteSeleccionadaExpediente.titulo_puesto} (Reposición)`,
      region: vacanteSeleccionadaExpediente.region,
      id_servicio: vacanteSeleccionadaExpediente.id_servicio,
      fee_pactado_total: 0,
      monto_adelanto: 0,
      saldo_liquidado: "Sí",
      fecha_inicio_proceso: new Date().toISOString().split("T")[0],
      estatus_vacante: "En Proceso",
      fecha_contratacion: "",
      candidato_contratado: "",
      dias_garantia_pactados: vacanteSeleccionadaExpediente.dias_garantia_pactados,
      garantia_aplicada: "No",
      descripcion_perfil: `Proceso de reposición derivado de ${vacanteSeleccionadaExpediente.id_vacante}.\n${vacanteSeleccionadaExpediente.descripcion_perfil}`,
      pipeline: { postulados: 0, filtro: 0, entrevistas: 0, terna: 0, oferta: 0 }
    };

    DB.vacantes.unshift(vacanteReposicion);
    closeModal();
    renderizarApp();

    sendToAppsScript({
      action: "updateGarantia",
      targetSheet: "VACANTES",
      id_vacante: vacanteSeleccionadaExpediente.id_vacante,
      nuevo_estatus_garantia: "Sí (En reposición)"
    });

    sendToAppsScript({
      action: "create",
      targetSheet: "VACANTES",
      payload: [
        vacanteReposicion.id_vacante,
        vacanteReposicion.id_cliente,
        vacanteReposicion.titulo_puesto,
        vacanteReposicion.region,
        vacanteReposicion.id_servicio,
        0, 0, 0,
        vacanteReposicion.fecha_inicio_proceso,
        "En Proceso",
        "",
        vacanteReposicion.dias_garantia_pactados,
        "", "", "No",
        vacanteReposicion.descripcion_perfil,
        JSON.stringify(vacanteReposicion.pipeline)
      ]
    });
  }
}

function renderHistorialGastosExpediente(gastosVacante, costoHoras, inversionTotal) {
  const tableGastos = document.getElementById("expHistorialGastosTable");
  if (!tableGastos) return;
  tableGastos.innerHTML = "";

  if (gastosVacante.length === 0 && costoHoras === 0) {
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

  setText("expHistorialTotalMonto", `$${inversionTotal.toLocaleString()}`);
}

function guardarGastoInlineExpediente(e) {
  e.preventDefault();
  if (!vacanteSeleccionadaExpediente) return;

  const categoria = document.getElementById("inlineGastoCategoria").value;
  const monto = parseFloat(document.getElementById("inlineGastoMonto").value);

  if (isNaN(monto) || monto <= 0) return;

  const nuevoGasto = {
    id_vacante: vacanteSeleccionadaExpediente.id_vacante,
    categoria,
    monto,
    fecha_gasto: new Date().toISOString().split("T")[0]
  };

  DB.gastos.push(nuevoGasto);
  document.getElementById("inlineGastoMonto").value = "";
  document.getElementById("formGastoInline").classList.add("hidden");

  abrirExpediente(vacanteSeleccionadaExpediente);
  renderizarApp();

  sendToAppsScript({
    action: "create",
    targetSheet: "GASTOS_INVERSION",
    payload: [`GST-${Date.now()}`, vacanteSeleccionadaExpediente.id_vacante, categoria, monto, nuevoGasto.fecha_gasto]
  });
}

function togglePerfilPuesto() {
  const box = document.getElementById("boxDetallePerfilPuesto");
  const btnText = document.getElementById("btnPerfilPuestoText");
  if (!box) return;
  const isHidden = box.classList.contains("hidden");

  if (isHidden) {
    box.classList.remove("hidden");
    if (btnText) btnText.textContent = "Ocultar Perfil de Puesto";
  } else {
    box.classList.add("hidden");
    if (btnText) btnText.textContent = "Ver Perfil de Puesto";
  }
}

function guardarObservacionesInline() {
  if (!vacanteSeleccionadaExpediente) return;
  const input = document.getElementById("inputObservaciones");
  const texto = input ? input.value.trim() : "";
  
  vacanteSeleccionadaExpediente.descripcion_perfil = texto;
  setText("expObservaciones", texto || "Sin observaciones registradas.");
  setText("boxDetallePerfilPuesto", texto || "Sin descripción detallada del puesto.");
  
  const boxEdit = document.getElementById("boxEditObservaciones");
  if (boxEdit) boxEdit.classList.add("hidden");
  
  renderizarApp();

  sendToAppsScript({
    action: "updateObservaciones",
    targetSheet: "VACANTES",
    id_vacante: vacanteSeleccionadaExpediente.id_vacante,
    observaciones: texto
  });
}

function renderizarAnaliticas() {
  const totalFacturado = DB.vacantes.reduce((sum, v) => sum + Number(v.fee_pactado_total || 0), 0);
  const totalGastosPauta = DB.gastos.reduce((sum, g) => sum + Number(g.monto || 0), 0);
  const totalHorasHH = DB.horas.reduce((sum, h) => sum + (Number(h.horas_invertidas || 0) * Number(h.costo_por_hora || 0)), 0);
  const totalHorasCantidad = DB.horas.reduce((sum, h) => sum + Number(h.horas_invertidas || 0), 0);

  const costoTotalGeneral = totalGastosPauta + totalHorasHH;
  const utilidadNetaTotal = totalFacturado - costoTotalGeneral;
  const margenGlobalPorcentaje = totalFacturado > 0 ? Math.round((utilidadNetaTotal / totalFacturado) * 100) : 0;
  const roas = totalGastosPauta > 0 ? (totalFacturado / totalGastosPauta).toFixed(1) : "N/A";

  const totalPostulados = DB.vacantes.reduce((sum, v) => sum + Number(v.pipeline ? v.pipeline.postulados || 0 : 0), 0);
  const totalEntrevistas = DB.vacantes.reduce((sum, v) => sum + Number(v.pipeline ? v.pipeline.entrevistas || 0 : 0), 0);
  const totalTernas = DB.vacantes.reduce((sum, v) => sum + Number(v.pipeline ? v.pipeline.terna || 0 : 0), 0);

  setText("kpiUtilidadNeta", `$${utilidadNetaTotal.toLocaleString()}`);
  setText("kpiMargenGlobal", `${margenGlobalPorcentaje}% Margen`);
  setText("kpiFacturadoTotal", `$${totalFacturado.toLocaleString()}`);
  setText("kpiGastoPautaTotal", `$${totalGastosPauta.toLocaleString()}`);
  setText("kpiCostoHorasTotal", `$${totalHorasHH.toLocaleString()}`);
  setText("kpiRoas", roas === "N/A" ? "N/A" : `${roas}x`);
  setText("kpiHorasTotales", `${totalHorasCantidad} hrs`);

  setText("kpiTotalPostulados", totalPostulados.toLocaleString());
  setText("kpiTotalEntrevistas", totalEntrevistas.toLocaleString());
  setText("kpiTotalTernas", totalTernas.toLocaleString());

  const containerBreakdown = document.getElementById("breakdownGastos");
  if (containerBreakdown) {
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
        <div class="flex justify-between text-xs font-semibold text-slate-300 mb-1">
          <span>${cat}</span>
          <span>$${monto.toLocaleString()} <span class="text-slate-500 font-normal">(${pct}%)</span></span>
        </div>
        <div class="w-full bg-[#0B0F17] rounded-full h-2 overflow-hidden border border-slate-800">
          <div class="bg-gradient-to-r from-amber-500 to-amber-400 h-2 rounded-full" style="width: ${pct}%"></div>
        </div>
      `;
      containerBreakdown.appendChild(row);
    });
  }

  const containerClientes = document.getElementById("tablaRentabilidadClientes");
  if (!containerClientes) return;
  containerClientes.innerHTML = "";

  DB.clientes.forEach(c => {
    const vacantesCliente = DB.vacantes.filter(v => String(v.id_cliente) === String(c.id_cliente));
    if (vacantesCliente.length === 0) return;

    const facturadoCliente = vacantesCliente.reduce((sum, v) => sum + Number(v.fee_pactado_total || 0), 0);
    const idsVacantes = vacantesCliente.map(v => String(v.id_vacante));

    const gastosPautaCliente = DB.gastos
      .filter(g => idsVacantes.includes(String(g.id_vacante)))
      .reduce((sum, g) => sum + Number(g.monto || 0), 0);

    const horasClienteArr = DB.horas.filter(h => idsVacantes.includes(String(h.id_vacante)));
    const totalHorasCliente = horasClienteArr.reduce((sum, h) => sum + Number(h.horas_invertidas || 0), 0);
    const costoHorasCliente = horasClienteArr.reduce((sum, h) => sum + (Number(h.horas_invertidas || 0) * Number(h.costo_por_hora || 0)), 0);

    const inversionTotalCliente = gastosPautaCliente + costoHorasCliente;
    const netoCliente = facturadoCliente - inversionTotalCliente;
    const margenCliente = facturadoCliente > 0 ? Math.round((netoCliente / facturadoCliente) * 100) : 0;
    const roasCliente = gastosPautaCliente > 0 ? (facturadoCliente / gastosPautaCliente).toFixed(1) : "N/A";

    const isOpen = clienteAbiertoDetalle === c.id_cliente;

    const card = document.createElement("div");
    card.className = "rounded-2xl bg-[#0F1626] border border-slate-800 overflow-hidden transition-all duration-200 shadow-sm";
    
    card.innerHTML = `
      <div class="p-3.5 flex items-center justify-between cursor-pointer hover:bg-[#162032] transition-colors" data-client-id="${c.id_cliente}">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center justify-center font-black text-xs">
            ${c.nombre_comercial.slice(0,2).toUpperCase()}
          </div>
          <div>
            <h4 class="text-xs font-bold text-white font-serif leading-tight">${c.nombre_comercial}</h4>
            <span class="text-[11px] text-slate-400">${vacantesCliente.length} vacante(s) • Facturado: $${facturadoCliente.toLocaleString()}</span>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <div class="text-right">
            <span class="text-xs font-black ${netoCliente >= 0 ? 'text-emerald-400' : 'text-rose-400'}">+$${netoCliente.toLocaleString()}</span>
            <span class="text-[10px] font-bold block text-slate-500">${margenCliente}% neto</span>
          </div>
          <i class="ph-bold ${isOpen ? 'ph-caret-up' : 'ph-caret-down'} text-amber-400 text-sm transition-transform"></i>
        </div>
      </div>

      <div class="${isOpen ? 'block' : 'hidden'} px-3.5 pb-3.5 pt-1 border-t border-slate-800 space-y-3 bg-[#0B0F17]">
        <div class="p-2.5 rounded-xl bg-[#0F1626] border border-slate-800 flex items-center justify-between">
          <div>
            <span class="text-[10px] text-slate-400 font-semibold block uppercase">Contacto Principal</span>
            <span class="text-xs font-bold text-slate-200">${c.contacto_nombre || 'No asignado'}</span>
            <span class="text-[11px] text-slate-400 block">${c.contacto_whatsapp || 'Sin WhatsApp'} ${c.contacto_email ? '• ' + c.contacto_email : ''}</span>
          </div>
          <div class="flex items-center gap-1.5">
            ${c.contacto_whatsapp ? `
              <a href="https://wa.me/52${limpiarTelefono(c.contacto_whatsapp)}?text=Hola%20${encodeURIComponent(c.contacto_nombre || c.nombre_comercial)},%20te%20saludo%20de%20Talentum" target="_blank" class="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center text-sm shadow-sm active:scale-95" title="Enviar WhatsApp">
                <i class="ph-bold ph-whatsapp-logo"></i>
              </a>
              <a href="tel:${limpiarTelefono(c.contacto_whatsapp)}" class="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 flex items-center justify-center text-sm shadow-sm active:scale-95" title="Llamar">
                <i class="ph-bold ph-phone"></i>
              </a>
            ` : ''}
            ${c.contacto_email ? `
              <a href="mailto:${c.contacto_email}?subject=Seguimiento%20Talentum" class="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center text-sm shadow-sm active:scale-95" title="Enviar Correo">
                <i class="ph-bold ph-envelope"></i>
              </a>
            ` : ''}
          </div>
        </div>

        <div class="grid grid-cols-3 gap-2 text-center pt-1">
          <div class="p-2 rounded-xl bg-[#0F1626] border border-slate-800">
            <span class="text-[9px] font-bold text-slate-400 uppercase block">Pauta Ads</span>
            <span class="text-xs font-bold text-rose-400">$${gastosPautaCliente.toLocaleString()}</span>
          </div>
          <div class="p-2 rounded-xl bg-[#0F1626] border border-slate-800">
            <span class="text-[9px] font-bold text-slate-400 uppercase block">Horas ($)</span>
            <span class="text-xs font-bold text-amber-300">${totalHorasCliente}h ($${costoHorasCliente.toLocaleString()})</span>
          </div>
          <div class="p-2 rounded-xl bg-[#0F1626] border border-slate-800">
            <span class="text-[9px] font-bold text-slate-400 uppercase block">ROAS</span>
            <span class="text-xs font-black text-amber-400">${roasCliente === 'N/A' ? 'N/A' : roasCliente + 'x'}</span>
          </div>
        </div>

        <div>
          <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">Desglose por Proceso</span>
          <div class="space-y-1.5">
            ${vacantesCliente.map(v => {
              const gastosV = DB.gastos.filter(g => String(g.id_vacante) === String(v.id_vacante)).reduce((s, g) => s + Number(g.monto || 0), 0);
              const horasV = DB.horas.filter(h => String(h.id_vacante) === String(v.id_vacante)).reduce((s, h) => s + (Number(h.horas_invertidas || 0) * Number(h.costo_por_hora || 0)), 0);
              const totalInvV = gastosV + horasV;
              const netoV = Number(v.fee_pactado_total || 0) - totalInvV;
              const margenV = v.fee_pactado_total > 0 ? Math.round((netoV / v.fee_pactado_total) * 100) : 0;

              return `
                <div class="p-2.5 rounded-xl bg-[#0F1626] border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <div class="flex items-center gap-1.5">
                      <span class="font-bold text-white font-serif">${v.titulo_puesto}</span>
                      <span class="text-[9px] px-1.5 py-0.2 rounded font-bold ${v.estatus_vacante === 'En Proceso' ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'}">
                        ${v.estatus_vacante}
                      </span>
                    </div>
                    <span class="text-[10px] text-slate-400">Fee: $${Number(v.fee_pactado_total).toLocaleString()} | Invertido: $${totalInvV.toLocaleString()}</span>
                  </div>
                  <div class="text-right">
                    <span class="font-black text-xs ${netoV >= 0 ? 'text-emerald-400' : 'text-rose-400'}">+$${netoV.toLocaleString()}</span>
                    <span class="text-[9px] font-bold text-slate-500 block">${margenV}%</span>
                  </div>
                </div>
              `;
            }).join("")}
          </div>
        </div>

      </div>
    `;

    card.querySelector("[data-client-id]").addEventListener("click", () => {
      clienteAbiertoDetalle = (clienteAbiertoDetalle === c.id_cliente) ? null : c.id_cliente;
      renderizarAnaliticas();
    });

    containerClientes.appendChild(card);
  });
}

function renderizarDirectorioClientes() {
  const container = document.getElementById("directorioClientesContainer");
  if (!container) return;
  container.innerHTML = "";

  DB.clientes.forEach(c => {
    const vacantesCliente = DB.vacantes.filter(v => String(v.id_cliente) === String(c.id_cliente));
    const activas = vacantesCliente.filter(v => v.estatus_vacante === "En Proceso").length;
    const cerradas = vacantesCliente.filter(v => v.estatus_vacante === "Contratado").length;

    const card = document.createElement("div");
    card.className = "p-4 bg-[#131B2B] rounded-2xl border border-slate-800 space-y-3 shadow-lg shadow-black/30";
    
    card.innerHTML = `
      <div class="flex items-start justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 text-slate-950 flex items-center justify-center font-bold text-sm shadow-md shadow-amber-500/20 font-serif">
            ${c.nombre_comercial.slice(0,2).toUpperCase()}
          </div>
          <div>
            <h3 class="text-sm font-bold text-white font-serif leading-tight">${c.nombre_comercial}</h3>
            <span class="text-xs text-amber-400/80 flex items-center gap-1 mt-0.5">
              <i class="ph-bold ph-map-pin"></i> ${c.region || 'Sin región'}
            </span>
          </div>
        </div>
        <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
          ${c.estatus || 'Activo'}
        </span>
      </div>

      <div class="p-3 bg-[#0F1626] rounded-xl text-xs space-y-1.5 border border-slate-800">
        <div class="flex justify-between">
          <span class="text-slate-400">Contacto:</span>
          <span class="font-bold text-slate-200">${c.contacto_nombre || 'No registrado'}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-slate-400">WhatsApp / Tel:</span>
          <span class="font-semibold text-amber-300">${c.contacto_whatsapp || 'Sin número'}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-slate-400">Correo:</span>
          <span class="font-semibold text-slate-300">${c.contacto_email || 'Sin correo'}</span>
        </div>
        <div class="flex justify-between pt-1.5 border-t border-slate-800">
          <span class="text-slate-400">Vacantes:</span>
          <span class="font-bold text-amber-400">${activas} activas / ${cerradas} cubiertas</span>
        </div>
      </div>

      <div class="flex items-center gap-2 pt-1">
        ${c.contacto_whatsapp ? `
          <a href="https://wa.me/52${limpiarTelefono(c.contacto_whatsapp)}?text=Hola%20${encodeURIComponent(c.contacto_nombre || c.nombre_comercial)},%20te%20saludo%20de%20Talentum" target="_blank" class="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 active:scale-95 transition-transform">
            <i class="ph-bold ph-whatsapp-logo text-base"></i> WhatsApp
          </a>
          <a href="tel:${limpiarTelefono(c.contacto_whatsapp)}" class="px-3.5 py-2.5 bg-[#162032] text-slate-300 hover:text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 border border-slate-700/60 active:scale-95 transition-transform" title="Llamar">
            <i class="ph-bold ph-phone text-base text-cyan-400"></i>
          </a>
        ` : ''}
        ${c.contacto_email ? `
          <a href="mailto:${c.contacto_email}?subject=Seguimiento%20Talentum" class="px-3.5 py-2.5 bg-[#162032] text-slate-300 hover:text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 border border-slate-700/60 active:scale-95 transition-transform" title="Enviar correo">
            <i class="ph-bold ph-envelope text-base text-amber-400"></i>
          </a>
        ` : ''}
      </div>
    `;

    container.appendChild(card);
  });
}

function limpiarTelefono(tel) {
  return String(tel || '').replace(/\D/g, '');
}

function calcularDiasGarantia(vacante) {
  const contratacion = parsearFechaSegura(vacante.fecha_contratacion);
  if (!contratacion) return { diasRestantes: 0, texto: "Sin fecha", color: "text-slate-400" };
  
  const finGarantia = new Date(contratacion);
  finGarantia.setDate(contratacion.getDate() + Number(vacante.dias_garantia_pactados || 30));
  
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const diffTime = finGarantia - hoy;
  const diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (vacante.garantia_aplicada !== "No") return { diasRestantes: 0, texto: "Consumida", color: "text-purple-400" };
  if (diasRestantes <= 0) return { diasRestantes: 0, texto: "Vencida", color: "text-rose-400" };
  if (diasRestantes <= 15) return { diasRestantes, texto: `${diasRestantes}d (Por vencer)`, color: "text-amber-400" };
  return { diasRestantes, texto: `${diasRestantes}d restantes`, color: "text-emerald-400" };
}

function abrirModalContratar(vacante) {
  document.getElementById("modalContratarIdVacante").value = vacante.id_vacante;
  setText("modalContratarTitulo", `${vacante.titulo_puesto}`);
  document.getElementById("modalContratarNombreCandidato").value = vacante.candidato_contratado || "";
  document.getElementById("modalContratarFecha").value = new Date().toISOString().split("T")[0];
  openModal("modalSheetContratar");
}

async function procesarContratacion(e) {
  e.preventDefault();
  const idVacante = document.getElementById("modalContratarIdVacante").value;
  const fecha = document.getElementById("modalContratarFecha").value;
  const candidato = document.getElementById("modalContratarNombreCandidato").value.trim();
  const liquidar = document.getElementById("checkLiquidarSaldo").checked;

  const vacante = DB.vacantes.find(v => String(v.id_vacante) === String(idVacante));
  if (vacante) {
    vacante.estatus_vacante = "Contratado";
    vacante.fecha_contratacion = fecha;
    vacante.candidato_contratado = candidato;
    if (liquidar) vacante.saldo_liquidado = "Sí";
  }

  closeModal();
  renderizarApp();

  sendToAppsScript({
    action: "updateContratacion",
    targetSheet: "VACANTES",
    id_vacante: idVacante,
    fecha_contratacion: fecha,
    candidato_contratado: candidato,
    saldo_liquidado: liquidar ? "Sí" : "No"
  });
}

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

async function guardarVacante(e) {
  e.preventDefault();
  let idCliente = document.getElementById("modalVacanteCliente").value;
  let region = document.getElementById("nuevaVacanteRegionSelect").value || "Querétaro";

  const boxNuevoCliente = document.getElementById("boxNuevoCliente");
  if (!boxNuevoCliente.classList.contains("hidden")) {
    const nombreCliente = document.getElementById("nuevoClienteNombre").value;
    const contacto = document.getElementById("nuevoClienteContacto").value;
    const regionClienteSelect = document.getElementById("nuevoClienteRegionSelect");
    const regionCliente = regionClienteSelect ? regionClienteSelect.value : region;
    const wa = document.getElementById("nuevoClienteWhatsApp").value;
    const email = document.getElementById("nuevoClienteEmail").value;
    
    idCliente = `CLI-${Date.now().toString().slice(-4)}`;
    DB.clientes.push({ 
      id_cliente: idCliente, 
      nombre_comercial: nombreCliente, 
      region: regionCliente, 
      contacto_nombre: contacto, 
      contacto_whatsapp: wa, 
      contacto_email: email, 
      estatus: "Activo" 
    });

    sendToAppsScript({
      action: "create",
      targetSheet: "CLIENTES",
      payload: [idCliente, nombreCliente, regionCliente, contacto, wa, "Activo", email]
    });
  }

  const idVacante = `VAC-${Date.now().toString().slice(-4)}`;
  const perfilTexto = document.getElementById("nuevaVacantePerfil").value.trim();
  
  const inputFechaInicio = document.getElementById("nuevaVacanteFechaInicio");
  const fechaInicioSeleccionada = inputFechaInicio && inputFechaInicio.value ? inputFechaInicio.value : new Date().toISOString().split('T')[0];

  const nuevaVacante = {
    id_vacante: idVacante,
    id_cliente: idCliente,
    titulo_puesto: document.getElementById("nuevaVacantePuesto").value,
    region: region,
    id_servicio: document.getElementById("modalVacanteServicio").value,
    sueldo_base_perfil: 0,
    fee_pactado_total: parseFloat(document.getElementById("nuevaVacanteFee").value),
    monto_adelanto: parseFloat(document.getElementById("nuevaVacanteAnticipo").value),
    saldo_liquidado: "No",
    fecha_inicio_proceso: fechaInicioSeleccionada,
    estatus_vacante: "En Proceso",
    fecha_contratacion: "",
    candidato_contratado: "",
    dias_garantia_pactados: parseInt(document.getElementById("nuevaVacanteGarantia").value),
    garantia_aplicada: "No",
    descripcion_perfil: perfilTexto,
    pipeline: { postulados: 0, filtro: 0, entrevistas: 0, terna: 0, oferta: 0 }
  };

  DB.vacantes.unshift(nuevaVacante);
  closeModal();
  document.getElementById("formVacante").reset();
  boxNuevoCliente.classList.add("hidden");
  
  if (inputFechaInicio) inputFechaInicio.value = new Date().toISOString().split("T")[0];

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
      nuevaVacante.descripcion_perfil,
      JSON.stringify(nuevaVacante.pipeline)
    ]
  });
}

function guardarClienteDirecto(e) {
  e.preventDefault();
  const nombre = document.getElementById("clienteDirectoNombre").value.trim();
  const contacto = document.getElementById("clienteDirectoContacto").value.trim();
  const regionSelect = document.getElementById("clienteDirectoRegionSelect");
  const region = regionSelect ? regionSelect.value : "Querétaro";
  const wa = document.getElementById("clienteDirectoWhatsApp").value.trim();
  const email = document.getElementById("clienteDirectoEmail").value.trim();

  const idCliente = `CLI-${Date.now().toString().slice(-4)}`;
  const nuevoCliente = {
    id_cliente: idCliente,
    nombre_comercial: nombre,
    region,
    contacto_nombre: contacto,
    contacto_whatsapp: wa,
    contacto_email: email,
    estatus: "Activo"
  };

  DB.clientes.push(nuevoCliente);
  closeModal();
  document.getElementById("formClienteDirecto").reset();
  poblarSelects();
  renderizarDirectorioClientes();

  sendToAppsScript({
    action: "create",
    targetSheet: "CLIENTES",
    payload: [idCliente, nombre, region, contacto, wa, "Activo", email]
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
    
    if (data.regiones && data.regiones.length > 0) DB.regiones = data.regiones;

    if (data.vacantes && data.vacantes.length > 0) {
      DB.vacantes = data.vacantes.map(v => {
        let pipeline = { postulados: 0, filtro: 0, entrevistas: 0, terna: 0, oferta: 0 };
        if (v.pipeline) {
          try {
            pipeline = typeof v.pipeline === "string" ? JSON.parse(v.pipeline) : v.pipeline;
          } catch(e) {}
        }
        return {
          ...v,
          fee_pactado_total: Number(v.fee_pactado_total || 0),
          monto_adelanto: Number(v.monto_adelanto || 0),
          dias_garantia_pactados: Number(v.dias_garantia_pactados || 30),
          pipeline: pipeline
        };
      });
    }

    if (data.clientes && data.clientes.length > 0) DB.clientes = data.clientes;
    if (data.servicios && data.servicios.length > 0) DB.servicios = data.servicios;
    if (data.gastos) DB.gastos = data.gastos;
    if (data.horas) DB.horas = data.horas;

    poblarSelects();
    renderizarApp();
  } catch (err) {
    console.error("Error al obtener datos desde Google Sheets:", err);
  }
}
