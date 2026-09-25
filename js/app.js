// ==========================================================
// ARGENTINA EN EL TIEMPO
// ==========================================================


// ==========================================================
// FOTOGRAFÍAS
// ==========================================================

const PHOTOS = [

    {

        id: "AR-001",

        city: "Buenos Aires",

        province: "Ciudad Autónoma de Buenos Aires",

        year: 1915,

        lat: -34.60875,

        lng: -58.37321,

        image:
            "https://commons.wikimedia.org/wiki/Special:Redirect/file/Cabildo%20buenos%20aires%201915.jpg",

        source:
            "https://commons.wikimedia.org/wiki/File:Cabildo_buenos_aires_1915.jpg",

        description:
            "Vista histórica del Cabildo y la Plaza de Mayo. La arquitectura, los vehículos y la organización urbana permiten estimar tanto la ubicación como el período."

    },


    {

        id: "AR-002",

        city: "Córdoba",

        province: "Córdoba",

        year: 1900,

        lat: -31.41298,

        lng: -64.18815,

        image:
            "https://commons.wikimedia.org/wiki/Special:Redirect/file/Avenida%20Col%C3%B3n%20de%20C%C3%B3rdoba%20%28Argentina%29%20a%C3%B1os%201900.png",

        source:
            "https://commons.wikimedia.org/wiki/File:Avenida_Col%C3%B3n_de_C%C3%B3rdoba_(Argentina)_a%C3%B1os_1900.png",

        description:
            "Avenida Colón de la ciudad de Córdoba alrededor del año 1900."

    },


    {

        id: "AR-003",

        city: "Rosario",

        province: "Santa Fe",

        year: 1900,

        lat: -32.9369,

        lng: -60.6479,

        image:
            "https://commons.wikimedia.org/wiki/Special:Redirect/file/Tranvia%20rosario%201900.jpg",

        source:
            "https://commons.wikimedia.org/wiki/File:Tranvia_rosario_1900.jpg",

        description:
            "Tranvía histórico de Rosario. El transporte y la arquitectura son importantes pistas temporales."

    },


    {

        id: "AR-004",

        city: "San Carlos de Bariloche",

        province: "Río Negro",

        year: 1916,

        lat: -41.1335,

        lng: -71.3103,

        image:
            "https://commons.wikimedia.org/wiki/Special:Redirect/file/Bariloche%2C%20Argentina%20%281916%29.jpg",

        source:
            "https://commons.wikimedia.org/wiki/File:Bariloche,_Argentina_(1916).jpg",

        description:
            "Vista temprana de San Carlos de Bariloche. El paisaje de montaña y el lago son las pistas geográficas principales."

    },


    {

        id: "AR-005",

        city: "Cacheuta",

        province: "Mendoza",

        year: 1890,

        lat: -33.0358,

        lng: -69.1162,

        image:
            "https://commons.wikimedia.org/wiki/Special:Redirect/file/Archivo%20General%20de%20la%20Naci%C3%B3n%20Argentina%201890%20aprox%20Mendoza%2C%20estaci%C3%B3n%20de%20Cacheuta.jpg",

        source:
            "https://commons.wikimedia.org/wiki/File:Archivo_General_de_la_Naci%C3%B3n_Argentina_1890_aprox_Mendoza,_estaci%C3%B3n_de_Cacheuta.jpg",

        description:
            "Estación ferroviaria de Cacheuta, Mendoza, hacia fines del siglo XIX."

    }

];



// ==========================================================
// ESTADO DEL JUEGO
// ==========================================================

const state = {

    round: 0,

    total: 0,

    guess: null,

    selectedYear: 1945,

    rounds: [],

    zoom: 1,

    order: [],

    pendingResult: null

};



// ==========================================================
// MAPAS
// ==========================================================

let map = null;

let resultMap = null;


let guessMarker = null;

let resultGuessMarker = null;

let resultAnswerMarker = null;

let resultLine = null;


let mapResizeObserver = null;

let resultMapResizeObserver = null;



// ==========================================================
// ACCESOS RÁPIDOS
// ==========================================================

const $ = selector =>
    document.querySelector(selector);


const $$ = selector =>
    document.querySelectorAll(selector);



const screens = {

    home:
        $("#screen-home"),

    game:
        $("#screen-game"),

    result:
        $("#screen-result"),

    final:
        $("#screen-final")

};



// ==========================================================
// ICONOS DEL MAPA
// ==========================================================

const guessIcon =
    L.divIcon({

        className: "",

        html: `

            <div style="
                width:22px;
                height:22px;
                border-radius:50%;
                background:#78c8f2;
                border:5px solid white;
                box-shadow:0 4px 12px rgba(0,0,0,.4);
            ">
            </div>

        `,

        iconSize:
            [22,22],

        iconAnchor:
            [11,11]

    });



const answerIcon =
    L.divIcon({

        className: "",

        html: `

            <div style="
                width:22px;
                height:22px;
                border-radius:50%;
                background:#f6c445;
                border:5px solid white;
                box-shadow:0 4px 12px rgba(0,0,0,.4);
            ">
            </div>

        `,

        iconSize:
            [22,22],

        iconAnchor:
            [11,11]

    });



// ==========================================================
// CAMBIO DE PANTALLAS
// ==========================================================

function showScreen(name) {


    Object
        .values(screens)
        .forEach(screen => {

            screen.classList.remove(
                "active"
            );

        });


    screens[name]
        .classList
        .add(
            "active"
        );


    window.scrollTo(
        0,
        0
    );


    /*
    Esperamos dos frames para asegurarnos
    de que el navegador ya haya calculado
    el ancho real del contenedor.
    */

    requestAnimationFrame(() => {

        requestAnimationFrame(() => {


            // =============================
            // MAPA DEL JUEGO
            // =============================

            if (
                name === "game"
            ) {

                ensureGameMap();

            }


            // =============================
            // MAPA DEL RESULTADO
            // =============================

            if (
                name === "result"
            ) {

                ensureResultMap();


                if (
                    state.pendingResult
                ) {

                    renderResultMap(
                        state.pendingResult
                    );

                }

            }


        });

    });

}



// ==========================================================
// MAPA PRINCIPAL
// ==========================================================

function ensureGameMap() {


    const element =
        document.getElementById(
            "map"
        );


    if (!element) {

        return;

    }



    // Si ya existe
    // solamente recalculamos dimensiones

    if (map) {


        map.invalidateSize({
            animate: false,
            pan: false
        });


        return;

    }



    // Creamos el mapa recién ahora
    // cuando ya es visible

    map =
        L.map(
            element,
            {

                zoomControl: true,

                minZoom: 3,

                maxZoom: 15,

                zoomAnimation: false,

                fadeAnimation: false,

                markerZoomAnimation: false

            }
        );



    L.tileLayer(

        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",

        {

            maxZoom: 19,

            attribution:
                "&copy; OpenStreetMap"

        }

    )
    .addTo(map);



    map.setView(

        [
            -38.5,
            -63.5
        ],

        4,

        {
            animate: false
        }

    );



    // ======================================================
    // CLICK SOBRE EL MAPA
    // ======================================================

    map.on(

        "click",

        function(event) {


            const lat =
                event.latlng.lat;


            const lng =
                event.latlng.lng;



            state.guess = {

                lat: lat,

                lng: lng

            };



            if (
                guessMarker
            ) {

                guessMarker.remove();

                guessMarker = null;

            }



            guessMarker =
                L.marker(

                    [
                        lat,
                        lng
                    ],

                    {
                        icon: guessIcon
                    }

                )
                .addTo(map);



            $("#location-status")
                .textContent =
                "MARCADO";



            $("#location-status")
                .classList
                .remove(
                    "pending"
                );



            $("#location-status")
                .classList
                .add(
                    "ready"
                );



            updateSubmitState();

        }

    );



    // ======================================================
    // OBSERVAR CAMBIOS DE TAMAÑO
    // ======================================================

    if (
        typeof ResizeObserver !==
        "undefined"
    ) {


        mapResizeObserver =
            new ResizeObserver(
                () => {


                    if (!map) {

                        return;

                    }


                    requestAnimationFrame(() => {


                        map.invalidateSize({

                            animate: false,

                            pan: false

                        });


                    });


                }
            );



        mapResizeObserver.observe(
            element
        );

    }



    // Recalculo final

    requestAnimationFrame(() => {

        map.invalidateSize({

            animate: false,

            pan: false

        });

    });

}



// ==========================================================
// MAPA DEL RESULTADO
// ==========================================================

function ensureResultMap() {


    const element =
        document.getElementById(
            "result-map"
        );


    if (!element) {

        return;

    }



    if (resultMap) {


        resultMap.invalidateSize({

            animate: false,

            pan: false

        });


        return;

    }



    resultMap =
        L.map(

            element,

            {

                zoomControl: true,

                minZoom: 3,

                maxZoom: 15,

                zoomAnimation: false,

                fadeAnimation: false,

                markerZoomAnimation: false

            }

        );



    L.tileLayer(

        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",

        {

            maxZoom: 19,

            attribution:
                "&copy; OpenStreetMap"

        }

    )
    .addTo(resultMap);



    resultMap.setView(

        [
            -38.5,
            -63.5
        ],

        4

    );



    if (
        typeof ResizeObserver !==
        "undefined"
    ) {


        resultMapResizeObserver =
            new ResizeObserver(
                () => {


                    if (!resultMap) {

                        return;

                    }


                    requestAnimationFrame(() => {


                        resultMap.invalidateSize({

                            animate: false,

                            pan: false

                        });


                    });


                }
            );


        resultMapResizeObserver.observe(
            element
        );

    }

}



// ==========================================================
// BARAJAR FOTOS
// ==========================================================

function shuffle(array) {


    const copy =
        [...array];


    for (

        let i =
            copy.length - 1;

        i > 0;

        i--

    ) {


        const j =
            Math.floor(

                Math.random() *
                (i + 1)

            );


        [

            copy[i],

            copy[j]

        ] = [

            copy[j],

            copy[i]

        ];

    }


    return copy;

}



// ==========================================================
// INICIAR PARTIDA
// ==========================================================

function startGame() {


    state.round =
        0;


    state.total =
        0;


    state.rounds =
        [];


    state.guess =
        null;


    state.pendingResult =
        null;


    state.order =
        shuffle(
            PHOTOS
        );



    $("#game-total-score")
        .textContent =
        "0 pts";



    closeHelp();


    loadRound();


    showScreen(
        "game"
    );

}



// ==========================================================
// FOTO ACTUAL
// ==========================================================

function currentPhoto() {


    return (
        state.order[
            state.round
        ]
    );

}



// ==========================================================
// CARGAR RONDA
// ==========================================================

function loadRound() {


    const item =
        currentPhoto();



    state.guess =
        null;


    state.zoom =
        1;


    state.selectedYear =
        1945;



    $("#round-image")
        .src =
        item.image;



    $("#round-image")
        .style
        .transform =
        "scale(1)";



    $("#zoom-value")
        .textContent =
        "100%";



    $("#photo-sequence")
        .textContent =
        `ARCHIVO #${item.id}`;



    $("#round-label")
        .textContent =
        `RONDA ${state.round + 1} / ${state.order.length}`;



    $("#progress-fill")
        .style
        .width =
        `${(
            (
                state.round + 1
            )
            /
            state.order.length
        ) * 100}%`;



    $("#year-slider")
        .value =
        1945;



    $("#year-input")
        .value =
        1945;



    $("#location-status")
        .textContent =
        "SIN MARCAR";



    $("#location-status")
        .classList
        .remove(
            "ready"
        );



    $("#location-status")
        .classList
        .add(
            "pending"
        );



    $("#submit-guess")
        .disabled =
        true;



    if (
        guessMarker
    ) {


        guessMarker.remove();


        guessMarker =
            null;

    }



    if (
        map
    ) {


        requestAnimationFrame(() => {


            map.invalidateSize({

                animate: false,

                pan: false

            });



            map.setView(

                [
                    -38.5,
                    -63.5
                ],

                4,

                {
                    animate: false
                }

            );


        });

    }

}



// ==========================================================
// ESTADO DEL BOTÓN
// ==========================================================

function updateSubmitState() {


    $("#submit-guess")
        .disabled =
        !state.guess;

}



// ==========================================================
// AÑO
// ==========================================================

function clampYear(value) {


    const number =
        parseInt(
            value,
            10
        );


    if (
        Number.isNaN(number)
    ) {


        return 1945;

    }


    return Math.min(

        2026,

        Math.max(

            1860,

            number

        )

    );

}



$("#year-slider")
    .addEventListener(

        "input",

        event => {


            state.selectedYear =
                clampYear(
                    event.target.value
                );


            $("#year-input")
                .value =
                state.selectedYear;

        }

    );



$("#year-input")
    .addEventListener(

        "input",

        event => {


            state.selectedYear =
                clampYear(
                    event.target.value
                );


            $("#year-slider")
                .value =
                state.selectedYear;

        }

    );



// ==========================================================
// DISTANCIA HAVERSINE
// ==========================================================

function haversineKm(

    lat1,
    lon1,
    lat2,
    lon2

) {


    const R =
        6371.0088;


    const rad =
        degrees =>
            degrees *
            Math.PI /
            180;



    const dLat =
        rad(
            lat2 - lat1
        );


    const dLon =
        rad(
            lon2 - lon1
        );



    const a =

        Math.sin(
            dLat / 2
        ) ** 2

        +

        Math.cos(
            rad(lat1)
        )

        *

        Math.cos(
            rad(lat2)
        )

        *

        Math.sin(
            dLon / 2
        ) ** 2;



    return (

        R

        *

        2

        *

        Math.atan2(

            Math.sqrt(a),

            Math.sqrt(
                1 - a
            )

        )

    );

}



// ==========================================================
// PUNTAJE UBICACIÓN
// ==========================================================

function locationScore(
    distanceKm
) {


    const score =

        2500

        *

        Math.exp(

            -distanceKm /
            430

        );


    return Math.max(

        0,

        Math.round(score)

    );

}



// ==========================================================
// PUNTAJE FECHA
// ==========================================================

function dateScore(
    yearError
) {


    const score =

        2500

        *

        Math.exp(

            -yearError /
            18

        );


    return Math.max(

        0,

        Math.round(score)

    );

}



// ==========================================================
// CONFIRMAR RESPUESTA
// ==========================================================

function submitGuess() {


    if (
        !state.guess
    ) {

        return;

    }



    const item =
        currentPhoto();



    const distance =

        haversineKm(

            state.guess.lat,

            state.guess.lng,

            item.lat,

            item.lng

        );



    const yearError =

        Math.abs(

            state.selectedYear

            -

            item.year

        );



    const geoPoints =
        locationScore(
            distance
        );



    const yearPoints =
        dateScore(
            yearError
        );



    const score =
        geoPoints
        +
        yearPoints;



    state.total +=
        score;



    const data = {


        ...item,


        guessLat:
            state.guess.lat,


        guessLng:
            state.guess.lng,


        guessedYear:
            state.selectedYear,


        distance:
            distance,


        yearError:
            yearError,


        geoPoints:
            geoPoints,


        yearPoints:
            yearPoints,


        score:
            score

    };



    state.rounds.push(
        data
    );



    state.pendingResult =
        data;



    renderResultText(
        data
    );



    showScreen(
        "result"
    );

}



// ==========================================================
// RESULTADO TEXTO
// ==========================================================

function renderResultText(
    data
) {


    $("#result-round-tag")
        .textContent =
        `RESULTADO · RONDA ${state.round + 1}`;



    $("#result-image")
        .src =
        data.image;



    $("#result-place-caption")
        .textContent =
        `${data.city}, ${data.province}`;



    $("#result-year-caption")
        .textContent =
        data.year;



    $("#result-place")
        .textContent =
        data.city;



    $("#result-description")
        .textContent =
        data.description;



    $("#location-points")
        .textContent =
        data.geoPoints
            .toLocaleString(
                "es-AR"
            );



    $("#year-points")
        .textContent =
        data.yearPoints
            .toLocaleString(
                "es-AR"
            );



    $("#round-score")
        .textContent =
        data.score
            .toLocaleString(
                "es-AR"
            );



    $("#distance-result")
        .textContent =
        `${formatDistance(data.distance)} de distancia`;



    $("#year-error-result")
        .textContent =
        `${data.yearError} ${
            data.yearError === 1
                ? "año"
                : "años"
        } de diferencia`;



    $("#your-year")
        .textContent =
        data.guessedYear;



    $("#correct-year")
        .textContent =
        data.year;



    $("#source-link")
        .href =
        data.source;



    $("#game-total-score")
        .textContent =
        `${state.total.toLocaleString("es-AR")} pts`;



    if (

        state.round ===
        state.order.length - 1

    ) {


        $("#next-round")
            .innerHTML =
            `VER RESULTADO FINAL <span>→</span>`;


    } else {


        $("#next-round")
            .innerHTML =
            `SIGUIENTE RONDA <span>→</span>`;

    }

}



// ==========================================================
// RESULTADO EN MAPA
// ==========================================================

function renderResultMap(
    data
) {


    if (
        !resultMap
    ) {

        return;

    }



    resultMap.invalidateSize({

        animate: false,

        pan: false

    });



    if (
        resultGuessMarker
    ) {

        resultGuessMarker.remove();

        resultGuessMarker =
            null;

    }



    if (
        resultAnswerMarker
    ) {

        resultAnswerMarker.remove();

        resultAnswerMarker =
            null;

    }



    if (
        resultLine
    ) {

        resultLine.remove();

        resultLine =
            null;

    }



    const guessed = [

        data.guessLat,

        data.guessLng

    ];



    const actual = [

        data.lat,

        data.lng

    ];



    resultGuessMarker =

        L.marker(

            guessed,

            {
                icon:
                    guessIcon
            }

        )

        .bindTooltip(
            "Tu respuesta"
        )

        .addTo(
            resultMap
        );



    resultAnswerMarker =

        L.marker(

            actual,

            {
                icon:
                    answerIcon
            }

        )

        .bindTooltip(
            "Lugar correcto"
        )

        .addTo(
            resultMap
        );



    resultLine =

        L.polyline(

            [

                guessed,

                actual

            ],

            {

                color:
                    "#173c5e",

                weight:
                    3,

                dashArray:
                    "6 8"

            }

        )

        .addTo(
            resultMap
        );



    requestAnimationFrame(() => {


        resultMap.invalidateSize({

            animate: false,

            pan: false

        });



        const bounds =

            L.latLngBounds(

                [

                    guessed,

                    actual

                ]

            )

            .pad(
                .45
            );



        resultMap.fitBounds(

            bounds,

            {

                maxZoom:
                    8,

                animate:
                    false

            }

        );


    });

}



// ==========================================================
// FORMATO DISTANCIA
// ==========================================================

function formatDistance(
    km
) {


    if (
        km < 1
    ) {


        return (

            `${Math.round(
                km * 1000
            )} m`

        );

    }



    if (
        km < 10
    ) {


        return (

            `${km
                .toFixed(1)
                .replace(".", ",")} km`

        );

    }



    return (

        `${Math.round(km)
            .toLocaleString(
                "es-AR"
            )} km`

    );

}



// ==========================================================
// SIGUIENTE RONDA
// ==========================================================

function nextRound() {


    state.pendingResult =
        null;



    if (

        state.round >=
        state.order.length - 1

    ) {


        renderFinal();


        showScreen(
            "final"
        );


        return;

    }



    state.round++;


    loadRound();


    showScreen(
        "game"
    );

}



// ==========================================================
// RESULTADO FINAL
// ==========================================================

function renderFinal() {


    $("#final-score")
        .textContent =
        state.total
            .toLocaleString(
                "es-AR"
            );



    const ratio =
        state.total /
        25000;



    let rank =
        "EXPLORADOR";



    if (
        ratio >= .9
    ) {


        rank =
            "CRONISTA NACIONAL";


    } else if (
        ratio >= .75
    ) {


        rank =
            "ARCHIVISTA EXPERTO";


    } else if (
        ratio >= .55
    ) {


        rank =
            "VIAJERO DEL TIEMPO";


    } else if (
        ratio >= .35
    ) {


        rank =
            "BUEN OBSERVADOR";

    }



    $("#final-rank")
        .textContent =
        rank;



    $("#round-summary")
        .innerHTML =
        state.rounds
            .map(

                (round,index) => `

                    <div class="summary-item">

                        <span>
                            RONDA ${index + 1}
                        </span>

                        <strong>

                            ${round.score.toLocaleString("es-AR")}

                        </strong>

                        <small>

                            ${round.city}
                            ·
                            ${round.year}

                        </small>

                    </div>

                `

            )

            .join("");



    const oldBest =

        parseInt(

            localStorage.getItem(
                "argentinaTiempoBest"
            )

            ||

            "0",

            10

        );



    if (
        state.total >
        oldBest
    ) {


        localStorage.setItem(

            "argentinaTiempoBest",

            String(
                state.total
            )

        );

    }



    updateBestScore();

}



// ==========================================================
// MEJOR PUNTAJE
// ==========================================================

function updateBestScore() {


    const best =

        parseInt(

            localStorage.getItem(
                "argentinaTiempoBest"
            )

            ||

            "0",

            10

        );



    $("#best-score-home")
        .textContent =
        best
            .toLocaleString(
                "es-AR"
            );

}



// ==========================================================
// COMPARTIR
// ==========================================================

function resultShareText() {


    const icons =

        state.rounds
            .map(round => {


                const percentage =
                    round.score /
                    5000;



                if (
                    percentage >= .85
                ) {

                    return "🟦";

                }



                if (
                    percentage >= .65
                ) {

                    return "🟩";

                }



                if (
                    percentage >= .45
                ) {

                    return "🟨";

                }



                if (
                    percentage >= .25
                ) {

                    return "🟧";

                }



                return "🟥";

            })

            .join("");



    return `🇦🇷 ARGENTINA EN EL TIEMPO

${state.total.toLocaleString("es-AR")} / 25.000

${icons}

5 rondas`;

}



// ==========================================================
// COPIAR RESULTADO
// ==========================================================

async function copyResult() {


    const text =
        resultShareText();



    try {


        await navigator
            .clipboard
            .writeText(
                text
            );


        $("#copy-message")
            .textContent =
            "Resultado copiado.";


    } catch {


        $("#copy-message")
            .textContent =
            "No se pudo copiar.";

    }

}



// ==========================================================
// MODAL AYUDA
// ==========================================================

function openHelp() {


    $("#help-modal")
        .classList
        .add(
            "open"
        );

}



function closeHelp() {


    $("#help-modal")
        .classList
        .remove(
            "open"
        );

}



// ==========================================================
// VOLVER AL INICIO
// ==========================================================

function goHome() {


    closeHelp();


    showScreen(
        "home"
    );


    updateBestScore();

}



// ==========================================================
// ZOOM FOTO
// ==========================================================

function setZoom(
    value
) {


    state.zoom =

        Math.min(

            2.5,

            Math.max(

                1,

                value

            )

        );



    $("#round-image")
        .style
        .transform =
        `scale(${state.zoom})`;



    $("#zoom-value")
        .textContent =
        `${Math.round(
            state.zoom * 100
        )}%`;

}



// ==========================================================
// EVENTOS ZOOM
// ==========================================================

$("#zoom-in")
    .addEventListener(

        "click",

        () => {

            setZoom(
                state.zoom + .2
            );

        }

    );



$("#zoom-out")
    .addEventListener(

        "click",

        () => {

            setZoom(
                state.zoom - .2
            );

        }

    );



// ==========================================================
// FOTO COMPLETA
// ==========================================================

$("#fullscreen-photo")
    .addEventListener(

        "click",

        () => {


            $("#photo-modal-image")
                .src =
                $("#round-image").src;



            $("#photo-modal")
                .classList
                .add(
                    "open"
                );

        }

    );



function closePhoto() {


    $("#photo-modal")
        .classList
        .remove(
            "open"
        );

}



// ==========================================================
// BOTONES PRINCIPALES
// ==========================================================

$("#start-game")
    .addEventListener(

        "click",

        startGame

    );



$("#modal-play")
    .addEventListener(

        "click",

        startGame

    );



$("#show-how")
    .addEventListener(

        "click",

        openHelp

    );



$("#open-help")
    .addEventListener(

        "click",

        openHelp

    );



$("#submit-guess")
    .addEventListener(

        "click",

        submitGuess

    );



$("#next-round")
    .addEventListener(

        "click",

        nextRound

    );



$("#play-again")
    .addEventListener(

        "click",

        startGame

    );



$("#copy-result")
    .addEventListener(

        "click",

        copyResult

    );



$("#quit-game")
    .addEventListener(

        "click",

        goHome

    );



// ==========================================================
// BOTONES HOME
// ==========================================================

$$("[data-go-home]")
    .forEach(

        button => {


            button.addEventListener(

                "click",

                goHome

            );

        }

    );



$$("[data-close-modal]")
    .forEach(

        element => {


            element.addEventListener(

                "click",

                closeHelp

            );

        }

    );



$$("[data-close-photo]")
    .forEach(

        element => {


            element.addEventListener(

                "click",

                closePhoto

            );

        }

    );



// ==========================================================
// MENÚ
// ==========================================================

$$("[data-home-tab]")
    .forEach(

        button => {


            button.addEventListener(

                "click",

                () => {


                    if (

                        button.dataset.homeTab ===
                        "about"

                    ) {


                        openHelp();

                    }



                    if (

                        button.dataset.homeTab ===
                        "archive"

                    ) {


                        alert(

                            "Próximamente: archivo histórico por provincia, ciudad, década y categoría."

                        );

                    }

                }

            );

        }

    );



// ==========================================================
// ESC
// ==========================================================

document.addEventListener(

    "keydown",

    event => {


        if (
            event.key ===
            "Escape"
        ) {


            closeHelp();


            closePhoto();

        }

    }

);



// ==========================================================
// REDIMENSIONAMIENTO DEL NAVEGADOR
// ==========================================================

window.addEventListener(

    "resize",

    () => {


        if (
            map
        ) {


            requestAnimationFrame(() => {


                map.invalidateSize({

                    animate: false,

                    pan: false

                });


            });

        }



        if (
            resultMap
        ) {


            requestAnimationFrame(() => {


                resultMap.invalidateSize({

                    animate: false,

                    pan: false

                });


            });

        }

    }

);



// ==========================================================
// INICIO
// ==========================================================

window.addEventListener(

    "load",

    () => {


        /*
        MUY IMPORTANTE:

        No iniciamos Leaflet aquí.

        El mapa se crea solamente
        cuando la pantalla del juego
        está visible.
        */


        updateBestScore();

    }

);