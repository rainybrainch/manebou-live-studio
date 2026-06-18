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
const subtitleToggle = document.getElementById('subtitleToggle');
const subtitleSize = document.getElementById('subtitleSize');
const subtitleColor = document.getElementById('subtitleColor');
const subtitleSizeValue = document.getElementById('subtitleSizeValue');
const lectureFrame = document.getElementById('lectureFrame');
const openHubBtn = document.getElementById('openHub');
const backToLectureBtn = document.getElementById('backToLecture');

const defaultLectureUrl = 'https://manebou-juku.vercel.app/';
const hubUrl = 'https://rainybrainch.github.io/hub/';

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

// Draggable Settings Panel (via Button)
let isDragging = false;
let dragOffsetX = 0;
let dragOffsetY = 0;
let panelOffsetX = 0;
let panelOffsetY = 0;

settingsToggle.addEventListener('mousedown', (e) => {
    isDragging = true;
    const rect = settingsToggle.getBoundingClientRect();
    const panelRect = settingsPanel.getBoundingClientRect();
    dragOffsetX = e.clientX - rect.left;
    dragOffsetY = e.clientY - rect.top;
    panelOffsetX = panelRect.left;
    panelOffsetY = panelRect.top;
    settingsToggle.style.cursor = 'grabbing';
});

document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;

    const deltaX = e.clientX - (panelOffsetX + dragOffsetX);
    const deltaY = e.clientY - (panelOffsetY + dragOffsetY);

    const newButtonX = e.clientX - dragOffsetX;
    const newButtonY = e.clientY - dragOffsetY;
    const newPanelX = panelOffsetX + deltaX;
    const newPanelY = panelOffsetY + deltaY;

    // Keep button within viewport
    const maxX = window.innerWidth - 56;
    const maxY = window.innerHeight - 56;

    settingsToggle.style.right = 'auto';
    settingsToggle.style.bottom = 'auto';
    settingsToggle.style.left = Math.max(0, Math.min(newButtonX, maxX)) + 'px';
    settingsToggle.style.top = Math.max(0, Math.min(newButtonY, maxY)) + 'px';

    // Move panel with button
    settingsPanel.style.left = Math.max(0, Math.min(newPanelX, window.innerWidth - 280)) + 'px';
    settingsPanel.style.top = Math.max(0, Math.min(newPanelY, window.innerHeight - 100)) + 'px';
    settingsPanel.style.transform = 'none';
});

document.addEventListener('mouseup', () => {
    if (isDragging) {
        isDragging = false;
        settingsToggle.style.cursor = 'grab';
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

// Hub Navigation
openHubBtn.addEventListener('click', () => {
    lectureFrame.src = hubUrl;
    settingsPanel.classList.remove('open');
});

backToLectureBtn.addEventListener('click', () => {
    lectureFrame.src = defaultLectureUrl;
    settingsPanel.classList.remove('open');
});

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

// Draggable Floating Window
let isWindowDragging = false;
let windowDragOffsetX = 0;
let windowDragOffsetY = 0;

const modalHeader = document.querySelector('.modal-header');
if (modalHeader) {
    modalHeader.addEventListener('mousedown', (e) => {
        isWindowDragging = true;
        const rect = chatgptModal.getBoundingClientRect();
        windowDragOffsetX = e.clientX - rect.left;
        windowDragOffsetY = e.clientY - rect.top;
        modalHeader.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isWindowDragging) return;

        const x = e.clientX - windowDragOffsetX;
        const y = e.clientY - windowDragOffsetY;

        // Keep window within viewport
        const maxX = window.innerWidth - chatgptModal.offsetWidth;
        const maxY = window.innerHeight - chatgptModal.offsetHeight;

        chatgptModal.style.right = 'auto';
        chatgptModal.style.top = Math.max(0, Math.min(y, maxY)) + 'px';
        chatgptModal.style.left = Math.max(0, Math.min(x, maxX)) + 'px';
    });

    document.addEventListener('mouseup', () => {
        if (isWindowDragging) {
            isWindowDragging = false;
            modalHeader.style.cursor = 'move';
        }
    });
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

// Resizable Layout
const broadcastArea = document.getElementById('broadcastArea');
const leftVTuber = document.getElementById('leftVTuber');
const centerContent = document.getElementById('centerContent');
const rightVTuber = document.getElementById('rightVTuber');
const leftResizeHandle = document.getElementById('leftResizeHandle');
const rightResizeHandle = document.getElementById('rightResizeHandle');
const verticalResizeHandle = document.getElementById('verticalResizeHandle');
const subtitleArea = document.getElementById('subtitleArea');
const container = document.querySelector('.container');
const modalResizeHandle = document.getElementById('modalResizeHandle');

// Left-Right Resize
let isResizingLR = false;
let startX = 0;
let startLeftWidth = 0;
let startCenterWidth = 0;

leftResizeHandle.addEventListener('mousedown', (e) => {
    isResizingLR = true;
    startX = e.clientX;
    startLeftWidth = leftVTuber.offsetWidth;
    startCenterWidth = centerContent.offsetWidth;
});

document.addEventListener('mousemove', (e) => {
    if (!isResizingLR) return;
    const delta = e.clientX - startX;
    const newLeftWidth = Math.max(80, startLeftWidth + delta);
    leftVTuber.style.width = newLeftWidth + 'px';
});

document.addEventListener('mouseup', () => {
    isResizingLR = false;
});

// Right Resize
let isResizingRight = false;
let startRightWidth = 0;

rightResizeHandle.addEventListener('mousedown', (e) => {
    isResizingRight = true;
    startX = e.clientX;
    startRightWidth = rightVTuber.offsetWidth;
});

document.addEventListener('mousemove', (e) => {
    if (!isResizingRight) return;
    const delta = e.clientX - startX;
    const newRightWidth = Math.max(80, startRightWidth - delta);
    rightVTuber.style.width = newRightWidth + 'px';
});

document.addEventListener('mouseup', () => {
    isResizingRight = false;
});

// Vertical Resize (Broadcast vs Subtitle)
let isResizingVertical = false;
let startY = 0;
let startBroadcastHeight = 0;

verticalResizeHandle.addEventListener('mousedown', (e) => {
    isResizingVertical = true;
    startY = e.clientY;
    startBroadcastHeight = broadcastArea.offsetHeight;
});

document.addEventListener('mousemove', (e) => {
    if (!isResizingVertical) return;
    const delta = e.clientY - startY;
    const containerHeight = container.offsetHeight;
    const newBroadcastHeight = Math.max(200, Math.min(containerHeight - 70, startBroadcastHeight + delta));
    broadcastArea.style.height = newBroadcastHeight + 'px';
});

document.addEventListener('mouseup', () => {
    isResizingVertical = false;
});

// ChatGPT Modal Resize
let isResizingModal = false;
let startModalX = 0;
let startModalY = 0;
let startModalWidth = 0;
let startModalHeight = 0;

modalResizeHandle.addEventListener('mousedown', (e) => {
    isResizingModal = true;
    startModalX = e.clientX;
    startModalY = e.clientY;
    startModalWidth = chatgptModal.offsetWidth;
    startModalHeight = chatgptModal.offsetHeight;
    e.preventDefault();
});

document.addEventListener('mousemove', (e) => {
    if (!isResizingModal) return;
    const deltaX = e.clientX - startModalX;
    const deltaY = e.clientY - startModalY;
    const newWidth = Math.max(400, startModalWidth + deltaX);
    const newHeight = Math.max(300, startModalHeight + deltaY);
    chatgptModal.style.width = newWidth + 'px';
    chatgptModal.style.height = newHeight + 'px';
});

document.addEventListener('mouseup', () => {
    isResizingModal = false;
});

// Initialize
updateTimerDisplay();
stopListeningBtn.disabled = true;
pauseBtn.disabled = true;
loadChatGPTUrl();

console.log('マネアカ配信画面 - Manebou Live Studio initialized');
