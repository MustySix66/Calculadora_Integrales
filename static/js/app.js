/**
 * Calculadora de Integrales - Frontend JavaScript
 * ================================================
 * Este archivo maneja toda la lógica del frontend:
 * - Captura de eventos de usuario
 * - Actualización en tiempo real con debouncing
 * - Comunicación con el backend vía AJAX
 * - Renderizado de gráficas con Plotly
 * - Gestión de estados de la UI
 */

// ========== REFERENCIAS A ELEMENTOS DEL DOM ==========
// Obtener referencias a todos los elementos HTML que vamos a manipular
const functionInput = document.getElementById('function-input');      // Campo de texto para la función
const variableInput = document.getElementById('variable-input');       // Campo de texto para la variable
const lowerLimitInput = document.getElementById('lower-limit');        // Campo para límite inferior
const upperLimitInput = document.getElementById('upper-limit');        // Campo para límite superior
const calculateBtn = document.getElementById('calculate-btn');         // Botón "Calcular"
const clearBtn = document.getElementById('clear-btn');                 // Botón "Limpiar"
const loading = document.getElementById('loading');                    // Contenedor del spinner de carga
const errorMessage = document.getElementById('error-message');         // Contenedor de mensajes de error
const results = document.getElementById('results');                    // Contenedor de resultados
const emptyState = document.getElementById('empty-state');             // Estado vacío (cuando no hay nada)
const integralResult = document.getElementById('integral-result');     // Elemento donde se muestra la integral
const definiteResult = document.getElementById('definite-result');     // Sección de integral definida
const definiteValue = document.getElementById('definite-value');       // Valor numérico de la integral definida
const plotContainer = document.getElementById('plot');                 // Contenedor para la gráfica de Plotly

// ========== VARIABLES GLOBALES ==========
// Variable para almacenar el temporizador de debouncing
// El debouncing evita hacer demasiadas peticiones al servidor mientras el usuario escribe
let debounceTimer;

// ========== EVENT LISTENERS ==========
// Escuchar cambios en los inputs para actualización en tiempo real
functionInput.addEventListener('input', debounceCalculate);
variableInput.addEventListener('input', debounceCalculate);
lowerLimitInput.addEventListener('input', debounceCalculate);
upperLimitInput.addEventListener('input', debounceCalculate);

// Escuchar clicks en los botones
calculateBtn.addEventListener('click', calculate);
clearBtn.addEventListener('click', clearAll);

// ========== EJEMPLOS ==========
// Agregar event listeners a todos los botones de ejemplo
// Cuando se hace click en un ejemplo, se prellenará el campo de función
document.querySelectorAll('.example-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        functionInput.value = btn.dataset.function;  // Obtener la función del atributo data-function
        calculate();  // Ejecutar el cálculo inmediatamente
    });
});

// ========== FUNCIONES PRINCIPALES ==========

/**
 * Debouncing para actualización en tiempo real
 * ---------------------------------------------
 * Esta función espera 500ms después de que el usuario deja de escribir
 * antes de ejecutar el cálculo. Esto evita hacer peticiones al servidor
 * por cada tecla presionada.
 */
function debounceCalculate() {
    // Cancelar el temporizador anterior si existe
    clearTimeout(debounceTimer);

    // Crear un nuevo temporizador
    debounceTimer = setTimeout(() => {
        // Solo calcular si hay algo escrito
        if (functionInput.value.trim()) {
            calculate();
        }
    }, 500);  // Esperar 500 milisegundos
}

/**
 * Función principal de cálculo
 * -----------------------------
 * Envía la función al backend, recibe el resultado y actualiza la UI
 */
async function calculate() {
    // Obtener y limpiar el valor de la función
    const functionStr = functionInput.value.trim();

    // Si no hay función, mostrar estado vacío
    if (!functionStr) {
        showEmptyState();
        return;
    }

    // Mostrar spinner de carga
    showLoading();

    // Preparar los datos para enviar al backend
    const data = {
        function: functionStr,
        variable: variableInput.value || 'x',  // Default a 'x' si está vacío
        lower_limit: lowerLimitInput.value || null,
        upper_limit: upperLimitInput.value || null
    };

    try {
        // Hacer petición POST al endpoint /calculate
        const response = await fetch('/calculate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)  // Convertir objeto a JSON
        });

        // Parsear la respuesta JSON
        const result = await response.json();

        // Verificar si el cálculo fue exitoso
        if (result.success) {
            displayResults(result);  // Mostrar resultados
            plotGraph(result);       // Dibujar la gráfica
        } else {
            showError(result.error); // Mostrar mensaje de error
        }
    } catch (error) {
        // Manejar errores de red o parsing
        showError('Error de conexión: ' + error.message);
    }
}

/**
 * Mostrar resultados en la UI
 * ----------------------------
 * Actualiza los elementos HTML con los resultados del cálculo
 * 
 * @param {Object} result - Objeto con los datos de la respuesta del backend
 */
function displayResults(result) {
    // Ocultar loading y errores
    hideLoading();
    hideError();
    hideEmptyState();

    // Mostrar la integral en formato texto
    integralResult.textContent = result.integral_text;

    // Si hay un valor de integral definida, mostrarlo
    if (result.definite_value !== null) {
        definiteValue.textContent = result.definite_value.toFixed(6);  // 6 decimales
        definiteResult.classList.remove('hidden');
    } else {
        // Si no hay integral definida, ocultar esa sección
        definiteResult.classList.add('hidden');
    }

    // Mostrar la sección de resultados
    results.classList.remove('hidden');
}

/**
 * Graficar con Plotly
 * --------------------
 * Crea las trazas (traces) para la gráfica y las renderiza con Plotly.js
 * 
 * @param {Object} result - Objeto con los datos de la respuesta del backend
 */
function plotGraph(result) {
    const traces = [];  // Array para almacenar todas las trazas

    // ========== TRAZO 1: FUNCIÓN ORIGINAL f(x) ==========
    if (result.function_points) {
        traces.push({
            x: result.function_points.x,
            y: result.function_points.y,
            type: 'scatter',
            mode: 'lines',
            name: 'f(x)',  // Etiqueta en la leyenda
            line: {
                color: '#4facfe',  // Color azul cyan
                width: 3
            }
        });
    }

    // ========== TRAZO 2: INTEGRAL ∫f(x)dx ==========
    if (result.integral_points) {
        traces.push({
            x: result.integral_points.x,
            y: result.integral_points.y,
            type: 'scatter',
            mode: 'lines',
            name: '∫f(x)dx',  // Etiqueta en la leyenda
            line: {
                color: '#00f2fe',  // Color cyan más claro
                width: 3,
                dash: 'dash'       // Línea discontinua
            }
        });
    }

    // ========== TRAZO 3: ÁREA SOMBREADA (solo para integrales definidas) ==========
    if (result.area_points) {
        traces.push({
            x: result.area_points.x,
            y: result.area_points.y,
            fill: 'tozeroy',  // Llenar desde la curva hasta el eje y=0
            type: 'scatter',
            mode: 'lines',
            name: 'Área',
            fillcolor: 'rgba(102, 126, 234, 0.2)',  // Color púrpura semi-transparente
            line: {
                color: '#667eea',
                width: 2
            }
        });
    }

    // ========== CONFIGURACIÓN DEL LAYOUT ==========
    const layout = {
        paper_bgcolor: 'rgba(0,0,0,0)',           // Fondo transparente
        plot_bgcolor: 'rgba(255,255,255,0.02)',   // Fondo del área de graficado
        font: {
            family: 'Inter, sans-serif',
            color: '#a0a8d4'                       // Color de texto
        },
        xaxis: {
            title: variableInput.value || 'x',     // Etiqueta del eje X
            gridcolor: 'rgba(255,255,255,0.1)',    // Color de la cuadrícula
            zerolinecolor: 'rgba(255,255,255,0.2)' // Color de la línea en x=0
        },
        yaxis: {
            title: 'y',                            // Etiqueta del eje Y
            gridcolor: 'rgba(255,255,255,0.1)',
            zerolinecolor: 'rgba(255,255,255,0.2)',
            range: [-100, 100]                     // Zoom inicial en Y de -100 a 100 (el usuario puede hacer zoom out)
        },
        margin: {
            l: 60,   // Margen izquierdo
            r: 40,   // Margen derecho
            t: 40,   // Margen superior
            b: 60    // Margen inferior
        },
        hovermode: 'x unified',  // Mostrar todos los valores al hacer hover
        legend: {
            bgcolor: 'rgba(17, 21, 48, 0.8)',      // Fondo de la leyenda
            bordercolor: 'rgba(255,255,255,0.1)',
            borderwidth: 1
        }
    };

    // ========== CONFIGURACIÓN DE PLOTLY ==========
    const config = {
        responsive: true,          // Gráfica responsive
        displayModeBar: true,      // Mostrar barra de herramientas
        displaylogo: false,        // No mostrar logo de Plotly
        modeBarButtonsToRemove: ['lasso2d', 'select2d']  // Remover herramientas que no necesitamos
    };

    // Renderizar la gráfica
    Plotly.newPlot(plotContainer, traces, layout, config);
}

// ========== FUNCIONES DE GESTIÓN DE ESTADOS DE LA UI ==========

/**
 * Mostrar el spinner de carga
 */
function showLoading() {
    loading.classList.remove('hidden');
    results.classList.add('hidden');
    errorMessage.classList.add('hidden');
    emptyState.classList.add('hidden');
}

/**
 * Ocultar el spinner de carga
 */
function hideLoading() {
    loading.classList.add('hidden');
}

/**
 * Mostrar mensaje de error
 * 
 * @param {string} error - Mensaje de error a mostrar
 */
function showError(error) {
    hideLoading();
    hideEmptyState();
    errorMessage.textContent = 'Error: ' + error;
    errorMessage.classList.remove('hidden');
    results.classList.add('hidden');
}

/**
 * Ocultar mensaje de error
 */
function hideError() {
    errorMessage.classList.add('hidden');
}

/**
 * Mostrar estado vacío (cuando no hay función ingresada)
 */
function showEmptyState() {
    hideLoading();
    hideError();
    results.classList.add('hidden');
    emptyState.classList.remove('hidden');

    // Limpiar la gráfica
    Plotly.purge(plotContainer);
}

/**
 * Ocultar estado vacío
 */
function hideEmptyState() {
    emptyState.classList.add('hidden');
}

/**
 * Limpiar todos los campos del formulario
 */
function clearAll() {
    functionInput.value = '';
    lowerLimitInput.value = '';
    upperLimitInput.value = '';
    variableInput.value = 'x';
    showEmptyState();
}

// ========== INICIALIZACIÓN ==========
// Mostrar el estado vacío al cargar la página
showEmptyState();
