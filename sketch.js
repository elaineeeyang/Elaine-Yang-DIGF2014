// Tissue · Level to Speed
// How loud it is sets how fast the GIF plays. No sound, no movement.
// Based on 01 · Level to Frame: same microphone block, same screen.

// Put Tissue.gif in the same folder as index.html and sketch.js.
// (Needs Live Server or a web address. Opening the file by double click will not work.)
let gifFile = 'Tissue.gif';

// the feel of the piece. change these before you change anything else.
let boost = 5;        // phones hear quietly. raise it if the GIF barely moves
let smoothing = 0.2;  // 1 is raw and jumpy. 0.05 is slow and calm
let noiseGate = 0.05; // at or below this level the GIF stands still
let maxSpeed = 1.5;   // frames advanced per draw() when it is as loud as it gets

let mic;   // the microphone
let meter; // measures how loud the microphone is
let gif;
let level = 0;
let speed = 0;
let frameCursor = 0; // a float, so the speed can be a fraction of a frame

async function setup() {
  createCanvas(windowWidth, windowHeight);
  lockGestures();

  // on a laptop, show a QR code of this page so you can open it on your phone.
  // it only shows on a public https address.
  if (location.protocol === 'https:' && window.self === window.top) {
    showDesktopQr();
  }

  imageMode(CENTER);
  setupMic();

  gif = await loadImage(gifFile);
  gif.pause(); // the sound sets the speed, not the clock
}

function draw() {
  background(20);
  if (!gif) {
    return; // still loading
  }

  // 1. read the input: how loud is it, from 0 to 1
  let raw = getMicLevel();
  // the fallback: a finger stands in for the sound. higher on the screen is louder.
  if (mouseIsPressed) {
    raw = constrain(map(mouseY, height, 0, 0, 1), 0, 1);
  }
  // 2. smooth it: move part of the way toward the new value each frame
  level = lerp(level, raw, smoothing);
  // 3. map the level onto a speed. under the noise gate the speed is 0.
  if (level > noiseGate) {
    speed = map(level, noiseGate, 1, 0.1, maxSpeed, true);
  } else {
    speed = 0;
  }
  // 4. use it: step the frame forward by that speed
  let total = gif.numFrames();
  frameCursor = (frameCursor + speed) % total;
  let frame = floor(frameCursor);
  gif.setFrame(frame);

  // the labels sit in the top 70 pixels, so the GIF is fitted below them
  let top = 70;
  let s = min(width * 0.8 / gif.width, (height - top) * 0.85 / gif.height);
  image(gif, width / 2, top + (height - top) / 2, gif.width * s, gif.height * s);

  // the level as a bar up the left edge
  noStroke();
  fill(100, 200, 255);
  rect(0, height - level * height, 12, level * height);

  fill(255);
  textSize(16);
  text('level: ' + nf(level, 1, 2) + '   speed: ' + nf(speed, 1, 2) + '   frame: ' + frame, 20, 30);
  text(micStatus(), 20, 52);
}

// ---------- the microphone. this part is the same in every sketch. ----------

// call this once in setup
function setupMic() {
  mic = new p5.AudioIn(); // p5-phone looks for a variable with exactly this name
  meter = new p5.Amplitude();
  routeMic();
  enableMicTap('Tap to turn on the microphone');
}

// p5.sound sends the microphone straight to the speaker unless you stop it.
// This unplugs it from the speaker and plugs it into the level meter.
// It runs every frame, the same way the p5-phone Microphone Level example does it.
function routeMic() {
  mic.disconnect();
  mic.connect(meter);
}

// how loud it is right now, from 0 to 1. it is 0 when there is no microphone.
// window.micOpen is true only while sound is really arriving.
// window.micEnabled turns true on the tap even if the person says no, so it is not enough.
function getMicLevel() {
  if (!window.micOpen) {
    return 0;
  }
  routeMic();
  return constrain(meter.getLevel() * boost, 0, 1);
}

// one line for the screen that says what the microphone is doing
function micStatus() {
  if (window.micOpen) {
    return 'listening';
  }
  if (window.micEnabled) {
    return 'waiting for the microphone. if it never comes, use a finger';
  }
  return 'tap to turn on the microphone';
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
