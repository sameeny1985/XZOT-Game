// ====================================
// MONEY BUILDER GAME
// PART 1
// ====================================

const gridContainer =
document.getElementById("grid-container");

const fallingArea =
document.getElementById("falling-area");

const buildingDiv =
document.getElementById("building");

const scoreSpan =
document.getElementById("score");

const coinsSpan =
document.getElementById("coins");

const levelSpan =
document.getElementById("level");

const bricksSpan =
document.getElementById("bricks");

const startBtn =
document.getElementById("startBtn");


// ------------------------------------
// GAME STATE
// ------------------------------------

let score = 0;

let coins = 0;

let level = 1;

let bricks = 0;

let gameRunning = false;

let currentNumbers = [];

let activeBills = [];

let spawnInterval = null;

let levelTimer = null;


// ------------------------------------
// SETTINGS
// ------------------------------------

const TOTAL_CELLS = 90;

const LEVEL_DURATION = 30000;

const BASE_FALL_SPEED = 1;

const BUILDING_TARGET = 500;


// ------------------------------------
// CREATE GRID
// ------------------------------------

function createGrid()
{
    gridContainer.innerHTML = "";

    currentNumbers = [];

    for(let i = 1; i <= TOTAL_CELLS; i++)
    {
        currentNumbers.push(i);
    }

    currentNumbers.forEach(num =>
    {
        const cell =
        document.createElement("div");

        cell.classList.add("cell");

        cell.dataset.number = num;

        cell.innerText = num;

        gridContainer.appendChild(cell);
    });
}


// ------------------------------------
// SHUFFLE ARRAY
// ------------------------------------

function shuffleArray(arr)
{
    for(let i = arr.length - 1; i > 0; i--)
    {
        const j =
        Math.floor(Math.random() * (i + 1));

        [arr[i], arr[j]]
        =
        [arr[j], arr[i]];
    }

    return arr;
}


// ------------------------------------
// RANDOM GRID
// ------------------------------------

function randomizeGrid()
{
    gridContainer.innerHTML = "";

    let nums = [];

    for(let i = 1; i <= TOTAL_CELLS; i++)
    {
        nums.push(i);
    }

    shuffleArray(nums);

    nums.forEach(num =>
    {
        const cell =
        document.createElement("div");

        cell.classList.add("cell");

        cell.dataset.number = num;

        cell.innerText = num;

        gridContainer.appendChild(cell);
    });
}


// ------------------------------------
// UPDATE UI
// ------------------------------------

function updateUI()
{
    scoreSpan.innerText = score;

    coinsSpan.innerText = coins;

    levelSpan.innerText = level;

    bricksSpan.innerText = bricks;
}


// ------------------------------------
// ADD BRICK
// ------------------------------------

function addBrick()
{
    bricks++;

    const brick =
    document.createElement("div");

    brick.classList.add("brick");

    buildingDiv.appendChild(brick);

    updateUI();
}


// ------------------------------------
// REMOVE BRICK
// ------------------------------------

function removeBrick()
{
    if(bricks <= 0)
    {
        return;
    }

    bricks--;

    const allBricks =
    buildingDiv.querySelectorAll(".brick");

    if(allBricks.length > 0)
    {
        allBricks[
            allBricks.length - 1
        ].remove();
    }

    updateUI();
}


// ------------------------------------
// WIN CHECK
// ------------------------------------

function checkWin()
{
    if(bricks >= BUILDING_TARGET)
    {
        alert(
            "Congratulations! Building Completed!"
        );

        gameRunning = false;

        clearInterval(spawnInterval);

        clearInterval(levelTimer);
    }
}


// ------------------------------------
// START BUTTON
// ------------------------------------

startBtn.addEventListener(
    "click",
    () =>
    {
        if(gameRunning)
        {
            return;
        }

        startGame();
    }
);


// ------------------------------------
// INIT
// ------------------------------------

createGrid();

updateUI();
// ====================================
// PART 2
// BILL SPAWNER
// ====================================


// ------------------------------------
// CREATE BILL
// ------------------------------------

function createBill()
{
    if(!gameRunning)
    {
        return;
    }

    const bill =
    document.createElement("div");

    bill.classList.add("bill");

    const billNumber =
    Math.floor(Math.random() * 90) + 1;

    bill.dataset.number =
    billNumber;

    bill.innerHTML =
    `
    <div class="money-icon">💵</div>
    <div class="money-number">
        ${billNumber}
    </div>
    `;

    const maxWidth =
    fallingArea.clientWidth - 120;

    const leftPos =
    Math.random() * maxWidth;

    bill.style.left =
    leftPos + "px";

    bill.style.top = "-100px";

    fallingArea.appendChild(bill);

    activeBills.push(bill);

    enableDragging(bill);

    startFalling(bill);
}



// ------------------------------------
// FALL LOGIC
// ------------------------------------

function startFalling(bill)
{
    let posY = -100;

    let speed =
    BASE_FALL_SPEED +
    (level * 0.25);

    if(level > 20)
    {
        speed += 1;
    }

    if(level > 40)
    {
        speed += 1.5;
    }

    if(level > 60)
    {
        speed += 2;
    }

    const fallTimer =
    setInterval(() =>
    {
        if(!gameRunning)
        {
            clearInterval(fallTimer);
            return;
        }

        if(!document.body.contains(bill))
        {
            clearInterval(fallTimer);
            return;
        }

        posY += speed;

        bill.style.top =
        posY + "px";

        const areaHeight =
        fallingArea.clientHeight;

        if(posY > areaHeight)
        {
            clearInterval(fallTimer);

            bill.remove();

            loseBill();
        }

    }, 16);
}



// ------------------------------------
// MISS BILL
// ------------------------------------

function loseBill()
{
    if(level >= 10)
    {
        score -= 1;
    }

    if(level >= 20)
    {
        score -= 2;
    }

    if(level >= 40)
    {
        score -= 5;
    }

    if(score < 0)
    {
        score = 0;
    }

    updateUI();
}



// ------------------------------------
// SPAWN RATE
// ------------------------------------

function getSpawnRate()
{
    if(level <= 5)
    {
        return 2500;
    }

    if(level <= 10)
    {
        return 1800;
    }

    if(level <= 20)
    {
        return 1300;
    }

    if(level <= 40)
    {
        return 900;
    }

    if(level <= 60)
    {
        return 700;
    }

    return 500;
}



// ------------------------------------
// START SPAWNER
// ------------------------------------

function startSpawner()
{
    if(spawnInterval)
    {
        clearInterval(spawnInterval);
    }

    spawnInterval =
    setInterval(() =>
    {
        createBill();

        if(level > 20)
        {
            if(Math.random() < 0.35)
            {
                createBill();
            }
        }

        if(level > 50)
        {
            if(Math.random() < 0.50)
            {
                createBill();
            }
        }

    }, getSpawnRate());
}



// ------------------------------------
// START GAME
// ------------------------------------

function startGame()
{
    gameRunning = true;

    score = 0;

    coins = 0;

    level = 1;

    bricks = 0;

    buildingDiv.innerHTML = "";

    updateUI();

    createGrid();

    startSpawner();

    startLevelSystem();
}// ====================================
// PART 2
// BILL SPAWNER
// ====================================


// ------------------------------------
// CREATE BILL
// ------------------------------------

function createBill()
{
    if(!gameRunning)
    {
        return;
    }

    const bill =
    document.createElement("div");

    bill.classList.add("bill");

    const billNumber =
    Math.floor(Math.random() * 90) + 1;

    bill.dataset.number =
    billNumber;

    bill.innerHTML =
    `
    <div class="money-icon">💵</div>
    <div class="money-number">
        ${billNumber}
    </div>
    `;

    const maxWidth =
    fallingArea.clientWidth - 120;

    const leftPos =
    Math.random() * maxWidth;

    bill.style.left =
    leftPos + "px";

    bill.style.top = "-100px";

    fallingArea.appendChild(bill);

    activeBills.push(bill);

    enableDragging(bill);

    startFalling(bill);
}



// ------------------------------------
// FALL LOGIC
// ------------------------------------

function startFalling(bill)
{
    let posY = -100;

    let speed =
    BASE_FALL_SPEED +
    (level * 0.25);

    if(level > 20)
    {
        speed += 1;
    }

    if(level > 40)
    {
        speed += 1.5;
    }

    if(level > 60)
    {
        speed += 2;
    }

    const fallTimer =
    setInterval(() =>
    {
        if(!gameRunning)
        {
            clearInterval(fallTimer);
            return;
        }

        if(!document.body.contains(bill))
        {
            clearInterval(fallTimer);
            return;
        }

        posY += speed;

        bill.style.top =
        posY + "px";

        const areaHeight =
        fallingArea.clientHeight;

        if(posY > areaHeight)
        {
            clearInterval(fallTimer);

            bill.remove();

            loseBill();
        }

    }, 16);
}



// ------------------------------------
// MISS BILL
// ------------------------------------

function loseBill()
{
    if(level >= 10)
    {
        score -= 1;
    }

    if(level >= 20)
    {
        score -= 2;
    }

    if(level >= 40)
    {
        score -= 5;
    }

    if(score < 0)
    {
        score = 0;
    }

    updateUI();
}



// ------------------------------------
// SPAWN RATE
// ------------------------------------

function getSpawnRate()
{
    if(level <= 5)
    {
        return 2500;
    }

    if(level <= 10)
    {
        return 1800;
    }

    if(level <= 20)
    {
        return 1300;
    }

    if(level <= 40)
    {
        return 900;
    }

    if(level <= 60)
    {
        return 700;
    }

    return 500;
}



// ------------------------------------
// START SPAWNER
// ------------------------------------

function startSpawner()
{
    if(spawnInterval)
    {
        clearInterval(spawnInterval);
    }

    spawnInterval =
    setInterval(() =>
    {
        createBill();

        if(level > 20)
        {
            if(Math.random() < 0.35)
            {
                createBill();
            }
        }

        if(level > 50)
        {
            if(Math.random() < 0.50)
            {
                createBill();
            }
        }

    }, getSpawnRate());
}



// ------------------------------------
// START GAME
// ------------------------------------

function startGame()
{
    gameRunning = true;

    score = 0;

    coins = 0;

    level = 1;

    bricks = 0;

    buildingDiv.innerHTML = "";

    updateUI();

    createGrid();

    startSpawner();

    startLevelSystem();
}
// ====================================
// PART 3
// DRAG & DROP SYSTEM
// ====================================

let draggedBill = null;


// ------------------------------------
// ENABLE DRAGGING
// ------------------------------------

function enableDragging(bill)
{
    bill.draggable = true;

    bill.addEventListener(
        "dragstart",
        (e) =>
        {
            draggedBill = bill;

            setTimeout(() =>
            {
                bill.style.opacity = "0.5";
            }, 0);
        }
    );

    bill.addEventListener(
        "dragend",
        () =>
        {
            bill.style.opacity = "1";

            draggedBill = null;
        }
    );
}



// ------------------------------------
// GRID EVENTS
// ------------------------------------

gridContainer.addEventListener(
    "dragover",
    (e) =>
    {
        e.preventDefault();
    }
);


gridContainer.addEventListener(
    "drop",
    (e) =>
    {
        e.preventDefault();

        const cell =
        e.target.closest(".cell");

        if(!cell)
        {
            return;
        }

        if(!draggedBill)
        {
            return;
        }

        handleDrop(
            draggedBill,
            cell
        );
    }
);



// ------------------------------------
// DROP LOGIC
// ------------------------------------

function handleDrop(
    bill,
    cell
)
{
    const billNumber =
    parseInt(
        bill.dataset.number
    );

    const cellNumber =
    parseInt(
        cell.dataset.number
    );

    if(billNumber === cellNumber)
    {
        correctAnswer(
            bill,
            cell
        );
    }
    else
    {
        wrongAnswer(
            bill,
            cell
        );
    }
}



// ------------------------------------
// CORRECT
// ------------------------------------

function correctAnswer(
    bill,
    cell
)
{
    score += 1;

    coins += 1;

    cell.classList.add(
        "cell-correct"
    );

    setTimeout(() =>
    {
        cell.classList.remove(
            "cell-correct"
        );
    }, 1000);

    bill.remove();

    addBrick();

    updateUI();

    checkWin();

    saveProgress();
}



// ------------------------------------
// WRONG
// ------------------------------------

function wrongAnswer(
    bill,
    cell
)
{
    bill.classList.add(
        "bill-burn"
    );

    if(level >= 5)
    {
        score -= 1;
    }

    if(level >= 15)
    {
        score -= 2;
    }

    if(level >= 30)
    {
        score -= 5;
    }

    if(level >= 50)
    {
        score -= 10;
    }

    if(score < 0)
    {
        score = 0;
    }

    removeBrick();

    updateUI();

    setTimeout(() =>
    {
        bill.remove();
    }, 600);

    saveProgress();
}



// ------------------------------------
// REMOVE BILL FROM ARRAY
// ------------------------------------

function cleanupBills()
{
    activeBills =
    activeBills.filter(
        bill =>
        document.body.contains(bill)
    );
}



setInterval(
    cleanupBills,
    5000
);



// ------------------------------------
// SCORE EFFECT
// ------------------------------------

function floatingText(
    text,
    x,
    y
)
{
    const fx =
    document.createElement("div");

    fx.classList.add(
        "floating-text"
    );

    fx.innerText = text;

    fx.style.left =
    x + "px";

    fx.style.top =
    y + "px";

    document.body.appendChild(fx);

    setTimeout(() =>
    {
        fx.remove();
    }, 1500);
}// ====================================
// PART 3
// DRAG & DROP SYSTEM
// ====================================

let draggedBill = null;


// ------------------------------------
// ENABLE DRAGGING
// ------------------------------------

function enableDragging(bill)
{
    bill.draggable = true;

    bill.addEventListener(
        "dragstart",
        (e) =>
        {
            draggedBill = bill;

            setTimeout(() =>
            {
                bill.style.opacity = "0.5";
            }, 0);
        }
    );

    bill.addEventListener(
        "dragend",
        () =>
        {
            bill.style.opacity = "1";

            draggedBill = null;
        }
    );
}



// ------------------------------------
// GRID EVENTS
// ------------------------------------

gridContainer.addEventListener(
    "dragover",
    (e) =>
    {
        e.preventDefault();
    }
);


gridContainer.addEventListener(
    "drop",
    (e) =>
    {
        e.preventDefault();

        const cell =
        e.target.closest(".cell");

        if(!cell)
        {
            return;
        }

        if(!draggedBill)
        {
            return;
        }

        handleDrop(
            draggedBill,
            cell
        );
    }
);



// ------------------------------------
// DROP LOGIC
// ------------------------------------

function handleDrop(
    bill,
    cell
)
{
    const billNumber =
    parseInt(
        bill.dataset.number
    );

    const cellNumber =
    parseInt(
        cell.dataset.number
    );

    if(billNumber === cellNumber)
    {
        correctAnswer(
            bill,
            cell
        );
    }
    else
    {
        wrongAnswer(
            bill,
            cell
        );
    }
}



// ------------------------------------
// CORRECT
// ------------------------------------

function correctAnswer(
    bill,
    cell
)
{
    score += 1;

    coins += 1;

    cell.classList.add(
        "cell-correct"
    );

    setTimeout(() =>
    {
        cell.classList.remove(
            "cell-correct"
        );
    }, 1000);

    bill.remove();

    addBrick();

    updateUI();

    checkWin();

    saveProgress();
}



// ------------------------------------
// WRONG
// ------------------------------------

function wrongAnswer(
    bill,
    cell
)
{
    bill.classList.add(
        "bill-burn"
    );

    if(level >= 5)
    {
        score -= 1;
    }

    if(level >= 15)
    {
        score -= 2;
    }

    if(level >= 30)
    {
        score -= 5;
    }

    if(level >= 50)
    {
        score -= 10;
    }

    if(score < 0)
    {
        score = 0;
    }

    removeBrick();

    updateUI();

    setTimeout(() =>
    {
        bill.remove();
    }, 600);

    saveProgress();
}



// ------------------------------------
// REMOVE BILL FROM ARRAY
// ------------------------------------

function cleanupBills()
{
    activeBills =
    activeBills.filter(
        bill =>
        document.body.contains(bill)
    );
}



setInterval(
    cleanupBills,
    5000
);



// ------------------------------------
// SCORE EFFECT
// ------------------------------------

function floatingText(
    text,
    x,
    y
)
{
    const fx =
    document.createElement("div");

    fx.classList.add(
        "floating-text"
    );

    fx.innerText = text;

    fx.style.left =
    x + "px";

    fx.style.top =
    y + "px";

    document.body.appendChild(fx);

    setTimeout(() =>
    {
        fx.remove();
    }, 1500);
}
// ====================================
// PART 4
// LEVEL SYSTEM + SAVE API
// ====================================


// ------------------------------------
// LEVEL SYSTEM
// ------------------------------------

function startLevelSystem()
{
    if(levelTimer)
    {
        clearInterval(levelTimer);
    }

    levelTimer =
    setInterval(() =>
    {
        nextLevel();

    }, LEVEL_DURATION);
}



// ------------------------------------
// NEXT LEVEL
// ------------------------------------

function nextLevel()
{
    level++;

    updateUI();

    if(level >= 5)
    {
        randomizeGrid();
    }

    restartSpawner();
}



// ------------------------------------
// RESTART SPAWNER
// ------------------------------------

function restartSpawner()
{
    if(spawnInterval)
    {
        clearInterval(
            spawnInterval
        );
    }

    startSpawner();
}



// ------------------------------------
// BUILDING HEIGHT BONUS
// ------------------------------------

function calculateBuildingStage()
{
    if(bricks < 50)
    {
        return 1;
    }

    if(bricks < 100)
    {
        return 2;
    }

    if(bricks < 150)
    {
        return 3;
    }

    if(bricks < 250)
    {
        return 4;
    }

    if(bricks < 350)
    {
        return 5;
    }

    return 6;
}



// ------------------------------------
// UPDATE BUILDING STYLE
// ------------------------------------

function updateBuildingVisual()
{
    const stage =
    calculateBuildingStage();

    buildingDiv.className =
    "";

    buildingDiv.classList.add(
        "building-stage-" + stage
    );
}



setInterval(
    updateBuildingVisual,
    1000
);



// ------------------------------------
// SAVE PROGRESS
// ------------------------------------

async function saveProgress()
{
    try
    {
        await fetch(
            "/api/save_score",
            {
                method: "POST",

                headers:
                {
                    "Content-Type":
                    "application/json"
                },

                body: JSON.stringify(
                {
                    score: score,

                    coins: coins,

                    level: level,

                    bricks: bricks
                })
            }
        );
    }
    catch(error)
    {
        console.log(
            "save error",
            error
        );
    }
}



// ------------------------------------
// AUTO SAVE
// ------------------------------------

setInterval(
    () =>
    {
        if(gameRunning)
        {
            saveProgress();
        }
    },
    10000
);



// ------------------------------------
// PENALTY SYSTEM
// ------------------------------------

function applyLateGamePenalty()
{
    if(level < 20)
    {
        return;
    }

    let chance = 0;

    if(level >= 20)
    {
        chance = 0.10;
    }

    if(level >= 30)
    {
        chance = 0.15;
    }

    if(level >= 40)
    {
        chance = 0.20;
    }

    if(level >= 60)
    {
        chance = 0.25;
    }

    if(Math.random() < chance)
    {
        removeBrick();

        if(score > 0)
        {
            score--;
        }

        updateUI();
    }
}



setInterval(
    applyLateGamePenalty,
    8000
);



// ------------------------------------
// BUILDING COMPLETE
// ------------------------------------

function buildingCompleted()
{
    gameRunning = false;

    clearInterval(
        spawnInterval
    );

    clearInterval(
        levelTimer
    );

    saveProgress();

    alert(
        "Building completed! You won!"
    );
}



// ------------------------------------
// OVERRIDE WIN CHECK
// ------------------------------------

function checkWin()
{
    if(bricks >= BUILDING_TARGET)
    {
        buildingCompleted();
    }
}



// ------------------------------------
// DEBUG
// ------------------------------------

window.addEventListener(
    "keydown",
    (e) =>
    {
        if(e.key === "F8")
        {
            score += 100;

            coins += 50;

            bricks += 10;

            updateUI();
        }
    }
);
