# Argentina en el Tiempo — prototipo

Prototipo jugable de un juego inspirado en la mecánica de adivinar **dónde** y **cuándo** fue tomada una fotografía, limitado a la Argentina.

## Qué incluye

- Pantalla de inicio.
- 5 rondas por partida.
- Fotografías históricas.
- Mapa interactivo de OpenStreetMap mediante Leaflet.
- Marcador de ubicación.
- Selector de año 1860–2026.
- Cálculo real de distancia mediante la fórmula de Haversine.
- Puntaje independiente de ubicación y fecha.
- Resultado por ronda con los dos marcadores y línea de distancia.
- Pantalla final con puntaje de 25.000.
- Mejor puntaje guardado con `localStorage`.
- Botón para copiar resultado.
- Diseño adaptable a escritorio, tablet y celular.
- Fuente de cada fotografía visible después de responder.

## Cómo abrirlo

La forma más simple:

1. Descomprimir el ZIP.
2. Abrir `index.html` con Chrome, Edge o Firefox.
3. Tener conexión a Internet para cargar Leaflet, OpenStreetMap y las fotografías de Wikimedia Commons.

También puede ejecutarse con un servidor local:

```bash
python -m http.server 8000
```

y luego abrir:

```text
http://localhost:8000
```

## Estructura

```text
argentina_en_el_tiempo/
├─ index.html
├─ README.md
├─ css/
│  └─ styles.css
└─ js/
   └─ app.js
```

## Próximos módulos recomendados

1. Base de datos (Supabase/PostgreSQL).
2. Panel administrador para cargar fotos.
3. Desafío diario igual para todos.
4. Archivo por fecha.
5. Filtros por provincia, ciudad, década y temática.
6. Usuarios, ranking y estadísticas.
7. Sistema anti-trampa: respuestas guardadas en servidor.
8. Imágenes alojadas localmente/CDN en vez de enlaces remotos.
9. Fichas históricas ampliadas y modo educativo.
10. Base inicial de 100–300 fotografías verificadas.
