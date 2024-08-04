import pyautogui
import time

print("Moviendo el ratón en la pantalla. Presiona Ctrl+C para salir.")

try:
    while True:
        # Obtiene la posición actual del ratón
        x, y = pyautogui.position()
        print(f"Posición del ratón: ({x}, {y})", end='\r')
        time.sleep(0.1)  # Pausa de 0.1 segundos para actualizar la posición
except KeyboardInterrupt:
    print("\nPrograma terminado.")
