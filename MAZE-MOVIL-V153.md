# Maze · Controles táctiles

En teléfonos y tabletas de hasta 1024 px con puntero táctil se carga MazeTouch153.swf. En PC se conserva Maze.swf. El archivo móvil contiene las mismas imágenes, sonidos, fuentes y fotogramas, y añade un único puente de entrada en la clase AS3 com.tengaged.maze.Maze:

```actionscript
import flash.external.ExternalInterface;
// En el constructor, después de inicializar mazeLogic:
if(ExternalInterface.available) {
    ExternalInterface.addCallback("tengagedMazeMove153", tengagedMazeMove153);
}
public function tengagedMazeMove153(code:uint):void {
    if(mazeLogic.gameState == MazeLogic.STATE_STARTED && code >= 37 && code <= 40) {
        keyButtonDown(new KeyboardEvent(KeyboardEvent.KEY_DOWN, true, false, 0, code));
    }
}
```

La interfaz llama a este puente mediante la API pública de Ruffle. Las flechas y el arrastre envían las mismas direcciones al manejador original: las paredes y el movimiento siguen resolviéndose dentro del juego. No cambian los segundos, el cálculo de puntuaciones, los niveles ni el envío de resultados.

La pulsación mantenida repite la dirección cada 85 ms. Al soltar, cancelar el gesto, ocultar la pestaña o desmontar la prueba se detiene la repetición y se limpian los eventos. El resto de minijuegos conserva la configuración anterior.
