let filaSeleccionada = null;

const IP_SERVIDOR = "10.185.208.40"; // Reemplaza por tu IP IPv4 central
const socketMantencion = new WebSocket(`ws://${IP_SERVIDOR}:8085`);

socketMantencion.onmessage = function(event) {
    try {
        const dRemotos = JSON.parse(event.data);
        if (dRemotos.tipo === "ACTUALIZAR_EJECUCION") {
            const filas = document.querySelectorAll('#datosTable tbody tr');
            filas.forEach(fila => {
                if (fila.dataset.orden === dRemotos.orden) {
                    fila.dataset.filtro = dRemotos.filtro;
                    fila.dataset.octopus = dRemotos.octopus;
                    fila.dataset.sap = dRemotos.sap;
                    fila.dataset.listo = dRemotos.listo;
                    fila.dataset.taller = dRemotos.taller;
                    fila.dataset.comentarios = dRemotos.comentarios;
                }
            });
            guardarDatosEnStorage();
            cargarDatosDesdeStorage();
        }
    } catch (e) { console.error("Error en red remota:", e); }
};

function guardarDatosEnStorage() {
    const filas = document.querySelectorAll('#datosTable tbody tr');
    const datos = [];
    filas.forEach(f => {
        datos.push({
            dia: f.dataset.dia, turno: f.dataset.turno, equipo: f.dataset.equipo,
            descripcion: f.dataset.descripcion, orden: f.dataset.orden, grupo: f.dataset.grupo,
            filtro: f.dataset.filtro, octopus: f.dataset.octopus, sap: f.dataset.sap, 
            listo: f.dataset.listo, taller: f.dataset.taller, comentarios: f.dataset.comentarios
        });
    });
    localStorage.setItem('mantencionesDatos', JSON.stringify(datos));
}

function cargarDatosDesdeStorage() {
    const datosGuardados = localStorage.getItem('mantencionesDatos');
    document.querySelector('#datosTable tbody').innerHTML = '';
    if (datosGuardados) {
        JSON.parse(datosGuardados).forEach(item => {
            inyectarFilaControl(item.dia, item.turno, item.equipo, item.descripcion, item.orden, item.grupo, item.filtro, item.octopus, item.sap, item.listo, item.taller, item.comentarios);
        });
    }
}

function inyectarFilaControl(dia, turno, equipo, descripcion, orden, grupo, filtro, octopus, sap, listo, taller, comentarios) {
    const tbody = document.querySelector('#datosTable tbody');
    const f = tbody.insertRow();
    f.dataset.dia = dia; f.dataset.turno = turno; f.dataset.equipo = equipo; f.dataset.descripcion = descripcion;
    f.dataset.orden = orden; f.dataset.grupo = grupo; f.dataset.filtro = filtro; f.dataset.octopus = octopus; 
    f.dataset.sap = sap; f.dataset.listo = listo; f.dataset.taller = taller; f.dataset.comentarios = comentarios;

    f.innerHTML = `
        <td><strong>${equipo}</strong></td>
        <td>${dia} (${turno})</td>
        <td style="text-align:center; font-weight:bold; color:#28a745;">${filtro}</td>
        <td>
            <button type="button" class="btn-modificar" style="padding: 3px 6px; font-size: 11px;">Editar Exec</button>
            <button type="button" class="btn-borrar" style="background-color: #dc3545; padding: 3px 6px; font-size: 11px; margin-left: 2px;">X</button>
        </td>
    `;

    // Evento para abrir el Formulario Flotante de Ejecución
    f.querySelector('.btn-modificar').addEventListener('click', function() {
        filaSeleccionada = f;
        // Título del modal actualizado con la nueva nomenclatura
        document.getElementById('modalInfoEquipo').innerText = `Equipo: ${equipo} | Estado Destino: Mina / Taller`;
        document.getElementById('modOctopus').value = f.dataset.octopus;
        document.getElementById('modSap').value = f.dataset.sap;
        document.getElementById('modListo').checked = f.dataset.listo === 'X';
        document.getElementById('modTaller').checked = f.dataset.taller === 'X';
        document.getElementById('modComentarios').value = f.dataset.comentarios;
        document.getElementById('modalEjecucion').style.display = 'flex';
    });
    f.querySelector('.btn-borrar').addEventListener('click', function() {
        if (confirm(`¿Eliminar orden del equipo ${equipo}?`)) { f.remove(); guardarDatosEnStorage(); }
    });
}

// Procesador Masivo desde Excel (Acepta 6 o 7 columnas)
document.getElementById('btnProcesarExcel').addEventListener('click', function() {
    const areaTexto = document.getElementById('excelPasteArea');
    const textoPegado = areaTexto.value.trim();
    if (!textoPegado) { alert("El cuadro está vacío. Copie celdas desde Excel primero."); return; }

    const filasExcel = textoPegado.split('\n');
    let cargados = 0;

    filasExcel.forEach(linea => {
        const columnas = linea.split('\t');
        if (columnas.length >= 5) {
            const dia = columnas[0] ? columnas[0].trim() : '-';
            const turno = columnas[1] ? columnas[1].trim() : '-';
            const equipo = columnas[2] ? columnas[2].trim() : '-';
            const descripcion = columnas[3] ? columnas[3].trim() : '-';
            const orden = columnas[4] ? columnas[4].trim() : '-';
            const grupo = columnas[5] ? columnas[5].trim() : '-';
            // Valida si la séptima columna viene con la instrucción de filtro armada
            const filtro = (columnas[6] && columnas[6].trim().toUpperCase() === 'X') ? 'X' : '-';

            inyectarFilaControl(dia, turno, equipo, descripcion, orden, grupo, filtro, '-', '-', '-', '-', '');
            cargados++;
        }
    });

    if (cargados > 0) { guardarDatosEnStorage(); areaTexto.value = ''; alert(`¡Se cargaron ${cargados} filas con éxito!`); }
    else { alert("Error de formato al procesar."); }
});

document.getElementById('registroForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const dia = document.getElementById('dia').value;
    const turno = document.getElementById('turno').value;
    const equipo = document.getElementById('equipo').value;
    const desc = document.getElementById('descripcion').value;
    const orden = document.getElementById('orden').value;
    const grupo = document.getElementById('grupo').value;
    const filtro = document.getElementById('cambioFiltro').checked ? 'X' : '-';

    inyectarFilaControl(dia, turno, equipo, desc, orden, grupo, filtro, '-', '-', '-', '-', '');
    guardarDatosEnStorage();
    document.getElementById('registroForm').reset();
});

document.getElementById('formModalEjecucion').addEventListener('submit', function(event) {
    event.preventDefault();
    if (filaSeleccionada) {
        const oct = document.getElementById('modOctopus').value;
        const sap = document.getElementById('modSap').value;
        const flt = document.getElementById('modCambioFiltro').checked ? 'X' : '-';
        const lst = document.getElementById('modListo').checked ? 'X' : '-';
        const tll = document.getElementById('modTaller').checked ? 'X' : '-';
        const com = document.getElementById('modComentarios').value;

        if (socketMantencion.readyState === WebSocket.OPEN) {
            socketMantencion.send(JSON.stringify({ tipo: "ACTUALIZAR_EJECUCION", orden: filaSeleccionada.dataset.orden, filtro: flt, octopus: oct, sap: sap, listo: lst, taller: tll, comentarios: com }));
        }

        filaSeleccionada.dataset.octopus = oct; filaSeleccionada.dataset.sap = sap; filaSeleccionada.dataset.filtro = flt;
        filaSeleccionada.dataset.listo = lst; filaSeleccionada.dataset.taller = tll; filaSeleccionada.dataset.comentarios = com;

        document.getElementById('modalEjecucion').style.display = 'none';
        filaSeleccionada = null;
        guardarDatosEnStorage();
        cargarDatosDesdeStorage();
    }
});

document.getElementById('btnLimpiarPizarra').addEventListener('click', function() {
    if (confirm("¿Limpiar la base de datos?")) { localStorage.clear(); document.querySelector('#datosTable tbody').innerHTML = ''; }
});
document.querySelector('.close-modal').addEventListener('click', () => document.getElementById('modalEjecucion').style.display = 'none');
window.addEventListener('DOMContentLoaded', cargarDatosDesdeStorage);
