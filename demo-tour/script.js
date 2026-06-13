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
     celestun: 0 
 }; 

 // NUEVO: Objeto para almacenar los temporizadores de autoplay de cada carrusel 
 const intervalosCarrusel = { 
     cenotes: null, 
     chichen: null, 
     celestun: null 
 }; 

 const API_URL = 'https://sheetdb.io/api/v1/2s1p744rscfly?sheet=bloqueos'; 

 const traducciones = { 
     es: { 
         hero_title: "VIAJÁ", 
         hero_badge: "✨ Experiencias Exclusivas", 
         pregunta_tour: "¿Qué paraíso quieres visitar hoy?", 
         tour_cenotes: "Tour 4 Cenotes (Bici/Tren)", 
         tour_chichen: "Chichén Itzá & Valladolid", 
         tour_celestun: "Celestún (Flamencos & Manglares)", 
         titulo_cenotes: "Detalles del Tour Cenotes", 

         desc_cenotes: "Visita 4 cenotes: Cerrado, Semiabierto, Abierto y tipo Río. Incluye bicicletas, chalecos y regaderas con fotografía profesional por Román.", 
         titulo_chichen: "Maravilla del Mundo", 

         desc_chichen: "Recorrido guiado, tiempo libre en Valladolid y visita a un cenote abierto para nadar. Incluye buffet y cobertura fotográfica profesional.", 
         titulo_celestun: "Naturaleza Viva", 

         desc_celestun: "Paseo en lancha para ver flamencos rosas, túneles de manglar y tiempo de playa. Sesión fotográfica de paisaje incluida.", 
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
         wa_saludo: "¡Hola! Me interesa reservar un tour *PRIVADO* con *Viajá*:\n\n", 
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
         hero_title: "VIAJÁ", 
         hero_badge: "✨ Exclusive Experiences", 
         pregunta_tour: "What paradise do you want to visit today?", 
         tour_cenotes: "4 Cenotes Tour (Bike/Train)", 
         tour_chichen: "Chichen Itza & Valladolid", 
         tour_celestun: "Celestun (Flamingos & Mangroves)", 
         titulo_cenotes: "Cenotes Tour Details", 

         desc_cenotes: "Visit 4 cenotes: Closed, Semi-open, Open, and River type. Includes bikes, life jackets, and showers with professional photo coverage by Roman.", 
         titulo_chichen: "Wonder of the World", 

         desc_chichen: "Guided tour, free time in Valladolid, and visit to an open cenote for swimming. Buffet and professional photo coverage included.", 
         titulo_celestun: "Living Nature", 
         desc_celestun: "Boat ride to see pink flamingos, mangrove tunnels, and beach time. Landscape photo session included.", 
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
         label_adultos: "Adults", 
         label_ninos: "Children (Under 12)", 
         total_estimado: "Estimated Total (Private Service):", 
         btn_reservar: "Book via WhatsApp", 
         alert_nombre: "Please enter your full name to customize your quote.", 
         alert_fecha: "Please select an available date.", 
         wa_saludo: "Hello! I am interested in booking a *PRIVATE* tour with *Viajá*:\n\n", 
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
          
         // CORRECCIÓN: Forzamos a la interfaz a activar el autoplay del tour seleccionado por defecto 
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

 /** * NUEVO: Función para activar el Autoplay automático (Cambia cada 4 segundos = 4000ms) 
  */ 
 function activarAutoplayCarrusel(idTour) { 
     // Limpiamos cualquier temporizador previo para evitar duplicados en memoria 
     if (intervalosCarrusel[idTour]) { 
         clearInterval(intervalosCarrusel[idTour]); 
     } 
      
     // Creamos el intervalo automático 
     intervalosCarrusel[idTour] = setInterval(() => { 
         moverCarrusel(idTour, 1); 
     }, 4000);  
 } 

 /** * NUEVO: Función para detener el Autoplay (Útil cuando el usuario toca la pantalla) 
  */ 
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
             detenerAutoplayCarrusel(idTour); // NUEVO: Si el usuario toca el carrusel, pausamos el autoplay 
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
             activarAutoplayCarrusel(idTour); // NUEVO: Al soltar el dedo, se reactiva el carrusel solo 
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
      
     // 1. Apagamos todos los intervalos activos para que los carruseles ocultos no consuman memoria 
     Object.keys(intervalosCarrusel).forEach(tourKey => detenerAutoplayCarrusel(tourKey)); 

     document.querySelectorAll('.tour-info-card').forEach(card => card.classList.remove('active')); 
     document.getElementById('info-' + selectedTour).classList.add('active'); 
      
     // 2. Encendemos el autoplay exclusivo para el nuevo tour que el usuario acaba de seleccionar 
     activarAutoplayCarrusel(selectedTour); 

     actualizarLogosDinamicos();  

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

     let precioAdulto = parseInt(option.getAttribute('data-adulto')); 
     let precioNino = parseInt(option.getAttribute('data-nino')); 

     if (nacionalidad === 'mexicano' && modalidadEntradas === 'con') { 
         precioAdulto += parseInt(option.getAttribute('data-entrada-adulto')) || 0; 
         precioNino += parseInt(option.getAttribute('data-entrada-nino')) || 0; 
     } 

     const total = (adultos * precioAdulto) + (ninos * precioNino); 
     document.getElementById('total-display').innerText = `$${total.toLocaleString()} MXN`; 
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

     let perfilTexto = nacionalidad === 'mexicano' ? t.opt_nacional : t.opt_extranjero; 

     let entradasTexto = nacionalidad === 'extranjero' ? t.wa_txt_ext : 
 (modalidadEntradas === 'con' ? t.wa_txt_con : t.wa_txt_sin); 
      
     let mensaje = `${t.wa_saludo}`; 
     mensaje += `${t.wa_nombre} ${nombre}\n`; 
     mensaje += `${t.wa_perfil} ${perfilTexto}\n`; 
     mensaje += `${t.wa_accesos} ${entradasTexto}\n`; 
     mensaje += `${t.wa_tour} ${tourName}\n`; 
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
         'idioma_reserva': idiomaActual 
     }); 

     window.open(`https://wa.me/525560040025?text=${encodeURIComponent(mensaje)}`, '_blank'); 
 } 

/* ==========================================================================
   MÓDULO DE AGENDADO DE LLAMADAS PERSONALIZADAS (OPCIONES A, B Y C)
   ========================================================================== */

/**
 * CONTROLADOR MAESTRO: Ejecuta la opción activa elegida por Luis.
 * Solo debes comentar o descomentar la función interna que desees probar.
 */
function dispararAgendado() {
    // Abrimos el contenedor visual de la ventana modal
    document.getElementById('modal-agenda').style.display = 'flex';

    // EJECUCIÓN OPCIÓN A: Google Sheets + Bloques de Horarios (Opción C)
    ejecutarOpcionA_Sheets();

    // EJECUCIÓN OPCIÓN B: Calendly Embebido + Bloques de Horarios (Opción C)
    // Para probar la opción B, comenta la línea de arriba y descomenta la de abajo:
    // ejecutarOpcionB_Calendly();
}

function cerrarModal() {
    document.getElementById('modal-agenda').style.display = 'none';
    document.getElementById('contenedor-render-agenda').innerHTML = '';
}


/**
 * 📊 OPCIÓN A: Lógica conectada a Google Sheets (Vía SheetDB)
 */
function ejecutarOpcionA_Sheets() {
    const contenedor = document.getElementById('contenedor-render-agenda');
    
    // Inyectamos el título explicativo de la llamada
    contenedor.innerHTML = `
        <h3 class="section-title" style="margin-top:0;">Agendar Sesión de Diseño</h3>
        <p style="font-size:15px; margin-bottom:15px;">Selecciona el día de tu preferencia. Nuestro sistema mostrará solo los horarios que Román y Roberto tengan libres en su Google Sheets.</p>
        <div class="form-group">
            <label class="input-label">1. Elige la Fecha</label>
            <input type="text" id="fecha-llamada-sheets" placeholder="Haga clic para abrir el calendario...">
        </div>
        <div id="wrapper-horarios-sheets" class="form-group" style="display:none;">
            <label class="input-label">2. Horarios Disponibles</label>
            <select id="select-hora-sheets" class="tour-picker"></select>
        </div>
        <button type="button" id="btn-confirmar-sheets" class="btn-whatsapp" style="display:none; width:100%; border:none; cursor:pointer;">
            Confirmar e ir a WhatsApp ↗
        </button>
    `;

    // Inicializamos un Flatpickr exclusivo para la llamada
    flatpickr("#fecha-llamada-sheets", {
        locale: "es",
        minDate: "today",
        dateFormat: "Y-m-d",
        onChange: function(selectedDates, dateStr) {
            // Simulamos la consulta a la pestaña de horarios de SheetDB
            // En producción aquí harías un fetch(API_URL + '?sheet=horarios_disponibles')
            const wrapperHoras = document.getElementById('wrapper-horarios-sheets');
            const selectHora = document.getElementById('select-hora-sheets');
            const btnConfirmar = document.getElementById('btn-confirmar-sheets');

            selectHora.innerHTML = '';
            wrapperHoras.style.display = 'block';

            // ----------------------------------------------------------------======
            // CASILLA COMENTADA: ACTIVACIÓN DE LA OPCIÓN C (BLOQUES FIJOS MANUALES)
            // Si Roberto y Román no quieren llenar el Sheets y prefieren bloques predefinidos,
            // deja este bloque activo y borrará las llamadas dinámicas.
            // ----------------------------------------------------------------======
            /*
            selectHora.innerHTML = `
                <option value="Bloque Mañana">Mañana (9:00 AM - 12:00 PM)</option>
                <option value="Bloque Tarde">Tarde (2:00 PM - 5:00 PM)</option>
                <option value="Bloque Sabatino">Sabatino (10:00 AM - 1:00 PM)</option>
            `;
            btnConfirmar.style.display = 'block';
            btnConfirmar.onclick = () => {
                const bloque = selectHora.value;
                const mensaje = encodeURIComponent(`¡Hola! Solicito una llamada personalizada con Vía Há México para el día ${dateStr} en el horario de la ${bloque}. ¿Tienen espacio disponible?`);
                window.open(`https://wa.me/529992719285?text=${mensaje}`, '_blank');
            };
            return; // Detiene la ejecución aquí para no cargar lo de abajo
            */

            // Flujo normal Opción A: Simula la carga de horas libres leídas del Sheets
            const horasFicticiasLibres = ["10:00 AM", "11:30 AM", "4:00 PM"];
            horasFicticiasLibres.forEach(hora => {
                let opt = document.createElement('option');
                opt.value = hora; opt.innerText = hora;
                selectHora.appendChild(opt);
            });

            btnConfirmar.style.display = 'block';
            btnConfirmar.onclick = () => {
                const horaFinal = selectHora.value;
                const mensajeText = `¡Hola! Me gustaría coordinar mi llamada de personalización de viaje con Vía Há México.\n\n📅 *Fecha:* ${dateStr}\n⏰ *Hora seleccionada:* ${horaFinal}\n\n¿Me confirman si el espacio sigue libre en su agenda?`;
                window.open(`https://wa.me/529992719285?text=${encodeURIComponent(mensajeText)}`, '_blank');
            };
        }
    });
}


/**
 * 📅 OPCIÓN B: Lógica de integración con Calendly
 */
function ejecutarOpcionB_Calendly() {
    const contenedor = document.getElementById('contenedor-render-agenda');

    // Renderizamos el cascarón del Widget embebido de Calendly
    contenedor.innerHTML = `
        <h3 class="section-title" style="margin-top:0;">Agenda tu asesoría en vivo</h3>
        <p style="font-size:14px; margin-bottom:10px;">Elige el espacio que mejor se acomode a tu día. El calendario se sincroniza con los teléfonos de Roberto y Román en tiempo real.</p>
        <div id="calendly-inline-widget" style="min-width:320px; height:360px;" data-url="https://calendly.com/viahamexico/asesoria"></div>
    `;

    // Cargamos dinámicamente el script nativo de Calendly para levantar la interfaz
    const scriptCalendly = document.createElement('script');
    scriptCalendly.src = "https://assets.calendly.com/assets/external/widget.js";
    scriptCalendly.async = true;
    document.head.appendChild(scriptCalendly);

    // ----------------------------------------------------------------======
    // CASILLA COMENTADA: RESPALDO DE OPCIÓN C DENTRO DE CALENDLY
    // Si Calendly falla o prefieren meter el formulario de opciones de horario abajo como plan B,
    // puedes descomentar este bloque para inyectar el selector manual abajo del calendario.
    // ----------------------------------------------------------------======
    /*
    const deptoRespaldo = document.createElement('div');
    deptoRespaldo.innerHTML = `
        <div style="margin-top:15px; border-top:1px solid #eee; padding-top:10px;">
            <label class="input-label">¿No encontraste horario? Propón un bloque:</label>
            <select id="respaldo-bloque-b" class="tour-picker" style="margin-bottom:10px;">
                <option value="Mañana">Mañana (9:00 AM - 12:00 PM)</option>
                <option value="Tarde">Tarde (2:00 PM - 5:00 PM)</option>
            </select>
            <button type="button" class="btn-whatsapp" style="width:100%; border:none;" onclick="alert('Enviando bloque por WhatsApp...')">Proponer por WhatsApp</button>
        </div>
    `;
    contenedor.appendChild(deptoRespaldo);
    */
}

 document.addEventListener("DOMContentLoaded", inicializarSistema);
