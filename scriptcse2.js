// DOM Elements
import questionBank from './questionscse1.js';
const welcomeContainer = document.getElementById('welcome-container');
const interviewContainer = document.getElementById('interview-container');
const reportContainer = document.getElementById('report-container');
const codingContainer = document.getElementById('coding-container');
const userForm = document.getElementById('user-form');
const usernameInput = document.getElementById('username');
const backgroundSelect = document.getElementById('background');
const resumeUpload = document.getElementById('resume');
const resumeText = document.getElementById('resume-text');
const timerElement = document.getElementById('timer');
const progressBar = document.getElementById('progress');
const codingQuizBtn = document.getElementById('coding-quiz-btn');
const userVideo = document.getElementById('user-video');
const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const micBtn = document.getElementById('mic-btn');
const reportContent = document.getElementById('report-content');
const restartBtn = document.getElementById('restart-btn');
const codingTimer = document.getElementById('coding-timer');
const problemTitle = document.getElementById('problem-title');
const problemDescription = document.getElementById('problem-description');
const codeArea = document.getElementById('code-area');
const runCodeBtn = document.getElementById('run-code-btn');
const submitCodeBtn = document.getElementById('submit-code-btn');
const returnInterviewBtn = document.getElementById('return-interview-btn');

// Global variables
let userAnswers = []; // ✅ Store user's selected answers

let username = '';
let background = '';
let resumeContent = '';
let extractedSkills = [];
let generalQuestionsAsked = false;
let interviewDuration = 8 * 60; // 8 minutes in seconds
let remainingTime = interviewDuration;
let timerInterval;
let codingTimerInterval;
let codingRemainingTime = 2 * 60; // 4 minutes in seconds
let speechRecognition;
let isListening = false;
let currentQuestionIndex = 0;
let interviewScore = {
    technical: 0,
    communication: 0,
    grammar: 0,
    coding: 0,
    answers: []
};
let isTyping = false;
let questions = [];
let isProcessingAnswer = false;

// Initialize speech recognition
function initSpeechRecognition() {
    window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (window.SpeechRecognition) {
        speechRecognition = new SpeechRecognition();
        speechRecognition.continuous = true;
        speechRecognition.interimResults = true;
        speechRecognition.lang = 'en-US';

        // Create a temporary element to show what’s being recognized
        const tempTextElement = document.createElement('div');
        tempTextElement.className = 'message user-message temp-message';
        tempTextElement.style.opacity = '0.7';

        let finalTranscript = '';
        let silenceTimeout; // Track user's silence

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

            // Update the temporary text display
            if (interimTranscript !== '') {
                if (!document.body.contains(tempTextElement)) {
                    chatMessages.appendChild(tempTextElement);
                }
                tempTextElement.textContent = finalTranscript + interimTranscript;
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }

            // Detect natural pause (silence) for 3 seconds
            clearTimeout(silenceTimeout);
            silenceTimeout = setTimeout(() => {
                if (finalTranscript.trim() !== '' && userInput.value === finalTranscript) {
                    submitUserAnswer(finalTranscript);
                    finalTranscript = '';
                    userInput.value = '';

                    // Remove temporary message display
                    if (document.body.contains(tempTextElement)) {
                        chatMessages.removeChild(tempTextElement);
                    }
                }
            }, 3000); // ✅ 3 seconds of silence = User has finished answering
        };

        speechRecognition.onend = () => {
            isListening = false;
            micBtn.innerHTML = '<i class="mic-icon">🎤</i>';
            micBtn.classList.remove("active");

            // ✅ Restart recognition ONLY if bot is not speaking
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

            // Restart speech recognition if interview is ongoing
            if (remainingTime > 0 && !isProcessingAnswer) {
                setTimeout(() => speechRecognition.start(), 1000);
            }
        };
    } else {
        alert('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
        micBtn.style.display = 'none';
    }
}

async function initVoiceVisualization() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const audioContext = new AudioContext();
        const analyser = audioContext.createAnalyser();
        const microphone = audioContext.createMediaStreamSource(stream);
        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        analyser.fftSize = 512; // Adjust for smoother effect
        microphone.connect(analyser);

        function updateShadow() {
            analyser.getByteFrequencyData(dataArray);
            const volume = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;

            // Map volume level to shadow intensity
            const shadowIntensity = Math.min(50, volume / 5); // Scale shadow effect
            const videoContainer = document.querySelector('.video-container');

            videoContainer.style.boxShadow = `0px 0px ${shadowIntensity}px rgba(0, 255, 0, 0.8)`;

            requestAnimationFrame(updateShadow);
        }

        updateShadow(); // Start visualization
    } catch (error) {
        console.error('Error accessing microphone:', error);
    }
}

// Handle user answer submission
function submitUserAnswer(text) {
    if (isProcessingAnswer || text.trim() === '') return;

    isProcessingAnswer = true;

    // ✅ Stop speech recognition temporarily
    if (speechRecognition) {
        speechRecognition.stop();
    }

    // ✅ Add user message to chat
    addUserMessage(text);

    // ✅ Process the response after a short delay
    setTimeout(() => {
        if (!generalQuestionsAsked) {
            // ✅ Handle technical question response
            processUserResponse(text);
        } else {
            // ✅ Handle general question response properly
            handleGeneralQuestionResponse(text);
        }

        isProcessingAnswer = false;

        // ✅ Resume listening if the interview is still ongoing
        if (remainingTime > 0 && !codingQuizTriggered) {
            speechRecognition.start();
        }
    }, 1000);
}

function handleGeneralQuestionResponse(userResponse) {
    if (remainingTime <= 0) {
        endInterview();
        return;
    }
    // ✅ Compliment user response
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

    // ✅ Ask the next question after a short delay
    setTimeout(() => {
        askRandomGeneralQuestion();
    }, 2000);
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
let codingQuizTriggered = false; // ✅ Prevent multiple quiz prompts

let quizTriggered = false; // ✅ Ensure quiz appears only once

function startTimer() {
    updateTimerDisplay();

    timerInterval = setInterval(() => {
        remainingTime--;
        updateTimerDisplay();

        // ✅ Show quiz exactly at 6-minute mark (240 seconds left)
        if (remainingTime === 120 && !quizTriggered) {
            quizTriggered = true;
            waitForConversationToEndThenShowQuiz(); // ✅ Wait for user response, then show the quiz button
        }

        // ✅ Update progress bar
        const progress = (1 - remainingTime / interviewDuration) * 100;
        progressBar.style.width = `${progress}%`;

        // ✅ End interview when time is up
        if (remainingTime <= 0) {
            clearInterval(timerInterval);
            endInterview();
        }
    }, 1000);
}

function waitForConversationToEndThenShowQuiz() {
    if (isProcessingAnswer || isTyping) {
        // ✅ If a conversation is happening, check again in 2 seconds
        setTimeout(waitForConversationToEndThenShowQuiz, 2000);
    } else {
        // ✅ If the user has finished answering, first give a compliment
        giveRandomCompliment();

        // ✅ After the compliment, show the quiz button
        setTimeout(() => {
            showCodingQuizPrompt();
        }, 2000); // ✅ Delay for a smoother transition
    }
}

function updateTimerDisplay() {
    const minutes = Math.floor(remainingTime / 60);
    const seconds = remainingTime % 60;
    timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function startCodingTimer() {
    updateCodingTimerDisplay();
    codingTimerInterval = setInterval(() => {
        codingRemainingTime--;
        updateCodingTimerDisplay();

        if (codingRemainingTime <= 0) {
            clearInterval(codingTimerInterval);
            submitCodingSolution();
        }
    }, 1000);
}

function updateCodingTimerDisplay() {
    const minutes = Math.floor(codingRemainingTime / 60);
    const seconds = codingRemainingTime % 60;
    codingTimer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Message handling
function addBotMessage(text, delay = 0, speak = true) {
    if (!text || text.trim() === "") return; // Prevent empty messages

    // Add typing indicator
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'typing-indicator';
    typingIndicator.innerHTML = '<span></span><span></span><span></span>';
    chatMessages.appendChild(typingIndicator);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    setTimeout(() => {
        chatMessages.removeChild(typingIndicator); // Ensure it gets removed

        // Create message container
        const messageElement = document.createElement('div');
        messageElement.className = 'message bot-message';

        // ✅ Bot's Name (Header)
        const botNameElement = document.createElement('div');
        botNameElement.className = 'message-name';
        botNameElement.textContent = "MockVox";

        // ✅ Message Text (Typing Effect)
        const messageTextElement = document.createElement('div');
        messageTextElement.className = 'message-text';

        messageElement.appendChild(botNameElement); // Add Bot name
        messageElement.appendChild(messageTextElement); // Add text container

        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        let i = 0;
        isTyping = true;

        const typingEffect = setInterval(() => {
            if (i < text.length) {
                messageTextElement.textContent += text.charAt(i);
                i++;
                chatMessages.scrollTop = chatMessages.scrollHeight;
            } else {
                clearInterval(typingEffect);
                isTyping = false; // Reset typing state

                if (speak) {
                    speakText(text);
                }
            }
        }, 20);
    }, delay);
}

function addUserMessage(text) {
    if (!text || text.trim() === "") return; // Prevent empty messages

    // Function to clean user input by removing meaningless words
    function cleanText(inputText) {
        const meaninglessWords = ["um", "uh", "like", "you know", "sort of", "kind of", "basically", "actually", "literally", "stuff", "things"];
        let words = inputText.toLowerCase().split(/\s+/);

        // Filter out meaningless words
        let cleanedWords = words.filter(word => !meaninglessWords.includes(word));

        // Reconstruct the sentence
        let cleanedText = cleanedWords.join(" ").trim();

        // Ensure first letter is capitalized and proper punctuation
        return cleanedText.charAt(0).toUpperCase() + cleanedText.slice(1) + (cleanedText.endsWith('.') ? '' : '.');
    }

    let formattedText = cleanText(text); // Process user input

    // Create message container
    const messageElement = document.createElement("div");
    messageElement.className = "message user-message";

    // ✅ User's Name (Header)
    const userNameElement = document.createElement("div");
    userNameElement.className = "message-name";
    userNameElement.textContent = username; // Uses the global username variable

    // ✅ Message Text
    const messageTextElement = document.createElement("div");
    messageTextElement.className = "message-text";
    messageTextElement.textContent = formattedText;

    // Append elements
    messageElement.appendChild(userNameElement); // Add User name
    messageElement.appendChild(messageTextElement); // Add text container

    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // ✅ Correctly process responses based on interview phase
    if (generalQuestionsAsked) {
        // ✅ If we are in the general questions phase, process the response accordingly
        handleGeneralQuestionResponse(formattedText);
    } else {
        // ✅ Otherwise, process technical responses
        analyzeUserResponse(formattedText);
    }
}

function speakText(text, callback = null) {
    if ('speechSynthesis' in window) {
        speechRecognition.stop(); // ✅ Stop recognition while bot speaks

        // ✅ Remove emojis before speaking
        const textWithoutEmojis = text.replace(/[\u{1F300}-\u{1F6FF}]/gu, '');

        const utterance = new SpeechSynthesisUtterance(textWithoutEmojis);
        utterance.rate = 1;
        utterance.pitch = 1;
        utterance.volume = 1;

        utterance.onend = () => {
            setTimeout(() => {
                if (callback) callback();
                startListening(); // ✅ Only show next message after bot finishes speaking
            }, 1000);
        };

        window.speechSynthesis.speak(utterance);
    }
}

// Skills extraction
function extractSkillsFromResume(text) {
    const commonSkills = [
        'JavaScript', 'Python', 'Java', 'C++', 'C', 'PHP', 'Swift', 'TypeScript',
        'React', 'Angular', 'Vue', 'Node.js', 'Express', 'Django', 'Flask', 'Spring',
        'SQL', 'MongoDB', 'Firebase', 'AWS', 'Azure', 'Google Cloud', 'Docker',
        'HTML', 'CSS', 'SASS', 'Bootstrap', 'Tailwind', 'jQuery', 'Redux', 'GraphQL',
        'Git', 'CI/CD', 'Agile', 'DevOps', 'Machine Learning', 'Data Science',
        'Full Stack', 'Frontend', 'Backend', 'Mobile Development', 'iOS', 'Android',
        'UI/UX', 'Design', 'Project Management', 'Product Management',
        'SEO', 'Analytics', 'Leadership'
    ];

    const foundSkills = [];
    const textLower = text.toLowerCase();

    commonSkills.forEach(skill => {
        if (textLower.includes(skill.toLowerCase())) {
            foundSkills.push(skill);
        }
    });

    // If no skills found, add some default ones based on background
    if (foundSkills.length === 0) {
        if (background === 'CSE') {
            foundSkills.push('JavaScript', 'HTML', 'CSS', 'Python', 'Data Structures');
        } else if (background === 'MBA') {
            foundSkills.push('Project Management', 'Leadership', 'Marketing', 'Finance', 'Business Strategy');
        } else {
            foundSkills.push('Communication', 'Problem Solving', 'Teamwork', 'Critical Thinking');
        }
    }

    return foundSkills;
}

const codingChallenges = [
    {
        title: "Find the Largest Number",
        description: "Which function correctly finds the largest number in an array?",
        options: [
            "arr.sort((a, b) => a - b)[0]",
            "Math.max(...arr)",
            "arr.reduce((a, b) => Math.max(a, b))",
            "arr[0]"
        ],
        correct: "Math.max(...arr)"
    },
    {
        title: "Check for Prime Numbers",
        description: "Which function correctly checks if a number is prime?",
        options: [
            "num % 2 === 0",
            "num > 1 && ![...Array(num).keys()].slice(2).some(i => num % i === 0)",
            "num.toString().includes('3')",
            "num * 2 !== num"
        ],
        correct: "num > 1 && ![...Array(num).keys()].slice(2).some(i => num % i === 0)"
    },
    {
        title: "Reverse a String",
        description: "Which method correctly reverses a string in JavaScript?",
        options: [
            "str.split('').reverse().join('')",
            "str.reverse()",
            "str[::-1]",
            "reverse(str)"
        ],
        correct: "str.split('').reverse().join('')"
    },
    {
        title: "Filter Even Numbers",
        description: "Which method filters even numbers from an array?",
        options: [
            "arr.filter(n => n % 2 === 0)",
            "arr.map(n => n % 2 === 0)",
            "arr.every(n => n % 2 === 0)",
            "arr.some(n => n % 2 === 0)"
        ],
        correct: "arr.filter(n => n % 2 === 0)"
    },
    {
        title: "Sum of Array Elements",
        description: "Which method correctly calculates the sum of an array?",
        options: [
            "arr.reduce((sum, n) => sum + n, 0)",
            "arr.map(n => sum + n)",
            "arr.filter(n => sum += n)",
            "arr.every(n => sum + n)"
        ],
        correct: "arr.reduce((sum, n) => sum + n, 0)"
    },
    {
        title: "Find Unique Elements",
        description: "Which method correctly finds unique elements in an array?",
        options: [
            "[...new Set(arr)]",
            "arr.unique()",
            "arr.filter(n => arr.indexOf(n) === 1)",
            "arr.distinct()"
        ],
        correct: "[...new Set(arr)]"
    },
    {
        title: "Find the Index of an Element",
        description: "Which method finds the index of an element in an array?",
        options: [
            "arr.indexOf(value)",
            "arr.findIndex(value)",
            "arr.getIndex(value)",
            "arr.searchIndex(value)"
        ],
        correct: "arr.indexOf(value)"
    },
    {
        title: "Remove Duplicates from Array",
        description: "Which method removes duplicate elements from an array?",
        options: [
            "[...new Set(arr)]",
            "arr.filter(n => arr.includes(n))",
            "arr.map(n => n !== n)",
            "arr.sort((a, b) => a - b)"
        ],
        correct: "[...new Set(arr)]"
    },
    {
        title: "Check if an Array is Sorted",
        description: "Which method correctly checks if an array is sorted?",
        options: [
            "arr.every((v, i, a) => !i || a[i - 1] <= v)",
            "arr.sort() === arr",
            "arr.all((a, b) => a < b)",
            "arr.sorted()"
        ],
        correct: "arr.every((v, i, a) => !i || a[i - 1] <= v)"
    }
];


function addBotMessageWithButton(text, buttonText, buttonId, buttonAction) {
    // Create message container
    const messageElement = document.createElement('div');
    messageElement.className = 'message bot-message';

    // Create bot's name
    const botNameElement = document.createElement('div');
    botNameElement.className = 'message-name';
    botNameElement.textContent = "MockVox";

    // Create message text
    const messageTextElement = document.createElement('div');
    messageTextElement.className = 'message-text';
    messageTextElement.textContent = text;

    // Create the button
    const buttonElement = document.createElement('button');
    buttonElement.id = buttonId;
    buttonElement.textContent = buttonText;
    buttonElement.className = "coding-quiz-btn"; // Add CSS class for styling
    buttonElement.onclick = buttonAction; // Assign action function

    // Append elements
    messageElement.appendChild(botNameElement);
    messageElement.appendChild(messageTextElement);
    messageElement.appendChild(buttonElement); // Append the button

    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showCodingQuizPrompt() {
    addBotMessageWithButton(
        "Attempt the quiz by clicking this button:",
        "Start Coding Quiz",
        "coding-quiz-btn",
        startCodingQuiz
    );
}
function generateTechnicalQuestions() {
    const questions = [];

    const followUpMessages = [
        "Can you provide more details or examples about that?",
        "Could you elaborate on your experience with this?",
        "Have you encountered any challenges while working with this? How did you overcome them?",
        "Can you share a real-world project where you applied this?",
        "What best practices do you follow when working with this?",
        "How would you explain this concept to a beginner?",
        "Have you explored any advanced concepts related to this? If so, what?",
        "How do you compare this with alternative technologies or approaches?",
        "Can you describe a situation where this skill helped you solve a problem?",
        "What improvements would you suggest for this technology or approach?",
        "How does this concept fit into the bigger picture of software development?",
        "Can you explain a common mistake developers make with this technology?",
        "How would you optimize performance when working with this?",
        "Can you describe a time when you had to debug an issue related to this?",
        "What tools or frameworks complement this technology well?",
        "Have you ever had to teach this concept to someone else? How did you do it?",
        "What are some real-world applications of this technology?",
        "If you were to build a project using this, how would you start?",
        "What’s a common misconception about this technology?",
        "How do you stay updated with advancements in this field?",
        "Can you provide a comparison between this and a competing technology?",
        "What are some limitations of this approach?",
        "How would you improve an existing system using this technology?",
        "What security concerns should be considered when using this?",
        "Can you describe a situation where this technology failed or didn’t perform as expected?",
        "How does this impact scalability in a system?",
        "Can you give an example of a problem this technology solves effectively?",
        "What’s the future scope of this technology in the industry?",
        "What are the key differences between this and older methods of achieving the same goal?",
        "Have you worked with a team using this technology? What was your role?",
        "What are some trade-offs when choosing this over another solution?",
        "Can you walk me through the process of implementing this from scratch?",
        "What’s the most challenging aspect of working with this?",
        "Can you explain a time when you had to troubleshoot an issue related to this?",
        "What are some best practices you follow when using this in a project?",
        "How would you explain this to someone with no technical background?",
        "What are some real-world use cases where this technology is widely adopted?",
        "Can you suggest any improvements or enhancements for this technology?",
        "How does this technology integrate with other systems or technologies?",
        "What are the key factors to consider when deciding whether to use this?",
        "Can you list some alternative approaches and why you’d pick this one?",
        "What’s the most innovative way you’ve seen this technology being used?",
        "How do you handle errors or unexpected behavior when working with this?",
        "Can you think of an industry where this is underutilized but could be beneficial?",
        "How does this compare in terms of efficiency with other technologies?",
        "What are some performance optimization techniques for this?",
        "Can you give an example of how you would scale an application using this?",
        "What impact does this technology have on maintainability and long-term projects?",
        "How does this relate to emerging trends in the tech industry?",
        "Have you faced any compatibility issues with this technology?",
        "How would you handle data consistency when using this?",
        "Can you provide an example of a complex problem this helped you solve?",
        "How does this interact with cloud computing or distributed systems?",
        "What role does this technology play in security-sensitive applications?",
        "How would you refactor an inefficient implementation of this?",
        "Have you explored automation possibilities related to this?",
        "What testing strategies do you recommend for applications using this?",
        "Can you suggest improvements to an existing implementation using this?",
        "What is the biggest learning curve when adopting this technology?",
        "If you were to mentor someone in this technology, how would you guide them?",
        "How do you ensure best practices are followed while using this in a project?"
    ];
    const usedQuestions = new Set(); // ✅ Store selected questions to avoid duplicates
    let allAvailableQuestions = [];

    // ✅ Collect all relevant questions based on extracted skills
    extractedSkills.forEach(skill => {
        if (questionBank[skill]) {
            allAvailableQuestions = allAvailableQuestions.concat(questionBank[skill]);
        }
    });

    // ✅ If not enough, add default questions
    if (allAvailableQuestions.length < 10 && questionBank['Default']) {
        allAvailableQuestions = allAvailableQuestions.concat(questionBank['Default']);
    }

    // ✅ Shuffle questions and pick 10 random ones
    allAvailableQuestions = shuffleArray(allAvailableQuestions);
    for (let i = 0; i < Math.min(10, allAvailableQuestions.length); i++) {
        let selectedQuestion = allAvailableQuestions[i];

        if (!usedQuestions.has(selectedQuestion.question)) {
            usedQuestions.add(selectedQuestion.question);

            // ✅ Assign a random follow-up question
            let randomFollowUp = followUpMessages[Math.floor(Math.random() * followUpMessages.length)];

            questions.push({
                skill: selectedQuestion.skill || "General",
                question: selectedQuestion.question,
                answer: selectedQuestion.answer, // ✅ Keep answer for later comparison
                followup: randomFollowUp
            });
        }
    }

    return questions;
}

function shuffleArray(array) {
    return array.sort(() => Math.random() - 0.5); // ✅ Shuffle array randomly
}

// Analysis functions
function analyzeUserResponse(text) {
    // Grammar analysis
    const grammarScore = analyzeGrammar(text);
    
    // Communication analysis
    const communicationScore = analyzeCommunication(text);
    
    // Technical analysis
    const technicalScore = analyzeTechnical(text, currentQuestionIndex);
    
    // Update overall scores
    interviewScore.grammar = (interviewScore.grammar * interviewScore.answers.length + grammarScore) / (interviewScore.answers.length + 1);
    interviewScore.communication = (interviewScore.communication * interviewScore.answers.length + communicationScore) / (interviewScore.answers.length + 1);
    interviewScore.technical = (interviewScore.technical * interviewScore.answers.length + technicalScore) / (interviewScore.answers.length + 1);
    
    // Store answer
    interviewScore.answers.push({
        question: questions[currentQuestionIndex].question,
        answer: text,
        scores: {
            grammar: grammarScore,
            communication: communicationScore,
            technical: technicalScore
        }
    });
}

// Mock grammar analysis (would be replaced with a more sophisticated model in production)
function analyzeGrammar(text) {
    let score = 100;

    // Simple checks
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

    // Penalize for very short sentences
    if (sentences.length === 0 || (sentences.length === 1 && sentences[0].split(' ').length < 5)) {
        score -= 30;
    }

    // Check for capitalization at the beginning of sentences
    sentences.forEach(sentence => {
        const trimmed = sentence.trim();
        if (trimmed.length > 0 && trimmed[0] !== trimmed[0].toUpperCase()) {
            score -= 5;
        }
    });

    // Check for common grammatical errors
    const commonErrors = [
        { pattern: /\b(i|im)\b/g, correct: 'I' }, // Lowercase 'i'
        { pattern: /\byour\b(?=\s+(is|are|was|were))/g, correct: "you're" }, // your vs you're
        { pattern: /\btheir\b(?=\s+(is|are|was|were))/g, correct: "they're" }, // their vs they're
        { pattern: /\bits\b(?=\s+(is|are|was|were))/g, correct: "it's" }, // its vs it's
        { pattern: /\b(dont|cant|wont|shouldnt|wouldnt|couldnt)\b/g, correct: "contraction missing apostrophe" }
    ];

    commonErrors.forEach(error => {
        if (error.pattern.test(text.toLowerCase())) {
            score -= 5;
        }
    });

    // Penalty for repeated words
    const words = text.toLowerCase().split(/\s+/);
    for (let i = 1; i < words.length; i++) {
        if (words[i].length > 3 && words[i] === words[i-1]) {
            score -= 5;
        }
    }

    return Math.max(Math.min(score, 100), 0); // Ensure score is between 0 and 100
}

// Mock communication analysis
function analyzeCommunication(text) {
    // Initialize with an object for more comprehensive feedback
    let analysis = {
        score: 80, // Start with a baseline score
        strengths: [],
        weaknesses: [],
        metrics: {}
    };
    
    // Handle empty text
    if (!text || text.trim().length === 0) {
        return {
            score: 0,
            weaknesses: ["No text provided for analysis"],
            strengths: [],
            metrics: { wordCount: 0 }
        };
    }
    
    // Length of response - more nuanced analysis
    const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
    analysis.metrics.wordCount = wordCount;
    
    if (wordCount < 10) {
        analysis.score -= 30;
        analysis.weaknesses.push("Response is too brief (under 10 words)");
    } else if (wordCount >= 10 && wordCount <= 30) {
        analysis.score += 5;
        analysis.strengths.push("Response has good conciseness");
    } else if (wordCount > 30 && wordCount <= 100) {
        analysis.score += 10;
        analysis.strengths.push("Response has comprehensive length");
    } else if (wordCount > 100 && wordCount <= 200) {
        // No penalty for moderately long texts
        analysis.metrics.verbosity = "Moderately detailed";
    } else if (wordCount > 200) {
        const excessWords = wordCount - 200;
        const penalty = Math.min(15, Math.floor(excessWords / 50) * 5);
        analysis.score -= penalty;
        analysis.weaknesses.push(`Response may be excessively verbose (${wordCount} words)`);
    }
    
    // Clarity and structure indicators - weighted by importance
    const clarityPhrases = [
        {phrase: "for example", weight: 2, category: "examples"},
        {phrase: "such as", weight: 2, category: "examples"},
        {phrase: "to illustrate", weight: 2, category: "examples"},
        {phrase: "specifically", weight: 1, category: "precision"},
        {phrase: "in other words", weight: 2, category: "clarification"},
        {phrase: "to clarify", weight: 2, category: "clarification"},
        {phrase: "this means", weight: 1, category: "clarification"},
        {phrase: "in summary", weight: 3, category: "structure"},
        {phrase: "first", weight: 1, category: "structure"},
        {phrase: "second", weight: 1, category: "structure"},
        {phrase: "finally", weight: 1, category: "structure"},
        {phrase: "however", weight: 1, category: "nuance"},
        {phrase: "on the other hand", weight: 2, category: "nuance"},
        {phrase: "alternatively", weight: 2, category: "nuance"},
        {phrase: "consequently", weight: 2, category: "logic"}
    ];
    
    const clarityCategories = {};
    let totalClarityPoints = 0;

    for (const item of clarityPhrases) {
        // Look for the phrase with proper word boundaries
        const regex = new RegExp(`\\b${item.phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
        const matches = text.match(regex) || [];

        if (matches.length > 0) {
            // Avoid giving too many points for the same category
            const points = Math.min(matches.length, 2) * item.weight;
            totalClarityPoints += points;

            // Track category usage
            clarityCategories[item.category] = (clarityCategories[item.category] || 0) + 1;
        }
    }

    // Cap clarity bonus and add category diversity bonus
    const clarityBonus = Math.min(totalClarityPoints, 15);
    const categoryCount = Object.keys(clarityCategories).length;
    const diversityBonus = Math.min(categoryCount * 2, 10);

    analysis.score += clarityBonus + diversityBonus;

    if (totalClarityPoints > 0) {
        analysis.strengths.push(`Good use of clarity elements (${Object.keys(clarityCategories).join(", ")})`);
        analysis.metrics.clarityScore = totalClarityPoints;
    }

    // Paragraph structure analysis
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    analysis.metrics.paragraphCount = paragraphs.length;

    if (wordCount > 50 && paragraphs.length === 1) {
        analysis.score -= 5;
        analysis.weaknesses.push("Text lacks paragraph breaks for readability");
    } else if (paragraphs.length > 1) {
        analysis.strengths.push("Good use of paragraph structure");
        analysis.score += Math.min(paragraphs.length, 3) * 2;
    }

    // Use of filler words - more comprehensive list and weighted impact
    const fillerWords = [
        {word: "um", weight: 2},
        {word: "uh", weight: 2},
        {word: "like", weight: 1, contextual: true},
        {word: "you know", weight: 2},
        {word: "sort of", weight: 1},
        {word: "kind of", weight: 1},
        {word: "basically", weight: 1},
        {word: "actually", weight: 1},
        {word: "literally", weight: 1},
        {word: "stuff", weight: 1},
        {word: "things", weight: 1, contextual: true},
        {word: "so yeah", weight: 2},
        {word: "whatever", weight: 2},
        {word: "anyway", weight: 1, contextual: true},
        {word: "i guess", weight: 2}
    ];

    let fillerCount = 0;
    let fillerPenalty = 0;
    const fillerFound = [];

    for (const filler of fillerWords) {
        let regex;
        if (filler.contextual) {
            // More careful matching for words that might be legitimate in context
            regex = new RegExp(`\\b${filler.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
        } else {
            regex = new RegExp(`\\b${filler.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
        }

        const matches = text.match(regex) || [];
        if (matches.length > 0) {
            // Count each instance
            fillerCount += matches.length;
            fillerPenalty += Math.min(matches.length, 3) * filler.weight;
            fillerFound.push(`${filler.word} (${matches.length})`);
        }
    }

    // Adjust penalty based on text length - less severe for longer texts
    if (fillerCount > 0) {
        const normalizedPenalty = Math.round((fillerPenalty / Math.max(1, wordCount / 50)) * 2);
        analysis.score -= Math.min(normalizedPenalty, 20);
        analysis.weaknesses.push(`Contains filler words/phrases: ${fillerFound.join(", ")}`);
        analysis.metrics.fillerWordCount = fillerCount;
    }

    // Tone and sentiment analysis (basic)
    const positiveWords = ["thank", "appreciate", "helpful", "great", "good", "excellent", 
                         "valuable", "clear", "effective", "efficient", "successful"];
    const negativeWords = ["unfortunately", "problem", "difficult", "confusing", "unclear",
                         "frustrating", "disappointing", "fail", "issue", "complicated"];

    let positiveCount = 0;
    let negativeCount = 0;

    for (const word of positiveWords) {
        const regex = new RegExp(`\\b${word}\\w*\\b`, 'gi'); // Match word roots
        const matches = text.match(regex) || [];
        positiveCount += matches.length;
    }

    for (const word of negativeWords) {
        const regex = new RegExp(`\\b${word}\\w*\\b`, 'gi');
        const matches = text.match(regex) || [];
        negativeCount += matches.length;
    }

    analysis.metrics.toneBalance = { positive: positiveCount, negative: negativeCount };

    // Question analysis - engagement indicator
    const questions = (text.match(/\?/g) || []).length;
    if (questions > 0 && questions <= 3) {
        analysis.score += 5;
        analysis.strengths.push("Uses questions to engage audience");
    } else if (questions > 3) {
        analysis.score -= 3;
        analysis.weaknesses.push("Excessive use of questions may indicate uncertainty");
    }

    // Readability estimate (very basic approximation)
    const sentenceCount = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    if (sentenceCount > 0) {
        const avgWordsPerSentence = wordCount / sentenceCount;
        analysis.metrics.avgSentenceLength = Math.round(avgWordsPerSentence * 10) / 10;

        if (avgWordsPerSentence > 25) {
            analysis.score -= 5;
            analysis.weaknesses.push("Sentences may be too long (average " + 
                                   Math.round(avgWordsPerSentence) + " words)");
        } else if (avgWordsPerSentence < 7 && sentenceCount > 3) {
            analysis.score -= 3;
            analysis.weaknesses.push("Sentences may be too short and choppy");
        } else if (avgWordsPerSentence >= 10 && avgWordsPerSentence <= 20) {
            analysis.score += 5;
            analysis.strengths.push("Good sentence length for readability");
        }
    }

    // Cap the score between 0-100
    return Math.max(Math.min(Math.round(analysis.score), 100), 0);
}

// Mock technical answer evaluation
function analyzeTechnical(userText, questionIndex) {
    if (!questions[questionIndex] || !questions[questionIndex].answer) return 50; // Default score if question or answer is missing

    const correctAnswer = questions[questionIndex].answer.toLowerCase();

    // ✅ Normalize text: Remove punctuation & split into words
    const tokenize = (text) => text.replace(/[.,!?]/g, '').toLowerCase().split(/\s+/);

    const userWords = tokenize(userText);
    const correctWords = tokenize(correctAnswer);

    // ✅ Calculate word overlap (how many words match)
    let matchedWords = userWords.filter(word => correctWords.includes(word)).length;
    let similarityScore = (matchedWords / correctWords.length) * 100;

    // ✅ Set base score
    let score = 50; 

    // ✅ Adjust score based on similarity
    if (similarityScore > 80) {
        score += 40; // Very close match
    } else if (similarityScore > 60) {
        score += 25;
    } else if (similarityScore > 40) {
        score += 15;
    } else if (similarityScore > 20) {
        score += 5;
    } else {
        score -= 10; // Poor match
    }

    // ✅ Consider length of response (short answers might not be sufficient)
    if (userWords.length < 5) {
        score -= 20; // Too short
    } else if (userWords.length > 50) {
        score += 10; // Well-explained answer
    }

    // ✅ Ensure score is between 0 and 100
    return Math.max(Math.min(score, 100), 0);
}

// Process user response and determine next steps
function processUserResponse(text) {
    const currentQuestion = questions[currentQuestionIndex];
    const technicalScore = analyzeTechnical(text, currentQuestionIndex);
    const correctAnswer = currentQuestion.answer.toLowerCase();
    const userResponse = text.trim().toLowerCase();

    // ✅ Tokenization: Split words from user & correct answer
    const answerWords = correctAnswer.split(/\s+/);
    const userWords = userResponse.split(/\s+/);

    // ✅ Calculate match percentage
    let wordsMatched = userWords.filter(word => answerWords.includes(word)).length;
    let matchScore = (wordsMatched / answerWords.length) * 100;

    // ✅ Compliments based on score (Randomized)
    const compliments = {
        high: [
            "🌟 Excellent answer! You covered almost everything perfectly!",
            "🔥 Amazing response! Your knowledge really shines!",
            "🎯 Spot on! That was a fantastic explanation!",
            "💡 Brilliant! You nailed the key concepts effortlessly!",
            "🎓 Outstanding! You explained that like a true expert.",
            "🚀 Superb response! You clearly have a deep understanding.",
            "🌟 That was one of the best answers so far! Keep it up!",
            "💎 Exceptional! Your clarity and detail are impressive.",
            "🏆 You're on another level! That was a masterful explanation.",
            "✅ 100% correct! You really know your stuff!",
            "⚡ Wow! That was an incredibly well-thought-out answer.",
            "🔬 Great depth! You covered both theory and real-world applications.",
            "🔝 Fantastic work! You structured your response perfectly.",
            "✨ Impressive! You made a complex topic sound easy.",
            "🏅 Gold standard response! That was very well explained.",
            "🎤 Mic drop! You absolutely nailed that question.",
            "📚 Your knowledge is strong, and your explanation was crystal clear!",
            "💯 Full marks for that answer! You left no room for doubt.",
            "🚀 High-level response! This shows strong technical expertise.",
            "🧠 Genius! That answer demonstrated your deep understanding."
        ],
        medium: [
            "💡 Great job! Your answer is well-structured, but you can add a bit more detail.",
            "👏 Nice work! You got most of it right. A little more depth would make it even better.",
            "✨ Good response! You have a strong grasp, keep refining your explanations.",
            "👍 Solid answer! Just expand on a few points to make it even stronger.",
            "🎯 Almost there! You're doing great, just a little more refinement needed.",
            "🔍 Good explanation! Maybe provide an example to make it even clearer.",
            "📌 You've got the right idea! A bit more technical detail would be helpful.",
            "🚦 You're on the right path! Try to add some real-world applications.",
            "🔗 Well-structured response! Adding a bit more logic would make it even better.",
            "📝 Good work! If you elaborate a bit more, it'll be even stronger.",
            "💭 Your thoughts are well-organized! Just back it up with some examples.",
            "🎵 Great rhythm in your explanation! Adding an analogy might help clarify further.",
            "🔎 Nice breakdown of the topic! Try to link it to related concepts.",
            "🚀 You're progressing well! A little more confidence will make it even better.",
            "📖 You explained the core idea well! Consider mentioning best practices.",
            "⚡ Good explanation! If you connect it to a real-world scenario, it will stand out.",
            "🔬 Logical and well-thought-out! A bit more detail would make it exceptional.",
            "🏗 Good foundation! Just add some depth to solidify your point.",
            "🎯 Almost a bullseye! A bit more clarity, and you'll hit the mark.",
            "🛠 Solid answer! Fine-tune it with technical insights for a perfect response."
        ],
        average: [
            "👍 Good attempt! You're on the right track, let's dive a little deeper.",
            "✅ Decent response! Some points are correct, but try to elaborate more.",
            "🤔 Not bad! With a bit more clarity, this could be a strong answer.",
            "🔍 You're getting there! A bit more detail will help refine your explanation.",
            "🔄 Keep going! You're close to a great answer, just add more structure.",
            "⚡ You’ve got potential! A few refinements will make this answer shine.",
            "🛤 You’re on the right path! Try rephrasing for more precision.",
            "🎭 Good effort! A little more confidence in your explanation would help.",
            "🔄 Almost there! Try to focus on key technical points for a stronger impact.",
            "🧩 Nice attempt! If you can connect different concepts, it will be stronger.",
            "🔎 Your response is forming well! Keep building on that knowledge.",
            "📚 Decent try! Try to recall similar concepts to reinforce your answer.",
            "🚀 You're improving! Add specific details to enhance your response.",
            "🎯 You have the basic idea! Expanding on it will make your answer more complete.",
            "🔄 Good try! Now, refine it with some key terms and structured thinking.",
            "💬 You're thinking in the right direction! Just be more concise and precise.",
            "🔬 You’ve captured part of the idea! Strengthen it with an example.",
            "📖 A little more reading on this topic, and you'll have a perfect answer!",
            "📝 Not bad at all! If you provide some real-world use cases, it will be stronger.",
            "🛠 Your understanding is there! Work on refining how you explain it."
        ],
        low: [
            "🤔 That's an interesting take!",
            "🔄 No worries! Let's keep learning.",
            "📖 Keep practicing! You'll get better with more attempts.",
            "🚀 Learning is a journey! Let's try another one and keep improving.",
            "🎯 You're trying, and that's what matters! Keep at it!",
            "📌 This is a great chance to improve! Keep challenging yourself.",
            "⚡ It's okay! Every attempt brings you closer to mastery.",
            "🌱 Mistakes are part of learning! Keep pushing forward.",
            "🔗 You're on the learning curve! Don't stop, and it'll click soon.",
            "📚 No stress! Let’s move on and revisit this concept later.",
            "💡 Keep thinking! The more you try, the better you'll understand.",
            "🔎 Keep exploring! You'll find the right way to explain it with practice.",
            "🔧 It’s a work in progress! Try looking at similar questions for guidance.",
            "🚦 Not quite there, but you're moving forward. Keep at it!",
            "🛤 Everyone starts somewhere! Keep practicing, and it'll get easier.",
            "🎵 You're warming up! Keep going, and soon you'll master this.",
            "🔄 That was a good effort! Let's focus on the next question.",
            "🔍 Let’s shift gears and try another one!",
            "📝 Don't worry! Every expert was once a beginner too.",
            "🏗 This is a stepping stone! Every challenge helps you grow."
        ]
    };

    // ✅ Select a random compliment based on score range
    let compliment;
    if (technicalScore > 80) {
        compliment = compliments.high[Math.floor(Math.random() * compliments.high.length)];
    } else if (technicalScore > 60) {
        compliment = compliments.medium[Math.floor(Math.random() * compliments.medium.length)];
    } else if (technicalScore > 50) {
        compliment = compliments.average[Math.floor(Math.random() * compliments.average.length)];
    } else {
        compliment = compliments.low[Math.floor(Math.random() * compliments.low.length)];
    }

    // ✅ Uncertainty handling
    const uncertainResponses = [
        "i don't know", "i am not sure", "i have no idea",
        "i'm unsure", "not sure", "no clue", "i can't answer that"
    ];

    const encouragementMessages = [
        "No worries! Keep going, you'll get better. Here's another question:",
        "It's okay! Learning takes time. Let's try this question instead:",
        "Don't worry, you'll get it next time! How about this question:",
        "That's fine! Every expert was once a beginner. Try answering this:",
        "No stress! You're doing great. Here's another question for you:"
    ];

    // ✅ Handle "I don't know" BEFORE checking score
    if (uncertainResponses.some(response => text.toLowerCase().includes(response))) {
        const randomEncouragement = encouragementMessages[Math.floor(Math.random() * encouragementMessages.length)];
        addBotMessage(randomEncouragement);

        // ✅ Move to the next question
        setTimeout(() => {
            currentQuestionIndex++;
            if (currentQuestionIndex < questions.length && remainingTime > 0) {
                addBotMessage(questions[currentQuestionIndex].question);
            } else {
                addBotMessage("Great effort! We've completed all the technical questions. Let's talk more about your background.");
                setTimeout(() => showCodingQuizPrompt(), 2000);
            }
        }, 2000);

        return;
    }

    // ✅ Follow-up logic for average answers
    if (technicalScore === 50) {
        setTimeout(() => {
            addBotMessage(compliment + " " + currentQuestion.followup);
        }, 1000);
        return;
    }

    // ✅ Move to the next question for good/poor answers
    addBotMessage(compliment);
    
    setTimeout(() => {
        currentQuestionIndex++;
        if (currentQuestionIndex < questions.length && remainingTime > 0) {
            addBotMessage("Here's your next question: " + questions[currentQuestionIndex].question);
        } else {
            addBotMessage("That wraps up the technical round! Now, let's talk about your experience.");
            setTimeout(() => showCodingQuizPrompt(), 2000);
        }
    }, 2000);
}

// Start coding quiz
let currentCodingQuestionIndex = 0;
let selectedcodingAnswer = null;


// ✅ Function to start the coding quiz
function startCodingQuiz() {
    document.getElementById("interview-container").classList.add("hidden");
    document.getElementById("coding-container").classList.remove("hidden");
    
    // ✅ Load first question

    loadCodingQuestion();
    startCodingTimer();
}

// ✅ Function to load a coding question
function loadCodingQuestion() {
    const question = codingChallenges[currentCodingQuestionIndex];

    document.getElementById("problem-title").textContent = `Problem: ${question.title}`;
    document.getElementById("problem-description").textContent = question.description;

    // ✅ Generate multiple-choice options
    const optionsContainer = document.getElementById("options-container");
    optionsContainer.innerHTML = "";
    
    question.options.forEach(option => {
        const optionElement = document.createElement("div");
        optionElement.classList.add("option");
        optionElement.innerHTML = `
            <input type="radio" name="coding-option" value="${option}">
            <label>${option}</label>
        `;
        optionElement.onclick = () => selectAnswer(option);
        optionsContainer.appendChild(optionElement);
    });

    // ✅ Show "Submit" button for the last question
    if (currentCodingQuestionIndex === codingChallenges.length - 1) {
        document.getElementById("next-btn").classList.add("hidden");
        document.getElementById("submit-btn").classList.remove("hidden");
    } else {
        document.getElementById("next-btn").classList.remove("hidden");
        document.getElementById("submit-btn").classList.add("hidden");
    }
}

// ✅ Function to handle answer selection
function selectAnswer(option) {
    selectedcodingAnswer = option;
    userAnswers[currentCodingQuestionIndex] = option; // ✅ Store user's answer

    document.querySelectorAll(".option").forEach(opt => opt.classList.remove("selected"));
    event.currentTarget.classList.add("selected");
}


// ✅ Function to load the next question
function nextQuestion() {
    if (currentCodingQuestionIndex < codingChallenges.length - 1) {
        currentCodingQuestionIndex++;
        loadCodingQuestion();
    }
}

// ✅ Function to submit the quiz
function submitQuiz() {
    if (!selectedcodingAnswer) {
        alert("Please select an answer before submitting.");
        return;
    }

    // ✅ Calculate score based on correct answers
    let codingScore = 0;
    for (let i = 0; i < codingChallenges.length; i++) {
        if (userAnswers[i] === codingChallenges[i].correct) {
            codingScore += (100 / codingChallenges.length); // ✅ Evenly distribute marks
        }
    }

    // ✅ Update interview score
    interviewScore.coding = Math.round(codingScore); // ✅ Round to nearest whole number

    document.getElementById("coding-container").classList.add("hidden");
    document.getElementById("interview-container").classList.remove("hidden");

    alert(`✅ Your coding quiz submission has been recorded!`);

    // ✅ Generate final report
    setTimeout(() => {
        endInterview();
    }, 2000);
}


// Submit coding solution
let askedQuestions = new Set(); // Track asked questions

const generalQuestions = [
    "Can you tell me a little about yourself?",
    "What inspired you to pursue this field of study?",
    "Can you share a challenging project you worked on and how you handled it?",
    "How do you stay updated with the latest industry trends?",
    "What are your strengths and weaknesses?",
    "Tell me about a time you faced a conflict in a team. How did you resolve it?",
    "Where do you see yourself in five years?",
    "What kind of work environment do you thrive in?",
    "How do you handle stress and deadlines?",
    "Do you have any questions for me about the company or role?"
];

function askRandomGeneralQuestion() {
    if (remainingTime <= 0) {
        endInterview();
        return;
    }

    // ✅ Check if all questions are asked
    if (askedQuestions.size >= generalQuestions.length) {
        addBotMessage("That was a great conversation! We've covered everything. Thank you for your time! 😊");
        setTimeout(() => showCodingQuizPrompt(), 3000);
        return;
    }

    // ✅ Pick a random question that hasn't been asked
    let randomIndex;
    do {
        randomIndex = Math.floor(Math.random() * generalQuestions.length);
    } while (askedQuestions.has(randomIndex));

    askedQuestions.add(randomIndex);

    // ✅ Ask the question and wait for response
    addBotMessage(generalQuestions[randomIndex]);
}

// Start the process after the coding section
function submitCodingSolution() {
    clearInterval(codingTimerInterval); // ✅ Stop the quiz timer

    // ✅ Ensure user selected an answer
    if (!selectedAnswer) {
        alert("Please select an answer before submitting.");
        return;
    }

    // ✅ Check if answer is correct & update score
    const currentChallenge = codingChallenges.find(ch => problemTitle.textContent.includes(ch.title));
    const isCorrect = selectedAnswer === currentChallenge.correct;
    interviewScore.coding = isCorrect ? 100 : 0; // ✅ Full or zero score

    // ✅ Hide quiz and return to interview
    codingContainer.classList.add('hidden');
    interviewContainer.classList.remove('hidden');

    // ✅ Show "Submission Recorded" message
    addBotMessage("Your coding quiz submission has been recorded. Now, I'm generating your final interview report...");

    // ✅ Generate final report after delay
    setTimeout(() => {
        endInterview();
    }, 3000);
}

// End interview and show report
function endInterview() {
    // Stop all timers and speech recognition
    clearInterval(timerInterval);
    clearInterval(codingTimerInterval);
    
    if (speechRecognition) {
        speechRecognition.stop();
    }
    
    // Hide all containers except report
    welcomeContainer.classList.add('hidden');
    interviewContainer.classList.add('hidden');
    codingContainer.classList.add('hidden');
    reportContainer.classList.remove('hidden');
    
    // Stop all media streams
    if (userVideo.srcObject) {
        userVideo.srcObject.getTracks().forEach(track => track.stop());
    }
    
    // Generate report
    addBotMessage("I am generating your interview report now...");
    setTimeout(generateReport, 2000);
}

// Generate interview report
function generateReport() {
    const technical = Math.round(interviewScore.technical);
    const communication = Math.round(interviewScore.communication);
    const grammar = Math.round(interviewScore.grammar);
    const coding = interviewScore.coding;
    const overall = Math.round((technical + communication + grammar + coding) / 4);

    let reportHTML = `
        <div class="report-section">
            <h3>Overall Score: <span id="overall-score">0%</span></h3>
            <div class="score-bar"><div class="score-fill" id="overall-bar"></div></div>
            <p>Thank you for completing your interview, ${username}!</p>
        </div>

        <div class="report-section">
            <h3>Technical Knowledge: <span id="technical-score">0%</span></h3>
            <div class="score-bar"><div class="score-fill" id="technical-bar"></div></div>
            <p>${getTechnicalFeedback(technical)}</p>
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
            <h3>Coding Challenge: <span id="coding-score">0%</span></h3>
            <div class="score-bar"><div class="score-fill" id="coding-bar"></div></div>
            <p>${getCodingFeedback(coding)}</p>
        </div>

        <div class="report-section">
            <h3>Question Analysis</h3>
            <div class="text-analysis">
    `;

    // Add question analysis
    interviewScore.answers.forEach((item, index) => {
        reportHTML += `
            <p><strong>Q${index + 1}:</strong> ${item.question}</p>
            <p><em>Your answer:</em> ${item.answer}</p>
            <p><strong>Score:</strong> Technical: ${Math.round(item.scores.technical)}%, Communication: ${Math.round(item.scores.communication)}%</p>
            <hr ${index === interviewScore.answers.length - 1 ? 'class="hidden"' : ''}>
        `;
    });

    reportHTML += `
            </div>
        </div>

        <div class="report-section">
            <h3>Improvement Tips</h3>
            <ul>
                ${getImprovementTips(technical, communication, grammar, coding)}
            </ul>
        </div>
    `;

    reportContent.innerHTML = reportHTML;

    // Animate the score increase
    animateScore("overall-score", "overall-bar", overall);
    animateScore("technical-score", "technical-bar", technical);
    animateScore("communication-score", "communication-bar", communication);
    animateScore("grammar-score", "grammar-bar", grammar);
    animateScore("coding-score", "coding-bar", coding);
}

// Function to animate score increase
function animateScore(scoreId, barId, finalScore) {
    let currentScore = 0;
    const increment = finalScore / 50; // Gradual increase in 50 steps
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
    }, 20); // Update every 20ms for a smooth effect
}

// Feedback generator functions
function getTechnicalFeedback(score) {
    if (score >= 90) {
        return "Excellent technical knowledge! You demonstrated thorough understanding of concepts and applied them appropriately.";
    } else if (score >= 75) {
        return "Good technical knowledge. You showed solid understanding of most concepts discussed.";
    } else if (score >= 60) {
        return "Acceptable technical knowledge. Consider deepening your understanding of key concepts in your field.";
    } else {
        return "Your technical responses need improvement. We recommend further study and practice with core concepts.";
    }
}

function getCommunicationFeedback(score) {
    if (score >= 90) {
        return "Excellent communication skills! You expressed ideas clearly and concisely.";
    } else if (score >= 75) {
        return "Good communication skills. Your responses were generally clear and well-structured.";
    } else if (score >= 60) {
        return "Acceptable communication. Focus on organizing your thoughts more clearly and using examples.";
    } else {
        return "Your communication needs improvement. Practice expressing technical concepts more clearly and concisely.";
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

function getCodingFeedback(score) {
    if (score >= 90) {
        return "Excellent coding skills! Your solution was efficient and well-implemented.";
    } else if (score >= 75) {
        return "Good coding skills. Your solution addressed the core problem effectively.";
    } else if (score >= 60) {
        return "Acceptable coding solution. Consider improving code organization and efficiency.";
    } else {
        return "Your coding solution needs improvement. Focus on algorithm design and coding best practices.";
    }
}

function getImprovementTips(technical, communication, grammar, coding) {
    const tips = [];
    
    if (technical < 70) {
        tips.push("Review core technical concepts in your field and practice explaining them clearly.");
        tips.push("Work on more projects to gain practical experience with the technologies you're using.");
    }
    
    if (communication < 70) {
        tips.push("Practice structuring your responses with a clear beginning, middle, and conclusion.");
        tips.push("Use specific examples to illustrate points rather than general statements.");
    }
    
    if (grammar < 70) {
        tips.push("Review basic grammar rules and practice professional communication.");
        tips.push("Consider using tools like Grammarly to check your written communication.");
    }
    
    if (coding < 70) {
        tips.push("Practice coding challenges regularly on platforms like LeetCode or HackerRank.");
        tips.push("Study algorithm design and data structures to improve problem-solving skills.");
    }
    
    // Add general tips if performing well in all areas
    if (technical >= 70 && communication >= 70 && grammar >= 70 && coding >= 70) {
        tips.push("Continue building your portfolio with diverse projects.");
        tips.push("Consider learning additional technologies to expand your skill set.");
        tips.push("Practice mock interviews regularly to maintain your interview skills.");
    }
    
    let tipsHTML = "";
    tips.forEach(tip => {
        tipsHTML += `<li>${tip}</li>`;
    });
    
    return tipsHTML;
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
                if (!introAnswered) {
                    handleIntroduction(finalTranscript); // ✅ Handle introduction separately
                } else {
                    submitUserAnswer(finalTranscript); // ✅ Process technical answers normally
                }
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

function askNextQuestion() {
    if (currentQuestionIndex < questions.length) {
        const question = questions[currentQuestionIndex];
        currentQuestionIndex++;

        addBotMessage(question.question);

        setTimeout(() => {
            startListening();
        }, 1000);
     // ✅ Move to General Questions
    } else {
        showCodingQuizPrompt(); // ✅ Show coding quiz button
    }
}
function handleIntroduction(text) {
    if (!text || text.trim() === "") return; // ✅ Prevent empty responses

    addUserMessage(text); // ✅ Show user response in chat

    setTimeout(() => {
        // ✅ Give a simple compliment
        const compliments = [
            "That was a great introduction! 😊",
            "You spoke well about yourself. 👍",
            "Nice response! Let's move forward. 🚀",
            "Great! Now, let's start the technical questions. 🎯",
            "I appreciate your introduction! Now let's begin. 🌟"
        ];
    
        const compliment = compliments[Math.floor(Math.random() * compliments.length)];
        addBotMessage(compliment);

        // ✅ Mark introduction as answered and proceed to technical questions
        introAnswered = true;

        setTimeout(() => {
            addBotMessage("Now, let's start with the technical questions.");
            askNextQuestion(); // ✅ Start technical questions after submitting intro response
        }, 3000);
    }, 1000); // ✅ Allow time for the response to appear before moving forward
}



// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Form submission
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
        } else if (resumeText.value.trim() !== '') {
            resumeContent = resumeText.value.trim();
            startInterview();
        } else {
            alert('Please either upload a resume file or paste your resume text.');
        }
    });
    
    function startInterview() {
        welcomeContainer.classList.add('hidden');
        interviewContainer.classList.remove('hidden');
    
        // Extract skills from resume
        extractedSkills = extractSkillsFromResume(resumeContent);
    
        // Generate questions based on skills
        questions = generateTechnicalQuestions();
    
        if (!questions || questions.length === 0) {
            console.error("No questions generated.");
            addBotMessage("Oops! No questions were generated. Please check your resume and try again.", 0, true);
            return;
        }
    
        // ✅ Initialize camera, voice visualization, and speech recognition
        initCamera();
        initSpeechRecognition();
        initVoiceVisualization();
    
        const welcomeMessages = [
            `Hello ${username}! Welcome to your technical interview simulation. Let's get started!`,
            `Hi ${username}, great to have you here! Let's begin your interview practice.`,
            `Welcome ${username}! Get ready for an engaging technical interview experience.`,
            `Hey ${username}! Ready to sharpen your interview skills? Let's go!`,
            `Hello ${username}! This interview simulation is designed to challenge and improve you. Let's start!`,
            `Hi there, ${username}! Let's dive into your technical interview preparation!`,
            `Welcome, ${username}! Excited to test your knowledge today? Let's begin!`,
            `Hey ${username}! You're in the right place for some great technical questions. Let's start!`,
            `Hello ${username}! Let's make this a valuable interview practice session. Ready?`,
            `Hi ${username}! Get ready for an insightful and interactive interview simulation!`
        ];
    
        function getRandomWelcomeMessage(username) {
            return welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
        }
    
        // ✅ Step 1: Speak and display the welcome message
        setTimeout(() => {
            const welcomeMessage = getRandomWelcomeMessage(username);
            speakText(welcomeMessage);
            addBotMessage(welcomeMessage, 0, false);
        }, 1000);
    
        // ✅ Step 2: Speak and display skills message after welcome message is spoken
        setTimeout(() => {
            const skillMessages = [
                `I notice you have experience with ${extractedSkills.join(', ')}. That's impressive!`,
                `Your knowledge in ${extractedSkills.join(', ')} really stands out!`,
                `Having expertise in ${extractedSkills.join(', ')} is a great asset!`,
                `I see you’re skilled in ${extractedSkills.join(', ')}. That’s fantastic!`,
                `Your proficiency in ${extractedSkills.join(', ')} is truly remarkable!`,
                `Wow! ${extractedSkills.join(', ')} is a strong skill to have!`,
                `It's great that you have experience in ${extractedSkills.join(', ')}!`,
                `I like that you're experienced in ${extractedSkills.join(', ')}.`,
                `Your background in ${extractedSkills.join(', ')} is quite valuable.`,
                `I'm impressed by your skills in ${extractedSkills.join(', ')}!`
            ];
            const randomMessage = skillMessages[Math.floor(Math.random() * skillMessages.length)];
            addBotMessage(randomMessage, 0, false);
        }, 5000); // ✅ Fixed skills message
    
        // ✅ Step 3: Speak a transition message before the first question
        setTimeout(() => {
            const transitionSentences = [
                "These are the skills we noticed you have. Now, answer the first question.",
                "We've analyzed your skills. Let's begin with the first question.",
                "Now that we know your skills, let's dive into the first question.",
                "Your skills are impressive! Let's see how you apply them to this first question.",
                "Great! Based on your skills, here's your first challenge.",
                "Now that we've covered your expertise, it's time for the first question.",
                "I see you're skilled in many areas. Let's begin with a relevant question.",
                "Now that we've reviewed your skills, let's jump into the first question.",
                "Let's put your skills to the test with this first question.",
                "You're off to a great start! Now, let's move to the first question."
            ];
    
            const randomSentence = transitionSentences[Math.floor(Math.random() * transitionSentences.length)];
            speakText(randomSentence);
        }, 9000); // ✅ Wait for skills message to finish
    
        // ✅ Step 4: Speak and display the first question
        setTimeout(() => {
            addBotMessage("Before we start with technical questions, tell me about yourself.");
            // ✅ Step 5: Enable mic 1 second after the question is spoken
            setTimeout(() => {
                startListening(); // ✅ Start listening instead of reinitializing speech recognition
            }, 2000);
    
        }, 12000); // ✅ Wait for transition message to finish
    
        // ✅ Start the interview timer after everything is set up
        setTimeout(() => {
            startTimer();
        }, 12000);
    }
    
    
    
    // Handle mic button
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
    
    // Handle user input submission
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
    
    // Coding quiz button
    codingQuizBtn.addEventListener('click', startCodingQuiz);
    
    // Run code button
    runCodeBtn.addEventListener('click', () => {
        // In a real app, you'd execute the code in a sandbox
        alert('Code execution would be implemented here in a real application.');
    });
    
    
    
    // Return to interview button
    returnInterviewBtn.addEventListener('click', () => {
        codingContainer.classList.add('hidden');
        interviewContainer.classList.remove('hidden');
        startTimer(); // Resume main timer
    });
    
    // Restart button
    restartBtn.addEventListener('click', () => {
        location.reload();
    });
});

// ✅ Make functions globally available
window.nextQuestion = nextQuestion;
window.submitQuiz = submitQuiz;
