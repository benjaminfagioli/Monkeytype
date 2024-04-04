import {
  words as en,
  palabras as es,
  palavras as pr,
  mots as fr,
  worter as de,
} from "./data.js";
const languages = { es: es, en: en, pr: pr, fr: fr, de: de };
const $time = document.querySelector("time");
const $paraghaph = document.querySelector("p");
const $input = document.querySelector("input");
const $game = document.querySelector("#game");
const $results = document.querySelector("#results");
const $wpm = document.querySelector("#wpm");
const $accuracy = document.querySelector("#accuracy");
const $reloadButton = document.querySelector("#reload-button");
const $capsLock = document.querySelector("#capsLock");
const $languagesButtons = document.querySelectorAll(".language");
const $timeButtons = document.querySelectorAll(".time");
let playing;

let INITIAL_TIME = 5;

let words = [];
let currentTime = INITIAL_TIME;

initGame(localStorage.getItem("lang") || "en");
initEvents();

function initGame(language) {
  playing = false;
  $input.value = "";
  $game.style.display = "flex";
  $results.style.display = "none";
  words = languages[language].toSorted(() => Math.random() - 0.5).slice(0, 48);
  currentTime = INITIAL_TIME;

  $time.textContent = currentTime;
  $paraghaph.innerHTML = words
    .map((word) => {
      const letters = word.split("");

      return `<word>
        ${letters.map((letter) => `<letter>${letter}</letter>`).join("")}
      </word>`;
    })
    .join("");

  const $firstWord = $paraghaph.querySelector("word");
  $firstWord.classList.add("active");

  const $firstLetter = $paraghaph.querySelector("letter");
  $firstLetter.classList.add("active");
}
function initEvents() {
  document.addEventListener("keydown", (e) => {
    if (e.getModifierState("CapsLock")) {
      $capsLock.style.backgroundColor = " var(--yellow)";
      $capsLock.style.boxShadow = "0 0 25px var(--yellow)";
    } else {
      $capsLock.style.boxShadow = "none";
      $capsLock.style.backgroundColor = "#646464";
    }
  });
  document.addEventListener("keydown", () => {
    $input.focus();
    if (!playing) {
      playing = true;
      const intervalId = setInterval(() => {
        currentTime--;
        $time.textContent = currentTime;
        if (currentTime === 0) {
          clearInterval(intervalId);
          gameOver();
        }
      }, 1000);
    }
  });
  $input.addEventListener("keydown", onKeyDown);
  $input.addEventListener("keyup", onKeyUp);
  $reloadButton.addEventListener("click", () =>
    initGame(localStorage.getItem("lang"))
  );
  $timeButtons.forEach(($timeButton) =>
    $timeButton.addEventListener("click", () => {
      if (!playing) {
        $timeButtons.forEach((l) => l.classList.remove("langActive"));
        $timeButton.classList.add("langActive");
        currentTime = $timeButton.innerText;
        $time.innerHTML = currentTime;
      }
    })
  );

  $languagesButtons.forEach(($languageButton) => {
    $languageButton.innerText == localStorage.getItem("lang") &&
      $languageButton.classList.add("langActive");

    $languageButton.addEventListener("click", () => {
      localStorage.setItem("lang", $languageButton.innerText);
      $languagesButtons.forEach((l) => l.classList.remove("langActive"));
      $languageButton.classList.add("langActive");
      initGame(localStorage.getItem("lang"));
    });
  });
}

function onKeyDown(e) {
  const $currentWord = $paraghaph.querySelector("word.active");
  const $currentLetter = $paraghaph.querySelector("letter.active");
  const { key } = e;

  if (key === " ") {
    e.preventDefault();
    const $nextWord = $currentWord.nextElementSibling;
    if ($nextWord) {
      $nextWord.classList.add("active");
      $currentWord.classList.remove("active");
      $input.value = "";
      const hasMissedLetters =
        $currentWord.querySelectorAll("letter:not(.correct)").length > 0;
      const classToAdd = hasMissedLetters ? "marked" : "correct";
      $currentWord.classList.add(classToAdd);
    }
  }

  if (key === "Backspace") {
    const $prevWord = $currentWord.previousElementSibling;
    const $prevLetter = $currentLetter.previousElementSibling;

    if (!$prevLetter && !$prevWord) {
      e.preventDefault();
      return;
    }
    const $wordMarked = [...$paraghaph.querySelectorAll("word.marked")].pop();
    if ($wordMarked && !$prevLetter) {
      e.preventDefault();
      const $letterToGo = $prevWord?.querySelector("letter:last-child");
      $letterToGo.classList.add("active");
      $wordMarked.classList.remove("marked");
      $wordMarked.classList.add("active");
      $currentWord.classList.remove("active");
      $currentLetter.classList.remove("active");
      $input.value = [
        ...$prevWord.querySelectorAll("letter.correct, letter.incorrect"),
      ]
        .map(($char) =>
          $char.classList.contains("correct") ? $char.innerText : "*"
        )
        .join("");
    }
  }
}
function onKeyUp() {
  const $currentWord = $paraghaph.querySelector("word.active");
  const $currentLetter = $paraghaph.querySelector("letter.active");

  const currentWord = $currentWord.innerText.trim();
  $input.maxLength = currentWord.length;

  const $allLetters = $currentWord.querySelectorAll("letter");

  $allLetters.forEach((letter) =>
    letter.classList.remove("correct", "incorrect")
  );

  $input.value.split("").forEach((char, index) => {
    const $letter = $allLetters[index];
    const letterToCheck = currentWord[index];
    const isCorrect = char === letterToCheck;
    const letterClass = isCorrect ? "correct" : "incorrect";

    $letter.classList.add(letterClass);
  });

  const inputLength = $input.value.length;

  $currentLetter.classList.remove("active", "is-last");
  const $nextActiveLetter = $allLetters[inputLength];
  if ($nextActiveLetter) {
    $allLetters[inputLength].classList.add("active");
  } else {
    $currentLetter.classList.add("active", "is-last");
  }
}

function gameOver() {
  $game.style.display = "none";
  $results.style.display = "flex";

  const correctWords = document.querySelectorAll("word.correct").length;
  const correctLetters = document.querySelectorAll("letter.correct").length;
  let incorrectLetters = document.querySelectorAll("letter.incorrect").length;
  const skippedLetters = [...document.querySelectorAll("word.marked")].map(
    (word) => [...word.querySelectorAll("letter:not(.correct)")].length
  );

  skippedLetters.forEach(
    (amount) => (incorrectLetters = incorrectLetters + amount)
  );

  const totalLetters = correctLetters + incorrectLetters;

  const accuracy = totalLetters > 0 ? (correctLetters / totalLetters) * 100 : 0;

  const wpm = (correctWords * 60) / INITIAL_TIME;
  $wpm.innerText = wpm;
  $accuracy.innerText = `${accuracy.toFixed(2)}%`;
}
