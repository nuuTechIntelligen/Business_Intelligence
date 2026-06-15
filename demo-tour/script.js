/** * VARIABLES GLOBALES Y DICCIONARIO DE IDIOMAS 
  */ 
 let adultos = 1; 
 let ninos = 0; 
 let fp = null;  
 let fechaSeleccionada = ""; 
 let idiomaActual = "es"; 

 // Objeto para controlar la posición del carrusel de cada tour de forma independiente 
 const posicionesCarrusel = { 
      cenotes: 0, 
      chichen: 0, 
      celestun: 0,
      coloradas: 0 // NUEVO: Soporte para el carrusel de Coloradas
 }; 

 // NUEVO: Objeto para almacenar los temporizadores de autoplay de cada carrusel 
 const intervalosCarrusel = { 
      cenotes: null, 
      chichen: null, 
      celestun: null,
      coloradas: null // NUEVO: Soporte para el autoplay de Coloradas
 }; 

 const API_URL = 'https://sheetdb.io/api/v1/2s1p744rscfly?sheet=bloqueos'; 

 // NUEVO: Estructura del mapa de contenidos oficiales basado en los flayers de Vía Há México
 const catalogoEstructuraTours = {
     cenotes: {
         complementos: ["Nah-Yah / Su-hem", "Grutas de Tzabnah", "Homún"],
         plus: ["Avistamiento de aves", "Dinámica de observación"]
     },
     chichen: {
         complementos: ["Cenote Zací / Valladolid", "Izamal", "Cenote Lol-Ha / Taller con Chef", "Chichén Itzá Viejo / Cenote Yodzonot"],
         plus: ["Avistamiento de aves", "Dinámica de observación"]
     },
     coloradas: {
         complementos: [], // Ruta fija corrida (Motul, Coloradas, Cancunito)
         plus: ["Avistamiento de aves", "Dinámica de observación", "Sesión fotográfica", "Recorrido en lancha", "Paseo ecoturístico"]
     }
 };

 // DICCIONARIO DE IDIOMAS SINCRONIZADO CON NOMBRE Y SLOGAN OFICIAL
 const traducciones = { 
      es: { 
          hero_title: "VÍA HA' MÉXICO", 
          hero_badge: "✨ Sumérgete al Mayab", 
          pregunta_tour: "¿Qué paraíso quieres visitar hoy?", 
          tour_cenotes: "Tour 4 Cenotes (Bici/Tren)", 
          tour_chichen: "Chichén Itzá & Valladolid", 
          tour_celestun: "Celestún (Flamencos & Manglares)", 
          tour_coloradas: "Coloradas Tour Day",
          titulo_cenotes: "Detalles del Tour Cenotes", 
          desc_cenotes: "Visita 4 cenotes: Cerrado, Semiabierto, Abierto y tipo Río. Incluye bicicletas, chalecos y regaderas con fotografía profesional por Román.", 
          titulo_chichen: "Maravilla del Mundo", 
          desc_chichen: "Recorrido guiado, tiempo libre en Valladolid y visita a un cenote abierto para nadar. Incluye buffet y cobertura fotográfica profesional.", 
          titulo_celestun: "Naturaleza Viva", 
          desc_celestun: "Paseo en lancha para ver flamencos rosas, túneles de manglar y tiempo de playa. Sesión fotográfica de paisaje incluida.", 
          titulo_coloradas: "Coloradas Tour Day",
          desc_coloradas: "Sumérgete en el rosa mexicano de la península. Siente la inmensidad del hábitat de los flamencos.",
          reviews_text: "⭐ Descubre por qué nos recomiendan nuestros viajeros", 
          btn_reviews: "Ver opiniones de clientes ↗", 
          titulo_cotizador: "Cotiza tu grupo", 
          label_nombre: "Nombre de quien solicita", 
          ph_nombre: "Escribe tu nombre completo...", 
          label_nacionalidad: "Nacionalidad", 
          opt_nacional: "🇲🇽 Mexicano / Nacional", 
          opt_extranjero: "✈️ Extranjero / International", 
          label_entradas: "Modalidad de Entradas", 
          opt_sin_entradas: "Tour sin entradas incluidas", 
          opt_con_entradas: "Tour con entradas incluidas", 
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
          wa_perfil: "🌍 *Perfil:*", 
          wa_accesos: "🎟️ *Accesos:*", 
          wa_tour: "🌴 *Tour:*", 
          wa_fecha: "📅 *Fecha:*", 
          wa_adultos: "👥 *Adultos:*", 
          wa_ninos: "👶 *Niños:*", 
          wa_total: "💰 *Total estimado:*", 
          wa_pregunta: "¿Tienen disponibilidad para estas condiciones?", 
          wa_txt_ext: "Sin entradas (Tarifa Extranjero)", 
          wa_txt_con: "Con entradas incluidas", 
          wa_txt_sin: "Sin entradas" 
      }, 
      en: { 
          hero_title: "VÍA HA' MÉXICO", 
          hero_badge: "✨ Immerse yourself in the Mayab", 
          pregunta_tour: "What paradise do you want to visit today?", 
          tour_cenotes: "4 Cenotes Tour (Bike/Train)", 
          tour_chichen: "Chichen Itza & Valladolid", 
          tour_celestun: "Celestun (Flamingos & Mangroves)", 
          tour_coloradas: "Coloradas Tour Day",
          titulo_cenotes: "Cenotes Tour Details", 
          desc_cenotes: "Visit 4 cenotes: Closed, Semi-open, Open, and River type. Includes bikes, life jackets, and showers with professional photo coverage by Roman.", 
          titulo_chichen: "Wonder of the World", 
          desc_chichen: "Guided tour, free time in Valladolid, and visit to an open cenote for swimming. Buffet and professional photo coverage included.", 
          titulo_celestun: "Living Nature", 
          desc_celestun: "Boat ride to see pink flamingos, mangrove tunnels, and beach time. Landscape photo session included.", 
          titulo_coloradas: "Coloradas Tour Day",
          desc_coloradas: "Immerse yourself in the Mexican pink of the peninsula. Feel the vastness of the flamingo habitat.",
          reviews_text: "⭐ Discover why our travelers recommend us", 
          btn_reviews: "See customer reviews ↗", 
          titulo_cotizador: "Quote your group", 
          label_nombre: "Lead Traveler Name", 
          ph_nombre: "Enter your full name...", 
          label_nacionalidad: "Nationality", 
          opt_nacional: "🇲🇽 Mexican / National", 
          opt_extranjero: "✈️ Foreigner / International", 
          label_entradas: "Tickets Modality", 
          opt_sin_entradas: "Tour without tickets included", 
          opt_con_entradas: "Tour with tickets included", 
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
          wa_perfil: "🌍 *Profile:*", 
          wa_accesos: "🎟️ *Access:*", 
          wa_tour: "🌴 *Tour:*", 
          wa_fecha: "📅 *Date:*", 
          wa_adultos: "👥 *Adults:*", 
          wa_ninos: "👶 *Children:*", 
          wa_total: "💰 *Estimated Total:*", 
          wa_pregunta: "Do you have availability for these conditions?", 
          wa_txt_ext: "No tickets (Foreigner Rate)", 
          wa_txt_con: "With tickets included", 
          wa_txt_sin: "Without tickets" 
      } 
 }; 

 async function inicializarSistema() {  
      while (typeof flatpickr === 'undefined') {  
          await new Promise(resolve => setTimeout(resolve, 100));  
      }  

      try {  
          inicializarCalendario();  
          calcular();  
          cargarBloqueos();  
          actualizarLogosDinamicos();   
          inicializarSoportesTactiles();   
          
          // NUEVO: Renderiza los complementos en la carga inicial de la página
          renderizarCamposPersonalizados();

          const select = document.getElementById('tour-select');  
          if (select) {  
              activarAutoplayCarrusel(select.value);  
          }  
           
          const btnReviews = document.getElementById('btn-reviews');  
          if (btnReviews) {  
              btnReviews.addEventListener('click', function() {  
                  gtag('event', 'clic_testimonios', { 'destino_red': 'Instagram_Reviews' });  
              });  
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
      const urlLogo = select.options[select.selectedIndex].getAttribute('data-logo');  
       
      document.querySelectorAll('.dynamic-tour-logo').forEach(img => {  
          img.src = urlLogo;  
      });  
 }  

 function aplicarTextosDeIdioma() {  
      const t = traducciones[idiomaActual];  

      document.querySelectorAll('[data-i18n]').forEach(el => {  
          const key = el.getAttribute('data-i18n');  
          if (t[key]) el.innerText = t[key];  
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

 function cambiarNacionalidad() {  
      const nacionalidad = document.getElementById('nacionalidad-select').value;  
      const wrapperEntradas = document.getElementById('wrapper-entradas');  
      const entradasSelect = document.getElementById('entradas-select');  

      if (nacionalidad === 'extranjero') {  
          entradasSelect.value = 'sin';  
          wrapperEntradas.style.display = 'none';  
      } else {  
          wrapperEntradas.style.display = 'block';  
      }  

      gtag('event', 'interaccion_cotizador', {  
          'tipo_accion': 'cambio_nacionalidad',  
          'perfil_usuario': nacionalidad  
      });  

      calcular();  
 }  

 function cambiarEntradas() {  
      const modalidadEntradas = document.getElementById('entradas-select').value;  
      gtag('event', 'interaccion_cotizador', {  
          'tipo_accion': 'seleccion_entradas',  
          'modalidad': modalidadEntradas  
      });  
      calcular();  
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
      
      // NUEVO: Ejecuta la inyección dinámico en cascada al cambiar el selector
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

      const option = select.options[select.selectedIndex];  
      const nacionalidad = document.getElementById('nacionalidad-select').value;  
      const modalidadEntradas = document.getElementById('entradas-select').value;  

      let precioAdulto = parseInt(option.getAttribute('data-adulto')) || 0;  
      let precioNino = parseInt(option.getAttribute('data-nino')) || 0;  

      if (nacionalidad === 'mexicano' && modalidadEntradas === 'con') {  
          precioAdulto += parseInt(option.getAttribute('data-entrada-adulto')) || 0;  
          precioNino += parseInt(option.getAttribute('data-entrada-nino')) || 0;  
      }  

      const total = (adultos * precioAdulto) + (ninos * precioNino);  
      document.getElementById('total-display').innerText = `$${total.toLocaleString()} MXN`;  
 }  

 // NUEVO: Función para inyectar de forma reactiva los complementos, pluses e idiomas en la columna izquierda
 function renderizarCamposPersonalizados() {
     const tourSeleccionado = document.getElementById('tour-select').value;
     const datos = catalogoEstructuraTours[tourSeleccionado];
     const contenedor = document.getElementById('seccion-personalizacion-tour');
     
     if (!datos || !contenedor) return;

     let htmlInyeccion = "";

     // A. COMPLEMENTOS (Selección única mediante Radios)
     if (datos.complementos.length > 0) {
         htmlInyeccion += `
             <div class="box-personalizacion">
                 <div class="titulo-interactivo">📍 Personaliza tu Ruta (Elige 1)</div>
         `;
         datos.complementos.forEach((comp, index) => {
             htmlInyeccion += `
                 <label class="opcion-item">
                     <input type="radio" name="viaha-complemento" value="${comp}" ${index === 0 ? 'checked' : ''}>
                     <span>${comp}</span>
                 </label>
             `;
         });
         htmlInyeccion += `</div>`;
     } else {
         // Leyenda adaptada para Coloradas (Ruta corrida)
         htmlInyeccion += `
             <div class="box-personalizacion" style="background-color: var(--light-bg); border-style: dashed;">
                 <div class="titulo-interactivo" style="color:#777;">📋 Ruta Integrada Completa</div>
                 <p style="font-size:15px; margin:0; font-family:'Urbanist', sans-serif;">Este itinerario incluye visitas corridas sin exclusiones a: *Motul*, *Las Coloradas* y *Playa Cancunito*.</p>
             </div>
         `;
     }

     // B. PLUS (Múltiple elección mediante Checkboxes)
     if (datos.plus.length > 0) {
         htmlInyeccion += `
             <div class="box-personalizacion">
                 <div class="titulo-interactivo">✨ ¿Quieres agregar un Plus? (Sin costo extra)</div>
         `;
         datos.plus.forEach(pl => {
             htmlInyeccion += `
                 <label class="opcion-item">
                     <input type="checkbox" name="viaha-plus" value="${pl}">
                     <span>${pl}</span>
                 </label>
             `;
         });
         htmlInyeccion += `</div>`;
     }

     // C. IDIOMA DEL TOUR (Radio interactivo con caja de entrada para la opción "Otro")
     htmlInyeccion += `
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

     contenedor.innerHTML = htmlInyeccion;
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
      const nacionalidad = document.getElementById('nacionalidad-select').value;  
      const modalidadEntradas = document.getElementById('entradas-select').value;  

      // NUEVO: Captura de datos dinámicos agregados por el usuario
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

      let perfilTexto = nacionalidad === 'mexicano' ? t.opt_nacional : t.opt_extranjero;  
      let entradasTexto = nacionalidad === 'extranjero' ? t.wa_txt_ext :  
                        (modalidadEntradas === 'con' ? t.wa_txt_con : t.wa_txt_sin);  
       
      let mensaje = `${t.wa_saludo}`;  
      mensaje += `${t.wa_nombre} ${nombre}\n`;  
      mensaje += `${t.wa_perfil} ${perfilTexto}\n`;  
      mensaje += `${t.wa_accesos} ${entradasTexto}\n`;  
      mensaje += `${t.wa_tour} ${tourName}\n`;  
      // NUEVAS ADICIONES AL MENSAJE DE WHATSAPP
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
          'perfil_nacionalidad': nacionalidad,  
          'modalidad_entradas': modalidadEntradas,  
          'idioma_reserva': idiomaActual,
          'complemento_ruta': complementoTexto,
          'plus_agregado': plusTexto,
          'idioma_tour': idiomaTexto
      });  

      window.open(`https://wa.me/525560040025?text=${encodeURIComponent(mensaje)}`, '_blank');  
 }  

/* ==========================================================================
   MÓDULO DE AGENDADO DE LLAMADAS PERSONALIZADAS (OPCIÓN C - HORARIOS FIJOS)
   ========================================================================== */

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
