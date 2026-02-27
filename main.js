/* ════════════════════════════════════════════════════
   main.js — p5.js entry point
   Connects to:
     index.html → #game-canvas (canvas parent)
     index.html → #game_console (video parent)
     index.html → #game-status (modelLoaded text)
     sprites.js → setSprites(), MarioAnimation()
     characters_environment.js → game(), instializeInSetup(), startGame()
════════════════════════════════════════════════════ */

/* ── Web Audio Sound Engine ──────────────────────────
   Replaces missing .wav files — generates retro chip sounds
   via the browser's built-in Web Audio API (no files needed).
   Each sound object has a .play() method so the rest of the
   code (characters_environment.js) works unchanged.
─────────────────────────────────────────────────── */
var _audioCtx = null;

function _getCtx() {
  if (!_audioCtx) {
    _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return _audioCtx;
}

function _playNotes(notes) {
  var ctx = _getCtx();
  notes.forEach(function(n) {
    var osc  = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = n.type || 'square';
    osc.frequency.setValueAtTime(n.freq, ctx.currentTime + n.t);
    if (n.freq2) {
      osc.frequency.linearRampToValueAtTime(n.freq2, ctx.currentTime + n.t + n.d);
    }
    gain.gain.setValueAtTime(n.vol || 0.18, ctx.currentTime + n.t);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + n.t + n.d);
    osc.start(ctx.currentTime + n.t);
    osc.stop(ctx.currentTime + n.t + n.d + 0.01);
  });
}

/* Sound definitions */
/* ─ world_start: classic 7-note level-start fanfare ─ */
var world_start = { play: function() {
  _playNotes([
    { freq:523, t:0,    d:.10, vol:.20 },
    { freq:523, t:.10,  d:.10, vol:.20 },
    { freq:523, t:.20,  d:.10, vol:.20 },
    { freq:415, t:.30,  d:.10, vol:.20 },
    { freq:523, t:.40,  d:.14, vol:.22 },
    { freq:659, t:.55,  d:.28, vol:.22 },
    { freq:784, t:.84,  d:.40, vol:.20 }
  ]);
}};

/* ─ mario_jump: rising sweep ─ */
var mario_jump = { play: function() {
  _playNotes([
    { freq:300, freq2:700, t:0, d:.13, vol:.22 }
  ]);
}};

/* ─ mario_coin: two-note ding ─ */
var mario_coin = { play: function() {
  _playNotes([
    { freq:987,  t:0,    d:.07, vol:.20 },
    { freq:1319, t:.07,  d:.14, vol:.20 }
  ]);
}};

/* ─ mario_die: descending melody ─ */
var mario_die = { play: function() {
  _playNotes([
    { freq:660, t:0,    d:.10, vol:.20 },
    { freq:520, t:.10,  d:.10, vol:.20 },
    { freq:380, t:.20,  d:.10, vol:.20 },
    { freq:280, t:.30,  d:.10, vol:.20 },
    { freq:200, t:.40,  d:.15, vol:.16 },
    { freq:160, t:.55,  d:.22, vol:.13 }
  ]);
}};

/* ─ mario_gameover: slow sad melody ─ */
var mario_gameover = { play: function() {
  _playNotes([
    { freq:523, t:0,    d:.30, vol:.20 },
    { freq:494, t:.30,  d:.30, vol:.20 },
    { freq:466, t:.60,  d:.30, vol:.20 },
    { freq:440, t:.90,  d:.55, vol:.18 },
    { freq:415, t:1.45, d:.60, vol:.15 }
  ]);
}};

/* ─ mario_killenemy: stomp thud ─ */
var mario_killenemy = { play: function() {
  _playNotes([
    { freq:400, freq2:50, t:0, d:.16, vol:.25 }
  ]);
}};

/* ── Image paths ─────────────────────────────────────
   All PNG files are in the ROOT folder (same as index.html).
   sprites.js reads these globals before calling loadImage().
─────────────────────────────────────────────────── */
var mountainImages     = ['mountains01.png','mountains02.png','mountains03.png','mountains04.png'];
var cloudImages        = ['cloud01.png','cloud02.png'];
var brickImages        = ['blocks001.png','blocks002.png','blocks003.png'];
var coinsImags         = ['coin01.png','coin05.png'];
var pipeImages         = ['tube.png'];
var platformImages     = ['platform.png'];
var enemyMushroomImage = ['enemyMushroom01.png','enemyMushroom02.png'];

/* ── Globals used by PoseNet callbacks ─ */
var noseX = '';
var noseY = '';
var video;

/* ── preload() — p5 calls this before setup() ───────
   Load sprites + Mario animations (defined in sprites.js)
─────────────────────────────────────────────────── */
function preload() {
  setSprites();       /* sprites.js — creates all sprite groups */
  MarioAnimation();   /* sprites.js — creates mario sprite */
}

/* ── setup() — p5 calls this once after preload ─────
   Creates a responsive canvas that fills #game-canvas div.
   Keeps the original 1240:336 aspect ratio scaled to fit.
─────────────────────────────────────────────────── */
function setup() {
  /* Get the pixel width of the canvas container */
  var container = document.getElementById('game-canvas');
  var w = container ? container.offsetWidth : 1240;
  var h = Math.round(w * (336 / 1240)); /* keep original aspect ratio */

  /* Tell game logic the real screen size */
  gameConfig.screenX = w;
  gameConfig.screenY = h;

  /* Create p5 canvas and attach it to #game-canvas div */
  var c = createCanvas(w, h);
  c.parent('game-canvas');

  /* Init game with mario sprite */
  instializeInSetup(mario); /* characters_environment.js */

  /* Set up webcam — attach video to #game_console div */
  video = createCapture(VIDEO);
  video.size(320, 240);
  video.parent('game_console');

  /* Init PoseNet ML model */
  var poseNet = ml5.poseNet(video, modelLoaded);
  poseNet.on('pose', gotPoses);
}

/* ── windowResized() — p5 calls this on browser resize ─ */
function windowResized() {
  var container = document.getElementById('game-canvas');
  if (!container) return;
  var w = container.offsetWidth;
  var h = Math.round(w * (336 / 1240));
  gameConfig.screenX = w;
  gameConfig.screenY = h;
  resizeCanvas(w, h);
}

/* ── draw() — p5 calls this every frame ─ */
function draw() {
  game(); /* characters_environment.js — runs the full game loop */
}

/* ── PoseNet callbacks ─────────────────────────────── */
function modelLoaded() {
  console.log('PoseNet loaded!');
  /* Update status text in sidebar (#game-status in index.html) */
  var el = document.getElementById('game-status');
  if (el) el.textContent = 'AI READY — SHOW YOUR FACE!';
}

function gotPoses(results) {
  if (results.length > 0) {
    /* noseX / noseY are read by manualControl() and jumping()
       in characters_environment.js, and by updateTracking()
       in the inline script in index.html */
    noseX = results[0].pose.nose.x;
    noseY = results[0].pose.nose.y;
  }
}
