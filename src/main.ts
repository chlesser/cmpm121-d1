// Vite turns this import into a production-safe URL. Keep it as a file so
// even this tiny example demonstrates a separately deployed asset.
// @deno-types="./asset-url.d.ts"
import tileUrl from "./assets/tile.svg?no-inline";
import arrowImage from "./assets/arrow.png";
import archeryBackground from "./assets/archery.svg?no-inline";
import points_up from "./assets/points_up.mp3";
import arrow_shot from "./assets/trimmed-dragon-studio-thud-sound-effect-405470.mp3";

const app = document.querySelector<HTMLElement>("#app")!;

const heading = document.createElement("h1");
heading.textContent = "Tap Archery";

//Globals
let score = 0;
const UI_WIDTH = 450;
const middlePoint = {
  x: UI_WIDTH + (document.documentElement.clientWidth - UI_WIDTH) / 2,
  y: document.documentElement.clientHeight / 2,
};
let arrowsOnScreen = 0;
const upgradeButtons: UpgradeButton[] = [];

/*
  UPGRADE BUTTONS
*/
// Radius Upgrade Button
interface UpgradeButton extends HTMLButtonElement {
  display: string;
  cost: number;
  stat: number;
  stage: number;
  upgradeFunction?: () => void;
}

const upgradeRadiusButton = Object.assign(
  document.createElement("button") as UpgradeButton,
  {
    display: "Board Radius",
    cost: 10,
    stat: 300,
    stage: 1,
    upgradeFunction: () => {
      upgradeRadiusButton.stat *= 0.95;
      updateBackdropBounds();
    },
  },
);
initializeButton(upgradeRadiusButton);

const upgradeArrowButton = Object.assign(
  document.createElement("button") as UpgradeButton,
  {
    display: "Points per Arrow",
    cost: 10,
    stat: 2,
    stage: 1,
    upgradeFunction: () => {
      upgradeArrowButton.stat *= 3;
    },
  },
);
initializeButton(upgradeArrowButton);

const upgradeMaxArrowButton = Object.assign(
  document.createElement("button") as UpgradeButton,
  {
    display: "Max Arrows",
    cost: 10,
    stat: 1,
    stage: 1,
    upgradeFunction: () => {
      upgradeMaxArrowButton.stat++;
    },
  },
);
initializeButton(upgradeMaxArrowButton);

const upgradeLodgedPointsButton = Object.assign(
  document.createElement("button") as UpgradeButton,
  {
    display: "Lodged Score Multiplier",
    cost: 10,
    stat: 1,
    stage: 1,
    upgradeFunction: () => {
      upgradeLodgedPointsButton.stat *= 2;
    },
  },
);
initializeButton(upgradeLodgedPointsButton);

const upgradeLodgeTimeButton = Object.assign(
  document.createElement("button") as UpgradeButton,
  {
    display: "Lodged Time",
    cost: 10,
    stat: 1000,
    stage: 1,
    upgradeFunction: () => {
      upgradeLodgeTimeButton.stat += 500;
    },
  },
);
initializeButton(upgradeLodgeTimeButton);

//target Setup
const target = document.createElement("img");
target.src = tileUrl;
target.alt = "A teal tile with a cream circle";
target.width = 96;
target.height = 96;

//Backdrop Setup
const backdrop = document.createElement("img");
backdrop.src = archeryBackground;
backdrop.alt = "A standard archery target";
updateBackdropBounds();
backdrop.style.position = "absolute";
backdrop.style.zIndex = "-1";

//Score Setup
const scoreContainer = document.createElement("span");
scoreContainer.className = "game-score";
const scoreText = document.createTextNode(`${score} Hits`);
scoreContainer.appendChild(scoreText);

//Arrow Click Button
const arrowButton = document.createElement("button");
arrowButton.style.position = "absolute";
arrowButton.style.backgroundColor = "transparent";
arrowButton.style.border = "none";
arrowButton.appendChild(target);

const initialPos = getRandomPosition();
arrowButton.style.left = `${initialPos.x}px`;
arrowButton.style.top = `${initialPos.y}px`;

arrowButton.addEventListener("click", (event) => {
  if (arrowsOnScreen >= upgradeMaxArrowButton.stat) return;
  const arrow_shot_sound = new Audio(arrow_shot);
  arrow_shot_sound.play();
  drawArrowAtMouse(event);
  score += upgradeArrowButton.stat;
  updateScore();
  createFadingText(event.clientX, event.clientY, upgradeArrowButton.stat);
  const { x, y } = getRandomPosition();
  arrowButton.style.left = `${x}px`;
  arrowButton.style.top = `${y}px`;
});

// elapsed time
let lastTime = 0;
let totalTime = 0;
function tick(timestamp: number) {
  const currentTime = timestamp / 1000;
  if (lastTime == 0) {
    lastTime = currentTime;
  }
  const deltaTime = currentTime - lastTime;
  lastTime = currentTime;

  totalTime += deltaTime;
  addPersistentScore(deltaTime);
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

//HELPER FUNCTIONS
function getRandomPosition() {
  const theta = Math.random() * 2 * Math.PI;
  const x = (Math.cos(theta) * upgradeRadiusButton.stat) + middlePoint.x -
    target.width / 2;
  const y = (Math.sin(theta) * upgradeRadiusButton.stat) + middlePoint.y -
    target.height / 2;
  return { x, y };
}

function drawArrowAtMouse(event: MouseEvent) {
  const x = event.clientX;
  const y = event.clientY;
  spawnArrow(x, y);
}

function spawnArrow(x: number, y: number) {
  const arrow = document.createElement("img");
  arrow.src = arrowImage;
  arrow.style.position = "absolute";
  arrow.inert = false; //Check this later, this may be a problem

  const arrowPos = { x: x - arrow.width / 2, y: y };
  arrow.style.left = `${arrowPos.x}px`;
  arrow.style.top = `${arrowPos.y}px`;

  startArrowLifecycle(arrow, arrowPos.x, arrowPos.y);
  app.appendChild(arrow);
}

function startArrowLifecycle(arrow: HTMLImageElement, x: number, y: number) {
  arrowsOnScreen++;
  const textInterval = setInterval(() => {
    const pointsPerSecond = upgradeLodgeTimeButton.stat *
      upgradeLodgedPointsButton.stat / 10000;
    createFadingText(x, y, Number(pointsPerSecond.toFixed(2)));
  }, upgradeLodgeTimeButton.stat);
  setTimeout(() => {
    arrowsOnScreen--;
    clearInterval(textInterval);
    arrow.remove();
  }, upgradeLodgeTimeButton.stat);
}

function addPersistentScore(deltaTime: number) {
  if (arrowsOnScreen <= 0) return;
  score += deltaTime * 0.1 * upgradeLodgedPointsButton.stat *
    arrowsOnScreen;
  updateScore();
}
function updateScore() {
  scoreText.textContent = `${score.toFixed(2)} Hits`;

  for (const button of upgradeButtons) {
    if (score < button.cost) {
      button.classList.add("unaffordable");
    } else {
      button.classList.remove("unaffordable");
    }
  }
}
function updateBackdropBounds() {
  const backdropSize = upgradeRadiusButton.stat * 2 * 1.1;
  backdrop.width = backdropSize;
  backdrop.height = backdropSize;
  backdrop.style.left = `${middlePoint.x - backdropSize / 2}px`;
  backdrop.style.top = `${middlePoint.y - backdropSize / 2}px`;
}
function buyUpgrade(button: UpgradeButton) {
  if (score < button.cost) return;
  score -= button.cost;
  if (button.upgradeFunction) button.upgradeFunction();
  button.stage++;
  setCost(button);
  updateButtonText(button);
  const points_up_sound = new Audio(points_up);
  points_up_sound.play();
  updateScore();
}
function initializeButton(button: UpgradeButton) {
  setCost(button);
  updateButtonText(button);
  button.addEventListener("click", () => {
    buyUpgrade(button);
  });
  upgradeButtons.push(button);
}
function updateButtonText(button: UpgradeButton) {
  button.textContent =
    `Upgrade ${button.display} - Cost: ${button.cost} \n Current Level: ${button.stat}`;
}

function setCost(button: UpgradeButton) {
  button.cost = (5 ** button.stage) + 10;
}

function createFadingText(x: number, y: number, amount: number) {
  const text = document.createElement("div");
  text.className = "fading-text";
  text.textContent = `+${amount}`;
  text.style.left = `${x}px`;
  text.style.top = `${y}px`;

  app.append(text);
  setTimeout(() => {
    text.remove();
  }, 1000);
}

// UI setup
const uiContainer = document.createElement("div");
uiContainer.style.width = `${UI_WIDTH}px`;
uiContainer.style.display = "flex";
uiContainer.style.flexDirection = "column";
uiContainer.style.gap = "10px";
uiContainer.style.position = "relative";
uiContainer.style.zIndex = "5";
uiContainer.append(heading, scoreContainer);
for (const upgradeButton of upgradeButtons) {
  uiContainer.append(upgradeButton);
}

app.append(uiContainer, arrowButton, backdrop);

updateScore();
