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

// 5. ПЕЧАТЬ ТЕКСТА
function typeWriter(text, element, speed, callback) {
    let i = 0;
    element.innerHTML = "";
    function type() {
        if (i < text.length) {
            if (text.substring(i, i + 4) === "<br>") {
                element.innerHTML += "<br>"; i += 4;
            } else {
                element.innerHTML += text.charAt(i); i++;
            }
            setTimeout(type, speed);
        } else { 
            isTransitioning = false;  // Снимаем замок после окончания печати
            if (callback) callback(); 
        }
    }
    type();
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
    { text: "Посмотреть в иллюминатор", nextScene: 'window_view', customClass: 'window-btn', readiness: 1 }
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
    text: "Шлюзовой отсек «Квест».<br>Два скафандра EMU висят в креплениях — белые, массивные, как пустые оболочки.<br>Твой — справа. На шлеме уже наклеен позывной.",
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


// 7. ФУНКЦИЯ СМЕНЫ СЦЕНЫ (Render)
function renderScene(sceneKey) {
    const scene = story[sceneKey];
    if (!scene) return;

    currentScene = sceneKey;
//  ЗАЩИТА ОТ ДВОЙНЫХ КЛИКОВ
    if (isTransitioning) return;
    isTransitioning = true;

    // ШАГ 1: ПОЛНЫЙ BLACK FADE
    bg.style.opacity = '0';
    gameContainer.style.opacity = '0';
    allFloaters.forEach(el => { if(el) el.style.opacity = '0'; });
    bg.classList.remove('camera-active');
    clearCabinObjects();

    setTimeout(() => {
        // ШАГ 2: ПОДГОТОВКА В ТЕМНОТЕ
        choices.innerHTML = "";
        choices.style.opacity = '0';
        gameText.innerHTML = "";

        // Скрываем все объекты
        allFloaters.forEach(el => { if(el) el.style.display = 'none'; });

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
            if (scene.background !== 'none') bg.classList.add('camera-active');

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
                    isTransitioning = false;  // Снимаем замок, чтобы можно было кликать
                    startCabinMode();
                    return;
                }
                typeWriter(scene.text, gameText, 30, () => {
                    //--- ЗАПУСК АВАРИЙНОГО УВЕДОМЛЕНИЯ ---
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
    // Начисляем очки, если они прописаны в опции
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

                        choices.appendChild(btn);
                    });
            setTimeout(() => { choices.style.opacity = '1'; }, 500);
        });
    }, 100);
}, 2000);
}
function startCalibration(mode) {

    gameText.style.opacity = "0";
    choices.style.opacity = "0";
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
        gameText.style.opacity = "1";
        choices.style.opacity = "1";

        // Очищаем текст и кнопки перед печатью
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
        
        // Стираем кнопку "Начать", пока экран черный
        choices.innerHTML = ""; 
        choices.style.opacity = '0';

        bg.style.backgroundImage = 'url("images/first.png")';
        gameText.style.display = 'block';
        
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
    }, 20000);
}

// === РЕЖИМ ВЫХОДА В КОСМОС ===
let breathingAudio = null;

function startEVAMode() {
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
        gameText.style.transition = 'opacity 2s ease';
        gameText.style.opacity = '1';
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

    // Печатаем текст на чёрном фоне
    typeWriter(
        "Люк открывается.<br>Тишина.<br>Абсолютная, оглушающая тишина.<br>Под тобой — Земля. Над тобой — всё остальное.",
        gameText,
        40,
        () => {
            // Держим текст 4 секунды
            setTimeout(() => {
                // Плавно скрываем текст
                gameText.style.transition = 'opacity 2s ease';
                gameText.style.opacity = '0';

                // Ждём пока текст исчезнет, потом меняем фон
setTimeout(() => {
    // Сначала меняем картинку пока фон НЕ виден (opacity = 0 был в самом начале функции, но тут мы его на 1 уже подняли — поэтому опять опускаем)
    bg.style.transition = 'none';
    bg.style.opacity = '0';
    bg.style.backgroundImage = 'url("images/spacesuit3.png")';
    bg.style.backgroundColor = 'transparent';

    // Даём браузеру 50мс отрисовать чёрный с уже подгруженным фоном
    setTimeout(() => {
        bg.style.transition = 'opacity 3s ease';
        bg.style.opacity = '1';
    }, 50);
}, 2000);

            }, 4000);
        }
    );
}