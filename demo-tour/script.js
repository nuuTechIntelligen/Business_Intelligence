/**
 * VÍA HA' MÉXICO - MOTOR DE INTELIGENCIA DE NEGOCIO Y RESERVAS ONLINE
 * Código unificado con soporte responsivo para Circuitos de 3 Columnas en PC.
 */

// VARIABLES DE ESTADO LOCAL GLOBAL ELEVADAS
let adultos = 2;                
let ninos = 0; 
let fp = null;                  
let fechaSeleccionada = ""; 
let idiomaActual = "es";        

// Control de modalidad activa ('single' para 1 día, 'circuit' para multidías)
let modalidadActiva = 'single';
let diasCircuitoContador = 2; // El circuito arranca por defecto con 2 días mínimos

const posicionesCarrusel = { cenotes: 0, chichen: 0, coloradas: 0, uxmal: 0, celestun: 0, campeche: 0 }; 
const intervalosCarrusel = { cenotes: null, chichen: null, coloradas: null, uxmal: null, celestun: null, campeche: null }; 

const API_URL = 'https://sheetdb.io/api/v1/2s1p744rscfly?sheet=bloqueos'; 

const catalogoEstructuraTours = {
     chichen: { complementos: ["Cenote Zací / Valladolid", "Izamal", "Cenote Lol-Ha / Taller con Chef", "Chichén Itzá Viejo / Cenote Yodzonot"], plus: ["Avistamiento de aves", "Dinámica de observación"], txt: "Chichén Itzá", cat: "arqueologia" },
     cenotes: { complementos: ["Nah-Yah / Su-hem", "Grutas de Tzabnah", "Homún"], plus: ["Avistamiento de aves", "Dinámica de observación","Hacienda Pixyah","Taller Tekit"], txt: "Tour Cenotes", cat: "cenotes" },
     coloradas: { complementos: [], plus: ["Avistamiento de aves", "Dinámica de observación", "Sesión fotográfica", "Recorrido en lancha", "Paseo ecoturístico"], txt: "Coloradas Tour Day", cat: "aviturismo" },
     uxmal: { complementos: ["Chocostory", "Hda Mucuyché", "Yaal Utzil"], plus: ["Avistamiento de aves", "Dinámica de observación"], txt: "Uxmal", cat: "arqueologia" },
     celestun: { complementos: ["Bote", "Lancha"], plus: ["Avistamiento de aves", "Dinámica de observación"], txt: "Celestún", cat: "aviturismo" },
     campeche: { complementos: ["Tour de 1 dia", "Tour de 2 dias"], plus: ["Temporada de Avistamiento de Flamencos (Noviembre- Febrero)"], txt: "Campeche", cat: "urbano" }
};

const matrizTarifasEscaladas = {
     cenotes: { "Nah-Yah / Su-hem": { 2: 3100, 3: 2150, 4: 3200 }, "Grutas de Tzabnah": { 2: 3100, 3: 1150, 4: 800 }, "Homún": { 2: 3100, 3: 1150, 4: 800 } },
     chichen: { "Cenote Zací / Valladolid": { 2: 3760, 3: 1300, 4: 1000 }, "Izamal": { 2: 3400, 3: 1150, 4: 900 }, "Cenote Lol-Ha / Taller con Chef": { 2: 3400, 3: 1150, 4: 900 }, "Chichén Itzá Viejo / Cenote Yodzonot": { 2: 3400, 3: 1150, 4: 900 } },
     coloradas: { "Ruta Fija Corrida": { 2: 4050, 3: 1350, 4: 1050 } },
     uxmal: { "Chocostory": { 2: 3360, 3: 1150, 4: 900 }, "Hda Mucuyché": { 2: 3360, 3: 1150, 4: 900 }, "Yaal Utzil": { 2: 3360, 3: 1150, 4: 900 } },
     celestun: { "Bote": { 2: 3380, 3: 1150, 4: 900 }, "Lancha": { 2: 3380, 3: 1150, 4: 900 } },
     campeche: { "Tour de 1 dia": { 2: 3400, 3: 1150, 4: 850 }, "Tour de 2 dias": { 2: 6800, 3: 2250, 4: 1700 } }
};

const traducciones = { 
      es: { 
          hero_title: "VIA HA' MÉXICO", hero_badge: "✨ Sumérgete al Mayab", pregunta_tour: "¿Qué paraíso quieres visitar hoy?", tour_cenotes: "SUMERGETE A CENOTES", tour_chichen: "Chichén Itzá", tour_coloradas: "Coloradas Tour Day", tour_uxmal: "Uxmal", tour_celestun: "Celestún", tour_campeche: "Campeche",
          titulo_cotizador: "Cotiza tu grupo", label_nombre: "Nombre", ph_nombre: "Escribe tu nombre completo...", label_fecha: "Fecha del Recorrido", ph_fecha: "Selecciona una fecha o rango...", label_adultos: "Adultos", label_ninos: "Niños (-12 años)", total_estimado: "Total Estimado (Servicio Privado):", btn_reservar: "Reservar por WhatsApp", alert_nombre: "Por favor, ingresa tu nombre completo para personalizar tu cotización.", alert_fecha: "Por favor, selecciona una fecha disponible.", 
          wa_saludo: "¡Hola! Me interesa reservar con *VÍA HA' MÉXICO*:\n\n", wa_nombre: "👤 *Nombre:*", wa_tour: "🌴 *Tour:*", wa_fecha: "📅 *Fecha o Período:*", wa_adultos: "👥 *Adultos:*", wa_ninos: "👶 *Niños:*", wa_total: "💰 *Total estimado:*", wa_pregunta: "¿Tienen disponibilidad para estas condiciones?"
      }, 
      en: { 
          hero_title: "VIA HA' MÉXICO", hero_badge: "✨ Immerse yourself in the Mayab", pregunta_tour: "What paradise do you want to visit today?", tour_cenotes: "Cenotes Tour", tour_chichen: "Chichen Itza", tour_coloradas: "Coloradas Tour Day", tour_uxmal: "Uxmal", tour_celestun: "Celestun", tour_campeche: "Campeche",
          titulo_cotizador: "Quote your group", label_nombre: "Name", ph_nombre: "Enter your full name...", label_fecha: "Tour Date", ph_fecha: "Select a date or range...", label_adultos: "Adultos", label_ninos: "Children (Under 12)", total_estimado: "Estimated Total (Private Service):", btn_reservar: "Book via WhatsApp", alert_nombre: "Please enter your full name to customize your quote.", alert_fecha: "Please select an available date.", 
          wa_saludo: "Hello! I am interested in booking with *VÍA HA' MÉXICO*:\n\n", wa_nombre: "👤 *Name:*", wa_tour: "🌴 *Tour:*", wa_fecha: "📅 *Dates:*", wa_adultos: "👥 *Adults:*", wa_ninos: "👶 *Children:*", wa_total: "💰 *Estimated Total:*", wa_pregunta: "Do you have availability for these conditions?"
      } 
}; 

/**
 * Inicializador maestro.
 */
async function inicializarSistema() {  
      while (typeof flatpickr === 'undefined') {  
          await new Promise(resolve => setTimeout(resolve, 100));  
      }  
      try {          
          cargarBloqueos();  
          inicializarSoportesTactiles();   
          renderizarEstructuraSegunModalidad();
          inicializarCalendario();  
          calcular();  
      } catch (error) {  
          console.error("❌ Error en inicialización:", error.message);  
      }  
}  

function inicializarCalendario() {  
      const campoFecha = document.getElementById('fecha-reserva');  
      if (!campoFecha) return;  
      if (fp) fp.destroy();   

      const minDiasRequeridos = (modalidadActiva === 'circuit') ? diasCircuitoContador : 1;

      fp = flatpickr(campoFecha, {  
          locale: "es", 
          mode: "range", minDate: "today", dateFormat: "Y-m-d", altInput: true, altFormat: "d/m/Y", altInputClass: "flatpickr-input", disableMobile: true, disable: [],   
          onChange: function(selectedDates, dateStr) {  
              fechaSeleccionada = dateStr;  
              
              if (modalidadActiva === 'circuit' && selectedDates.length === 2) {
                  const milisegundosPorDia = 24 * 60 * 60 * 1000;
                  const diasRealesSeleccionados = Math.round(Math.abs((selectedDates[1] - selectedDates[0]) / milisegundosPorDia)) + 1;
                  
                  if (diasRealesSeleccionados < minDiasRequeridos) {
                      alert(`⚠️ Alerta Vía Há: Tu circuito tiene ${minDiasRequeridos} días planeados. Por favor, selecciona un rango de fechas de mínimo ${minDiasRequeridos} días en el calendario.`);
                      fp.clear();
                      fechaSeleccionada = "";
                  }
              }
              gtag('event', 'seleccion_fecha_viaje', { 'rango_fechas': dateStr, 'modalidad': modalidadActiva });  
          }  
      });  
}  

/**
 * MODIFICACIÓN MAESTRA: Control de inyección de clases CSS dinámicas para activar las 3 Columnas en PC
 */
function cambiarModalidad(tipo) {
    modalidadActiva = tipo;
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    
    const mainContainer = document.getElementById('viaha-main-container');

    if (tipo === 'single') {
        document.getElementById('tab-single').classList.add('active');
        document.getElementById('label-fecha-dinamica').innerText = "Fecha del Recorrido";
        if(mainContainer) mainContainer.classList.remove('modo-circuito-activo'); // Regresa a 2 columnas
    } else {
        document.getElementById('tab-circuit').classList.add('active');
        document.getElementById('label-fecha-dinamica').innerText = "Período del Circuito (Fechas)";
        if(mainContainer) mainContainer.classList.add('modo-circuito-activo');    // Dispara las 3 columnas
    }
    
    renderizarEstructuraSegunModalidad();
    inicializarCalendario();
    calcular();
}

function renderizarEstructuraSegunModalidad() {
    const contenedorSuperiorSelector = document.getElementById('wrapper-selector-single-fijo');
    const contenedorInferiorDinamico = document.getElementById('seccion-personalizacion-tour');
    if (!contenedorSuperiorSelector || !contenedorInferiorDinamico) return;

    if (modalidadActiva === 'single') {
        contenedorSuperiorSelector.style.display = 'block';
        contenedorInferiorDinamico.innerHTML = `<div id="wrapper-personalizacion-single"></div>`;
        renderizarCamposSingle();
        
        const select = document.getElementById('tour-select');
        if(select) mostrarTarjetaCatalogo(select.value);
    } else {
        contenedorSuperiorSelector.style.display = 'none';
        
        let htmlAcordeones = `<label class="section-title" style="margin-bottom:15px; display:block;">🗺️ Itinerario del Circuito Privado (Por Días)</label><div id="accordion-circuito-container">`;
        
        for (let i = 1; i <= diasCircuitoContador; i++) {
            htmlAcordeones += `
                <div class="accordion-item-circuito ${i === 1 ? 'open' : ''}" id="accordion-dia-${i}">
                    <div class="accordion-header-dia" onclick="toggleAccordion(${i})">
                        <span>☀️ DÍA ${i} - Configuración de Ruta</span>
                        <div style="display:flex; align-items:center; gap:10px;">
                            ${i > 2 ? `<button type="button" class="btn-remove-dia" onclick="eliminarDiaCircuito(event, ${i})">❌ Quitar</button>` : ''}
                            <span class="accordion-indicator-icon">▼</span>
                        </div>
                    </div>
                    <div class="accordion-content-dia">
                        <label class="input-label" style="font-size:14px; margin-top:5px;">Elige el Destino para este día:</label>
                        <select class="tour-picker picker-circuito-destino" data-dia="${i}" onchange="cambiarDestinoDiaCircuito(${i}, this.value)">
                            <option value="chichen">CHICHÉN ITZÁ</option>
                            <option value="cenotes">SUMERGETE A CENOTES</option>
                            <option value="coloradas">COLORADAS TOUR DAY</option>
                            <option value="uxmal">UXMAL</option>
                            <option value="celestun">CELESTÚN</option>
                            <option value="campeche">CAMPECHE</option>
                        </select>
                        <div id="campos-personalizados-dia-${i}" style="margin-top:12px;"></div>
                    </div>
                </div>`;
        }
        
        htmlAcordeones += `</div><button type="button" class="btn-add-dia-circuito" onclick="agregarDiaCircuito()">➕ Agregar Siguiente Día al Itinerario</button>`;
        contenedorInferiorDinamico.innerHTML = htmlAcordeones;

        for (let i = 1; i <= diasCircuitoContador; i++) {
            const selectDia = document.querySelector(`.picker-circuito-destino[data-dia="${i}"]`);
            if(i === 1 && selectDia) selectDia.value = "chichen";
            if(i === 2 && selectDia) selectDia.value = "cenotes";
            if(selectDia) renderizarCamposDiaCircuito(i, selectDia.value);
        }
        const selectPrimero = document.querySelector('.picker-circuito-destino[data-dia="1"]');
        if(selectPrimero) mostrarTarjetaCatalogo(selectPrimero.value); 
    }
    actualizarLogosDinamicos();
}

function renderizarCamposSingle() {
    const select = document.getElementById('tour-select');
    if (!select) return;
    const tour = select.value;
    const datos = catalogoEstructuraTours[tour];
    const target = document.getElementById('wrapper-personalizacion-single');
    if (!datos || !target) return;

    let html = "";
    if (datos.complementos.length > 0) {
        html += `<div class="box-personalizacion"><div class="titulo-interactivo">📍 Personaliza tu Ruta (Elige 1)</div>`;
        datos.complementos.forEach((comp, index) => {
            html += `<label class="opcion-item"><input type="radio" name="viaha-complemento" value="${comp}" ${index === 0 ? 'checked' : ''} onchange="calcular()"><span>${comp}</span></label>`;
        });
        html += `</div>`;
    } else {
        html += `<div class="box-personalizacion" style="border-style: dashed;"><div class="titulo-interactivo">📋 Ruta Integrada Completa</div><p style="font-size:15px; margin:0;">Este itinerario incluye: *Motul*, *Las Coloradas* y *Playa Cancunito*.</p></div>`;
    }

    if (datos.plus.length > 0) {
         html += `<div class="box-personalizacion"><div class="titulo-interactivo">✨ ¿Quieres agregar un Plus?</div>`;
         datos.plus.forEach(pl => {
             html += `<label class="opcion-item"><input type="checkbox" name="viaha-plus" value="${pl}" onchange="calcular()"><span>${pl}</span></label>`;
         });
         html += `</div>`;
     }
     target.innerHTML = html;
}

function renderizarCamposDiaCircuito(dia, tour) {
    const datos = catalogoEstructuraTours[tour];
    const target = document.getElementById(`campos-personalizados-dia-${dia}`);
    if (!datos || !target) return;

    let html = "";
    if (datos.complementos.length > 0) {
        html += `<div class="box-personalizacion" style="padding:12px; margin-bottom:10px;"><div class="titulo-interactivo" style="font-size:14px; border:none; margin:0; padding:0;">📍 Ruta del Día ${dia}</div>`;
        datos.complementos.forEach((comp, index) => {
            html += `<label class="opcion-item" style="font-size:15px; margin-top:8px;"><input type="radio" name="viaha-complemento-dia-${dia}" value="${comp}" ${index === 0 ? 'checked' : ''} onchange="calcular()"><span>${comp}</span></label>`;
        });
        html += `</div>`;
    } else {
        html += `<div class="box-personalizacion" style="padding:12px; margin-bottom:10px; border-style:dashed;"><div class="titulo-interactivo" style="font-size:14px; margin:0; border:none;">📋 Ruta Completa Integrada</div></div>`;
    }

    if (datos.plus.length > 0) {
        html += `<div class="box-personalizacion" style="padding:12px; margin-bottom:0;"><div class="titulo-interactivo" style="font-size:14px; margin:0; border:none;">✨ Pluses Disponibles</div>`;
        datos.plus.forEach(pl => {
            html += `<label class="opcion-item" style="font-size:15px; margin-top:8px;"><input type="checkbox" name="viaha-plus-dia-${dia}" value="${pl}" onchange="calcular()"><span>${pl}</span></label>`;
        });
        html += `</div>`;
    }
    target.innerHTML = html;
}

function cambiarDestinoDiaCircuito(dia, tour) {
    renderizarCamposDiaCircuito(dia, tour);
    mostrarTarjetaCatalogo(tour);
    actualizarLogosDinamicos();
    calcular();
}

function toggleAccordion(dia) {
    const item = document.getElementById(`accordion-dia-${dia}`);
    if (!item) return;
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.accordion-item-circuito').forEach(el => el.classList.remove('open'));
    if (!isOpen) item.classList.add('open');
}

function agregarDiaCircuito() {
    diasCircuitoContador++;
    renderizarEstructuraSegunModalidad();
    inicializarCalendario();
    document.querySelectorAll('.accordion-item-circuito').forEach(el => el.classList.remove('open'));
    const nuevoElemento = document.getElementById(`accordion-dia-${diasCircuitoContador}`);
    if(nuevoElemento) nuevoElemento.classList.add('open');
    calcular();
}

function eliminarDiaCircuito(e, dia) {
    e.stopPropagation(); 
    if (diasCircuitoContador > 2) {
        diasCircuitoContador--;
        renderizarEstructuraSegunModalidad();
        inicializarCalendario();
        calcular();
    }
}

function actualizarInterfazSingle() {  
      const select = document.getElementById('tour-select');  
      if(!select) return;
      const selectedTour = select.value;  
       
      mostrarTarjetaCatalogo(selectedTour);
      renderizarCamposSingle();  
      actualizarLogosDinamicos();  
      calcular();  
}  

function mostrarTarjetaCatalogo(idTour) {
    Object.keys(intervalosCarrusel).forEach(tourKey => detenerAutoplayCarrusel(tourKey));  
    document.querySelectorAll('.tour-info-card').forEach(card => card.classList.remove('active'));  
    
    const tarjetaTarget = document.getElementById('info-' + idTour);
    if (tarjetaTarget) tarjetaTarget.classList.add('active');
    
    activarAutoplayCarrusel(idTour);
    gtag('event', 'visualizacion_producto_tour', { 'id_destino': idTour, 'nombre_destino': catalogoEstructuraTours[idTour].txt });
}

function actualizarLogosDinamicos() {  
      let categoria = "arqueologia";
      if (modalidadActiva === 'single') {
          const select = document.getElementById('tour-select');  
          if (select) categoria = catalogoEstructuraTours[select.value].cat;  
      } else {
          const selectPrimero = document.querySelector('.picker-circuito-destino[data-dia="1"]');
          if (selectPrimero) categoria = catalogoEstructuraTours[selectPrimero.value].cat;
      }
      
      const rutaSvg = `img/isologos/${categoria}.svg`;
      const htmlImg = `<img src="${rutaSvg}" alt="Isologo Vía Há ${categoria}" class="img-isologo-dinamico">`;
      document.querySelectorAll('.dynamic-tour-logo-container').forEach(container => { container.innerHTML = htmlImg; });  
}  

function calcular() {  
      let granTotalCalculado = 0;
      const totalPasajeros = adultos + ninos;

      if (modalidadActiva === 'single') {
          const select = document.getElementById('tour-select');
          if(!select) return;
          const idTour = select.value;
          const r_comp = document.querySelector('input[name="viaha-complemento"]:checked');
          const compSel = r_comp ? r_comp.value : "Ruta Fija Corrida";

          granTotalCalculado = obtenerPrecioMatriz(idTour, compSel, totalPasajeros);
      } else {
          for (let i = 1; i <= diasCircuitoContador; i++) {
              const selectDia = document.querySelector(`.picker-circuito-destino[data-dia="${i}"]`);
              if (selectDia) {
                  const idTourDia = selectDia.value;
                  const r_compDia = document.querySelector(`input[name="viaha-complemento-dia-${i}"]:checked`);
                  const compSelDia = r_compDia ? r_compDia.value : "Ruta Fija Corrida";

                  granTotalCalculado += obtenerPrecioMatriz(idTourDia, compSelDia, totalPasajeros);
              }
          }
      }

      document.getElementById('total-display').innerText = `$${granTotalCalculado.toLocaleString()} MXN`;  
}  

function obtenerPrecioMatriz(tour, complemento, pasajeros) {
    const bloques = matrizTarifasEscaladas[tour];
    if (!bloques) return 0;
    const combinacion = bloques[complemento];
    if (!combinacion) return 0;

    if (pasajeros <= 2) {
        return combinacion[2]; 
    } else {
        let rangoKey = (pasajeros === 3) ? 3 : 4;
        return pasajeros * combinacion[rangoKey];
    }
}

function moverCarrusel(idTour, direccion) {  
      const track = document.getElementById(`track-${idTour}`);  
      if (!track) return;  
      const imagenes = track.querySelectorAll('img');  
      
      posicionesCarrusel[idTour] += direccion;  
      if (posicionesCarrusel[idTour] >= imagenes.length) posicionesCarrusel[idTour] = 0;  
      if (posicionesCarrusel[idTour] < 0) posicionesCarrusel[idTour] = imagenes.length - 1;  
       
      track.style.transform = `translateX(${posicionesCarrusel[idTour] * -100}%)`;  
      gtag('event', 'desplazamiento_galeria', { 'id_destino': idTour, 'imagen_index': posicionesCarrusel[idTour] }); 
}  

function activarAutoplayCarrusel(idTour) {  
      if (intervalosCarrusel[idTour]) clearInterval(intervalosCarrusel[idTour]);  
      intervalosCarrusel[idTour] = setInterval(() => { moverCarrusel(idTour, 1); }, 4000);   
}  

function detenerAutoplayCarrusel(idTour) {  
      if (intervalosCarrusel[idTour]) { clearInterval(intervalosCarrusel[idTour]); intervalosCarrusel[idTour] = null; }  
}  

function inicializarSoportesTactiles() {  
      document.querySelectorAll('.carousel-container').forEach(container => {  
          let xInicial = null;  
          const track = container.querySelector('.carousel-track');  
          if(!track) return;  
          const idTour = track.id.replace('track-', '');  

          container.addEventListener('touchstart', (e) => { detenerAutoplayCarrusel(idTour); xInicial = e.touches[0].clientX; }, { passive: true });  
          container.addEventListener('touchend', (e) => {  
              if (!xInicial) return;  
              let diferenciaX = xInicial - e.changedTouches[0].clientX;  
              if (Math.abs(diferenciaX) > 50) moverCarrusel(idTour, diferenciaX > 0 ? 1 : -1);  
              xInicial = null;  
              activarAutoplayCarrusel(idTour); 
          }, { passive: true });  
      });  
}  

function cambiarIdioma() {  
      idiomaActual = document.getElementById('lang-switch').value;  
      const t = traducciones[idiomaActual];  

      document.querySelectorAll('[data-i18n]').forEach(el => {  
          const key = el.getAttribute('data-i18n');  
          if (t[key]) el.innerHTML = t[key];  
      });  
      document.querySelectorAll('[data-i18n-ph]').forEach(el => {  
          const key = el.getAttribute('data-i18n-ph');  
          if (t[key]) el.placeholder = t[key];  
      });  

      inicializarCalendario();  
      cargarBloqueos();   
      renderizarEstructuraSegunModalidad();  
      gtag('event', 'cambio_idioma_plataforma', { 'idioma_activo': idiomaActual });  
}  

function cargarBloqueos() {  
      fetch(API_URL)  
          .then(res => res.json())  
          .then(data => {  
              const fechas = data.filter(row => row.fecha && row.fecha.trim().length > 5).map(row => row.fecha.trim());  
              if (fp && typeof fp.set === 'function') fp.set("disable", fechas);  
          })  
          .catch(err => console.error("❌ Error de comunicación analítica con SheetDB:", err));  
}  

function cambiarCant(tipo, cambio) {  
      if (tipo === 'adultos') {  
          if (adultos + cambio >= 2) adultos += cambio;   
          document.getElementById('qty-adultos').innerText = adultos; 
      } else {  
          if (ninos + cambio >= 0) ninos += cambio;   
          document.getElementById('qty-ninos').innerText = ninos;  
      }  
      calcular();   
}  

function enviarWhatsApp() {  
      const t = traducciones[idiomaActual];  
      const nombre = document.getElementById('nombre-cliente').value.trim();  
       
      if (!nombre || !fechaSeleccionada) {  
          alert(!nombre ? t.alert_nombre : t.alert_fecha);  
          if(!nombre) document.getElementById('nombre-cliente').focus();  
          return;  
      }  

      const total = document.getElementById('total-display').innerText;  
      const r_idioma = document.querySelector('input[name="viaha-idioma-global"]:checked');
      let idiomaTexto = r_idioma ? r_idioma.value : "Español";
      if (idiomaTexto === "Otro") {
          const inputOtro = document.getElementById('input-otro-idioma-global').value.trim();
          idiomaTexto = inputOtro ? `Otro (${inputOtro})` : "Otro (No especificado)";
      }

      let mensaje = "";

      if (modalidadActiva === 'single') {
          const select = document.getElementById('tour-select');  
          const tourName = select.options[select.selectedIndex].text;  
          const r_complemento = document.querySelector('input[name="viaha-complemento"]:checked');
          const complementoTexto = r_complemento ? r_complemento.value : "Ruta Fija Corrida";
          const checkboxesPlus = document.querySelectorAll('input[name="viaha-plus"]:checked');
          let plusSeleccionados = [];
          checkboxesPlus.forEach(ch => plusSeleccionados.push(ch.value));
          const plusTexto = plusSeleccionados.length > 0 ? plusSeleccionados.join(', ') : "Ninguno";

          mensaje = `¡Hola! Me interesa reservar un tour *PRIVADO* con *VÍA HA' MÉXICO*:\n\n👤 *Nombre:* ${nombre}\n🌴 *Tour:* ${tourName}\n📍 *Ruta:* ${complementoTexto}\n✨ *Plus:* ${plusTexto}\n🗣️ *Idioma:* ${idiomaTexto}\n📅 *Fecha:* ${fechaSeleccionada}\n👥 *Adultos:* ${adultos}\n👶 *Niños:* ${ninos}\n💰 *Total estimado:* ${total}\n\n¿Tienen disponibilidad?`;
      } else {
          mensaje = `¡Hola! Me interesa cotizar un *CIRCUITO PRIVADO MULTIDÍAS* con *VÍA HA' MÉXICO*:\n\n👤 *Nombre:* ${nombre}\n📅 *Período:* ${fechaSeleccionada}\n👥 *Adultos:* ${adultos} | 👶 *Niños:* ${ninos}\n🗣️ *Idioma:* ${idiomaTexto}\n\n🗺️ *ITINERARIO PLANIFICADO:*`;
          
          for (let i = 1; i <= diasCircuitoContador; i++) {
              const selectDia = document.querySelector(`.picker-circuito-destino[data-dia="${i}"]`);
              if (selectDia) {
                  const tourDiaTxt = selectDia.options[selectDia.selectedIndex].text;
                  const r_compDia = document.querySelector(`input[name="viaha-complemento-dia-${i}"]:checked`);
                  const compDiaTxt = r_compDia ? r_compDia.value : "Ruta Fija Corrida";
                  const checksPlusDia = document.querySelectorAll(`input[name="viaha-plus-dia-${i}"]:checked`);
                  let plusDiaArr = [];
                  checksPlusDia.forEach(c => plusDiaArr.push(c.value));
                  const plusDiaTxt = plusDiaArr.length > 0 ? plusDiaArr.join(', ') : "Ninguno";

                  mensaje += `\n\n☀️ *DÍA ${i}:* ${tourDiaTxt}\n   📍 Ruta: ${compDiaTxt}\n   ✨ Pluses: ${plusDiaTxt}`;
              }
          }
          mensaje += `\n\n💰 *TOTAL ESTIMADO DEL CIRCUITO:* ${total}\n\n¿Tienen disponibilidad para coordinar estos días con el equipo?`;
      }
       
      gtag('event', 'conversion_reserva_click', {  
          'lead_traveler_name': nombre, 'modalidad_reserva': modalidadActiva, 'total_dias_circuito': modalidadActiva === 'circuit' ? diasCircuitoContador : 1,
          'date_range_booked': fechaSeleccionada, 'quantity_adults': adultos, 'quantity_children': ninos, 'estimated_total_quoted': total  
      });  

      window.open(`https://wa.me/525560040025?text=${encodeURIComponent(mensaje)}`, '_blank');  
}  

function dispararAgendado() { document.getElementById('modal-agenda').style.display = 'flex'; ejecutarOpcionC_HorariosFijos(); }
function cerrarModal() { document.getElementById('modal-agenda').style.display = 'none'; document.getElementById('contenedor-render-agenda').innerHTML = ''; }

function ejecutarOpcionC_HorariosFijos() {
     const contenedor = document.getElementById('contenedor-render-agenda');
     contenedor.innerHTML = `<h3 class="section-title" style="margin-top:0;">Agendar Llamada</h3><p style="font-size:15px; margin-bottom:15px;">Selecciona el día y el bloque de horario de tu preferencia para coordinar tu llamada o Videollamada personalizada con el equipo.</p><div class="form-group"><label class="input-label">1. Elige la Fecha</label><input type="text" id="fecha-llamada-fija" placeholder="Haga clic para abrir el calendario..." readonly></div><div id="wrapper-horarios-fijos" class="form-group" style="display:none;">Horarios disponibles de Vía Há (Zona Horaria CDMX)<select id="select-hora-fija" class="tour-picker"><option value="Mañana (9:00 AM - 12:00 PM)">Mañana (9:00 AM - 12:00 PM)</option><option value="Tarde (2:00 PM - 5:00 PM)">Tarde (2:00 PM - 5:00 PM)</option><option value="Sabatino (10:00 AM - 1:00 PM)">Sabatino (10:00 AM - 1:00 PM)</option></select></div><button type="button" id="btn-confirmar-fijo" class="btn-whatsapp" style="display:none; width:100%; border:none; cursor:pointer;">Confirmar e ir a WhatsApp ↗</button>`;

     flatpickr("#fecha-llamada-fija", {
         locale: "es", minDate: "today", dateFormat: "Y-m-d",  
         onChange: function(selectedDates, dateStr) {
             document.getElementById('wrapper-horarios-fijos').style.display = 'block';
             const btn = document.getElementById('btn-confirmar-fijo');
             btn.style.display = 'block';
             btn.onclick = () => {
                 const bloques = document.getElementById('select-hora-fija').value;
                 gtag('event', 'lead_llamada_disparado', { 'fecha_propuesta': dateStr, 'bloque_horario': bloques });
                 let txt = `¡Hola! Me gustaría coordinar mi llamada de personalización de viaje con Vía Há México.\n\n📅 *Fecha:* ${dateStr}\n⏰ *Horario propuesto:* ${bloques}\n\n¿Me confirman si Roberto y Romain tienen espacio disponible?`;
                 window.open(`https://wa.me/529618150804?text=${encodeURIComponent(txt)}`, '_blank');
             };
         }
     });
}

document.addEventListener("DOMContentLoaded", inicializarSistema);
