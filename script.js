// تنظیمات اولیه و متغیرهای حالت بازی
let score = 0;
let level = 1;
let bricksPlaced = 0;
const totalBricksNeeded = 50; // برای اتمام و ساخت کامل ساختمان

let gameActive = false;
let spawnInterval = null;
let activeBills = [];

// سیاست‌های سختی سیستم (چالشی که خواسته‌ بودید)
const difficultyConfig = {
    1: { speedMin: 1.0, speedMax: 1.8, spawnRate: 2000, randomGrid: false, negativeScore: 0 },
    2: { speedMin: 1.5, speedMax: 2.5, spawnRate: 1600, randomGrid: false, negativeScore: 0 },
    3: { speedMin: 2.0, speedMax: 3.5, spawnRate: 1300, randomGrid: true,  negativeScore: -1 },
    4: { speedMin: 2.8, speedMax: 4.5, spawnRate: 1000, randomGrid: true,  negativeScore: -2 },
    5: { speedMin: 3.5, speedMax: 6.0, spawnRate: 700,  randomGrid: true,  negativeScore: -4 } // لول آخر فوق سخت
};

// المان‌های DOM
const gridContainer = document.getElementById('grid-container');
const dropZone = document.getElementById('drop-zone');
const startBtn = document.getElementById('start-btn');
const overlay = document.getElementById('game-overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayDesc = document.getElementById('overlay-desc');
const overlayBtn = document.getElementById('overlay-btn');

const scoreVal = document.getElementById('score-val');
const levelVal = document.getElementById('level-val');
const bricksVal = document.getElementById('bricks-val');
const buildingVisual = document.getElementById('building-visual');

// مقداردهی اولیه دکمه‌ها
startBtn.addEventListener('click', () => toggleOverlay(false));
overlayBtn.addEventListener('click', startCurrentLevel);

// ساختن جدول ۹۰ سلولی بر اساس تنظیمات لول
function generateGrid() {
    gridContainer.innerHTML = '';
    let numbers = Array.from({length: 90}, (_, i) => i + 1);
    
    // اعمال سیاست رندوم سازی از لول ۳ به بعد
    const config = difficultyConfig[level] || difficultyConfig[5];
    if (config.randomGrid) {
        numbers.sort(() => Math.random() - 0.5);
    }

    numbers.forEach(num => {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.innerText = num;
        cell.dataset.number = num;
        gridContainer.appendChild(cell);
    });
}

function toggleOverlay(show, title = '', desc = '', btnText = '') {
    if (show) {
        overlayTitle.innerText = title;
        overlayDesc.innerText = desc;
        overlayBtn.innerText = btnText;
        overlay.style.display = 'flex';
    } else {
        overlay.style.display = 'none';
    }
}

// شروع سطح فعلی
function startCurrentLevel() {
    toggleOverlay(false);
    gameActive = true;
    generateGrid();
    
    levelVal.innerText = level;
    const config = difficultyConfig[level] || difficultyConfig[5];
    
    // پاکسازی آیتم‌های قدیمی
    activeBills.forEach(b => b.remove());
    activeBills = [];
    if(spawnInterval) clearInterval(spawnInterval);

    // شروع فرآیند بارش اسکناس‌ها
    spawnInterval = setInterval(spawnBill, config.spawnRate);
}

// ایجاد و مدیریت سقوط اسکناس
function spawnBill() {
    if (!gameActive) return;

    const config = difficultyConfig[level] || difficultyConfig[5];
    const bill = document.createElement('div');
    bill.className = 'bill';
    
    // انتخاب رندوم شماره اسکناس
    const billNumber = Math.floor(Math.random() * 90) + 1;
    bill.innerText = `$ ${billNumber}`;
    bill.dataset.number = billNumber;

    // موقعیت‌دهی افقی تصادفی
    const maxX = dropZone.clientWidth - 70;
    bill.style.left = Math.random() * maxX + 'px';
    bill.style.top = '0px';

    dropZone.appendChild(bill);
    activeBills.push(bill);

    // سرعت سقوط رندوم در محدوده لول فعلی
    const speed = Math.random() * (config.speedMax - config.speedMin) + config.speedMin;
    let currentTop = 0;

    // انیمیشن سقوط مکانیکی مستقل از CSS برای هندل راحت‌تر Drag
    function fall() {
        if (!gameActive || !bill.parentElement) return;
        
        // اگر کاربر در حال کشیدن اسکناس نبود، سقوط کند
        if (bill.dataset.dragging !== "true") {
            currentTop += speed;
            bill.style.top = currentTop + 'px';

            // برخورد با کف محدوده سقوط (سوختن اسکناس)
            if (currentTop >= dropZone.clientHeight - 35) {
                burnBill(bill);
                return;
            }
        }
        requestAnimationFrame(fall);
    }
    
    initDragEvents(bill);
    requestAnimationFrame(fall);
}

// مدیریت رویدادهای کشیدن و رها کردن (Mouse & Touch)
function initDragEvents(bill) {
    let isDragging = false;

    // رویداد شروع لمس/کلیک
    function startDrag(e) {
        isDragging = true;
        bill.dataset.dragging = "true";
        bill.style.zIndex = 1000;
    }

    // رویداد جابجایی
    function moveDrag(e) {
        if (!isDragging) return;
        
        let clientX = e.touches ? e.touches[0].clientX : e.clientX;
        let clientY = e.touches ? e.touches[0].clientY : e.clientY;
        
        const rect = dropZone.getBoundingClientRect();
        
        // محاسبه موقعیت دقیق نسبت به باکس بازی
        let x = clientX - rect.left - 32;
        let y = clientY - rect.top - 17;

        // محدودسازی حرکت در کل محدوده بازی (شامل جدول زیرین)
        bill.style.left = Math.max(0, Math.min(x, dropZone.clientWidth - 65)) + 'px';
        bill.style.top = y + 'px';
    }

    // رویداد رها کردن ماوس یا انگشت
    function endDrag(e) {
        if (!isDragging) return;
        isDragging = false;
        bill.dataset.dragging = "false";

        // پیدا کردن المان زیرین در لحظه رهاسازی
        const billRect = bill.getBoundingClientRect();
        bill.style.display = 'none'; // موقتاً پنهان برای پیدا کردن عنصر زیرین
        const elementUnder = document.elementFromPoint(billRect.left + 32, billRect.top + 17);
        bill.style.display = 'flex';

        // بررسی اینکه آیا روی سلول درستی رها شده یا خیر
        if (elementUnder && elementUnder.classList.contains('cell')) {
            const targetNum = elementUnder.dataset.number;
            const billNum = bill.dataset.number;

            if (targetNum === billNum) {
                // قرارگیری در جای درست
                successMatch(elementUnder, bill);
            } else {
                // قرارگیری در شماره اشتباه
                wrongMatch(bill);
            }
        } else {
            bill.style.zIndex = 10;
        }
    }

    // اتصال به دسکتاپ و موبایل
    bill.addEventListener('mousedown', startDrag);
    window.addEventListener('mousemove', moveDrag);
    window.addEventListener('mouseup', endDrag);

    bill.addEventListener('touchstart', startDrag, {passive: true});
    window.addEventListener('touchmove', moveDrag, {passive: false});
    window.addEventListener('touchend', endDrag);
}

// انطباق درست اسکناس
function successMatch(cell, bill) {
    score += 1;
    bricksPlaced += 1;
    
    // آپدیت UI اطلاعات
    scoreVal.innerText = score;
    bricksVal.innerText = `${bricksPlaced}/${totalBricksNeeded}`;

    // اضافه کردن آجر به ساختمان بصری
    const brick = document.createElement('div');
    brick.className = 'brick';
    buildingVisual.appendChild(brick);

    // افکت سبز شدن سلول جدول
    cell.classList.add('highlight-correct');
    setTimeout(() => cell.classList.remove('highlight-correct'), 800);

    // حذف اسکناس
    removeBillReferences(bill);

    // چک کردن شرط برنده شدن مرحله یا کل بازی
    checkGameStatus();
}

// رها کردن روی شماره اشتباه
function wrongMatch(bill) {
    const config = difficultyConfig[level] || difficultyConfig[5];
    
    // اعمال نمره منفی لول‌های بالا
    score += config.negativeScore;
    if(score < 0) score = 0;
    scoreVal.innerText = score;

    // پودر شدن آجر ساختمان در صورت وجود نمره منفی و داشتن آجر
    if (config.negativeScore < 0 && bricksPlaced > 0) {
        bricksPlaced -= 1;
        bricksVal.innerText = `${bricksPlaced}/${totalBricksNeeded}`;
        const lastBrick = buildingVisual.lastElementChild;
        if(lastBrick) lastBrick.remove();
    }

    burnBill(bill);
}

// سوختن اسکناس (افتادن زمین یا رها شدن در جای غلط)
function burnBill(bill) {
    bill.style.background = 'linear-gradient(135deg, #7f1d1d, #dc2626)'; // قرمز شدن
    bill.style.transform = 'scale(0.8)';
    bill.style.opacity = '0';
    bill.style.transition = 'all 0.4s';
    
    setTimeout(() => {
        removeBillReferences(bill);
    }, 400);
}

function removeBillReferences(bill) {
    if(bill.parentElement) bill.remove();
    activeBills = activeBills.filter(b => b !== bill);
}

// سیستم بررسی وضعیت برد و باخت و تعویض لول مکانیزه چالش‌ها
function checkGameStatus() {
    if (bricksPlaced >= totalBricksNeeded) {
        // پایان کامل بازی و ساخت ساختمان
        endGame(true);
    } else if (bricksPlaced > 0 && bricksPlaced % 10 === 0) {
        // صعود به لول بالاتر به ازای هر ۱۰ آجر
        goToNextLevel();
    }
}

function goToNextLevel() {
    gameActive = false;
    clearInterval(spawnInterval);
    level += 1;
    
    toggleOverlay(
        true, 
        `مرحله ${level - 1} با موفقیت تمام شد!`, 
        `ساختمان شما بزرگتر شده است. آمادگی چالش سخت‌تر را دارید؟ سرعت و پاشش اسکناس افزایش یافته است!`, 
        `شروع مرحله ${level}`
    );
}

function endGame(isWin) {
    gameActive = false;
    clearInterval(spawnInterval);
    
    if (isWin) {
        toggleOverlay(
            true, 
            "🎉 تبریک! ساختمان کامل شد 🎉", 
            `شما موفق شدید آخرین آجر را بگذارید. مجموع توکن‌های شما: ${score} XZOT. اکنون می‌توانید پاداش خود را نقد کنید!`, 
            "شروع مجدد بازی"
        );
    }
    // ریست متغیرها برای بازی مجدد
    level = 1;
    score = 0;
    bricksPlaced = 0;
    scoreVal.innerText = '0';
    bricksVal.innerText = `0/${totalBricksNeeded}`;
    buildingVisual.innerHTML = '';
}
