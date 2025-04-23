// let hours = 0;
// let minutes = 0;
// let seconds = 0;

// const controlBtn = document.getElementById("controlBtn");
// const displayTimer = document.getElementsId("timer")


// function startTimer(){
//     seconds++
//     if(seconds === 60){
//         seconds = 0;
//         minutes++
//         if(minutes === 60){
//             minutes = 0;
//             hours++;
//         }
//     }
// }

let timerData = {}; 
// let timerDetails = {};
let timerCount = 0;
let currentTimerId = null;
let isTimeRunning = false;

let hours = 0;
let minutes = 0;
let seconds = 0;
let timerInterval =null;


const timeTable = document.getElementById("timersUsed");
const controlBtn = document.getElementById("control-btn");
const hoursDisplay = document.getElementById("hoursDisplay");
const minutesDisplay = document.getElementById("minutesDisplay");
const secondsDisplay = document.getElementById("secondsDisplay");

const storedTimerData = localStorage.getItem('timerData');
const storedTimerCount = localStorage.getItem('timerCount');

if (storedTimerData) {
    try {
        timerData = JSON.parse(storedTimerData);
        timerCount = parseInt(storedTimerCount || '0');

        for(const timerId in timerData){
            const timer = timerData[timerId];
            addDataToTable(timerId, timer.label, timer.totalTime, timer.startDate)
        }
    }catch(err){
        console.error("Error loading data", err);
        timerData = {};
        timerCount = 0; 
        localStorage.removeItem('timerData');
        localStorage.removeItem('timerCount');
    }

}

function addDataToTable(id, label, totalTime, data){
    let row = document.querySelector(`tr[data-timer-id="${id}"]`);

    if(!row){
        row = document.createElement("tr");
        row.setAttribute('data-timer-id', id);

        row.innerHTML = `
            <td>${data}</td>
            <td>${label}</td>
            <td class="timer-time">${totalTime}</td>
            <td><button class="action-btn details-btn">Details</button></td>
        `;

        timeTable.appendChild(row);

        row.querySelector('.details-btn').addEventListener('click', function() {
            toggleTimerDetails(id);
        });

    } else {
        
        const timeCell = row.querySelector('.timer-time'); 
        if (timeCell) {
            timeCell.textContent = totalTime;
        }
    }


    if(!document.querySelector(`.timer-details-panel[data-timer-id="${id}"]`)){
        const detailsPanel = document.createElement('tr');
        detailsPanel.classList.add(('timer-details-panel'));
        detailsPanel.setAttribute('data-timer-id', id);
        detailsPanel.innerHTML = `
            <td colspan="4">
                <div class="timer-fragments"></div>
            </td>
        `;

        row.parentNode.insertBefore(detailsPanel, row.nextSibling);
    }
}

function toggleTimerDetails(timerId){
    const detailsPanel = document.querySelector(`.timer-details-panel[data-timer-id="${timerId}"]`);


    if(detailsPanel.style.display === 'table-row'){
        detailsPanel.style.display = 'none';
    }else{
        document.querySelectorAll('.timer-details-panel').forEach(panel => {
            panel.style.display = 'none';
        });

        detailsPanel.style.display = 'table-row';


        updateTimeFragments(timerId);

    }
}

function updateTimeFragments(timerId){
    const timer = timerData[timerId];
    const timeFragmentContainer = document.querySelector(`.timer-details-panel[data-timer-id="${timerId}"] .timer-fragments`);

    if(timer && timer.fragments && timeFragmentContainer){
        timeFragmentContainer.innerHTML = '';
         
        if(timer.fragments.length === 0){
            timeFragmentContainer.innerHTML = '<p>No records</p>';
        }else{
            timer.fragments.forEach((fragment, index) => {
                const fragmentDiv = document.createElement('div');
                fragmentDiv.classList.add('timer-fragment');

                fragmentDiv.innerHTML = `
                <div>
                    <strong>Timer ${index + 1}</strong>: ${fragment.startTime}
                    <span>Duration: ${fragment.duration}</span>
                </div>
                <button class="fragment-resume" data-time="${fragment.totalTime}" data-timer-id="${timerId}">Resume</button>
            `;

            timeFragmentContainer.appendChild(fragmentDiv);

            fragmentDiv.querySelector('.fragment-resume').addEventListener('click', function(){
                const timeStr = this.getAttribute('data-time');
                const timerId = this.getAttribute('data-timer-id');
                resumeFromTime(timerId, timeStr)
                });

            })
        }
    }
}

function resumeFromTime(timerId, timeString){
    if(isTimeRunning){
        stopTimer();
    }

    const totalSeconds = timeToSeconds(timeString);
    hours = Math.floor(totalSeconds / 3600);
    minutes = Math.floor((totalSeconds % 3600) / 60);
    seconds = totalSeconds % 60;

    updateTimerDisplay();

    currentTimerId = timerId;

    startTimer();
}



function formatTime(time){
    return time < 10 ? `0${time}` : `${time}`;
}

function timeToSeconds(timeString){
    const [h, m, s] = timeString.split(':').map(Number);
    return h * 3600 + m * 60 + s;
}

function getCurrentTotalSeconds(){
    return hours * 3600 + minutes * 60 + seconds;
}

function updateTimerDisplay(){
    hoursDisplay.textContent = formatTime(hours);
    minutesDisplay.textContent = formatTime(minutes);
    secondsDisplay.textContent = formatTime(seconds);
}

function formatTimeFromSeconds(totalSeconds){
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${formatTime(h)}:${formatTime(m)}:${formatTime(s)}`;
}

function resetTimerDisplay(){
    hours = 0;
    minutes = 0;
    seconds = 0;
    updateTimerDisplay();
}

function startTimer(){

    if(!isTimeRunning){
        isTimeRunning = true;
        controlBtn.textContent = "Stop";
        controlBtn.classList.add("stop");

        if (currentTimerId === null) {
            timerCount++;
            localStorage.setItem('timerCount', String(timerCount));
            currentTimerId = `timer-${timerCount}`; 

            timerData[currentTimerId] = {

                label: `Timer ${timerCount}`,
                startDate: new Date().toLocaleDateString(),
                totalTime: "00:00:00",
                fragments: [],
                currentSeconds: 0

            };

            addDataToTable(
                currentTimerId,
                timerData[currentTimerId].label,
                timerData[currentTimerId].totalTime,
                timerData[currentTimerId].startDate
            );
        }
       

        saveTimerData();

        timerInterval = setInterval(function() {
            seconds++
            if(seconds === 60){
                seconds = 0;
                minutes++
                if(minutes === 60){
                    minutes = 0;
                    hours++;
                }
            }
            updateTimerDisplay();
        }, 1000)
    }else{
        stopTimer();
    }
}
 

function stopTimer(){
    if(isTimeRunning){
        clearInterval(timerInterval);
        // seconds = 0;
        // minutes = 0;
        // hours = 0;

        timerInterval = null;
        isTimeRunning = false;
        controlBtn.textContent = "Start";
        controlBtn.classList.remove("stop");

        if(currentTimerId && timerData[currentTimerId]){
            const timer = timerData[currentTimerId];
            const fragmentEndTime = new Date();
            const totalSeconds = getCurrentTotalSeconds();

            timer.fragments.push({
                startTime: fragmentEndTime.toLocaleString(),
                duration: formatTimeFromSeconds(totalSeconds - timeToSeconds(timer.totalTime)),
                totalTime: formatTimeFromSeconds(totalSeconds)
            });

            timer.totalTime =formatTimeFromSeconds(totalSeconds);


            const row = document.querySelector(`tr[data-timer-id="${currentTimerId}"]`);
            if(row){
                const timeCell = row.querySelector('.timer-time'); 
                if (timeCell) {
                    timeCell.textContent = timer.totalTime;
                }
            }

            saveTimerData();
        }

        resetTimerDisplay();
        currentTimerId = null;
    }
}


// function createNewTimer(){
//     if(isTimeRunning){
//         stopTimer();

//         resetTimerDisplay();

//         currentTimerId = null;
//     }
// }

function saveTimerData(){
    try{
        localStorage.setItem('timerData', JSON.stringify(timerData));  
    }catch(err){
        console.error("Error saving", err);
    }
}


function initializeApp(){
    resetTimerDisplay();
    controlBtn.addEventListener("click", startTimer);
}

initializeApp();
