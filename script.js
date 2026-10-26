let seconds = 0;
let interval = null;

const clock = document.querySelector("#clock");
const startButton = document.querySelector("#start");
const pauseButton = document.querySelector("#pause");
const resetButton = document.querySelector("#reset");
const timerMessage = document.querySelector("#timer-message");

function updateClock() {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  clock.textContent =
    String(minutes).padStart(2, "0") + ":" +
    String(remainingSeconds).padStart(2, "0");
}

startButton.addEventListener("click", function() {
  if (interval !== null) return;

  timerMessage.textContent = "Enjoy your practice ♫";

  interval = setInterval(function() {
    seconds++;
    updateClock();
  }, 1000);
});

pauseButton.addEventListener("click", function() {
  clearInterval(interval);
  interval = null;
  timerMessage.textContent = "Paused. Take a breath.";
});

resetButton.addEventListener("click", function() {
  clearInterval(interval);
  interval = null;
  seconds = 0;
  updateClock();
  timerMessage.textContent = "Ready when you are ♫";
});

updateClock();

/* PRACTICE CALENDAR */

// 1. Find the parts of the calendar in our HTML
const calendarDays = document.querySelector("#calendar-days");
const monthTitle = document.querySelector("#month-title");
const selectedDateTitle = document.querySelector("#selected-date");
const dayStatus = document.querySelector("#day-status");
const togglePracticeButton = document.querySelector("#toggle-practice");
const calendarSummary = document.querySelector("#calendar-summary");

// 2. Choose a name for our saved data
const practiceStorageKey = "pianoAtelierPracticeDays";

// 3. Load previously saved practice days
let practicedDays = [];

try {
  practicedDays = JSON.parse(
    localStorage.getItem(practiceStorageKey) || "[]"
  );

  if (!Array.isArray(practicedDays)) {
    practicedDays = [];
  }
} catch (error) {
  practicedDays = [];
}

// 4. Remember which date and month we are viewing
let selectedDate = new Date();
let visibleMonth = new Date(
  selectedDate.getFullYear(),
  selectedDate.getMonth(),
  1
);

// Turn a date into a consistent YYYY-MM-DD label
function getDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return year + "-" + month + "-" + day;
}

// Save our practice days in the browser
function savePracticeDays() {
  localStorage.setItem(
    practiceStorageKey,
    JSON.stringify(practicedDays)
  );
}

// 5. Update the selected day's information
function updateSelectedDay() {
  const key = getDateKey(selectedDate);
  const hasPractised = practicedDays.includes(key);

  selectedDateTitle.textContent =
    selectedDate.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });

  dayStatus.textContent = hasPractised
    ? "Practice recorded! Lovely work. ♫"
    : "No practice recorded for this day yet.";

  togglePracticeButton.textContent = hasPractised
    ? "Remove practice record"
    : "Mark as practised ♫";

 
  calendarSummary.textContent =
    "You've practised on " +
    practicedDays.length +
    (practicedDays.length === 1 ? " day." : " days.");

  updateStreakCounter();
}


// 6. Draw the dates for the displayed month
function renderCalendar() {
  calendarDays.innerHTML = "";

  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();

  monthTitle.textContent = visibleMonth.toLocaleDateString(
    "en-GB",
    { month: "long", year: "numeric" }
  );

  const firstDay = new Date(year, month, 1);

  // JavaScript counts Sunday as 0.
  // This converts the calendar to start on Monday.
  const startingSpace = (firstDay.getDay() + 6) % 7;

  const numberOfDays = new Date(year, month + 1, 0).getDate();

  // Add empty spaces before the first date
  for (let i = 0; i < startingSpace; i++) {
    const emptySpace = document.createElement("span");
    emptySpace.className = "calendar-empty";
    calendarDays.appendChild(emptySpace);
  }

  // Create one button for every date
  for (let day = 1; day <= numberOfDays; day++) {
    const date = new Date(year, month, day);
    const key = getDateKey(date);

    const dayButton = document.createElement("button");
    dayButton.className = "calendar-day";
    dayButton.textContent = day;
    dayButton.setAttribute("aria-label", key);

    if (practicedDays.includes(key)) {
      dayButton.classList.add("is-practised");
    }

    if (key === getDateKey(selectedDate)) {
      dayButton.classList.add("is-selected");
      dayButton.setAttribute("aria-pressed", "true");
    } else {
      dayButton.setAttribute("aria-pressed", "false");
    }

    if (key === getDateKey(new Date())) {
      dayButton.classList.add("is-today");
    }

    dayButton.addEventListener("click", function() {
      selectedDate = date;
      updateSelectedDay();
      renderCalendar();
    });

    calendarDays.appendChild(dayButton);
  }

  updateSelectedDay();
}

// 7. Record or remove practice for the selected date
togglePracticeButton.addEventListener("click", function() {
  const key = getDateKey(selectedDate);

  if (practicedDays.includes(key)) {
    practicedDays = practicedDays.filter(function(day) {
      return day !== key;
    });
  } else {
    practicedDays.push(key);
  }

  savePracticeDays();
  renderCalendar();
});

// 8. Move between months
document.querySelector("#previous-month").addEventListener(
  "click",
  function() {
    visibleMonth = new Date(
      visibleMonth.getFullYear(),
      visibleMonth.getMonth() - 1,
      1
    );

    selectedDate = new Date(
      visibleMonth.getFullYear(),
      visibleMonth.getMonth(),
      1
    );

    renderCalendar();
  }
);

document.querySelector("#next-month").addEventListener(
  "click",
  function() {
    visibleMonth = new Date(
      visibleMonth.getFullYear(),
      visibleMonth.getMonth() + 1,
      1
    );

    selectedDate = new Date(
      visibleMonth.getFullYear(),
      visibleMonth.getMonth(),
      1
    );

    renderCalendar();
  }
);

// 9. Clear every saved practice day
document.querySelector("#clear-practice").addEventListener(
  "click",
  function() {
    practicedDays = [];
    savePracticeDays();
    renderCalendar();
  }
);

// 10. Display the calendar when the page opens


/* PRACTICE STREAK COUNTER */

// Find the places where the streak will be displayed
const currentStreakDisplay =
  document.querySelector("#current-streak");

const longestStreakDisplay =
  document.querySelector("#longest-streak");

const streakMessage =
  document.querySelector("#streak-message");

// Convert YYYY-MM-DD into a number of UTC days.
// This helps us compare dates without daylight-saving errors.
function dateNumber(dateKey) {
  const parts = dateKey.split("-").map(Number);

  return Date.UTC(
    parts[0],
    parts[1] - 1,
    parts[2]
  ) / 86400000;
}

function updateStreakCounter() {
  // Remove duplicate dates and sort them oldest to newest
  const dates = [...new Set(practicedDays)]
    .filter(function(key) {
      return /^\d{4}-\d{2}-\d{2}$/.test(key);
    })
    .sort();

  // Find the longest streak ever recorded
  let longest = 0;
  let run = 0;
  let previousDay = null;

  dates.forEach(function(key) {
    const number = dateNumber(key);

    if (number === previousDay) {
      return;
    }

    if (previousDay !== null && number === previousDay + 1) {
      run++;
    } else {
      run = 1;
    }

    longest = Math.max(longest, run);
    previousDay = number;
  });

  // Find today's date and yesterday's date
  const today = getDateKey(new Date());

  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);

  const yesterday = getDateKey(yesterdayDate);

  // A current streak can end today or yesterday
  let current = 0;
  let streakEnd = null;

  if (dates.includes(today)) {
    streakEnd = today;
  } else if (dates.includes(yesterday)) {
    streakEnd = yesterday;
  }

  // Count backwards through consecutive practice days
  if (streakEnd !== null) {
    let dayNumber = dateNumber(streakEnd);

    while (dates.includes(
      new Date(dayNumber * 86400000)
        .toISOString()
        .slice(0, 10)
    )) {
      current++;
      dayNumber--;
    }
  }

  // Display the results
  currentStreakDisplay.textContent = current;
  longestStreakDisplay.textContent = longest;

  if (current === 0) {
    streakMessage.textContent =
      "Ready to begin a new streak? ♫";
  } else if (current === 1) {
    streakMessage.textContent =
      "Your streak has begun. See you tomorrow! ♫";
  } else {
    streakMessage.textContent =
      current + " consecutive days. Keep the music going! ♫";
  }
}
renderCalendar();

/* REPERTOIRE PROGRESS TRACKER */


/* CUSTOMISABLE REPERTOIRE */

const progressStorageKey = "pianoAtelierRepertoireProgress";
const titleStorageKey = "pianoAtelierCustomTitles";
const repertoireCollectionKey = "pianoAtelierRepertoirePieces";

const progressNotes = {
  learning: "Take it slowly. Learn a little at a time. ♫",
  improving: "You're polishing your musical details. ♫",
  ready: "Wonderful! Ready to share your music. ♫"
};

function readRepertoireObject(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "{}");
    return value && typeof value === "object" && !Array.isArray(value)
      ? value
      : {};
  } catch (error) {
    return {};
  }
}

let savedProgress = readRepertoireObject(progressStorageKey);
let savedTitles = readRepertoireObject(titleStorageKey);

const progressCount = document.getElementById("progress-count");
const progressFill = document.getElementById("progress-fill");
const progressMessage = document.getElementById("progress-message");
const repertoireList = document.getElementById("repertoire-list");
const addRepertoireForm = document.getElementById("add-repertoire-form");
const newPieceComposer = document.getElementById("new-piece-composer");
const newPieceTitle = document.getElementById("new-piece-title");
const repertoireFormMessage = document.getElementById("repertoire-form-message");

const originalPieces = [
  {
    id: "debusy-status",
    noteId: "debusy-note",
    composerInputId: "debusy-composer",
    titleInputId: "debusy-title",
    composerKey: "debussyComposer",
    titleKey: "debussyTitle",
    composer: "CLAUDE DEBUSSY",
    title: "La plus que lente"
  },
  {
    id: "beethoven-status",
    noteId: "beethoven-note",
    composerInputId: "beethoven-composer",
    titleInputId: "beethoven-title",
    composerKey: "beethovenComposer",
    titleKey: "beethovenTitle",
    composer: "LUDWIG VAN BEETHOVEN",
    title: "Pathétique Sonata — Movement II"
  },
  {
    id: "mozart-status",
    noteId: "mozart-note",
    composerInputId: "mozart-composer",
    titleInputId: "mozart-title",
    composerKey: "mozartComposer",
    titleKey: "mozartTitle",
    composer: "WOLFGANG AMADEUS MOZART",
    title: "Little Rondo — Piano Sonata No. 15"
  }
];

let repertoirePieces = [];

try {
  const storedPieces = JSON.parse(
    localStorage.getItem(repertoireCollectionKey) || "null"
  );

  if (
    Array.isArray(storedPieces) &&
    storedPieces.every(function(piece) {
      return piece &&
        typeof piece.id === "string" &&
        typeof piece.noteId === "string" &&
        typeof piece.composerInputId === "string" &&
        typeof piece.titleInputId === "string" &&
        typeof piece.composer === "string" &&
        typeof piece.title === "string" &&
        ["learning", "improving", "ready"].includes(piece.status);
    })
  ) {
    repertoirePieces = storedPieces;
  }
} catch (error) {
  repertoirePieces = [];
}

// If this is the first use, restore your original three pieces
// using the titles and progress already saved in your browser.
if (repertoirePieces.length === 0) {
  let collectionExists = false;

  try {
    collectionExists = localStorage.getItem(repertoireCollectionKey) !== null;
  } catch (error) {
    // Continue with the original pieces if storage cannot be read.
  }

  if (!collectionExists) {
    repertoirePieces = originalPieces.map(function(piece) {
      return {
        ...piece,
        composer: savedTitles[piece.composerKey] || piece.composer,
        title: savedTitles[piece.titleKey] || piece.title,
        status: ["learning", "improving", "ready"].includes(
          savedProgress[piece.id]
        ) ? savedProgress[piece.id] : "learning"
      };
    });
  }
}

function saveRepertoire() {
  try {
    localStorage.setItem(
      repertoireCollectionKey,
      JSON.stringify(repertoirePieces)
    );

    const statuses = {};

    repertoirePieces.forEach(function(piece) {
      statuses[piece.id] = piece.status;
    });

    localStorage.setItem(progressStorageKey, JSON.stringify(statuses));

    // Keep the original title-storage keys working.
    repertoirePieces.forEach(function(piece) {
      if (piece.composerKey) {
        savedTitles[piece.composerKey] = piece.composer;
      }

      if (piece.titleKey) {
        savedTitles[piece.titleKey] = piece.title;
      }
    });

    localStorage.setItem(titleStorageKey, JSON.stringify(savedTitles));

    return true;
  } catch (error) {
    console.error("Unable to save repertoire:", error);

    if (repertoireFormMessage) {
      repertoireFormMessage.textContent =
        "Your changes are visible, but your browser couldn't save them.";
    }

    return false;
  }
}

function updateRepertoireProgress() {
  const readyCount = repertoirePieces.filter(function(piece) {
    return piece.status === "ready";
  }).length;

  if (progressCount) {
    progressCount.textContent =
      readyCount + " of " + repertoirePieces.length +
      " pieces performance-ready";
  }

  const percentage = repertoirePieces.length
    ? (readyCount / repertoirePieces.length) * 100
    : 0;

  if (progressFill) {
    progressFill.style.width = percentage + "%";
  }

  if (progressMessage) {
    if (repertoirePieces.length === 0) {
      progressMessage.textContent =
        "Add your first piece to begin your musical journey. ♫";
    } else if (readyCount === repertoirePieces.length) {
      progressMessage.textContent =
        "Every piece is performance-ready. Bravo! ♫";
    } else if (readyCount === 0) {
      progressMessage.textContent =
        "Your musical journey is underway. Keep going! ♫";
    } else {
      progressMessage.textContent =
        "Lovely progress. Keep nurturing your repertoire. ♫";
    }
  }
}


function createRepertoireCard(piece) {
  const article = document.createElement("article");
  article.className = "piece-progress";

  const top = document.createElement("div");
  top.className = "piece-top";

  const details = document.createElement("div");

  const composer = document.createElement("input");
  composer.type = "text";
  composer.id = piece.composerInputId;
  composer.className = "piece-composer-input";
  composer.maxLength = 100;
  composer.value = piece.composer;
  composer.setAttribute("aria-label", "Composer name");
  composer.disabled = true;

  const title = document.createElement("input");
  title.type = "text";
  title.id = piece.titleInputId;
  title.className = "piece-title-input";
  title.maxLength = 100;
  title.value = piece.title;
  title.setAttribute("aria-label", "Piece title");
  title.disabled = true;

  details.append(composer, title);

  const symbol = document.createElement("span");
  symbol.className = "music-symbol";
  symbol.textContent = "♫";
  top.append(details, symbol);

  const statusLabel = document.createElement("label");
  statusLabel.htmlFor = piece.id;
  statusLabel.textContent = "Current status";

  const select = document.createElement("select");
  select.id = piece.id;
  select.className = "piece-status";

  [
    ["learning", "Learning"],
    ["improving", "Improving"],
    ["ready", "Performance-ready"]
  ].forEach(function(optionData) {
    const option = document.createElement("option");
    option.value = optionData[0];
    option.textContent = optionData[1];
    select.appendChild(option);
  });

  select.value = piece.status;

  select.addEventListener("change", function() {
    piece.status = select.value;
    saveRepertoire();
    updateRepertoireProgress();
  });

  const note = document.createElement("p");
  note.className = "piece-note";
  note.id = piece.noteId;
  note.textContent = progressNotes[piece.status];

  const editButton = document.createElement("button");
  editButton.type = "button";
  editButton.className = "remove-piece-button";
  editButton.textContent = "Edit details";

  editButton.addEventListener("click", function() {
    if (composer.disabled) {
      composer.disabled = false;
      title.disabled = false;
      editButton.textContent = "Save details";
      title.focus();
      return;
    }

    const newComposer = composer.value.trim();
    const newTitle = title.value.trim();

    if (!newComposer || !newTitle) {
      alert("Please enter both a composer and a piece title.");
      return;
    }

    const duplicate = repertoirePieces.some(function(item) {
      return item.id !== piece.id &&
        item.composer.trim().toLowerCase() === newComposer.toLowerCase() &&
        item.title.trim().toLowerCase() === newTitle.toLowerCase();
    });

    if (duplicate) {
      alert("That piece is already in your repertoire.");
      return;
    }

    piece.composer = newComposer;
    piece.title = newTitle;
    saveRepertoire();

    composer.disabled = true;
    title.disabled = true;
    editButton.textContent = "Edit details";
  });

  const removeButton = document.createElement("button");
  removeButton.type = "button";
  removeButton.className = "remove-piece-button";
  removeButton.textContent = "Remove piece";

  removeButton.addEventListener("click", function() {
    const name = piece.title.trim() || "this piece";

    if (!confirm('Remove "' + name + '" from your repertoire?')) {
      return;
    }

    repertoirePieces = repertoirePieces.filter(function(item) {
      return item.id !== piece.id;
    });

    saveRepertoire();
    renderRepertoire();

    if (repertoireFormMessage) {
      repertoireFormMessage.textContent =
        "Piece removed from your repertoire.";
    }
  });

  article.append(
    top,
    statusLabel,
    select,
    note,
    editButton,
    removeButton
  );

  return article;
}


function renderRepertoire() {
  if (!repertoireList) return;

  const searchInput =
    document.getElementById("repertoire-search-input");

  const searchCount =
    document.getElementById("repertoire-search-count");

  const searchTerm = searchInput
    ? searchInput.value.trim().toLowerCase()
    : "";

  const filteredPieces = repertoirePieces.filter(function(piece) {
    return (
      piece.composer.toLowerCase().includes(searchTerm) ||
      piece.title.toLowerCase().includes(searchTerm)
    );
  });

  repertoireList.replaceChildren();

  filteredPieces.forEach(function(piece) {
    repertoireList.appendChild(createRepertoireCard(piece));
  });

  if (searchCount) {
    searchCount.textContent = searchTerm
      ? filteredPieces.length + " of " + repertoirePieces.length + " pieces found"
      : repertoirePieces.length + " pieces in your repertoire";
  }

  updateRepertoireProgress();
}

const repertoireSearchInput =
  document.getElementById("repertoire-search-input");

if (repertoireSearchInput) {
  repertoireSearchInput.addEventListener("input", renderRepertoire);
}

if (addRepertoireForm) {
  addRepertoireForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const composer = newPieceComposer.value.trim();
    const title = newPieceTitle.value.trim();

    if (!composer || !title) {
      repertoireFormMessage.textContent =
        "Please enter both a composer and a piece title.";
      return;
    }
const duplicate = repertoirePieces.some(function(piece) {
  return (
    piece.composer.trim().toLowerCase() === composer.toLowerCase() &&
    piece.title.trim().toLowerCase() === title.toLowerCase()
  );
});

if (duplicate) {
  repertoireFormMessage.textContent =
    "That piece is already in your repertoire. ♫";
  return;
}
    const uniqueId = "repertoire-" +
      Date.now() + "-" +
      Math.random().toString(16).slice(2);

    repertoirePieces.push({
      id: uniqueId + "-status",
      noteId: uniqueId + "-note",
      composerInputId: uniqueId + "-composer",
      titleInputId: uniqueId + "-title",
      composer: composer,
      title: title,
      status: "learning"
    });

    saveRepertoire();
    renderRepertoire();
    addRepertoireForm.reset();

    repertoireFormMessage.textContent =
      "Your new piece has been added! ♫";
  });
}

// Save the current list and show it when the page opens.
saveRepertoire();
renderRepertoire();



/* ACHIEVEMENT WALL: SAVE, DISPLAY AND DELETE */

const achievementStorageKey = "pianoAtelierAchievements";

const achievementForm = document.getElementById("achievement-form");
const achievementTitleInput = document.getElementById("achievement-title");
const achievementDateInput = document.getElementById("achievement-date");
const achievementNoteInput = document.getElementById("achievement-note");
const achievementList = document.getElementById("achievement-list");
const achievementCount = document.getElementById("achievement-count");
const achievementEmpty = document.getElementById("achievement-empty");

// Use today's date as the default.
const today = new Date();
const localToday = [
  today.getFullYear(),
  String(today.getMonth() + 1).padStart(2, "0"),
  String(today.getDate()).padStart(2, "0")
].join("-");

achievementDateInput.value = localToday;
achievementDateInput.max = localToday;

// Load previously saved achievements.
let achievements = [];

try {
  const savedAchievements = JSON.parse(
    localStorage.getItem(achievementStorageKey) || "[]"
  );

  if (Array.isArray(savedAchievements)) {
    achievements = savedAchievements.filter(function(item) {
      return item &&
        typeof item.id === "string" &&
        typeof item.title === "string" &&
        typeof item.date === "string" &&
        typeof item.note === "string";
    });
  }
} catch (error) {
  achievements = [];
}

// Save the current collection.
function saveAchievements() {
  try {
    localStorage.setItem(
      achievementStorageKey,
      JSON.stringify(achievements)
    );
  } catch (error) {
    console.error("Could not save achievements:", error);
    alert("Your achievements could not be saved in this browser.");
  }
}

// Display the achievements on the wall.
function renderAchievements() {
  achievementList.replaceChildren();

  achievementCount.textContent =
    achievements.length + (
      achievements.length === 1
        ? " achievement collected"
        : " achievements collected"
    );

  achievementEmpty.hidden = achievements.length > 0;

  // Show the newest achievement first.
  const newestFirst = [...achievements].reverse();

  newestFirst.forEach(function(achievement) {
    const card = document.createElement("article");
    card.className = "achievement-card";

    const icon = document.createElement("div");
    icon.className = "achievement-card-icon";
    icon.textContent = "🏆";

    const title = document.createElement("h4");
    title.textContent = achievement.title;

    const date = document.createElement("p");
    date.className = "achievement-card-date";

    const parsedDate = new Date(achievement.date + "T00:00:00");
    date.textContent = Number.isNaN(parsedDate.getTime())
      ? achievement.date
      : parsedDate.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric"
        });

    card.append(icon, title, date);

    if (achievement.note.trim()) {
      const note = document.createElement("p");
      note.className = "achievement-card-note";
      note.textContent = achievement.note;
      card.appendChild(note);
    }

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "achievement-delete-button";
    deleteButton.textContent = "Remove achievement";

    deleteButton.addEventListener("click", function() {
      const shouldDelete = confirm(
        "Remove this achievement from your wall?"
      );

      if (!shouldDelete) return;

      achievements = achievements.filter(function(item) {
        return item.id !== achievement.id;
      });

      saveAchievements();
      renderAchievements();
    });

    card.appendChild(deleteButton);
    achievementList.appendChild(card);
  });
}

// Add a new achievement when the form is submitted.
achievementForm.addEventListener("submit", function(event) {
  event.preventDefault();

  const title = achievementTitleInput.value.trim();
  const date = achievementDateInput.value;
  const note = achievementNoteInput.value.trim();

  if (!title || !date) return;

  if (date > localToday) {
    alert("Please choose today or an earlier date.");
    return;
  }

  const newAchievement = {
    id: String(Date.now()) + "-" + Math.random().toString(16).slice(2),
    title: title,
    date: date,
    note: note
  };

  achievements.push(newAchievement);
  saveAchievements();
  renderAchievements();

  // Clear the form ready for your next milestone.
  achievementForm.reset();
  achievementDateInput.value = localToday;
});

// Display saved achievements when the page opens.
renderAchievements();

/* MY MUSIC LIBRARY: ADD, EDIT, SEARCH AND SAVE */

const musicLibraryStorageKey = "pianoAtelierMusicLibrary";

const musicForm = document.getElementById("library-track-form");
const musicTitleInput = document.getElementById("library-title");
const musicArtistInput = document.getElementById("library-artist");
const musicYoutubeInput = document.getElementById("library-youtube");
const musicCategoryInput = document.getElementById("library-category");
const musicDescriptionInput = document.getElementById("library-description");

const musicSearchInput = document.getElementById("library-search");
const musicFilterInput = document.getElementById("library-filter");
const musicFavouritesOnly = document.getElementById("library-favourites-only");
const musicGrid = document.getElementById("library-track-grid");
const musicCount = document.getElementById("library-results-count");
const musicEmpty = document.getElementById("library-empty-message");
const musicFormHeading = document.getElementById("library-form-heading");
const musicSubmitButton = document.getElementById("library-submit");
const musicCancelButton = document.getElementById("library-cancel");
const musicFormMessage = document.getElementById("library-form-message");

let musicTracks = [];
let editingMusicTrackId = null;

// Read saved tracks without disturbing other localStorage data.
try {
  const savedMusicTracks = JSON.parse(
    localStorage.getItem(musicLibraryStorageKey) || "[]"
  );

  if (Array.isArray(savedMusicTracks)) {
    musicTracks = savedMusicTracks.filter(function(track) {
      return track &&
        typeof track.id === "string" &&
        typeof track.title === "string" &&
        typeof track.artist === "string" &&
        typeof track.youtubeId === "string" &&
        typeof track.category === "string" &&
        typeof track.description === "string" &&
       
        typeof track.favourite === "boolean";
    });
  }
} catch (error) {
  musicTracks = [];
}

// Accept common YouTube VIDEO links, not arbitrary websites.
function getYouTubeVideoId(value) {
  try {
    const url = new URL(value.trim());

    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return null;
    }

    const host = url.hostname.toLowerCase().replace(/^www\./, "");

    let videoId = null;

    if (host === "youtu.be") {
      videoId = url.pathname.split("/").filter(Boolean)[0];
    } else if (
      host === "youtube.com" ||
      host === "m.youtube.com" ||
      host === "music.youtube.com"
    ) {
      if (url.pathname === "/watch") {
        videoId = url.searchParams.get("v");
      } else {
        const parts = url.pathname.split("/").filter(Boolean);

        if (
          parts.length >= 2 &&
          ["embed", "shorts", "live"].includes(parts[0])
        ) {
          videoId = parts[1];
        }
      }
    }

    // YouTube video IDs are 11 characters.
    return videoId && /^[A-Za-z0-9_-]{11}$/.test(videoId)
      ? videoId
      : null;
  } catch (error) {
    return null;
  }
}

// Only accept secure image links.

function saveMusicTracks() {
  try {
    localStorage.setItem(
      musicLibraryStorageKey,
      JSON.stringify(musicTracks)
    );
    return true;
  } catch (error) {
    console.error("Could not save the music library:", error);
    musicFormMessage.textContent =
      "Your browser couldn't save the changes. Storage may be full or unavailable.";
    return false;
  }
}

function createLibraryButton(label, className, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.className = className;
  button.addEventListener("click", onClick);
  return button;
}

function createLibraryCard(track) {
  const card = document.createElement("article");
  card.className = "library-track-card";

 

  const info = document.createElement("div");
  info.className = "library-track-info";

  const category = document.createElement("span");
  category.className = "library-category-tag";
  category.textContent = track.category;

  const title = document.createElement("h4");
  title.textContent = track.title;

  const artist = document.createElement("p");
  artist.className = "library-track-artist";
  artist.textContent = track.artist;

  info.append(category, title, artist);

  if (track.description) {
    const description = document.createElement("p");
    description.className = "library-track-description";
    description.textContent = track.description;
    info.appendChild(description);
  }

  // Embed the validated YouTube video.
  const video = document.createElement("iframe");
  video.className = "library-video";
  video.src = "https://www.youtube-nocookie.com/embed/" + track.youtubeId;
  video.title = "Play " + track.title + " by " + track.artist;
  video.loading = "lazy";
  video.referrerPolicy = "strict-origin-when-cross-origin";
  video.allow =
    "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
  video.allowFullscreen = true;
  video.setAttribute("frameborder", "0");
  info.appendChild(video);

  const actions = document.createElement("div");
  actions.className = "library-card-actions";

  const favouriteButton = createLibraryButton(
    track.favourite ? "★ Favourited" : "☆ Favourite",
    "library-favourite-button",
    function() {
      track.favourite = !track.favourite;
      saveMusicTracks();
      renderMusicLibrary();
    }
  );
  favouriteButton.setAttribute(
    "aria-pressed",
    String(track.favourite)
  );

  const editButton = createLibraryButton("Edit", "", function() {
    startEditingMusicTrack(track);
  });

  const removeButton = createLibraryButton("Remove", "", function() {
    if (!confirm('Remove "' + track.title + '" from your music library?')) {
      return;
    }

    musicTracks = musicTracks.filter(function(item) {
      return item.id !== track.id;
    });

    if (editingMusicTrackId === track.id) {
      resetMusicForm();
    }

    saveMusicTracks();
    renderMusicLibrary();
  });

  actions.append(favouriteButton, editButton, removeButton);
  info.appendChild(actions);
  card.appendChild(info);

  return card;
}

function renderMusicLibrary() {
  musicGrid.replaceChildren();

  const search = musicSearchInput.value.trim().toLowerCase();
  const category = musicFilterInput.value;
  const favouritesOnly = musicFavouritesOnly.checked;

  const matchingTracks = musicTracks.filter(function(track) {
    const searchableText = [
      track.title,
      track.artist,
      track.description,
      track.category
    ].join(" ").toLowerCase();

    const matchesSearch = searchableText.includes(search);
    const matchesCategory =
      category === "All" || track.category === category;
    const matchesFavourite = !favouritesOnly || track.favourite;

    return matchesSearch && matchesCategory && matchesFavourite;
  });

  matchingTracks.forEach(function(track) {
    musicGrid.appendChild(createLibraryCard(track));
  });

  musicCount.textContent = matchingTracks.length +
    (matchingTracks.length === 1 ? " track" : " tracks");

  musicEmpty.hidden = matchingTracks.length > 0;

  if (musicTracks.length === 0) {
    musicEmpty.textContent =
      "Your collection is waiting for its first track. Add one above! ♫";
  } else {
    musicEmpty.textContent =
      "No matching tracks. Try another search or filter.";
  }
}

function resetMusicForm() {
  musicForm.reset();
  editingMusicTrackId = null;

  musicFormHeading.textContent = "Add a track ♫";
  musicSubmitButton.textContent = "+ Add to my library";
  musicCancelButton.hidden = true;
  musicFormMessage.textContent = "";
}

function startEditingMusicTrack(track) {
  editingMusicTrackId = track.id;

  musicTitleInput.value = track.title;
  musicArtistInput.value = track.artist;
  musicYoutubeInput.value =
    "https://www.youtube.com/watch?v=" + track.youtubeId;
  musicCategoryInput.value = track.category;
  musicDescriptionInput.value = track.description;
 
  musicFormHeading.textContent = "Edit your track ✎";
  musicSubmitButton.textContent = "Save changes";
  musicCancelButton.hidden = false;
  musicFormMessage.textContent = "Editing: " + track.title;

  document.getElementById("my-music-library").scrollIntoView({
    behavior: "smooth",
    block: "start"
  });

  musicTitleInput.focus();
}

musicForm.addEventListener("submit", function(event) {
  event.preventDefault();

  const title = musicTitleInput.value.trim();
  const artist = musicArtistInput.value.trim();
  const youtubeId = getYouTubeVideoId(musicYoutubeInput.value);
  const category = musicCategoryInput.value;
  const description = musicDescriptionInput.value.trim();
 
  if (!title || !artist) {
    musicFormMessage.textContent = "Please enter a title and artist or composer.";
    return;
  }

  if (!youtubeId) {
    musicFormMessage.textContent =
      "Please enter a valid YouTube video link, such as a youtube.com/watch?v=... link.";
    musicYoutubeInput.focus();
    return;
  }

 

  const categories = [
    "Classical",
    "Film music",
    "Relaxing",
    "Piano",
    "Orchestral",
    "Other"
  ];

  if (!categories.includes(category)) {
    musicFormMessage.textContent = "Please select a valid category.";
    return;
  }

  if (editingMusicTrackId) {
    const existingTrack = musicTracks.find(function(track) {
      return track.id === editingMusicTrackId;
    });

    if (existingTrack) {
      existingTrack.title = title;
      existingTrack.artist = artist;
      existingTrack.youtubeId = youtubeId;
      existingTrack.category = category;
      existingTrack.description = description;
     
    }
  } else {
    musicTracks.push({
      id: String(Date.now()) + "-" + Math.random().toString(16).slice(2),
      title: title,
      artist: artist,
      youtubeId: youtubeId,
      category: category,
      description: description,
   
      favourite: false
    });
  }

  const saved = saveMusicTracks();
  renderMusicLibrary();
  resetMusicForm();

  musicFormMessage.textContent = saved
    ? "Your music library has been updated! ♫"
    : "The library updated for now, but the changes may not persist after refresh.";
});

musicCancelButton.addEventListener("click", resetMusicForm);
musicSearchInput.addEventListener("input", renderMusicLibrary);
musicFilterInput.addEventListener("change", renderMusicLibrary);
musicFavouritesOnly.addEventListener("change", renderMusicLibrary);

// Show saved tracks on page load.
renderMusicLibrary();


/* THE PIANO ATELIER — WEEKLY PRACTICE PLANNER */

(function () {
  const storageKey = "pianoAtelierWeeklyPlannerV1";

  const days = [
    "Monday", "Tuesday", "Wednesday", "Thursday",
    "Friday", "Saturday", "Sunday"
  ];

  const form = document.getElementById("planner-task-form");
  const dayInput = document.getElementById("planner-day");
  const pieceInput = document.getElementById("planner-piece");
  const goalInput = document.getElementById("planner-goal");
  const minutesInput = document.getElementById("planner-minutes");
  const weekContainer = document.getElementById("planner-week");
  const countElement = document.getElementById("planner-progress-count");
  const fillElement = document.getElementById("planner-progress-fill");
  const progressMessage = document.getElementById("planner-progress-message");
  const formMessage = document.getElementById("planner-form-message");
  const formHeading = document.getElementById("planner-form-heading");
  const submitButton = document.getElementById("planner-submit-button");
  const cancelButton = document.getElementById("planner-cancel-button");

  if (!form || !weekContainer) return;

  let tasks = [];
  let editingId = null;

  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || "[]");

    if (Array.isArray(saved)) {
      tasks = saved.filter(function (task) {
        return task &&
          typeof task.id === "string" &&
          days.includes(task.day) &&
          typeof task.goal === "string" &&
          typeof task.minutes === "number" &&
          Number.isFinite(task.minutes) &&
          task.minutes >= 1 &&
          task.minutes <= 240 &&
          typeof task.pieceValue === "string" &&
          typeof task.pieceLabel === "string" &&
          typeof task.complete === "boolean";
      });
    }
  } catch (error) {
    tasks = [];
  }

  function saveTasks() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(tasks));
    } catch (error) {
      formMessage.textContent =
        "Your browser couldn't save the plan. Check its storage settings.";
    }
  }

  function populatePieceOptions(selectedValue) {
    const previousValue = selectedValue || pieceInput.value;

    pieceInput.replaceChildren();

    function addOption(value, label) {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      pieceInput.appendChild(option);
    }

    addOption("technique", "Technique / scales");
    addOption("sight-reading", "Sight-reading");
    addOption("other", "Other practice");

    if (
      typeof repertoirePieces !== "undefined" &&
      Array.isArray(repertoirePieces)
    ) {
      repertoirePieces.forEach(function (piece) {
        const value = "repertoire:" + piece.id;
        const label =
          (piece.composer || "Unknown composer") +
          " — " +
          (piece.title || "Untitled piece");

        addOption(value, label);
      });
    }

    if (
      Array.from(pieceInput.options).some(function (option) {
        return option.value === previousValue;
      })
    ) {
      pieceInput.value = previousValue;
    }
  }

  function getPieceLabel(value) {
    const option = Array.from(pieceInput.options).find(function (item) {
      return item.value === value;
    });

    return option ? option.textContent : "Other practice";
  }

  function makeButton(label, callback) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "planner-task-button";
    button.textContent = label;
    button.addEventListener("click", callback);
    return button;
  }

  function resetForm() {
    editingId = null;
    form.reset();
    dayInput.value = "Monday";
    minutesInput.value = "15";
    populatePieceOptions();
    formHeading.textContent = "Plan a practice task";
    submitButton.textContent = "+ Add practice task";
    cancelButton.hidden = true;
    formMessage.textContent = "";
  }

  function startEditing(task) {
    editingId = task.id;
    dayInput.value = task.day;
    populatePieceOptions(task.pieceValue);
    goalInput.value = task.goal;
    minutesInput.value = String(task.minutes);

    formHeading.textContent = "Edit practice task";
    submitButton.textContent = "Save changes";
    cancelButton.hidden = false;
    formMessage.textContent = "Update your task below.";
    form.scrollIntoView({ behavior: "smooth", block: "start" });
    goalInput.focus();
  }

  function renderPlanner() {
    populatePieceOptions();

    weekContainer.replaceChildren();

    days.forEach(function (day) {
      const dayTasks = tasks.filter(function (task) {
        return task.day === day;
      });

      const card = document.createElement("section");
      card.className = "planner-day-card";

      const heading = document.createElement("h3");
      heading.textContent = day;

      const summary = document.createElement("p");
      summary.className = "planner-day-summary";

      const totalMinutes = dayTasks.reduce(function (total, task) {
        return total + task.minutes;
      }, 0);

      summary.textContent =
        dayTasks.length + (dayTasks.length === 1 ? " task" : " tasks") +
        " · " + totalMinutes + " planned minutes";

      card.append(heading, summary);

      if (dayTasks.length === 0) {
        const empty = document.createElement("p");
        empty.className = "planner-empty-day";
        empty.textContent = "A little space for your music. Add a task above. ♫";
        card.appendChild(empty);
      }

      dayTasks.forEach(function (task) {
        const taskCard = document.createElement("div");
        taskCard.className = "planner-task";

        if (task.complete) {
          taskCard.classList.add("planner-task-complete");
        }

        const taskHeading = document.createElement("div");
        taskHeading.className = "planner-task-heading";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = task.complete;
        checkbox.setAttribute(
          "aria-label",
          "Mark task complete: " + task.goal
        );

        checkbox.addEventListener("change", function () {
          task.complete = checkbox.checked;
          saveTasks();
          renderPlanner();
        });

        const details = document.createElement("div");
        details.className = "planner-task-details";

        const pieceLabel = document.createElement("span");
        pieceLabel.className = "planner-task-piece";
        pieceLabel.textContent = task.pieceLabel;

        const goal = document.createElement("div");
        goal.className = "planner-task-goal";
        goal.textContent = task.goal;

        details.append(pieceLabel, goal);
        taskHeading.append(checkbox, details);

        const minutes = document.createElement("p");
        minutes.className = "planner-task-minutes";
        minutes.textContent = task.minutes + " planned minutes";

        const actions = document.createElement("div");
        actions.className = "planner-task-actions";

        actions.appendChild(makeButton("Edit", function () {
          startEditing(task);
        }));

        actions.appendChild(makeButton("Delete", function () {
          if (!confirm("Delete this practice task?")) return;

          tasks = tasks.filter(function (item) {
            return item.id !== task.id;
          });

          if (editingId === task.id) resetForm();

          saveTasks();
          renderPlanner();
        }));

        taskCard.append(taskHeading, minutes, actions);
        card.appendChild(taskCard);
      });

      weekContainer.appendChild(card);
    });

    const completed = tasks.filter(function (task) {
      return task.complete;
    }).length;

    const total = tasks.length;
    const percentage = total ? (completed / total) * 100 : 0;

    countElement.textContent =
      completed + " of " + total + " tasks complete";

    fillElement.style.width = percentage + "%";

    if (total === 0) {
      progressMessage.textContent =
        "Your musical week starts here. Add your first task! ♫";
    } else if (completed === total) {
      progressMessage.textContent =
        "Every planned task is complete. Bravo! ♫";
    } else {
      progressMessage.textContent =
        "Keep going at your own pace. Every little step counts. ♫";
    }
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    const goal = goalInput.value.trim();
    const minutes = Number(minutesInput.value);
    const day = dayInput.value;
    const pieceValue = pieceInput.value;

    if (!days.includes(day) || !goal || goal.length > 300) {
      formMessage.textContent =
        "Please choose a day and enter a practice goal.";
      return;
    }

    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 240) {
      formMessage.textContent =
        "Please enter between 1 and 240 planned minutes.";
      return;
    }

    const pieceLabel = getPieceLabel(pieceValue);

    if (editingId) {
      const task = tasks.find(function (item) {
        return item.id === editingId;
      });

      if (!task) {
        resetForm();
        formMessage.textContent =
          "That task could not be found. Please try again.";
        return;
      }

      task.day = day;
      task.pieceValue = pieceValue;
      task.pieceLabel = pieceLabel;
      task.goal = goal;
      task.minutes = minutes;

      formMessage.textContent = "Your task has been updated. ♫";
    } else {
      tasks.push({
        id: "planner-" + Date.now() + "-" +
          Math.random().toString(16).slice(2),
        day: day,
        pieceValue: pieceValue,
        pieceLabel: pieceLabel,
        goal: goal,
        minutes: minutes,
        complete: false
      });

      formMessage.textContent = "Practice task added. ♫";
    }

    saveTasks();
    renderPlanner();

    editingId = null;
    form.reset();
    dayInput.value = "Monday";
    minutesInput.value = "15";
    formHeading.textContent = "Plan a practice task";
    submitButton.textContent = "+ Add practice task";
    cancelButton.hidden = true;
  });

  cancelButton.addEventListener("click", resetForm);

  populatePieceOptions();
  renderPlanner();
})();

/* THE PIANO ATELIER — UNLOCKABLE BADGES */

(function () {
  const practiceKey = "pianoAtelierPracticeDays";
  const badgeKey = "pianoAtelierUnlockedBadgesV1";

  const badgeContainer = document.getElementById("unlockable-badges");
  const message = document.getElementById("badge-unlock-message");

  if (!badgeContainer || !message) return;

  
const badgeDefinitions = [
  {
    id: "first-notes",
    icon: "🎹",
    name: "First Notes",
    description: "Record your first practice day.",
    requirement: "1 practice day"
  },
  {
    id: "three-day-spark",
    icon: "✨",
    name: "Three-Day Spark",
    description: "Practise on 3 consecutive days.",
    requirement: "3-day streak"
  },
  {
    id: "musical-momentum",
    icon: "🔥",
    name: "Musical Momentum",
    description: "Practise on 7 consecutive days.",
    requirement: "7-day streak"
  },
  {
    id: "ten-sessions",
    icon: "🎼",
    name: "Ten Sessions",
    description: "Record 10 practice days.",
    requirement: "10 practice days"
  },
  {
    id: "practice-champion",
    icon: "🏆",
    name: "Practice Champion",
    description: "Record 25 practice days.",
    requirement: "25 practice days"
  },
  {
    id: "getting-into-rhythm",
    icon: "🌱",
    name: "Getting Into Rhythm",
    description: "Build your musical routine.",
    requirement: "3 practice days"
  },
  {
    id: "dedicated-musician",
    icon: "💜",
    name: "Dedicated Musician",
    description: "Show wonderful consistency.",
    requirement: "14-day streak"
  },
  {
    id: "thirty-sessions",
    icon: "🎶",
    name: "Thirty Sessions",
    description: "Celebrate 30 days of practice.",
    requirement: "30 practice days"
  },
  {
    id: "half-century",
    icon: "🥇",
    name: "Half-Century Musician",
    description: "Reach a major musical milestone.",
    requirement: "50 practice days"
  },
  {
    id: "piano-royalty",
    icon: "👑",
    name: "Piano Royalty",
    description: "A hundred days of musical dedication.",
    requirement: "100 practice days"
  }
];

  let unlocked = [];

  try {
    const saved = JSON.parse(localStorage.getItem(badgeKey) || "[]");
    if (Array.isArray(saved)) {
      unlocked = saved.filter(function (id) {
        return badgeDefinitions.some(function (badge) {
          return badge.id === id;
        });
      });
    }
  } catch (error) {
    unlocked = [];
  }

  function getPracticeDays() {
    try {
      const saved = JSON.parse(localStorage.getItem(practiceKey) || "[]");

      if (!Array.isArray(saved)) return [];

      return Array.from(new Set(saved.filter(function (date) {
        if (typeof date !== "string") return false;

        const parsed = new Date(date + "T12:00:00Z");

        return !Number.isNaN(parsed.getTime()) &&
          parsed.toISOString().slice(0, 10) === date;
      }))).sort();
    } catch (error) {
      return [];
    }
  }

  function getLongestStreak(dates) {
    if (dates.length === 0) return 0;

    let longest = 1;
    let current = 1;

    for (let i = 1; i < dates.length; i++) {
      const previous = new Date(dates[i - 1] + "T12:00:00Z");
      const today = new Date(dates[i] + "T12:00:00Z");

      const difference = (today - previous) / 86400000;

      if (difference === 1) {
        current++;
      } else {
        current = 1;
      }

      longest = Math.max(longest, current);
    }

    return longest;
  }

  function saveUnlocked() {
    try {
      localStorage.setItem(badgeKey, JSON.stringify(unlocked));
    } catch (error) {
      message.textContent =
        "Your browser couldn't save new badges. Check its storage settings.";
    }
  }

  function renderBadges() {
    const dates = getPracticeDays();
    const longestStreak = getLongestStreak(dates);
    const previouslyUnlocked = new Set(unlocked);

    const conditions = {
  "first-notes": dates.length >= 1,
  "three-day-spark": longestStreak >= 3,
  "musical-momentum": longestStreak >= 7,
  "ten-sessions": dates.length >= 10,
  "practice-champion": dates.length >= 25,
  "getting-into-rhythm": dates.length >= 3,
  "dedicated-musician": longestStreak >= 14,
  "thirty-sessions": dates.length >= 30,
  "half-century": dates.length >= 50,
  "piano-royalty": dates.length >= 100
};

    let newlyUnlocked = 0;

    badgeDefinitions.forEach(function (badge) {
      if (conditions[badge.id] && !previouslyUnlocked.has(badge.id)) {
        unlocked.push(badge.id);
        newlyUnlocked++;
      }
    });

    if (newlyUnlocked > 0) saveUnlocked();

    badgeContainer.replaceChildren();

    badgeDefinitions.forEach(function (badge) {
      const earned = unlocked.includes(badge.id);

      const card = document.createElement("article");
      card.className = "musical-badge " +
        (earned ? "unlocked" : "locked");

      const icon = document.createElement("div");
      icon.className = "musical-badge-icon";
      icon.textContent = earned ? badge.icon : "🔒";

      const title = document.createElement("h4");
      title.textContent = badge.name;

      const description = document.createElement("p");
      description.textContent = earned
        ? badge.description
        : "Unlock: " + badge.requirement;

      const status = document.createElement("span");
      status.className = "musical-badge-status";
      status.textContent = earned ? "✓ Unlocked" : "Locked";

      card.append(icon, title, description, status);
      badgeContainer.appendChild(card);
    });

    const remaining = badgeDefinitions.length - unlocked.length;

    if (newlyUnlocked > 0) {
      message.textContent = newlyUnlocked === 1
        ? "Congratulations! You've unlocked a new musical badge! ✨"
        : "Bravo! You've unlocked " + newlyUnlocked +
          " new musical badges! ✨";
    } else if (remaining === 0) {
      message.textContent = "You've collected every practice badge. Bravo! ♫";
    } else {
      message.textContent =
        unlocked.length + " of " + badgeDefinitions.length +
        " badges collected. Keep going at your own pace! ♫";
    }
  }

  // Refresh after the existing calendar records a practice day.
  const practiceButton = document.getElementById("toggle-practice");

  if (practiceButton) {
    practiceButton.addEventListener("click", function () {
      renderBadges();
    });
  }

  const clearButton = document.getElementById("clear-practice");

  if (clearButton) {
    clearButton.addEventListener("click", function () {
      renderBadges();
    });
  }

  // Also refresh if practice data changes in another browser tab.
  window.addEventListener("storage", function (event) {
    if (event.key === practiceKey) renderBadges();
  });

  renderBadges();
})();

/* THE PIANO ATELIER — PIANO JOURNAL */

(function () {
  const storageKey = "pianoAtelierPersonalJournalV1";

  const form = document.getElementById("piano-journal-form");
  const dateInput = document.getElementById("piano-journal-date");
  const pieceInput = document.getElementById("piano-journal-piece");
  const moodInput = document.getElementById("piano-journal-mood");
  const wellInput = document.getElementById("piano-journal-went-well");
  const challengeInput = document.getElementById("piano-journal-challenge");
  const nextInput = document.getElementById("piano-journal-next");
  const entriesContainer = document.getElementById("piano-journal-entries");
  const count = document.getElementById("piano-journal-count");
  const emptyMessage = document.getElementById("piano-journal-empty");
  const message = document.getElementById("piano-journal-message");
  const formTitle = document.getElementById("piano-journal-form-title");
  const saveButton = document.getElementById("piano-journal-save");
  const cancelButton = document.getElementById("piano-journal-cancel");

  if (!form || !entriesContainer) return;

  const moods = {
    proud: "🌟 Proud",
    happy: "😊 Happy",
    focused: "🎯 Focused",
    challenged: "🌱 Challenged",
    frustrated: "🌧️ Frustrated",
    tired: "🌙 Tired"
  };

  let entries = [];
  let editingId = null;

  function todayString() {
    const now = new Date();
    const localDate = new Date(
      now.getTime() - now.getTimezoneOffset() * 60000
    );
    return localDate.toISOString().slice(0, 10);
  }

  function validDate(value) {
    if (typeof value !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

    const date = new Date(value + "T12:00:00");
    return !Number.isNaN(date.getTime()) &&
      date.getFullYear() === Number(value.slice(0, 4)) &&
      date.getMonth() + 1 === Number(value.slice(5, 7)) &&
      date.getDate() === Number(value.slice(8, 10));
  }

  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || "[]");

    if (Array.isArray(saved)) {
      entries = saved.filter(function (entry) {
        return entry &&
          typeof entry.id === "string" &&
          validDate(entry.date) &&
          typeof entry.piece === "string" &&
          typeof entry.well === "string" &&
          typeof entry.challenge === "string" &&
          typeof entry.next === "string" &&
          Object.prototype.hasOwnProperty.call(moods, entry.mood);
      });
    }
  } catch (error) {
    entries = [];
  }

  dateInput.value = todayString();

  function saveEntries() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(entries));
      return true;
    } catch (error) {
      message.textContent =
        "Your browser couldn't save this entry. Check its storage settings.";
      return false;
    }
  }

  function addTextElement(parent, tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    element.textContent = text;
    parent.appendChild(element);
    return element;
  }

  function addJournalSection(parent, heading, content) {
    if (!content) return;

    addTextElement(parent, "h5", "", heading);
    addTextElement(parent, "p", "", content);
  }

  function resetForm() {
    editingId = null;
    form.reset();
    dateInput.value = todayString();
    formTitle.textContent = "Write a new entry";
    saveButton.textContent = "Save journal entry ♫";
    cancelButton.hidden = true;
    message.textContent = "";
  }

  function startEditing(entry) {
    editingId = entry.id;
    dateInput.value = entry.date;
    pieceInput.value = entry.piece;
    moodInput.value = entry.mood;
    wellInput.value = entry.well;
    challengeInput.value = entry.challenge;
    nextInput.value = entry.next;

    formTitle.textContent = "Edit journal entry";
    saveButton.textContent = "Save changes ♫";
    cancelButton.hidden = false;
    message.textContent = "Update your entry below.";
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderEntries() {
    entriesContainer.replaceChildren();

    const sorted = entries.slice().sort(function (a, b) {
      return b.date.localeCompare(a.date);
    });

    count.textContent =
      entries.length + (entries.length === 1 ? " entry saved" : " entries saved");

    emptyMessage.hidden = entries.length > 0;

    sorted.forEach(function (entry) {
      const card = document.createElement("article");
      card.className = "piano-journal-entry";

      const date = new Date(entry.date + "T12:00:00");
      const formattedDate = date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric"
      });

      addTextElement(card, "div", "piano-journal-entry-date", formattedDate);
      addTextElement(card, "h4", "", entry.piece);
      addTextElement(card, "p", "piano-journal-entry-mood", moods[entry.mood]);

      addJournalSection(card, "What went well", entry.well);
      addJournalSection(card, "What was difficult", entry.challenge);
      addJournalSection(card, "My next goal", entry.next);

      const actions = document.createElement("div");
      actions.className = "piano-journal-entry-actions";

      const edit = document.createElement("button");
      edit.type = "button";
      edit.textContent = "Edit entry";
      edit.addEventListener("click", function () {
        startEditing(entry);
      });

      const remove = document.createElement("button");
      remove.type = "button";
      remove.textContent = "Delete entry";
      remove.addEventListener("click", function () {
        if (!confirm("Delete this journal entry?")) return;

        entries = entries.filter(function (item) {
          return item.id !== entry.id;
        });

        if (editingId === entry.id) resetForm();

        if (saveEntries()) {
          renderEntries();
          message.textContent = "Journal entry deleted.";
        }
      });

      actions.append(edit, remove);
      card.appendChild(actions);
      entriesContainer.appendChild(card);
    });
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    const date = dateInput.value;
    const piece = pieceInput.value.trim();

    if (!validDate(date) || !piece) {
      message.textContent = "Please choose a valid date and enter what you practised.";
      return;
    }

    const entryData = {
      date: date,
      piece: piece,
      mood: moodInput.value,
      well: wellInput.value.trim(),
      challenge: challengeInput.value.trim(),
      next: nextInput.value.trim()
    };

    if (editingId) {
      const entry = entries.find(function (item) {
        return item.id === editingId;
      });

      if (!entry) {
        resetForm();
        message.textContent = "Entry not found. Please try again.";
        return;
      }

      Object.assign(entry, entryData);
    } else {
      entries.push({
        id: "journal-" + Date.now() + "-" +
          Math.random().toString(16).slice(2),
        ...entryData
      });
    }

    if (saveEntries()) {
      resetForm();
      renderEntries();
      message.textContent = "Your musical memory has been saved. ♫";
    }
  });

  cancelButton.addEventListener("click", resetForm);

  renderEntries();
})();