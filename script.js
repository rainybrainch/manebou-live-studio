// Web Speech API Setup
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();

// Set to Japanese language
recognition.lang = 'ja-JP';
recognition.interimResults = true;
recognition.continuous = true;

// DOM Elements
const settingsToggle = document.querySelector('.settings-toggle');
const settingsPanel = document.querySelector('.settings-panel');
const startListeningBtn = document.getElementById('startListening');
const stopListeningBtn = document.getElementById('stopListening');
const clearSubtitleBtn = document.getElementById('clearSubtitle');
const subtitleText = document.getElementById('subtitleText');
const transcriptHistory = document.getElementById('transcriptHistory');
const recordingStatus = document.getElementById('recordingStatus');
const listenStatus = document.getElementById('listenStatus');

// Modal Elements
const chatgptModal = document.getElementById('chatgptModal');
const openChatGPTBtn = document.getElementById('openChatGPT');
const closeChatGPTBtn = document.getElementById('closeChatGPT');
const chatgptFrame = document.getElementById('chatgptFrame');
const chatgptUrlInput = document.getElementById('chatgptUrl');
let chatgptUrl = '';

// Settings Elements
const courseSelect = document.getElementById('courseSelect');
const lessonSelect = document.getElementById('lessonSelect');
const subtitleToggle = document.getElementById('subtitleToggle');
const subtitleSize = document.getElementById('subtitleSize');
const subtitleColor = document.getElementById('subtitleColor');
const subtitleSizeValue = document.getElementById('subtitleSizeValue');
const lectureFrame = document.getElementById('lectureFrame');

// Timer Elements
const timerDisplay = document.getElementById('timerDisplay');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const presetBtns = document.querySelectorAll('.preset-btn');

// State Variables
let isListening = false;
let timerInterval = null;
let timerSeconds = 0;
let isTimerRunning = false;

// Settings Panel Toggle
settingsToggle.addEventListener('click', () => {
    settingsPanel.classList.toggle('open');
});

// Close settings when clicking outside
document.addEventListener('click', (e) => {
    if (!settingsPanel.contains(e.target) && !settingsToggle.contains(e.target)) {
        settingsPanel.classList.remove('open');
    }
});

// Speech Recognition Events
recognition.onstart = () => {
    isListening = true;
    startListeningBtn.disabled = true;
    stopListeningBtn.disabled = false;
    recordingStatus.textContent = '●リッスン中...';
    listenStatus.textContent = '聞き取り中...';
};

recognition.onresult = (event) => {
    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i].transcript;

        if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
        } else {
            interimTranscript += transcript;
        }
    }

    if (subtitleToggle.checked) {
        // Show interim results in real-time
        if (interimTranscript) {
            subtitleText.textContent = interimTranscript;
            subtitleText.style.opacity = '0.7';
        }

        // Show final results
        if (finalTranscript) {
            subtitleText.textContent = finalTranscript;
            subtitleText.style.opacity = '1';
            addToTranscriptHistory(finalTranscript);
        }
    }
};

recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    listenStatus.textContent = `エラー: ${event.error}`;
};

recognition.onend = () => {
    isListening = false;
    startListeningBtn.disabled = false;
    stopListeningBtn.disabled = true;
    recordingStatus.textContent = '停止中';
    listenStatus.textContent = '待機中';
};

// Start Listening
startListeningBtn.addEventListener('click', () => {
    try {
        recognition.start();
    } catch (e) {
        console.log('Recognition already started or error:', e);
    }
});

// Stop Listening
stopListeningBtn.addEventListener('click', () => {
    recognition.stop();
});

// Clear Subtitle
clearSubtitleBtn.addEventListener('click', () => {
    subtitleText.textContent = '';
    transcriptHistory.innerHTML = '';
});

// Add to Transcript History
function addToTranscriptHistory(text) {
    const line = document.createElement('div');
    line.className = 'transcript-line';
    line.textContent = text;
    transcriptHistory.insertBefore(line, transcriptHistory.firstChild);

    // Keep only last 5 lines
    const lines = transcriptHistory.querySelectorAll('.transcript-line');
    for (let i = 5; i < lines.length; i++) {
        lines[i].remove();
    }
}

// Subtitle Customization
subtitleSize.addEventListener('input', (e) => {
    const size = e.target.value;
    subtitleText.style.fontSize = size + 'px';
    transcriptHistory.style.fontSize = (parseInt(size) - 3) + 'px';
    subtitleSizeValue.textContent = size + 'px';
});

subtitleColor.addEventListener('change', (e) => {
    subtitleText.style.color = e.target.value;
    transcriptHistory.style.color = e.target.value;
});

subtitleToggle.addEventListener('change', (e) => {
    if (!e.target.checked) {
        subtitleText.textContent = '';
        transcriptHistory.innerHTML = '';
    }
});

// Lecture Navigation
courseSelect.addEventListener('change', () => {
    updateLessonURL();
});

lessonSelect.addEventListener('change', () => {
    updateLessonURL();
});

function updateLessonURL() {
    const course = courseSelect.value;
    const lesson = lessonSelect.value;
    lectureFrame.src = `https://manebou-juku.vercel.app/courses/${course}/lessons/${lesson}`;
}

// Timer Functions
function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return [hours, minutes, secs]
        .map(x => String(x).padStart(2, '0'))
        .join(':');
}

function updateTimerDisplay() {
    timerDisplay.textContent = formatTime(timerSeconds);
}

function startTimer() {
    if (isTimerRunning) return;

    isTimerRunning = true;
    startBtn.disabled = true;
    pauseBtn.disabled = false;

    timerInterval = setInterval(() => {
        timerSeconds++;
        updateTimerDisplay();
    }, 1000);
}

function pauseTimer() {
    if (!isTimerRunning) return;

    isTimerRunning = false;
    clearInterval(timerInterval);
    startBtn.disabled = false;
    pauseBtn.disabled = true;
}

function resetTimer() {
    pauseTimer();
    timerSeconds = 0;
    updateTimerDisplay();
    startBtn.disabled = false;
    pauseBtn.disabled = true;
}

// Timer Button Events
startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', pauseTimer);
resetBtn.addEventListener('click', resetTimer);

// Preset Timer Buttons
presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const minutes = parseInt(btn.dataset.minutes);
        resetTimer();
        timerSeconds = minutes * 60;
        updateTimerDisplay();
        startTimer();
    });
});

// ChatGPT Modal Functions
function openChatGPTModal() {
    if (chatgptUrl) {
        chatgptFrame.src = chatgptUrl;
        chatgptModal.classList.add('open');
    } else {
        alert('ChatGPT URL が設定されていません。設定パネルで入力してください。');
    }
}

function closeChatGPTModal() {
    chatgptModal.classList.remove('open');
    chatgptFrame.src = 'about:blank';
}

function setChatGPTUrl(url) {
    chatgptUrl = url;
    localStorage.setItem('chatgptUrl', url);
}

function loadChatGPTUrl() {
    const saved = localStorage.getItem('chatgptUrl');
    if (saved) {
        chatgptUrl = saved;
        chatgptUrlInput.value = saved;
    }
}

// ChatGPT URL Input Handler
chatgptUrlInput.addEventListener('change', () => {
    setChatGPTUrl(chatgptUrlInput.value);
});

// Modal Event Listeners
openChatGPTBtn.addEventListener('click', openChatGPTModal);
closeChatGPTBtn.addEventListener('click', closeChatGPTModal);

// Close modal when clicking outside
chatgptModal.addEventListener('click', (e) => {
    if (e.target === chatgptModal) {
        closeChatGPTModal();
    }
});

// Initialize
updateTimerDisplay();
stopListeningBtn.disabled = true;
pauseBtn.disabled = true;
loadChatGPTUrl();

console.log('マネアカ配信画面 - Manebou Live Studio initialized');
