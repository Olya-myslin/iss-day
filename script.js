let isTransitioning = false;  // Блокировка кликов во время переходов
const starLayer = document.getElementById('star-layer');
const bg = document.getElementById('bg');
const gameContainer = document.getElementById('game-container');
const startTitle = document.getElementById('start-title');
const gameText = document.getElementById('game-text');
const choices = document.getElementById('choices');
const startBtn = document.getElementById('start-button');
const music = document.getElementById('bg-music');
let readiness = 0; // Очки готовности
// Находим все три летающих объекта
const obj1 = document.getElementById('floating-object-1');
const obj2 = document.getElementById('floating-object-2');
const obj3 = document.getElementById('floating-object-3');
const allFloaters = [obj1, obj2, obj3];

const scenePanel = document.getElementById('scene-panel');
// 2. ГЕНЕРАЦИЯ ЗВЕЗД 
for (let i = 0; i < 120; i++) {
    const star = document.createElement('div');
    star.className = 'star';
    const size = Math.random() * 2 + 1;
    star.style.width = size + 'px'; star.style.height = size + 'px';
    let x, y, valid = false;
    while (!valid) {
        x = Math.random(); y = Math.random();
        if (y < 0.9 - x * 1.1) valid = true;
    }
    star.style.left = x * 100 + '%'; star.style.top = y * 100 + '%';
    star.style.animationDuration = (2 + Math.random() * 4) + 's';
    star.style.animationDelay = (Math.random() * 5) + 's';
    starLayer.appendChild(star);
}

// 3. UTC ЧАСЫ
setInterval(() => {
    const now = new Date();
    document.getElementById('hours').textContent = String(now.getUTCHours()).padStart(2, '0');
    document.getElementById('minutes').textContent = String(now.getUTCMinutes()).padStart(2, '0');
}, 1000);

// 4. ЗВУК КЛИКА
function playClickSound() {
    const clickSound = new Audio('audio/click.mp3');
    clickSound.volume = 0.4;
    clickSound.play();
}

// Один общий объект для звука печати
let typingSound = null;

function startTypingSound() {
    // Если вдруг уже играет — останавливаем предыдущий
    stopTypingSound();

    typingSound = new Audio('audio/type.mp3');
    typingSound.loop = true;
    typingSound.volume = 0.10;   // громкость
    typingSound.play().catch(() => {});
}

function stopTypingSound() {
    if (typingSound) {
        typingSound.pause();
        typingSound.currentTime = 0;
        typingSound = null;
    }
}

function typeWriter(text, element, speed, callback) {
    let i = 0;
    element.innerHTML = "";

    // === ЗАПУСКАЕМ ЗВУК ===
    startTypingSound();

    function type() {
        if (i < text.length) {
            if (text.substring(i, i + 4) === "<br>") {
                element.innerHTML += "<br>";
                i += 4;
            } else {
                element.innerHTML += text.charAt(i);
                i++;
            }
            setTimeout(type, speed);
        } else {
            // === ОСТАНАВЛИВАЕМ ЗВУК ===
            stopTypingSound();

            isTransitioning = false;
            if (callback) callback();
        }
    }
    type();
}

function stopTypingSound() {
    if (!typingSound) return;

    const snd = typingSound;
    typingSound = null;

    // Плавное затухание за 200 мс
    const fadeStep = snd.volume / 10;
    const fadeInterval = setInterval(() => {
        if (snd.volume > fadeStep) {
            snd.volume -= fadeStep;
        } else {
            snd.pause();
            snd.currentTime = 0;
            clearInterval(fadeInterval);
        }
    }, 10);
}

let currentScene = '';
let cabinAlertTimer = null;

function clearCabinObjects() {
    document.querySelectorAll('.cabin-hotspot, .cabin-tooltip, .cabin-window-btn, #cabin-layer').forEach(el => el.remove());
    if (cabinAlertTimer) {
        clearTimeout(cabinAlertTimer);
        cabinAlertTimer = null;
    }
}
function showScenePanel() {
    if (!scenePanel) return;
    if (scenePanel.classList.contains('visible')) return;

    scenePanel.classList.remove('hidden');

    gameText.style.opacity = '1';
    choices.style.opacity = '0';   // кнопки скрыты, появятся позже

    // Сбрасываем рамку, чтобы она нарисовалась заново
    const rect = scenePanel.querySelector('.scene-panel-rect');
    if (rect) {
        rect.style.transition = 'none';
        rect.style.strokeDashoffset = '2600';
        rect.classList.remove('glow');
    }

    requestAnimationFrame(() => {
        scenePanel.classList.add('visible');

        // Запускаем рисование рамки
        if (rect) {
            requestAnimationFrame(() => {
                rect.style.transition = 'stroke-dashoffset 2.1s ease, filter 0.6s ease';
                rect.style.strokeDashoffset = '0';
            });

            // После окончания рисования — лёгкое свечение
            setTimeout(() => {
                rect.classList.add('glow');
            }, 2100);
        }
    });
}

function hideScenePanel() {
    if (!scenePanel) return;
    if (!scenePanel.classList.contains('visible')) return;

    // Просто гасим панель целиком — текст внутри гаснет вместе с ней
    scenePanel.classList.remove('visible');

    // Через 1 сек (когда панель уже невидима) — очищаем содержимое
    setTimeout(() => {
        scenePanel.classList.add('hidden');
        gameText.innerHTML = "";
        choices.innerHTML = "";
    }, 1000);
}
// 6. СЦЕНАРИЙ ИГРЫ (Story)
const story = {
    'wake_up': {
        text: "Ты решительно выплываешь из спального мешка.<br>Тело кажется неестественно легким.<br>В каюте пахнет озоном и сублимированным кофе.<br>Пора браться за работу.",
        background: 'url("images/second.png")',
        showAlarm: false,
        options: [
    { text: "Идти на завтрак", nextScene: 'breakfast_early' },
    { text: "Проверить системы", nextScene: 'systems' }
]
    },
    'sleep_more': {
        text: "Ты закрываешь глаза еще на 10 минут.<br>Сон на орбите тягучий и странный.<br>Когда ты наконец просыпаешься, будильник давно смолк.",
        background: 'none',
        showAlarm: false,
        options: [
    { text: "Поспешить на завтрак", nextScene: 'breakfast_late' }
]
    },
    'breakfast_early': {
        text: "Ты пришел вовремя. У тебя есть возможноть<br>выбрать что ты хочешь на завтрак.",
        background: 'url("images/fon.png")',
        floatingItems: ['images/food1.png', 'images/food2.png', 'images/food3.png'],
        options: [
    { text: "Консервы", nextScene: 'after_cans', item: 1, readiness: 2 },
    { text: "Мороженое", nextScene: 'after_icecream', item: 2, readiness: 2 },
    { text: "Шоколад", nextScene: 'after_chocolate', item: 3, readiness: 2 }
]
    },
    'systems': {
    text: "Терминал активен.<br>Бортовой компьютер ожидает подтверждения<br>калибровки спектрометра.",
    background: 'url("images/control.png")',
    showAlarm: false,
    options: [
    { text: "Полная калибровка", nextScene: 'calibration_full', readiness: 4 },
    { text: "Быстрая калибровка", nextScene: 'calibration_fast', readiness: 1 },
    { text: "Посмотреть в иллюминатор", nextScene: 'window_view', customClass: 'window-btn-fixed', readiness: 1 }
]
},
'window_view': {
    text: "Ты фиксируешься у иллюминатора.<br>Орбитальная скорость — 7,66 км/с.<br>Под станцией проходит побережье.<br>До следующего витка — 92 минуты.",
    background: 'url("images/window.png")',
    showAlarm: false,
    options: [
        { text: "Вернуться к панели", nextScene: 'systems' }
    ]
},
    'breakfast_late': {
        text: "На завтрак осталась только каша из тюбика.<br>Вкус странный, но энергия сейчас нужнее всего.",
        background: 'url("images/fon.png")',
        floatingItems: ['images/food0.png'],
        options: [
    { text: "Съесть кашу", nextScene: 'after_breakfast', item: 1, readiness: 1 }     
]
    },
    'after_breakfast': {
    text: "Завтрак окончен.<br>Станция ждёт.",
    background: 'url("images/tubik.png")',
    showAlarm: false,
    options: [
        { text: "Приступить к задачам", nextScene: 'systems' }
    ]
},
'after_cans': {
    text: "Ничего лишнего. Только белок и калории.<br>Станция учит ценить простые решения.",
    background: 'url("images/cans.png")',
    showAlarm: false,
    options: [
        { text: "Приступить к задачам", nextScene: 'systems' }
    ]
},
'after_icecream': {
    text: "Сублимированное мороженое тает на языке.<br>Маленькая роскошь среди звёзд.<br>Завтрак окончен.",
    background: 'url("images/icecream.png")',
    showAlarm: false,
    options: [
        { text: "Приступить к задачам", nextScene: 'systems' }
    ]
},
'after_chocolate': {
    text: "Тёмный шоколад — лучший друг на орбите.<br>Заряд бодрости и кусочек Земли в одном.<br>Завтрак окончен.",
    background: 'url("images/chocolate.png")',
    showAlarm: false,
    options: [
        { text: "Приступить к задачам", nextScene: 'systems' }
    ]
},
'hydroponics': {
    text: "В модуле «Кибо» тихо гудят лампы.<br>Вокруг корней одного салата<br>висит идеальная сфера воды.<br>Лист побледнел. Панель мигает: ABNORMAL LEAF.",
    background: 'url("images/hydroponics.png")',
    showAlarm: false,
    options: [
        { text: "Стравить пузырь", nextScene: 'hydro_fix', readiness: 3 },
        { text: "Скорректировать pH", nextScene: 'hydro_ph', readiness: 1 },
        { text: "Изолировать растение", nextScene: 'hydro_isolate', readiness: 1 }
    ]
},
'hydro_fix': {
    text: "Ты аккуратно подводишь шприц к сфере.<br>Пузырьки воздуха уходят один за другим.<br>Раствор снова потёк ровно. Лист ещё бледный,<br>но корни уже дышат.",
    background: 'url("images/fix.png")',
    showAlarm: false,
    options: [
        { text: "Продолжить день", nextScene: 'corridor' }
    ]
},

'hydro_ph': {
    text: "Ты вводишь корректор в раствор.<br>Показатели выравниваются, лист слегка расправляется.<br>Но сфера воды всё ещё висит вокруг корней.<br>Это ненадолго.",
    background: 'url("images/ydro.png")',
    showAlarm: false,
    options: [
        { text: "Продолжить день", nextScene: 'corridor' }
    ]
},

'hydro_isolate': {
    text: "Ты отключаешь секцию 04 от общего контура.<br>Лампа над ней гаснет.<br>Остальные растения в безопасности.<br>В отсеке стало чуть тише.",
    background: 'url("images/isolate.png")',
    showAlarm: false,
    options: [
        { text: "Продолжить день", nextScene: 'corridor' }
    ]
},
'corridor': {
    text: "Ты толкаешься от поручня и плывёшь обратно по модулю.<br>Узкий коридор тянется метров на двадцать.<br>Лампы мерцают мягко, кабели вдоль стен слегка покачиваются.<br>Тишина. Только гул вентиляции.",
    background: 'url("images/second.png")',
    showAlarm: false,
    options: [],
    triggerAlert: true   // После печати текста запустится тревога
},


'after_refuse': {
    text: "\"Понял. Гляну сам, когда смогу.\"<br>Голос в наушниках звучит ровно, но ты слышишь в нём лёгкую усталость.<br>Через час по системе приходит уведомление:<br>\"Растение пришлось списать. Не страшно, но обидно.\"",
    background: 'url("images/control.png")',
    showAlarm: false,
    options: [
        { text: "Отправиться в каюту", nextScene: 'cabin' }
    ]
},
'cabin': {
    text: "",
    background: 'url("images/curiosity.png")',
    showAlarm: false,
    options: [],
    isCabin: true
},
'cabin_window': {
    text: "За стеклом — бесконечная чернота и тонкая голубая линия атмосферы.<br>Земля медленно поворачивается внизу.<br>Отсюда не видно границ. Только океаны, облака и свет.",
    background: 'url("images/wind.png")',
    showAlarm: false,
    options: [
        { text: "Вернуться в каюту", nextScene: 'cabin' }
    ]
},
'cabin_window': {
    text: "За стеклом — бесконечная чернота и тонкая голубая линия атмосферы.<br>Земля медленно поворачивается внизу.<br>Отсюда не видно границ. Только океаны, облака и свет.",
    background: 'url("images/wind.png")',   // ← исправил wind.png на window.png
    showAlarm: false,
    options: [
        { text: "Вернуться в каюту", nextScene: 'cabin' }
    ]
},

// === НОВЫЕ СЦЕНЫ: ПОДГОТОВКА К ВЫХОДУ В КОСМОС ===
'eva_suits': {
    text: "Шлюзовой отсек «Квест».<br>Три скафандра EMU висят в креплениях — белые, массивные, как пустые оболочки.<br>Твой — справа. На шлеме уже наклеен позывной.",
    background: 'url("images/suits.jpeg")',
    showAlarm: false,
    options: [
        { text: "Начать подготовку", nextScene: 'eva_suit_on' }
    ]
},

'eva_suit_on': {
    text: "Перчатки встают на место с мягким щелчком.<br>Гермошлем опускается. Мир сужается до визора.<br>В наушниках — ровный голос ЦУПа: «Проверка связи. Слышим вас чисто.»<br>За переборкой — вакуум.",
    background: 'url("images/suit_hands.png")',
    showAlarm: false,
    options: [
        { text: "Открыть внешний люк", nextScene: 'eva_exit' }
    ]
},

'eva_exit': {
    text: "",
    background: 'url("images/spacesuit3.png")',
    showAlarm: false,
    options: [],
    isEVA: true
},

'quiet_moment': {
    text: "Ты возвращаешься к терминалу.<br>День идёт своим чередом.<br><br>(Эта сцена — заглушка, дальше будет продолжение сюжета)",
    background: 'url("images/control.png")',
    showAlarm: false,
    options: []
}
    };
function renderScene(sceneKey) {
    const scene = story[sceneKey];
    if (!scene) return;

    currentScene = sceneKey;

    // ЗАЩИТА ОТ ДВОЙНЫХ КЛИКОВ
    if (isTransitioning) return;
    isTransitioning = true;

    // ШАГ 1: ПОЛНЫЙ BLACK FADE
    bg.style.opacity = '0';
    gameContainer.style.opacity = '0';
    allFloaters.forEach(el => { if(el) el.style.opacity = '0'; });
    clearCabinObjects();

    // === НОВОЕ: убираем фиксированные кнопки прошлой сцены ===
    document.querySelectorAll('[data-fixed-extra="true"]').forEach(el => el.remove());

    setTimeout(() => {
        // ШАГ 2: ПОДГОТОВКА В ТЕМНОТЕ
        choices.innerHTML = "";
        choices.style.opacity = '0';
        gameText.innerHTML = "";

        // Скрываем все объекты
        allFloaters.forEach(el => { if(el) el.style.display = 'none'; });

        // === ПОКАЗЫВАЕМ ПАНЕЛЬ ===
        showScenePanel();

        // Меняем фон
        if (scene.background === 'none') {
            bg.style.backgroundImage = 'none';
            bg.style.backgroundColor = 'black';
        } else if (!scene.isEVA) {
            bg.style.backgroundImage = scene.background;
        }

        // === EVA: перехватываем до проявления фона ===
        if (scene.isEVA) {
            isTransitioning = false;
            startEVAMode();
            return;
        }

        // ШАГ 3: ПРОЯВЛЕНИЕ
        setTimeout(() => {
            bg.style.opacity = '1';
            gameContainer.style.opacity = '1';

            // === НОВОЕ: добавляем camera-active только если его ещё нет ===
            if (scene.background !== 'none' && !bg.classList.contains('camera-active')) {
                bg.classList.add('camera-active');
            }

            // Показываем еду/предметы
            if (scene.floatingItems) {
                scene.floatingItems.forEach((imgSrc, index) => {
                    let el = allFloaters[index];
                    if (el) {
                        el.src = imgSrc;
                        el.style.display = 'block';
                        setTimeout(() => { el.style.opacity = '1'; }, 100);
                    }
                });
            }

            if (scene.isCabin) {
                isTransitioning = false;
                startCabinMode();
                return;
            }

            typeWriter(scene.text, gameText, 30, () => {
                // --- ЗАПУСК АВАРИЙНОГО УВЕДОМЛЕНИЯ ---
                if (scene.triggerAlert) {
                    setTimeout(() => {
                        showAlertNotification();
                    }, 1500);
                }

                // Создаем кнопки
                scene.options.forEach(opt => {
                    const btn = document.createElement('button');
                    btn.textContent = opt.text;
                    if (opt.customClass) {
                        btn.classList.add(opt.customClass);
                    }
                    if (opt.item) btn.dataset.item = opt.item;

                    btn.onclick = () => {
                        playClickSound();
                        if (opt.readiness) {
                            updateReadiness(opt.readiness);
                        }

                        // --- ПОЛНАЯ КАЛИБРОВКА ---
                        if (opt.nextScene === 'calibration_full') {
                            startCalibration('full');
                            return;
                        }

                        // --- БЫСТРАЯ ПРОВЕРКА ---
                        if (opt.nextScene === 'calibration_fast') {
                            startCalibration('fast');
                            return;
                        }

                        // --- ИЛЛЮМИНАТОР ---
                        if (opt.nextScene === 'window_view') {
                            bg.style.opacity = '0';
                            gameContainer.style.opacity = '0';
                            allFloaters.forEach(el => { if(el) el.style.opacity = '0'; });

                            setTimeout(() => {
                                renderScene(opt.nextScene);
                            }, 2000);

                            return;
                        }

                        // --- ОБЫЧНАЯ СЦЕНА ---
                        renderScene(opt.nextScene);
                    };

                    // ПОДСВЕТКА ПРИ НАВЕДЕНИИ
                    btn.onmouseenter = () => {
                        if (btn.dataset.item) {
                            const target = document.getElementById(`floating-object-${btn.dataset.item}`);
                            if (target) target.classList.add('highlight-item');
                        }
                    };
                    btn.onmouseleave = () => {
                        if (btn.dataset.item) {
                            const target = document.getElementById(`floating-object-${btn.dataset.item}`);
                            if (target) target.classList.remove('highlight-item');
                        }
                    };

                    // === НОВОЕ: фиксированные кнопки добавляем в body, остальные — в панель ===
                    if (opt.customClass === 'window-btn-fixed') {
                        btn.dataset.fixedExtra = 'true';
                        btn.style.opacity = '0';
                        btn.style.transition = 'opacity 1s ease';
                        document.body.appendChild(btn);
                        setTimeout(() => { btn.style.opacity = '1'; }, 600);
                    } else {
                        choices.appendChild(btn);
                    }
                });

                choices.style.opacity = '1';   // сам контейнер сразу видимый, кнопки внутри появятся через CSS-анимацию
            });
        }, 100);
    }, 2000);
}

function startCalibration(mode) {
    hideScenePanel();

 document.querySelectorAll('[data-fixed-extra="true"]').forEach(el => {
        el.style.transition = 'opacity 0.6s ease';
        el.style.opacity = '0';
        setTimeout(() => el.remove(), 600);
    });

    bg.style.filter = "brightness(0.5)";

    const module = document.createElement("div");
    module.classList.add("calibration-module");

    const fill = document.createElement("div");
    fill.classList.add("calibration-fill");
    module.appendChild(fill);

    const content = document.createElement("div");
    content.classList.add("calibration-content");
    content.innerHTML = `
    <div id="cal-title">
        СПЕКТРОМЕТР-МКС v2.14<br>
        РЕЖИМ: ${mode === 'full' ? 'ПОЛНАЯ' : 'БЫСТРАЯ'} КАЛИБРОВКА
    </div>
    <br>
    <div id="cal-hint">УПРАВЛЕНИЕ:&nbsp;&nbsp;←&nbsp;&nbsp;→</div>
    <br>
    <div id="cal-log"></div>
`;
    module.appendChild(content);

    document.body.appendChild(module);
    // === SVG РАМКА ===
const svgNS = "http://www.w3.org/2000/svg";
const svg = document.createElementNS(svgNS, "svg");
svg.setAttribute("viewBox", "0 0 1000 600");
svg.setAttribute("preserveAspectRatio", "none");
svg.classList.add("calibration-svg");

const rectA = document.createElementNS(svgNS, "rect");
const rectB = document.createElementNS(svgNS, "rect");

rectA.setAttribute("x", "0");
rectA.setAttribute("y", "0");
rectA.setAttribute("width", "1000");
rectA.setAttribute("height", "600");
rectA.classList.add("calibration-rect");

rectB.setAttribute("x", "0");
rectB.setAttribute("y", "0");
rectB.setAttribute("width", "1000");
rectB.setAttribute("height", "600");
rectB.classList.add("calibration-rect");

svg.appendChild(rectA);
svg.appendChild(rectB);
module.appendChild(svg);

rectB.style.transform = "rotate(180deg)";
rectB.style.transformOrigin = "center";

setTimeout(() => {
    rectA.style.strokeDashoffset = "0";
    rectB.style.strokeDashoffset = "0";
}, 50);

setTimeout(() => {
    rectA.classList.add("calibration-glow");
    rectB.classList.add("calibration-glow");
}, 2000);

    const log = module.querySelector("#cal-log");

    setTimeout(() => {
        fill.style.opacity = "1";
        content.style.opacity = "1";
    }, 500);

    setTimeout(() => {

        if (mode === 'fast') {
            startFastCalibration(module, log);
        }

        if (mode === 'full') {
            startFullCalibration(module, log);
        }

    }, 1000);
}
function startFastCalibration(module, log) {

    const bar = document.createElement("div");
    bar.classList.add("calibration-bar");

    const zone = document.createElement("div");
    zone.classList.add("calibration-zone");

    const marker = document.createElement("div");
    marker.classList.add("calibration-marker");

    let zoneStart = 45;
    let zoneEnd = 55;

    zone.style.left = zoneStart + "%";
    zone.style.width = (zoneEnd - zoneStart) + "%";

    bar.appendChild(zone);
    bar.appendChild(marker);
    module.appendChild(bar);

    requestAnimationFrame(() => {
        bar.style.opacity = "1";
        bar.style.transform = "translateY(0)";
    });

    let position = 50;
    let velocity = 0.4;
    let control = 0;
    let stableTime = 0;

    document.addEventListener("keydown", (e) => {
        if (e.key === "ArrowLeft") control = -0.2;
        if (e.key === "ArrowRight") control = 0.2;
    });

    document.addEventListener("keyup", (e) => {
        if (e.key === "ArrowLeft" || e.key === "ArrowRight") control = 0;
    });

    function animate() {

        velocity += (Math.random() - 0.5) * 0.02;
        velocity += control * 0.03;

        position += velocity;
        velocity *= 0.995;

        if (position >= 100) {
            position = 100;
            velocity *= -0.8;
        }

        if (position <= 0) {
            position = 0;
            velocity *= -0.8;
        }

        marker.style.left = position + "%";

        if (position >= zoneStart && position <= zoneEnd) {
            stableTime++;
        } else {
            stableTime = 0;
        }

        if (stableTime > 180) {
    const success = document.createElement("div");
    success.innerHTML = "> БЫСТРАЯ ПРОВЕРКА УСПЕШНА";
    log.appendChild(success);

    finishCalibration(module);
    return;
}

        requestAnimationFrame(animate);
    }

    animate();
}
function startFullCalibration(module, log) {

    const channels = [];
    let control = 0;
    let transitioning = false;

    document.addEventListener("keydown", (e) => {
        if (e.key === "ArrowLeft") control = -0.2;
        if (e.key === "ArrowRight") control = 0.2;
    });

    document.addEventListener("keyup", (e) => {
        if (e.key === "ArrowLeft" || e.key === "ArrowRight") control = 0;
    });

    for (let i = 0; i < 3; i++) {

        const bar = document.createElement("div");
        bar.classList.add("calibration-bar");
        bar.style.bottom = (120 - i * 40) + "px";

        const zone = document.createElement("div");
        zone.classList.add("calibration-zone");

        const marker = document.createElement("div");
        marker.classList.add("calibration-marker");

        let zoneStart = 45;
        let zoneEnd = 55 - i * 3;

        zone.style.left = zoneStart + "%";
        zone.style.width = (zoneEnd - zoneStart) + "%";

        bar.appendChild(zone);
        bar.appendChild(marker);
        module.appendChild(bar);

        requestAnimationFrame(() => {
            bar.style.opacity = "1";
            bar.style.transform = "translateY(0)";
        });
channels.push({
    position: 50,
    velocity: 0.35 + i * 0.15,     // мягче
    noise: 0.015 + i * 0.01,       // меньше дёрганья
    controlFactor: 0.04 - i * 0.008,

    zoneStart: zoneStart,
    zoneEnd: zoneEnd,

    stableTime: 0,
    stable: false,

    marker: marker,
    zone: zone
});
  
}

    function animate() {

        if (transitioning) return;

        let allStable = true;

        channels.forEach(ch => {

            if (ch.stable) return;

            ch.velocity += (Math.random() - 0.5) * ch.noise;
            ch.velocity += control * ch.controlFactor;

            ch.position += ch.velocity;
            ch.velocity *= 0.97;

            if (ch.position >= 100) {
                ch.position = 100;
                ch.velocity *= -0.8;
            }

            if (ch.position <= 0) {
                ch.position = 0;
                ch.velocity *= -0.8;
            }

            ch.marker.style.left = ch.position + "%";

            if (ch.position >= ch.zoneStart && ch.position <= ch.zoneEnd) {
                ch.stableTime++;
            } else {
                ch.stableTime = 0;
            }

            if (ch.stableTime > 180 && !ch.stable) {

    ch.stable = true;

    ch.zone.style.background = "white";
    ch.marker.style.background = "white";

    const channelIndex = channels.indexOf(ch);

    const logLine = document.createElement("div");
    logLine.innerHTML = `> КАНАЛ ${String.fromCharCode(65 + channelIndex)} СТАБИЛИЗИРОВАН`;
    log.appendChild(logLine);
}

            if (!ch.stable) allStable = false;
        });

        if (allStable && !transitioning) {
    transitioning = true;

    const finalText = document.createElement("div");
    finalText.innerHTML = "> ВСЕ ЧАСТОТЫ СИНХРОНИЗИРОВАНЫ";
    log.appendChild(finalText);

    finishCalibration(module);
    return;
}

        requestAnimationFrame(animate);
    }

    animate();
}
function finishCalibration(module) {

    const finishBtn = document.createElement("button");
    finishBtn.textContent = "ЗАКОНЧИТЬ КАЛИБРОВКУ";
    finishBtn.style.marginTop = "30px";

    module.querySelector(".calibration-content").appendChild(finishBtn);

    finishBtn.onclick = () => {
    module.remove();
    bg.style.filter = "brightness(1)";
    
    // Возвращаем панель
    showScenePanel();
    gameText.style.opacity = "1";
    choices.style.opacity = "1";
    gameText.innerHTML = "";
    choices.innerHTML = "";

        // Печатаем текст с эффектом typeWriter
        typeWriter("Калибровка завершена.<br>Отчёт ушёл на Землю.", gameText, 40, () => {
            // Через 2 секунды после окончания печати — показываем сообщение от коллеги
            setTimeout(() => {
                showCrewMessage();
            }, 2000);
        });
    };
}
// 8. СТАРТ ИГРЫ
startBtn.addEventListener('click', () => {
    playClickSound();
    createHUD();
    // Музыка
    music.volume = 0; music.play();
    let fadeInMusic = setInterval(() => {
        if (music.volume < 0.4) music.volume += 0.02;
        else clearInterval(fadeInMusic);
    }, 200);

    // Fade Out первого слайда
    gameContainer.style.opacity = '0';
    starLayer.style.opacity = '0';
    bg.style.opacity = '0';
    // Функция создания HUD
function createHUD() {
    const hud = document.createElement('div');
    hud.id = 'hud-status';
    hud.innerHTML = `
        <svg class="hud-svg" viewBox="0 0 220 60">
            <rect class="hud-rect" x="0" y="0" width="220" height="60"></rect>
        </svg>
        <div class="hud-content">
            <div id="hud-readiness">READINESS: 00</div>
            <div id="hud-state">STATUS: NORMAL</div>
        </div>
    `;
    document.body.appendChild(hud);

    // Анимация появления (как в калибровке)
    setTimeout(() => {
        hud.style.opacity = '1';
        const rect = hud.querySelector('.hud-rect');
        const content = hud.querySelector('.hud-content');
        rect.style.strokeDashoffset = '0'; // Рисуем рамку
        setTimeout(() => {
         hud.classList.add('visible')
        }, 1000);
    }, 500);
}

    setTimeout(() => {
        // --- ПОДГОТОВКА ВТОРОГО СЛАЙДА (В ТЕМНОТЕ) ---
        startTitle.style.display = 'none';
        starLayer.style.display = 'none';
        
        const startChoices = document.getElementById('start-choices');
if (startChoices) startChoices.style.display = 'none';
choices.innerHTML = ""; 
choices.style.opacity = '0';

        bg.style.backgroundImage = 'url("images/first.png")';
        gameText.style.display = 'block';
        showScenePanel();
        
        if(obj1) {
            obj1.style.display = 'block';
            obj1.style.opacity = '0';
        }

        setTimeout(() => {
            bg.style.opacity = '1';
            gameContainer.style.opacity = '1';
            if(obj1) obj1.style.opacity = '1';

            const intro = "Станция скрипит и гудит вокруг тебя.<br>Восемь тонн оборудования отделяют тебя от пустоты.<br>Сегодня первый день экспедиции. До возвращения — ещё 120.";
            
            typeWriter(intro, gameText, 40, () => {
                setTimeout(() => {
                choices.innerHTML = `<button id="w">Встать на смену</button><button id="s">Спать дальше</button>`;

document.getElementById('w').onclick = () => { 
    playClickSound(); 
    updateReadiness(3); // +3 за раннее пробуждение
    renderScene('wake_up'); 
};
document.getElementById('s').onclick = () => { 
    playClickSound(); 
    updateReadiness(0); // 0 за то, что поспал
    renderScene('sleep_more'); 
};
                    
                    choices.style.opacity = '1';
                }, 1000);
            });
        }, 100);
    }, 2000);
});
function updateReadiness(points) {
    if (points === 0) return; // Если 0, ничего не делаем

    readiness += points;
    const readinessEl = document.getElementById('hud-readiness');
    const stateEl = document.getElementById('hud-state');
    const hud = document.getElementById('hud-status');

    if (!readinessEl) return;

    // Обновляем текст
    readinessEl.textContent = `READINESS: ${String(readiness).padStart(2, '0')}`;
    
    // Обновляем статус
    let statusText = "NORMAL";
    if (readiness >= 12) statusText = "ELITE";
    else if (readiness >= 8) statusText = "OPTIMAL";
    else if (readiness < 4) statusText = "WEAK";
    stateEl.textContent = `STATUS: ${statusText}`;

    // Запускаем пульсацию
    hud.classList.remove('pulse-active');
    void hud.offsetWidth; // Магия для перезапуска анимации
    hud.classList.add('pulse-active');
}
// СООБЩЕНИЕ ОТ КОЛЛЕГИ (внутренняя связь)
function showCrewMessage() {
    hideScenePanel(); // Гасим панель

document.querySelectorAll('[data-fixed-extra="true"]').forEach(el => {
        el.style.transition = 'opacity 0.6s ease';
        el.style.opacity = '0';
        setTimeout(() => el.remove(), 600);
    });

    // Воспроизводим звук уведомления
    const notificationSound = new Audio('audio/notification.mp3');
    notificationSound.volume = 0.5;
    notificationSound.play();

    // Создаём контейнер сообщения
    const message = document.createElement("div");
    message.classList.add("crew-message");
    
    message.innerHTML = `
        <div class="crew-header">◉ ВНУТРЕННЯЯ СВЯЗЬ</div>
        <div class="crew-body">
            "Слушай, у меня тут одно из растений в гидропонике странно себя ведёт.<br>
            Сможешь глянуть, когда будет минута?"
        </div>
        <div class="crew-signature">— Алекс, модуль «Кибо»</div>
        <div class="crew-choices"></div>
    `;
    
    document.body.appendChild(message);
    
    // Плавное появление
    setTimeout(() => {
        message.classList.add("visible");
    }, 50);
    
    // Через 1.5 секунды после появления — добавляем кнопки
    setTimeout(() => {
        const choicesBox = message.querySelector(".crew-choices");
        
        const options = [
    { text: "Идти к гидропонике", scene: "hydroponics", readiness: 2 },
    { text: "Сказать, что занят", scene: "after_refuse", readiness: 0 }
];
        
        options.forEach(opt => {
            const btn = document.createElement("button");
            btn.textContent = opt.text;
            btn.onclick = () => {
                playClickSound();
                if (opt.readiness) updateReadiness(opt.readiness);
                
                // Плавное исчезновение сообщения
                message.classList.remove("visible");
                setTimeout(() => {
                    message.remove();
                    renderScene(opt.scene);
                }, 800);
            };
            choicesBox.appendChild(btn);
        });
    }, 1500);
}
// === АВАРИЙНОЕ УВЕДОМЛЕНИЕ ПОД HUD ===
function showAlertNotification() {

document.querySelectorAll('[data-fixed-extra="true"]').forEach(el => {
        el.style.transition = 'opacity 0.6s ease';
        el.style.opacity = '0';
        setTimeout(() => el.remove(), 600);
    });

    // Воспроизводим звук уведомления (тот же, что у Алекса)
    const notificationSound = new Audio('audio/notification.mp3');
    notificationSound.volume = 0.5;
    notificationSound.play();

    // Создаём красное уведомление
    const alert = document.createElement('div');
    alert.id = 'alert-notification';
    alert.innerHTML = `<span>⚠</span><span>АВАРИЙНЫЙ КАНАЛ</span>`;
    document.body.appendChild(alert);

    // Плавное появление + пульсация
    setTimeout(() => {
        alert.classList.add('visible');
    }, 50);

    // По клику — открываем красное окно
    alert.onclick = () => {
        playClickSound();
        alert.remove();
        hideScenePanel();      // Гасим панель
        showAlertMessage();
    };
}

// === КРАСНОЕ ОКНО АВАРИЙНОГО СООБЩЕНИЯ + ДИАЛОГ С ЦУПом ===
function showAlertMessage() {
    const message = document.createElement('div');
    message.classList.add('alert-message');

    message.innerHTML = `
        <div class="alert-header">⚠ АВАРИЙНЫЙ КАНАЛ — ВНЕШНЯЯ ОБШИВКА</div>
        <div class="alert-body" id="alert-text"></div>
        <div class="alert-choices" id="alert-buttons"></div>
    `;

    document.body.appendChild(message);

    setTimeout(() => {
        message.classList.add('visible');
    }, 50);

    const textBox = message.querySelector('#alert-text');
    const buttonsBox = message.querySelector('#alert-buttons');

    // === ВСЕ РЕПЛИКИ ДИАЛОГА ===
    const dialog = [
        {
            text: "Зафиксировано повреждение антенны S-диапазона<br>на ферме P3. Кабель оторван, болтается в вакууме.<br>Связь с Землёй частично потеряна.<br><br>Требуется решение по EVA — выходу в открытый космос.",
            button: "СВЯЗАТЬСЯ С ЗЕМЛЁЙ"
        },
        {
            text: "— МКС, это Центр управления. Видим вашу телеметрию.<br>Подтверждаем повреждение антенны.<br>Готовим вам процедуру EVA.",
            button: "СЛУШАТЬ"
        },
        {
            text: "— Анализируем ваши показатели за смену.<br>Биоритмы, концентрация, скорость задач...<br>Минуту, командир.",
            button: "ЖДАТЬ"
        }
        // Последняя реплика добавится динамически — в зависимости от очков
    ];

    let step = 0;

    function showStep() {
        // Убираем старую кнопку
        buttonsBox.innerHTML = "";
        textBox.innerHTML = "";

        // Меняем заголовок на "ЦУП", когда начинается диалог с Землёй
        if (step >= 1) {
            message.querySelector('.alert-header').innerHTML = "◉ КАНАЛ ЦУП — ОТКРЫТЫЙ ЭФИР";
        }

        // Печатаем текст реплики
        typeWriter(dialog[step].text, textBox, 25, () => {
            // После окончания печати — добавляем кнопку
            const btn = document.createElement('button');
            btn.textContent = dialog[step].button;
            btn.classList.add('appearing');

            btn.onclick = () => {
                playClickSound();
                step++;

                // Если это была последняя реплика "Минуту, командир..." —
                // показываем финальный вердикт
                if (step === dialog.length) {
                    showFinalVerdict();
                } else {
                    showStep();
                }
            };

            buttonsBox.appendChild(btn);
        });
    }

    // === ФИНАЛЬНЫЙ ВЕРДИКТ ЦУПа ===
    function showFinalVerdict() {
        buttonsBox.innerHTML = "";
        textBox.innerHTML = "";

        let finalText, finalBtn, nextScene;

        if (readiness >= 8) {
    finalText = "— Командир, телеметрия чистая.<br>Вы сегодня работали собранно и без срывов.<br>Подтверждаем ваш выход. Алекс — на подстраховке внутри.<br>Начинайте подготовку скафандра.";
    finalBtn = "ПРИНЯТЬ КОМАНДУ";
    nextScene = 'eva_suits';
} else {
    finalText = "— Командир, по данным за смену видим<br>повышенный пульс и накопленную усталость.<br>Риск слишком высокий. На внешнюю обшивку идёт Алекс.<br>Вы координируете его изнутри.";
    finalBtn = "ПРИНЯТО";
    nextScene = 'eva_suits';           // теперь обе ветки идут на подготовку
}

        typeWriter(finalText, textBox, 25, () => {
            const btn = document.createElement('button');
            btn.textContent = finalBtn;
            btn.classList.add('appearing');

            btn.onclick = () => {
                playClickSound();
                message.classList.remove('visible');
                setTimeout(() => {
                    message.remove();
                    renderScene(nextScene);
                }, 800);
            };

            buttonsBox.appendChild(btn);
        });
    }

    // Запускаем первую реплику
    showStep();
}
function startCabinMode() {
    hideScenePanel();
    // Очищаем старые элементы каюты
    clearCabinObjects();

    // === СЛОЙ ДЛЯ ИНТЕРАКТИВНЫХ ЗОН ===
    const layer = document.createElement('div');
    layer.id = 'cabin-layer';
    document.body.appendChild(layer);

    // === ЗОНА ФИГУРКИ CURIOSITY ===
    const curiosityZone = document.createElement('div');
    curiosityZone.classList.add('cabin-hotspot', 'hotspot-curiosity');
    layer.appendChild(curiosityZone);

    // Tooltip для фигурки
    const tooltip = document.createElement('div');
    tooltip.classList.add('cabin-tooltip');
    document.body.appendChild(tooltip);

    curiosityZone.onmouseenter = () => {
        tooltip.innerHTML = 
            "Пластиковый марсоход размером с ладонь.<br>" +
            "Подарок перед стартом.<br>" +
            "Когда смотришь на него, становится легче помнить,<br>" +
            "что космос — это не только расстояние,<br>" +
            "но и обещание вернуться.";
        tooltip.classList.add('visible');
    };

    curiosityZone.onmousemove = (e) => {
        tooltip.style.left = (e.clientX + 20) + 'px';
        tooltip.style.top = (e.clientY - 80) + 'px';
    };

    curiosityZone.onmouseleave = () => {
        tooltip.classList.remove('visible');
    };

    // === КНОПКА ИЛЛЮМИНАТОРА ===
    const windowBtn = document.createElement('button');
    windowBtn.textContent = 'Посмотреть\nв иллюминатор';
    windowBtn.classList.add('window-btn', 'cabin-window-btn');
    layer.appendChild(windowBtn);

    // Плавное появление кнопки
    setTimeout(() => {
        windowBtn.style.opacity = '1';
    }, 1500);

    windowBtn.onclick = () => {
        playClickSound();

        // Убираем элементы каюты
        clearCabinObjects();

        // Плавный переход
        bg.style.opacity = '0';
        gameContainer.style.opacity = '0';

        setTimeout(() => {
            renderScene('cabin_window');
        }, 2000);
    };

    // === АВАРИЙНОЕ УВЕДОМЛЕНИЕ ЧЕРЕЗ 35 СЕКУНД ===
    cabinAlertTimer = setTimeout(() => {
        if (currentScene === 'cabin') {
            showAlertNotification();
        }
    }, 8000);
}

// === РЕЖИМ ВЫХОДА В КОСМОС ===
let breathingAudio = null;

function startEVAMode() {
    hideScenePanel();
    // Сразу прячем фон до того, как он успеет мелькнуть
    bg.style.transition = 'none';
    bg.style.opacity = '0';
    bg.style.backgroundImage = 'none';
    bg.style.backgroundColor = 'black';

    // Убираем кнопки
    choices.innerHTML = "";
    choices.style.opacity = '0';

    // Показываем чёрный экран и текст
    setTimeout(() => {
        bg.style.opacity = '1';
        gameContainer.style.opacity = '1';
        
    }, 50);

    // Плавно гасим основную музыку
    let fadeOutMusic = setInterval(() => {
        if (music.volume > 0.02) {
            music.volume -= 0.02;
        } else {
            music.volume = 0;
            music.pause();
            clearInterval(fadeOutMusic);
        }
    }, 100);

    // Запускаем дыхание сразу — на чёрном экране
    breathingAudio = new Audio('audio/gear_024.mp3');
    breathingAudio.loop = true;
    breathingAudio.volume = 0;
    breathingAudio.play();

    let fadeInBreathing = setInterval(() => {
        if (breathingAudio.volume < 0.5) {
            breathingAudio.volume += 0.01;
        } else {
            clearInterval(fadeInBreathing);
        }
    }, 100);

    // Создаём отдельный текст для EVA (не зависит от панели)
const evaText = document.createElement('div');
evaText.id = 'eva-text';
evaText.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-family: 'Inter', sans-serif;
    font-weight: 300;
    font-size: 22px;
    line-height: 1.6;
    letter-spacing: 2px;
    color: white;
    text-align: center;
    text-shadow: 0 0 10px rgba(255, 255, 255, 0.4);
    max-width: 800px;
    z-index: 50;
    opacity: 1;
    transition: opacity 2s ease;
`;
document.body.appendChild(evaText);

// Печатаем текст в новый элемент
typeWriter(
    "Люк открывается.<br>Тишина.<br>Абсолютная, оглушающая тишина.<br>Под тобой — Земля. Над тобой — всё остальное.",
    evaText,
    40,
    () => {
        // После окончания печати — показываем кнопку
        setTimeout(() => {
            const btn = document.createElement('button');
            btn.textContent = 'Приступить к ремонту';
            btn.id = 'eva-continue-btn';
            btn.style.cssText = `
                position: fixed;
                top: 70%;
                left: 50%;
                transform: translateX(-50%);
                padding: 15px 35px;
                font-family: monospace;
                font-size: 14px;
                letter-spacing: 3px;
                color: white;
                background: transparent;
                border: 1px solid rgba(255, 255, 255, 0.5);
                cursor: pointer;
                z-index: 60;
                opacity: 0;
                transition: opacity 1.5s ease, background 0.4s ease, border-color 0.4s ease;
            `;
            document.body.appendChild(btn);

            // Плавное появление
            setTimeout(() => { btn.style.opacity = '1'; }, 50);

            btn.onmouseenter = () => {
                btn.style.background = 'rgba(255, 255, 255, 0.08)';
                btn.style.borderColor = 'white';
            };
            btn.onmouseleave = () => {
                btn.style.background = 'transparent';
                btn.style.borderColor = 'rgba(255, 255, 255, 0.5)';
            };

            btn.onclick = () => {
                playClickSound();
                
                // Плавно прячем текст и кнопку
                evaText.style.opacity = '0';
                btn.style.opacity = '0';
                
                setTimeout(() => {
                    evaText.remove();
                    btn.remove();
                    startAntennaRepair();
                }, 1500);
            };
        }, 2000);
    }
)}

// === МИНИ-ИГРА: РЕМОНТ АНТЕННЫ ===
function startAntennaRepair() {
    // Чёрный фон
    bg.style.transition = 'opacity 1s ease';
    bg.style.opacity = '0';
    
    setTimeout(() => {
        bg.style.backgroundImage = 'none';
        bg.style.backgroundColor = 'black';
        bg.style.opacity = '1';
    }, 1000);

    // Создаём модуль игры
    const module = document.createElement('div');
    module.id = 'antenna-module';
    module.innerHTML = `
        <svg class="antenna-frame-svg" viewBox="0 0 1000 600" preserveAspectRatio="none">
            <rect class="antenna-frame-rect" x="1" y="1" width="998" height="598"></rect>
        </svg>

        <div class="antenna-content">
            <div class="antenna-header">
                <div class="antenna-header-left">
                    <div class="antenna-title">РЕМОНТ АНТЕННЫ — ТРАССИРОВКА КОНТУРА</div>
                    <div class="antenna-goal">ЦЕЛЬ <span id="current-goal">1</span> / 3</div>
                </div>
                <div class="antenna-header-right">
                    <div class="antenna-timer">ВРЕМЯ: <span id="antenna-timer">00:60</span></div>
                    <div class="antenna-attempts">
                        ПОПЫТКИ: 
                        <span class="attempt-dot active"></span>
                        <span class="attempt-dot active"></span>
                        <span class="attempt-dot active"></span>
                    </div>
                </div>
            </div>

            <div class="antenna-field">
                <svg class="antenna-grid" viewBox="0 0 900 460" preserveAspectRatio="xMidYMid meet">
                    <!-- ЛИНИИ СВЯЗИ -->
                    <g class="grid-lines">
                        <!-- Горизонтальные (4 ряда: y = 60, 180, 300, 420) -->
                        <!-- Ряд 1 -->
                        <line x1="60"  y1="60"  x2="180" y2="60"></line>
                        <line x1="180" y1="60"  x2="300" y2="60"></line>
                        <line x1="300" y1="60"  x2="420" y2="60"></line>
                        <line x1="420" y1="60"  x2="540" y2="60"></line>
                        <line x1="540" y1="60"  x2="660" y2="60"></line>
                        <line x1="660" y1="60"  x2="780" y2="60"></line>

                        <!-- Ряд 2 -->
                        <line x1="60"  y1="180" x2="180" y2="180"></line>
                        <line x1="180" y1="180" x2="300" y2="180"></line>
                        <line x1="300" y1="180" x2="420" y2="180"></line>
                        <line x1="420" y1="180" x2="540" y2="180"></line>
                        <line x1="540" y1="180" x2="660" y2="180"></line>
                        <line x1="660" y1="180" x2="780" y2="180"></line>
                        <line x1="780" y1="180" x2="840" y2="180"></line>

                        <!-- Ряд 3 -->
                        <line x1="60"  y1="300" x2="180" y2="300"></line>
                        <line x1="180" y1="300" x2="300" y2="300"></line>
                        <line x1="300" y1="300" x2="420" y2="300"></line>
                        <line x1="420" y1="300" x2="540" y2="300"></line>
                        <line x1="540" y1="300" x2="660" y2="300"></line>
                        <line x1="660" y1="300" x2="780" y2="300"></line>

                        <!-- Ряд 4 -->
                        <line x1="60"  y1="420" x2="180" y2="420"></line>
                        <line x1="180" y1="420" x2="300" y2="420"></line>
                        <line x1="300" y1="420" x2="420" y2="420"></line>
                        <line x1="420" y1="420" x2="540" y2="420"></line>
                        <line x1="540" y1="420" x2="660" y2="420"></line>
                        <line x1="660" y1="420" x2="780" y2="420"></line>

                        <!-- Вертикальные связи -->
                        <line x1="60"  y1="60"  x2="60"  y2="180"></line>
                        <line x1="60"  y1="180" x2="60"  y2="300"></line>
                        <line x1="60"  y1="300" x2="60"  y2="420"></line>

                        <line x1="180" y1="60"  x2="180" y2="180"></line>
                        <line x1="180" y1="180" x2="180" y2="300"></line>
                        <line x1="180" y1="300" x2="180" y2="420"></line>

                        <line x1="300" y1="60"  x2="300" y2="180"></line>
                        <line x1="300" y1="180" x2="300" y2="300"></line>
                        <line x1="300" y1="300" x2="300" y2="420"></line>

                        <line x1="420" y1="60"  x2="420" y2="180"></line>
                        <line x1="420" y1="180" x2="420" y2="300"></line>
                        <line x1="420" y1="300" x2="420" y2="420"></line>

                        <line x1="540" y1="60"  x2="540" y2="180"></line>
                        <line x1="540" y1="180" x2="540" y2="300"></line>
                        <line x1="540" y1="300" x2="540" y2="420"></line>

                        <line x1="660" y1="60"  x2="660" y2="180"></line>
                        <line x1="660" y1="180" x2="660" y2="300"></line>
                        <line x1="660" y1="300" x2="660" y2="420"></line>

                        <line x1="780" y1="60"  x2="780" y2="180"></line>
                        <line x1="780" y1="180" x2="780" y2="300"></line>
                        <line x1="780" y1="300" x2="780" y2="420"></line>
                    </g>

                    <!-- УЗЛЫ -->
                    <g class="grid-nodes">
                        <!-- Ряд 1 (y=60) -->
                        <circle cx="60"  cy="60"  r="8" class="node safe"></circle>
                        <circle cx="180" cy="60"  r="8" class="node safe"></circle>
                        <circle cx="300" cy="60"  r="8" class="node safe"></circle>
                        <circle cx="420" cy="60"  r="8" class="node corrupted"></circle>
                        <circle cx="540" cy="60"  r="8" class="node safe"></circle>
                        <circle cx="660" cy="60"  r="8" class="node safe"></circle>
                        <circle cx="780" cy="60"  r="8" class="node safe"></circle>

                        <!-- Ряд 2 (y=180) — стартовый ряд -->
                        <circle cx="60"  cy="180" r="10" class="node start"></circle>
                        <circle cx="180" cy="180" r="8"  class="node safe"></circle>
                        <circle cx="300" cy="180" r="10" class="node goal" data-goal="1"></circle>
                        <circle cx="420" cy="180" r="8"  class="node safe"></circle>
                        <circle cx="540" cy="180" r="8"  class="node corrupted"></circle>
                        <circle cx="660" cy="180" r="8"  class="node safe"></circle>
                        <circle cx="780" cy="180" r="8"  class="node safe"></circle>
                        <circle cx="840" cy="180" r="8"  class="node safe"></circle>

                        <!-- Ряд 3 (y=300) -->
                        <circle cx="60"  cy="300" r="8" class="node safe"></circle>
                        <circle cx="180" cy="300" r="8" class="node corrupted"></circle>
                        <circle cx="300" cy="300" r="8" class="node safe"></circle>
                        <circle cx="420" cy="300" r="10" class="node goal" data-goal="2"></circle>
                        <circle cx="540" cy="300" r="8" class="node safe"></circle>
                        <circle cx="660" cy="300" r="8" class="node safe"></circle>
                        <circle cx="780" cy="300" r="8" class="node corrupted"></circle>

                        <!-- Ряд 4 (y=420) -->
                        <circle cx="60"  cy="420" r="8" class="node safe"></circle>
                        <circle cx="180" cy="420" r="8" class="node safe"></circle>
                        <circle cx="300" cy="420" r="8" class="node corrupted"></circle>
                        <circle cx="420" cy="420" r="8" class="node safe"></circle>
                        <circle cx="540" cy="420" r="8" class="node safe"></circle>
                        <circle cx="660" cy="420" r="8" class="node safe"></circle>
                        <circle cx="780" cy="420" r="10" class="node goal" data-goal="3"></circle>
                    </g>

                    <!-- НОМЕРА ЦЕЛЕЙ -->
                    <g class="goal-labels">
                        <text x="300" y="184" class="goal-text">1</text>
                        <text x="420" y="304" class="goal-text">2</text>
                        <text x="780" y="424" class="goal-text">3</text>
                    </g>

                    <!-- ВОЛНЫ ПОМЕХ (статичные пока) -->
                    <circle cx="180" cy="60" r="7" class="wave wave-1"></circle>
                    <circle cx="660" cy="420" r="7" class="wave wave-2"></circle>

                    <!-- КУРСОР ИГРОКА -->
                    <circle cx="60" cy="180" r="6" class="player-cursor"></circle>
                </svg>
            </div>

            <div class="antenna-footer">
                <div class="antenna-legend">
                    <span><span class="legend-dot start"></span>СТАРТ</span>
                    <span><span class="legend-dot goal"></span>ЦЕЛЬ</span>
                    <span><span class="legend-dot corrupted"></span>ПОВРЕЖДЁННЫЙ</span>
                    <span><span class="legend-dot wave"></span>ПОМЕХА</span>
                </div>
                <div class="antenna-hint">УПРАВЛЕНИЕ: ↑ ↓ ← →</div>
            </div>
        </div>
    `;
    
    document.body.appendChild(module);

    // Запускаем анимацию рамки
    setTimeout(() => {
        const rect = module.querySelector('.antenna-frame-rect');
        rect.style.strokeDashoffset = '0';
    }, 500);

    // Плавное появление содержимого
    setTimeout(() => {
        module.querySelector('.antenna-content').style.opacity = '1';
    }, 1500);
    // Запускаем логику после появления макета
setTimeout(() => {
    initAntennaGame();
}, 2500);
}
// === ЛОГИКА МИНИ-ИГРЫ: РЕМОНТ АНТЕННЫ ===

// Глобальные переменные мини-игры
let antennaState = {
    cursorX: 60,
    cursorY: 180,
    nodes: [],          // массив всех узлов: {x, y, type}
    keyHandler: null,    // ссылка на обработчик клавиш, чтобы его можно было снять
    currentGoal: 1,
    timeLeft: 60,          
    timerInterval: null,
    waves: [],             
    waveInterval: null,
    attempts: 3
};

// Шаг сетки (расстояние между узлами)
const STEP_X = 120;
const STEP_Y = 120;

function initAntennaGame() {
    // Полный старт игры (только один раз, при первом входе)
    antennaState.attempts = 3;
    antennaState.nodes = [];
    
    const nodeElements = document.querySelectorAll('#antenna-module .node');
    
    nodeElements.forEach(el => {
        const x = parseFloat(el.getAttribute('cx'));
        const y = parseFloat(el.getAttribute('cy'));
        let type = 'safe';
        
        if (el.classList.contains('start'))     type = 'start';
        if (el.classList.contains('goal'))      type = 'goal';
        if (el.classList.contains('corrupted')) type = 'corrupted';
        
        const goalNumber = el.getAttribute('data-goal');
        
        antennaState.nodes.push({ 
            x, y, type, element: el,
            originalType: type,                       // === НОВОЕ ===
            originalGoal: goalNumber ? parseInt(goalNumber) : null,  // === НОВОЕ ===
            goalNumber: goalNumber ? parseInt(goalNumber) : null
        });
    });

    // Запускаем первую попытку
    resetAntennaAttempt();
}

function handleAntennaKey(e) {
    let dx = 0, dy = 0;
    
    if (e.key === 'ArrowUp')    dy = -STEP_Y;
    if (e.key === 'ArrowDown')  dy = STEP_Y;
    if (e.key === 'ArrowLeft')  dx = -STEP_X;
    if (e.key === 'ArrowRight') dx = STEP_X;
    
    if (dx === 0 && dy === 0) return;
    
    const targetX = antennaState.cursorX + dx;
    const targetY = antennaState.cursorY + dy;
    
    const targetNode = antennaState.nodes.find(n => 
        Math.abs(n.x - targetX) < 5 && Math.abs(n.y - targetY) < 5
    );
    
    if (!targetNode) {
        shakeCursor();
        return;
    }
    
    if (targetNode.type === 'corrupted') {
        shakeCursor();
        return;
    }
    
    // === НОВОЕ: проверка цели ===
    if (targetNode.type === 'goal' && targetNode.goalNumber) {
        // Если это не текущая цель — нельзя
        if (targetNode.goalNumber !== antennaState.currentGoal) {
            shakeCursor();
            return;
        }
    }
    
    // Двигаем курсор
    moveCursor(targetNode.x, targetNode.y);
    
    // === НОВОЕ: если зашли на нужную цель — засчитываем ===
    if (targetNode.type === 'goal' && targetNode.goalNumber === antennaState.currentGoal) {
        completeGoal(targetNode);
    }
}

function moveCursor(x, y) {
    // === НОВОЕ: оставляем след на старой позиции ===
    leaveTrail(antennaState.cursorX, antennaState.cursorY);
    
    antennaState.cursorX = x;
    antennaState.cursorY = y;
    
    const cursor = document.querySelector('.player-cursor');
    if (cursor) {
        cursor.setAttribute('cx', x);
        cursor.setAttribute('cy', y);
    }
    
    // Проверяем волны
    antennaState.waves.forEach(wave => {
        const wavePos = wave.path[wave.currentIndex];
        if (Math.abs(wavePos.x - x) < 5 && Math.abs(wavePos.y - y) < 5) {
            antennaWaveHit();
        }
    });
}

function leaveTrail(x, y) {
    const svg = document.querySelector('.antenna-grid');
    if (!svg) return;
    
    const trail = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    trail.setAttribute('cx', x);
    trail.setAttribute('cy', y);
    trail.setAttribute('r', 5);
    trail.classList.add('cursor-trail');
    
    svg.appendChild(trail);
    
    // Удаляем след через 1.2 секунды
    setTimeout(() => trail.remove(), 1200);
}
function completeGoal(node) {
    // Помечаем цель как пройденную
    node.element.classList.add('completed');
    
    // Увеличиваем счётчик
    antennaState.currentGoal++;
    
    // Обновляем шапку
    const goalLabel = document.getElementById('current-goal');
    if (goalLabel) {
        if (antennaState.currentGoal > 3) {
            // Все цели пройдены — победа
            goalLabel.textContent = '3';
            setTimeout(() => antennaVictory(), 600);
        } else {
            goalLabel.textContent = antennaState.currentGoal;
        }
    }
    
    // Меняем тип узла, чтобы по нему можно было ходить дальше как по обычному
    node.type = 'safe';
    node.goalNumber = null;
}

function antennaVictory() {
    stopAntennaGame();
    
    // Временное сообщение — потом сделаем красивый переход
    const module = document.getElementById('antenna-module');
    if (!module) return;
    
    const message = document.createElement('div');
    message.id = 'antenna-victory';
    message.textContent = 'КОНТУР ВОССТАНОВЛЕН';
    module.appendChild(message);

    // Через 2.5 секунды переход к хорошей концовке
    setTimeout(() => {
        module.style.transition = 'opacity 1.5s ease';
        module.style.opacity = '0';
        setTimeout(() => {
            module.remove();
            // Заглушка — потом сделаем настоящую сцену хорошей концовки
            renderScene('quiet_moment');
        }, 1500);
    }, 2500);
}

function shakeCursor() {
    const cursor = document.querySelector('.player-cursor');
    if (!cursor) return;
    
    cursor.classList.add('cursor-shake');
    setTimeout(() => cursor.classList.remove('cursor-shake'), 300);
}

function stopAntennaGame() {
    // Снимаем обработчик клавиш
    if (antennaState.keyHandler) {
        document.removeEventListener('keydown', antennaState.keyHandler);
        antennaState.keyHandler = null;
    }
    
    // === НОВОЕ: останавливаем таймер ===
    stopAntennaTimer();
}

function startAntennaTimer() {
    updateTimerDisplay();
    
    antennaState.timerInterval = setInterval(() => {
        antennaState.timeLeft--;
        updateTimerDisplay();
        
        // Последние 10 секунд — режим тревоги
        if (antennaState.timeLeft <= 10) {
            const timerEl = document.querySelector('.antenna-timer');
            if (timerEl) timerEl.classList.add('warning');
        }
        
        // Время вышло
        if (antennaState.timeLeft <= 0) {
            stopAntennaTimer();
            antennaTimeout();
        }
    }, 1000);
}

function stopAntennaTimer() {
    if (antennaState.timerInterval) {
        clearInterval(antennaState.timerInterval);
        antennaState.timerInterval = null;
    }
    
    // Убираем красную пульсацию
    const timerEl = document.querySelector('.antenna-timer');
    if (timerEl) timerEl.classList.remove('warning');
}

function updateTimerDisplay() {
    const timerSpan = document.getElementById('antenna-timer');
    if (!timerSpan) return;
    
    const seconds = Math.max(0, antennaState.timeLeft);
    const formatted = '00:' + String(seconds).padStart(2, '0');
    timerSpan.textContent = formatted;
}

function antennaTimeout() {
    antennaFail('ВРЕМЯ ИСТЕКЛО');
}

function antennaWaveHit() {
    antennaFail('КУРСОР ПЕРЕХВАЧЕН');
}

function startAntennaWaves() {
    // Описываем маршруты волн
    antennaState.waves = [
        {
            element: document.querySelector('.wave-1'),
            path: [
                { x: 180, y: 60 },
                { x: 300, y: 60 },
                { x: 300, y: 180 },
                { x: 180, y: 180 }
            ],
            currentIndex: 0
        },
        {
            element: document.querySelector('.wave-2'),
            path: [
                { x: 660, y: 420 },
                { x: 540, y: 420 },
                { x: 540, y: 300 },
                { x: 660, y: 300 }
            ],
            currentIndex: 0
        }
    ];
    
    // Каждую секунду двигаем все волны на следующий узел
    antennaState.waveInterval = setInterval(() => {
        antennaState.waves.forEach(wave => {
            wave.currentIndex = (wave.currentIndex + 1) % wave.path.length;
            const next = wave.path[wave.currentIndex];
            
            if (wave.element) {
                wave.element.setAttribute('cx', next.x);
                wave.element.setAttribute('cy', next.y);
            }
            
            // Проверяем столкновение с курсором
            checkWaveCollision(wave, next);
        });
    }, 1000);
}

function stopAntennaWaves() {
    if (antennaState.waveInterval) {
        clearInterval(antennaState.waveInterval);
        antennaState.waveInterval = null;
    }
}

function checkWaveCollision(wave, wavePos) {
    // Если волна и курсор на одном узле — провал
    if (Math.abs(wavePos.x - antennaState.cursorX) < 5 && 
        Math.abs(wavePos.y - antennaState.cursorY) < 5) {
        antennaWaveHit();
    }
}

function antennaFail(reason) {
    // Останавливаем игру (но не снимаем обработчик клавиш — пригодится для следующей попытки)
    stopAntennaTimer();
    stopAntennaWaves();
    
    // Уменьшаем счётчик попыток
    antennaState.attempts--;
    updateAttemptsDisplay();
    
    // Красная вспышка
    flashRedScreen();
    
    if (antennaState.attempts <= 0) {
        // Окончательный проигрыш
        setTimeout(() => antennaFinalLoss(), 800);
    } else {
        // Показываем короткое сообщение и перезапускаем
        showAttemptFailMessage(reason);
        setTimeout(() => resetAntennaAttempt(), 1800);
    }
}

function resetAntennaAttempt() {
    // Сбрасываем цели
    antennaState.currentGoal = 1;
    antennaState.timeLeft = 60;
    
    // Возвращаем тип узлов к исходному (золотые цели опять золотые)
    antennaState.nodes.forEach(n => {
        n.type = n.originalType;
        n.goalNumber = n.originalGoal;
        n.element.classList.remove('completed');
    });
    
    // Возвращаем курсор на старт
    const start = antennaState.nodes.find(n => n.type === 'start');
    antennaState.cursorX = start.x;
    antennaState.cursorY = start.y;
    const cursor = document.querySelector('.player-cursor');
    if (cursor) {
        cursor.setAttribute('cx', start.x);
        cursor.setAttribute('cy', start.y);
    }
    
    // Обновляем счётчик цели в шапке
    const goalLabel = document.getElementById('current-goal');
    if (goalLabel) goalLabel.textContent = '1';
    
    // Снимаем красную пульсацию таймера
    const timerEl = document.querySelector('.antenna-timer');
    if (timerEl) timerEl.classList.remove('warning');
    updateTimerDisplay();
    
    // Вешаем обработчик клавиш (если не висит)
    if (!antennaState.keyHandler) {
        antennaState.keyHandler = (e) => handleAntennaKey(e);
        document.addEventListener('keydown', antennaState.keyHandler);
    }
    
    // Запускаем таймер и волны
    startAntennaTimer();
    startAntennaWaves();
}
function updateAttemptsDisplay() {
    const dots = document.querySelectorAll('.attempt-dot');
    dots.forEach((dot, index) => {
        if (index < antennaState.attempts) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });
}

function flashRedScreen() {
    const flash = document.createElement('div');
    flash.id = 'red-flash';
    document.body.appendChild(flash);
    
    setTimeout(() => flash.remove(), 600);
}

function showAttemptFailMessage(text) {
    const module = document.getElementById('antenna-module');
    if (!module) return;
    
    const message = document.createElement('div');
    message.className = 'antenna-fail-temp';
    message.textContent = text;
    module.appendChild(message);
    
    setTimeout(() => message.remove(), 1700);
}

function antennaFinalLoss() {
    stopAntennaGame();
    
    // Все узлы краснеют
    document.querySelectorAll('#antenna-module .node').forEach(el => {
        el.classList.add('burned');
    });
    
    const module = document.getElementById('antenna-module');
    if (!module) return;
    
    const message = document.createElement('div');
    message.id = 'antenna-fail';
    message.textContent = 'КОНТУР СГОРЕЛ';
    module.appendChild(message);
    
    // Через 3 секунды переход к плохой концовке
    setTimeout(() => {
        module.style.transition = 'opacity 1.5s ease';
        module.style.opacity = '0';
        setTimeout(() => {
            module.remove();
            renderScene('quiet_moment');
        }, 1500);
    }, 3000);
}