// const startBtn = document.getElementById("start");
// const pauseBtn = document.getElementById("pause");

const hoursDisplay = document.getElementById("hoursDisplay");
const minutesDisplay = document.getElementById("minutesDisplay");
const secondsDisplay = document.getElementById("secondsDisplay");

// let timeData = { fragments: [] };
let timerData = {};
let activeTimerId = null;

let timerCount = 0;
let hours = 0;
let minutes = 0;
let seconds = 0;
let totalTime = null;    
let timeStart = null;
let timeEnd = null;


let isTimeRunning = false;
let timerInterval = null;

let totalSecondsBeforeResume = null;
let resumedDisplaySeconds = null;

const timeTable = document.getElementById("timersUsed");
const controlBtn = document.getElementById("control-btn");


function loadPage() {

    const storedTimerData = localStorage.getItem('timerData');
    const storedTimerCount = localStorage.getItem('timerCount');

    if (storedTimerData) {

        try {

            timerData = JSON.parse(storedTimerData);
            timerCount = parseInt(storedTimerCount || '0');

            
            for (const timerId in timerData) {
                const timer = timerData[timerId];
                addDataToTable(timerId, timer.label, timer.totalTime, timer.startDate);
            }
        } catch(err) {
            console.error("Error loading data", err);
        }
    }
}


function formatTime(time) {
    return time < 10 ? `0${time}` : `${time}`;
}

function timeToSeconds(timeString) {
    const [h, m, s] = timeString.split(':').map(Number); 
    return h * 3600 + m * 60 + s;
}

function formatTimeFromSeconds(totalSeconds) {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${formatTime(h)}:${formatTime(m)}:${formatTime(s)}`;
}

function getCurrentTotalSeconds() {
    return hours * 3600 + minutes * 60 + seconds;
}


function updateTimerDisplay() {
    hoursDisplay.textContent = formatTime(hours);
    minutesDisplay.textContent = formatTime(minutes);
    secondsDisplay.textContent = formatTime(seconds);
}

function resetTimerDisplay() {
    hours = 0;
    minutes = 0;
    seconds = 0;
    updateTimerDisplay();
}

function addDataToTable(id, label, totalTime, date) {
    let newRow = document.querySelector(`tr[data-timer-id="${id}"]`);

    if (!newRow) {
        newRow = document.createElement("tr");
        newRow.setAttribute('data-timer-id', id);

        newRow.innerHTML = `
            <td>${label}</td>
            <td class="timer-time">${totalTime}</td>
            <td>
                <div class="btn-controls">
                    <button class="action-btn detail-btn">Details</button>
                    <button class="action-btn delete-btn">Delete</button>
                </div>
            </td>
        `;

        timeTable.appendChild(newRow);

        newRow.querySelector('.detail-btn').addEventListener('click', function() {
            toggleTimerDetails(id);
        });
        
        newRow.querySelector('.delete-btn').addEventListener('click', function() {
            if (confirm("Are you sure to delete this timer?")) {
                deleteTimer(id);
            }
        });
    } else {

        const timeCell = newRow.querySelector('.timer-time');
        if (timeCell) {
            timeCell.textContent = totalTime;
        }
    }

    if (!document.querySelector(`.timer-details-panel[data-timer-id="${id}"]`)) {
        const detailsPanel = document.createElement('tr');
        detailsPanel.classList.add('timer-details-panel');
        detailsPanel.setAttribute('data-timer-id', id);
        detailsPanel.innerHTML = `
            <td colspan="3">
                <div class="timer-fragments"></div>
            </td> 
        `;

        newRow.parentNode.insertBefore(detailsPanel, newRow.nextSibling); 
    }
}

function toggleTimerDetails(timerId) {
    const detailsPanel = document.querySelector(`.timer-details-panel[data-timer-id="${timerId}"]`);

    if (detailsPanel.style.display === 'table-row') {
        detailsPanel.style.display = 'none';
    } else {
        document.querySelectorAll('.timer-details-panel').forEach(panel => {
            panel.style.display = 'none';
        });

        detailsPanel.style.display = 'table-row';

        updateTimeFragments(timerId);
    }
}

function updateTimeFragments(timerId) {
    const timer = timerData[timerId];
    const fragmentContainer = document.querySelector(`.timer-details-panel[data-timer-id="${timerId}"] .timer-fragments`);

    if (timer && timer.fragments && fragmentContainer) {
        fragmentContainer.innerHTML = '';

        if (timer.fragments.length === 0) {
            fragmentContainer.innerHTML = '<p>No records</p>';
        } else {
            timer.fragments.forEach((fragment, index) => {
                const fragmentDiv = document.createElement('div');
                fragmentDiv.classList.add('timer-fragment');

                fragmentDiv.innerHTML = `
                    <div>
                        <strong>Timer ${index}</strong>: ${fragment.startTime}
                        <span>Duration: ${fragment.duration}</span>
                    </div>
                    <button class="fragment-resume" data-time="${fragment.totalTime}" data-timer-id="${timerId}">Resume</button>
                `;

                fragmentContainer.appendChild(fragmentDiv);

                fragmentDiv.querySelector('.fragment-resume').addEventListener('click', function() {
                    const timeStr = this.getAttribute('data-time');
                    const timerId = this.getAttribute('data-timer-id');
                    resumeFromTime(timerId, timeStr);  
                });
            });
        }
    }
}

function resumeFromTime(timerIdToResume, timeString){
    if (isTimeRunning) {
        stopTimer(false);
    }

    if (!timerData[timerIdToResume]) {
        return;
    }

    const timer = timerData[timerIdToResume];

    totalSecondsBeforeResume = timeToSeconds(timer.totalTime);
    resumedDisplaySeconds = timeToSeconds(timeString);

    hours = Math.floor(resumedDisplaySeconds / 3600);
    minutes = Math.floor((resumedDisplaySeconds % 3600) / 60);
    seconds = resumedDisplaySeconds % 60;
    updateTimerDisplay();

    activeTimerId = timerIdToResume;
    startTimer();
}

function startTimer() {

    if (!isTimeRunning) {
        isTimeRunning = true;
        controlBtn.textContent = "Stop";
        controlBtn.classList.add("stop");

        if (activeTimerId === null) {
            timerCount++;
            localStorage.setItem('timerCount', String(timerCount));
            activeTimerId = `timer-${timerCount}`;

            timerData[activeTimerId] = {
                label: `Timer ${timerCount}`,
                startDate: new Date().toLocaleDateString(),
                totalTime: "00:00:00",
                fragments: [],
                currentSeconds: 0
            }; 

            addDataToTable(
                activeTimerId,
                timerData[activeTimerId].label,
                timerData[activeTimerId].totalTime,
                timerData[activeTimerId].startDate
            );
        }

        saveTimerData();

        timerInterval = setInterval(function() {
            seconds++;
            if (seconds === 60) {
                seconds = 0;
                minutes++;
                if (minutes === 60) {
                    minutes = 0;
                    hours++;
                }
            }
            updateTimerDisplay();
        }, 1000);
    } else {
        stopTimer();
    }
}


function stopTimer(resetDisplayAndId = true) {
    if(isTimeRunning) {
        clearInterval(timerInterval);
        timerInterval = null;
        isTimeRunning = false;
         
        controlBtn.textContent = "Start";
        controlBtn.classList.remove("stop");

        if (activeTimerId && timerData[activeTimerId]) {
            const timer = timerData[activeTimerId];
            const fragmentEndTime = new Date();
            const currentDisplaySeconds = getCurrentTotalSeconds();

            let fragmentDurationSeconds;
            let newTotalSeconds;

            if (totalSecondsBeforeResume !== null && resumedDisplaySeconds !== null) {
                
                const elapsedSinceResume = currentDisplaySeconds - resumedDisplaySeconds;
                fragmentDurationSeconds = Math.max(0, elapsedSinceResume);
                newTotalSeconds = totalSecondsBeforeResume + fragmentDurationSeconds;

            } else {
                const previousTotalSeconds = timer.fragments.length > 0
                    ? timeToSeconds(timer.fragments[timer.fragments.length - 1].totalTime)
                    : 0;
                fragmentDurationSeconds = Math.max(0, currentDisplaySeconds - previousTotalSeconds);
                newTotalSeconds = currentDisplaySeconds;
            } 

            timer.fragments.push({
                startTime: fragmentEndTime.toLocaleString(),
                duration: formatTimeFromSeconds(fragmentDurationSeconds),
                totalTime: formatTimeFromSeconds(newTotalSeconds)
            });
            timer.totalTime = formatTimeFromSeconds(newTotalSeconds);

            const newRow = document.querySelector(`tr[data-timer-id="${activeTimerId}"]`);
            if (newRow) {
                const timeCell = newRow.querySelector('.timer-time');
                if (timeCell) {
                    timeCell.textContent = timer.totalTime;
                }
            }

            saveTimerData();

            const detailsPanel = document.querySelector(`.timer-details-panel[data-timer-id="${activeTimerId}"]`);
            if (detailsPanel && detailsPanel.style.display === 'table-newRow') {
                updateTimeFragments(activeTimerId);
            }
        }

        totalSecondsBeforeResume = null;
        resumedDisplaySeconds = null;

        if (resetDisplayAndId) { 
            resetTimerDisplay();
            activeTimerId = null;
        }
    }
}

function saveTimerData() {
    try {
        localStorage.setItem('timerData', JSON.stringify(timerData));
    } catch (err) {
        console.error("Error saving", err);
    }
}

function deleteTimer(timerId) {
    
    if(isTimeRunning && activeTimerId === timerId){
        stopTimer();
    }
    if(activeTimerId === timerId){
        activeTimerId = null;
        resetTimerDisplay();
    }
    
   
    if(timerData[timerId]){
        delete timerData[timerId];
        saveTimerData();
    }

    const newRow = document.querySelector(`tr[data-timer-id="${timerId}"]`);
    const detailsPanel = document.querySelector(`.timer-details-panel[data-timer-id="${timerId}"]`);
    
    if(newRow){
        newRow.remove();
    }
 
    if(detailsPanel){
        detailsPanel.remove();
    }
}

function startPage() {
    loadPage();
    resetTimerDisplay();
    controlBtn.addEventListener("click", startTimer);
}

startPage();