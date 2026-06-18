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

// Subtitle Elements
const subtitleText = document.getElementById('subtitleText');
const transcriptHistory = document.getElementById('transcriptHistory');

// Optional Elements (may not exist)
const startListeningBtn = document.getElementById('startListening');
const stopListeningBtn = document.getElementById('stopListening');
const clearSubtitleBtn = document.getElementById('clearSubtitle');
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

// Settings Panel Toggle (Click to Open/Close)
let isPanelOpen = false;
let isDraggingNow = false;

settingsToggle.addEventListener('click', (e) => {
    if (isDraggingNow) return; // Don't toggle if dragging

    isPanelOpen = !isPanelOpen;
    if (isPanelOpen) {
        settingsPanel.classList.add('open');
    } else {
        settingsPanel.classList.remove('open');
    }
});

// Close settings when clicking outside (both panel and button)
document.addEventListener('click', (e) => {
    if (!settingsPanel.contains(e.target) && !settingsToggle.contains(e.target)) {
        settingsPanel.classList.remove('open');
        isPanelOpen = false;
    }
});

// Draggable Settings Button (Moves both button and panel)
let isDraggingButton = false;
let startX = 0;
let startY = 0;
let buttonStartLeft = 0;
let buttonStartTop = 0;
let panelStartLeft = 0;

settingsToggle.addEventListener('mousedown', (e) => {
    isDraggingButton = true;
    isDraggingNow = false; // Reset drag flag
    startX = e.clientX;
    startY = e.clientY;

    const buttonRect = settingsToggle.getBoundingClientRect();
    buttonStartLeft = buttonRect.left;
    buttonStartTop = buttonRect.top;
    panelStartLeft = settingsPanel.getBoundingClientRect().left;
});

document.addEventListener('mousemove', (e) => {
    if (!isDraggingButton) return;

    const moveX = e.clientX - startX;
    const moveY = e.clientY - startY;

    // Only drag if moved more than 5px
    if (Math.abs(moveX) < 5 && Math.abs(moveY) < 5) return;

    isDraggingNow = true; // Mark as dragging to prevent click
    settingsToggle.style.cursor = 'grabbing';

    const newButtonLeft = Math.max(0, Math.min(buttonStartLeft + moveX, window.innerWidth - 56));
    const newButtonTop = Math.max(0, Math.min(buttonStartTop + moveY, window.innerHeight - 56));

    settingsToggle.style.right = 'auto';
    settingsToggle.style.left = newButtonLeft + 'px';
    settingsToggle.style.top = newButtonTop + 'px';

    // Move panel with button
    if (isPanelOpen) {
        const newPanelLeft = Math.max(-280, panelStartLeft + moveX);
        settingsPanel.style.left = newPanelLeft + 'px';
    }
});

document.addEventListener('mouseup', () => {
    if (isDraggingButton) {
        isDraggingButton = false;
        isDraggingNow = false; // Reset drag flag
        settingsToggle.style.cursor = 'grab';
    }
});

// Speech Recognition Events
recognition.onstart = () => {
    isListening = true;
    if (startListeningBtn) startListeningBtn.disabled = true;
    if (stopListeningBtn) stopListeningBtn.disabled = false;
    if (listenStatus) listenStatus.textContent = '聞き取り中...';
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

    if (subtitleToggle && subtitleToggle.checked) {
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
    if (listenStatus) listenStatus.textContent = `エラー: ${event.error}`;
};

recognition.onend = () => {
    isListening = false;
    if (startListeningBtn) startListeningBtn.disabled = false;
    if (stopListeningBtn) stopListeningBtn.disabled = true;
    if (listenStatus) listenStatus.textContent = '待機中';
};

// Start Listening
if (startListeningBtn) {
    startListeningBtn.addEventListener('click', () => {
        try {
            recognition.start();
        } catch (e) {
            console.log('Recognition already started or error:', e);
        }
    });
}

// Stop Listening
if (stopListeningBtn) {
    stopListeningBtn.addEventListener('click', () => {
        recognition.stop();
    });
}

// Clear Subtitle
if (clearSubtitleBtn) {
    clearSubtitleBtn.addEventListener('click', () => {
        subtitleText.textContent = '';
        transcriptHistory.innerHTML = '';
    });
}

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

// Enable GPU acceleration for resize performance
leftVTuber.style.willChange = 'width';
rightVTuber.style.willChange = 'width';
broadcastArea.style.willChange = 'height';

// Resize state
let resizeState = {
    isResizingLR: false,
    isResizingRight: false,
    isResizingVertical: false,
    resizeStartX: 0,
    resizeStartY: 0,
    startLeftWidth: 0,
    startRightWidth: 0,
    startBroadcastHeight: 0,
    resizeStartXRight: 0,
    resizeStartYVertical: 0,
    pendingUpdate: false
};

// Update on requestAnimationFrame for smooth performance
function updateResizeFrame() {
    if (!resizeState.pendingUpdate) return;
    resizeState.pendingUpdate = false;

    if (resizeState.isResizingLR) {
        const delta = resizeState.lastClientX - resizeState.resizeStartX;
        const newLeftWidth = Math.max(80, resizeState.startLeftWidth + delta);
        leftVTuber.style.width = newLeftWidth + 'px';
    }

    if (resizeState.isResizingRight) {
        const delta = resizeState.lastClientX - resizeState.resizeStartXRight;
        const newRightWidth = Math.max(80, resizeState.startRightWidth - delta);
        rightVTuber.style.width = newRightWidth + 'px';
    }

    if (resizeState.isResizingVertical) {
        const delta = resizeState.lastClientY - resizeState.resizeStartYVertical;
        const containerHeight = container.offsetHeight;
        const newBroadcastHeight = Math.max(200, Math.min(containerHeight - 70, resizeState.startBroadcastHeight + delta));
        broadcastArea.style.height = newBroadcastHeight + 'px';
    }

    requestAnimationFrame(updateResizeFrame);
}

requestAnimationFrame(updateResizeFrame);

// Left-Right Resize
leftResizeHandle.addEventListener('mousedown', (e) => {
    resizeState.isResizingLR = true;
    resizeState.resizeStartX = e.clientX;
    resizeState.startLeftWidth = leftVTuber.offsetWidth;
    leftVTuber.style.willChange = 'width';
});

// Right Resize
rightResizeHandle.addEventListener('mousedown', (e) => {
    resizeState.isResizingRight = true;
    resizeState.resizeStartXRight = e.clientX;
    resizeState.startRightWidth = rightVTuber.offsetWidth;
    rightVTuber.style.willChange = 'width';
});

// Vertical Resize (Broadcast vs Subtitle)
verticalResizeHandle.addEventListener('mousedown', (e) => {
    resizeState.isResizingVertical = true;
    resizeState.resizeStartYVertical = e.clientY;
    resizeState.startBroadcastHeight = broadcastArea.offsetHeight;
    broadcastArea.style.willChange = 'height';
});

document.addEventListener('mousemove', (e) => {
    if (resizeState.isResizingLR || resizeState.isResizingRight || resizeState.isResizingVertical) {
        resizeState.lastClientX = e.clientX;
        resizeState.lastClientY = e.clientY;
        resizeState.pendingUpdate = true;
    }
});

document.addEventListener('mouseup', () => {
    if (resizeState.isResizingLR || resizeState.isResizingRight || resizeState.isResizingVertical) {
        resizeState.isResizingLR = false;
        resizeState.isResizingRight = false;
        resizeState.isResizingVertical = false;
        leftVTuber.style.willChange = 'auto';
        rightVTuber.style.willChange = 'auto';
        broadcastArea.style.willChange = 'auto';
    }
});

// ChatGPT Modal Resize (Optimized with requestAnimationFrame)
let modalResizeState = {
    isResizing: false,
    startX: 0,
    startY: 0,
    startWidth: 0,
    startHeight: 0,
    lastX: 0,
    lastY: 0,
    pendingUpdate: false
};

function updateModalResizeFrame() {
    if (!modalResizeState.pendingUpdate) return;
    modalResizeState.pendingUpdate = false;

    const deltaX = modalResizeState.lastX - modalResizeState.startX;
    const deltaY = modalResizeState.lastY - modalResizeState.startY;
    const newWidth = Math.max(400, modalResizeState.startWidth + deltaX);
    const newHeight = Math.max(300, modalResizeState.startHeight + deltaY);
    chatgptModal.style.width = newWidth + 'px';
    chatgptModal.style.height = newHeight + 'px';

    requestAnimationFrame(updateModalResizeFrame);
}

modalResizeHandle.addEventListener('mousedown', (e) => {
    modalResizeState.isResizing = true;
    modalResizeState.startX = e.clientX;
    modalResizeState.startY = e.clientY;
    modalResizeState.startWidth = chatgptModal.offsetWidth;
    modalResizeState.startHeight = chatgptModal.offsetHeight;
    chatgptModal.style.willChange = 'width, height';
    requestAnimationFrame(updateModalResizeFrame);
    e.preventDefault();
});

document.addEventListener('mousemove', (e) => {
    if (modalResizeState.isResizing) {
        modalResizeState.lastX = e.clientX;
        modalResizeState.lastY = e.clientY;
        modalResizeState.pendingUpdate = true;
    }
});

document.addEventListener('mouseup', () => {
    if (modalResizeState.isResizing) {
        modalResizeState.isResizing = false;
        chatgptModal.style.willChange = 'auto';
    }
});

// Initialize
updateTimerDisplay();
stopListeningBtn.disabled = true;
pauseBtn.disabled = true;
loadChatGPTUrl();

console.log('マネアカ配信画面 - Manebou Live Studio initialized');
