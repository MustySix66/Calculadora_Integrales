"""
Calculadora de Integrales - Backend Flask
==========================================
Este archivo contiene el servidor Flask que maneja el cálculo de integrales
usando SymPy y la generación de datos para graficar con NumPy.
"""

from flask import Flask, render_template, request, jsonify
import sympy as sp
import numpy as np
import json
from sympy.parsing.sympy_parser import parse_expr, standard_transformations, implicit_multiplication_application

# Inicializar la aplicación Flask
# static_folder: carpeta donde están los archivos HTML, CSS, JS
# static_url_path: la ruta URL para acceder a los archivos estáticos ('' significa raíz)
app = Flask(__name__, static_folder='static', static_url_path='')

# Transformaciones para el parser de SymPy
# Esto permite escribir "2x" en lugar de "2*x" (multiplicación implícita)
transformations = standard_transformations + (implicit_multiplication_application,)


def clean_array_for_json(arr):
    """
    Limpia un array de NumPy para que sea serializable a JSON.
    Reemplaza NaN e Infinity con None.
    
    Args:
        arr: Array de NumPy
        
    Returns:
        Lista de Python con valores limpios
    """
    # Convertir a lista de Python
    cleaned = arr.tolist()
    # Reemplazar valores no serializables
    return [None if (isinstance(x, float) and (np.isnan(x) or np.isinf(x))) else x for x in cleaned]


@app.route('/')
def index():
    """
    Ruta principal que sirve la página HTML.
    """
    return app.send_static_file('index.html')


@app.route('/calculate', methods=['POST'])
def calculate():
    """
    Endpoint para calcular integrales.
    
    Recibe:
        JSON con:
        - function: string con la función matemática (ej: "x**2")
        - variable: string con la variable de integración (default: "x")
        - lower_limit: límite inferior para integral definida (opcional)
        - upper_limit: límite superior para integral definida (opcional)
    
    Retorna:
        JSON con:
        - success: bool indicando si el cálculo fue exitoso
        - integral: string con la integral en formato LaTeX
        - integral_text: string con la integral en formato texto
        - function_points: {x: [], y: []} puntos de la función original
        - integral_points: {x: [], y: []} puntos de la integral
        - definite_value: valor numérico de la integral definida (si aplica)
        - area_points: {x: [], y: []} puntos para el área sombreada (si aplica)
        - error: mensaje de error (si success=False)
    """
    try:
        # Obtener datos del request JSON
        data = request.json
        function_str = data.get('function', '')
        variable_str = data.get('variable', 'x')
        lower_limit = data.get('lower_limit', None)
        upper_limit = data.get('upper_limit', None)
        
        # Crear el símbolo de la variable
        x = sp.Symbol(variable_str)
        
        # Parsear la función string a una expresión de SymPy
        # local_dict: diccionario de variables locales disponibles durante el parsing
        # transformations: reglas de transformación para el parser
        function = parse_expr(
            function_str, 
            local_dict={variable_str: x}, 
            transformations=transformations
        )
        
        # Calcular la integral indefinida usando SymPy
        integral = sp.integrate(function, x)
        
        # Generar puntos en el eje x para graficar
        # Usar un rango más pequeño para evitar que los valores exploten con polinomios de alto grado
        # De -5 a 5 con 200 puntos
        x_vals = np.linspace(-10, 10, 200)
        
        # ========== EVALUAR LA FUNCIÓN ORIGINAL ==========
        # Convertir la expresión SymPy a una función NumPy para evaluación rápida
        f_lambdified = sp.lambdify(x, function, modules=['numpy'])
        try:
            # Evaluar la función en todos los puntos x_vals
            y_vals = f_lambdified(x_vals)
            
            # Filtrar valores infinitos o muy grandes (reemplazar con NaN)
            # Esto evita problemas en la gráfica
            y_vals = np.where(np.abs(y_vals) > 1e6, np.nan, y_vals)
            
            # Crear objeto con puntos para la gráfica
            # Limpiar arrays para evitar problemas de serialización JSON
            function_points = {
                'x': clean_array_for_json(x_vals),
                'y': clean_array_for_json(y_vals)
            }
        except Exception as e:
            # Si falla la evaluación, no enviar puntos de la función
            function_points = None
        
        # ========== EVALUAR LA INTEGRAL ==========
        # Convertir la integral a función NumPy
        integral_lambdified = sp.lambdify(x, integral, modules=['numpy'])
        try:
            # Evaluar la integral en todos los puntos
            y_integral_vals = integral_lambdified(x_vals)
            
            # Filtrar valores infinitos o muy grandes
            y_integral_vals = np.where(np.abs(y_integral_vals) > 1e6, np.nan, y_integral_vals)
            
            # Crear objeto con puntos para la gráfica de la integral
            integral_points = {
                'x': clean_array_for_json(x_vals),
                'y': clean_array_for_json(y_integral_vals)
            }
        except Exception as e:
            # Si falla la evaluación, no enviar puntos de la integral
            integral_points = None
        
        # ========== CALCULAR INTEGRAL DEFINIDA ==========
        # Solo si se proporcionaron ambos límites
        definite_value = None
        area_points = None
        
        if lower_limit is not None and upper_limit is not None:
            try:
                # Convertir límites a números flotantes
                lower = float(lower_limit)
                upper = float(upper_limit)
                
                # Calcular la integral definida
                # SymPy calcula: ∫[lower,upper] f(x) dx
                definite_value = float(sp.integrate(function, (x, lower, upper)))
                
                # Generar puntos para el área sombreada (entre los límites)
                x_area = np.linspace(lower, upper, 100)
                y_area = f_lambdified(x_area)
                y_area = np.where(np.abs(y_area) > 1e6, np.nan, y_area)
                
                area_points = {
                    'x': clean_array_for_json(x_area),
                    'y': clean_array_for_json(y_area)
                }
            except Exception as e:
                # Si falla el cálculo de la integral definida, continuar sin ella
                pass
        
        # ========== PREPARAR RESPUESTA ==========
        response = {
            'success': True,
            'integral': sp.latex(integral),      # Formato LaTeX para mostrar bonito
            'integral_text': str(integral),       # Formato texto plano
            'function_points': function_points,   # Puntos de f(x)
            'integral_points': integral_points,   # Puntos de ∫f(x)dx
            'definite_value': definite_value,     # Valor numérico (si aplica)
            'area_points': area_points            # Puntos para área sombreada (si aplica)
        }
        
        # Retornar como JSON
        return jsonify(response)
    
    except Exception as e:
        # Si ocurre cualquier error, retornar mensaje de error
        return jsonify({
            'success': False,
            'error': str(e)
        })


# Punto de entrada principal
if __name__ == '__main__':
    # Ejecutar el servidor Flask
    # En producción (Render), gunicorn manejará esto
    # En desarrollo local, Flask lo ejecuta directamente
    # host='0.0.0.0': Permite conexiones desde cualquier IP (necesario para Render)
    # port=5000: Puerto por defecto
    # debug=True: Modo desarrollo (recarga automática al cambiar código)
    app.run(host='0.0.0.0', debug=True, port=5000)


