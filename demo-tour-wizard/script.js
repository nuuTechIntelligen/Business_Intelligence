/**
 * VÍA HA' MÉXICO - MOTOR DE INTELIGENCIA DE NEGOCIO Y RESERVAS ONLINE
 * Fase 1: Catálogo Dinámico desde Google Sheets (SheetDB) con Soporte Estacional y de Clima.
 */

// VARIABLES DE ESTADO LOCAL GLOBAL ELEVADAS
let adultos = 2;                
let ninos = 0; 
let fp = null;                  
let fechaSeleccionada = ""; 
let idiomaActual = "es";        

// Control de modalidad activa ('single' para 1 día, 'circuit' para multidías)
let modalidadActiva = 'single';
let diasCircuitoContador = 2; 
let pasoActual = 1; 

// CACHÉ DE BASE DE DATOS (Mantiene la persistencia sin saturar llamadas a la API)
let fechasBloqueadasGlobal = [];
let catalogoToursDinamico = {}; 

// CONFIGURACIÓN DE ENDPOINTS DE LA API (SheetDB)
const API_BLOQUEOS = 'https://sheetdb.io/api/v1/2s1p744rscfly?sheet=bloqueos'; 
const API_CATALOGO = 'https://sheetdb.io/api/v1/2s1p744rscfly?sheet=catalogo_tours'; 

const posicionesCarrusel = { cenotes: 0, chichen: 0, coloradas: 0, uxmal: 0, celestun: 0, campeche: 0 }; 
const intervalosCarrusel = { cenotes: null, chichen: null, coloradas: null, uxmal: null, celestun: null, campeche: null }; 

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
 * Inicializador maestro asíncrono.
 */
async function inicializarSistema() {  
      while (typeof flatpickr === 'undefined') {  
          await new Promise(resolve => setTimeout(resolve, 100));  
      }  
      try {          
          await cargarBloqueos();  
          await descargarYProcesarCatalogo(); 
          inicializarSoportesTactiles();   
          actualizarDependenciasFecha(); 
      } catch (error) {  
          console.error("❌ Error Crítico en inicialización:", error.message);  
      }  
}  

/**
 * MOTOR DE PROCESAMIENTO ACTUALIZADO:
 * Descarga catálogo, filtra disponibilidad e inyecta dinámicamente texto, precios y imágenes.
 */
async function descargarYProcesarCatalogo() {
    try {
        const respuesta = await fetch(API_CATALOGO);
        const filas = await respuesta.json();
        
        const hoy = new Date().toISOString().split('T')[0];
        const selectHTML = document.getElementById('tour-select');
        const contenedorTarjetas = document.getElementById('catalogo-tarjetas-tours');
        
        let opcionesSelect = "";
        let htmlTarjetasDinamicas = "";
        
        catalogoToursDinamico = {};

        filas.forEach(fila => {
            if (fila.estado !== 'activo') return;
            if (fila.fecha_inicio && fila.fecha_inicio !== 'siempre' && hoy < fila.fecha_inicio) return;
            if (fila.fecha_fin && fila.fecha_fin !== 'siempre' && hoy > fila.fecha_fin) return;

            const id = fila.id_tour.trim();
            
            const complementosArr = fila.complementos ? fila.complementos.split('|').map(s => s.trim()) : [];
            const plusesArr = fila.pluses ? fila.pluses.split('|').map(s => s.trim()) : [];
            const imagenesArr = fila.imagenes ? fila.imagenes.split('|').map(s => s.trim()) : []; 
            
            const precios2 = fila.precios_pax_2 ? fila.precios_pax_2.split('|').map(s => parseFloat(s.trim())) : [];
            const precios3 = fila.precios_pax_3 ? fila.precios_pax_3.split('|').map(s => parseFloat(s.trim())) : [];
            const precios4 = fila.precios_pax_4 ? fila.precios_pax_4.split('|').map(s => parseFloat(s.trim())) : [];

            let estructuraTarifariaMapeada = {};
            if (complementosArr.length > 0) {
                complementosArr.forEach((comp, index) => {
                    estructuraTarifariaMapeada[comp] = {
                        2: precios2[index] || 0,
                        3: precios3[index] || 0,
                        4: precios4[index] || 0
                    };
                });
            } else {
                estructuraTarifariaMapeada["Ruta Fija Corrida"] = { 2: precios2[0] || 0, 3: precios3[0] || 0, 4: precios4[0] || 0 };
            }

            catalogoToursDinamico[id] = {
                complementos: complementosArr,
                plus: plusesArr,
                txt: fila.nombre_tour.trim(),
                cat: fila.categoria.trim(),
                tarifas: estructuraTarifariaMapeada
            };

            opcionesSelect += `<option value="${id}">${fila.nombre_tour.trim().toUpperCase()}</option>`;

            let htmlImagenesCarrusel = "";
            imagenesArr.forEach(img => {
                htmlImagenesCarrusel += `<img src="img/${id}/${img}" alt="${fila.nombre_tour.trim()} - Vía Há" class="tour-card-img">`;
            });

            htmlTarjetasDinamicas += `
                <div id="info-${id}" class="tour-info-card"> 
                    <div class="carousel-container"> 
                        <button type="button" class="carousel-btn prev" onclick="moverCarrusel('${id}', -1)">&#10094;</button> 
                        <div class="carousel-track" id="track-${id}"> 
                            ${htmlImagenesCarrusel}
                        </div> 
                        <button type="button" class="carousel-btn next" onclick="moverCarrusel('${id}', 1)">&#10095;</button> 
                    </div> 
                    <div class="tour-title-wrapper"> 
                        <div class="dynamic-tour-logo-container logo-c1"></div> 
                        <h3 class="section-title">${fila.nombre_tour.trim()}</h3> 
                    </div> 
                    <p>Disfruta de una experiencia premium privada con fotografía profesional incluida.</p> 
                    <div class="inc-no-inc-container">
                        <div class="inc-col">
                            <div class="inc-title">🟢 Incluye</div>
                            <ul class="inc-list">
                                <li>Transporte privado desde tu hospedaje.</li>
                                <li>Guía Federal Certificado.</li>
                                <li>Hielera con agua.</li>
                                <li>Estacionamientos y Peajes.</li>
                            </ul>
                        </div>
                        <div class="no-inc-col">
                            <div class="no-inc-title">🔴 No Incluye</div>
                            <ul class="no-inc-list">
                                <li>Entradas a los sitios arqueológicos o cenotes.</li>
                                <li>Alimentos no especificados.</li>
                            </ul>
                        </div>
                    </div>
                </div>`;
        });

        if (selectHTML) selectHTML.innerHTML = opcionesSelect;
        if (contenedorTarjetas) contenedorTarjetas.innerHTML = htmlTarjetasDinamicas;

        inicializarSoportesTactiles();
        renderizarEstructuraSegunModalidad();

    } catch (error) {
        console.error("❌ Error en Fase 1.2 (Catálogo e Imágenes Dinámicas):", error);
    }
}

function actualizarDependenciasFecha() {
    calcular(); 
    inicializarCalendario(); 
}

function inicializarCalendario() {  
      const campoFecha = document.getElementById('fecha-reserva');  
      if (!campoFecha) return;  
      
      let diasRequeridos = modalidadActiva === 'circuit' ? diasCircuitoContador : 1;

      if (modalidadActiva === 'single') {
          const select = document.getElementById('tour-select');
          if (select && select.value === 'campeche') {
              const r_comp = document.querySelector('input[name="viaha-complemento"]:checked');
              if (r_comp && r_comp.value === "Tour de 2 dias") {
                  diasRequeridos = 2; 
              }
          }
      } else {
          for (let i = 1; i <= diasCircuitoContador; i++) {
              const selectDia = document.querySelector(`.picker-circuito-destino[data-dia="${i}"]`);
              if (selectDia && selectDia.value === 'campeche') {
                  const r_compDia = document.querySelector(`input[name="viaha-complemento-dia-${i}"]:checked`);
                  if (r_compDia && r_compDia.value === "Tour de 2 dias") {
                      diasRequeridos++; 
                  }
              }
          }
      }

      const modoCalendario = diasRequeridos > 1 ? "range" : "single";

      if (fp) {
          fp.destroy();
          document.getElementById('fecha-reserva').value = ""; 
          fechaSeleccionada = "";
      }   

      fp = flatpickr(campoFecha, {  
          locale: "es", 
          mode: modoCalendario, 
          minDate: "today", 
          dateFormat: "Y-m-d", 
          altInput: true, 
          altFormat: "d/m/Y", 
          altInputClass: "flatpickr-input", 
          disableMobile: true, 
          disable: fechasBloqueadasGlobal, 
          onChange: function(selectedDates, dateStr) {  
              fechaSeleccionada = dateStr;  
              
              if (modoCalendario === 'range' && selectedDates.length === 2) {
                  const milisegundosPorDia = 24 * 60 * 60 * 1000;
                  const diasRealesSeleccionados = Math.round(Math.abs((selectedDates[1] - selectedDates[0]) / milisegundosPorDia)) + 1;
                  
                  if (diasRealesSeleccionados !== diasRequeridos) {
                      alert(`⚠️ Tu itinerario está configurado para exactamente ${diasRequeridos} días. Por favor, selecciona un rango de exactamente ${diasRequeridos} días en el calendario.`);
                      fp.clear();
                      fechaSeleccionada = "";
                  } 
              }
              gtag('event', 'seleccion_fecha_viaje', { 'rango_fechas': dateStr, 'modalidad': modalidadActiva });  
          }  
      });  
}  

/* ==========================================================================
   CEREBRO DEL WIZARD MÓVIL (2 PASOS)
   ========================================================================== */
function irPaso(paso) {
    if (window.innerWidth < 850) {
        document.querySelectorAll('.wizard-step').forEach(el => el.classList.remove('active'));
        document.querySelectorAll(`.wizard-step[data-step="${paso}"]`).forEach(el => el.classList.add('active'));
        
        const dot1 = document.getElementById('dot-1');
        const dot2 = document.getElementById('dot-2');
        const line1 = document.getElementById('line-1');

        if (paso === 1) {
            if(dot1) { dot1.classList.add('active'); dot1.classList.remove('completed'); dot1.innerHTML = '1'; }
            if(dot2) { dot2.classList.remove('active', 'completed'); }
            if(line1) { line1.classList.remove('completed-line'); }
        } else if (paso === 2) {
            if(dot1) { dot1.classList.remove('active'); dot1.classList.add('completed'); dot1.innerHTML = '✓'; }
            if(dot2) { dot2.classList.add('active'); }
            if(line1) { line1.classList.add('completed-line'); }
        }
        
        const topPos = document.getElementById('viaha-main-container').offsetTop;
        window.scrollTo({ top: topPos - 20, behavior: 'smooth' });
        
        pasoActual = paso;
    }
}

function cambiarModalidad(tipo) {
    modalidadActiva = tipo;
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    
    const mainContainer = document.getElementById('viaha-main-container');

    if (tipo === 'single') {
        document.getElementById('tab-single').classList.add('active');
        document.getElementById('label-fecha-dinamica').innerText = "Fecha del Recorrido";
        if(mainContainer) {
            mainContainer.classList.remove('modo-circuito-activo'); 
            mainContainer.classList.add('modo-single-activo'); 
        }
    } else {
        document.getElementById('tab-circuit').classList.add('active');
        document.getElementById('label-fecha-dinamica').innerText = "Período del Circuito (Fechas)";
        if(mainContainer) {
            mainContainer.classList.add('modo-circuito-activo');    
            mainContainer.classList.remove('modo-single-activo'); 
        }
        irPaso(1); 
    }
    
    renderizarEstructuraSegunModalidad();
    actualizarDependenciasFecha(); // CORREGIDO TYPO
}

function renderizarEstructuraSegunModalidad() {
    const contenedorSuperiorSelector = document.getElementById('wrapper-selector-single-fijo');
    const contenedorCentralAcordeones = document.getElementById('seccion-personalizacion-tour');
    const contenedorSingleInterno = document.getElementById('wrapper-personalizacion-single');

    if (Object.keys(catalogoToursDinamico).length === 0) return;

    if (modalidadActiva === 'single') {
        if(contenedorSuperiorSelector) contenedorSuperiorSelector.style.display = 'block';
        if(contenedorCentralAcordeones) contenedorCentralAcordeones.innerHTML = '';
        
        renderizarCamposSingle();
        
        const select = document.getElementById('tour-select');
        if(select) mostrarTarjetaCatalogo(select.value);
    } else {
        if(contenedorSuperiorSelector) contenedorSuperiorSelector.style.display = 'none';
        if(contenedorSingleInterno) contenedorSingleInterno.innerHTML = '';
        
        let htmlAcordeones = `<label class="section-title" style="margin-bottom:15px; display:block;">🗺️ Itinerario del Circuito Privado (Por Días)</label><div id="accordion-circuito-container">`;
        
        let opcionesDestinosDinamicos = "";
        Object.keys(catalogoToursDinamico).forEach(key => {
            opcionesDestinosDinamicos += `<option value="${key}">${catalogoToursDinamico[key].txt.toUpperCase()}</option>`;
        });

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
                            ${opcionesDestinosDinamicos}
                        </select>
                        <div id="campos-personalizados-dia-${i}" style="margin-top:12px;"></div>
                    </div>
                </div>`;
        }
        
        htmlAcordeones += `</div><button type="button" class="btn-add-dia-circuito" onclick="agregarDiaCircuito()">➕ Agregar Siguiente Día al Itinerario</button>`;
        if(contenedorCentralAcordeones) contenedorCentralAcordeones.innerHTML = htmlAcordeones;

        for (let i = 1; i <= diasCircuitoContador; i++) {
            const selectDia = document.querySelector(`.picker-circuito-destino[data-dia="${i}"]`);
            const llavesDisponibles = Object.keys(catalogoToursDinamico);
            
            if(i === 1 && selectDia) selectDia.value = llavesDisponibles[0] || "";
            if(i === 2 && selectDia) selectDia.value = llavesDisponibles[1] || llavesDisponibles[0] || "";
            if(selectDia) renderizarCamposDiaCircuito(i, selectDia.value);
        }
        const selectPrimero = document.querySelector('.picker-circuito-destino[data-dia="1"]');
        if(selectPrimero) mostrarTarjetaCatalogo(selectPrimero.value); 
    }
    actualizarLogosDinamicos();
}

function renderizarCamposSingle() {
    const select = document.getElementById('tour-select');
    const target = document.getElementById('wrapper-personalizacion-single');
    if (!select || !target) return;
    
    const tour = select.value;
    const datos = catalogoToursDinamico[tour];
    if (!datos) return;

    let html = "";
    if (datos.complementos.length > 0) {
        html += `<div class="box-personalizacion"><div class="titulo-interactivo">📍 Personaliza tu Ruta (Elige 1)</div>`;
        datos.complementos.forEach((comp, index) => {
            html += `<label class="opcion-item"><input type="radio" name="viaha-complemento" value="${comp}" ${index === 0 ? 'checked' : ''} onchange="actualizarDependenciasFecha()"><span>${comp}</span></label>`;
        });
        html += `</div>`;
    } else {
        html += `<div class="box-personalizacion" style="border-style: dashed;"><div class="titulo-interactivo">📋 Ruta Integrada Completa</div><p style="font-size:15px; margin:0;">Este itinerario incluye toda la ruta clásica optimizada.</p></div>`;
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
    const datos = catalogoToursDinamico[tour];
    const target = document.getElementById(`campos-personalizados-dia-${dia}`);
    if (!datos || !target) return;

    let html = "";
    if (datos.complementos.length > 0) {
        html += `<div class="box-personalizacion" style="padding:12px; margin-bottom:10px;"><div class="titulo-interactivo" style="font-size:14px; border:none; margin:0; padding:0;">📍 Ruta del Día ${dia}</div>`;
        datos.complementos.forEach((comp, index) => {
            html += `<label class="opcion-item" style="font-size:15px; margin-top:8px;"><input type="radio" name="viaha-complemento-dia-${dia}" value="${comp}" ${index === 0 ? 'checked' : ''} onchange="actualizarDependenciasFecha()"><span>${comp}</span></label>`;
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
    actualizarDependenciasFecha(); 
}

function toggleAccordion(dia) {
    const item = document.getElementById(`accordion-dia-${dia}`);
    if (!item) return;
    
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.accordion-item-circuito').forEach(el => el.classList.remove('open'));
    
    if (!isOpen) {
        item.classList.add('open');
        if (window.innerWidth < 850) {
            setTimeout(() => {
                const headerOffset = 70; 
                const elementPosition = item.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
            }, 300);
        }
    }
}

function agregarDiaCircuito() {
    diasCircuitoContador++;
    renderizarEstructuraSegunModalidad();
    document.querySelectorAll('.accordion-item-circuito').forEach(el => el.classList.remove('open'));
    const nuevoElemento = document.getElementById(`accordion-dia-${diasCircuitoContador}`);
    if(nuevoElemento) nuevoElemento.classList.add('open');
    actualizarDependenciasFecha(); // CORREGIDO TYPO
}

function eliminarDiaCircuito(e, dia) {
    e.stopPropagation(); 
    if (diasCircuitoContador > 2) {
        diasCircuitoContador--;
        renderizarEstructuraSegunModalidad();
        actualizarDependenciasFecha(); // CORREGIDO TYPO
    }
}

function actualizarInterfazSingle() {  
      const select = document.getElementById('tour-select');  
      if(!select) return;
      const selectedTour = select.value;  
       
      mostrarTarjetaCatalogo(selectedTour);
      renderizarCamposSingle();  
      actualizarLogosDinamicos();  
      actualizarDependenciasFecha(); 
}  

function mostrarTarjetaCatalogo(idTour) {
    Object.keys(intervalosCarrusel).forEach(tourKey => detenerAutoplayCarrusel(tourKey));  
    document.querySelectorAll('.tour-info-card').forEach(card => card.classList.remove('active'));  
    
    const tarjetaTarget = document.getElementById('info-' + idTour);
    if (tarjetaTarget) tarjetaTarget.classList.add('active');
    
    activarAutoplayCarrusel(idTour);
    
    // CORRECCIÓN: Leer del catálogo dinámico real
    if(catalogoToursDinamico[idTour]) {
        gtag('event', 'visualizacion_producto_tour', { 'id_destino': idTour, 'nombre_destino': catalogoToursDinamico[idTour].txt });
    }
}

function actualizarLogosDinamicos() {  
      let categoria = "arqueologia";
      if (modalidadActiva === 'single') {
          const select = document.getElementById('tour-select');  
          if (select && catalogoToursDinamico[select.value]) categoria = catalogoToursDinamico[select.value].cat;  
      } else {
          const selectPrimero = document.querySelector('.picker-circuito-destino[data-dia="1"]');
          if (selectPrimero && catalogoToursDinamico[selectPrimero.value]) categoria = catalogoToursDinamico[selectPrimero.value].cat;
      }
      
      const rutaSvg = `img/isologos/${categoria}.svg`;
      const htmlImg = `<img src="${rutaSvg}" alt="Isologo Vía Há ${categoria}" class="img-isologo-dinamico">`;
      document.querySelectorAll('.dynamic-tour-logo-container').forEach(container => { container.innerHTML = htmlImg; });  
}

function calcular() {  
      if (Object.keys(catalogoToursDinamico).length === 0) return;
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
    const datosTour = catalogoToursDinamico[tour];
    if (!datosTour || !datosTour.tarifas) return 0;
    
    const combinacion = datosTour.tarifas[complemento] || datosTour.tarifas["Ruta Fija Corrida"];
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
  
      renderizarEstructuraSegunModalidad();  
      actualizarDependenciasFecha(); 
      gtag('event', 'cambio_idioma_plataforma', { 'idioma_activo': idiomaActual });  
}  

function cargarBloqueos() {  
      if (fechasBloqueadasGlobal.length > 0) {
          if (fp && typeof fp.set === 'function') fp.set("disable", fechasBloqueadasGlobal);
          return;
      }

      return fetch(API_BLOQUEOS)  
          .then(res => res.json())  
          .then(data => {  
              fechasBloqueadasGlobal = data.filter(row => row.fecha && row.fecha.trim().length > 5).map(row => row.fecha.trim());  
              if (fp && typeof fp.set === 'function') fp.set("disable", fechasBloqueadasGlobal);  
          })  
          .catch(err => console.error("❌ Error en bloqueos:", err));  
}  

function cambiarCant(tipo, cambio) {  
      if (tipo === 'adultos') {  
          if (adultos + cambio >= 2) adultos += cambio;   
          document.getElementById('qty-adultos').innerText = adults = adultos; 
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
      let tourParaAnalytics = "";
      let complementoParaAnalytics = "";
      let plusParaAnalytics = "";

      if (modalidadActiva === 'single') {
          const select = document.getElementById('tour-select');  
          tourParaAnalytics = select.options[select.selectedIndex].text;  
          const r_complemento = document.querySelector('input[name="viaha-complemento"]:checked');
          complementoParaAnalytics = r_complemento ? r_complemento.value : "Ruta Fija Corrida";
          const checkboxesPlus = document.querySelectorAll('input[name="viaha-plus"]:checked');
          let plusSeleccionados = [];
          checkboxesPlus.forEach(ch => plusSeleccionados.push(ch.value));
          plusParaAnalytics = plusSeleccionados.length > 0 ? plusSeleccionados.join(', ') : "Ninguno";

          mensaje = `¡Hola! Me interesa reservar un tour *PRIVADO* con *VÍA HA' MÉXICO*:\n\n👤 *Nombre:* ${nombre}\n🌴 *Tour:* ${tourParaAnalytics}\n📍 *Ruta:* ${complementoParaAnalytics}\n✨ *Plus:* ${plusParaAnalytics}\n🗣️ *Idioma:* ${idiomaTexto}\n📅 *Fecha:* ${fechaSeleccionada}\n👥 *Adultos:* ${adultos}\n👶 *Niños:* ${ninos}\n💰 *Total estimado:* ${total}\n\n¿Tienen disponibilidad?`;
      } else {
          tourParaAnalytics = "Circuito Vía Há (Multi-Días)";
          let itinerarioResumen = [];
          
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
                  itinerarioResumen.push(`Día ${i}: ${tourDiaTxt} (${compDiaTxt})`);
              }
          }
          complementoParaAnalytics = itinerarioResumen.join(' | ');
          plusParaAnalytics = "Configurado por día en circuito";
          mensaje += `\n\n💰 *TOTAL ESTIMADO DEL CIRCUITO:* ${total}\n\n¿Tienen disponibilidad para coordinar estos días con el equipo?`;
      }
       
      gtag('event', 'conversion_reserva_click', {  
          'lead_traveler_name': nombre,
          'destination_selected': tourParaAnalytics,
          'route_complement': complementoParaAnalytics,
          'plus_addons': plusParaAnalytics,
          'tour_language_required': idiomaTexto,
          'date_range_booked': fechaSeleccionada, 
          'quantity_adults': adultos, 
          'quantity_children': ninos, 
          'estimated_total_quoted': total,
          'locale_user': idiomaActual
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
