// DOM Elements
const welcomeContainer = document.getElementById('welcome-container');
const interviewContainer = document.getElementById('interview-container');
const reportContainer = document.getElementById('report-container');
const userForm = document.getElementById('user-form');
const usernameInput = document.getElementById('username');
const backgroundSelect = document.getElementById('background');
const resumeUpload = document.getElementById('resume');
const timerElement = document.getElementById('timer');
const progressBar = document.getElementById('progress');
const userVideo = document.getElementById('user-video');
const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const micBtn = document.getElementById('mic-btn');
const reportContent = document.getElementById('report-content');
const restartBtn = document.getElementById('restart-btn');

// Global variables
let username = '';
let background = '';
let resumeContent = '';
let remainingTime = 6 * 60; // 6 minutes in seconds
let timerInterval;
let speechRecognition;
let isListening = false;
let currentQuestionIndex = 0;
let isProcessingAnswer = false;
let askedQuestions = new Set();

let interviewScore = {
    communication: 0,
    grammar: 0,
    answers: []
};

const generalQuestions = [
    "Can you tell me a little about yourself?",
    "What inspired you to pursue your current career path?",
    "Can you share a challenging situation you faced and how you handled it?",
    "How do you stay motivated during difficult times?",
    "What are your strengths and weaknesses?",
    "Describe a time you worked successfully in a team.",
    "Where do you see yourself in five years?",
    "How do you handle stress and tight deadlines?",
    "What do you know about our company and why do you want to work here?",
    "Do you have any questions for me about the role or company?"
];

// Initialize speech recognition
function initSpeechRecognition() {
    window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (window.SpeechRecognition) {
        speechRecognition = new SpeechRecognition();
        speechRecognition.continuous = true;
        speechRecognition.interimResults = true;
        speechRecognition.lang = 'en-US';

        let finalTranscript = '';
        let silenceTimeout;

        speechRecognition.onresult = (event) => {
            let interimTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;

                if (event.results[i].isFinal) {
                    finalTranscript += transcript + ' ';
                    userInput.value = finalTranscript;
                } else {
                    interimTranscript += transcript;
                }
            }

            if (interimTranscript !== '') {
                userInput.value = finalTranscript + interimTranscript;
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }

            clearTimeout(silenceTimeout);
            silenceTimeout = setTimeout(() => {
                if (finalTranscript.trim() !== '' && userInput.value === finalTranscript) {
                    submitUserAnswer(finalTranscript);
                    finalTranscript = '';
                    userInput.value = '';
                }
            }, 3000);
        };

        speechRecognition.onend = () => {
            isListening = false;
            micBtn.innerHTML = '<i class="mic-icon">🎤</i>';
            micBtn.classList.remove("active");

            setTimeout(() => {
                if (remainingTime > 0 && !isProcessingAnswer && !window.speechSynthesis.speaking) {
                    speechRecognition.start();
                    isListening = true;
                    micBtn.innerHTML = '<i class="mic-icon">🎤 (Listening)</i>';
                    micBtn.classList.add("active");
                }
            }, 1000);
        };

        speechRecognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            micBtn.innerHTML = '<i class="mic-icon">🎤</i>';
            micBtn.classList.remove('active');

            if (remainingTime > 0 && !isProcessingAnswer) {
                setTimeout(() => speechRecognition.start(), 1000);
            }
        };
    } else {
        alert('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
        micBtn.style.display = 'none';
    }
}

// Initialize camera
async function initCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        userVideo.srcObject = stream;
        console.log('Camera initialized successfully');
    } catch (error) {
        console.error('Error accessing camera:', error);
        addBotMessage('I cannot access your camera. Please make sure your camera is connected and you have given permission.');
    }
}

// Timer functions
function startTimer() {
    updateTimerDisplay();

    timerInterval = setInterval(() => {
        remainingTime--;
        updateTimerDisplay();

        const progress = (1 - remainingTime / (6 * 60)) * 100;
        progressBar.style.width = `${progress}%`;

        if (remainingTime <= 0) {
            clearInterval(timerInterval);
            endInterview();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const minutes = Math.floor(remainingTime / 60);
    const seconds = remainingTime % 60;
    timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Message handling
function addBotMessage(text, delay = 0, speak = true) {
    if (!text || text.trim() === "") return;

    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'typing-indicator';
    typingIndicator.innerHTML = '<span></span><span></span><span></span>';
    chatMessages.appendChild(typingIndicator);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    setTimeout(() => {
        chatMessages.removeChild(typingIndicator);

        const messageElement = document.createElement('div');
        messageElement.className = 'message bot-message';

        const botNameElement = document.createElement('div');
        botNameElement.className = 'message-name';
        botNameElement.textContent = "ScreenBot";

        const messageTextElement = document.createElement('div');
        messageTextElement.className = 'message-text';

        messageElement.appendChild(botNameElement);
        messageElement.appendChild(messageTextElement);

        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        let i = 0;
        let isTyping = true;

        const typingEffect = setInterval(() => {
            if (i < text.length) {
                messageTextElement.textContent += text.charAt(i);
                i++;
                chatMessages.scrollTop = chatMessages.scrollHeight;
            } else {
                clearInterval(typingEffect);
                isTyping = false;

                if (speak) {
                    speakText(text);
                }
            }
        }, 20);
    }, delay);
}

function addUserMessage(text) {
    if (!text || text.trim() === "") return;

    function cleanText(inputText) {
        const meaninglessWords = ["um", "uh", "like", "you know", "sort of", "kind of", "basically", "actually", "literally", "stuff", "things"];
        let words = inputText.toLowerCase().split(/\s+/);

        let cleanedWords = words.filter(word => !meaninglessWords.includes(word));

        let cleanedText = cleanedWords.join(" ").trim();

        return cleanedText.charAt(0).toUpperCase() + cleanedText.slice(1) + (cleanedText.endsWith('.') ? '' : '.');
    }

    let formattedText = cleanText(text);

    const messageElement = document.createElement("div");
    messageElement.className = "message user-message";

    const userNameElement = document.createElement("div");
    userNameElement.className = "message-name";
    userNameElement.textContent = username;

    const messageTextElement = document.createElement("div");
    messageTextElement.className = "message-text";
    messageTextElement.textContent = formattedText;

    messageElement.appendChild(userNameElement);
    messageElement.appendChild(messageTextElement);

    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    analyzeUserResponse(formattedText);
}

function speakText(text, callback = null) {
    if ('speechSynthesis' in window) {
        speechRecognition.stop();

        const textWithoutEmojis = text.replace(/[\u{1F300}-\u{1F6FF}]/gu, '');

        const utterance = new SpeechSynthesisUtterance(textWithoutEmojis);
        utterance.rate = 1;
        utterance.pitch = 1;
        utterance.volume = 1;

        utterance.onend = () => {
            setTimeout(() => {
                if (callback) callback();
                startListening();
            }, 1000);
        };

        window.speechSynthesis.speak(utterance);
    }
}

// Analyze user response for grammar and communication
function analyzeUserResponse(text) {
    const grammarScore = analyzeGrammar(text);
    const communicationScore = analyzeCommunication(text);

    interviewScore.grammar = (interviewScore.grammar * interviewScore.answers.length + grammarScore) / (interviewScore.answers.length + 1);
    interviewScore.communication = (interviewScore.communication * interviewScore.answers.length + communicationScore) / (interviewScore.answers.length + 1);

    interviewScore.answers.push({
        question: generalQuestions[currentQuestionIndex - 1],
        answer: text,
        scores: {
            grammar: grammarScore,
            communication: communicationScore
        }
    });

    // Compliment user response
    const compliments = [
        "That was a great response! You expressed yourself very well. 😊",
        "I really liked your answer. You have a great perspective! 🌟",
        "That’s an insightful response! It shows your experience and thoughtfulness. 👍",
        "Your answer was well-structured and clear. Keep it up! 💡",
        "I appreciate how you explained that! It was very thoughtful. 👏",
        "That’s a fantastic way to put it! You have strong communication skills. 🎯",
        "I can see your passion and dedication in that response. Great job! 🚀",
        "Your response was detailed and to the point. I love the clarity! ✅",
        "That’s an interesting take! You bring a unique perspective. 🔥",
        "You're doing great! I really enjoyed hearing your thoughts. Keep going! 😃"
    ];
    addBotMessage(compliments[Math.floor(Math.random() * compliments.length)]);

    setTimeout(() => {
        askNextQuestion();
    }, 2000);
}

// Mock grammar analysis
function analyzeGrammar(text) {
    let score = 100;

    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

    if (sentences.length === 0 || (sentences.length === 1 && sentences[0].split(' ').length < 5)) {
        score -= 30;
    }

    sentences.forEach(sentence => {
        const trimmed = sentence.trim();
        if (trimmed.length > 0 && trimmed[0] !== trimmed[0].toUpperCase()) {
            score -= 5;
        }
    });

    const commonErrors = [
        { pattern: /\b(i|im)\b/g, correct: 'I' },
        { pattern: /\byour\b(?=\s+(is|are|was|were))/g, correct: "you're" },
        { pattern: /\btheir\b(?=\s+(is|are|was|were))/g, correct: "they're" },
        { pattern: /\bits\b(?=\s+(is|are|was|were))/g, correct: "it's" },
        { pattern: /\b(dont|cant|wont|shouldnt|wouldnt|couldnt)\b/g, correct: "contraction missing apostrophe" }
    ];

    commonErrors.forEach(error => {
        if (error.pattern.test(text.toLowerCase())) {
            score -= 5;
        }
    });

    const words = text.toLowerCase().split(/\s+/);
    for (let i = 1; i < words.length; i++) {
        if (words[i].length > 3 && words[i] === words[i-1]) {
            score -= 5;
        }
    }

    return Math.max(Math.min(score, 100), 0);
}

// Mock communication analysis
function analyzeCommunication(text) {
    let score = 80;

    if (!text || text.trim().length === 0) {
        return 0;
    }

    const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;

    if (wordCount < 10) {
        score -= 30;
    } else if (wordCount >= 10 && wordCount <= 30) {
        score += 5;
    } else if (wordCount > 30 && wordCount <= 100) {
        score += 10;
    } else if (wordCount > 100) {
        const excessWords = wordCount - 100;
        const penalty = Math.min(15, Math.floor(excessWords / 50) * 5);
        score -= penalty;
    }

    return Math.max(Math.min(score, 100), 0);
}

function startListening() {
    if (!speechRecognition) return;

    if (window.speechSynthesis.speaking) {
        setTimeout(startListening, 500);
        return;
    }

    speechRecognition.start();
    isListening = true;
    micBtn.innerHTML = '<i class="mic-icon">🎤 (Listening)</i>';
    micBtn.classList.add("active");

    let finalTranscript = "";
    let silenceTimeout;

    speechRecognition.onresult = (event) => {
        let interimTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;

            if (event.results[i].isFinal) {
                finalTranscript += transcript + " ";
                userInput.value = finalTranscript;
            } else {
                interimTranscript += transcript;
            }
        }

        clearTimeout(silenceTimeout);
        silenceTimeout = setTimeout(() => {
            if (finalTranscript.trim() !== "" && userInput.value === finalTranscript) {
                submitUserAnswer(finalTranscript);
                finalTranscript = "";
                userInput.value = "";
            }
        }, 3000);
    };

    speechRecognition.onend = () => {
        isListening = false;
        micBtn.innerHTML = '<i class="mic-icon">🎤</i>';
        micBtn.classList.remove("active");

        setTimeout(() => {
            if (remainingTime > 0 && !isProcessingAnswer && !window.speechSynthesis.speaking) {
                speechRecognition.start();
                isListening = true;
                micBtn.innerHTML = '<i class="mic-icon">🎤 (Listening)</i>';
                micBtn.classList.add("active");
            }
        }, 1000);
    };

    speechRecognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        micBtn.innerHTML = '<i class="mic-icon">🎤</i>';
        micBtn.classList.remove("active");

        if (remainingTime > 0 && !isProcessingAnswer) {
            setTimeout(() => speechRecognition.start(), 1000);
        }
    };
}

function submitUserAnswer(text) {
    if (isProcessingAnswer || text.trim() === '') return;

    isProcessingAnswer = true;

    if (speechRecognition) {
        speechRecognition.stop();
    }

    addUserMessage(text);

    setTimeout(() => {
        isProcessingAnswer = false;

        if (remainingTime > 0) {
            startListening();
        }
    }, 1000);
}

function askNextQuestion() {
    if (remainingTime <= 0 || currentQuestionIndex >= generalQuestions.length) {
        endInterview();
        return;
    }

    addBotMessage(generalQuestions[currentQuestionIndex]);
    currentQuestionIndex++;
}

function endInterview() {
    clearInterval(timerInterval);

    if (speechRecognition) {
        speechRecognition.stop();
    }

    welcomeContainer.classList.add('hidden');
    interviewContainer.classList.add('hidden');
    reportContainer.classList.remove('hidden');

    if (userVideo.srcObject) {
        userVideo.srcObject.getTracks().forEach(track => track.stop());
    }

    addBotMessage("Generating your screening report now...");

    setTimeout(generateReport, 2000);
}

function generateReport() {
    const communication = Math.round(interviewScore.communication);
    const grammar = Math.round(interviewScore.grammar);
    const overall = Math.round((communication + grammar) / 2);

    let reportHTML = `
        <div class="report-section">
            <h3>Overall Score: <span id="overall-score">0%</span></h3>
            <div class="score-bar"><div class="score-fill" id="overall-bar"></div></div>
            <p>Thank you for completing the screening, ${username}!</p>
        </div>

        <div class="report-section">
            <h3>Communication Skills: <span id="communication-score">0%</span></h3>
            <div class="score-bar"><div class="score-fill" id="communication-bar"></div></div>
            <p>${getCommunicationFeedback(communication)}</p>
        </div>

        <div class="report-section">
            <h3>Grammar & Language: <span id="grammar-score">0%</span></h3>
            <div class="score-bar"><div class="score-fill" id="grammar-bar"></div></div>
            <p>${getGrammarFeedback(grammar)}</p>
        </div>

        <div class="report-section">
            <h3>Question Analysis</h3>
            <div class="text-analysis">
    `;

    interviewScore.answers.forEach((item, index) => {
        reportHTML += `
            <p><strong>Q${index + 1}:</strong> ${item.question}</p>
            <p><em>Your answer:</em> ${item.answer}</p>
            <p><strong>Score:</strong> Communication: ${Math.round(item.scores.communication)}%, Grammar: ${Math.round(item.scores.grammar)}%</p>
            <hr ${index === interviewScore.answers.length - 1 ? 'class="hidden"' : ''}>
        `;
    });

    reportHTML += `
            </div>
        </div>

        <div class="report-section">
            <h3>Improvement Tips</h3>
            <ul>
                ${getImprovementTips(communication, grammar)}
            </ul>
        </div>
    `;

    reportContent.innerHTML = reportHTML;

    animateScore("overall-score", "overall-bar", overall);
    animateScore("communication-score", "communication-bar", communication);
    animateScore("grammar-score", "grammar-bar", grammar);
}

function animateScore(scoreId, barId, finalScore) {
    let currentScore = 0;
    const increment = finalScore / 50;
    const scoreElement = document.getElementById(scoreId);
    const barElement = document.getElementById(barId);

    const interval = setInterval(() => {
        currentScore += increment;
        if (currentScore >= finalScore) {
            currentScore = finalScore;
            clearInterval(interval);
        }
        scoreElement.innerText = `${Math.round(currentScore)}%`;
        barElement.style.width = `${Math.round(currentScore)}%`;
    }, 20);
}

function getCommunicationFeedback(score) {
    if (score >= 90) {
        return "Excellent communication skills! You expressed ideas clearly and concisely.";
    } else if (score >= 75) {
        return "Good communication skills. Your responses were generally clear and well-structured.";
    } else if (score >= 60) {
        return "Acceptable communication. Focus on organizing your thoughts more clearly and using examples.";
    } else {
        return "Your communication needs improvement. Practice expressing your ideas more clearly and concisely.";
    }
}

function getGrammarFeedback(score) {
    if (score >= 90) {
        return "Excellent grammar and language usage. Your responses were professionally phrased.";
    } else if (score >= 75) {
        return "Good grammar and language skills with minor areas for improvement.";
    } else if (score >= 60) {
        return "Acceptable grammar. Pay attention to sentence structure and word choice.";
    } else {
        return "Your grammar and language need improvement. Consider practicing professional communication.";
    }
}

function getImprovementTips(communication, grammar) {
    const tips = [];

    if (communication < 70) {
        tips.push("Practice structuring your responses with a clear beginning, middle, and conclusion.");
        tips.push("Use specific examples to illustrate points rather than general statements.");
    }

    if (grammar < 70) {
        tips.push("Review basic grammar rules and practice professional communication.");
        tips.push("Consider using tools like Grammarly to check your written communication.");
    }

    if (communication >= 70 && grammar >= 70) {
        tips.push("Continue practicing your communication skills regularly.");
        tips.push("Engage in conversations and presentations to build confidence.");
    }

    let tipsHTML = "";
    tips.forEach(tip => {
        tipsHTML += `<li>${tip}</li>`;
    });

    return tipsHTML;
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    userForm.addEventListener('submit', (e) => {
        e.preventDefault();

        username = usernameInput.value.trim();
        background = backgroundSelect.value;

        if (resumeUpload.files.length > 0) {
            const file = resumeUpload.files[0];
            const reader = new FileReader();

            reader.onload = (e) => {
                resumeContent = e.target.result;
                startInterview();
            };

            reader.readAsText(file);
        } else {
            alert('Please upload a resume file.');
        }
    });

    function startInterview() {
        welcomeContainer.classList.add('hidden');
        interviewContainer.classList.remove('hidden');

        initCamera();
        initSpeechRecognition();

        const welcomeMessage = `Hello ${username}! Welcome to your general screening test. Let's get started!`;
        addBotMessage(welcomeMessage, 0, false);

        setTimeout(() => {
            addBotMessage("I will ask you 10 general questions. Please answer them as best as you can.");
        }, 2000);

        setTimeout(() => {
            askNextQuestion();
            startTimer();
        }, 5000);
    }

    micBtn.addEventListener('click', () => {
        if (speechRecognition) {
            if (isListening) {
                speechRecognition.stop();
                isListening = false;
                micBtn.innerHTML = '<i class="mic-icon">🎤</i>';
                micBtn.classList.remove('active');
            } else {
                speechRecognition.start();
                isListening = true;
                micBtn.innerHTML = '<i class="mic-icon">🎤 (listening)</i>';
                micBtn.classList.add('active');
            }
        }
    });

    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const text = userInput.value.trim();

            if (text !== '') {
                submitUserAnswer(text);
                userInput.value = '';
            }
        }
    });

    restartBtn.addEventListener('click', () => {
        location.reload();
    });
});
