let grupoSeleccionado = "TODOS"; // Estado global del filtro activo

// --- 1. CONFIGURACIÓN DE COLORES PERSONALIZADOS (ESTILO PIZARRA FÍSICA) ---
function obtenerEstiloGrupo(nombreGrupo) {
    const grupo = nombreGrupo ? nombreGrupo.trim().toUpperCase() : '';
    
    if (grupo.includes("1") || grupo.includes("A")) {
        return { bg: "#ffeb3b", texto: "#000", css: "background-color: #ffeb3b; color: #000; font-weight: bold;" }; // Amarillo
    }
    if (grupo.includes("2") || grupo.includes("B")) {
        return { bg: "#002f6c", texto: "#fff", css: "background-color: #002f6c; color: #fff; font-weight: bold;" }; // Azul Anglo
    }
    if (grupo.includes("3") || grupo.includes("C")) {
        return { bg: "#e91e63", texto: "#fff", css: "background-color: #e91e63; color: #fff; font-weight: bold;" }; // Rosado / Magenta
    }
    if (grupo.includes("4") || grupo.includes("D")) {
        return { bg: "#4caf50", texto: "#fff", css: "background-color: #4caf50; color: #fff; font-weight: bold;" }; // Verde
    }
    if (grupo.includes("5") || group.includes("E")) {
        return { bg: "#ff9800", texto: "#000", css: "background-color: #ff9800; color: #000; font-weight: bold;" }; // Naranja
    }
    
    return { bg: "#9e9e9e", texto: "#fff", css: "background-color: #9e9e9e; color: #fff; font-weight: bold;" };
}

// --- 2. LÓGICA DE RENDERIZADO DE LA PIZARRA ---

function renderizarTablaVisual() {
    const datosGuardados = localStorage.getItem('mantencionesDatos');
    const tbody = document.querySelector('#datosTable tbody');
    tbody.innerHTML = '';

    if (!datosGuardados) {
        actualizarBarraFiltros([]);
        return;
    }

    const listaDatos = JSON.parse(datosGuardados);

    // Extraer dinámicamente todos los grupos únicos para armar los botones
    const gruposUnicos = new Set();
    listaDatos.forEach(item => {
        if (item.grupo && item.grupo !== '-') {
            gruposUnicos.add(item.grupo.trim().toUpperCase());
        }
    });
    
    actualizarBarraFiltros(Array.from(gruposUnicos));

    // Pintar los registros en la cuadrícula estilo Excel
    listaDatos.forEach(item => {
        const grupoItem = item.grupo ? item.grupo.trim().toUpperCase() : '-';
        
        if (grupoSeleccionado !== "TODOS" && grupoItem !== grupoSeleccionado) {
            return; 
        }

        const fila = tbody.insertRow();
        
        // Estilos condicionales actualizados para la columna MINA
        const colorMina = item.listo === "X" ? "background-color: #c3e6cb; font-weight: bold; color: #155724;" : "";
        const colorTaller = item.taller === "X" ? "background-color: #ffeeba; font-weight: bold; color: #856404;" : "";
        const estiloFiltro = item.filtro === "X" ? "background-color: #e2f0d9; font-weight: bold; color: #28a745;" : "";
        
        const estiloImanGrupo = obtenerEstiloGrupo(item.grupo);

        let notasSistemas = item.comentarios || '';
        if (item.octopus !== '-' || item.sap !== '-') {
            notasSistemas = `[Octopus: ${item.octopus} | SAP: ${item.sap}] ${notasSistemas}`;
        }

        fila.innerHTML = `
            <td><strong>${item.dia}</strong></td>
            <td>${item.turno}</td>
            <td style="background-color: #fafdff; font-weight: bold;">${item.equipo}</td>
            <td style="text-align: left; padding-left: 10px;">${item.descripcion}</td>
            <td style="font-family: monospace;">${item.orden}</td>
            <td style="${estiloImanGrupo.css}">${item.grupo}</td>
            <td style="${estiloFiltro}">${item.filtro}</td>
            <!-- Columna pintada dinámicamente si el camión está en Mina -->
            <td style="${colorMina}">${item.listo}</td>
            <td style="${colorTaller}">${item.taller}</td>
            <td style="text-align: left; font-size: 11px; color: #444;">${notasSistemas || '-'}</td>
        `;
    });
}

function actualizarBarraFiltros(grupos) {
    const container = document.getElementById('botonesFiltroContainer');
    container.innerHTML = '';

    const btnTodo = document.createElement('button');
    btnTodo.type = 'button';
    btnTodo.className = `btn-filter ${grupoSeleccionado === 'TODOS' ? 'active' : ''}`;
    btnTodo.innerText = 'MOSTRAR TODO';
    btnTodo.onclick = () => cambiarFiltroGrupo('TODOS');
    container.appendChild(btnTodo);
    
    grupos.sort().forEach(grupo => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn-filter';
        btn.innerText = grupo;
        
        const colores = obtenerEstiloGrupo(grupo);
        
        if (grupoSeleccionado === grupo) {
            btn.style.backgroundColor = colores.bg;
            btn.style.color = colores.texto;
            btn.style.borderColor = colores.bg;
            btn.classList.add('active');
        } else {
            btn.style.backgroundColor = "#f2f2f2";
            btn.style.color = "#333";
        }
        
        btn.onclick = () => cambiarFiltroGrupo(grupo);
        container.appendChild(btn);
    });
}

window.cambiarFiltroGrupo = function(grupo) {
    grupoSeleccionado = grupo;
    renderizarTablaVisual();
};

// --- CONEXIÓN EN TIEMPO REAL (WEBSOCKETS) ---
const IP_SERVIDOR_VISUAL = "192.168.1.15"; 
const socketVisual = new WebSocket(`ws://${IP_SERVIDOR_VISUAL}:8085`);
socketVisual.onmessage = () => renderizarTablaVisual();

window.addEventListener('DOMContentLoaded', renderizarTablaVisual);
window.addEventListener('storage', (e) => { 
    if (e.key === 'mantencionesDatos' || e.key === null) renderizarTablaVisual(); 
});
