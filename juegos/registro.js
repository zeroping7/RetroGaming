// Lista de juegos que aparecen en el menú de RetroGaming.
// Añadir un juego = crear su carpeta en juegos/<id>/ y añadir una entrada aquí.
// Contrato completo en docs/arquitectura.md §3.

export const JUEGOS = [
  {
    id: 'revienta-burbujas',
    titulo: 'Revienta Burbujas',
    descripcion: 'Dispara hacia arriba y parte las burbujas hasta limpiar la pantalla.',
    ruta: 'juegos/revienta-burbujas/',
    portada: 'juegos/revienta-burbujas/portada.svg',
    etiqueta: '#ff6fae',            // color del marco de la etiqueta del cartucho
    jugadores: { min: 1, max: 2 },
    online: true,                   // crear partida / unirse con código
    mismoDispositivo: true,         // 2 jugadores en el mismo móvil o PC
    claveRecord: 'rb-best',         // clave de localStorage con el récord (opcional)
  },
];
