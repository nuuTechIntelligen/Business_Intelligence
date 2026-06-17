/** * VARIABLES GLOBALES Y DICCIONARIO DE IDIOMAS 
  */ 
 let adultos = 1; 
 let ninos = 0; 
 let fp = null;  
 let fechaSeleccionada = ""; 
 let idiomaActual = "es"; 

 // MODIFICACIÓN: Expandimos los objetos controladores de carruseles para soportar los 6 tours estables
 const posicionesCarrusel = { 
      cenotes: 0, 
      chichen: 0, 
      coloradas: 0,
      uxmal: 0,
      celestun: 0,
      campeche: 0
 }; 

 const intervalosCarrusel = { 
      cenotes: null, 
      chichen: null, 
      coloradas: null,
      uxmal: null,
      celestun: null,
      campeche: null
 }; 

 const API_URL = 'https://sheetdb.io/api/v1/2s1p744rscfly?sheet=bloqueos'; 

 // MODIFICACIÓN CRÍTICA: Base de datos expandida de 3 a 6 tours oficiales mapeando complementos y pluses
 const catalogoEstructuraTours = {
     cenotes: {
         complementos: ["Nah-Yah / Su-hem", "Grutas de Tzabnah", "Homún"],
         plus: ["Avistamiento de aves", "Dinámica de observación","Hacienda Pixyah","Taller Tekit"]
     },
     chichen: {
         complementos: ["Cenote Zací / Valladolid", "Izamal", "Cenote Lol-Ha / Taller con Chef", "Chichén Itzá Viejo / Cenote Yodzonot"],
         plus: ["Avistamiento de aves", "Dinámica de observación"]
     },
     coloradas: {
         complementos: [], 
         plus: ["Avistamiento de aves", "Dinámica de observación", "Sesión fotográfica", "Recorrido en lancha", "Paseo ecoturístico"]
     },
     uxmal: {
         complementos: ["Chocostory", "Hda Mucuyché", "Yaal Utzil"],
         plus: ["Avistamiento de aves", "Dinámica de observación"]
     },
     celestun: {
         complementos: ["Bote", "Lancha"],
         plus: ["Avistamiento de aves", "Dinámica de observación"]
     },
     campeche: {
         complementos: ["Tour de 1 dia", "Tour de 2 dias"],
         plus: ["Avistamiento de aves", "Dinámica de observación"]
     }
 };

 // MODIFICACIÓN CRÍTICA: Clonación temporal y estable de tarifas de Chichén para las rutas 4, 5 y 6
 const matrizTarifasEscaladas = {
     cenotes: {
         "Nah-Yah / Su-hem": { 2: 1550, 3: 2150, 4: 3200 },
         "Grutas de Tzabnah": { 2: 1600, 3: 2200, 4: 3300 },
         "Homún":             { 2: 1700, 3: 2300, 4: 3500 }
     },
     chichen: {
         "Cenote Zací / Valladolid":       { 2: 1880, 3: 1300, 4: 1000 },
         "Izamal":                         { 2: 1700, 3: 1150, 4: 900 },
         "Cenote Lol-Ha / Taller con Chef": { 2: 1700, 3: 1150, 4: 900 },
         "Chichén Itzá Viejo / Cenote Yodzonot": { 2: 1700, 3: 1150, 4: 900 }
     },
     coloradas: {
         "Ruta Fija Corrida": { 2: 1650, 3: 2300, 4: 3500 }
     },
     uxmal: {
         "Chocostory":   { 2: 1880, 3: 1300, 4: 1000 },
         "Hda Mucuyché": { 2: 1700, 3: 1150, 4: 900 },
         "Yaal Utzil":   { 2: 1700, 3: 1150, 4: 900 }
     },
     celestun: {
         "Bote":   { 2: 1880, 3: 1300, 4: 1000 },
         "Lancha": { 2: 1700, 3: 1150, 4: 900 }
     },
     campeche: {
         "Tour de 1 dia":  { 2: 1880, 3: 1300, 4: 1000 },
         "Tour de 2 dias": { 2: 1700, 3: 1150, 4: 900 }
     }
 };

 const traducciones = { 
      es: { 
          hero_title: "VÍA HA' MÉXICO", 
          hero_badge: "✨ Sumérgete al Mayab", 
          pregunta_tour: "¿Qué paraíso quieres visitar hoy?", 
          tour_cenotes: "Tour Cenotes", 
          tour_chichen: "Chichén Itzá", 
          tour_coloradas: "Coloradas Tour Day",
          tour_uxmal: "Uxmal",
          tour_celestun: "Celestún",
          tour_campeche: "Campeche",
          titulo_cenotes: "Detalles del Tour Cenotes", 
          desc_cenotes: "Visita 4 cenotes: Cerrado, Semiabierto, Abierto y tipo Río. Incluye bicicletas, chalecos y regaderas con fotografía profesional por Román.", 
          titulo_chichen: "Maravilla del Mundo", 
          desc_chichen: "Recorrido guiado, tiempo libre en Valladolid y visita a un cenote abierto para nadar. Incluye buffet y cobertura fotográfica profesional.", 
          titulo_coloradas: "Coloradas Tour Day",
          desc_coloradas: "Sumérgete en el rosa mexicano de la península. Siente la inmensidad del hábitat de los flamencos.",
          titulo_uxmal: "Detalles Tour Uxmal",
          desc_uxmal: "Descubre la majestuosidad de la arquitectura puuc, explora su historia y déjate maravillar por sus leyendas ancestrales.",
          titulo_celestun: "Detalles Tour Celestún",
          desc_celestun: "Siente la naturaleza viva explorando los manglares y avistando las colonias de flamencos rosas en su hábitat natural.",
          titulo_campeche: "Detalles Tour Campeche",
          desc_campeche: "Camina por los baluartes de una histórica ciudad fortificada frente al mar y revive historias de piratas del Caribe.",
          reviews_text: "⭐ Descubre por qué nos recomiendan nuestros viajeros", 
          titulo_cotizador: "Cotiza tu grupo", 
          label_nombre: "Nombre de quien solicita", 
          ph_nombre: "Escribe tu nombre completo...", 
          label_fecha: "Fecha del Recorrido", 
          ph_fecha: "Selecciona una fecha o rango...", 
          label_adultos: "Adultos", 
          label_ninos: "Niños (-12 años)", 
          total_estimado: "Total Estimado (Servicio Privado):", 
          btn_reservar: "Reservar por WhatsApp", 
          alert_nombre: "Por favor, ingresa tu nombre completo para personalizar tu cotización.", 
          alert_fecha: "Por favor, selecciona una fecha disponible.", 
          wa_saludo: "¡Hola! Me interesa reservar un tour *PRIVADO* con *VÍA HA' MÉXICO*:\n\n", 
          wa_nombre: "👤 *Nombre:*", 
          wa_tour: "🌴 *Tour:*", 
          wa_fecha: "📅 *Fecha:*", 
          wa_adultos: "👥 *Adultos:*", 
          wa_ninos: "👶 *Niños:*", 
          wa_total: "💰 *Total estimado:*", 
          wa_pregunta: "¿Tienen disponibilidad para estas condiciones?",
          inc_title: "🟢 Incluye",
          no_inc_title: "🔴 No Incluye",
          inc_cenotes_list: "<li>Transporte desde tu lugar de Hospedaje.</li><li>Guía Federal Certificado.</li><li>Hielera con agua.</li><li>Estacionamientos y Peajes.</li>",
          no_inc_cenotes_list: "<li>Entradas.</li><li>Alimentos.</li>",
          inc_chichen_list: "<li>Transporte desde tu lugar de Hospedaje.</li><li>Guía Federal Certificado.</li><li>Hielera con agua.</li><li>Estacionamientos y Peajes.</li>",
          no_inc_chichen_list: "<li>Entradas.</li><li>Alimentos.</li>",
          inc_coloradas_list: "<li>Transporte desde tu lugar de Hospedaje.</li><li>Guía Federal Certificado.</li><li>Hielera con agua.</li><li>Estacionamientos y Peajes.</li>",
          no_inc_coloradas_list: "<li>Entradas.</li><li>Alimentos.</li>",
          inc_uxmal_list: "<li>Transporte desde tu lugar de Hospedaje.</li><li>Guía Federal Certificado.</li><li>Hielera con agua.</li><li>Estacionamientos y Peajes.</li>",
          no_inc_uxmal_list: "<li>Entradas.</li><li>Alimentos.</li>",
          inc_celestun_list: "<li>Transporte desde tu lugar de Hospedaje.</li><li>Guía Federal Certificado.</li><li>Hielera con agua.</li><li>Estacionamientos y Peajes.</li>",
          no_inc_celestun_list: "<li>Entradas.</li><li>Alimentos.</li>",
          inc_campeche_list: "<li>Transporte desde tu lugar de Hospedaje.</li><li>Guía Federal Certificado.</li><li>Hielera con agua.</li><li>Estacionamientos y Peajes.</li>",
          no_inc_campeche_list: "<li>Entradas.</li><li>Alimentos.</li>",
          sello_sustentable_texto: "<strong>Garantía Mexcellent:</strong> Al contratar tu experiencia con Vía Há México, un porcentaje de tu pago se destina directamente al desarrollo sustentable de las comunidades mayas y la preservación de su entorno natural."
      }, 
      en: { 
          hero_title: "VÍA HA' MÉXICO", 
          hero_badge: "✨ Immerse yourself in the Mayab", 
          pregunta_tour: "What paradise do you want to visit today?", 
          tour_cenotes: "Cenotes Tour", 
          tour_chichen: "Chichen Itza", 
          tour_coloradas: "Coloradas Tour Day",
          tour_uxmal: "Uxmal",
          tour_celestun: "Celestun",
          tour_campeche: "Campeche",
          titulo_cenotes: "Cenotes Tour Details", 
          desc_cenotes: "Visit 4 cenotes: Closed, Semi-open, Open, and River type. Includes bikes, life jackets, and showers with professional photo coverage by Roman.", 
          titulo_chichen: "Wonder of the World", 
          desc_chichen: "Guided tour, free time in Valladolid, and visit to an open cenote for swimming. Buffet and professional photo coverage included.", 
          titulo_coloradas: "Coloradas Tour Day",
          desc_coloradas: "Immerse yourself in the Mexican pink of the peninsula. Feel the vastness of the flamingo habitat.",
          titulo_uxmal: "Uxmal Tour Details",
          desc_uxmal: "Discover the majesty of puuc architecture, explore its history, and let yourself be amazed by its ancestral legends.",
          titulo_celestun: "Celestun Tour Details",
          desc_celestun: "Feel living nature exploring mangroves and spotting pink flamingo colonies in their natural habitat.",
          titulo_campeche: "Campeche Tour Details",
          desc_campeche: "Walk along the bastions of a historical fortified city facing the sea and relive stories of Caribbean pirates.",
          reviews_text: "⭐ Discover why our travelers recommend us", 
          titulo_cotizador: "Quote your group", 
          label_nombre: "Lead Traveler Name", 
          ph_nombre: "Enter your full name...", 
          label_fecha: "Tour Date", 
          ph_fecha: "Select a date or range...", 
          label_adultos: "Adultos", 
          label_ninos: "Children (Under 12)", 
          total_estimado: "Estimated Total (Private Service):", 
          btn_reservar: "Book via WhatsApp", 
          alert_nombre: "Please enter your full name to customize your quote.", 
          alert_fecha: "Please select an available date.", 
          wa_saludo: "Hello! I am interested in booking a *PRIVATE* tour with *VÍA HA' MÉXICO*:\n\n", 
          wa_nombre: "👤 *Name:*", 
          wa_tour: "🌴 *Tour:*", 
          wa_fecha: "📅 *Date:*", 
          wa_adultos: "👥 *Adults:*", 
          wa_ninos: "👶 *Children:*", 
          wa_total: "💰 *Estimated Total:*", 
          wa_pregunta: "Do you have availability for these conditions?",
          inc_title: "🟢 Includes",
          no_inc_title: "🔴 Not Includes",
          inc_cenotes_list: "<li>Pick-up from your lodging location.</li><li>Certified Federal Guide.</li><li>Cooler with water.</li><li>Parking fees and tolls.</li>",
          no_inc_cenotes_list: "<li>Tickets.</li><li>Meals.</li>",
          inc_chichen_list: "<li>Pick-up from your lodging location.</li><li>Certified Federal Guide.</li><li>Cooler with water.</li><li>Parking fees and tolls.</li>",
          no_inc_chichen_list: "<li>Tickets.</li><li>Meals.</li>",
          inc_coloradas_list: "<li>Pick-up from your lodging location.</li><li>Certified Federal Guide.</li><li>Cooler with water.</li><li>Parking fees and tolls.</li>",
          no_inc_coloradas_list: "<li>Tickets.</li><li>Meals.</li>",
          inc_uxmal_list: "<li>Pick-up from your lodging location.</li><li>Certified Federal Guide.</li><li>Cooler with water.</li><li>Parking fees and tolls.</li>",
          no_inc_uxmal_list: "<li>Tickets.</li><li>Meals.</li>",
          inc_celestun_list: "<li>Pick-up from your lodging location.</li><li>Certified Federal Guide.</li><li>Cooler with water.</li><li>Parking fees and tolls.</li>",
          no_inc_celestun_list: "<li>Tickets.</li><li>Meals.</li>",
          inc_campeche_list: "<li>Pick-up from your lodging location.</li><li>Certified Federal Guide.</li><li>Cooler with water.</li><li>Parking fees and tolls.</li>",
          no_inc_campeche_list: "<li>Tickets.</li><li>Meals.</li>",
          sello_sustentable_texto: "<strong>Mexcellent Guarantee:</strong> When booking your experience with Vía Há México, a percentage of your payment goes directly to the sustainable development of Mayan communities and the preservation of their natural environment."
      } 
 }; 

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
          if (select) {  
              activarAutoplayCarrusel(select.value);  
          }  
      } catch (error) {  
          console.error("❌ Error en inicialización:", error.message);  
      }  
 }  

 function inicializarCalendario() {  
      const campoFecha = document.getElementById('fecha-reserva');  
      if (!campoFecha) return;  

      if (fp) fp.destroy();   

      fp = flatpickr(campoFecha, {  
          locale: idiomaActual === 'es' ? "es" : "default",   
          mode: "range",   
          minDate: "today",   
          dateFormat: "Y-m-d",  
          altInput: true,   
          altFormat: "d/m/Y",  
          altInputClass: "flatpickr-input",  
          disableMobile: true,  
          disable: [],   
          onChange: function(selectedDates, dateStr) {  
              fechaSeleccionada = dateStr;  
              gtag('event', 'interaccion_cotizador', {  
                  'tipo_accion': 'seleccion_fecha',  
                  'fecha_viaje': dateStr  
              });  
          }  
      });  
 }  

 function moverCarrusel(idTour, direccion) {  
      const track = document.getElementById(`track-${idTour}`);  
      if (!track) return;  
      const imagenes = track.querySelectorAll('img');  
      const totalImagenes = imagenes.length;  
       
      posicionesCarrusel[idTour] += direccion;  
       
      if (posicionesCarrusel[idTour] >= totalImagenes) posicionesCarrusel[idTour] = 0;  
      if (posicionesCarrusel[idTour] < 0) posicionesCarrusel[idTour] = totalImagenes - 1;  
       
      const porcentajeMovimiento = posicionesCarrusel[idTour] * -100;  
      track.style.transform = `translateX(${porcentajeMovimiento}%)`;  

      gtag('event', 'interaccion_galeria', {  
          'id_tour': idTour,  
          'imagen_index': posicionesCarrusel[idTour]  
      }); 
 }  

 function activarAutoplayCarrusel(idTour) {  
      if (intervalosCarrusel[idTour]) {  
          clearInterval(intervalosCarrusel[idTour]);  
      }  
       
      intervalosCarrusel[idTour] = setInterval(() => {  
          moverCarrusel(idTour, 1);  
      }, 4000);   
 }  

 function detenerAutoplayCarrusel(idTour) {  
      if (intervalosCarrusel[idTour]) {  
          clearInterval(intervalosCarrusel[idTour]);  
          intervalosCarrusel[idTour] = null;  
      }  
 }  

 function inicializarSoportesTactiles() {  
      const contenedores = document.querySelectorAll('.carousel-container');  
       
      contenedores.forEach(container => {  
          let xInicial = null;  
          const track = container.querySelector('.carousel-track');  
          if(!track) return;  
          const idTour = track.id.replace('track-', '');  

          container.addEventListener('touchstart', (e) => {  
              detenerAutoplayCarrusel(idTour);  
              xInicial = e.touches[0].clientX;  
          }, { passive: true });  

          container.addEventListener('touchend', (e) => {  
              if (!xInicial) return;  
              let xFinal = e.changedTouches[0].clientX;  
              let diferenciaX = xInicial - xFinal;  

              if (Math.abs(diferenciaX) > 50) {  
                  if (diferenciaX > 0) {  
                      moverCarrusel(idTour, 1);   
                  } else {  
                      moverCarrusel(idTour, -1);   
                  }  
              }  
              xInicial = null;  
              activarAutoplayCarrusel(idTour);  
          }, { passive: true });  
      });  
 }  

 function actualizarLogosDinamicos() {  
      const select = document.getElementById('tour-select');  
      if (!select) return;  
      
      const categoria = select.options[select.selectedIndex].getAttribute('data-categoria');  
      
      const svgNaturaleza = `
          <svg viewBox="0 0 24 24" fill="none" stroke="#ECBB90" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 22a7 7 0 0 0 7-7c0-4.3-7-13-7-13S5 10.7 5 15a7 7 0 0 0 7 7z"/>
          </svg>
      `;

      const svgCultura = `
          <svg viewBox="0 0 24 24" fill="none" stroke="#BEDFCA" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 21h18M5 21V10l7-6 7 7v11M9 21v-4a3 3 0 0 1 6 0v4"/>
          </svg>
      `;

      const svgFinal = (categoria === "cultura") ? svgCultura : svgNaturaleza;

      document.querySelectorAll('.dynamic-tour-logo-container').forEach(container => {  
          container.innerHTML = svgFinal;  
      });  
 }  

 function aplicarTextosDeIdioma() {  
      const t = traducciones[idiomaActual];  

      document.querySelectorAll('[data-i18n]').forEach(el => {  
          const key = el.getAttribute('data-i18n');  
          if (t[key]) {
              if(key.includes('_list') || key.includes('sello_')) {
                  el.innerHTML = t[key];
              } else {
                  el.innerText = t[key];
              }
          }  
      });  

      document.querySelectorAll('[data-i18n-ph]').forEach(el => {  
          const key = el.getAttribute('data-i18n-ph');  
          if (t[key]) el.placeholder = t[key];  
      });  

      inicializarCalendario();  
      cargarBloqueos();   
      actualizarInterfaz();  
       
      gtag('event', 'cambio_idioma', { 'idioma_seleccionado': idiomaActual });  
 }  

 function cambiarIdioma() {  
      idiomaActual = document.getElementById('lang-switch').value;  
      aplicarTextosDeIdioma();  
 }  

 function cargarBloqueos() {  
      fetch(API_URL)  
          .then(res => res.json())  
          .then(data => {  
              const fechas = data  
                  .filter(row => row.fecha && row.fecha.trim().length > 5)  
                  .map(row => row.fecha.trim());  

              if (fp && typeof fp.set === 'function') {  
                  fp.set("disable", fechas);  
              }  
          })  
          .catch(err => console.error("❌ Error conectando con SheetDB:", err));  
 }  

 function cambiarCant(tipo, cambio) {  
      if (tipo === 'adultos') {  
          if (adultos + cambio >= 1) adultos += cambio;   
          document.getElementById('qty-adultos').innerText = adultos; 
      } else {  
          if (ninos + cambio >= 0) ninos += cambio;   
          document.getElementById('qty-ninos').innerText = ninos;  
      }  
       
      gtag('event', 'interaccion_cotizador', {  
          'tipo_accion': 'modificar_pasajeros',  
          'categoria': tipo,  
          'valor_actual': tipo === 'adultos' ? adultos : ninos  
      });  

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

      gtag('event', 'ver_tour', {  
          'id_tour': selectedTour,  
          'nombre_tour': select.options[select.selectedIndex].text  
      });  

      calcular();  
 }  

 function calcular() {  
      const select = document.getElementById('tour-select');  
      if(!select) return;  

      const idTour = select.value;  
      const totalPasajeros = adultos + ninos; 

      const r_complemento = document.querySelector('input[name="viaha-complemento"]:checked');
      const complementoSeleccionado = r_complemento ? r_complemento.value : "Ruta Fija Corrida";

      const bloqueTour = matrizTarifasEscaladas[idTour];
      if (!bloqueTour) return;
      
      const rangosDeCombinacion = bloqueTour[complementoSeleccionado];
      if (!rangosDeCombinacion) return;

      let totalGlobal = 0;

      if (totalPasajeros <= 2) {
          totalGlobal = rangosDeCombinacion[2];
      } else {
          let llaveRango = (totalPasajeros === 3) ? 3 : 4;
          const precioPorPersona = rangosDeCombinacion[llaveRango];
          totalGlobal = totalPasajeros * precioPorPersona;  
      }

      document.getElementById('total-display').innerText = `$${totalGlobal.toLocaleString()} MXN`;  
 }  

 function renderizarCamposPersonalizados() {
     const tourSeleccionado = document.getElementById('tour-select').value;
     const datos = catalogoEstructuraTours[tourSeleccionado];
     const contenedorIzquierdo = document.getElementById('seccion-personalizacion-tour');
     const contenedorDerecho = document.getElementById('seccion-idioma-tour');
     
     if (!datos || !contenedorIzquierdo || !contenedorDerecho) return;

     let htmlIzquierdo = "";

     if (datos.complementos.length > 0) {
         htmlIzquierdo += `
             <div class="box-personalizacion">
                 <div class="titulo-interactivo">📍 Personaliza tu Ruta (Elige 1)</div>
         `;
         datos.complementos.forEach((comp, index) => {
             htmlIzquierdo += `
                 <label class="opcion-item">
                     <input type="radio" name="viaha-complemento" value="${comp}" ${index === 0 ? 'checked' : ''} onchange="calcular()">
                     <span>${comp}</span>
                 </label>
             `;
         });
         htmlIzquierdo += `</div>`;
     } else {
         htmlIzquierdo += `
             <div class="box-personalizacion" style="background-color: var(--light-bg); border-style: dashed;">
                 <div class="titulo-interactivo">📋 Ruta Integrada Completa</div>
                 <p style="font-size:15px; margin:0; font-family:'Urbanist', sans-serif;">Este itinerario incluye: *Motul*, *Las Coloradas* y *Playa Cancunito*.</p>
             </div>
         `;
     }

     if (datos.plus.length > 0) {
         htmlIzquierdo += `
             <div class="box-personalizacion">
                 <div class="titulo-interactivo">✨ ¿Quieres agregar un Plus?</div>
         `;
         datos.plus.forEach(pl => {
             htmlIzquierdo += `
                 <label class="opcion-item">
                     <input type="checkbox" name="viaha-plus" value="${pl}">
                     <span>${pl}</span>
                 </label>
             `;
             
             if(pl === "Paseo ecoturístico") {
                 htmlIzquierdo += `
                     <ul class="sub-detalles-plus">
                         <li>Playa Virgen</li>
                         <li>Laguna Azul</li>
                         <li>Pecesitos</li>
                         <li>Baño Maya</li>
                         <li>Tortugario</li>
                     </ul>
                 `;
             }
         });
         htmlIzquierdo += `</div>`;
     }
     contenedorIzquierdo.innerHTML = htmlIzquierdo;

     let htmlDerecho = `
         <div class="box-personalizacion">
             <div class="titulo-interactivo">🗣️ Idioma del Tour Privado</div>
             <label class="opcion-item"><input type="radio" name="viaha-idioma" value="Español" checked onclick="document.getElementById('wrapper-otro-idioma').style.display='none'"> <span>Español</span></label>
             <label class="opcion-item"><input type="radio" name="viaha-idioma" value="Inglés" onclick="document.getElementById('wrapper-otro-idioma').style.display='none'"> <span>Inglés</span></label>
             <label class="opcion-item"><input type="radio" name="viaha-idioma" value="Francés" onclick="document.getElementById('wrapper-otro-idioma').style.display='none'"> <span>Francés</span></label>
             <label class="opcion-item"><input type="radio" name="viaha-idioma" value="Otro" onclick="document.getElementById('wrapper-otro-idioma').style.display='block'"> <span>Otro idioma</span></label>
             
             <div id="wrapper-otro-idioma" style="display:none;">
                 <input type="text" id="input-otro-idioma" class="input-otro-idioma" placeholder="Especificar idioma...">
             </div>
         </div>
     `;
     contenedorDerecho.innerHTML = htmlDerecho;
 }

 function enviarWhatsApp() {  
      const t = traducciones[idiomaActual];  
      const nombre = document.getElementById('nombre-cliente').value.trim();  
       
      if (!nombre) {  
          alert(t.alert_nombre);  
          document.getElementById('nombre-cliente').focus();  
          return;  
      }  

      if (!fechaSeleccionada) {  
          alert(t.alert_fecha);  
          return;  
      }  

      const select = document.getElementById('tour-select');  
      const tourName = select.options[select.selectedIndex].text;  
      const idTour = select.value;  
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
       
      let mensaje = `${t.wa_saludo}`;  
      mensaje += `${t.wa_nombre} ${nombre}\n`;  
      mensaje += `${t.wa_tour} ${tourName}\n`;  
      mensaje += `📍 *Ruta/Complemento:* ${complementoTexto}\n`;
      mensaje += `✨ *Plus Elegidos:* ${plusTexto}\n`;
      mensaje += `🗣️ *Idioma Requerido:* ${idiomaTexto}\n`;
      mensaje += `${t.wa_fecha} ${fechaSeleccionada}\n`;  
      mensaje += `${t.wa_adultos} ${adultos}\n`;  
      mensaje += `${t.wa_ninos} ${ninos}\n`;  
      mensaje += `${t.wa_total} ${total}\n\n`;  
      mensaje += `${t.wa_pregunta}`;  

      gtag('event', 'click_whatsapp', {  
          'nombre_viajero': nombre,  
          'nombre_tour': tourName,  
          'id_tour': idTour,  
          'fecha_reserva': fechaSeleccionada,  
          'total_cotizado': total,  
          'cantidad_adultos': adultos,  
          'cantidad_ninos': ninos,  
          'idioma_reserva': idiomaActual,
          'complemento_ruta': complementoTexto,
          'plus_agregado': plusTexto,
          'idioma_tour': idiomaTexto
      });  

      window.open(`https://wa.me/525560040025?text=${encodeURIComponent(mensaje)}`, '_blank');  
 }  

 function dispararAgendado() {
     document.getElementById('modal-agenda').style.display = 'flex';
     ejecutarOpcionC_HorariosFijos();
 }

 function cerrarModal() {
     document.getElementById('modal-agenda').style.display = 'none';
     document.getElementById('contenedor-render-agenda').innerHTML = '';
 }

 function ejecutarOpcionC_HorariosFijos() {
     const contenedor = document.getElementById('contenedor-render-agenda');
      
     contenedor.innerHTML = `
         <h3 class="section-title" style="margin-top:0;">Agendar Sesión de Diseño</h3>
         <p style="font-size:15px; margin-bottom:15px;">Selecciona el día y el bloque de horario de tu preferencia para coordinar tu llamada personalizada con el equipo.</p>
          
         <div class="form-group">
             <label class="input-label">1. Elige la Fecha</label>
             <input type="text" id="fecha-llamada-fija" placeholder="Haga clic para abrir el calendario..." readonly>
         </div>
          
         <div id="wrapper-horarios-fijos" class="form-group" style="display:none;">
             <label class="input-label">2. Horarios Disponibles</label>
             <select id="select-hora-fija" class="tour-picker">
                 <option value="Mañana (9:00 AM - 12:00 PM)">Mañana (9:00 AM - 12:00 PM)</option>
                 <option value="Tarde (2:00 PM - 5:00 PM)">Tarde (2:00 PM - 5:00 PM)</option>
                 <option value="Sabatino (10:00 AM - 1:00 PM)">Sabatino (10:00 AM - 1:00 PM)</option>
             </select>
         </div>
          
         <button type="button" id="btn-confirmar-fijo" class="btn-whatsapp" style="display:none; width:100%; border:none; cursor:pointer;">
             Confirmar e ir a WhatsApp ↗
         </button>
     `;

     flatpickr("#fecha-llamada-fija", {
         locale: "es",
         minDate: "today",
         dateFormat: "Y-m-d",
         onChange: function(selectedDates, dateStr) {
             const wrapperHoras = document.getElementById('wrapper-horarios-fijos');
             const selectHora = document.getElementById('select-hora-fija');
             const btnConfirmar = document.getElementById('btn-confirmar-fijo');

             wrapperHoras.style.display = 'block';
             btnConfirmar.style.display = 'block';

             btnConfirmar.onclick = () => {
                 const bloqueSeleccionado = selectHora.value;
                 const mensajeText = `¡Hola! Me gustaría coordinar mi llamada de personalización de viaje con Vía Há México.\n\n📅 *Fecha:* ${dateStr}\n⏰ *Horario propuesto:* ${bloqueSeleccionado}\n\n¿Me confirman si Roberto y Román tienen espacio disponible?`;
                  
                 window.open(`https://wa.me/529992719285?text=${encodeURIComponent(mensajeText)}`, '_blank');
             };
         }
     });
 }

 document.addEventListener("DOMContentLoaded", inicializarSistema);
