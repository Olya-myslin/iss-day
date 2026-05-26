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
function clearFloaterHighlights() {
    allFloaters.forEach(el => {
        if (el) {
            el.classList.remove('highlight-item');
        }
    });
}
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

// === DEBUG: Быстрый переход к любой сцене ===
window.goToScene = function(sceneName) {
    if (!story[sceneName]) {
        console.error(`[DEBUG] Сцена "${sceneName}" не найдена!`);
        console.log('[DEBUG] Доступные сцены:', Object.keys(story).join(', '));
        return;
    }
    console.log(`[DEBUG] Переход к сцене: ${sceneName}`);

    // Сбрасываем таймеры и состояние
    if (cabinAlertTimer) {
        clearTimeout(cabinAlertTimer);
        cabinAlertTimer = null;
    }
    isTransitioning = false;
    
    // Прячем 3D модель если есть
    const iss = document.getElementById('iss-container');
    if (iss) {
        iss.remove();
    }
    
    // Инициализируем HUD если нет
    if (!document.getElementById('hud-status')) {
        createHUD();
    }
    
    // Переходим к сцене
    renderScene(sceneName);
};

// Примеры использования в консоли:
// goToScene('antenna_repair_start') - мини-игра починки антенны
// goToScene('cabin') - каюта
// goToScene('window_achievement') - ачивка
// goToScene('calibration_full') - калибровка
// goToScene('eva_suits') - выход в космос

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
        text: "Ты пришел вовремя. У тебя есть возможность<br>выбрать что ты хочешь на завтрак.",
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
    text: "Люк открывается.<br>Тишина. Абсолютная, оглушающая тишина.<br>Под тобой — Земля. Над тобой — всё остальное.<br>Скафандр мягко гудит, и на секунду тебе кажется, что ты перестал дышать.",
    background: 'url("images/111.png")',
    showAlarm: false,
    options: [
        { text: "Двигаться к антенне", nextScene: 'eva_traverse' }
    ]
},

'eva_traverse': {
    text: "Пальцы в перчатках находят поручень.<br>Ты медленно тянешь себя вдоль обшивки станции.<br>Каждое движение даётся осторожно — не из-за тяжести, а из-за понимания, где именно ты находишься.",
    background: 'url("images/222.png")',
    showAlarm: false,
    options: [
        { text: "Продолжить путь", nextScene: 'eva_antenna' }
    ]
},

'eva_antenna': {
    text: "Ты добираешься до антенны S-диапазона.<br>Кабель действительно отсоединился и теперь болтается рядом с корпусом.<br>Следов удара не видно.<br>Возможно, сработала усталость материала. Возможно — резкий перепад температур. Возможно, что-то ещё, чего ты пока не видишь.",
    background: 'url("images/444.png")',
    showAlarm: false,
    options: [
        { text: "Осмотреться", nextScene: 'eva_look_down' },
        { text: "Подойти ближе к антенне", nextScene: 'eva_cable_close' }
    ]
},

'eva_look_down': {
    text: "Ты на мгновение замираешь и смотришь вниз.<br>Под тобой — Земля: облака, океаны, тонкая синяя кромка атмосферы.<br>Отсюда всё кажется удивительно хрупким.<br>Ни границ, ни шума, ни споров — только свет, тень и медленное вращение дома, который так далеко и так близко одновременно.",
    background: 'url("images/333.png")',
    showAlarm: false,
    options: [
        { text: "Подойти ближе к антенне", nextScene: 'eva_cable_close' }
    ]
},

'eva_cable_close': {
    text: "Ты фиксируешься у корпуса и берёшь оторвавшийся провод.<br>На разъёме видны жилы и тонкие дорожки, а под панелью — микросхемы антенны.<br>Повреждение локальное. Значит, шанс восстановить контур есть.<br>Теперь всё зависит от точности твоих действий.",
    background: 'url("images/555.png")',
    showAlarm: false,
    options: [
        { text: "Приступить к ремонту", nextScene: 'antenna_repair_start' }
    ]
},

'antenna_repair_start': {
    text: "",
    background: 'none',
    showAlarm: false,
    isAntennaRepair: true,
    options: []
},
// === ВЕТКА: ПОДСТРАХОВКА У АЛЕКСА (readiness < 8) ===

'assist_prep': {
    text: "Шлюзовой отсек «Квест».<br>Три скафандра EMU висят в креплениях — белые, массивные, как пустые оболочки.<br>Твой остаётся висеть справа. Ты остаёшься внутри.<br>Алекс — твои руки и глаза снаружи.",
    background: 'url("images/suits.jpeg")',
    showAlarm: false,
    options: [
        { text: "Помочь Алексу надеть скафандр", nextScene: 'assist_gloves' }
    ]
},

'assist_gloves': {
    text: "Ты фиксируешь запястье перчатки, пока Алекс втягивает пальцы.<br>Щелчок замка — и рука защищена от вакуума.<br>Он кивает через визор. Не слышно, но понятно.<br>Время выхода приближается.",
    background: 'url("images/assist_glove.png")',
    showAlarm: false,
    options: [
        { text: "Перейти к терминалу", nextScene: 'assist_monitor' }
    ]
},

'assist_monitor': {
    text: "Ты у терминала координации.<br>На экране — его шлем-камера: белая обшивка, чёрный космос, желтые поручни.<br>Ты видишь то, что видит он.<br>Единственная связь — голос в наушниках и эта пульсирующая картинка.",
    background: 'url("images/eva_monitor.png")',
    showAlarm: false,
    options: [
        { text: "Начать поддержку связи", nextScene: 'assist_support_start' }
    ]
},

'assist_support_start': {
    text: "",
    background: 'url("images/eva_monitor.png")',
    showAlarm: false,
    isAssistSupport: true,
    options: []
},
// === КОНЦОВКИ ВЕТКИ ПОДДЕРЖКИ ===

'assist_result_good': {
    text: "Алекс возвращается в шлюз через сорок минут.<br>«Спасибо, командир. Ты вёл меня как по нотам.»<br>Антенна работает. Связь с Землёй полная.<br>Иногда лучший выход в космос — это тот, который ты совершил, оставаясь внутри.",
    background: 'url("images/eva_monitor.png")',
    showAlarm: false,
    options: [
        { text: "Продолжить день", nextScene: 'quiet_moment' }
    ]
},

'assist_result_normal': {
    text: "Алекс возвращается уставшим, но целым.<br>«Было непросто. Но мы справились.»<br>Антенна работает. Не идеально, но достаточно.<br>Связь восстановлена.",
    background: 'url("images/eva_monitor.png")',
    showAlarm: false,
    options: [
        { text: "Продолжить день", nextScene: 'quiet_moment' }
    ]
},

'assist_result_bad': {
    text: "Алекс возвращается молча.<br>В наушниках голос ЦУПа: «Дальше будем работать через старшего оператора.»<br>Антенна починена. Алекс цел.<br>Но этот выход он сделал почти один.",
    background: 'url("images/eva_monitor.png")',
    showAlarm: false,
    options: [
        { text: "Продолжить день", nextScene: 'quiet_moment' }
    ]
},
'quiet_moment': {
    text: "Ты возвращаешься к терминалу.<br>День идёт своим чередом.",
    background: 'url("images/control.png")',
    showAlarm: false,
    options: [
        { text: "Посмотреть в иллюминатор", nextScene: 'window_achievement', customClass: 'window-btn-fixed', readiness: 0 }
    ]
},
'window_achievement': {
    text: "В иллюминаторе виден дрейфующий объект.<br>Гаечный ключ, случайно запущенный в свободный полет после починки антенны.<br>Очередное напоминание о том, что в космосе даже самая маленькая ошибка становится вечной.",
    background: 'url("images/window.png")',
    showAlarm: false,
    floatingItems: ['images/achievement.png'],
    onEnter: showMurphyAchievement,
    options: [
        { text: "Вернуться к панели", nextScene: 'quiet_moment' }
    ]
}
    };
function renderScene(sceneKey) {
    const scene = story[sceneKey];
    if (!scene) return;

    currentScene = sceneKey;

    // ЗАЩИТА ОТ ДВОЙНЫХ КЛИКОВ
    if (isTransitioning) return;
    isTransitioning = true;
clearFloaterHighlights();
 const transitionGuard = setTimeout(() => {
        isTransitioning = false;
    }, 8000);

    // ШАГ 1: ПОЛНЫЙ BLACK FADE
    bg.style.opacity = '0';
    gameContainer.style.opacity = '0';
    allFloaters.forEach(el => { if(el) el.style.opacity = '0'; });
    const achievementEl = document.getElementById('floating-object-achievement');
    if (achievementEl) achievementEl.style.opacity = '0';
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
        if (achievementEl) achievementEl.style.display = 'none';

        // === ПОКАЗЫВАЕМ ПАНЕЛЬ ===
        showScenePanel();

        // Меняем фон
        if (scene.background === 'none') {
            bg.style.backgroundImage = 'none';
            bg.style.backgroundColor = 'black';
        } else if (!scene.isEVA) {
            bg.style.backgroundImage = scene.background;
        }
// === EVA: приглушаем музыку и включаем дыхание ===
if (sceneKey === 'eva_exit' && !breathingAudio) {
    fadeOutMainMusic();
    startBreathingAudio();
}
        // === ЗАПУСК МИНИ-ИГРЫ РЕМОНТА АНТЕННЫ ===
if (scene.isAntennaRepair) {
    isTransitioning = false;
    startAntennaRepair();
    return;
}
// === ЗАПУСК МИНИ-ИГРЫ ПОДДЕРЖКИ СВЯЗИ ===
if (scene.isAssistSupport) {
    isTransitioning = false;
    startAssistSupport();
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

            // Показываем еду/предметы с плавным появлением
            if (scene.floatingItems) {
                scene.floatingItems.forEach((imgSrc, index) => {
                    let el = allFloaters[index];
                    if (el) {
                        el.src = imgSrc;
                        el.style.display = 'block';
                        el.style.opacity = '0';
                        // Плавное появление через небольшую задержку
                        setTimeout(() => {
                            el.style.opacity = '1';
                        }, 300 + index * 200);
                    }
                });
                
                // Показываем achievement-объект отдельно
                const achievementEl = document.getElementById('floating-object-achievement');
                if (achievementEl && scene.floatingItems.includes('images/achievement.png')) {
                    achievementEl.src = 'images/achievement.png';
                    achievementEl.style.display = 'block';
                    achievementEl.style.opacity = '0';
                    setTimeout(() => {
                        achievementEl.style.opacity = '1';
                    }, 500);
                }
            }

            if (scene.isCabin) {
                isTransitioning = false;
                startCabinMode();
                return;
            }
            
            typeWriter(scene.text, gameText, 30, () => {
                // --- ЗАПУСК АЧИВКИ ---
                if (scene.onEnter) {
                    scene.onEnter();
                }
                
                // --- ЗАПУСК АВАРИЙНОГО УВЕДОМЛЕНИЯ ---
                if (scene.triggerAlert) {
                    setTimeout(() => {
                        showAlertNotification();
                    }, 1500);
                }

                // Создаем кнопки
                scene.options.forEach(opt => {
                    // Пропускаем кнопку, если она скрыта
                    if (opt.show === false) return;
                    
                    // Пропускаем кнопку иллюминатора в quiet_moment, если ачивку уже видели
                    if (currentScene === 'quiet_moment' && opt.nextScene === 'window_achievement' && window.achievementViewed) {
                        return;
                    }
                    
                    const btn = document.createElement('button');
                    btn.textContent = opt.text;
                    if (opt.customClass) {
                        btn.classList.add(opt.customClass);
                    }
                    if (opt.item) btn.dataset.item = opt.item;

                    btn.onclick = () => {
    clearFloaterHighlights();
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
            velocity: 0.35 + i * 0.15,
            noise: 0.015 + i * 0.01,
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

    setTimeout(() => {
        hud.style.opacity = '1';
        const rect = hud.querySelector('.hud-rect');
        rect.style.strokeDashoffset = '0';
        setTimeout(() => {
            hud.classList.add('visible');
        }, 1000);
    }, 500);
}

// 8. СТАРТ ИГРЫ
startBtn.addEventListener('click', () => {
    playClickSound();
    createHUD();
    
    // Сбрасываем флаг ачивки при новой игре
    window.achievementViewed = false;
    
    // Музыка
    music.volume = 0; music.play();
    let fadeInMusic = setInterval(() => {
        if (music.volume < 0.4) music.volume += 0.02;
        else clearInterval(fadeInMusic);
        // ПЛАВНОЕ УДАЛЕНИЕ СТАНЦИИ
    const iss = document.getElementById('iss-container');
    if (iss) {
        iss.style.opacity = '0'; // Сначала делаем прозрачным
        setTimeout(() => {
            iss.remove(); // А через 1 секунду полностью вырезаем из HTML
        }, 2000);
    }
    }, 200);

    // Fade Out первого слайда
    gameContainer.style.opacity = '0';
    starLayer.style.opacity = '0';
    bg.style.opacity = '0';
    // Функция создания HUD


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

// === DEBUG: Обработка URL-параметров для быстрого перехода ===
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const debugScene = urlParams.get('scene');
    const debugAntenna = urlParams.get('antenna');
    
    // Ждём, пока загрузится story (через небольшую задержку)
    setTimeout(() => {
        if (debugScene && story[debugScene]) {
            console.log(`[DEBUG] Переход к сцене из URL: ${debugScene}`);
            goToScene(debugScene);
        }
        
        if (debugAntenna === 'true') {
            console.log('[DEBUG] Переход к мини-игре починки антенны');
            goToScene('antenna_repair_start');
        }
    }, 500);
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
// === АЧИВКА — «ЗАКОН МЁРФИ» ===
function showMurphyAchievement() {
    // Устанавливаем флаг, что ачивку получили
    window.achievementViewed = true;

    const achievement = document.getElementById('achievement');
    
    if (!achievement) {
        console.error('[ACHIEVEMENT] Элемент #achievement не найден!');
        return;
    }

    const notificationSound = new Audio('audio/notification.mp3');
    notificationSound.volume = 0.5;
    
    achievement.innerHTML = `
        <span class="achievement-title">🏆 АЧИВКА РАЗБЛОКИРОВАНА</span>
        <span class="achievement-name">«Закон Мёрфи»</span>
    `;
    
    console.log('[ACHIEVEMENT] Добавляем класс visible');
    
    // Воспроизводим звук
    notificationSound.play().catch((err) => {
        console.error('[ACHIEVEMENT] Ошибка звука:', err);
    });
    
    // Показываем
    achievement.classList.add('visible');
    
    // +1 к Readiness
    updateReadiness(1);
    
    // Скрываем через 4 секунды
    setTimeout(() => {
        achievement.classList.remove('visible');
        console.log('[ACHIEVEMENT] Скрыто');
    }, 4000);
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

    alert.onclick = () => {
    playClickSound();
    clearCabinObjects();
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
    finalBtn = "ПРИНЯТЬ К ПОДСТРАХОВКЕ";
    nextScene = 'assist_prep';
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

    // === КНОПКА ИЛЛЮМИНАТОРА (только если ачивку ещё не видели) ===
    if (!window.achievementViewed) {
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
    }

    // === АВАРИЙНОЕ УВЕДОМЛЕНИЕ ЧЕРЕЗ 35 СЕКУНД ===
    cabinAlertTimer = setTimeout(() => {
        if (currentScene === 'cabin') {
            showAlertNotification();
        }
    }, 8000);
}

// === РЕЖИМ ВЫХОДА В КОСМОС ===
let breathingAudio = null;
function fadeOutMainMusic() {
    let fadeOut = setInterval(() => {
        if (music.volume > 0.02) {
            music.volume -= 0.02;
        } else {
            music.volume = 0;
            music.pause();
            clearInterval(fadeOut);
        }
    }, 100);
}

function startBreathingAudio() {
    if (breathingAudio) return;

    breathingAudio = new Audio('audio/gear_024.mp3');
    breathingAudio.loop = true;
    breathingAudio.volume = 0;
    breathingAudio.play().catch(() => {});

    let fadeIn = setInterval(() => {
        if (breathingAudio && breathingAudio.volume < 0.5) {
            breathingAudio.volume += 0.01;
        } else {
            clearInterval(fadeIn);
        }
    }, 100);
}

function stopBreathingAudio() {
    if (!breathingAudio) return;

    const snd = breathingAudio;
    breathingAudio = null;

    let fadeOut = setInterval(() => {
        if (snd.volume > 0.02) {
            snd.volume -= 0.02;
        } else {
            snd.pause();
            snd.currentTime = 0;
            clearInterval(fadeOut);
        }
    }, 80);
}
// === ЗВУК EVA: ДЫХАНИЕ И ПРИГЛУШЕНИЕ МУЗЫКИ ===

function fadeOutMainMusic() {
    let fadeOut = setInterval(() => {
        if (music.volume > 0.02) {
            music.volume -= 0.02;
        } else {
            music.volume = 0;
            music.pause();
            clearInterval(fadeOut);
        }
    }, 100);
}


function stopBreathingAudio() {
    if (!breathingAudio) return;

    const snd = breathingAudio;
    breathingAudio = null;

    let fadeOut = setInterval(() => {
        if (snd.volume > 0.02) {
            snd.volume -= 0.02;
        } else {
            snd.pause();
            snd.currentTime = 0;
            clearInterval(fadeOut);
        }
    }, 80);
}
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


// === МИНИ-ИГРА: ПОДДЕРЖКА СВЯЗИ ===

let supportState = {
    correctAnswers: 0,
    currentEvent: 0,
    timerInterval: null,
    timeLeft: 0,
    answered: false
};

const supportEvents = [
    {
        param: 'pulse',
        label: 'ПУЛЬС',
        alert: '⚠ ПУЛЬС РАСТЁТ',
        alexBefore: '«Кажется, я слишком разогнался... сердце колотится.»',
        options: [
            { text: "Снизить темп работы", correct: true },
            { text: "Сделать паузу 30 секунд", correct: false },
            { text: "Проверить крепление шлема", correct: false }
        ],
        alexAfterCorrect: '«Принял. Замедляюсь... да, лучше. Спасибо.»',
        alexAfterWrong: '«Не то... сам справлюсь, дай минуту.»'
    },
    {
        param: 'oxygen',
        label: 'КИСЛОРОД',
        alert: '⚠ ПАДАЕТ ДАВЛЕНИЕ В ПЕРЧАТКЕ',
        alexBefore: '«Слышу шипение в перчатке. Не пойму откуда.»',
        options: [
            { text: "Снизить расход кислорода", correct: false },
            { text: "Проверить крепление перчатки", correct: true },
            { text: "Включить аварийный режим", correct: false }
        ],
        alexAfterCorrect: '«Точно, замок недожат. Дотянул. Давление выравнивается.»',
        alexAfterWrong: '«Не помогает... давление падает. Жду подсказку.»'
    },
    {
        param: 'temperature',
        label: 'ТЕМПЕРАТУРА',
        alert: '⚠ ПЕРЕГРЕВ СКАФАНДРА',
        alexBefore: '«Жарко становится. Похоже, перегрев системы охлаждения.»',
        options: [
            { text: "Снизить темп работы", correct: false },
            { text: "Сделать паузу 30 секунд", correct: false },
            { text: "Включить дополнительное охлаждение", correct: true }
        ],
        alexAfterCorrect: '«Поток пошёл. Уже легче. Продолжаю.»',
        alexAfterWrong: '«Терплю... постараюсь сам.»'
    }
];
// Печать реплики Алекса (без звука печати, чтобы не сбивать)
function typeAlexLine(element, text, speed) {
    let i = 0;
    element.innerHTML = '';

    function type() {
        if (i < text.length) {
            if (text.substring(i, i + 4) === '<br>') {
                element.innerHTML += '<br>';
                i += 4;
            } else {
                element.innerHTML += text.charAt(i);
                i++;
            }
            setTimeout(type, speed);
        }
    }
    type();
}
function startAssistSupport() {
    // Скрываем основную панель
    hideScenePanel();

    // Создаём модуль
    const module = document.createElement('div');
    module.id = 'support-module';
    module.innerHTML = `
        <svg class="support-frame-svg" viewBox="0 0 1000 600" preserveAspectRatio="none">
            <rect class="support-frame-rect" x="1" y="1" width="998" height="598"></rect>
        </svg>

        <div class="support-content">
            <div class="support-header">
                <div class="support-title">ПОДДЕРЖКА СВЯЗИ — ALEX / EVA-1</div>
                <div class="support-event-counter">СОБЫТИЕ <span id="support-event-num">1</span> / 3</div>
            </div>

            <div class="support-params">
                <div class="support-param">
                    <div class="support-param-label">ПУЛЬС</div>
                    <div class="support-param-bar"><div class="support-param-fill" id="param-pulse"></div></div>
                    <div class="support-param-value" id="value-pulse">75</div>
                </div>
                <div class="support-param">
                    <div class="support-param-label">КИСЛОРОД</div>
                    <div class="support-param-bar"><div class="support-param-fill" id="param-oxygen"></div></div>
                    <div class="support-param-value" id="value-oxygen">97%</div>
                </div>
                <div class="support-param">
                    <div class="support-param-label">ТЕМПЕРАТУРА</div>
                    <div class="support-param-bar"><div class="support-param-fill" id="param-temperature"></div></div>
                    <div class="support-param-value" id="value-temperature">норма</div>
                </div>
            </div>

            <div class="support-alex-line" id="support-alex"></div>
            <div class="support-alert" id="support-alert"></div>
            <div class="support-timer-bar" id="support-timer-bar">
                <div class="support-timer-fill" id="support-timer-fill"></div>
            </div>

            <div class="support-choices" id="support-choices"></div>
        </div>
    `;

    document.body.appendChild(module);
// Анимация рамки + плавное появление фона
setTimeout(() => {
    const rect = module.querySelector('.support-frame-rect');
    rect.style.strokeDashoffset = '0';
    rect.classList.add('filled');
}, 300);

    // Сброс состояния
supportState.correctAnswers = 0;
supportState.currentEvent = 0;

// Поочерёдное плавное появление элементов
const elementsToShow = [
    '.support-header',
    '.support-params',
    '.support-alex-line',
    '.support-alert',
    '.support-timer-bar',
    '.support-choices'
];

elementsToShow.forEach((selector, index) => {
    setTimeout(() => {
        const el = module.querySelector(selector);
        if (el) el.classList.add('visible-element');
    }, 1200 + index * 350);
});

// Запуск первого события (после появления всех элементов)
setTimeout(() => {
    runSupportEvent();
}, 1200 + elementsToShow.length * 350 + 400);
}

function runSupportEvent() {
    const event = supportEvents[supportState.currentEvent];
    if (!event) {
        finishSupportGame();
        return;
    }

    supportState.answered = false;

    // Обновляем счётчик
    document.getElementById('support-event-num').textContent = supportState.currentEvent + 1;

 // Реплика Алекса ДО события (печатается)
const alexEl = document.getElementById('support-alex');
alexEl.innerHTML = '';
alexEl.classList.add('visible');
typeAlexLine(alexEl, event.alexBefore, 40);

    // Звук уведомления
    const sound = new Audio('audio/notification.mp3');
    sound.volume = 0.4;
    sound.play().catch(() => {});

    // Через 4.5 сек — показываем параметр в красном
    setTimeout(() => {
        const paramFill = document.getElementById('param-' + event.param);
        const paramValue = document.getElementById('value-' + event.param);

        paramFill.classList.add('critical');

        if (event.param === 'pulse') {
            paramFill.style.width = '95%';
            paramValue.textContent = '128';
        } else if (event.param === 'oxygen') {
            paramFill.style.width = '40%';
            paramValue.textContent = '62%';
        } else if (event.param === 'temperature') {
            paramFill.style.width = '90%';
            paramValue.textContent = 'высокая';
        }

        // Тревожное сообщение
        const alertEl = document.getElementById('support-alert');
        alertEl.textContent = event.alert;
        alertEl.classList.add('visible');

        // Показываем кнопки
        showSupportChoices(event);

        // Запускаем таймер
        startSupportTimer(event);
    }, 4500);
}

function showSupportChoices(event) {
    const box = document.getElementById('support-choices');
    box.innerHTML = '';

    event.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.textContent = opt.text;
        btn.onclick = () => {
            if (supportState.answered) return;
            playClickSound();
            handleSupportAnswer(opt.correct, btn, event);
        };
        box.appendChild(btn);
    });
}

function startSupportTimer(event) {
    supportState.timeLeft = 8000; // 8 секунд
    const fill = document.getElementById('support-timer-fill');
    const bar = document.getElementById('support-timer-bar');
    bar.classList.add('visible');
    fill.style.width = '100%';

    const startTime = Date.now();

    supportState.timerInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, supportState.timeLeft - elapsed);
        const percent = (remaining / supportState.timeLeft) * 100;
        fill.style.width = percent + '%';

        if (percent < 30) {
            fill.classList.add('danger');
        }

        if (remaining <= 0) {
            clearInterval(supportState.timerInterval);
            if (!supportState.answered) {
                handleSupportAnswer(false, null, event); // не успел = неправильно
            }
        }
    }, 50);
}

function handleSupportAnswer(isCorrect, btn, event) {
    supportState.answered = true;
    clearInterval(supportState.timerInterval);

    // Блокируем все кнопки
    document.querySelectorAll('#support-choices button').forEach(b => b.disabled = true);

    // Подсвечиваем нажатую
    if (btn) {
        btn.classList.add(isCorrect ? 'correct' : 'wrong');
    }

    // Показываем правильную, если игрок ошибся
    if (!isCorrect) {
        document.querySelectorAll('#support-choices button').forEach(b => {
            const opt = event.options.find(o => o.text === b.textContent);
            if (opt && opt.correct) b.classList.add('correct');
        });
    }

  // Реплика Алекса ПОСЛЕ (печатается)
const alexEl = document.getElementById('support-alex');
alexEl.classList.remove('visible');

setTimeout(() => {
    alexEl.innerHTML = '';
    alexEl.classList.add('visible');
    const lineAfter = isCorrect ? event.alexAfterCorrect : event.alexAfterWrong;
    typeAlexLine(alexEl, lineAfter, 40);
}, 400);

    // Если правильно — возвращаем параметр в норму
    if (isCorrect) {
        supportState.correctAnswers++;
        setTimeout(() => {
            const paramFill = document.getElementById('param-' + event.param);
            const paramValue = document.getElementById('value-' + event.param);
            paramFill.classList.remove('critical');

            if (event.param === 'pulse') {
                paramFill.style.width = '78%';
                paramValue.textContent = '88';
            } else if (event.param === 'oxygen') {
                paramFill.style.width = '85%';
                paramValue.textContent = '92%';
            } else if (event.param === 'temperature') {
                paramFill.style.width = '70%';
                paramValue.textContent = 'норма';
            }
        }, 600);
    }

    // Прячем алерт и таймер
    document.getElementById('support-alert').classList.remove('visible');
    document.getElementById('support-timer-bar').classList.remove('visible');

    // Переход к следующему событию через 5.5 сек
    setTimeout(() => {
        supportState.currentEvent++;
        runSupportEvent();
    }, 5500);
}

function finishSupportGame() {
    const module = document.getElementById('support-module');
    if (!module) return;

    // Определяем результат
    let resultText, nextScene;
    const score = supportState.correctAnswers;

    if (score === 3) {
        resultText = 'РАБОТА ЗАВЕРШЕНА.<br>АНТЕННА ВОССТАНОВЛЕНА.<br>АЛЕКС ВОЗВРАЩАЕТСЯ.';
        nextScene = 'assist_result_good';
    } else if (score === 2) {
        resultText = 'РЕМОНТ ВЫПОЛНЕН.<br>АЛЕКС СПРАВИЛСЯ.';
        nextScene = 'assist_result_normal';
    } else {
        resultText = 'АНТЕННА ВОССТАНОВЛЕНА.<br>АЛЕКС ВЫШЕЛ САМ.';
        nextScene = 'assist_result_bad';
    }

    // Показываем финальное сообщение
    const finalMsg = document.createElement('div');
    finalMsg.classList.add('support-final');
    finalMsg.innerHTML = resultText;
    module.appendChild(finalMsg);

    // Через 3.5 сек убираем модуль и переходим к концовке
    setTimeout(() => {
        module.style.transition = 'opacity 1.5s ease';
        module.style.opacity = '0';
        setTimeout(() => {
            module.remove();
            renderScene(nextScene);
        }, 1500);
    }, 3500);
}
// === МИНИ-ИГРА: РЕМОНТ АНТЕННЫ (Prey-style) ===

let antennaGame = {
    cursorX: 50,
    cursorY: 250,
    velocityX: 0,
    velocityY: 0,
    speed: 4,
    keys: { up: false, down: false, left: false, right: false },
    stunned: false,
    attempts: 3,
    timeLeft: 40,
    timerInterval: null,
    gameLoopId: null,
    keyHandler: null,
    keyUpHandler: null,
    obstacles: [],
    dangers: [],
    targetZones: [],
    currentTarget: 0,
    fieldWidth: 900,
    fieldHeight: 480,
    inTargetZone: false,
    requiredKey: null,
    keyTimerInterval: null,
    keyTimeLeft: 0
};

const ANTENNA_CONFIG = {
    obstacles: [
        // ВЕРХНИЙ ЛЕВЫЙ УГОЛ - большой блок
        { x: 10,  y: 15,  w: 160, h: 80 },
        
        // ВЕРХНИЙ ПРАВЫЙ УГОЛ
        { x: 750, y: 15,  w: 80,  h: 40 },
        { x: 850, y: 80,  w: 120, h: 120 },
        
        // ЛЕВАЯ СТОРОНА
        { x: 15,  y: 180, w: 70,  h: 220 },
        
        // ЦЕНТР - вертикальные блоки
        { x: 280, y: 140, w: 90,  h: 160 },
        { x: 430, y: 180, w: 110, h: 40 },
        { x: 460, y: 260, w: 50,  h: 140 },
        
        // ПРАВАЯ СТОРОНА - высокий вертикальный
        { x: 620, y: 130, w: 60,  h: 260 },
        
        // НИЖНИЙ ЦЕНТР
        { x: 360, y: 350, w: 50,  h: 110 },
        { x: 520, y: 360, w: 70,  h: 70 },
        { x: 700, y: 380, w: 60,  h: 60 },
        
        // НИЖНИЙ ПРАВЫЙ УГОЛ - большой блок
        { x: 790, y: 350, w: 100, h: 110 },
        
        // ЛЕВЫЙ НИЗ
        { x: 180, y: 410, w: 110, h: 60 }
    ],
    dangers: [
        { x: 130, y: 40,  w: 60,  h: 60 },   // верх-лево
        { x: 360, y: 50,  w: 70,  h: 70 },   // верх-центр
        { x: 560, y: 30,  w: 60,  h: 65 },   // верх-право
        { x: 700, y: 60,  w: 100, h: 45 },   // верх-право-второй
        { x: 240, y: 290, w: 60,  h: 60 },   // центр-лево
        { x: 520, y: 400, w: 60,  h: 60 },   // центр-низ
        { x: 190, y: 420, w: 55,  h: 55 }    // низ-лево
    ],
    targets: [
        { x: 140, y: 210, r: 40 },  // лево-центр (между блоками)
        { x: 730, y: 260, r: 40 },  // право-центр (перемещено, было 880, 150)
        { x: 470, y: 340, r: 40 }   // низ-центр
    ],
    availableKeys: ['Space', 'Control', 'Shift']
};

function startAntennaRepair() {
    hideScenePanel();

    // Чёрный фон
    bg.style.transition = 'opacity 1s ease';
    bg.style.opacity = '0';
    setTimeout(() => {
        bg.style.backgroundImage = 'none';
        bg.style.backgroundColor = 'black';
        bg.style.opacity = '1';
    }, 1000);

    // Сброс состояния
    antennaGame.timeLeft = 40;
    antennaGame.currentTarget = 0;
    antennaGame.cursorX = 130;
    antennaGame.cursorY = 350;
    antennaGame.velocityX = 0;
    antennaGame.velocityY = 0;
    antennaGame.stunned = false;
    antennaGame.inTargetZone = false;

    // Создаём модуль
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
                <div class="antenna-goal">УЗЕЛ <span id="current-goal">1</span> / 3</div>
            </div>
            <div class="antenna-header-right">
                <div class="antenna-timer">ВРЕМЯ: <span id="antenna-timer">00:40</span></div>
            </div>
        </div>
        <div class="antenna-field" id="antenna-field">
            <div class="player-cursor" id="player-cursor"></div>
        </div>
        <div class="antenna-footer">
            <div class="antenna-legend">
                <span><span class="legend-dot player"></span>КУРСОР</span>
                <span><span class="legend-dot target"></span>ЦЕЛЬ</span>
                <span><span class="legend-dot danger"></span>РАЗРЯД</span>
                <span><span class="legend-dot wall"></span>ПРЕПЯТСТВИЕ</span>
            </div>
            <div class="antenna-hint">УПРАВЛЕНИЕ: ↑ ↓ ← →</div>
        </div>
    </div>
`;
    document.body.appendChild(module);

    // Анимация рамки
    setTimeout(() => {
        const rect = module.querySelector('.antenna-frame-rect');
        rect.style.strokeDashoffset = '0';
        rect.classList.add('filled');
    }, 300);

    // Плавное появление элементов
const elementsToShow = ['.antenna-header', '.antenna-field', '.antenna-footer'];
elementsToShow.forEach((sel, i) => {
    setTimeout(() => {
        const el = module.querySelector(sel);
        if (el) {
            el.classList.add('visible-element');
            el.style.opacity = '1';  // ← гарантированно показываем
        }
    }, 1200 + i * 350);
});

// Запуск игры — ждём пока поле станет видимым
setTimeout(() => {
    buildAntennaField();
    spawnTarget(0);
    startAntennaControls();
    startAntennaTimer();
    antennaGameLoop();
}, 1200 + elementsToShow.length * 350 + 600);

function buildAntennaField() {
    const field = document.getElementById('antenna-field');
    if (!field) return;

    // Получаем реальные размеры поля
    const rect = field.getBoundingClientRect();
    antennaGame.fieldWidth = rect.width;
    antennaGame.fieldHeight = rect.height;

    // Масштаб (конфиг в координатах 900x480)
    const scaleX = antennaGame.fieldWidth / 900;
    const scaleY = antennaGame.fieldHeight / 480;

    antennaGame.obstacles = [];
    antennaGame.dangers = [];

    // Препятствия
    ANTENNA_CONFIG.obstacles.forEach(o => {
        const el = document.createElement('div');
        el.className = 'obstacle';
        el.style.left = (o.x * scaleX) + 'px';
        el.style.top = (o.y * scaleY) + 'px';
        el.style.width = (o.w * scaleX) + 'px';
        el.style.height = (o.h * scaleY) + 'px';
        field.appendChild(el);
        antennaGame.obstacles.push({
            x: o.x * scaleX,
            y: o.y * scaleY,
            w: o.w * scaleX,
            h: o.h * scaleY
        });
    });

    // Опасности
    ANTENNA_CONFIG.dangers.forEach(d => {
        const el = document.createElement('div');
        el.className = 'danger-zone';
        el.style.left = (d.x * scaleX) + 'px';
        el.style.top = (d.y * scaleY) + 'px';
        el.style.width = (d.w * scaleX) + 'px';
        el.style.height = (d.h * scaleY) + 'px';
        field.appendChild(el);
        antennaGame.dangers.push({
            x: d.x * scaleX,
            y: d.y * scaleY,
            w: d.w * scaleX,
            h: d.h * scaleY
        });
    });

    antennaGame.cursorX = 130 * scaleX;
    antennaGame.cursorY = 350 * scaleY;
    updateCursorPosition();

    // Плавно показываем курсор, когда он уже на правильной позиции
    const cursor = document.getElementById('player-cursor');
    if (cursor) {
        setTimeout(() => {
            cursor.style.opacity = '1';
        }, 600);
    }
}
}

function spawnTarget(index) {
    const field = document.getElementById('antenna-field');
    if (!field) return;

    // Удаляем старую цель
    const oldTarget = field.querySelector('.target-zone');
    if (oldTarget) oldTarget.remove();

    const config = ANTENNA_CONFIG.targets[index];
    if (!config) return;

    const scaleX = antennaGame.fieldWidth / 900;
    const scaleY = antennaGame.fieldHeight / 480;

    const target = document.createElement('div');
    target.className = 'target-zone';
    target.style.left = (config.x * scaleX) + 'px';
    target.style.top = (config.y * scaleY) + 'px';
    target.style.width = (config.r * 2) + 'px';
    target.style.height = (config.r * 2) + 'px';
    field.appendChild(target);

    antennaGame.targetX = config.x * scaleX;
    antennaGame.targetY = config.y * scaleY;
    antennaGame.targetRadius = config.r;
}

function startAntennaControls() {
    antennaGame.keyHandler = (e) => {
        if (antennaGame.stunned) return;
        if (e.key === 'ArrowUp')    antennaGame.keys.up    = true;
        if (e.key === 'ArrowDown')  antennaGame.keys.down  = true;
        if (e.key === 'ArrowLeft')  antennaGame.keys.left  = true;
        if (e.key === 'ArrowRight') antennaGame.keys.right = true;

        // Проверка нажатия клавиш в целевой зоне
        if (antennaGame.inTargetZone && antennaGame.requiredKey) {
            const pressed = e.key === ' ' ? 'Space' : e.key;
            
            // Проверка нажатия на стрелки движения
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || 
                e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                // Игнорируем — это движение
                return;
            }
            
            if (pressed === antennaGame.requiredKey) {
                completeTarget();
            } else {
                // НАЖАТА НЕПРАВИЛЬНАЯ КНОПКА — ВЫТАЛКИВАЕМ ИЗ ЗОНЫ
                wrongKeyPenalty();
            }
        }
    };
    antennaGame.keyUpHandler = (e) => {
        if (e.key === 'ArrowUp')    antennaGame.keys.up    = false;
        if (e.key === 'ArrowDown')  antennaGame.keys.down  = false;
        if (e.key === 'ArrowLeft')  antennaGame.keys.left  = false;
        if (e.key === 'ArrowRight') antennaGame.keys.right = false;
    };
    document.addEventListener('keydown', antennaGame.keyHandler);
    document.addEventListener('keyup', antennaGame.keyUpHandler);
}

function antennaGameLoop() {
    if (!antennaGame.stunned) {
        // Целевое ускорение в зависимости от нажатых клавиш
        let targetAccelX = 0, targetAccelY = 0;
        if (antennaGame.keys.up)    targetAccelY -= 1;
        if (antennaGame.keys.down)  targetAccelY += 1;
        if (antennaGame.keys.left)  targetAccelX -= 1;
        if (antennaGame.keys.right) targetAccelX += 1;

        // Нормализация диагонали (чтобы по диагонали не было быстрее)
        if (targetAccelX !== 0 && targetAccelY !== 0) {
            const norm = 1 / Math.sqrt(2);
            targetAccelX *= norm;
            targetAccelY *= norm;
        }

        // Параметры физики
        const acceleration = 0.45;  // как быстро разгоняется
        const friction = 0.94;      // как быстро тормозит (ближе к 1 = меньше трения)
        const maxSpeed = 5.8;       // максимальная скорость (уменьшил на ~10%)

        // Применяем ускорение
        antennaGame.velocityX += targetAccelX * acceleration;
        antennaGame.velocityY += targetAccelY * acceleration;

        // Применяем трение (когда клавиши отпущены — курсор плавно тормозит)
        antennaGame.velocityX *= friction;
        antennaGame.velocityY *= friction;

        // Ограничение максимальной скорости
        const speed = Math.sqrt(antennaGame.velocityX ** 2 + antennaGame.velocityY ** 2);
        if (speed > maxSpeed) {
            antennaGame.velocityX = (antennaGame.velocityX / speed) * maxSpeed;
            antennaGame.velocityY = (antennaGame.velocityY / speed) * maxSpeed;
        }

        // Пробуем двигаться по X
        let newX = antennaGame.cursorX + antennaGame.velocityX;
        if (!collidesWithObstacle(newX, antennaGame.cursorY) &&
            newX >= 11 && newX <= antennaGame.fieldWidth - 11) {
            antennaGame.cursorX = newX;
        } else {
            antennaGame.velocityX = 0; // удар о стену — останавливаем по X
        }

        // Пробуем двигаться по Y
        let newY = antennaGame.cursorY + antennaGame.velocityY;
        if (!collidesWithObstacle(antennaGame.cursorX, newY) &&
            newY >= 11 && newY <= antennaGame.fieldHeight - 11) {
            antennaGame.cursorY = newY;
        } else {
            antennaGame.velocityY = 0; // удар о стену — останавливаем по Y
        }

        updateCursorPosition();

        // Проверка опасностей
        if (collidesWithDanger(antennaGame.cursorX, antennaGame.cursorY)) {
            stunCursor();
        }

        // Проверка цели
        checkTargetZone();
    }

    antennaGame.gameLoopId = requestAnimationFrame(antennaGameLoop);
}

function collidesWithObstacle(x, y) {
    const r = 11;
    return antennaGame.obstacles.some(o =>
        x + r > o.x && x - r < o.x + o.w &&
        y + r > o.y && y - r < o.y + o.h
    );
}

function collidesWithDanger(x, y) {
    const r = 11;
    return antennaGame.dangers.some(d =>
        x + r > d.x && x - r < d.x + d.w &&
        y + r > d.y && y - r < d.y + d.h
    );
}

function updateCursorPosition() {
    const cursor = document.getElementById('player-cursor');
    if (!cursor) return;
    cursor.style.left = antennaGame.cursorX + 'px';
    cursor.style.top = antennaGame.cursorY + 'px';
}

function stunCursor() {
    if (antennaGame.stunned) return;
    antennaGame.stunned = true;
    flashRedScreen();

    const cursor = document.getElementById('player-cursor');
    if (cursor) cursor.classList.add('stunned');

    // Выходим из целевой зоны если были внутри
    if (antennaGame.inTargetZone) {
        exitTargetZone();
    }

    // Отталкиваем курсор от центра ближайшей опасности
    const danger = findNearestDanger();
    if (danger) {
        const cx = danger.x + danger.w / 2;
        const cy = danger.y + danger.h / 2;
        const dx = antennaGame.cursorX - cx;
        const dy = antennaGame.cursorY - cy;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        
        // Отталкиваем на безопасное расстояние
        const pushDistance = Math.max(danger.w, danger.h) / 2 + 40;
        
        // Запоминаем начальную позицию для плавной анимации
        const startX = antennaGame.cursorX;
        const startY = antennaGame.cursorY;
        const endX = cx + (dx / dist) * pushDistance;
        const endY = cy + (dy / dist) * pushDistance;
        
        // Ограничиваем границами поля
        const finalX = Math.max(11, Math.min(antennaGame.fieldWidth - 11, endX));
        const finalY = Math.max(11, Math.min(antennaGame.fieldHeight - 11, endY));
        
        // Плавная анимация отталкивания за 150мс
        const startTime = Date.now();
        const duration = 150;
        
        function animatePush() {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function (ease-out)
            const ease = 1 - Math.pow(1 - progress, 3);
            
            antennaGame.cursorX = startX + (finalX - startX) * ease;
            antennaGame.cursorY = startY + (finalY - startY) * ease;
            updateCursorPosition();
            
            if (progress < 1) {
                requestAnimationFrame(animatePush);
            } else {
                // Анимация завершена
                antennaGame.velocityX = 0;
                antennaGame.velocityY = 0;
            }
        }
        
        animatePush();
    } else {
        antennaGame.velocityX = 0;
        antennaGame.velocityY = 0;
    }

    // Блокируем управление
    antennaGame.keys = { up: false, down: false, left: false, right: false };

    setTimeout(() => {
        antennaGame.stunned = false;
        if (cursor) cursor.classList.remove('stunned');
    }, 800);
}

// Найти ближайшую опасность к курсору
function findNearestDanger() {
    let nearest = null;
    let minDist = Infinity;
    antennaGame.dangers.forEach(d => {
        const cx = d.x + d.w / 2;
        const cy = d.y + d.h / 2;
        const dx = antennaGame.cursorX - cx;
        const dy = antennaGame.cursorY - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDist) {
            minDist = dist;
            nearest = d;
        }
    });
    return nearest;
}

function checkTargetZone() {
    if (!antennaGame.targetX) return;
    const dx = antennaGame.cursorX - antennaGame.targetX;
    const dy = antennaGame.cursorY - antennaGame.targetY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < antennaGame.targetRadius && !antennaGame.inTargetZone) {
        enterTargetZone();
    } else if (dist >= antennaGame.targetRadius && antennaGame.inTargetZone) {
        exitTargetZone();
    }
}

function enterTargetZone() {
    antennaGame.inTargetZone = true;

    // Случайная клавиша
    const keys = ANTENNA_CONFIG.availableKeys;
    antennaGame.requiredKey = keys[Math.floor(Math.random() * keys.length)];

    const cursor = document.getElementById('player-cursor');
    if (cursor) {
        cursor.classList.add('in-zone');
        const label = antennaGame.requiredKey === 'Space' ? 'SPACE'
                    : antennaGame.requiredKey === 'Control' ? 'CTRL'
                    : 'SHIFT';
        cursor.textContent = label;
    }

    // Запускаем таймер на 3 секунды
    antennaGame.keyTimeLeft = 3000;
    const startTime = Date.now();

    antennaGame.keyTimerInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        if (elapsed >= 3000) {
            clearInterval(antennaGame.keyTimerInterval);
            antennaGame.keyTimerInterval = null;
            // Не нажал — оглушение
            if (antennaGame.inTargetZone) {
                exitTargetZone();
                stunCursor();
            }
        }
    }, 100);
}

function exitTargetZone() {
    antennaGame.inTargetZone = false;
    antennaGame.requiredKey = null;
    if (antennaGame.keyTimerInterval) {
        clearInterval(antennaGame.keyTimerInterval);
        antennaGame.keyTimerInterval = null;
    }
    const cursor = document.getElementById('player-cursor');
    if (cursor) {
        cursor.classList.remove('in-zone');
        cursor.textContent = '';
    }
}

function wrongKeyPenalty() {
    // Выходим из зоны
    exitTargetZone();
    
    // Вспышка экрана
    flashRedScreen();
    
    // Выталкиваем курсор из целевой зоны
    const dx = antennaGame.cursorX - antennaGame.targetX;
    const dy = antennaGame.cursorY - antennaGame.targetY;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    
    // Выталкиваем за пределы радиуса цели + запас
    const pushDistance = antennaGame.targetRadius + 50;
    antennaGame.cursorX = antennaGame.targetX + (dx / dist) * pushDistance;
    antennaGame.cursorY = antennaGame.targetY + (dy / dist) * pushDistance;
    
    // ПРОВЕРЯЕМ ПРЕПЯТСТВИЯ — если попали внутрь, ищем свободное место
    let attempts = 0;
    while (collidesWithObstacle(antennaGame.cursorX, antennaGame.cursorY) && attempts < 10) {
        // Случайное направление
        const angle = Math.random() * Math.PI * 2;
        antennaGame.cursorX = antennaGame.targetX + Math.cos(angle) * (pushDistance + 20);
        antennaGame.cursorY = antennaGame.targetY + Math.sin(angle) * (pushDistance + 20);
        attempts++;
    }
    
    // Ограничиваем границами поля
    antennaGame.cursorX = Math.max(11, Math.min(antennaGame.fieldWidth - 11, antennaGame.cursorX));
    antennaGame.cursorY = Math.max(11, Math.min(antennaGame.fieldHeight - 11, antennaGame.cursorY));
    
    updateCursorPosition();

    // Задаем скорость для продолжения отталкивания
    const pushStrength = 12;
    antennaGame.velocityX = (dx / dist) * pushStrength;
    antennaGame.velocityY = (dy / dist) * pushStrength;
    
    // Блокируем управление на короткое время
    antennaGame.keys = { up: false, down: false, left: false, right: false };
}

function completeTarget() {
    if (antennaGame.keyTimerInterval) {
        clearInterval(antennaGame.keyTimerInterval);
        antennaGame.keyTimerInterval = null;
    }
    antennaGame.inTargetZone = false;
    antennaGame.requiredKey = null;

    const cursor = document.getElementById('player-cursor');
    if (cursor) {
        cursor.classList.remove('in-zone');
        cursor.textContent = '';
    }

    // Никакого выталкивания — курсор остаётся на месте
    antennaGame.currentTarget++;
    const goalLabel = document.getElementById('current-goal');
    if (goalLabel) goalLabel.textContent = Math.min(antennaGame.currentTarget + 1, 3);

    if (antennaGame.currentTarget >= 3) {
        antennaVictory();
    } else {
        spawnTarget(antennaGame.currentTarget);
    }
}

function startAntennaTimer() {
    updateAntennaTimerDisplay();
    antennaGame.timerInterval = setInterval(() => {
        antennaGame.timeLeft--;
        updateAntennaTimerDisplay();
        if (antennaGame.timeLeft <= 10) {
            const t = document.querySelector('.antenna-timer');
            if (t) t.classList.add('warning');
        }
        if (antennaGame.timeLeft <= 0) {
            clearInterval(antennaGame.timerInterval);
            antennaTimeout();
        }
    }, 1000);
}

function updateAntennaTimerDisplay() {
    const span = document.getElementById('antenna-timer');
    if (!span) return;
    const s = Math.max(0, antennaGame.timeLeft);
    span.textContent = '00:' + String(s).padStart(2, '0');
}

function antennaTimeout() {
    flashRedScreen();
    antennaFinalLoss();
}


function flashRedScreen() {
    const flash = document.createElement('div');
    flash.id = 'red-flash';
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 600);
}

function stopAntennaGame() {
    if (antennaGame.keyHandler) {
        document.removeEventListener('keydown', antennaGame.keyHandler);
        antennaGame.keyHandler = null;
    }
    if (antennaGame.keyUpHandler) {
        document.removeEventListener('keyup', antennaGame.keyUpHandler);
        antennaGame.keyUpHandler = null;
    }
    if (antennaGame.timerInterval) {
        clearInterval(antennaGame.timerInterval);
        antennaGame.timerInterval = null;
    }
    if (antennaGame.keyTimerInterval) {
        clearInterval(antennaGame.keyTimerInterval);
        antennaGame.keyTimerInterval = null;
    }
    if (antennaGame.gameLoopId) {
        cancelAnimationFrame(antennaGame.gameLoopId);
        antennaGame.gameLoopId = null;
    }
}

function antennaVictory() {
    stopAntennaGame();
    stopBreathingAudio();

    const module = document.getElementById('antenna-module');
    if (!module) return;

    const msg = document.createElement('div');
    msg.id = 'antenna-victory';
    msg.textContent = 'КОНТУР ВОССТАНОВЛЕН';
    module.appendChild(msg);

    setTimeout(() => {
        module.style.transition = 'opacity 1.5s ease';
        module.style.opacity = '0';
        setTimeout(() => {
            module.remove();
            renderScene('quiet_moment');
        }, 1500);
    }, 2500);
}

function antennaFinalLoss() {
    stopAntennaGame();
    stopBreathingAudio();

    const module = document.getElementById('antenna-module');
    if (!module) return;

    const msg = document.createElement('div');
    msg.id = 'antenna-fail';
    msg.textContent = 'КОНТУР СГОРЕЛ';
    module.appendChild(msg);

    setTimeout(() => {
        module.style.transition = 'opacity 1.5s ease';
        module.style.opacity = '0';
        setTimeout(() => {
            module.remove();
            renderScene('quiet_moment');
        }, 1500);
    }, 3000);
}
