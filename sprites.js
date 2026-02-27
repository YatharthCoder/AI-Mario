/* ════════════════════════════════════════════════════
   sprites.js — loads all game sprites
   Reads from: main.js globals (mountainImages, cloudImages, etc.)
   Writes to:  characters_environment.js globals (mountains, clouds, etc.)
   Called by:  main.js → preload()
════════════════════════════════════════════════════ */

var spriteNumber = {
  mountain:      6,
  cloud:         10,
  brick:         5,
  pipe:          5,
  coin:          10,
  enemyMushroom: 5
};

/* Called from main.js preload() */
function setSprites() {
  setSpriteGroups();

  loadStaticObjects(mountains, mountainImages,     spriteNumber.mountain,
    1.5,                    gameConfig.screenX,
    gameConfig.screenY-35,  gameConfig.screenY-35);

  loadStaticObjects(clouds, cloudImages,           spriteNumber.cloud,
    0,                      gameConfig.screenX,
    20,                     gameConfig.screenY*0.5);

  loadStaticObjects(bricks, brickImages,           spriteNumber.brick,
    gameConfig.screenX*0.1, gameConfig.screenX*0.9,
    gameConfig.screenY*0.1, gameConfig.screenY*0.7);

  loadStaticObjects(pipes, pipeImages,             spriteNumber.pipe,
    50,                     gameConfig.screenX,
    gameConfig.screenY-20,  gameConfig.screenY+10);

  loadAnimatedObjects(coins, coinsImags,           'shine',
    spriteNumber.coin,      'get',  false,
    0,                      gameConfig.screenX,
    gameConfig.screenY*0.35, gameConfig.screenY*0.75);

  loadAnimatedObjects(enemyMushrooms, enemyMushroomImage, 'move',
    spriteNumber.enemyMushroom, 'live', true,
    gameConfig.screenX*0.5, gameConfig.screenX,
    gameConfig.screenY*0.35, gameConfig.screenY*0.75);

  loadPlatforms();
}

/* Creates all Group() instances used by characters_environment.js */
function setSpriteGroups() {
  bricks         = new Group();
  enemyMushrooms = new Group();
  clouds         = new Group();
  mountains      = new Group();
  pipes          = new Group();
  platforms      = new Group();
  coins          = new Group();
}

function loadStaticObjects(group, imgArr, count, x1, x2, y1, y2) {
  for (var i = 0; i < count; i++) {
    var idx = floor((random() * 10) % imgArr.length);
    var img = loadImage(imgArr[idx]);
    group[i] = createSprite(random(x1, x2), random(y1, y2));
    group[i].addImage(img);
  }
}

function loadAnimatedObjects(group, imgArr, animName, count, statusKey, statusVal, x1, x2, y1, y2) {
  for (var i = 0; i < count; i++) {
    group[i] = createSprite(random(x1, x2), random(y1, y2));
    group[i].addAnimation(animName, imgArr[0], imgArr[1]);
    group[i].scale = 1.5;
    group[i][statusKey] = statusVal;
  }
}

function loadPlatforms() {
  var img = loadImage('platform.png'); /* root folder */
  for (var i = 0; i < 70; i++) {
    if (random() > 0.2) {
      platforms[i] = createSprite(gameConfig.screenX - i * 19, gameConfig.screenY - 10);
    } else {
      platforms[i] = createSprite(random(0, gameConfig.screenX), gameConfig.screenY - 10);
    }
    platforms[i].addImage(img);
  }
}

/* Creates mario sprite — called from main.js preload() */
function MarioAnimation() {
  mario = createSprite(gameConfig.startingPointX, gameConfig.startingPointY, 0, 0.30);
  mario.addAnimation('stand',  'mario06.png');         /* root folder */
  mario.addAnimation('move',   'mario01.png', 'mario03.png');
  mario.addAnimation('crouch', 'mario18.png');
  mario.addAnimation('jump',   'mario05.png');
  mario.addAnimation('dead',   'mario24.png');
}
