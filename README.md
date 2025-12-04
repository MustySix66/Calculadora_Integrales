# 🧮 Calculadora de Integrales

Una aplicación web moderna para calcular integrales simbólicas con visualización gráfica en tiempo real.

## ✨ Características

- **Cálculo Simbólico**: Utiliza SymPy para calcular integrales indefinidas y definidas
- **Visualización en Tiempo Real**: Gráficas interactivas con Plotly
- **Interfaz Moderna**: Diseño dark mode con glassmorphism y animaciones
- **Responsive**: Funciona perfectamente en desktop y móvil
- **Ejemplos Incluidos**: Botones de ejemplo para comenzar rápidamente

## 🚀 Instalación

### Prerrequisitos

- Python 3.8 o superior
- pip (gestor de paquetes de Python)

### Pasos

1. Clona o descarga este repositorio

2. Navega al directorio del proyecto:
```bash
cd integral_calculator
```

3. Instala las dependencias:
```bash
pip install -r requirements.txt
```

## 💻 Uso

1. Ejecuta la aplicación:
```bash
python app.py
```

2. Abre tu navegador en:
```
http://localhost:5000
```

3. Ingresa una función matemática usando sintaxis Python:
   - Potencias: `x**2`
   - Multiplicación: `2*x`
   - Funciones trigonométricas: `sin(x)`, `cos(x)`, `tan(x)`
   - Exponencial: `exp(x)`
   - Logaritmo: `log(x)`

4. (Opcional) Ingresa límites para calcular una integral definida

5. ¡Observa la gráfica actualizarse en tiempo real!

## 📝 Ejemplos de Funciones

| Función | Sintaxis |
|---------|----------|
| x² | `x**2` |
| sen(x) | `sin(x)` |
| eˣ | `exp(x)` |
| 1/x | `1/x` |
| x³ - 2x | `x**3 - 2*x` |
| √x | `sqrt(x)` |
| ln(x) | `log(x)` |

## 🛠️ Tecnologías Utilizadas

- **Backend**: Flask (Python)
- **Cálculo Matemático**: SymPy
- **Procesamiento Numérico**: NumPy
- **Visualización**: Plotly.js
- **Frontend**: HTML5, CSS3, JavaScript

## 📁 Estructura del Proyecto

```
integral_calculator/
├── app.py                  # Servidor Flask
├── requirements.txt        # Dependencias Python
├── README.md              # Este archivo
└── static/
    ├── index.html         # Página principal
    ├── css/
    │   └── style.css      # Estilos
    └── js/
        └── app.js         # Lógica del frontend
```

## 🎨 Capturas de Pantalla

La interfaz presenta un diseño moderno con:
- Tema oscuro elegante
- Efectos de glassmorphism
- Gradientes vibrantes
- Animaciones suaves
- Gráficas interactivas

## 📄 Licencia

Este proyecto es de código abierto y está disponible para uso educativo.

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Siéntete libre de hacer un fork y enviar pull requests.

---

Desarrollado con ❤️ usando Flask, SymPy y Plotly
