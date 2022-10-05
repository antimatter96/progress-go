import { html } from 'lit-html';

const minuteSeconds = /^\d+:[0-5]\d$/;

export class FormHandler {

  titleInput: HTMLInputElement;

  activities: HTMLInputElement;
  tutorials: HTMLInputElement;
  assignments: HTMLInputElement;

  factor: HTMLInputElement;
  assignmentTime: HTMLInputElement;

  videos: HTMLInputElement;

  hasProgrammable: HTMLInputElement;
  programmingGraded: HTMLInputElement;
  programmingPractice: HTMLInputElement;
  programmingTime: HTMLInputElement;

  constructor() { }

  validate() {
    this.titleInput = document.getElementById("input-title") as HTMLInputElement;

    this.activities = document.getElementById("input-activities") as HTMLInputElement;
    this.tutorials = document.getElementById("input-tutorials") as HTMLInputElement;
    this.assignments = document.getElementById("input-assignments") as HTMLInputElement;

    this.factor = document.getElementById("input-factor") as HTMLInputElement;
    this.assignmentTime = document.getElementById("input-assignment-time") as HTMLInputElement;

    this.videos = document.getElementById("input-videos") as HTMLInputElement;

    this.hasProgrammable = document.getElementById("input-hasProgrammable") as HTMLInputElement;
    this.programmingGraded = document.getElementById("input-programming-graded") as HTMLInputElement;
    this.programmingPractice = document.getElementById("input-programming-practice") as HTMLInputElement;
    this.programmingTime = document.getElementById("input-programming-time") as HTMLInputElement;

    console.log(
      this.titleInput,
      this.activities,
      this.tutorials,
      this.assignments,
      this.factor,
      this.videos,
      this.hasProgrammable,
      this.programmingGraded,
      this.programmingPractice,
      this.programmingTime,
    );

    let errors = <any>[];

    console.log("titleInput", this.titleInput.value);
    console.log("activities", this.activities.value);
    console.log("tutorials", this.tutorials.value);
    console.log("assignments", this.assignments.value);
    console.log("factor", this.factor.value);
    console.log("videos", this.videos.value);
    console.log("assignmentTime", this.assignmentTime.value);
    console.log("hasProgrammable", this.hasProgrammable.checked);
    console.log("programmingGraded", this.programmingGraded.value);
    console.log("programmingPractice", this.programmingPractice.value);
    console.log("programmingTime", this.programmingTime.value);

    [this.titleInput].forEach((ele) => {
      let title = ele.value;

      if (title.trim().length == 0) {
        errors.push(`- Title is required`);
      }
    });

    [this.activities, this.tutorials, this.assignments, this.assignmentTime].forEach((ele) => {
      let val = parseInt(ele.value, 10);
      if (Number.isInteger(val) && val >= 0) {
      } else {
        errors.push(`- '${ele.dataset.name}' should be a non-negative integer`);
      }
    });

    [this.factor].forEach((ele) => {
      let val = parseFloat(ele.value);
      if (Number.isFinite(val) && val >= 0.0) {
      } else {
        errors.push(`- '${ele.dataset.name}' should be a non-negative number`);
      }
    });

    if (this.hasProgrammable.checked) {
      [this.programmingGraded, this.programmingPractice, this.programmingTime].forEach((ele) => {
        let val = parseInt(ele.value, 10);
        if (Number.isInteger(val) && val >= 0) {
        } else {
          errors.push(`- '${ele.dataset.name}' should be a non-negative integer`);
        }
      });
    }

    let value = this.videos.value;
    let arr = value.trim().split(/\s/ig);

    for (let i = 0; i < arr.length; i++) {
      if (arr[i].length > 0 && !arr[i].match(minuteSeconds)) {
        errors.push(`- '${arr[i]}' is not a valid video time`)
      }
    }

    return errors;
  }

  /**
    name = "Sample Week 1";
    factor = 1;
    solvableTime = 20;

    solvable = {
      activities: { total: 3, left: 3 },
      tutorials: { total: 2, left: 2 },
      practice: { total: 1, left: 1 },
      graded: { total: 1, left: 1 },
    };

    programmable = {
      practice: { total: 1, left: 1 },
      graded: { total: 1, left: 1 },
    };

    hasProgrammable = true;
    programmingTime = 20;

    videos = [{ m: 40, s: 10, seen: false }];
   */
  submit() {
    let input = {
      name: this.titleInput.value.trim(),
      factor: parseFloat(this.factor.value),
      solvableTime: parseInt(this.assignmentTime.value, 10),

      solvable: {
        activities: { total: parseInt(this.activities.value, 10), left: 3 },
        tutorials: { total: parseInt(this.tutorials.value, 10), left: 2 },
        assignments: { total: parseInt(this.assignments.value, 10), left: 1 },
      },

      programmable: {
        graded: { total: parseInt(this.programmingGraded.value, 10), left: 3 },
        practice: { total: parseInt(this.programmingPractice.value, 10), left: 2 },
      },

      videos: <any>[],

      hasProgrammable: false,
      programmableTime: 0,
    }

    Object.keys(input.solvable).forEach((key) => {
      input.solvable[key].left = input.solvable[key].total;
    })

    if (this.hasProgrammable.checked) {
      input.hasProgrammable = true;

      input.programmableTime = parseInt(this.programmingTime.value, 10);

      Object.keys(input.programmable).forEach((key) => {
        input.programmable[key].left = input.programmable[key].total;
      });
    }

    let value = this.videos.value;
    let arr = value.trim().split(/\s/ig);

    for (let i = 0; i < arr.length; i++) {
      if (arr[i].length === 0) {
        continue;
      }
      let split = arr[i].split(':')
      input.videos.push({
        m: parseInt(split[0], 10),
        s: parseInt(split[1], 10),
        seen: false,
      });
    }

    return input;
  }
}

export function formTemplate(visible: boolean) {
  return html`
    <div ?hidden=${!visible} id="form-enclosure" class="container items-center bg-white my-4 better-shadow">
    <div class="rounded-lg">

      <div class="py-2 px-5 mx-auto border-b-2 border-gray-600">
        <h2 class="text-2xl font-bold text-black">Add a new week</h2>
      </div>

      <form id="add-form" class="w-full px-12 pt-4 pb-5">
        <div class="w-full mx-auto">

          <div class="flex flex-wrap mb-2 p-4">

            <div class="px-1 w-4/5">
              <label class="basic-label tracking-wide text-left" for="input-title">
                Title
              </label>
              <input id='input-title' required class="basic-input" type="text" placeholder="Maths Week 1">
            </div>

            <div class="px-1 w-1/5">
              <label class="basic-label text-center" for="input-factor">
                Factor
              </label>
              <input id='input-factor' data-name='Factor' required class="text-center basic-input"
                type="number" min="0.05" step="0.05" placeholder="0.75">
            </div>

          </div>

          <div class="flex justify-between flex-wrap mb-2 p-4">

            <div class="px-1 w-1/5">
              <label class="basic-label text-center" for="input-activities">
                Activities
              </label>
              <input id='input-activities' data-name='Activities' required class="text-center basic-input"
                type="number" min="0" step="1" placeholder="1">
            </div>

            <div class="px-1 w-1/5">
              <label class="basic-label text-center" for="input-tutorials">
                Tutorials
              </label>
              <input id='input-tutorials' data-name='Tutorials' required class="text-center basic-input"
                type="number" min="0" step="1" placeholder="1">
            </div>

            <div class="px-1 w-1/5">
              <label class="basic-label text-center" for="input-assignments">
                Assignments
              </label>
              <input id='input-assignments' data-name='Assignments' required class="text-center basic-input"
                type="number" min="0" step="1" placeholder="2">
            </div>

            <div class="px-1 w-2/5">
              <label class="basic-label text-center" for="input-assignment-time">
                Time per Assignment
              </label>
              <input id='input-assignment-time' data-name='Assignment Time' required class="text-center basic-input"
                type="number" min="0" step="5" placeholder="30">
            </div>

          </div>

          <div class="flex justify-between flex-wrap mb-2 p-4">

            <div class="px-1 w-1/5">
              <label class="basic-label text-center" for="input-hasProgrammable">
                Programming
              </label>
              <div class="w-full h-4"></div>
              <input id="input-hasProgrammable" type="checkbox" class="mx-auto w-1/5 block" />
            </div>

            <div class="px-1 w-1/5">
              <label class="basic-label text-center" for="input-programming-practice">
                Practice
              </label>
              <input id='input-programming-practice' data-name='Programming Practice' required class="text-center basic-input"
                type="number" min="0" step="1" placeholder="2">
            </div>

            <div class="px-1 w-1/5">
              <label class="basic-label text-center" for="input-programming-graded">
                Graded
              </label>
              <input id='input-programming-graded' data-name='Programming Graded' required class="text-center basic-input"
                type="number" min="0" step="1" placeholder="2">
            </div>

            <div class="px-1 w-2/5">
              <label class="basic-label text-center" for="input-programming-time">
                Time per program
              </label>
              <input id='input-programming-time' data-name='Programming Time' required class="text-center basic-input"
                type="number" min="0" step="5" placeholder="30">
            </div>

          </div>

          <div class="p-4">
            <label class="basic-label">
              Video Lengths
            </label>
              <textarea id='input-videos' class="basic-input" rows="4"
                placeholder="10:59  12:22"></textarea>
          </div>

          <div class="mt-4 shadow-md">
            <button type="submit"
              class="w-full py-3 font-semibold leading-none text-white bg-lime-500 text-xl">
              ADD
            </button>
          </div>
        </div>

      </form>
    </div>
  </div>
  `
}
