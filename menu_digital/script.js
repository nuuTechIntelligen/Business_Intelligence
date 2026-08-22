// 1. Al abrir el modal, asegurar el reseteo y la lectura limpia
function abrirModalPersonalizacion(productoId) {
    const prod = productosGlobales.find(p => p.id == productoId);
    if (!prod || String(prod.disponible).toUpperCase() !== 'SI') return;

    productoSeleccionado = prod;

    document.getElementById('modalProductTitle').textContent = prod.nombre;
    document.getElementById('modalProductDesc').textContent = prod.descripcion || '';
    document.getElementById('modalProductPrice').textContent = prod.venta_por_monto === 'SI' ? '$20.00' : `$${parseFloat(prod.precio).toFixed(2)}`;

    // Parseo seguro del límite de ingredientes
    const rawMax = prod.max_ingredientes ? String(prod.max_ingredientes).trim() : '0';
    limiteIngredientesActual = isNaN(parseInt(rawMax)) ? 0 : parseInt(rawMax);

    // Venta por Monto
    const amountGroup = document.getElementById('modalAmountGroup');
    if (prod.venta_por_monto === 'SI') {
        amountGroup.style.display = 'block';
        montoMinimoActual = parseFloat(prod.monto_minimo || '10');
        renderizarPillsMontoDinámicas(prod.montos_sugeridos, montoMinimoActual);
    } else {
        amountGroup.style.display = 'none';
    }

    renderizarOpcionesModal('modalBaseGroup', 'modalBaseTitle', 'modalBaseOptions', prod.grupo_base_nombre, prod.grupo_base_opciones, 'radio', 'grupo_base');
    renderizarOpcionesModal('modalIngredientsGroup', 'modalIngredientsTitle', 'modalIngredientsOptions', prod.grupo_ingredientes_nombre, prod.grupo_ingredientes_opciones, 'checkbox', 'grupo_ing');
    renderizarOpcionesModal('modalSaucesGroup', 'modalSaucesTitle', 'modalSaucesOptions', prod.grupo_salsas_nombre, prod.grupo_salsas_opciones, 'radio', 'grupo_salsa');

    // Inicializar el contador en 0
    actualizarBadgeLimiteIngredientes(0);

    document.getElementById('productModal').classList.add('active');
}

// 2. Desbloquear todos los chips al construir las opciones
function renderizarOpcionesModal(groupId, titleId, containerId, nombreGrupo, opcionesTexto, inputType, inputName) {
    const groupEl = document.getElementById(groupId);
    const titleEl = document.getElementById(titleId);
    const containerEl = document.getElementById(containerId);

    if (!opcionesTexto || opcionesTexto.trim() === '') {
        groupEl.style.display = 'none';
        containerEl.innerHTML = '';
        return;
    }

    groupEl.style.display = 'block';
    titleEl.textContent = nombreGrupo || 'Selecciona tus opciones';

    const opciones = opcionesTexto.split(',').map(o => o.trim()).filter(o => o.length > 0);
    containerEl.innerHTML = '';

    let searchInput = groupEl.querySelector('.modal-search-input');
    if (opciones.length > 8) {
        if (!searchInput) {
            searchInput = document.createElement('input');
            searchInput.type = 'text';
            searchInput.className = 'modal-search-input';
            searchInput.placeholder = '🔍 Buscar opción... (ej. Cheto, Takis, Fresa)';
            groupEl.insertBefore(searchInput, containerEl);
        }
        searchInput.value = '';
        searchInput.style.display = 'block';

        searchInput.oninput = (e) => {
            const query = e.target.value.toLowerCase();
            const chips = containerEl.querySelectorAll('.option-chip');
            chips.forEach(chip => {
                const text = chip.querySelector('span').textContent.toLowerCase();
                chip.style.display = text.includes(query) ? 'flex' : 'none';
            });
        };
    } else if (searchInput) {
        searchInput.style.display = 'none';
    }

    opciones.forEach((op, index) => {
        const label = document.createElement('label');
        label.className = 'option-chip';
        label.innerHTML = `
            <input type="${inputType}" name="${inputName}" value="${op}" ${inputType === 'radio' && index === 0 ? 'checked' : ''} onchange="manejarCambioIngredientes(this)">
            <span>${op}</span>
        `;
        containerEl.appendChild(label);
    });
}

// 3. Control exacto de bloqueo y desbloqueo
function manejarCambioIngredientes(inputEl) {
    if (inputEl.type !== 'checkbox') return;

    const checkboxes = document.querySelectorAll('input[name="grupo_ing"]');
    const seleccionados = Array.from(checkboxes).filter(cb => cb.checked);
    const totalSeleccionados = seleccionados.length;

    actualizarBadgeLimiteIngredientes(totalSeleccionados);

    if (limiteIngredientesActual > 0) {
        if (totalSeleccionados >= limiteIngredientesActual) {
            checkboxes.forEach(cb => {
                if (!cb.checked) {
                    cb.disabled = true;
                    cb.closest('.option-chip').classList.add('disabled');
                }
            });
        } else {
            checkboxes.forEach(cb => {
                cb.disabled = false;
                cb.closest('.option-chip').classList.remove('disabled');
            });
        }
    }
}
