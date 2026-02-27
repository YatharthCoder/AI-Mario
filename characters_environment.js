/* ════════════════════════════════════════════════════
   characters_environment.js — all game logic
   Reads from:  main.js   (noseX, noseY, world_start, mario_*, sounds)
   Writes to:   index.html (#game-status via startGame())
   Uses:        sprites.js globals (mario, bricks, platforms, etc.)
════════════════════════════════════════════════════ */

/* ── Sprite group globals (set by sprites.js setSpriteGroups()) ── */
var mario, bricks, clouds, mountains, enemyMushrooms, pipes, platforms, coins;

/* ── Keyboard control map ─ */
var control = {
  up:     'UP_ARROW',
  left:   'LEFT_ARROW',
  right:  'RIGHT_ARROW',
  revive: 32   /* SPACE */
};

/* ── Game config ─────────────────────────────────────
   screenX / screenY are overwritten by main.js setup()
   to match the actual responsive canvas size.
─────────────────────────────────────────────────── */
var gameConfig = {
  status:        'start',   /* 'start' | 'play' | 'gameover' */
  initialLifes:  4,
  moveSpeed:     5,
  enemyMoveSpeed:1.5,
  gravity:       1,
  gravityEnemy:  10,
  jump:          -16,
  startingPointX:500,
  startingPointY:0,
  screenX:       1240,   /* overwritten in main.js setup() */
  screenY:       336,    /* overwritten in main.js setup() */
  timeScores:    0,
  scores:        0,
  combo:         0,
  comboTimer:    0,
  difficultyTimer:0
};

/* ── Pose tracking globals (set by main.js gotPoses()) ── */
/* noseX and noseY are declared in main.js — don't redeclare here */
var gamestatus = '';

/* ── Particle pool ─ */
var particles = [];

/* ══════════════════════════════════════════════════
   startGame()
   Called by: onclick on #start-btn in index.html
══════════════════════════════════════════════════ */
function startGame() {
  gamestatus = 'start';
  var el = document.getElementById('game-status');
  if (el) el.textContent = 'STARTING...';
}

/* ══════════════════════════════════════════════════
   game()
   Called by: main.js draw() every frame
══════════════════════════════════════════════════ */
function game() {
  instializeInDraw();
  moveEnvironment(mario);
  drawSprites();
  updateParticles();

  /* ── START SCREEN ── */
  if (gameConfig.status === 'start') {
    fill(0, 0, 0, 155);
    noStroke();
    rect(0, 0, gameConfig.screenX, gameConfig.screenY);

    var bounce = sin(frameCount * 0.08) * 7;
    fill(247, 201, 72);
    textSize(clamp(gameConfig.screenX * 0.035, 18, 44));
    textAlign(CENTER);
    textStyle(BOLD);
    text('🍄 AI MARIO', gameConfig.screenX / 2, gameConfig.screenY / 2 - 38 + bounce);

    fill(255);
    textSize(clamp(gameConfig.screenX * 0.012, 10, 16));
    textStyle(NORMAL);
    text('Show your face to the camera to begin!', gameConfig.screenX / 2, gameConfig.screenY / 2 + 8);

    fill(200, 200, 200);
    textSize(clamp(gameConfig.screenX * 0.009, 8, 12));
    text('Tilt head LEFT / RIGHT to move  ·  Look UP to jump', gameConfig.screenX / 2, gameConfig.screenY / 2 + 36);

    changeGameStatus();
  }

  /* ── PLAYING ── */
  if (gameConfig.status === 'play') {
    positionOfCharacter(mario);
    enemys(enemyMushrooms);
    checkStatus(mario);
    scores(mario);
    manualControl(mario);
    updateDifficulty();
  }

  /* ── GAME OVER ── */
  if (gameConfig.status === 'gameover') {
    fill(0, 0, 0, 155);
    noStroke();
    rect(0, 0, gameConfig.screenX, gameConfig.screenY);

    var pulse = sin(frameCount * 0.1) * 0.12 + 1;
    fill(229, 34, 34);
    textSize(clamp(gameConfig.screenX * 0.04, 22, 52) * pulse);
    textAlign(CENTER);
    text('GAME OVER', gameConfig.screenX / 2, gameConfig.screenY / 2 - 55);

    fill(247, 201, 72);
    textSize(clamp(gameConfig.screenX * 0.025, 16, 32));
    text(round(gameConfig.scores) + ' pts', gameConfig.screenX / 2, gameConfig.screenY / 2 + 2);

    fill(255);
    textSize(clamp(gameConfig.screenX * 0.011, 9, 14));
    text('Press SPACE to restart', gameConfig.screenX / 2, gameConfig.screenY / 2 + 36);

    changeGameStatus(mario);
  }
}

/* Helper: clamp a value between min and max */
function clamp(val, mn, mx) { return Math.max(mn, Math.min(mx, val)); }

/* ── changeGameStatus ─ */
function changeGameStatus() {
  /* Start playing when face is detected and player clicked Play */
  if (typeof noseX !== 'undefined' && noseX !== '' &&
      gameConfig.status === 'start' && gamestatus === 'start') {
    world_start.play();
    initializeCharacterStatus(mario);
    gameConfig.status = 'play';
    gameConfig.scores = 0;
    gameConfig.timeScores = 0;
    gameConfig.combo = 0;
    gameConfig.difficultyTimer = 0;
    gameConfig.enemyMoveSpeed = 1.5;
    particles = [];

    /* Update UI */
    var el = document.getElementById('game-status');
    if (el) { el.textContent = 'GO!'; el.classList.add('active'); }
  }

  /* Restart on SPACE after game over */
  if (gameConfig.status === 'gameover' && keyDown(control.revive)) {
    gameConfig.status = 'start';
    var el2 = document.getElementById('game-status');
    if (el2) { el2.textContent = 'FACE DETECTED — PRESS PLAY!'; el2.classList.remove('active'); }
  }
}

/* ══════════════════════════════════════════════════
   INITIALIZE
══════════════════════════════════════════════════ */
function instializeInSetup(character) {
  frameRate(60);
  character.scale = 0.35;
  initializeCharacterStatus(character);

  bricks.displace(bricks);
  platforms.displace(platforms);
  coins.displace(coins);
  coins.displace(platforms);
  coins.collide(pipes);
  coins.displace(bricks);

  clouds.forEach(function(e) { e.scale = random(1, 2); });
}

function initializeCharacterStatus(character) {
  character.scale       = 0.35;
  character.killing     = 0;
  character.kills       = 0;
  character.live        = true;
  character.liveNumber  = gameConfig.initialLifes;
  character.status      = 'live';
  character.coins       = 0;
  character.dying       = 0;
  character.invincible  = 0;
  character.position.x  = gameConfig.startingPointX;
  character.position.y  = gameConfig.startingPointY;
}

function instializeInDraw() {
  background(109, 143, 252);

  /* slight ground darkening */
  noStroke();
  for (var i = 0; i < 30; i++) {
    fill(80, 120, 200, 5);
    rect(0, gameConfig.screenY - i * 3, gameConfig.screenX, 3);
  }

  if (mario.killing > 0) mario.killing -= 1;
  if (mario.invincible > 0) mario.invincible -= 1;

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

  mario.standOnObj = false;
  mario.velocity.x  = 0;
  mario.maxSpeed    = 20;
}

/* ══════════════════════════════════════════════════
   DIFFICULTY RAMP
══════════════════════════════════════════════════ */
function updateDifficulty() {
  gameConfig.difficultyTimer++;
  if (gameConfig.difficultyTimer % 600 === 0) {
    gameConfig.enemyMoveSpeed = Math.min(gameConfig.enemyMoveSpeed + 0.3, 5);
  }
}

/* ══════════════════════════════════════════════════
   COINS
══════════════════════════════════════════════════ */
function getCoins(coin, character) {
  if (character.overlap(coin) && character.live && coin.get === false) {
    character.coins++;
    coin.get = true;
    mario_coin.play();
    spawnParticles(coin.position.x, coin.position.y, '#ffd700', 8);
  }
}

function coinVanish(coin) {
  if (coin.get) {
    coin.position.x = random(50, gameConfig.screenX) + gameConfig.screenX;
    coin.get = false;
  }
}

/* ══════════════════════════════════════════════════
   CHARACTER POSITION & MOVEMENT
══════════════════════════════════════════════════ */
function positionOfCharacter(character) {
  if (character.live) {
    platforms.forEach(function(e)     { standOnObjs(character, e); });
    bricks.forEach(function(e)        { standOnObjs(character, e); });
    pipes.forEach(function(e)         { standOnObjs(character, e); });
    falling(character);
    if (character.standOnObj) jumping(character);
  }

  coins.forEach(function(e)          { getCoins(e, mario); coinVanish(e); });

  enemyMushrooms.forEach(function(e) {
    StepOnEnemy(character, e);
    if ((e.touching.left || e.touching.right) &&
        character.live && character.killing === 0 && character.invincible === 0) {
      die(mario);
    }
  });

  dontGetOutOfScreen(mario);

  /* Invincibility flash */
  if (mario.invincible > 0 && frameCount % 6 < 3) tint(255, 255, 255, 180);
  else noTint();
}

function manualControl(character) {
  if (!character.live) return;

  /* noseX is set by gotPoses() in main.js */
  if (typeof noseX !== 'undefined' && noseX !== '') {
    if (noseX < 300) {
      character.velocity.x -= gameConfig.moveSpeed;
      character.changeAnimation('move');
      character.mirrorX(-1);
    } else if (noseX > 300) {
      character.velocity.x += gameConfig.moveSpeed;
      character.changeAnimation('move');
      character.mirrorX(1);
    } else {
      character.changeAnimation('stand');
    }
  } else {
    character.changeAnimation('stand');
  }
}

function jumping(character) {
  if (typeof noseY !== 'undefined' &&
      ((noseY < 200 && character.live) || (touchIsDown && character.live))) {
    character.velocity.y += gameConfig.jump;
    mario_jump.play();
  }
}

function falling(character) {
  character.velocity.y += gameConfig.gravity;
  character.changeAnimation('jump');
}

function standOnObjs(obj1, obj2) {
  var l1 = leftSide(obj1), r1 = rightSide(obj1), d1 = downSide(obj1);
  var l2 = leftSide(obj2), r2 = rightSide(obj2), u2 = upSide(obj2);

  if (r1 >= l2 && l1 <= r2 && d1 <= u2 + 7 && d1 >= u2 - 7) {
    obj1.velocity.y   = 0;
    obj1.position.y   = u2 - (obj1.height / 2) - 1;
    obj1.standOnObj   = true;
  }
}

/* ══════════════════════════════════════════════════
   ENEMY STOMP / DEATH
══════════════════════════════════════════════════ */
function StepOnEnemy(obj1, obj2) {
  var l1 = leftSide(obj1), r1 = rightSide(obj1), d1 = downSide(obj1);
  var l2 = leftSide(obj2), r2 = rightSide(obj2), u2 = upSide(obj2);

  if (r1 >= l2 && l1 <= r2 && d1 <= u2 + 7 && d1 >= u2 - 7 &&
      obj2.live === true && obj2.touching.top) {
    obj2.live = false;
    obj1.killing = 30;
    obj1.kills++;
    mario_killenemy.play();
    spawnParticles(obj2.position.x, obj2.position.y, '#ff4444', 12);

    /* Combo */
    gameConfig.combo++;
    gameConfig.comboTimer = 120;
    if (gameConfig.combo > 1) gameConfig.scores += gameConfig.combo * 2;

    if (obj1.velocity.y >= gameConfig.jump * 0.8) obj1.velocity.y = gameConfig.jump * 0.8;
    else obj1.velocity.y += gameConfig.jump * 0.8;
  }
}

function die(character) {
  character.live        = false;
  character.dying       += 120;
  character.liveNumber  -= 1;
  character.status      = 'dead';
  character.changeAnimation('dead');
  character.velocity.y  -= 2;
  gameConfig.combo      = 0;
  if (character.liveNumber > 0) mario_die.play();
}

function checkStatus(character) {
  if (gameConfig.comboTimer > 0) gameConfig.comboTimer--;
  else gameConfig.combo = 0;

  if (character.live === false) {
    character.changeAnimation('dead');
    character.dying -= 1;
    reviveAfterMusic(character);
  }
  if (character.live === false && character.liveNumber === 0) {
    if (gameConfig.status !== 'gameover') {
      gameConfig.status = 'gameover';
      mario_gameover.play();
    }
  }
}

function reviveAfterMusic(character) {
  if (character.live === false && mario.liveNumber !== 0 && character.dying === 0) {
    character.live       = true;
    character.status     = 'live';
    character.position.x = 500;
    character.position.y = 40;
    character.velocity.y = 0;
    character.invincible = 180; /* 3s flash */
    noTint();
  }
}

function dontGetOutOfScreen(character) {
  if (character.position.y > gameConfig.screenY && character.live && character === mario) {
    die(mario);
  }
  if (character.position.x > gameConfig.screenX - character.width * 0.5) {
    character.position.x = gameConfig.screenX - character.width * 0.5;
  } else if (character.position.x < character.width * 0.5) {
    if (character === mario) character.position.x = character.width * 0.5;
    else character.live = false;
  }
}

/* ══════════════════════════════════════════════════
   ENEMIES
══════════════════════════════════════════════════ */
function enemys(group) {
  group.forEach(function(enemy) {
    stateOfEnemy(enemy);
    positionOfEnemy(enemy);
    enemy.position.x -= gameConfig.enemyMoveSpeed;
  });
}

function stateOfEnemy(enemy) {
  if (enemy.live === false || enemy.position.y > gameConfig.screenY + 50) {
    enemy.position.x = random(gameConfig.screenX * 1.5, 2 * gameConfig.screenX + 50);
    enemy.position.y = random(gameConfig.screenY * 0.35, gameConfig.screenY * 0.75);
    enemy.live = true;
  }
}

function positionOfEnemy(enemy) {
  platforms.forEach(function(e) { enemyStandOnObjs(enemy, e); });
  bricks.forEach(function(e)    { enemyStandOnObjs(enemy, e); });
  pipes.forEach(function(e)     { enemyStandOnObjs(enemy, e); });
  enemy.position.y += gameConfig.gravityEnemy;
  dontGetOutOfScreen(enemy);
}

function enemyStandOnObjs(obj1, obj2) {
  var l1 = leftSide(obj1), r1 = rightSide(obj1), d1 = downSide(obj1);
  var l2 = leftSide(obj2), r2 = rightSide(obj2), u2 = upSide(obj2);
  if (r1 >= l2 && l1 <= r2 && d1 <= u2 + 7 && d1 >= u2 - 7) {
    obj1.velocity.y = 0;
    obj1.position.y = u2 - obj1.height;
  }
}

/* ══════════════════════════════════════════════════
   ENVIRONMENT SCROLLING
══════════════════════════════════════════════════ */
function moveEnvironment(character) {
  var spd = gameConfig.moveSpeed * 0.3;
  if (gameConfig.status !== 'play') return;

  environmentScrolling(platforms,      spd);
  environmentScrolling(bricks,         spd);
  environmentScrolling(clouds,         spd * 0.5);
  environmentScrolling(mountains,      spd * 0.3);
  environmentScrolling(pipes,          spd);
  environmentScrolling(coins,          spd);
  environmentScrolling(enemyMushrooms, spd);
  character.position.x -= spd;
}

function environmentScrolling(group, spd) {
  group.forEach(function(el) {
    if (el.position.x > -50) {
      el.position.x -= spd;
    } else {
      el.position.x = gameConfig.screenX + 50;
      if (group === bricks)          el.position.y = random(gameConfig.screenY * 0.35, gameConfig.screenY * 0.75);
      if (group === pipes || group === mountains) el.position.x = random(50, gameConfig.screenX) + gameConfig.screenX;
      if (group === clouds) {
        el.position.x = random(50, gameConfig.screenX) + gameConfig.screenX;
        el.position.y = random(0, gameConfig.screenY * 0.5);
        el.scale = random(0.3, 1.5);
      }
      if (group === coins) {
        el.position.x = random(0, gameConfig.screenX) + gameConfig.screenX;
        el.position.y = random(gameConfig.screenY * 0.2, gameConfig.screenY * 0.8);
      }
    }
  });
}

/* ══════════════════════════════════════════════════
   PARTICLE SYSTEM
══════════════════════════════════════════════════ */
function spawnParticles(x, y, col, count) {
  for (var i = 0; i < count; i++) {
    particles.push({
      x: x, y: y,
      vx: random(-5, 5), vy: random(-8, -2),
      life: 40, maxLife: 40,
      col: col, size: random(4, 9)
    });
  }
}

function updateParticles() {
  for (var i = particles.length - 1; i >= 0; i--) {
    var p = particles[i];
    p.x  += p.vx; p.y += p.vy; p.vy += 0.4; p.life--;
    if (p.life <= 0) { particles.splice(i, 1); continue; }
    var alpha = map(p.life, 0, p.maxLife, 0, 255);
    var r = parseInt(p.col.slice(1,3),16);
    var g = parseInt(p.col.slice(3,5),16);
    var b = parseInt(p.col.slice(5,7),16);
    push(); noStroke(); fill(r,g,b,alpha);
    rect(p.x, p.y, p.size, p.size, 2);
    pop();
  }
}

/* ══════════════════════════════════════════════════
   HUD / SCORES  (drawn on p5 canvas)
══════════════════════════════════════════════════ */
function scores(character) {
  noStroke();

  /* Score = coins×5 + kills×10 + time bonus */
  gameConfig.scores = character.coins * 5 + character.kills * 10 + gameConfig.timeScores;
  if (character.live && gameConfig.status === 'play') gameConfig.timeScores += 0.05;

  /* On-canvas HUD background pill */
  push();
  fill(0, 0, 0, 100); noStroke();
  rect(0, 0, clamp(gameConfig.screenX * 0.25, 160, 300), 100, 0, 0, 14, 0);
  pop();

  fill(247, 201, 72); textAlign(LEFT);
  textSize(clamp(gameConfig.screenX * 0.015, 12, 20));
  text('⭐ ' + round(gameConfig.scores), 12, 30);

  fill(229, 34, 34);
  text('❤️ ' + character.liveNumber, 12, 58);

  /* Combo flash */
  if (gameConfig.combo > 1 && gameConfig.comboTimer > 0) {
    var a = map(gameConfig.comboTimer, 0, 120, 0, 255);
    fill(255, 200, 0, a);
    textSize(clamp(gameConfig.screenX * 0.018, 14, 24));
    text('COMBO x' + gameConfig.combo + '!', 12, 88);
  }

  /* Death/respawn overlay */
  if (mario.live === false && mario.liveNumber !== 0) {
    fill(0, 0, 0, 145); noStroke();
    rect(0, 0, gameConfig.screenX, gameConfig.screenY);

    var cx = gameConfig.screenX / 2;
    var cy = gameConfig.screenY / 2;
    var r  = clamp(gameConfig.screenX * 0.07, 55, 85);

    strokeWeight(6); noFill();
    stroke(255); ellipse(cx, cy - r * 0.4, r*2, r*2);

    stroke('red');
    var ratio = character.liveNumber / gameConfig.initialLifes;
    arc(cx, cy - r * 0.4, r*2, r*2, PI + HALF_PI, (PI + HALF_PI) + (TWO_PI * ratio));

    fill(255); noStroke(); textAlign(CENTER);
    textSize(clamp(gameConfig.screenX * 0.03, 20, 40));
    text(round(character.liveNumber), cx, cy - r * 0.4 + 10);

    textSize(clamp(gameConfig.screenX * 0.012, 10, 16));
    fill(200);
    text('lives remaining', cx, cy + r * 0.8);
    text('respawning...', cx, cy + r * 1.2);
  }
}

/* ══════════════════════════════════════════════════
   GEOMETRY HELPERS
══════════════════════════════════════════════════ */
function leftSide(o)  { return o.position.x - o.width  / 2; }
function rightSide(o) { return o.position.x + o.width  / 2; }
function upSide(o)    { return o.position.y - o.height / 2; }
function downSide(o)  { return o.position.y + o.height / 2; }
function outline(o)   { rect(leftSide(o), upSide(o), rightSide(o)-leftSide(o), downSide(o)-upSide(o)); }
