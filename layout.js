/** Planta del museo: una galería horizontal de cuatro salas en fila, como las del Prado,
 *  que se recorre de izquierda a derecha. La puerta del templo da a la Sala I. */
export const G = {
  front: 3.4,     // cara interior del muro de fachada (el exterior queda en +z)
  back: -8.8,     // muro del fondo, donde cuelgan los proyectos
  top: 7.4,       // arranque de la cornisa
  ceil: 8.3,      // plano del techo de casetones
  doorZ: .8,      // centro de los vanos entre salas
  doorW: 4,       // ancho de esos vanos
  doorH: 5.2,
  wall: .5        // grosor de los tabiques
};
// Cada sala: límites en x y centro. La Sala I queda centrada en la puerta del templo (x = 0).
export const ROOMS = [
  { id: 'atenea', x0: -8.6, x1: 8.6 },
  { id: 'hermes', x0: 8.6, x1: 22.6 },
  { id: 'hefesto', x0: 22.6, x1: 36.6 },
  { id: 'salida', x0: 36.6, x1: 48.6 }
].map(r => ({ ...r, cx: (r.x0 + r.x1) / 2 }));
export const LEFT = ROOMS[0].x0, RIGHT = ROOMS[ROOMS.length - 1].x1;
// Altura de la mirada en el recorrido y profundidad desde la que se ve la sala entera.
export const EYE = 1.7, VIEW_Z = 2.4;
