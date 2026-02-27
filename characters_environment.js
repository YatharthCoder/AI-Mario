/*=================================
=            Variables            =
=================================*/

/* main character variables */
var mario, bricks, clouds, mountains, enemyMushrooms, pipes, platforms, coins;

/* Control variables */
var control = {
  up: "UP_ARROW",
  left: 'LEFT_ARROW',
  right: 'RIGHT_ARROW',
  revive: 32
}

// Inner game status
var gameConfig = {
  status: "start",       // start | play | paused | gameover
  initialLifes: 4,
  moveSpeed: 5,
  enemyMoveSpeed: 1.5,   // slightly faster enemies
  gravity: 1,
  gravityEnemy: 10,
  jump: -16,             // slightly higher jump
  startingPointX: 500,
  startingPointY: 0,
  screenX: 1240,
  screenY: 336,
  timeScores: 0,
  scores: 0,
  combo: 0,              // ✨ NEW: combo multiplier
  comboTimer: 0,         // ✨ NEW: combo timeout
  difficultyTimer: 0,    // ✨ NEW: ramp up difficulty over time
}

/*=====  End of Variables  ======*/

/*====================================
=            Game Status             =
====================================*/

noseX = ""
noseY = ""
gamestatus = ""

// ✨ Particle system for visual effects
var particles = [];

function startGame() {
  gamestatus = "start"
  document.getElementById("status").innerHTML = "Game Is Loading...";
}

function game() {
  instializeInDraw();
  moveEnvironment(mario);
  drawSprites();

  // ─── Update particles ───────────────────────────
  updateParticles();

  // ─── START SCREEN ──────────────────────────────
  if (gameConfig.status === 'start') {
    fill(0, 0, 0, 160);
    rect(0, 0, gameConfig.screenX, gameConfig.screenY);

    // Animated title
    var bounce = sin(frameCount * 0.08) * 8;
    fill(247, 201, 72);
    textSize(44);
    textAlign(CENTER);
    textStyle(BOLD);
    text("🍄 AI MARIO", gameConfig.screenX / 2, gameConfig.screenY / 2 - 40 + bounce);

    fill(255, 255, 255);
    textSize(16);
    textStyle(NORMAL);
    text("Show your face to the camera to start!", gameConfig.screenX / 2, gameConfig.screenY / 2 + 10);

    fill(200, 200, 200);
    textSize(12);
    text("Tilt head LEFT / RIGHT to move   •   Look UP to jump", gameConfig.screenX / 2, gameConfig.screenY / 2 + 40);

    stroke(255);
    strokeWeight(7);
    noFill();
    changeGameStatus();
  }

  // ─── PLAYING ───────────────────────────────────
  if (gameConfig.status === 'play') {
    positionOfCharacter(mario);
    enemys(enemyMushrooms);
    checkStatus(mario);
    scores(mario);
    manualControl(mario);
    updateDifficulty();
  }

  // ─── GAME OVER ─────────────────────────────────
  if (gameConfig.status === 'gameover') {
    fill(0, 0, 0, 160);
    rect(0, 0, gameConfig.screenX, gameConfig.screenY);

    // Pulsing GAME OVER
    var pulse = sin(frameCount * 0.1) * 0.15 + 1;
    fill(229, 34, 34);
    textSize(50 * pulse);
    textAlign(CENTER);
    text("GAME OVER", gameConfig.screenX / 2, gameConfig.screenY / 2 - 60);

    fill(247, 201, 72);
    textSize(30);
    text(round(gameConfig.scores) + " pts", gameConfig.screenX / 2, gameConfig.screenY / 2);

    fill(255, 255, 255);
    textSize(14);
    text("Press SPACE to restart", gameConfig.screenX / 2, gameConfig.screenY / 2 + 40);

    // Circular life indicator
    stroke(255);
    strokeWeight(5);
    noFill();
    ellipse(gameConfig.screenX / 2, gameConfig.screenY / 2 + 90, 120, 120)

    stroke("red");
    var ratio = (mario.liveNumber / gameConfig.initialLifes);
    arc(gameConfig.screenX / 2, gameConfig.screenY / 2 + 90, 120, 120, PI + HALF_PI, (PI + HALF_PI) + (TWO_PI * ratio));

    changeGameStatus(mario);
  }
}


function changeGameStatus(character) {
  if (noseX != "" && gameConfig.status === "start" && gamestatus == "start") {
    world_start.play();
    initializeCharacterStatus(mario);
    gameConfig.status = "play";
    gameConfig.scores = 0;
    gameConfig.timeScores = 0;
    particles = [];
  }
  if (gameConfig.status === "gameover" && keyDown(control.revive)) {
    gameConfig.status = "start";
    gameConfig.combo = 0;
    gameConfig.comboTimer = 0;
    gameConfig.difficultyTimer = 0;
    gameConfig.enemyMoveSpeed = 1.5;
  }
}

/*=====  End of Game Status   ======*/


/*=============================================
=                 Initialize                  =
=============================================*/

function instializeInSetup(character) {
  frameRate(60);  // ✨ 60fps is smoother than 120
  character.scale = 0.35;
  initializeCharacterStatus(character);

  bricks.displace(bricks);
  platforms.displace(platforms);
  coins.displace(coins);
  coins.displace(platforms);
  coins.collide(pipes);
  coins.displace(bricks);

  clouds.forEach(function (element) {
    element.scale = random(1, 2);
  })
}

function initializeCharacterStatus(character) {
  character.scale = 0.35;
  character["killing"] = 0;
  character["kills"] = 0;
  character["live"] = true;
  character["liveNumber"] = gameConfig.initialLifes;
  character["status"] = 'live';
  character["coins"] = 0;
  character["dying"] = 0;
  character["invincible"] = 0;   // ✨ NEW: brief invincibility after respawn
  character.position.x = gameConfig.startingPointX;
  character.position.y = gameConfig.startingPointY;
}

function instializeInDraw() {
  // Sky gradient background
  background(109, 143, 252);

  // ✨ Soft gradient at the bottom
  noStroke();
  for (var i = 0; i < 40; i++) {
    fill(80, 120, 200, 5);
    rect(0, gameConfig.screenY - i * 3, gameConfig.screenX, 3);
  }

  if (mario.killing > 0) {
    mario.killing -= 1;
  } else {
    mario.killing = 0;
  }

  // ✨ Tick invincibility down
  if (mario.invincible > 0) mario.invincible -= 1;

  // Collision logic
  pipes.displace(pipes);
  enemyMushrooms.displace(enemyMushrooms);
  enemyMushrooms.collide(pipes);
  clouds.displace(clouds);

  if (mario.live) {
    bricks.displace(mario);
    pipes.displace(mario);
    enemyMushrooms.displace(mario);
    platforms.displace(mario);
  }

  mario["standOnObj"] = false;
  mario.velocity.x = 0;
  mario.maxSpeed = 20;
}

/*=====  End of Initialize  ======*/


/*=============================================
=    ✨ Difficulty Ramp-Up                    =
=============================================*/

function updateDifficulty() {
  gameConfig.difficultyTimer += 1;

  // Every 10 seconds, speed up slightly
  if (gameConfig.difficultyTimer % 600 === 0) {
    gameConfig.enemyMoveSpeed = min(gameConfig.enemyMoveSpeed + 0.3, 5);
  }
}

/*=============================================
=            Interactive Elements            =
=============================================*/

function getCoins(coin, character) {
  if (character.overlap(coin) && character.live && coin.get == false) {
    character.coins += 1;
    coin.get = true;
    mario_coin.play();
    // ✨ Spawn coin particles
    spawnParticles(coin.position.x, coin.position.y, '#ffd700', 8);
  }
}

function coinVanish(coin) {
  if (coin.get) {
    coin.position.x = random(50, gameConfig.screenX) + gameConfig.screenX;
    coin.get = false;
  }
}

/*=====  End of Interactive Elements  ======*/


/*=============================================
=    Main character setting and control       =
=============================================*/

function positionOfCharacter(character) {
  if (character.live) {
    platforms.forEach(function (element) { standOnObjs(character, element); });
    bricks.forEach(function (element) { standOnObjs(character, element); });
    pipes.forEach(function (element) { standOnObjs(character, element); });
    falling(character);
    if (character.standOnObj) jumping(character);
  }

  coins.forEach(function (element) {
    getCoins(element, mario);
    coinVanish(element);
  });

  enemyMushrooms.forEach(function (element) {
    StepOnEnemy(character, element);
    // ✨ Only damage if not invincible
    if ((element.touching.left || element.touching.right) && character.live && character.killing === 0 && character.invincible === 0) {
      die(mario);
    }
  })

  dontGetOutOfScreen(mario);

  // ✨ Draw invincibility flash
  if (mario.invincible > 0 && frameCount % 6 < 3) {
    tint(255, 255, 255, 180);
  } else {
    noTint();
  }
}

function autoControl(character) {
  character.velocity.x += gameConfig.moveSpeed;
  character.changeAnimation('move');
  character.mirrorX(1);
}

function manualControl(character) {
  if (character.live) {
    if (noseX < 300) {
      character.velocity.x -= gameConfig.moveSpeed;
      character.changeAnimation('move');
      character.mirrorX(-1);
    }

    if (noseX > 300) {
      character.velocity.x += gameConfig.moveSpeed;
      character.changeAnimation('move');
      character.mirrorX(1);
    }

    if (!keyDown(control.left) && !keyDown(control.right) && !keyDown(control.up)) {
      character.changeAnimation('stand');
    }
  }
}

function jumping(character) {
  if ((noseY < 200 && character.live) || (touchIsDown && character.live)) {
    character.velocity.y += gameConfig.jump;
    mario_jump.play();
  }
}

function falling(character) {
  character.velocity.y += gameConfig.gravity;
  character.changeAnimation('jump');
}

function standOnObjs(obj1, obj2) {
  var obj1_Left = leftSide(obj1);
  var obj1_Right = rightSide(obj1);
  var obj1_Down = downSide(obj1);
  var obj2_Left = leftSide(obj2);
  var obj2_Right = rightSide(obj2);
  var obj2_Up = upSide(obj2);

  if (obj1_Right >= obj2_Left && obj1_Left <= obj2_Right && obj1_Down <= obj2_Up + 7 && obj1_Down >= obj2_Up - 7) {
    obj1.velocity.y = 0;
    obj1.position.y = obj2_Up - (obj1.height / 2) - 1;
    obj1.standOnObj = true;
  }
}

function StepOnEnemy(obj1, obj2) {
  var obj1_Left = leftSide(obj1);
  var obj1_Right = rightSide(obj1);
  var obj1_Down = downSide(obj1);
  var obj2_Left = leftSide(obj2);
  var obj2_Right = rightSide(obj2);
  var obj2_Up = upSide(obj2);

  if (obj1_Right >= obj2_Left && obj1_Left <= obj2_Right &&
    obj1_Down <= obj2_Up + 7 && obj1_Down >= obj2_Up - 7 &&
    obj2.live == true && obj2.touching.top) {

    obj2.live = false;
    obj1.killing = 30;
    obj1.kills++;
    mario_killenemy.play();
    spawnParticles(obj2.position.x, obj2.position.y, '#ff4444', 12); // ✨ death particles

    // ✨ Combo system
    gameConfig.combo++;
    gameConfig.comboTimer = 120; // 2s window
    if (gameConfig.combo > 1) {
      // Bonus points for combos
      gameConfig.scores += gameConfig.combo * 2;
    }

    if (obj1.velocity.y >= gameConfig.jump * 0.8) {
      obj1.velocity.y = gameConfig.jump * 0.8;
    } else {
      obj1.velocity.y += gameConfig.jump * 0.8;
    }
  }
}

function die(character) {
  character.live = false;
  character.dying += 120;
  character.liveNumber--;
  character.status = "dead";
  character.changeAnimation('dead');
  character.velocity.y -= 2;
  gameConfig.combo = 0; // ✨ reset combo on death
  if (character.liveNumber > 0) {
    mario_die.play();
  }
}

function checkStatus(character) {
  // ✨ Tick combo timer
  if (gameConfig.comboTimer > 0) {
    gameConfig.comboTimer--;
  } else {
    gameConfig.combo = 0;
  }

  if (character.live == false) {
    character.changeAnimation('dead');
    character.dying -= 1;
    reviveAfterMusic(character);
  }
  if (character.live == false && character.liveNumber == 0) {
    gameConfig.status = "gameover"
    mario_gameover.play();
  }
}

function reviveAfterMusic(character) {
  if (character.live === false && mario.liveNumber !== 0 && character.dying === 0) {
    character.live = true;
    character.status = "live";
    character.position.x = 500;
    character.position.y = 40;
    character.velocity.y = 0;
    character.invincible = 180; // ✨ 3 seconds invincibility
    noTint();
  }
}

function dontGetOutOfScreen(character) {
  if (character.position.y > gameConfig.screenY && character.live && character == mario) {
    die(mario);
  }

  if (character.position.x > gameConfig.screenX - (character.width * 0.5)) {
    character.position.x = gameConfig.screenX - (character.width * 0.5);
  } else if (character.position.x < character.width * 0.5) {
    if (character == mario) {
      character.position.x = character.width * 0.5;
    } else {
      character.live = false;
    }
  }
}

/*=============================================
=          Enemy setting and control          =
=============================================*/

function enemys(enemys) {
  enemys.forEach(function (enemy) {
    stateOfEnemy(enemy);
    positionOfEnemy(enemy);
    enemy.position.x -= gameConfig.enemyMoveSpeed;
  });
}

function stateOfEnemy(enemy) {
  if (enemy.live == false || enemy.position.y > gameConfig.screenY + 50) {
    enemy.position.x = random(gameConfig.screenX * 1.5, 2 * gameConfig.screenX + 50);
    enemy.position.y = random(gameConfig.screenY * 0.35, gameConfig.screenY * 0.75);
    enemy.live = true;
  }
}

function positionOfEnemy(enemy) {
  platforms.forEach(function (element) { enemyStandOnObjs(enemy, element); });
  bricks.forEach(function (element) { enemyStandOnObjs(enemy, element); });
  pipes.forEach(function (element) { enemyStandOnObjs(enemy, element); });
  enemy.position.y += gameConfig.gravityEnemy;
  dontGetOutOfScreen(enemy);
}

function enemyStandOnObjs(obj1, obj2) {
  var obj1_Left = leftSide(obj1);
  var obj1_Right = rightSide(obj1);
  var obj1_Down = downSide(obj1);
  var obj2_Left = leftSide(obj2);
  var obj2_Right = rightSide(obj2);
  var obj2_Up = upSide(obj2);

  if (obj1_Right >= obj2_Left && obj1_Left <= obj2_Right && obj1_Down <= obj2_Up + 7 && obj1_Down >= obj2_Up - 7) {
    obj1.velocity.y = 0;
    obj1.position.y = obj2_Up - (obj1.height);
  }
}

/*=============================================
=          ✨ Particle System                 =
=============================================*/

function spawnParticles(x, y, col, count) {
  for (var i = 0; i < count; i++) {
    particles.push({
      x: x,
      y: y,
      vx: random(-5, 5),
      vy: random(-8, -2),
      life: 40,
      maxLife: 40,
      col: col,
      size: random(4, 10)
    });
  }
}

function updateParticles() {
  for (var i = particles.length - 1; i >= 0; i--) {
    var p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.4;  // gravity
    p.life--;

    if (p.life <= 0) {
      particles.splice(i, 1);
      continue;
    }

    var alpha = map(p.life, 0, p.maxLife, 0, 255);
    push();
    noStroke();
    // parse hex color to rgb
    var r = parseInt(p.col.slice(1, 3), 16);
    var g = parseInt(p.col.slice(3, 5), 16);
    var b = parseInt(p.col.slice(5, 7), 16);
    fill(r, g, b, alpha);
    rect(p.x, p.y, p.size, p.size, 2);
    pop();
  }
}

/*===================================
=            Environment            =
===================================*/

function moveEnvironment(character) {
  var environmentScrollingSpeed = gameConfig.moveSpeed * 0.3;

  if (gameConfig.status === 'play') {
    environmentScrolling(platforms, environmentScrollingSpeed);
    environmentScrolling(bricks, environmentScrollingSpeed);
    environmentScrolling(clouds, environmentScrollingSpeed * 0.5);
    environmentScrolling(mountains, environmentScrollingSpeed * 0.3);
    environmentScrolling(pipes, environmentScrollingSpeed);
    environmentScrolling(coins, environmentScrollingSpeed);
    environmentScrolling(enemyMushrooms, environmentScrollingSpeed);
    character.position.x -= environmentScrollingSpeed;
  }
}

function environmentScrolling(group, environmentScrollingSpeed) {
  group.forEach(function (element) {
    if (element.position.x > -50) {
      element.position.x -= environmentScrollingSpeed;
    } else {
      element.position.x = gameConfig.screenX + 50;

      if (group === bricks) {
        element.position.y = random(gameConfig.screenY * 0.35, gameConfig.screenY * 0.75);
      }

      if (group === pipes || group === mountains) {
        element.position.x = random(50, gameConfig.screenX) + gameConfig.screenX;
      }

      if (group === clouds) {
        element.position.x = random(50, gameConfig.screenX) + gameConfig.screenX;
        element.position.y = random(0, gameConfig.screenY * 0.5);
        element.scale = random(0.3, 1.5);
      }

      if (group === coins) {
        element.position.x = random(0, gameConfig.screenX) + gameConfig.screenX;
        element.position.y = random(gameConfig.screenY * 0.2, gameConfig.screenY * 0.8);
      }
    }
  })
}

/*===================================
=            HUD / Scores           =
===================================*/

function scores(character) {
  noStroke();

  gameConfig.scores = character.coins * 5 + character.kills * 10 + gameConfig.timeScores;

  if (character.live && gameConfig.status === 'play') gameConfig.timeScores += 0.05;

  // ✨ Improved HUD with background
  push();
  fill(0, 0, 0, 100);
  noStroke();
  rect(0, 0, 300, 95, 0, 0, 12, 0);
  pop();

  // Score
  fill(247, 201, 72);
  textSize(18);
  textAlign(LEFT);
  text("⭐ " + round(gameConfig.scores), 12, 30);

  // Lives
  fill(229, 34, 34);
  textSize(18);
  text("❤️ " + character.liveNumber, 12, 58);

  // ✨ Show combo if active
  if (gameConfig.combo > 1 && gameConfig.comboTimer > 0) {
    var comboAlpha = map(gameConfig.comboTimer, 0, 120, 0, 255);
    fill(255, 200, 0, comboAlpha);
    textSize(22);
    text("COMBO x" + gameConfig.combo + "!", 12, 88);
  }

  // ─── Death screen ────────────────────────────────
  if (mario.live == false && mario.liveNumber != 0) {
    fill(0, 0, 0, 150);
    rect(0, 0, gameConfig.screenX, gameConfig.screenY);

    strokeWeight(7);
    noFill();
    stroke(255);
    ellipse(gameConfig.screenX / 2, gameConfig.screenY / 2 - 30, 150, 150);

    stroke("red");
    var ratio = (character.liveNumber / gameConfig.initialLifes);
    arc(gameConfig.screenX / 2, gameConfig.screenY / 2 - 30, 150, 150, PI + HALF_PI, (PI + HALF_PI) + (TWO_PI * ratio));

    fill(255, 255, 255);
    noStroke();
    textAlign(CENTER);
    textSize(40);
    text(round(character.liveNumber), gameConfig.screenX / 2, gameConfig.screenY / 2 - 35);

    textSize(18);
    text("lives remaining", gameConfig.screenX / 2, gameConfig.screenY / 2);

    textSize(13);
    fill(200, 200, 200);
    text("respawning...", gameConfig.screenX / 2, gameConfig.screenY / 2 + 28);
  }
}

/*=====================================
=            For Debugging            =
=====================================*/

function debugging(character) {
  strokeWeight(1);
  fill(255);
  textSize(12);
  text(character.dying, 20, 20);
  text(gameConfig.status, 20, 80);
  noFill();
  stroke(251);
  strokeWeight(2);
  outline(character);
  pipes.forEach(function (element) { outline(element); });
  enemyMushrooms.forEach(function (element) { outline(element); });
}

/* utility fns */
function outline(obj) { rect(leftSide(obj), upSide(obj), rightSide(obj) - leftSide(obj), downSide(obj) - upSide(obj)); }
function leftSide(obj) { return obj.position.x - (obj.width / 2); }
function rightSide(obj) { return obj.position.x + (obj.width / 2); }
function upSide(obj) { return obj.position.y - (obj.height / 2); }
function downSide(obj) { return obj.position.y + (obj.height / 2); }
