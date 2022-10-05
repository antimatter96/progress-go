import { render } from "lit-html";
import { templateFunc, Week } from "./week";
import { AlertHandler } from './alerts'
import dragula from "dragula";
import confetti from "canvas-confetti"
import { ensureFileExists, loadLocal, saveFile } from "./framework";

export class WeekManager {

  weeksContainer: HTMLElement;

  htmlWeeks: Array<HTMLElement>
  weeks: Array<Week>;

  alerts: AlertHandler

  lastSaveTime: number
  lastUpdateTime: number

  myConfettiCanvas: HTMLCanvasElement;

  constructor(alerts: AlertHandler) {
    this.weeksContainer = document.getElementById("weeks");

    this.weeks = [];
    this.htmlWeeks = [];

    this.alerts = alerts;


    this.lastSaveTime = Date.now();
    this.lastUpdateTime = this.lastSaveTime;

    setInterval(async () => {
      if (this.lastUpdateTime > this.lastSaveTime) {
        this.alerts.show('info', "Saving file", 10_000);
        await this.saveFile();
        this.lastSaveTime = Date.now();
        this.alerts.hide();
      }
    }, 5_000);


    this.registerDraggable();
  }

  registerWeek(week: Week) {
    let htmlcontainer = document.createElement('div');
    htmlcontainer.id = week.id;

    this.htmlWeeks.unshift(htmlcontainer);
    this.weeks.unshift(week);

    this.weeksContainer.prepend(htmlcontainer);

    let updateFunction = (done: boolean) => {
      console.log('rstart', Date.now());
      if (done) {
        this.launchConfetti();
      }
      render(templateFunc(week), htmlcontainer);
      this.lastUpdateTime = Date.now();
      console.log('rend', Date.now());
    }

    let alertFunction = (type, message) => {
      this.alerts.show(type, message, 5_000);
    }

    let deleteFucntion = () => {
      updateFunction(false)
      this.weeksContainer.removeChild(htmlcontainer);
    }
    updateFunction(false);

    week.addEventListeners();
    week.setUpdateFunction(updateFunction);
    week.setAlertFunction(alertFunction);
    week.setDeleteFunction(deleteFucntion);
  }

  createNewWeek(input): Week {
    if (input.deleted) {
      return null;
    }
    let week = new Week(input);

    this.registerWeek(week);

    return week;
  }

  launchConfetti() {
    let randCord = () => (Math.random() * (1.1 - (-0.1)) + (-0.1));
    let duration = 5 * 1000;
    let animationEnd = Date.now() + duration;
    let defaults = { startVelocity: 50, spread: 120, zIndex: 0 };

    let interval = setInterval(function () {
      let timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      let particleCount = 100 * (timeLeft / duration);
      confetti(Object.assign({}, defaults, { particleCount, origin: { x: randCord(), y: 0.1 + randCord() } }));
      confetti(Object.assign({}, defaults, { particleCount, origin: { x: randCord(), y: 0.1 + randCord() } }));
    }, 250);
  }

  registerDraggable() {
    let drake = dragula([this.weeksContainer], {
      copy: false,
      removeOnSpill: false,
      slideFactorY: 25,
      moves: (_el, _target, source, _sibling) => {
        return source.classList.contains("week-heading-draggable");
      }
    });

    drake.on("drop", (el, _target, _source, sibling) => {
      let weekThatWasMovedIndex = this.weeks.findIndex((week, index) => {
        return week.id == el.id;
      });

      let weekThatWasMoved = this.weeks[weekThatWasMovedIndex];
      this.weeks.splice(weekThatWasMovedIndex, 1);

      if (sibling == null) {
        this.weeks.push(weekThatWasMoved);
      } else {
        let weekThatComesAfterThis = this.weeks.findIndex((week, index) => {
          return week.id == sibling.id;
        });
        this.weeks.splice(weekThatComesAfterThis, 0, weekThatWasMoved);
      }

      this.saveFile();
    })
  }

  async saveFile() {
    let confirmed = await saveFile(JSON.stringify(this.weeks, null, 2));
  }

  async loadLocal() {
    let text = await loadLocal()
    let weeks = JSON.parse(text);
    for (let i = weeks.length - 1; i > -1; i--) {
      console.log("week", weeks[i]);

      this.createNewWeek(weeks[i]);
    }
  }

  static async ensureFileExists() {
    await ensureFileExists()
  }
}
