// DOM Elements
const welcomeContainer = document.getElementById('welcome-container');
const interviewContainer = document.getElementById('interview-container');
const reportContainer = document.getElementById('report-container');
const codingContainer = document.getElementById('coding-container');
const userForm = document.getElementById('user-form');
const usernameInput = document.getElementById('username');
const backgroundSelect = document.getElementById('background');
const resumeUpload = document.getElementById('resume');
const resumeText = document.getElementById('resume-text');
const startBtn = document.getElementById('start-btn');
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
let username = '';
let background = '';
let resumeContent = '';
let extractedSkills = [];
let interviewDuration = 8 * 60; // 8 minutes in seconds
let remainingTime = interviewDuration;
let timerInterval;
let codingTimerInterval;
let codingRemainingTime = 4 * 60; // 4 minutes in seconds
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
let followupAsked = false;
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
        
        // Create a temporary element to show what's being recognized
        const tempTextElement = document.createElement('div');
        tempTextElement.className = 'message user-message temp-message';
        tempTextElement.style.opacity = '0.7';
        
        let finalTranscript = '';
        
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
            
            // Update the temporary text
            if (interimTranscript !== '') {
                if (!document.body.contains(tempTextElement)) {
                    chatMessages.appendChild(tempTextElement);
                }
                tempTextElement.textContent = finalTranscript + interimTranscript;
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
            
            // Detect natural pause (silence) to submit the answer
            if (event.results[event.resultIndex].isFinal && !isProcessingAnswer) {
                // Wait a bit to see if user continues speaking
                setTimeout(() => {
                    // If no new results after 1.5 seconds, consider it a complete answer
                    if (finalTranscript.trim() !== '' && userInput.value === finalTranscript) {
                        submitUserAnswer(finalTranscript);
                        finalTranscript = '';
                        userInput.value = '';
                        
                        // Remove the temporary element
                        if (document.body.contains(tempTextElement)) {
                            chatMessages.removeChild(tempTextElement);
                        }
                    }
                }, 1500);
            }
        };
        
        speechRecognition.onend = () => {
            // Restart speech recognition if interview is ongoing
            if (remainingTime > 0 && !isProcessingAnswer) {
                speechRecognition.start();
            }
            
            micBtn.innerHTML = '<i class="mic-icon">🎤</i>';
            micBtn.classList.remove('active');
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

// Handle user answer submission
function submitUserAnswer(text) {
    if (isProcessingAnswer || text.trim() === '') return;
    
    isProcessingAnswer = true;
    
    // Stop listening temporarily
    speechRecognition.stop();
    
    // Add user message to chat
    addUserMessage(text);
    
    // Process response
    setTimeout(() => {
        processUserResponse(text);
        isProcessingAnswer = false;
        
        // Resume listening
        if (remainingTime > 0) {
            speechRecognition.start();
        }
    }, 1000);
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
        
        // Update progress bar
        const progress = (1 - remainingTime / interviewDuration) * 100;
        progressBar.style.width = `${progress}%`;
        
        // Show coding quiz button at 4 minutes
        if (remainingTime === interviewDuration / 2) {
            codingQuizBtn.classList.remove('hidden');
        }
        
        // End interview when time is up
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
        
        // Create actual message with typing effect
        const messageElement = document.createElement('div');
        messageElement.className = 'message bot-message';
        chatMessages.appendChild(messageElement);

        let i = 0;
        isTyping = true;

        const typingEffect = setInterval(() => {
            if (i < text.length) {
                messageElement.textContent += text.charAt(i);
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
    const messageElement = document.createElement('div');
    messageElement.className = 'message user-message';
    messageElement.textContent = text;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Analyze message for scoring
    analyzeUserResponse(text);
}

function speakText(text) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(utterance);
    }
}

// Skills extraction
function extractSkillsFromResume(text) {
    const commonSkills = [
        'JavaScript', 'Python', 'Java', 'C++', 'C#', 'PHP', 'Ruby', 'Swift', 'TypeScript',
        'React', 'Angular', 'Vue', 'Node.js', 'Express', 'Django', 'Flask', 'Spring',
        'SQL', 'MongoDB', 'Firebase', 'AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes',
        'HTML', 'CSS', 'SASS', 'Bootstrap', 'Tailwind', 'jQuery', 'Redux', 'GraphQL',
        'Git', 'CI/CD', 'Agile', 'Scrum', 'DevOps', 'Machine Learning', 'Data Science',
        'Full Stack', 'Frontend', 'Backend', 'Mobile Development', 'iOS', 'Android',
        'Testing', 'QA', 'UI/UX', 'Design', 'Project Management', 'Product Management',
        'Marketing', 'SEO', 'Analytics', 'Content Strategy', 'Leadership', 'Communication'
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

// Technical questions based on skills
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
        "What improvements would you suggest for this technology or approach?"
    ];
    
    // Select a random follow-up message
    const randomFollowUp = followUpMessages[Math.floor(Math.random() * followUpMessages.length)];
    // Add questions based on extracted skills
    extractedSkills.forEach(skill => {
        if (questionBank[skill]) {
            // Randomly select one question for each skill
            const randomIndex = Math.floor(Math.random() * questionBank[skill].length);
            questions.push({
                skill: skill,
                question: questionBank[skill][randomIndex],
                followup: randomFollowUp
            });
        }
    });
    
    // If not enough skill-based questions, add default questions
    while (questions.length < 5) {
        const randomIndex = Math.floor(Math.random() * questionBank['Default'].length);
        const defaultQuestion = questionBank['Default'][randomIndex];
        
        // Check if this question is already included
        if (!questions.some(q => q.question === defaultQuestion)) {
            questions.push({
                skill: 'General',
                question: defaultQuestion,
                followup: "Can you provide more details or examples about that?"
            });
        }
    }
    
    return questions;
}

// Coding challenges
const codingChallenges = [
    {
        title: "Two Sum Problem",
        description: "Write a function that takes an array of numbers and a target number. The function should find and return the indices of the two numbers that add up to the target. You can assume there is exactly one solution.",
        template: "function twoSum(nums, target) {\n    // Your code here\n}\n\n// Example usage:\n// twoSum([2, 7, 11, 15], 9) should return [0, 1]",
        solution: "function twoSum(nums, target) {\n    const map = {};\n    \n    for (let i = 0; i < nums.length; i++) {\n        const complement = target - nums[i];\n        \n        if (map[complement] !== undefined) {\n            return [map[complement], i];\n        }\n        \n        map[nums[i]] = i;\n    }\n    \n    return [];\n}"
    },
    {
        title: "Palindrome Check",
        description: "Write a function that checks if a given string is a palindrome (reads the same backward as forward). Ignore all non-alphanumeric characters and consider case-insensitive comparison.",
        template: "function isPalindrome(str) {\n    // Your code here\n}\n\n// Example usage:\n// isPalindrome('A man, a plan, a canal: Panama') should return true",
        solution: "function isPalindrome(str) {\n    const cleaned = str.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();\n    \n    for (let i = 0; i < cleaned.length / 2; i++) {\n        if (cleaned[i] !== cleaned[cleaned.length - 1 - i]) {\n            return false;\n        }\n    }\n    \n    return true;\n}"
    },
    {
        title: "FizzBuzz Challenge",
        description: "Write a function that prints numbers from 1 to n. For multiples of 3, print 'Fizz' instead of the number. For multiples of 5, print 'Buzz'. For numbers that are multiples of both 3 and 5, print 'FizzBuzz'.",
        template: "function fizzBuzz(n) {\n    // Your code here\n}\n\n// Example usage:\n// fizzBuzz(15)",
        solution: "function fizzBuzz(n) {\n    const result = [];\n    \n    for (let i = 1; i <= n; i++) {\n        if (i % 3 === 0 && i % 5 === 0) {\n            result.push('FizzBuzz');\n        } else if (i % 3 === 0) {\n            result.push('Fizz');\n        } else if (i % 5 === 0) {\n            result.push('Buzz');\n        } else {\n            result.push(i);\n        }\n    }\n    \n    return result;\n}"
    }
];

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
    let score = 80; // Start with a baseline score
    
    // Length of response
    const wordCount = text.split(/\s+/).length;
    if (wordCount < 10) {
        score -= 30; // Too short
    } else if (wordCount > 10 && wordCount < 30) {
        score += 5; // Good length
    } else if (wordCount > 100) {
        score -= 10; // Too verbose
    }
    
    // Clarity indicators
    const clarityPhrases = [
        "for example", "such as", "to illustrate", "specifically",
        "in other words", "to clarify", "this means", "in summary"
    ];
    
    for (const phrase of clarityPhrases) {
        if (text.toLowerCase().includes(phrase)) {
            score += 5;
        }
    }
    
    // Use of filler words
    const fillerWords = [
        "um", "uh", "like", "you know", "sort of", "kind of", "basically",
        "actually", "literally", "stuff", "things"
    ];
    
    let fillerCount = 0;
    for (const word of fillerWords) {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        const matches = text.match(regex);
        if (matches) {
            fillerCount += matches.length;
        }
    }
    
    if (fillerCount > 3) {
        score -= 5 * Math.min(fillerCount, 5);
    }
    
    return Math.max(Math.min(score, 100), 0); // Ensure score is between 0 and 100
}

// Mock technical answer evaluation
function analyzeTechnical(text, questionIndex) {
    if (!questions[questionIndex]) return 50;
    
    const skill = questions[questionIndex].skill;
    let score = 70; // Start with a baseline score
    
    // Keywords to look for based on the skill
    const keywordsBySkill = {
        'JavaScript': ['variable', 'function', 'scope', 'hoisting', 'closure', 'promise', 'async', 'event', 'dom', 'callback'],
        'Python': ['function', 'class', 'method', 'list', 'tuple', 'dictionary', 'generator', 'exception', 'try', 'except'],
        'React': ['component', 'props', 'state', 'hook', 'effect', 'context', 'virtual dom', 'jsx', 'render', 'lifecycle'],
        'Full Stack': ['frontend', 'backend', 'database', 'api', 'server', 'client', 'middleware', 'authentication', 'rest', 'mvc'],
        'General': ['problem', 'solution', 'approach', 'experience', 'project', 'learn', 'develop', 'implement', 'design', 'build']
    };
    
    // Use general keywords as fallback
    const keywords = keywordsBySkill[skill] || keywordsBySkill['General'];
    
    // Count matching keywords
    let keywordCount = 0;
    for (const keyword of keywords) {
        if (text.toLowerCase().includes(keyword)) {
            keywordCount += 1;
        }
    }
    
    // Adjust score based on keyword matches
    if (keywordCount >= 5) {
        score += 30;
    } else if (keywordCount >= 3) {
        score += 20;
    } else if (keywordCount >= 1) {
        score += 10;
    } else {
        score -= 20; // No relevant keywords
    }
    
    // Length of response
    const wordCount = text.split(/\s+/).length;
    if (wordCount < 15) {
        score -= 20; // Too short for a technical answer
    } else if (wordCount > 50) {
        score += 10; // Detailed response
    }
    
    return Math.max(Math.min(score, 100), 0); // Ensure score is between 0 and 100
}

// Process user response and determine next steps
function processUserResponse(text) {
    const currentQuestion = questions[currentQuestionIndex];
    const technicalScore = analyzeTechnical(text, currentQuestionIndex);
    
    // Generate a compliment
    const compliments = [
        "That's an interesting perspective!",
        "Thank you for sharing your thoughts.",
        "I appreciate your detailed answer.",
        "Great insights!",
        "That's helpful to know.",
        "I like your approach to this.",
        "Thanks for explaining that so clearly.",
        "That's a good point you've made."
    ];
    
    const randomCompliment = compliments[Math.floor(Math.random() * compliments.length)];

    const transitionPhrases = [
        "Let's keep the momentum going. Here's your next question:",
        "Alright, moving forward! Here's your next challenge:",
        "You're doing well! Here's another question for you:",
        "Let's continue! Check out this question:",
        "Nice effort! Now, try this one:",
        "Here's something interesting for you to answer:"
    ];
    
    const randomPhrases = transitionPhrases[Math.floor(Math.random() * transitionPhrases.length)];
    // Check if we need to ask a follow-up
    if (technicalScore < 50 && !followupAsked) {
        followupAsked = true;
        setTimeout(() => {
            addBotMessage(randomCompliment + " " + currentQuestion.followup);
        }, 1000);
    } else {
        followupAsked = false;
        currentQuestionIndex++;
        
        // If there are more questions and time remaining, ask the next question
        if (currentQuestionIndex < questions.length && remainingTime > 0) {
            setTimeout(() => {
                addBotMessage(randomCompliment +" "+ randomPhrases +" "+ questions[currentQuestionIndex].question);
            }, 1000);
        } else if (remainingTime > 0) {
            // If all questions are done but time remains
            setTimeout(() => {
                addBotMessage(randomCompliment + " We've completed all the technical questions. Let's talk more about your background. Tell me about a challenging project you worked on recently.");
            }, 1000);
        }
    }
}

// Start coding quiz
function startCodingQuiz() {
    clearInterval(timerInterval); // Pause main interview timer
    interviewContainer.classList.add('hidden');
    codingContainer.classList.remove('hidden');
    
    // Select a random coding challenge
    const challenge = codingChallenges[Math.floor(Math.random() * codingChallenges.length)];
    problemTitle.textContent = `Problem: ${challenge.title}`;
    problemDescription.textContent = challenge.description;
    codeArea.value = challenge.template;
    
    // Start coding timer
    startCodingTimer();
}

// Submit coding solution
function submitCodingSolution() {
    clearInterval(codingTimerInterval);
    
    // Simple scoring - between 50-90 points
    // In a real app, you'd evaluate the code quality, correctness, etc.
    const randomScore = Math.floor(Math.random() * 41) + 50;
    interviewScore.coding = randomScore;
    
    // Return to interview or end if time is up
    codingContainer.classList.add('hidden');
    
    if (remainingTime > 0) {
        interviewContainer.classList.remove('hidden');
        addBotMessage("I've recorded your coding solution. Let's continue with the interview.");
        startTimer(); // Resume main timer
    } else {
        endInterview();
    }
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
            <h3>Overall Score: ${overall}%</h3>
            <div class="score-bar"><div class="score-fill" style="width: ${overall}%"></div></div>
            <p>Thank you for completing your interview, ${username}!</p>
        </div>
        
        <div class="report-section">
            <h3>Technical Knowledge: ${technical}%</h3>
            <div class="score-bar"><div class="score-fill" style="width: ${technical}%"></div></div>
            <p>${getTechnicalFeedback(technical)}</p>
        </div>
        
        <div class="report-section">
            <h3>Communication Skills: ${communication}%</h3>
            <div class="score-bar"><div class="score-fill" style="width: ${communication}%"></div></div>
            <p>${getCommunicationFeedback(communication)}</p>
        </div>
        
        <div class="report-section">
            <h3>Grammar & Language: ${grammar}%</h3>
            <div class="score-bar"><div class="score-fill" style="width: ${grammar}%"></div></div>
            <p>${getGrammarFeedback(grammar)}</p>
        </div>
        
        <div class="report-section">
            <h3>Coding Challenge: ${coding}%</h3>
            <div class="score-bar"><div class="score-fill" style="width: ${coding}%"></div></div>
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
    
    // Start interview
    function startInterview() {
        welcomeContainer.classList.add('hidden');
        interviewContainer.classList.remove('hidden');
        
        // Extract skills from resume
        extractedSkills = extractSkillsFromResume(resumeContent);
        
        // Generate questions based on skills
        questions = generateTechnicalQuestions();
        
        // Initialize camera and speech recognition
        initCamera();
        initSpeechRecognition();
        
        // Start timer
        startTimer();
        
        // Welcome message
        setTimeout(() => {
            addBotMessage(`Hello ${username}! Welcome to your technical interview simulation. I'll ask you questions related to your background in ${background}.`);
            
            setTimeout(() => {
                addBotMessage(`I notice you have experience with ${extractedSkills.join(', ')}. Let's start with the first question: ${questions[0].question}`);
            }, 3000);
        }, 1000);
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
    
    // Submit code button
    submitCodeBtn.addEventListener('click', submitCodingSolution);
    
    // Return to interview button
    returnInterviewBtn.addEventListener('click', () => {
        codingContainer.classList.add('hidden');
        interviewContainer.classList.remove('hidden');
        clearInterval(codingTimerInterval);
        startTimer(); // Resume main timer
    });
    
    // Restart button
    restartBtn.addEventListener('click', () => {
        location.reload();
    });
});