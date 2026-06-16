const SUPABASE_URL = "const SUPABASE_URL = "https://bxjafedvimvdyrljnjut.supabase.co"; 
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4amFmZWR2aW12ZHlybGpuanV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1NTg5MTgsImV4cCI6MjA5NzEzNDkxOH0.3gtmQjEtNlA7t6S-S-ZJpcYqrgwJZaogw6zqh0YC5BY"; 
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let userSession = null;
let score = 0;
let level = 1;
let bricksPlaced = 0;
const totalBricksNeeded = 50;

let gameActive = false;
let spawnInterval = null;
let activeBills = [];

const difficultyConfig = {
    1: { speedMin: 1.0, speedMax: 1.6, spawnRate: 2200, randomGrid: false, negativeScore: 0 },
    2: { speedMin: 1.4, speedMax: 2.2, spawnRate: 1800, randomGrid: false, negativeScore: 0 },
    3: { speedMin: 2.0, speedMax: 3.2, spawnRate: 1400, randomGrid: true,  negativeScore: -1 },
    4: { speedMin: 2.6, speedMax: 4.2, spawnRate: 1000, randomGrid: true,  negativeScore: -2 },
    5: { speedMin: 3.5, speedMax: 5.5, spawnRate: 750,  randomGrid: true,  negativeScore: -4 }
};

const gridContainer = document.getElementById('grid-container');
const dropZone = document.getElementById('drop-zone');
const startBtn = document.getElementById('start-btn');
const overlay = document.getElementById('game-overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayDesc = document.getElementById('overlay-desc');
const overlayBtn = document.getElementById('overlay-btn');
const authBtn = document.getElementById('auth-btn');
const userEmailSpan = document.getElementById('user-email');

const scoreVal = document.getElementById('score-val');
const levelVal = document.getElementById('level-val');
const bricksVal = document.getElementById('bricks-val');
const buildingVisual = document.getElementById('building-visual');

generateGrid();

window.addEventListener('DOMContentLoaded', async () => {
    const { data } = await supabase.auth.getSession();
    userSession = data.session;
    updateAuthUI();

    supabase.auth.onAuthStateChange((event, session) => {
        userSession = session;
        updateAuthUI();
    });
});

authBtn.addEventListener('click', async () => {
    if (userSession) {
        await supabase.auth.signOut();
        location.reload();
    } else {
        const redirectUrl = window.location.origin + "/game";
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: redirectUrl }
        });
    }
});

async function updateAuthUI() {
    if (userSession) {
        userEmailSpan.innerText = `کاربر: ${userSession.user.email}`;
        authBtn.innerText = "خروج";
        startBtn.style.display = "block";
        await loadUserData();
    } else {
        userEmailSpan.innerText = "شما وارد حساب خود نشده‌اید";
        authBtn.innerText = "ورود با گوگل";
        startBtn.style.display = "none";
        toggleOverlay(true, "ورود الزامی است", "برای ذخیره توکن‌ها و وضعیت ساخت و ساز ساختمان خود، لطفاً با گوگل وارد شوید.", "ورود با گوگل");
    }
}

async function loadUserData() {
    const user = userSession.user;
    let { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (error && error.code === 'PGRST116') {
        const { data: newProfile } = await supabase
            .from('user_profiles')
            .insert([{ id: user.id, email: user.email }])
            .select()
            .single();
        data = newProfile;
    }

    if (data) {
        score = data.score;
        level = data.current_level;
        bricksPlaced = data.bricks_placed;
        
        scoreVal.innerText = score;
        levelVal.innerText = level;
        bricksVal.innerText = `${bricksPlaced}/${totalBricksNeeded}`;
        
        buildingVisual.innerHTML = '';
        for(let i=0; i < bricksPlaced; i++) {
            const brick = document.createElement('div');
            brick.className = 'brick';
            buildingVisual.appendChild(brick);
        }
        
        generateGrid();
        toggleOverlay(false);
    }
}

async function saveUserData() {
    if (!userSession) return;
    await supabase
        .from('user_profiles')
        .update({
            score: score,
            bricks_placed: bricksPlaced,
            current_level: level,
            updated_at: new Date()
        })
        .eq('id', userSession.user.id);
}

startBtn.addEventListener('click', () => {
    if(!userSession) return;
    toggleOverlay(false);
    startCurrentLevel();
});

overlayBtn.addEventListener('click', () => {
    if (!userSession) {
        authBtn.click();
    } else {
        startCurrentLevel();
    }
});

function generateGrid() {
    if (!gridContainer) return;
    gridContainer.innerHTML = '';
    let numbers = Array.from({length: 90}, (_, i) => i + 1);
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

function startCurrentLevel() {
    if(!userSession) return;
    toggleOverlay(false);
    gameActive = true;
    generateGrid();
    
    levelVal.innerText = level;
    const config = difficultyConfig[level] || difficultyConfig[5];
    
    activeBills.forEach(b => b.remove());
    activeBills = [];
    if(spawnInterval) clearInterval(spawnInterval);

    spawnInterval = setInterval(spawnBill, config.spawnRate);
}

function spawnBill() {
    if (!gameActive) return;

    const config = difficultyConfig[level] || difficultyConfig[5];
    const bill = document.createElement('div');
    bill.className = 'bill';
    
    const billNumber = Math.floor(Math.random() * 90) + 1;
    bill.innerText = `$ ${billNumber}`;
    bill.dataset.number = billNumber;

    const maxX = dropZone.clientWidth - 70;
    bill.style.left = Math.random() * maxX + 'px';
    bill.style.top = '0px';

    dropZone.appendChild(bill);
    activeBills.push(bill);

    const speed = Math.random() * (config.speedMax - config.speedMin) + config.speedMin;
    let currentTop = 0;

    function fall() {
        if (!gameActive || !bill.parentElement) return;
        
        if (bill.dataset.dragging !== "true") {
            currentTop += speed;
            bill.style.top = currentTop + 'px';

            if (currentTop >= dropZone.clientHeight - 35) {
                handleDropFailure(bill);
                return;
            }
        }
        requestAnimationFrame(fall);
    }
    
    initDragEvents(bill);
    requestAnimationFrame(fall);
}

function initDragEvents(bill) {
    let isDragging = false;

    function startDrag(e) {
        isDragging = true;
        bill.dataset.dragging = "true";
        bill.style.zIndex = 1000;
    }

    function moveDrag(e) {
        if (!isDragging) return;
        let clientX = e.touches ? e.touches[0].clientX : e.clientX;
        let clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const rect = dropZone.getBoundingClientRect();
        let x = clientX - rect.left - 32;
        let y = clientY - rect.top - 17;

        bill.style.left = Math.max(0, Math.min(x, dropZone.clientWidth - 65)) + 'px';
        bill.style.top = y + 'px';
    }

    function endDrag(e) {
        if (!isDragging) return;
        isDragging = false;
        bill.dataset.dragging = "false";

        const billRect = bill.getBoundingClientRect();
        bill.style.display = 'none';
        const elementUnder = document.elementFromPoint(billRect.left + 32, billRect.top + 17);
        bill.style.display = 'flex';

        if (elementUnder && elementUnder.classList.contains('cell')) {
            const targetNum = elementUnder.dataset.number;
            const billNum = bill.dataset.number;

            if (targetNum === billNum) {
                successMatch(elementUnder, bill);
            } else {
                wrongMatch(bill);
            }
        } else {
            bill.style.zIndex = 10;
        }
    }

    bill.addEventListener('mousedown', startDrag);
    window.addEventListener('mousemove', moveDrag);
    window.addEventListener('mouseup', endDrag);

    bill.addEventListener('touchstart', startDrag, {passive: true});
    window.addEventListener('touchmove', moveDrag, {passive: false});
    window.addEventListener('touchend', endDrag);
}

function successMatch(cell, bill) {
    score += 1;
    bricksPlaced += 1;
    
    scoreVal.innerText = score;
    bricksVal.innerText = `${bricksPlaced}/${totalBricksNeeded}`;

    const brick = document.createElement('div');
    brick.className = 'brick';
    buildingVisual.appendChild(brick);

    cell.classList.add('highlight-correct');
    setTimeout(() => cell.classList.remove('highlight-correct'), 800);

    removeBillReferences(bill);
    saveUserData();
    checkGameStatus();
}

function wrongMatch(bill) {
    applyPenalty();
    burnBill(bill);
}

function handleDropFailure(bill) {
    applyPenalty();
    burnBill(bill);
}

function applyPenalty() {
    const config = difficultyConfig[level] || difficultyConfig[5];
    score += config.negativeScore;
    if(score < 0) score = 0;
    scoreVal.innerText = score;

    if (config.negativeScore < 0 && bricksPlaced > 0) {
        bricksPlaced -= 1;
        bricksVal.innerText = `${bricksPlaced}/${totalBricksNeeded}`;
        const lastBrick = buildingVisual.lastElementChild;
        if(lastBrick) lastBrick.remove();
    }
    saveUserData();
}

function burnBill(bill) {
    bill.style.background = 'linear-gradient(135deg, #7f1d1d, #dc2626)';
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

function checkGameStatus() {
    if (bricksPlaced >= totalBricksNeeded) {
        endGame(true);
    } else if (bricksPlaced > 0 && bricksPlaced % 10 === 0) {
        goToNextLevel();
    }
}

function goToNextLevel() {
    gameActive = false;
    clearInterval(spawnInterval);
    level += 1;
    saveUserData();
    
    toggleOverlay(
        true, 
        `مرحله ${level - 1} با موفقیت تمام شد!`, 
        `ساختمان شما بزرگتر شده است. سرعت و ریزش اسکناس افزایش یافت و چالش سخت‌تر شد!`, 
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
            `شما موفق شدید آخرین آجر را بگذارید. مجموع توکن‌های شما در دیتابیس ذخیره شد: ${score} XZOT.`, 
            "شروع مجدد بازی"
        );
    }
    level = 1;
    score = 0;
    bricksPlaced = 0;
    saveUserData();
    
    scoreVal.innerText = '0';
    bricksVal.innerText = `0/${totalBricksNeeded}`;
    buildingVisual.innerHTML = '';
}
