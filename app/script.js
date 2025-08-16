const RECENT_LETTERS_FILTER_SIZE = 3;
const MIN_AVAILABLE_LETTERS_THRESHOLD = 4;
const RECENT_MISTAKE_WEIGHT_MULTIPLIER = 5;
const LETTER_ADVANCE_DELAY = 30;
const SETTINGS_LETTER_ROTATION_INTERVAL = 1500;
const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24;
const TIME_WEIGHT_MINUTES = 1000 * 60 * 5;
const MIN_ENABLED_FONTS = 1;
const MIN_ENABLED_CASES = 1;
const MIN_SUCCESS_FOR_INSTALL_PROMPT = 10;
const NEEDS_WORK_ACCURACY_THRESHOLD = 80;
const MIN_ATTEMPTS_FOR_STATS = 3;
const PERCENTAGE_MULTIPLIER = 100;
const INSTALL_PROMPT_DELAY = 30000;

let hasEverTyped = localStorage.getItem("hasEverTyped") === "true";

const cyrillicCharacters = {
  А: "a",
  Б: "b",
  В: "v",
  Г: "g",
  Д: "d",
  Е: ["e", "ye"],
  Ё: ["ë", "yo"],
  Ж: "zh",
  З: "z",
  И: "i",
  Й: ["y", "j", "i"],
  К: "k",
  Л: "l",
  М: "m",
  Н: "n",
  О: "o",
  П: "p",
  Р: "r",
  С: "s",
  Т: "t",
  У: "u",
  Ф: "f",
  Х: ["kh", "h", "j"],
  Ц: "ts",
  Ч: "ch",
  Ш: "sh",
  Щ: ["shch", "sch"],
  Ы: "y",
  Э: "e",
  Ю: "yu",
  Я: "ya",
};

const uniqueLetters = Object.keys(cyrillicCharacters);

const availableFonts = [
  { id: "sans-serif", name: "Sans serif" },
  { id: "serif", name: "Serif" },
  { id: "monospace", name: "Monospace" },
  { id: "cursive", name: "Cursive" },
];

const availableCases = [
  { id: "upper", name: "Uppercase" },
  { id: "lower", name: "Lowercase" },
];

const fireIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 128 128" class="fire-icon"><radialGradient id="notoFire0" cx="68.884" cy="124.296" r="70.587" gradientTransform="matrix(-1 -.00434 -.00713 1.6408 131.986 -79.345)" gradientUnits="userSpaceOnUse"><stop offset=".314" stop-color="#ff9800"/><stop offset=".662" stop-color="#ff6d00"/><stop offset=".972" stop-color="#f44336"/></radialGradient><path fill="url(#notoFire0)" d="M35.56 40.73c-.57 6.08-.97 16.84 2.62 21.42c0 0-1.69-11.82 13.46-26.65c6.1-5.97 7.51-14.09 5.38-20.18c-1.21-3.45-3.42-6.3-5.34-8.29c-1.12-1.17-.26-3.1 1.37-3.03c9.86.44 25.84 3.18 32.63 20.22c2.98 7.48 3.2 15.21 1.78 23.07c-.9 5.02-4.1 16.18 3.2 17.55c5.21.98 7.73-3.16 8.86-6.14c.47-1.24 2.1-1.55 2.98-.56c8.8 10.01 9.55 21.8 7.73 31.95c-3.52 19.62-23.39 33.9-43.13 33.9c-24.66 0-44.29-14.11-49.38-39.65c-2.05-10.31-1.01-30.71 14.89-45.11c1.18-1.08 3.11-.12 2.95 1.5"/><radialGradient id="notoFire1" cx="64.921" cy="54.062" r="73.86" gradientTransform="matrix(-.0101 .9999 .7525 .0076 26.154 -11.267)" gradientUnits="userSpaceOnUse"><stop offset=".214" stop-color="#fff176"/><stop offset=".328" stop-color="#fff27d"/><stop offset=".487" stop-color="#fff48f"/><stop offset=".672" stop-color="#fff7ad"/><stop offset=".793" stop-color="#fff9c4"/><stop offset=".822" stop-color="#fff8bd" stop-opacity="0.804"/><stop offset=".863" stop-color="#fff6ab" stop-opacity="0.529"/><stop offset=".91" stop-color="#fff38d" stop-opacity="0.209"/><stop offset=".941" stop-color="#fff176" stop-opacity="0"/></radialGradient><path fill="url(#notoFire1)" d="M76.11 77.42c-9.09-11.7-5.02-25.05-2.79-30.37c.3-.7-.5-1.36-1.13-.93c-3.91 2.66-11.92 8.92-15.65 17.73c-5.05 11.91-4.69 17.74-1.7 24.86c1.8 4.29-.29 5.2-1.34 5.36c-1.02.16-1.96-.52-2.71-1.23a16.1 16.1 0 0 1-4.44-7.6c-.16-.62-.97-.79-1.34-.28c-2.8 3.87-4.25 10.08-4.32 14.47C40.47 113 51.68 124 65.24 124c17.09 0 29.54-18.9 19.72-34.7c-2.85-4.6-5.53-7.61-8.85-11.88"/></svg>`;

function getRandomFromArray(array) {
  return array[Math.floor(Math.random() * array.length)];
}

let settingsLetterIndex = 0;
let settingsModalUpdateInterval = null;

function getNextSettingsLetter() {
  const letter = uniqueLetters[settingsLetterIndex];
  settingsLetterIndex = (settingsLetterIndex + 1) % uniqueLetters.length;
  return letter;
}

let currentLetter = null;
let isAdvancing = false;
let attemptedThisLetter = false;
let letterStats = {};
let recentLetters = [];
let streakData = {};
let settings = {
  enabledCases: ["upper", "lower"],
  enabledLetters: [...uniqueLetters],
  smartProgression: true,
  enabledFonts: ["sans-serif"],
};

let deferredPrompt;
let installPromptShown = false;

const letterDisplay = document.getElementById("letterDisplay");
const userInput = document.getElementById("userInput");
const feedback = document.getElementById("feedback");
const card = document.querySelector(".card");
const settingsBtn = document.getElementById("settingsBtn");
const settingsModal = document.getElementById("settingsModal");
const settingsContent = document.querySelector(".settings-content");
const closeBtn = document.getElementById("closeBtn");
const letterCheckboxes = document.getElementById("letterCheckboxes");
const selectAllBtn = document.getElementById("selectAll");
const selectNoneBtn = document.getElementById("selectNone");
const smartProgressionCheckbox = document.getElementById("smartProgression");
const fontCheckboxes = document.getElementById("fontCheckboxes");
const caseCheckboxes = document.getElementById("caseCheckboxes");
const statsBar = document.getElementById("statsBar");
const statsText = document.getElementById("statsText");
const expandBtn = document.getElementById("expandBtn");
const statsExpanded = document.getElementById("statsExpanded");
const statsBreakdown = document.getElementById("statsBreakdown");
const iOSInstallPrompt = document.getElementById("ios-install-prompt");
const closeiOSInstallPrompt = document.getElementById(
  "close-ios-install-prompt"
);
const resetBtn = document.getElementById("resetBtn");
const noStats = document.getElementById("noStats");
const statsOverview = document.getElementById("statsOverview");
const letterStatsGrid = document.getElementById("letterStatsGrid");
const helpBtn = document.getElementById("helpBtn");
const helpModal = document.getElementById("helpModal");
const helpCloseBtn = document.getElementById("helpCloseBtn");
const lettersGrid = document.getElementById("lettersGrid");

function initializeStats() {
  const saved = localStorage.getItem("cyrillicStats");
  if (saved) {
    letterStats = JSON.parse(saved);
  } else {
    uniqueLetters.forEach((letter) => {
      letterStats[letter] = { mistakes: 0, successes: 0, lastSeen: 0, recentMistake: false };
    });
  }
}

function initializeStreak() {
  const saved = localStorage.getItem("cyrillicStreak");
  if (saved) {
    streakData = JSON.parse(saved);
  } else {
    streakData = {
      currentStreak: 0,
      lastPracticeDate: null,
      longestStreak: 0,
    };
  }
}

function getTodaysDate() {
  return new Date().toDateString();
}

function updateStreak() {
  const today = getTodaysDate();
  const lastDate = streakData.lastPracticeDate;

  if (lastDate === today) {
    return;
  }

  if (lastDate === null) {
    streakData.currentStreak = 1;
  } else {
    const lastDateObj = new Date(lastDate);
    const todayObj = new Date(today);
    const daysDiff = Math.floor(
      (todayObj - lastDateObj) / MILLISECONDS_PER_DAY
    );

    if (daysDiff === 1) {
      streakData.currentStreak++;
    } else {
      streakData.currentStreak = 1;
    }
  }

  streakData.lastPracticeDate = today;
  if (streakData.currentStreak > streakData.longestStreak) {
    streakData.longestStreak = streakData.currentStreak;
  }

  localStorage.setItem("cyrillicStreak", JSON.stringify(streakData));
}

function saveStats() {
  localStorage.setItem("cyrillicStats", JSON.stringify(letterStats));
  updateStatsDisplay();
}

function resetStats() {
  if (
    !confirm(
      "Are you sure you want to reset your learning stats? Your streak will be preserved. This cannot be undone."
    )
  ) {
    return;
  }

  localStorage.removeItem("cyrillicStats");

  letterStats = {};
  uniqueLetters.forEach((letter) => {
    letterStats[letter] = { mistakes: 0, successes: 0, lastSeen: 0, recentMistake: false };
  });

  saveStats();
  createDetailedStatsView();
}
function loadSettings() {
  const saved = localStorage.getItem("cyrillicSettings");
  if (saved) {
    const savedSettings = JSON.parse(saved);
    settings = { ...settings, ...savedSettings };
  }
  if (!settings.enabledFonts || settings.enabledFonts.length === 0) {
    settings.enabledFonts = ["sans-serif"];
  }
  if (!settings.enabledCases || settings.enabledCases.length === 0) {
    settings.enabledCases = ["upper", "lower"];
  }
  updateSettingsUI();
}

function saveSettings() {
  localStorage.setItem("cyrillicSettings", JSON.stringify(settings));
}

function updateSettingsUI() {
  smartProgressionCheckbox.checked = settings.smartProgression;

  const sharedPreviewLetter = getNextSettingsLetter();

  createLetterCheckboxes();
  createCaseCheckboxes(sharedPreviewLetter);
  createFontCheckboxes(sharedPreviewLetter);
}

function createLetterCheckboxes() {
  letterCheckboxes.innerHTML = "";
  uniqueLetters.forEach((letter) => {
    const div = document.createElement("div");
    div.className = "letter-checkbox";
    div.innerHTML = `
            <input type="checkbox" value="${letter}" ${
      settings.enabledLetters.includes(letter) ? "checked" : ""
    }>
            <span class="letter">${letter}</span>
        `;

    const checkbox = div.querySelector("input");

    const syncState = () => {
      if (checkbox.checked) {
        if (!settings.enabledLetters.includes(letter)) {
          settings.enabledLetters.push(letter);
        }
      } else {
        settings.enabledLetters = settings.enabledLetters.filter(
          (l) => l !== letter
        );
      }
      div.classList.toggle("selected", checkbox.checked);
      saveSettings();
      showNextLetter();
    };

    checkbox.addEventListener("change", syncState);
    div.addEventListener("click", (e) => {
      if (e.target !== checkbox) {
        e.preventDefault();
        checkbox.click();
      }
    });

    div.classList.toggle("selected", settings.enabledLetters.includes(letter));
    letterCheckboxes.appendChild(div);
  });
}

function updateFontCheckboxStates() {
  const fontCheckboxDivs = document.querySelectorAll(".font-checkbox");
  const isOnlyOneEnabled = settings.enabledFonts.length === 1;

  fontCheckboxDivs.forEach((div) => {
    const checkbox = div.querySelector("input");
    const isLastEnabled = isOnlyOneEnabled && checkbox.checked;
    div.classList.toggle("disabled", isLastEnabled);
    if (isLastEnabled) {
      div.title = "At least one font must be selected";
    } else {
      div.removeAttribute("title");
    }
  });
}

function createFontCheckboxes(sharedPreviewLetter) {
  fontCheckboxes.innerHTML = "";
  availableFonts.forEach((font) => {
    const div = document.createElement("div");
    div.className = "font-checkbox";

    div.innerHTML = `
            <input type="checkbox" value="${font.id}" ${
      settings.enabledFonts.includes(font.id) ? "checked" : ""
    }>
            <span class="font-preview font-${
              font.id
            }">${sharedPreviewLetter}</span>
            <span class="font-name">${font.name}</span>
        `;
    const checkbox = div.querySelector("input");
    const syncState = () => {
      if (checkbox.checked) {
        if (!settings.enabledFonts.includes(font.id)) {
          settings.enabledFonts.push(font.id);
        }
      } else {
        if (
          settings.enabledFonts.length <= MIN_ENABLED_FONTS &&
          settings.enabledFonts.includes(font.id)
        ) {
          checkbox.checked = true;
          return;
        }
        settings.enabledFonts = settings.enabledFonts.filter(
          (f) => f !== font.id
        );
      }
      div.classList.toggle("selected", checkbox.checked);
      saveSettings();
      updateFontCheckboxStates();
    };
    checkbox.addEventListener("change", syncState);
    div.addEventListener("click", (e) => {
      if (div.classList.contains("disabled")) {
        e.preventDefault();
        return;
      }
      if (e.target !== checkbox) {
        checkbox.checked = !checkbox.checked;
        syncState();
      }
    });
    syncState();
    fontCheckboxes.appendChild(div);
  });
  updateFontCheckboxStates();
}

function updateCaseCheckboxStates() {
  const caseCheckboxDivs = document.querySelectorAll(".case-checkbox");
  const isOnlyOneEnabled = settings.enabledCases.length === 1;

  caseCheckboxDivs.forEach((div) => {
    const checkbox = div.querySelector("input");
    const isLastEnabled = isOnlyOneEnabled && checkbox.checked;
    div.classList.toggle("disabled", isLastEnabled);
    if (isLastEnabled) {
      div.title = "At least one case must be selected";
    } else {
      div.removeAttribute("title");
    }
  });
}

function createCaseCheckboxes(sharedPreviewLetter) {
  caseCheckboxes.innerHTML = "";
  availableCases.forEach((caseOption) => {
    const div = document.createElement("div");
    div.className = "case-checkbox";
    let displayLetter = sharedPreviewLetter;
    if (caseOption.id === "upper") {
      displayLetter = sharedPreviewLetter.toUpperCase();
    } else if (caseOption.id === "lower") {
      displayLetter = sharedPreviewLetter.toLowerCase();
    }

    div.innerHTML = `
            <input type="checkbox" value="${caseOption.id}" ${
      settings.enabledCases.includes(caseOption.id) ? "checked" : ""
    }>
            <span class="case-preview">${displayLetter}</span>
            <span class="case-name">${caseOption.name}</span>
        `;
    const checkbox = div.querySelector("input");
    const syncState = () => {
      if (checkbox.checked) {
        if (!settings.enabledCases.includes(caseOption.id)) {
          settings.enabledCases.push(caseOption.id);
        }
      } else {
        if (
          settings.enabledCases.length <= MIN_ENABLED_CASES &&
          settings.enabledCases.includes(caseOption.id)
        ) {
          checkbox.checked = true;
          return;
        }
        settings.enabledCases = settings.enabledCases.filter(
          (c) => c !== caseOption.id
        );
      }
      div.classList.toggle("selected", checkbox.checked);
      saveSettings();
      updateCaseCheckboxStates();
    };
    checkbox.addEventListener("change", syncState);
    div.addEventListener("click", (e) => {
      if (div.classList.contains("disabled")) {
        e.preventDefault();
        return;
      }
      if (e.target !== checkbox) {
        checkbox.checked = !checkbox.checked;
        syncState();
      }
    });
    syncState();
    caseCheckboxes.appendChild(div);
  });
  updateCaseCheckboxStates();
}

function getAvailableLetters() {
  const available = [];
  for (const baseLetter of settings.enabledLetters) {
    if (cyrillicCharacters[baseLetter]) {
      const transliteration = cyrillicCharacters[baseLetter];
      const letterInfo = {
        spanish: Array.isArray(transliteration) ? transliteration : [transliteration],
        base: baseLetter,
      };

      const upperCase = baseLetter.toUpperCase();
      const lowerCase = baseLetter.toLowerCase();

      const hasUpper = settings.enabledCases.includes("upper");
      const hasLower = settings.enabledCases.includes("lower");

      if (hasUpper) {
        available.push({ ...letterInfo, cyrillic: upperCase });
      }
      if (hasLower) {
        available.push({ ...letterInfo, cyrillic: lowerCase });
      }
    }
  }
  return available;
}

function getWeightedRandomLetter() {
  const availableLetters = getAvailableLetters();
  if (availableLetters.length === 0) return null;

  // Filter out recently shown letters to avoid repetition
  const recentBases = recentLetters.slice(-RECENT_LETTERS_FILTER_SIZE).map((l) => l.base);
  const filteredLetters = availableLetters.filter(
    (letterObj) =>
      !recentBases.includes(letterObj.base) || availableLetters.length <= MIN_AVAILABLE_LETTERS_THRESHOLD
  );

  const lettersToChooseFrom =
    filteredLetters.length > 0 ? filteredLetters : availableLetters;

  if (!settings.smartProgression) {
    return getRandomFromArray(lettersToChooseFrom);
  }

  const now = Date.now();
  const weights = lettersToChooseFrom.map((letterObj) => {
    const stats = letterStats[letterObj.base];
    const timeSinceLastSeen = now - stats.lastSeen;
    const mistakeWeight = stats.recentMistake ? RECENT_MISTAKE_WEIGHT_MULTIPLIER : 1;
    const timeWeight = Math.min(timeSinceLastSeen / TIME_WEIGHT_MINUTES, MIN_ATTEMPTS_FOR_STATS);
    return mistakeWeight + timeWeight;
  });

  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  let random = Math.random() * totalWeight;

  for (let i = 0; i < lettersToChooseFrom.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return lettersToChooseFrom[i];
    }
  }

  return lettersToChooseFrom[0];
}

function showNextLetter() {
  currentLetter = getWeightedRandomLetter();
  if (!currentLetter) {
    letterDisplay.textContent = "!";
    userInput.style.display = "none";
    feedback.className = "feedback incorrect show";
    feedback.textContent = "Please select at least one letter to practice!";
    return;
  }

  // Show input again if it was hidden
  userInput.style.display = "";

  // Add to recent letters history
  recentLetters.push(currentLetter);
  if (recentLetters.length > RECENT_LETTERS_FILTER_SIZE) {
    recentLetters = recentLetters.slice(-RECENT_LETTERS_FILTER_SIZE);
  }

  letterDisplay.textContent = currentLetter.cyrillic;

  // Apply random font from enabled fonts
  letterDisplay.className = "letter-display";
  if (settings.enabledFonts.length > 0) {
    const selectedFont = getRandomFromArray(settings.enabledFonts);
    letterDisplay.classList.add(`font-${selectedFont}`);
  }

  userInput.value = "";
  userInput.className = "";
  card.classList.remove("incorrect");
  feedback.className = "feedback";
  feedback.textContent = "";

  // Set placeholder for first-time users
  console.log("showNextLetter: hasEverTyped =", hasEverTyped);
  if (!hasEverTyped) {
    userInput.placeholder = "Type the sound";
  } else {
    userInput.placeholder = "";
  }


  attemptedThisLetter = false;

  letterStats[currentLetter.base].lastSeen = Date.now();
}

function checkAnswer(input) {
  if (!currentLetter) {
    return false;
  }
  const userAnswer = input.toLowerCase().trim();
  return currentLetter.spanish.some(answer => answer.toLowerCase() === userAnswer);
}

function handleInput() {
  const input = userInput.value.trim();
  if (input === "" || isAdvancing) {
    userInput.className = "";
    card.classList.remove("incorrect");
    feedback.className = "feedback";
    feedback.textContent = "";
    return;
  }

  // Early return if no letter is selected
  if (!currentLetter) {
    return;
  }

  if (checkAnswer(input)) {
    isAdvancing = true;
    if (!attemptedThisLetter) {
      letterStats[currentLetter.base].successes++;
    }
    letterStats[currentLetter.base].recentMistake = false;
    updateStreak();
    saveStats();

    if (!hasEverTyped) {
      hasEverTyped = true;
      localStorage.setItem("hasEverTyped", "true");
      userInput.placeholder = "";
    }

    setTimeout(() => {
      showNextLetter();
      isAdvancing = false;
    }, LETTER_ADVANCE_DELAY);
  } else {
    const userAnswer = input.toLowerCase();
    const isValidPrefix = currentLetter.spanish.some(answer =>
      answer.toLowerCase().startsWith(userAnswer)
    );

    if (!isValidPrefix) {
      if (!attemptedThisLetter) {
        letterStats[currentLetter.base].mistakes++;
        letterStats[currentLetter.base].recentMistake = true;
        attemptedThisLetter = true;
      }
      updateStreak();
      userInput.className = "";
      card.classList.add("incorrect");
      feedback.className = "feedback incorrect show";
      feedback.textContent = currentLetter.spanish.join(" / ");
      saveStats();
    } else {
      userInput.className = "";
      card.classList.remove("incorrect");
      feedback.className = "feedback";
      feedback.textContent = "";
    }
  }
}

function updateSettingsLetterPreviews() {
  const sharedPreviewLetter = getNextSettingsLetter();

  // Update case previews
  document.querySelectorAll(".case-preview").forEach((preview) => {
    const caseType = preview.parentElement.querySelector("input").value;
    let displayLetter = sharedPreviewLetter;
    if (caseType === "upper") {
      displayLetter = sharedPreviewLetter.toUpperCase();
    } else if (caseType === "lower") {
      displayLetter = sharedPreviewLetter.toLowerCase();
    }
    preview.textContent = displayLetter;
  });

  // Update font previews
  document.querySelectorAll(".font-preview").forEach((preview) => {
    preview.textContent = sharedPreviewLetter;
  });
}

function startSettingsLetterRotation() {
  settingsModalUpdateInterval = setInterval(() => {
    updateSettingsLetterPreviews();
  }, SETTINGS_LETTER_ROTATION_INTERVAL);
}

function stopSettingsLetterRotation() {
  if (settingsModalUpdateInterval) {
    clearInterval(settingsModalUpdateInterval);
    settingsModalUpdateInterval = null;
  }
}

settingsBtn.addEventListener("click", () => {
  settingsModal.classList.add("show");
  startSettingsLetterRotation();
});

closeBtn.addEventListener("click", () => {
  settingsModal.classList.remove("show");
  stopSettingsLetterRotation();
});

settingsModal.addEventListener("click", (e) => {
  if (e.target === settingsModal) {
    settingsModal.classList.remove("show");
    stopSettingsLetterRotation();
  }
});

selectAllBtn.addEventListener("click", () => {
  settings.enabledLetters = [...uniqueLetters];
  updateSettingsUI();
  saveSettings();
  showNextLetter();
});

selectNoneBtn.addEventListener("click", () => {
  settings.enabledLetters = [];
  updateSettingsUI();
  saveSettings();
  showNextLetter();
});

smartProgressionCheckbox.addEventListener("change", (e) => {
  settings.smartProgression = e.target.checked;
  saveSettings();
});

resetBtn.addEventListener("click", resetStats);

expandBtn.addEventListener("click", () => {
  const isExpanded = statsExpanded.classList.contains("open");
  if (isExpanded) {
    statsExpanded.classList.remove("open");
    expandBtn.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M6 1V11M1 6H11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    `;
    expandBtn.title = "Show details";
  } else {
    createDetailedStatsView();
    statsExpanded.classList.add("open");
    expandBtn.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M1 6H11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    `;
    expandBtn.title = "Hide details";
  }
});

card.addEventListener("click", (e) => {
  if (e.target !== userInput) {
    userInput.focus();
  }
});

userInput.addEventListener("input", handleInput);

userInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    const input = userInput.value.trim();
    if (input === "") {
      e.preventDefault();
      if (!attemptedThisLetter) {
        letterStats[currentLetter.base].mistakes++;
        letterStats[currentLetter.base].recentMistake = true;
        attemptedThisLetter = true;
      }
      updateStreak();
      card.classList.add("incorrect");
      feedback.className = "feedback incorrect show";
      feedback.textContent = currentLetter.spanish.join(" / ");
      saveStats();
    } else if (checkAnswer(input)) {
      showNextLetter();
    } else {
      e.preventDefault();
      if (!attemptedThisLetter) {
        letterStats[currentLetter.base].mistakes++;
        letterStats[currentLetter.base].recentMistake = true;
        attemptedThisLetter = true;
      }
      updateStreak();
      card.classList.add("incorrect");
      feedback.className = "feedback incorrect show";
      feedback.textContent = currentLetter.spanish.join(" / ");
      saveStats();
    }
  }
});

closeiOSInstallPrompt.addEventListener("click", (e) => {
  e.preventDefault();
  iOSInstallPrompt.style.display = "none";
  localStorage.setItem("installPromptDismissed", "true");
});

function isiOS() {
  const isIPhoneOrIPod = navigator.userAgent.match(/ipad|ipod|iphone/i);
  const isIPadOS =
    navigator.userAgent.match(/Mac/) && navigator.maxTouchPoints > 2;
  return isIPhoneOrIPod || isIPadOS;
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

function showInstallPrompt() {
  if (installPromptShown || isStandalone()) return;

  const sessionStreak = Math.max(
    ...Object.values(letterStats).map((s) => s.successes || 0)
  );
  if (sessionStreak < MIN_SUCCESS_FOR_INSTALL_PROMPT) return;

  const dismissed = localStorage.getItem("installPromptDismissed");
  if (dismissed) return;

  installPromptShown = true;

  if (isiOS()) {
    showiOSInstallInstructions();
  } else if (deferredPrompt) {
    showInstallBanner();
  }
}

function showiOSInstallInstructions() {
  iOSInstallPrompt.style.display = "block";
}

function showInstallBanner() {
  if (
    confirm(
      "Install Cyrillic Practice app for offline access and better experience?"
    )
  ) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === "accepted") {
        console.log("User accepted install prompt");
      }
      deferredPrompt = null;
    });
  } else {
    localStorage.setItem("installPromptDismissed", "true");
  }
}

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
});

window.addEventListener("appinstalled", (e) => {
  console.log("PWA was installed");
  deferredPrompt = null;
});

function calculateOverallStats() {
  const total = Object.values(letterStats);
  const totalCorrect = total.reduce((sum, s) => sum + s.successes, 0);
  const totalAttempts = total.reduce(
    (sum, s) => sum + s.successes + s.mistakes,
    0
  );
  const accuracy =
    totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * PERCENTAGE_MULTIPLIER) : 0;
  return { totalCorrect, totalAttempts, accuracy };
}

function getLetterAccuracy(letter) {
  const stats = letterStats[letter];
  const total = stats.successes + stats.mistakes;
  return total > 0 ? Math.round((stats.successes / total) * PERCENTAGE_MULTIPLIER) : 0;
}

function getTopAndBottomLetters() {
  const letters = Object.keys(letterStats)
    .filter(
      (letter) =>
        letterStats[letter].successes + letterStats[letter].mistakes >= MIN_ATTEMPTS_FOR_STATS
    )
    .map((letter) => ({
      letter,
      accuracy: getLetterAccuracy(letter),
    }))
    .sort((a, b) => b.accuracy - a.accuracy);

  return {
    best: letters[0],
    worst: letters[letters.length - 1],
  };
}

function updateStatsDisplay() {
  const overall = calculateOverallStats();

  if (overall.totalCorrect === 0) {
    statsText.innerHTML = "<span>Start practicing to see your progress!</span>";
  } else {
    let streakText = "";
    if (streakData.currentStreak > 0) {
      streakText = `<span class="divider">•</span><span class="streak-display">${fireIconSVG} ${streakData.currentStreak}</span>`;
    }

    statsText.innerHTML = `
      <span>${overall.totalCorrect} correct</span>
      <span class="divider">•</span>
      <span>${overall.totalAttempts} shown</span>
      ${streakText}
    `;
  }

  if (statsExpanded.classList.contains("open")) {
    createDetailedStatsView();
  }
}

function createDetailedStatsView() {
  const overall = calculateOverallStats();
  const { best, worst } = getTopAndBottomLetters();

  const practiceLetters = Object.keys(letterStats)
    .filter(
      (letter) =>
        letterStats[letter].successes + letterStats[letter].mistakes > 0
    )
    .sort();

  if (practiceLetters.length === 0) {
    noStats.classList.remove("hidden");
    statsOverview.classList.add("hidden");
    letterStatsGrid.classList.add("hidden");
    return;
  }

  noStats.classList.add("hidden");
  statsOverview.classList.remove("hidden");
  letterStatsGrid.classList.remove("hidden");

  const streakDescription =
    streakData.currentStreak > 0
      ? `${fireIconSVG} ${streakData.currentStreak} day${
          streakData.currentStreak === 1 ? "" : "s"
        } streak`
      : "No current streak";
  const longestStreakText =
    streakData.longestStreak > 0
      ? ` (best: ${streakData.longestStreak} day${
          streakData.longestStreak === 1 ? "" : "s"
        })`
      : "";

  statsOverview.innerHTML = `
    <div class="overview-item"><strong>Streak:</strong> ${streakDescription}${longestStreakText}</div>
    <div class="overview-item"><strong>Accuracy:</strong> ${
      overall.accuracy
    }%</div>
    ${
      best
        ? `<div class="overview-item"><strong>Best:</strong> ${best.letter} (${best.accuracy}%)</div>`
        : ""
    }
    ${
      worst && worst.accuracy < NEEDS_WORK_ACCURACY_THRESHOLD && worst.letter !== best?.letter
        ? `<div class="overview-item"><strong>Needs work:</strong> ${worst.letter} (${worst.accuracy}%)</div>`
        : ""
    }
  `;

  letterStatsGrid.innerHTML = "";
  practiceLetters.forEach((letter) => {
    const accuracy = getLetterAccuracy(letter);
    const stats = letterStats[letter];
    const total = stats.successes + stats.mistakes;

    const div = document.createElement("div");
    div.className = "letter-stat-row";
    div.innerHTML = `
      <span class="letter-stat-letter">${letter}</span>
      <div class="letter-stat-bar">
        <div class="letter-stat-fill" style="width: ${accuracy}%" data-accuracy="${accuracy}"></div>
      </div>
      <span class="letter-stat-text">${accuracy}% (${stats.successes}/${total})</span>
    `;

    letterStatsGrid.appendChild(div);
  });
}

function createLetterGrid() {
  lettersGrid.innerHTML = "";

  Object.entries(cyrillicCharacters).forEach(([cyrillic, latin]) => {
    const letterItem = document.createElement("div");
    letterItem.className = "letter-item";
    const transliteration = Array.isArray(latin) ? latin.join(" / ") : latin;
    letterItem.innerHTML = `
      <div class="letter-cyrillic">${cyrillic}</div>
      <div class="letter-latin">${transliteration}</div>
    `;
    lettersGrid.appendChild(letterItem);
  });
}

function showHelpModal() {
  helpModal.classList.add("show");
}

function hideHelpModal() {
  helpModal.classList.remove("show");
}

helpBtn.addEventListener("click", showHelpModal);
helpCloseBtn.addEventListener("click", hideHelpModal);

helpModal.addEventListener("click", (e) => {
  if (e.target === helpModal) {
    hideHelpModal();
  }
});

initializeStats();
initializeStreak();
loadSettings();
createLetterCheckboxes();
createLetterGrid();
updateStatsDisplay();
showNextLetter();

setTimeout(() => {
  showInstallPrompt();
}, INSTALL_PROMPT_DELAY);
