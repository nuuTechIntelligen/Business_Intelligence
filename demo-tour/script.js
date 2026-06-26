/**
 * VÍA HA' MÉXICO - MOTOR DE INTELIGENCIA DE NEGOCIO Y RESERVAS ONLINE
 * Código fuente optimizado, depurado y con trazabilidad analítica GA4.
 */

// VARIABLES DE ESTADO LOCAL GLOBAL ELEVADAS
let adultos = 2;                // MODIFICACIÓN: El contador arranca nativamente en 2 adultos
let ninos = 0; 
let fp = null;                  // Instancia controladora del calendario Flatpickr
let fechaSeleccionada = ""; 
let idiomaActual = "es";        // Español fijado firmemente como idioma principal de carga

// Registro de coordenadas de desplazamiento para los tracks de carruseles de fotos
const posicionesCarrusel = { cenotes: 0, chichen: 0, coloradas: 0, uxmal: 0, celestun: 0, campeche: 0 }; 
const intervalosCarrusel = { cenotes: null, chichen: null, coloradas: null, uxmal: null, celestun: null, campeche: null }; 

// Endpoint analítico de bloqueos de calendario sincronizado con Google Sheets
const API_URL = 'https://sheetdb.io/api/v1/2s1p744rscfly?sheet=bloqueos'; 

// Catálogo maestro estructurado de rutas opcionales y pluses por destino (CORRECCIÓN: Llaves homologadas con la matriz)
const catalogoEstructuraTours = {
     cenotes: { complementos: ["Nah-Yah / Su-hem", "Grutas de Tzabnah", "Homún"], plus: ["Avistamiento de aves", "Dinámica de observación","Hacienda Pixyah","Taller Tekit"] },
     chichen: { complementos: ["Cenote Zací / Valladolid", "Izamal", "Cenote Lol-Ha / Taller con Chef", "Chichén Itzá Viejo / Cenote Yodzonot"], plus: ["Avistamiento de aves", "Dinámica de observación"] },
     coloradas: { complementos: [], plus: ["Avistamiento de aves", "Dinámica de observación", "Sesión fotográfica", "Recorrido en lancha", "Paseo ecoturístico"] },
     uxmal: { complementos: ["Chocostory", "Hda Mucuyché", "Yaal Utzil"], plus: ["Avistamiento de aves", "Dinámica de observación"] },
     celestun: { complementos: ["Bote", "Lancha"], plus: ["Avistamiento de aves", "Dinámica de observación"] },
     campeche: { complementos: ["Tour de 1 dia", "Tour de 2 dias"], plus: ["Temporada de Avistamiento de Flamencos (Noviembre- Febrero)"] }
};

// Matriz de tarificación escalada por persona
const matrizTarifasEscaladas = {
     cenotes: { "Nah-Yah / Su-hem": { 2: 3100, 3: 2150, 4: 3200 }, "Grutas de Tzabnah": { 2: 3100, 3: 1150, 4: 800 }, "Homún": { 2: 3100, 3: 1150, 4: 800 } },
     chichen: { "Cenote Zací / Valladolid": { 2: 3760, 3: 1300, 4: 1000 }, "Izamal": { 2: 3400, 3: 1150, 4: 900 }, "Cenote Lol-Ha / Taller con Chef": { 2: 3400, 3: 1150, 4: 900 }, "Chichén Itzá Viejo / Cenote Yodzonot": { 2: 3400, 3: 1150, 4: 900 } },
     coloradas: { "Ruta Fija Corrida": { 2: 4050, 3: 1350, 4: 1050 } },
     uxmal: { "Chocostory": { 2: 3360, 3: 1150, 4: 900 }, "Hda Mucuyché": { 2: 3360, 3: 1150, 4: 900 }, "Yaal Utzil": { 2: 3360, 3: 1150, 4: 900 } },
     celestun: { "Bote": { 2: 3380, 3: 1150, 4: 900 }, "Lancha": { 2: 3380, 3: 1150, 4: 900 } },
     campeche: { "Tour de 1 dia": { 2: 3400, 3: 1150, 4: 850 }, "Tour de 2 dias": { 2: 6800, 3: 2250, 4: 1700 } }
};

// Diccionario de internacionalización (Limpio y purgado de variables huérfanas)
const traducciones = { 
      es: { 
          hero_title: "VIA HA' MÉXICO", hero_badge: "✨ Sumérgete al Mayab", pregunta_tour: "¿Qué paraíso quieres visitar hoy?", tour_cenotes: "Tour Cenotes", tour_chichen: "Chichén Itzá", tour_coloradas: "Coloradas Tour Day", tour_uxmal: "Uxmal", tour_celestun: "Celestún", tour_campeche: "Campeche",
          titulo_cotizador: "Cotiza tu grupo", label_nombre: "Nombre de quien solicita", ph_nombre: "Escribe tu nombre completo...", label_fecha: "Fecha del Recorrido", ph_fecha: "Selecciona una fecha o rango...", label_adultos: "Adultos", label_ninos: "Niños (-12 años)", total_estimado: "Total Estimado (Servicio Privado):", btn_reservar: "Reservar por WhatsApp", alert_nombre: "Por favor, ingresa tu nombre completo para personalizar tu cotización.", alert_fecha: "Por favor, selecciona una fecha disponible.", 
          wa_saludo: "¡Hola! Me interesa reservar un tour *PRIVADO* con *VÍA HA' MÉXICO*:\n\n", wa_nombre: "👤 *Nombre:*", wa_tour: "🌴 *Tour:*", wa_fecha: "📅 *Fecha:*", wa_adultos: "👥 *Adultos:*", wa_ninos: "👶 *Niños:*", wa_total: "💰 *Total estimado:*", wa_pregunta: "¿Tienen disponibilidad para estas condiciones?"
      }, 
      en: { 
          hero_title: "VIA HA' MÉXICO", hero_badge: "✨ Immerse yourself in the Mayab", pregunta_tour: "What paradise do you want to visit today?", tour_cenotes: "Cenotes Tour", tour_chichen: "Chichen Itza", tour_coloradas: "Coloradas Tour Day", tour_uxmal: "Uxmal", tour_celestun: "Celestun", tour_campeche: "Campeche",
          titulo_cotizador: "Quote your group", label_nombre: "Lead Traveler Name", ph_nombre: "Enter your full name...", label_fecha: "Tour Date", ph_fecha: "Select a date or range...", label_adultos: "Adultos", label_ninos: "Children (Under 12)", total_estimado: "Estimated Total (Private Service):", btn_reservar: "Book via WhatsApp", alert_nombre: "Please enter your full name to customize your quote.", alert_fecha: "Please select an available date.", 
          wa_saludo: "Hello! I am interested in booking a *PRIVATE* tour with *VÍA HA' MÉXICO*:\n\n", wa_nombre: "👤 *Name:*", wa_tour: "🌴 *Tour:*", wa_fecha: "📅 *Date:*", wa_adultos: "👥 *Adults:*", wa_ninos: "👶 *Children:*", wa_total: "💰 *Estimated Total:*", wa_pregunta: "Do you have availability for these conditions?"
      } 
}; 

/**
 * Inicializador asíncrono maestro del ecosistema web.
 */
async function inicializarSistema() {  
      while (typeof flatpickr === 'undefined') {  
          await new Promise(resolve => setTimeout(resolve, 100));  
      }  
      try {  
          inicializarCalendario();  
          cargarBloqueos();  
          inicializarSoportesTactiles();   
          renderizarCamposPersonalizados();  
          actualizarLogosDinamicos();  
          calcular();  

          const select = document.getElementById('tour-select');  
          if (select) activarAutoplayCarrusel(select.value);  
      } catch (error) {  
          console.error("❌ Error en inicialización:", error.message);  
      }  
}  

/**
 * Configuración rígida del componente de calendario Flatpickr
 */
function inicializarCalendario() {  
      const campoFecha = document.getElementById('fecha-reserva');  
      if (!campoFecha) return;  
      if (fp) fp.destroy();   

      fp = flatpickr(campoFecha, {  
          locale: "es", // Forzado nativo al español por defecto
          mode: "range", minDate: "today", dateFormat: "Y-m-d", altInput: true, altFormat: "d/m/Y", altInputClass: "flatpickr-input", disableMobile: true, disable: [],   
          onChange: function(selectedDates, dateStr) {  
              fechaSeleccionada = dateStr;  
              gtag('event', 'seleccion_fecha_viaje', { 'rango_fechas': dateStr, 'idioma_interfaz': idiomaActual });  
          }  
      });  
}  

/**
 * Desplazamiento y renderizado del carrusel de fotografías por destino
 */
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

/**
 * Inicialización de gestos de deslizamiento táctil (Swipes) para móviles
 */
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

/**
 * Consumo asíncrono y mapeado de los isologos externos definidos en el manual de marca (Proporción Rectangular)
 */
function actualizarLogosDinamicos() {  
      const select = document.getElementById('tour-select');  
      if (!select) return;  
      const categoria = select.options[select.selectedIndex].getAttribute('data-categoria');  
      
      const rutaSvg = `img/isologos/${categoria}.svg`;
      const htmlImg = `<img src="${rutaSvg}" alt="Isologo Vía Há ${categoria}" class="img-isologo-dinamico">`;

      document.querySelectorAll('.dynamic-tour-logo-container').forEach(container => { container.innerHTML = htmlImg; });  
}  

/**
 * Switcher analítico e idiomático de la interfaz del cotizador
 */
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
      actualizarInterfaz();  
       
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

/**
 * Modificadores volumétricos de pasajeros (Adultos / Niños)
 */
function cambiarCant(tipo, cambio) {  
      if (tipo === 'adultos') {  
          // MODIFICACIÓN: Congelamos el límite mínimo en 2 adultos para respetar el tramo base comercial
          if (adultos + cambio >= 2) adultos += cambio;   
          document.getElementById('qty-adultos').innerText = adultos; 
      } else {  
          if (ninos + cambio >= 0) ninos += cambio;   
          document.getElementById('qty-ninos').innerText = ninos;  
      }  
      calcular();   
}  

function actualizarInterfaz() {  
      const select = document.getElementById('tour-select');  
      const selectedTour = select.value;  
       
      Object.keys(intervalosCarrusel).forEach(tourKey => detenerAutoplayCarrusel(tourKey));  
      document.querySelectorAll('.tour-info-card').forEach(card => card.classList.remove('active'));  
      document.getElementById('info-' + selectedTour).classList.add('active');  
       
      activarAutoplayCarrusel(selectedTour);  
      actualizarLogosDinamicos();   
      renderizarCamposPersonalizados();  

      gtag('event', 'visualizacion_producto_tour', { 'id_destino': selectedTour, 'nombre_destino': select.options[select.selectedIndex].text });  
      calcular();  
}  

/**
 * ALGORITMO CORE: Rango base congelado para 1 y 2 Pax sin duplicidad lineal
 */
function calcular() {  
      const select = document.getElementById('tour-select');  
      if(!select) return;  

      const idTour = select.value;  
      const totalPasajeros = adultos + ninos; 
      const r_complemento = document.querySelector('input[name="viaha-complemento"]:checked');
      const complementoSeleccionado = r_complemento ? r_complemento.value : "Ruta Fija Corrida";

      const bloquesTour = matrizTarifasEscaladas[idTour];
      if (!bloquesTour) return;
      const rangosDeCombinacion = bloquesTour[complementoSeleccionado];
      if (!rangosDeCombinacion) return;

      let totalGlobal = 0;
      if (totalPasajeros <= 2) {
          totalGlobal = rangosDeCombinacion[2];
      } else {
          let llaveRango = (totalPasajeros === 3) ? 3 : 4;
          totalGlobal = totalPasajeros * rangosDeCombinacion[llaveRango];  
      }

      document.getElementById('total-display').innerText = `$${totalGlobal.toLocaleString()} MXN`;  
}  

/**
 * Renderizado estructural y asíncrono de campos adicionales (Lógica flexible)
 */
function renderizarCamposPersonalizados() {
     const tourSeleccionado = document.getElementById('tour-select').value;
     const datos = catalogoEstructuraTours[tourSeleccionado];
     const contenedorIzquierdo = document.getElementById('seccion-personalizacion-tour');
     const contenedorDerecho = document.getElementById('seccion-idioma-tour');
     if (!datos || !contenedorIzquierdo || !contenedorDerecho) return;

     let htmlIzquierdo = "";
     if (datos.complementos.length > 0) {
         htmlIzquierdo += `<div class="box-personalizacion"><div class="titulo-interactivo">📍 Personaliza tu Ruta (Elige 1)</div>`;
         datos.complementos.forEach((comp, index) => {
             htmlIzquierdo += `<label class="opcion-item"><input type="radio" name="viaha-complemento" value="${comp}" ${index === 0 ? 'checked' : ''} onchange="calcular()"><span>${comp}</span></label>`;
         });
         htmlIzquierdo += `</div>`;
     } else {
         htmlIzquierdo += `<div class="box-personalizacion" style="background-color: var(--light-bg); border-style: dashed;"><div class="titulo-interactivo">📋 Ruta Integrada Completa</div><p style="font-size:15px; margin:0; font-family:'Urbanist', sans-serif;">Este itinerario incluye: *Motul*, *Las Coloradas* y *Playa Cancunito*.</p></div>`;
     }

     if (datos.plus.length > 0) {
         htmlIzquierdo += `<div class="box-personalizacion"><div class="titulo-interactivo">✨ ¿Quieres agregar un Plus?</div>`;
         datos.plus.forEach(pl => {
             htmlIzquierdo += `<label class="opcion-item"><input type="checkbox" name="viaha-plus" value="${pl}"><span>${pl}</span></label>`;
             if(pl === "Paseo ecoturístico") htmlIzquierdo += `<ul class="sub-detalles-plus"><li>Playa Virgen, Laguna Azul, Pecesitos, Baño Maya, Tortugario</li></ul>`;
         });
         htmlIzquierdo += `</div>`;
     }
     contenedorIzquierdo.innerHTML = htmlIzquierdo;

     contenedorDerecho.innerHTML = `
         <div class="box-personalizacion"><div class="titulo-interactivo">🗣️ Idioma</div>
             <label class="opcion-item"><input type="radio" name="viaha-idioma" value="Español" checked onclick="document.getElementById('wrapper-otro-idioma').style.display='none'"> <span>Español</span></label>
             <label class="opcion-item"><input type="radio" name="viaha-idioma" value="Inglés" onclick="document.getElementById('wrapper-otro-idioma').style.display='none'"> <span>Inglés</span></label>
             <label class="opcion-item"><input type="radio" name="viaha-idioma" value="Francés" onclick="document.getElementById('wrapper-otro-idioma').style.display='none'"> <span>Francés</span></label>
             <label class="opcion-item"><input type="radio" name="viaha-idioma" value="Otro" onclick="document.getElementById('wrapper-otro-idioma').style.display='block'"> <span>Otro idioma</span></label>
             <div id="wrapper-otro-idioma" style="display:none;"><input type="text" id="input-otro-idioma" class="input-otro-idioma" placeholder="Especificar idioma..."></div>
         </div>`;
}

/**
 * DISPARADOR MAESTRO: Captura analítica completa de intenciones y redirección a WhatsApp API
 */
function enviarWhatsApp() {  
      const t = traducciones[idiomaActual];  
      const nombre = document.getElementById('nombre-cliente').value.trim();  
       
      if (!nombre || !fechaSeleccionada) {  
          alert(!nombre ? t.alert_nombre : t.alert_fecha);  
          if(!nombre) document.getElementById('nombre-cliente').focus();  
          return;  
      }  

      const select = document.getElementById('tour-select');  
      const tourName = select.options[select.selectedIndex].text;  
      const total = document.getElementById('total-display').innerText;  
      const r_complemento = document.querySelector('input[name="viaha-complemento"]:checked');
      const complementoTexto = r_complemento ? r_complemento.value : "Ruta Fija Corrida";

      const checkboxesPlus = document.querySelectorAll('input[name="viaha-plus"]:checked');
      let plusSeleccionados = [];
      checkboxesPlus.forEach(ch => plusSeleccionados.push(ch.value));
      const plusTexto = plusSeleccionados.length > 0 ? plusSeleccionados.join(', ') : "Ninguno";

      const r_idioma = document.querySelector('input[name="viaha-idioma"]:checked');
      let idiomaTexto = r_idioma ? r_idioma.value : "Español";
      if (idiomaTexto === "Otro") {
          const inputOtro = document.getElementById('input-otro-idioma').value.trim();
          idiomaTexto = inputOtro ? `Otro (${inputOtro})` : "Otro (No especificado)";
      }
       
      gtag('event', 'conversion_reserva_click', {  
          'lead_traveler_name': nombre, 'destination_selected': tourName, 'route_complement': complementoTexto, 'plus_addons': plusTexto,  
          'tour_language_required': idiomaTexto, 'date_range_booked': fechaSeleccionada, 'quantity_adults': adultos, 'quantity_children': ninos,  
          'estimated_total_quoted': total, 'locale_user': idiomaActual  
      });  

      let mensaje = `${t.wa_saludo}${t.wa_nombre} ${nombre}\n${t.wa_tour} ${tourName}\n📍 *Ruta:* ${complementoTexto}\n✨ *Plus:* ${plusTexto}\n🗣️ *Idioma:* ${idiomaTexto}\n${t.wa_fecha} ${fechaSeleccionada}\n${t.wa_adultos} ${adultos}\n${t.wa_ninos} ${ninos}\n${t.wa_total} ${total}\n\n${t.wa_pregunta}`;  
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
                 const bloque = document.getElementById('select-hora-fija').value;
                 gtag('event', 'lead_llamada_disparado', { 'fecha_propuesta': dateStr, 'bloque_horario': bloque });
                 let txt = `¡Hola! Me gustaría coordinar mi llamada de personalización de viaje con Vía Há México.\n\n📅 *Fecha:* ${dateStr}\n⏰ *Horario propuesto:* ${bloque}\n\n¿Me confirman si Roberto y Romain tienen espacio disponible?`;
                 window.open(`https://wa.me/529618150804?text=${encodeURIComponent(txt)}`, '_blank');
             };
         }
     });
}

document.addEventListener("DOMContentLoaded", inicializarSistema);
