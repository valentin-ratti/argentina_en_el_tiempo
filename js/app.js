// ==========================================================
// ARGENTINA EN EL TIEMPO
// ==========================================================


// ==========================================================
// CONFIGURACIÓN
// ==========================================================

const ROUNDS_PER_GAME = 5;

const MAX_LOCATION_SCORE = 2500;

const MAX_YEAR_SCORE = 2500;

const MAX_ROUND_SCORE =
    MAX_LOCATION_SCORE +
    MAX_YEAR_SCORE;

const MAX_GAME_SCORE =
    MAX_ROUND_SCORE *
    ROUNDS_PER_GAME;


const MIN_YEAR = 1860;

const MAX_YEAR = 2026;

const DEFAULT_YEAR = 1945;


const ARGENTINA_CENTER = [
    -38.5,
    -63.5
];

const ARGENTINA_ZOOM = 4;


const GAME_IMAGE_WIDTH = 1600;

const FULLSCREEN_IMAGE_WIDTH = 2400;


// ==========================================================
// FOTOGRAFÍAS
// ==========================================================

let PHOTOS = [];

let photosLoaded = false;


// ==========================================================
// ESTADO
// ==========================================================

const state = {

    round: 0,

    total: 0,

    guess: null,

    selectedYear:
        DEFAULT_YEAR,

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

let homePreviewMap = null;


let guessMarker = null;

let resultGuessMarker = null;

let resultAnswerMarker = null;

let resultLine = null;


let mapResizeObserver = null;

let resultMapResizeObserver = null;


// ==========================================================
// FOTO
// ==========================================================

const imageCache =
    new Map();


let photoPanX = 0;

let photoPanY = 0;


let photoDragging = false;


let photoDragStartX = 0;

let photoDragStartY = 0;


let photoDragOriginX = 0;

let photoDragOriginY = 0;


// ==========================================================
// SELECTORES
// ==========================================================

const $ =
    selector =>
        document.querySelector(
            selector
        );


const $$ =
    selector =>
        document.querySelectorAll(
            selector
        );


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
// OPTIMIZAR FOTO
// ==========================================================

function optimizedImageUrl(
    url,
    width = GAME_IMAGE_WIDTH
) {

    if (!url) {

        return "";

    }


    if (
        url.includes(
            "commons.wikimedia.org/wiki/Special:Redirect/file/"
        )
    ) {

        const separator =
            url.includes("?")
                ? "&"
                : "?";


        return (
            `${url}${separator}width=${width}`
        );

    }


    return url;

}


// ==========================================================
// PRECARGAR FOTO
// ==========================================================

function preloadImage(
    url,
    width = GAME_IMAGE_WIDTH
) {

    const finalUrl =
        optimizedImageUrl(
            url,
            width
        );


    if (
        imageCache.has(
            finalUrl
        )
    ) {

        return imageCache.get(
            finalUrl
        );

    }


    const promise =

        new Promise(
            (
                resolve,
                reject
            ) => {

                const image =
                    new Image();


                image.onload =
                    () => {

                        resolve(
                            finalUrl
                        );

                    };


                image.onerror =
                    () => {

                        imageCache.delete(
                            finalUrl
                        );


                        reject(
                            new Error(
                                `No se pudo cargar ${finalUrl}`
                            )
                        );

                    };


                image.src =
                    finalUrl;

            }
        );


    imageCache.set(
        finalUrl,
        promise
    );


    return promise;

}


// ==========================================================
// PRECARGAR SIGUIENTE
// ==========================================================

function preloadNextPhoto() {

    const nextItem =

        state.order[
            state.round + 1
        ];


    if (!nextItem) {

        return;

    }


    preloadImage(
        nextItem.image,
        GAME_IMAGE_WIDTH
    )
    .catch(
        () => {}
    );

}


// ==========================================================
// FOTOS.JSON
// ==========================================================

async function loadPhotos() {

    if (
        photosLoaded &&
        PHOTOS.length > 0
    ) {

        return true;

    }


    try {

        const response =
            await fetch(

                "data/fotos.json",

                {

                    cache:
                        "no-store"

                }

            );


        if (
            !response.ok
        ) {

            throw new Error(
                `Error HTTP ${response.status}`
            );

        }


        const data =
            await response.json();


        if (
            !Array.isArray(
                data
            )
        ) {

            throw new Error(
                "fotos.json no contiene una lista válida."
            );

        }


        PHOTOS =

            data

            .filter(
                photo => {

                    return (

                        photo &&

                        typeof photo.id ===
                            "string" &&

                        typeof photo.city ===
                            "string" &&

                        typeof photo.province ===
                            "string" &&

                        Number.isFinite(
                            Number(
                                photo.year
                            )
                        ) &&

                        Number.isFinite(
                            Number(
                                photo.lat
                            )
                        ) &&

                        Number.isFinite(
                            Number(
                                photo.lng
                            )
                        ) &&

                        typeof photo.image ===
                            "string"

                    );

                }
            )

            .map(
                photo => {

                    return {

                        ...photo,

                        year:
                            Number(
                                photo.year
                            ),

                        lat:
                            Number(
                                photo.lat
                            ),

                        lng:
                            Number(
                                photo.lng
                            )

                    };

                }
            );


        if (
            PHOTOS.length === 0
        ) {

            throw new Error(
                "No hay fotografías válidas."
            );

        }


        photosLoaded =
            true;


        updatePhotoCounter();


        console.log(
            `${PHOTOS.length} fotografías cargadas.`
        );


        return true;

    }

    catch (error) {

        console.error(
            "Error cargando fotos.json:",
            error
        );


        alert(

            "No se pudo cargar data/fotos.json.\n\n" +

            "Abrí el proyecto usando Live Server desde Visual Studio Code."

        );


        return false;

    }

}


// ==========================================================
// CONTADOR
// ==========================================================

function updatePhotoCounter() {

    const counter =
        $("#photo-count-home");


    if (!counter) {

        return;

    }


    counter.textContent =

        PHOTOS.length
            .toLocaleString(
                "es-AR"
            );

}


// ==========================================================
// ICONOS
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
// MINI MAPA DE PORTADA
// ==========================================================

function initHomePreviewMap() {

    const element =
        document.getElementById(
            "home-preview-map"
        );


    if (!element) {

        return;

    }


    if (
        homePreviewMap
    ) {

        requestAnimationFrame(
            () => {

                homePreviewMap
                    .invalidateSize(
                        false
                    );

            }
        );


        return;

    }


    homePreviewMap =
        L.map(

            element,

            {

                zoomControl:
                    false,

                dragging:
                    false,

                scrollWheelZoom:
                    false,

                doubleClickZoom:
                    false,

                boxZoom:
                    false,

                keyboard:
                    false,

                touchZoom:
                    false,

                attributionControl:
                    true

            }

        );


    L.tileLayer(

        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",

        {

            maxZoom:
                18,

            attribution:
                "&copy; OpenStreetMap"

        }

    )
    .addTo(
        homePreviewMap
    );


    /*
    Tres puntos decorativos:
    Buenos Aires
    Córdoba
    Bariloche
    */

    const points = [

        [
            -34.6037,
            -58.3816
        ],

        [
            -31.4201,
            -64.1888
        ],

        [
            -41.1335,
            -71.3103
        ]

    ];


    const previewIcon =
        L.divIcon({

            className:
                "",

            html: `

                <div style="
                    width:18px;
                    height:18px;

                    border-radius:50%;

                    background:#78c8f2;

                    border:4px solid white;

                    box-shadow:
                        0 3px 10px
                        rgba(0,0,0,.45);
                ">
                </div>

            `,

            iconSize:
                [18,18],

            iconAnchor:
                [9,9]

        });


    points.forEach(
        point => {

            L.marker(

                point,

                {

                    icon:
                        previewIcon,

                    interactive:
                        false

                }

            )
            .addTo(
                homePreviewMap
            );

        }
    );


    /*
    Mostramos prácticamente toda Argentina
    en lugar de acercarnos únicamente
    a los tres puntos.
    */

    const argentinaBounds =
        L.latLngBounds(

            [
                -55.1,
                -73.7
            ],

            [
                -21.7,
                -53.5
            ]

        );


    homePreviewMap.fitBounds(

        argentinaBounds,

        {

            padding:
                [10,10],

            animate:
                false

        }

    );


    requestAnimationFrame(
        () => {

            requestAnimationFrame(
                () => {

                    homePreviewMap
                        .invalidateSize(
                            true
                        );

                }
            );

        }
    );

}


// ==========================================================
// PANTALLAS
// ==========================================================

function showScreen(
    name
) {

    Object
        .values(
            screens
        )
        .forEach(
            screen => {

                screen
                    .classList
                    .remove(
                        "active"
                    );

            }
        );


    screens[name]
        .classList
        .add(
            "active"
        );


    window.scrollTo(
        0,
        0
    );


    requestAnimationFrame(
        () => {

            requestAnimationFrame(
                () => {


                    if (
                        name ===
                        "home"
                    ) {

                        initHomePreviewMap();


                        if (
                            homePreviewMap
                        ) {

                            homePreviewMap
                                .invalidateSize(
                                    true
                                );

                        }

                    }


                    if (
                        name ===
                        "game"
                    ) {

                        ensureGameMap();

                    }


                    if (
                        name ===
                        "result"
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

                }
            );

        }
    );

}


// ==========================================================
// MAPA DEL JUEGO
// ==========================================================

function ensureGameMap() {

    const element =
        document.getElementById(
            "map"
        );


    if (!element) {

        return;

    }


    if (
        map
    ) {

        map.invalidateSize({

            animate:
                false,

            pan:
                false

        });


        return;

    }


    map =
        L.map(

            element,

            {

                zoomControl:
                    true,

                minZoom:
                    3,

                maxZoom:
                    15,

                zoomAnimation:
                    false,

                fadeAnimation:
                    false,

                markerZoomAnimation:
                    false

            }

        );


    L.tileLayer(

        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",

        {

            maxZoom:
                19,

            attribution:
                "&copy; OpenStreetMap contributors"

        }

    )
    .addTo(
        map
    );


    map.setView(

        ARGENTINA_CENTER,

        ARGENTINA_ZOOM,

        {

            animate:
                false

        }

    );


    map.on(

        "click",

        event => {

            const lat =
                event.latlng.lat;


            const lng =
                event.latlng.lng;


            state.guess = {

                lat:
                    lat,

                lng:
                    lng

            };


            if (
                guessMarker
            ) {

                guessMarker.remove();

                guessMarker =
                    null;

            }


            guessMarker =
                L.marker(

                    [
                        lat,
                        lng
                    ],

                    {

                        icon:
                            guessIcon

                    }

                )
                .addTo(
                    map
                );


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


                    requestAnimationFrame(
                        () => {

                            map.invalidateSize({

                                animate:
                                    false,

                                pan:
                                    false

                            });

                        }
                    );

                }
            );


        mapResizeObserver.observe(
            element
        );

    }


    requestAnimationFrame(
        () => {

            map.invalidateSize({

                animate:
                    false,

                pan:
                    false

            });

        }
    );

}


// ==========================================================
// MAPA RESULTADO
// ==========================================================

function ensureResultMap() {

    const element =
        document.getElementById(
            "result-map"
        );


    if (!element) {

        return;

    }


    if (
        resultMap
    ) {

        resultMap.invalidateSize({

            animate:
                false,

            pan:
                false

        });


        return;

    }


    resultMap =
        L.map(

            element,

            {

                zoomControl:
                    true,

                minZoom:
                    3,

                maxZoom:
                    15,

                zoomAnimation:
                    false,

                fadeAnimation:
                    false,

                markerZoomAnimation:
                    false

            }

        );


    L.tileLayer(

        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",

        {

            maxZoom:
                19,

            attribution:
                "&copy; OpenStreetMap contributors"

        }

    )
    .addTo(
        resultMap
    );


    resultMap.setView(

        ARGENTINA_CENTER,

        ARGENTINA_ZOOM

    );


    if (
        typeof ResizeObserver !==
        "undefined"
    ) {

        resultMapResizeObserver =
            new ResizeObserver(
                () => {

                    if (
                        !resultMap
                    ) {

                        return;

                    }


                    requestAnimationFrame(
                        () => {

                            resultMap.invalidateSize({

                                animate:
                                    false,

                                pan:
                                    false

                            });

                        }
                    );

                }
            );


        resultMapResizeObserver
            .observe(
                element
            );

    }

}


// ==========================================================
// BARAJAR
// ==========================================================

function shuffle(
    array
) {

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
                (
                    i + 1
                )

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

async function startGame() {

    const loaded =
        await loadPhotos();


    if (
        !loaded
    ) {

        return;

    }


    if (
        PHOTOS.length <
        ROUNDS_PER_GAME
    ) {

        alert(

            `Se necesitan al menos ${ROUNDS_PER_GAME} fotografías.`

        );


        return;

    }


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


    state.selectedYear =
        DEFAULT_YEAR;


    state.order =

        shuffle(
            PHOTOS
        )

        .slice(
            0,
            ROUNDS_PER_GAME
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


    if (!item) {

        return;

    }


    state.guess =
        null;


    state.zoom =
        1;


    state.selectedYear =
        DEFAULT_YEAR;


    photoPanX =
        0;


    photoPanY =
        0;


    photoDragging =
        false;


    const stage =
        $("#photo-stage");


    stage
        .classList
        .remove(
            "zoomed",
            "dragging"
        );


    $("#zoom-value")
        .textContent =
        "100%";


    $("#photo-sequence")
        .textContent =
        `ARCHIVO #${item.id}`;


    $("#round-label")
        .textContent =
        `RONDA ${state.round + 1} / ${ROUNDS_PER_GAME}`;


    $("#progress-fill")
        .style
        .width =

        `${(
            (
                state.round + 1
            )
            /
            ROUNDS_PER_GAME
        ) * 100}%`;


    $("#year-slider")
        .value =
        DEFAULT_YEAR;


    $("#year-input")
        .value =
        DEFAULT_YEAR;


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


    const image =
        $("#round-image");


    const loader =
        $("#photo-loader");


    image
        .classList
        .remove(
            "photo-ready"
        );


    image
        .classList
        .add(
            "photo-loading"
        );


    loader
        .classList
        .remove(
            "hidden"
        );


    const displayUrl =
        optimizedImageUrl(

            item.image,

            GAME_IMAGE_WIDTH

        );


    image.onload =
        () => {

            image
                .classList
                .remove(
                    "photo-loading"
                );


            image
                .classList
                .add(
                    "photo-ready"
                );


            loader
                .classList
                .add(
                    "hidden"
                );


            applyPhotoTransform();


            preloadNextPhoto();

        };


    image.onerror =
        () => {

            loader
                .classList
                .add(
                    "hidden"
                );


            image
                .classList
                .remove(
                    "photo-loading"
                );


            image
                .classList
                .add(
                    "photo-ready"
                );


            console.error(
                "No se pudo cargar:",
                displayUrl
            );

        };


    image.src =
        displayUrl;


    if (
        map
    ) {

        requestAnimationFrame(
            () => {

                map.invalidateSize({

                    animate:
                        false,

                    pan:
                        false

                });


                map.setView(

                    ARGENTINA_CENTER,

                    ARGENTINA_ZOOM,

                    {

                        animate:
                            false

                    }

                );

            }
        );

    }

}


// ==========================================================
// BOTÓN
// ==========================================================

function updateSubmitState() {

    $("#submit-guess")
        .disabled =
        !state.guess;

}


// ==========================================================
// AÑO
// ==========================================================

function clampYear(
    value
) {

    const number =
        parseInt(
            value,
            10
        );


    if (
        Number.isNaN(
            number
        )
    ) {

        return DEFAULT_YEAR;

    }


    return Math.min(

        MAX_YEAR,

        Math.max(

            MIN_YEAR,

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


$("#year-input")
    .addEventListener(

        "blur",

        event => {

            state.selectedYear =
                clampYear(
                    event.target.value
                );


            event.target.value =
                state.selectedYear;


            $("#year-slider")
                .value =
                state.selectedYear;

        }

    );


// ==========================================================
// ZOOM
// ==========================================================

function clampPhotoPan() {

    const stage =
        $("#photo-stage");


    if (
        !stage ||
        state.zoom <= 1
    ) {

        photoPanX =
            0;


        photoPanY =
            0;


        return;

    }


    const maxX =

        (
            stage.clientWidth *
            (
                state.zoom - 1
            )
        )

        /

        2;


    const maxY =

        (
            stage.clientHeight *
            (
                state.zoom - 1
            )
        )

        /

        2;


    photoPanX =

        Math.max(

            -maxX,

            Math.min(
                maxX,
                photoPanX
            )

        );


    photoPanY =

        Math.max(

            -maxY,

            Math.min(
                maxY,
                photoPanY
            )

        );

}


// ==========================================================
// TRANSFORMAR FOTO
// ==========================================================

function applyPhotoTransform() {

    clampPhotoPan();


    $("#round-image")
        .style
        .transform =

        `translate3d(
            ${photoPanX}px,
            ${photoPanY}px,
            0
        )
        scale(${state.zoom})`;


    $("#zoom-value")
        .textContent =

        `${Math.round(
            state.zoom *
            100
        )}%`;


    const stage =
        $("#photo-stage");


    if (
        state.zoom > 1
    ) {

        stage
            .classList
            .add(
                "zoomed"
            );

    } else {

        stage
            .classList
            .remove(
                "zoomed"
            );

    }

}


// ==========================================================
// CAMBIAR ZOOM
// ==========================================================

function setZoom(
    value
) {

    state.zoom =

        Math.min(

            4,

            Math.max(

                1,

                value

            )

        );


    if (
        state.zoom === 1
    ) {

        photoPanX =
            0;


        photoPanY =
            0;

    }


    applyPhotoTransform();

}


// ==========================================================
// RESET FOTO
// ==========================================================

function resetPhotoView() {

    state.zoom =
        1;


    photoPanX =
        0;


    photoPanY =
        0;


    applyPhotoTransform();

}


// ==========================================================
// BOTONES ZOOM
// ==========================================================

$("#zoom-in")
    .addEventListener(

        "click",

        () => {

            setZoom(
                state.zoom +
                .25
            );

        }

    );


$("#zoom-out")
    .addEventListener(

        "click",

        () => {

            setZoom(
                state.zoom -
                .25
            );

        }

    );


// ==========================================================
// RUEDA
// ==========================================================

$("#photo-stage")
    .addEventListener(

        "wheel",

        event => {

            event.preventDefault();


            if (
                event.deltaY < 0
            ) {

                setZoom(
                    state.zoom +
                    .25
                );

            } else {

                setZoom(
                    state.zoom -
                    .25
                );

            }

        },

        {

            passive:
                false

        }

    );


// ==========================================================
// ARRASTRAR FOTO
// ==========================================================

$("#photo-stage")
    .addEventListener(

        "pointerdown",

        event => {

            if (
                state.zoom <= 1
            ) {

                return;

            }


            photoDragging =
                true;


            photoDragStartX =
                event.clientX;


            photoDragStartY =
                event.clientY;


            photoDragOriginX =
                photoPanX;


            photoDragOriginY =
                photoPanY;


            $("#photo-stage")
                .classList
                .add(
                    "dragging"
                );


            $("#photo-stage")
                .setPointerCapture(
                    event.pointerId
                );

        }

    );


$("#photo-stage")
    .addEventListener(

        "pointermove",

        event => {

            if (
                !photoDragging
            ) {

                return;

            }


            photoPanX =

                photoDragOriginX

                +

                (
                    event.clientX -
                    photoDragStartX
                );


            photoPanY =

                photoDragOriginY

                +

                (
                    event.clientY -
                    photoDragStartY
                );


            applyPhotoTransform();

        }

    );


function stopPhotoDrag() {

    photoDragging =
        false;


    $("#photo-stage")
        .classList
        .remove(
            "dragging"
        );

}


$("#photo-stage")
    .addEventListener(

        "pointerup",

        stopPhotoDrag

    );


$("#photo-stage")
    .addEventListener(

        "pointercancel",

        stopPhotoDrag

    );


$("#photo-stage")
    .addEventListener(

        "dblclick",

        event => {

            event.preventDefault();


            resetPhotoView();

        }

    );


// ==========================================================
// HAVERSINE
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
// PUNTAJE
// ==========================================================

function locationScore(
    distanceKm
) {

    const score =

        MAX_LOCATION_SCORE

        *

        Math.exp(

            -distanceKm /
            430

        );


    return Math.max(

        0,

        Math.round(
            score
        )

    );

}


function dateScore(
    yearError
) {

    const score =

        MAX_YEAR_SCORE

        *

        Math.exp(

            -yearError /
            18

        );


    return Math.max(

        0,

        Math.round(
            score
        )

    );

}


// ==========================================================
// CONFIRMAR
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
        geoPoints +
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

        optimizedImageUrl(

            data.image,

            GAME_IMAGE_WIDTH

        );


    $("#result-place-caption")
        .textContent =
        `${data.city}, ${data.province}`;


    $("#result-year-caption")
        .textContent =
        data.year;


    $("#result-place")
        .textContent =
        data.city;


    $("#result-province")
        .textContent =
        data.province;


    $("#result-category")
        .textContent =
        data.category
        ||
        "HISTORIA";


    $("#result-description")
        .textContent =

        data.description

        ||

        "Fotografía argentina.";


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

        `${formatDistance(
            data.distance
        )} de distancia`;


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


    const sourceLink =
        $("#source-link");


    if (
        data.source
    ) {

        sourceLink.href =
            data.source;


        sourceLink.style.display =
            "block";

    } else {

        sourceLink.style.display =
            "none";

    }


    $("#game-total-score")
        .textContent =

        `${state.total
            .toLocaleString(
                "es-AR"
            )} pts`;


    if (
        state.round ===
        ROUNDS_PER_GAME - 1
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
// RESULTADO MAPA
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

        animate:
            false,

        pan:
            false

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


    requestAnimationFrame(
        () => {

            resultMap.invalidateSize({

                animate:
                    false,

                pan:
                    false

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

        }
    );

}


// ==========================================================
// DISTANCIA
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
                .replace(
                    ".",
                    ","
                )} km`

        );

    }


    return (

        `${Math.round(
            km
        )
        .toLocaleString(
            "es-AR"
        )} km`

    );

}


// ==========================================================
// SIGUIENTE
// ==========================================================

function nextRound() {

    state.pendingResult =
        null;


    if (
        state.round >=
        ROUNDS_PER_GAME - 1
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
// FINAL
// ==========================================================

function renderFinal() {

    $("#final-score")
        .textContent =

        state.total
            .toLocaleString(
                "es-AR"
            );


    $("#final-max-score")
        .textContent =

        `/ ${MAX_GAME_SCORE
            .toLocaleString(
                "es-AR"
            )}`;


    const ratio =
        state.total /
        MAX_GAME_SCORE;


    let rank =
        "EXPLORADOR";


    if (
        ratio >= .90
    ) {

        rank =
            "CRONISTA NACIONAL";

    }

    else if (
        ratio >= .75
    ) {

        rank =
            "ARCHIVISTA EXPERTO";

    }

    else if (
        ratio >= .55
    ) {

        rank =
            "VIAJERO DEL TIEMPO";

    }

    else if (
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

                (
                    round,
                    index
                ) => `

                    <div class="summary-item">

                        <span>

                            RONDA ${
                                index + 1
                            }

                        </span>

                        <strong>

                            ${
                                round.score
                                    .toLocaleString(
                                        "es-AR"
                                    )
                            }

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
// MEJOR
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

            .map(
                round => {

                    const percentage =
                        round.score /
                        MAX_ROUND_SCORE;


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

                }
            )

            .join("");


    return `🇦🇷 ARGENTINA EN EL TIEMPO

${state.total.toLocaleString("es-AR")} / ${MAX_GAME_SCORE.toLocaleString("es-AR")}

${icons}

${ROUNDS_PER_GAME} rondas`;

}


// ==========================================================
// COPIAR
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

    }

    catch {

        $("#copy-message")
            .textContent =
            "No se pudo copiar.";

    }

}


// ==========================================================
// AYUDA
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
// VOLVER
// ==========================================================

function goHome() {

    closeHelp();


    showScreen(
        "home"
    );


    updateBestScore();

}


// ==========================================================
// FOTO GRANDE
// ==========================================================

$("#fullscreen-photo")
    .addEventListener(

        "click",

        () => {

            const item =
                currentPhoto();


            if (!item) {

                return;

            }


            $("#photo-modal-image")
                .src =

                optimizedImageUrl(

                    item.image,

                    FULLSCREEN_IMAGE_WIDTH

                );


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
// BOTONES
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

                            "Próximamente: archivo, provincias, décadas y categorías."

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
// RESIZE
// ==========================================================

window.addEventListener(

    "resize",

    () => {


        if (
            homePreviewMap
        ) {

            requestAnimationFrame(
                () => {

                    homePreviewMap
                        .invalidateSize(
                            false
                        );

                }
            );

        }


        if (
            map
        ) {

            requestAnimationFrame(
                () => {

                    map.invalidateSize({

                        animate:
                            false,

                        pan:
                            false

                    });

                }
            );

        }


        if (
            resultMap
        ) {

            requestAnimationFrame(
                () => {

                    resultMap.invalidateSize({

                        animate:
                            false,

                        pan:
                            false

                    });

                }
            );

        }


        if (
            state.zoom > 1
        ) {

            applyPhotoTransform();

        }

    }

);


// ==========================================================
// INICIO
// ==========================================================

window.addEventListener(

    "load",

    async () => {


        updateBestScore();


        await loadPhotos();


        /*
        La portada está visible,
        así que ahora sí podemos
        crear su mapa.
        */

        initHomePreviewMap();

    }

);