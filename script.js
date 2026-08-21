let filaSeleccionada = null; // Almacena temporalmente la fila que se está editando

// --- 1. FUNCIONES DE ALMACENAMIENTO (LOCALSTORAGE) ---

// Guarda el estado actual de toda la tabla en la memoria del navegador
function guardarDatosEnStorage() {
    const filas = document.querySelectorAll('#datosTable tbody tr');
    const datos = [];

    filas.forEach(fila => {
        datos.push({
            dia: fila.cells[0].innerText,
            turno: fila.cells[1].innerText,
            equipo: fila.cells[2].innerText,
            grupo: fila.cells[3].innerText,
            filtro: fila.cells[4].innerText,
            desde: fila.cells[5].innerText,
            hasta: fila.cells[6].innerText,
            pendiente: fila.cells[7].innerText,
            taller: fila.cells[8].innerText,
            horas: fila.cells[9].innerText,
            comentarios: fila.cells[10].innerText
        });
    });

    // Guardar la lista de registros y los datos fijos de la cabecera
    localStorage.setItem('mantencionesDatos', JSON.stringify(datos));
    localStorage.setItem('mantencionesSemana', document.getElementById('semanaInput').value);
    localStorage.setItem('mantencionesFechaDesde', document.getElementById('fechaOriginalDesde')?.value || document.getElementById('fechaDesde').value);
    localStorage.setItem('mantencionesFechaHasta', document.getElementById('fechaOriginalHasta')?.value || document.getElementById('fechaHasta').value);
}

// Carga los datos almacenados al abrir o refrescar la página
function cargarDatosDesdeStorage() {
    const datosGuardados = localStorage.getItem('mantencionesDatos');
    const semanaGuardada = localStorage.getItem('mantencionesSemana');
    const desdeGuardado = localStorage.getItem('mantencionesFechaOriginalDesde') || localStorage.getItem('mantencionesFechaDesde');
    const hastaGuardado = localStorage.getItem('mantencionesFechaOriginalHasta') || localStorage.getItem('mantencionesFechaHasta');

    // Restaurar inputs del formulario y textos de la cabecera
    if (semanaGuardada) {
        document.getElementById('semanaInput').value = semanaGuardada;
        document.getElementById('displaySemana').innerText = semanaGuardada;
    }
    if (desdeGuardado) {
        document.getElementById('fechaDesde').value = desdeGuardado;
    }
    if (hastaGuardado) {
        document.getElementById('fechaHasta').value = hastaGuardado;
    }
    
    actualizarPeriodoEncabezado();

    // Reconstruir las filas de la tabla si existen datos previos
    if (datosGuardados) {
        const datos = JSON.parse(datosGuardados);
        datos.forEach(item => {
            inyectarFilaEnTabla(item.dia, item.turno, item.equipo, item.grupo, item.filtro, item.desde, item.hasta, item.pendiente, item.taller, item.horas, item.comentarios);
        });
    }
}


// --- 2. CONTROL DEL ENCABEZADO DINÁMICO ---

function actualizarPeriodoEncabezado() {
    const desdeInput = document.getElementById('fechaDesde').value;
    const hastaInput = document.getElementById('fechaHasta').value;
    
    if (desdeInput && hastaInput) {
        const fDesde = desdeInput.split('-').reverse().join('/');
        const fHasta = hastaInput.split('-').reverse().join('/');
        document.getElementById('displayPeriodo').innerText = `DEL ${fDesde} AL ${fHasta}`;
    } else {
        document.getElementById('displayPeriodo').innerText = 'DEL VIERNES AL JUEVES';
    }
}

// Escuchar cambios en tiempo real para guardar el estado de la cabecera
document.getElementById('fechaDesde').addEventListener('change', () => { actualizarPeriodoEncabezado(); guardarDatosEnStorage(); });
document.getElementById('fechaHasta').addEventListener('change', () => { actualizarPeriodoEncabezado(); guardarDatosEnStorage(); });
document.getElementById('semanaInput').addEventListener('input', function() {
    document.getElementById('displaySemana').innerText = this.value || 'N/A';
    guardarDatosEnStorage();
});


// --- 3. LÓGICA DE INYECCIÓN Y GESTIÓN DE FILAS ---

function inyectarFilaEnTabla(dia, turno, equipo, grupo, filtro, fDesde, fHasta, pendiente, taller, horas, comentarios) {
    const tbody = document.querySelector('#datosTable tbody');
    const nuevaFila = tbody.insertRow();

    nuevaFila.innerHTML = `
        <td><strong>${dia}</strong></td>
        <td>${turno}</td>
        <td>${equipo}</td>
        <td>${grupo}</td>
        <td class="celda-filtro">${filtro}</td>
        <td>${fDesde}</td>
        <td>${fHasta}</td>
        <td class="celda-pendiente">${pendiente}</td>
        <td class="celda-taller">${taller}</td>
        <td class="celda-horas">${horas}</td>
        <td class="celda-comentarios">${comentarios}</td>
        <td>
            <button type="button" class="btn-modificar" style="padding: 4px 6px; font-size: 11px;">Editar</button>
            <button type="button" class="btn-borrar" style="background-color: #dc3545; padding: 4px 6px; font-size: 11px; margin-left: 4px;">X</button>
        </td>
    `;

    // Evento de edición de la fila
    nuevaFila.querySelector('.btn-modificar').addEventListener('click', function() {
        filaSeleccionada = nuevaFila;
        
        document.getElementById('modalInfoEquipo').innerText = `Equipo: ${equipo} | Día: ${dia}`;
        document.getElementById('modPendiente').checked = nuevaFila.querySelector('.celda-pendiente').innerText === 'X';
        document.getElementById('modTaller').checked = nuevaFila.querySelector('.celda-taller').innerText === 'X';
        document.getElementById('modHoras').value = parseFloat(nuevaFila.querySelector('.celda-horas').innerText) || 0;
        document.getElementById('modComentarios').value = nuevaFila.querySelector('.celda-comentarios').innerText;

        document.getElementById('modalEjecucion').style.display = 'flex';
    });

    // Evento de eliminación de la fila
    nuevaFila.querySelector('.btn-borrar').addEventListener('click', function() {
        if (confirm(`¿Estás seguro de que deseas eliminar el registro del equipo ${equipo}?`)) {
            nuevaFila.remove();
            guardarDatosEnStorage(); // Actualizar almacenamiento tras borrar
        }
    });
}


// --- 4. EVENTOS DE FORMULARIOS ---

// Envío del formulario principal
document.getElementById('registroForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const dia = document.getElementById('dia').value;
    const turno = document.getElementById('turno').value;
    const equipo = document.getElementById('equipo').value;
    const grupo = document.getElementById('grupo').value || '-';
    const fDesde = document.getElementById('fechaDesde').value.split('-').reverse().join('/');
    const fHasta = document.getElementById('fechaHasta').value.split('-').reverse().join('/');
    const cambioFiltro = document.getElementById('cambioFiltro').checked ? 'X' : '-';

    // Agregar visualmente a la tabla
    inyectarFilaEnTabla(dia, turno, equipo, grupo, cambioFiltro, fDesde, fHasta, '-', '-', '0 hrs', '');
    
    // Guardar en la memoria local inmediatamente
    guardarDatosEnStorage();

    // Limpieza manteniendo datos maestros en el formulario
    const guardadoSemana = document.getElementById('semanaInput').value;
    const guardadoDesde = document.getElementById('fechaDesde').value;
    const guardadoHasta = document.getElementById('fechaHasta').value;
    
    document.getElementById('registroForm').reset();
    
    document.getElementById('semanaInput').value = guardadoSemana;
    document.getElementById('fechaDesde').value = guardadoDesde;
    document.getElementById('fechaHasta').value = guardadoHasta;

    actualizarPeriodoEncabezado();
});

// Guardado desde el formulario flotante (Modal)
document.getElementById('formModalEjecucion').addEventListener('submit', function(event) {
    event.preventDefault();

    if (filaSeleccionada) {
        filaSeleccionada.querySelector('.celda-pendiente').innerText = document.getElementById('modPendiente').checked ? 'X' : '-';
        filaSeleccionada.querySelector('.celda-taller').innerText = document.getElementById('modTaller').checked ? 'X' : '-';
        filaSeleccionada.querySelector('.celda-horas').innerText = `${document.getElementById('modHoras').value} hrs`;
        filaSeleccionada.querySelector('.celda-comentarios').innerText = document.getElementById('modComentarios').value;

        document.getElementById('modalEjecucion').style.display = 'none';
        filaSeleccionada = null;
        
        // Guardar cambios de la edición en la memoria local
        guardarDatosEnStorage();
    }
});

// Cierre del modal
document.querySelector('.close-modal').addEventListener('click', function() {
    document.getElementById('modalEjecucion').style.display = 'none';
    filaSeleccionada = null;
});

// --- 5. INICIALIZACIÓN AL CARGAR LA PÁGINA ---
window.addEventListener('DOMContentLoaded', cargarDatosDesdeStorage);
// --- 6. FUNCIÓN ADICIONAL: LIMPIAR PIZARRA ---

document.getElementById('btnLimpiarPizarra').addEventListener('click', function() {
    // Solicitar confirmación de seguridad para evitar borrados accidentales
    const confirmar = confirm("¿Estás seguro de que deseas limpiar toda la pizarra?\nEsto eliminará todos los registros de la tabla y la memoria permanentemente.");
    
    if (confirmar) {
        // 1. Vaciar las filas visibles de la tabla en pantalla
        const tbody = document.querySelector('#datosTable tbody');
        tbody.innerHTML = '';
        
        // 2. Limpiar los datos almacenados en el localStorage del navegador
        localStorage.removeItem('mantencionesDatos');
        localStorage.removeItem('mantencionesSemana');
        localStorage.removeItem('mantencionesFechaDesde');
        localStorage.removeItem('mantencionesFechaHasta');
        
        // 3. Resetear por completo el formulario de ingreso
        document.getElementById('registroForm').reset();
        
        // 4. Restaurar los textos por defecto en los encabezados superiores
        document.getElementById('displaySemana').innerText = 'N/A';
        document.getElementById('displayPeriodo').innerText = 'DEL VIERNES AL JUEVES';
        
        alert("La pizarra ha sido vaciada con éxito. Puedes comenzar una nueva semana.");
    }
});

