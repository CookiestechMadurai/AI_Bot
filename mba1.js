// DOM Elements
import questionBank from './questionsmba.js';
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
let interviewDuration = 1 * 60; // 8 minutes in seconds
let remainingTime = interviewDuration;
let timerInterval;
let codingTimerInterval;
let codingRemainingTime = 30; // 4 minutes in seconds
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
    
    // Stop listening temporarily
    if (speechRecognition) {
        speechRecognition.stop();
    }
    
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

    // Create message container
    const messageElement = document.createElement('div');
    messageElement.className = 'message user-message';

    // ✅ User's Name (Header)
    const userNameElement = document.createElement('div');
    userNameElement.className = 'message-name';
    userNameElement.textContent = username; // Uses the global username variable

    // ✅ Message Text
    const messageTextElement = document.createElement('div');
    messageTextElement.className = 'message-text';
    messageTextElement.textContent = text;

    // Append elements
    messageElement.appendChild(userNameElement); // Add User name
    messageElement.appendChild(messageTextElement); // Add text container

    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Analyze message for scoring
    analyzeUserResponse(text);
}


function speakText(text, callback = null) {
    if ('speechSynthesis' in window) {
        speechRecognition.stop(); // ✅ Stop recognition while bot speaks
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1;
        utterance.pitch = 1;
        utterance.volume = 1;

        utterance.onend = () => {
            setTimeout(() => {
                if (callback) callback();
                startListening(); // ✅ Only show next message after bot finishes speaking
            }, 1000); // ✅ Small delay before next message
        };

        window.speechSynthesis.speak(utterance);
    }
}



// Skills extraction
function extractSkillsFromResume(text) {
    const commonSkills = [
        'Strategic Management', 'Financial Analysis', 'Marketing Strategy', 'Business Analytics',
        'Project Management', 'Operations Management', 'Supply Chain Management', 'Human Resource Management',
        'Leadership', 'Negotiation', 'Communication Skills', 'Presentation Skills', 'Critical Thinking',
        'Problem-Solving', 'Decision Making', 'Data Analysis', 'Market Research', 'Consumer Behavior',
        'Brand Management', 'Digital Marketing', 'SEO', 'Social Media Marketing', 'Advertising',
        'Sales Management', 'Business Development', 'Entrepreneurship', 'Corporate Finance',
        'Risk Management', 'Investment Analysis', 'Accounting', 'Economics', 'Business Law',
        'Ethics and Corporate Governance', 'International Business', 'Cross-Cultural Management',
        'Operations Research', 'Financial Modeling', 'Change Management', 'Innovation Management',
        'Design Thinking', 'Customer Relationship Management (CRM)', 'Enterprise Resource Planning (ERP)',
        'Agile Methodology', 'Competitive Analysis', 'Performance Management', 'Data-Driven Decision Making'
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
        if (background === 'MBA') {
            foundSkills.push('Project Management', 'Leadership', 'Marketing', 'Finance', 'Business Strategy');
        } else {
            foundSkills.push('Communication', 'Problem Solving', 'Teamwork', 'Critical Thinking');
        }
    }
    
    return foundSkills;
}

// Technical questions based on skills
// Technical questions based on skills
function generateMBAQuestions() {
    const questions = [];
    
    const followUpMessages = [
        "How would you apply this concept in a real business scenario?",
        "Can you share an example where this strategy worked well?",
        "What challenges do companies face when implementing this?",
        "How do you measure success in this area?",
        "What recent trends have influenced this field?",
        "How does this compare with alternative business approaches?",
        "What are the ethical considerations in this context?",
        "Can you explain this concept in simple terms for a non-business audience?",
        "How do industry leaders handle this aspect effectively?",
        "What future developments do you foresee in this area?"
    ];
    
    const allTopics = Object.keys(questionBank);
    
    while (questions.length < 7) {
        const randomTopic = allTopics[Math.floor(Math.random() * allTopics.length)];
        const topicQuestions = questionBank[randomTopic];
        const randomQuestion = topicQuestions[Math.floor(Math.random() * topicQuestions.length)];
        const randomFollowUp = followUpMessages[Math.floor(Math.random() * followUpMessages.length)];
        
        if (!questions.some(q => q.question === randomQuestion)) {
            questions.push({
                topic: randomTopic,
                question: randomQuestion,
                followup: randomFollowUp
            });
        }
    }
    
    return questions;
}

// Business challenges
const businessChallenges = [
    {
        title: "Market Expansion Strategy",
        description: "Your company is a successful e-commerce platform in your home country and is planning to expand into international markets. Develop a market entry strategy considering factors such as competition, pricing, and localization.",
        template: "Approach:\n1. Conduct market research.\n2. Analyze competition and customer behavior.\n3. Choose an entry mode (partnership, acquisition, direct investment, etc.).\n4. Develop a pricing and localization strategy.\n\nSolution Example:\n- Conduct a PESTEL analysis.\n- Use Porter's Five Forces to assess competition.\n- Implement a penetration pricing strategy for the new market.",
        solution: "A strong market expansion strategy involves in-depth research, competitive analysis, and selecting the right entry mode. For example, Amazon entered India by acquiring local expertise and leveraging discounts to capture market share."
    },
    {
        title: "Financial Decision-Making",
        description: "Your company has a surplus of $10 million. You need to decide whether to reinvest it in R&D, expand operations, or distribute dividends to shareholders. Justify your decision using financial analysis techniques.",
        template: "Approach:\n1. Analyze ROI and risks.\n2. Consider industry growth trends.\n3. Evaluate shareholder expectations.\n4. Provide a justified recommendation.\n\nSolution Example:\n- Use NPV (Net Present Value) and IRR (Internal Rate of Return) for investment decisions.\n- Assess shareholder reaction to dividend distribution.\n- Compare expansion costs with expected revenue growth.",
        solution: "If the company's growth rate is high and R&D has a positive NPV, reinvestment is preferable. However, if shareholders expect returns and growth is slow, dividends might be a better choice."
    },
    {
        title: "Employee Retention Challenge",
        description: "Your company's employee turnover rate has increased by 15% in the last year. Identify key reasons and propose an HR strategy to improve employee retention.",
        template: "Approach:\n1. Conduct employee surveys.\n2. Identify common reasons for attrition (salary, work culture, career growth).\n3. Develop a retention plan.\n4. Implement employee engagement initiatives.\n\nSolution Example:\n- Offer competitive salaries and benefits.\n- Improve work-life balance policies.\n- Provide career growth opportunities through training programs.",
        solution: "A combination of employee feedback, competitive compensation, and a strong work culture will help reduce attrition. Companies like Google focus on workplace satisfaction to retain top talent."
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
    
    const category = questions[questionIndex].category;
    let score = 70; // Baseline score

    // Keywords to look for based on the category
    const keywordsByCategory = {
        'Marketing': ['branding', 'segmentation', 'customer', 'campaign', 'digital marketing', 'strategy', 'positioning', 'advertising', 'growth', 'market'],
        'Finance': ['ROI', 'budget', 'investment', 'risk', 'profit', 'loss', 'valuation', 'capital', 'interest', 'cash flow'],
        'HR': ['recruitment', 'culture', 'leadership', 'motivation', 'teamwork', 'performance', 'training', 'employee', 'engagement', 'retention'],
        'Operations': ['efficiency', 'supply chain', 'logistics', 'process', 'quality', 'optimization', 'inventory', 'productivity', 'workflow', 'cost'],
        'General': ['problem-solving', 'decision-making', 'strategy', 'analysis', 'business model', 'case study', 'leadership', 'growth', 'innovation', 'challenges']
    };

    // Use general keywords as fallback
    const keywords = keywordsByCategory[category] || keywordsByCategory['General'];

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
        score -= 20; // Too short for a business analysis answer
    } else if (wordCount > 50) {
        score += 10; // Detailed response

    // Check for reasoning words (supports logical decision-making)
    const reasoningWords = ['because', 'therefore', 'due to', 'hence', 'thus', 'as a result', 'since'];
    if (reasoningWords.some(word => text.toLowerCase().includes(word))) {
        score += 10; // Indicates logical explanation
    }

    return Math.max(Math.min(score, 100), 0); // Ensure score is between 0 and 100
}
}

// Process user response and determine next steps
function processUserResponse(text) {
    const currentQuestion = questions[currentQuestionIndex];
    const technicalScore = analyzeTechnical(text, currentQuestionIndex);

    // List of phrases indicating uncertainty
    const uncertainResponses = [
        "i don't know", "i am not sure", "i have no idea",
        "i'm unsure", "not sure", "no clue", "i can't answer that"
    ];

    // Business-related compliments
    const compliments = [
        "That's a well-structured response!",
        "I appreciate your business insights.",
        "You’ve provided a thoughtful analysis!",
        "That’s a strong perspective on the topic.",
        "Your reasoning is well-articulated!",
        "Interesting approach! I like how you framed it.",
        "That’s a good strategic viewpoint!",
        "Great business thinking!"
    ];
    const randomCompliment = compliments[Math.floor(Math.random() * compliments.length)];

    // Transition phrases for the interview flow
    const transitionPhrases = [
        "Let's explore another key concept. Here's your next question:",
        "Great! Now, let's analyze this next scenario:",
        "You're doing well! Let’s tackle another business case:",
        "Now, consider this situation:",
        "Nice effort! Let's test your business acumen further:",
        "Here's another interesting business challenge for you:"
    ];

    const randomPhrases = transitionPhrases[Math.floor(Math.random() * transitionPhrases.length)];
    // Encouragement messages for uncertainty
    const encouragementMessages = [
        "No worries! Business challenges can be tricky. Let’s try this one:",
        "That's okay! Strategic thinking takes practice. Here's another scenario:",
        "Don't worry! Every business leader has moments of uncertainty. Try this one:",
        "It's all part of the learning process! Let's move to the next case study:",
        "No problem! Let's shift gears to another business question:",
        "You're doing great! Let's explore another strategic topic:",
        "That's fine! Let’s look at a different business decision-making scenario:",
        "Good effort! Now, let's analyze a new business challenge:"
    ];
    
    // ✅ Handle "I don't know" BEFORE checking score
    if (uncertainResponses.some(response => text.toLowerCase().includes(response))) {
        const randomEncouragement = encouragementMessages[Math.floor(Math.random() * encouragementMessages.length)];
        addBotMessage(randomEncouragement);
        
        // ✅ Move to the next question without triggering follow-up
        setTimeout(() => {
            currentQuestionIndex++;
            if (currentQuestionIndex < questions.length && remainingTime > 0) {
                addBotMessage(questions[currentQuestionIndex].question);
            } else if (remainingTime > 0) {
                addBotMessage(randomCompliment + " We've completed all the technical questions. Let's talk more about your background. Tell me about a challenging project you worked on recently.");
            }
        }, 2000);

        return; // ✅ Prevent further execution & avoid follow-up questions
    }

    // ✅ If the user gave an actual answer, proceed with scoring
    if (technicalScore < 50 && !followupAsked) {
        followupAsked = true;
        setTimeout(() => {
            addBotMessage(randomCompliment + " " + currentQuestion.followup);
        }, 1000);
    } else {
        followupAsked = false;
        currentQuestionIndex++;

        // ✅ If more questions remain, continue the interview
        if (currentQuestionIndex < questions.length && remainingTime > 0) {
            setTimeout(() => {
                addBotMessage(randomCompliment + " " + randomPhrases + " " + questions[currentQuestionIndex].question);
            }, 1000);
        } else if (remainingTime > 0) {
            // ✅ If no more technical questions, switch to personal background discussion
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
    const challenge = businessChallenges[Math.floor(Math.random() * codingChallenges.length)];
    problemTitle.textContent = `Scenario: ${challenge.title}`;
    problemDescription.textContent = challenge.description;
    codeArea.value = challenge.template;
    
    // Start coding timer
    startCodingTimer();
    speechRecognition.start();
}

// List of general questions
const generalQuestions = [
    "Tell me about a time you solved a difficult problem.",
    "What motivates you to work in this field?",
    "How do you handle constructive criticism?",
    "Describe a situation where you worked as part of a team.",
    "If you could learn any new skill, what would it be?",
    "What is your biggest strength and how do you use it?",
    "Can you give an example of a time you showed leadership?",
    "How do you manage stress in a work environment?"
];

// List of compliments
const compliments = [
    "That’s a great perspective!",
    "I really like the way you think!",
    "That’s an insightful answer!",
    "You have a strong way of explaining things!",
    "Impressive response!",
    "You're doing great! Keep it up!",
    "That was a well-thought-out answer!",
    "I can see your confidence in this!"
];

let askedQuestions = new Set(); // Track asked questions

function askRandomGeneralQuestion() {
    if (remainingTime <= 0) {
        endInterview();
        return;
    }

    // Pick a random question that hasn't been asked
    let randomIndex;
    do {
        randomIndex = Math.floor(Math.random() * generalQuestions.length);
    } while (askedQuestions.has(randomIndex));

    askedQuestions.add(randomIndex);

    // Ask the question
    addBotMessage(generalQuestions[randomIndex]);
    handleUserResponse(userResponse);
    
}

// Function to handle user response
function handleUserResponse(userResponse) {
    if (remainingTime <= 0) {
        endInterview();
        return;
    }

    // Give a random compliment
    const randomCompliment = compliments[Math.floor(Math.random() * compliments.length)];
    addBotMessage(randomCompliment);

    // Ask the next question after a short delay
    setTimeout(() => {
        askRandomGeneralQuestion();
    }, 2000);
}

function submitCodingSolution() {
    clearInterval(codingTimerInterval);

    // ✅ Fetch user input from the coding area
    let userResponse = codeArea.value.trim(); 

    // ✅ Ensure input is not empty
    if (userResponse === "") {
        addBotMessage("It looks like you didn't provide a response. Please try again!");
        return;
    }

    // Tokenize response
    const words = userResponse.toLowerCase().split(/\s+/);

    // Define keywords for analysis
    const strongDecisionKeywords = ["analyzed", "evaluated", "prioritized", "strategy", "impact", "logical", "data-driven"];
    const weakDecisionKeywords = ["guess", "random", "uncertain", "unsure", "rushed", "impulsive"];

    let strongMatches = words.filter(word => strongDecisionKeywords.includes(word)).length;
    let weakMatches = words.filter(word => weakDecisionKeywords.includes(word)).length;

    let score, feedbackMessage;

    if (strongMatches > weakMatches) {
        score = Math.min(100, 60 + strongMatches * 5);
        feedbackMessage = "Your response demonstrates strong decision-making skills!";
    } else if (weakMatches > strongMatches) {
        score = Math.max(30, 50 - weakMatches * 5);
        feedbackMessage = "Your response suggests room for improvement in structured decision-making.";
    } else {
        score = 50;
        feedbackMessage = "Your decision-making approach is balanced, but could be improved.";
    }

    // ✅ Store the score
    interviewScore.coding = score;

    // ✅ Hide coding section and return to interview
    codingContainer.classList.add('hidden');
    interviewContainer.classList.remove('hidden');

    // ✅ Provide feedback and resume interview
    addBotMessage(feedbackMessage);
    addBotMessage("Let's move forward with the next part of the interview.");

    // ✅ Resume timer and continue with general questions
    startTimer();
    setTimeout(() => {
        askRandomGeneralQuestion();
    }, 2000);
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
    console.log("DEBUG: interviewScore object:", interviewScore);

    const technical = Math.round(interviewScore.technical || 0);
    const communication = Math.round(interviewScore.communication || 0);
    const grammar = Math.round(interviewScore.grammar || 0);
    const coding = Math.round(interviewScore.coding || 0);

    console.log("DEBUG: Scores before calculation ->");
    console.log("Technical:", technical);
    console.log("Communication:", communication);
    console.log("Grammar:", grammar);
    console.log("Coding:", coding);

    const overall = Math.round((technical + communication + grammar + coding) / 4) || 0;

    console.log("DEBUG: Final Overall Score:", overall);

    let reportHTML = `
        <div class="report-section">
            <h3>Overall Score: <span id="overall-score">${overall}%</span></h3>
            <div class="score-bar"><div class="score-fill" style="width: ${overall}%"></div></div>
        </div>
        <div class="report-section">
            <h3>Business Knowledge: <span id="technical-score">${technical}%</span></h3>
            <div class="score-bar"><div class="score-fill" style="width: ${technical}%"></div></div>
            <p>${getMBAFeedback(technical)}</p>
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
            <h3>Decision Challenge: <span id="coding-score">0%</span></h3>
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
            <p><strong>Score:</strong> Business: ${Math.round(item.scores.technical)}%, Communication: ${Math.round(item.scores.communication)}%</p>
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
function getMBAFeedback(score) {
    if (score >= 90) {
        return "Excellent business and management acumen! You demonstrated deep strategic thinking and strong analytical skills.";
    } else if (score >= 75) {
        return "Good MBA knowledge. You showed a solid understanding of business principles and decision-making strategies.";
    } else if (score >= 60) {
        return "Acceptable MBA understanding. Consider refining your approach to problem-solving and strategy formulation.";
    } else {
        return "Your MBA responses need improvement. We recommend further study and practice with business case analysis and decision frameworks.";
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
        return "Outstanding decision-making skills! You demonstrated strong analytical abilities and made sound, strategic choices.";
    } else if (score >= 75) {
        return "Good decision-making ability. You showed logical reasoning and thoughtful evaluation of options.";
    } else if (score >= 60) {
        return "Acceptable decision-making. Work on refining your approach by considering long-term impacts and alternative solutions.";
    } else {
        return "Your decision-making skills need improvement. Focus on structured thinking, risk assessment, and strategic evaluation.";
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

    // ✅ Prevents mic from turning on while bot is speaking
    if (window.speechSynthesis.speaking) {
        setTimeout(startListening, 500); // Check again after 0.5 seconds
        return;
    }

    speechRecognition.start();
    isListening = true;
    micBtn.innerHTML = '<i class="mic-icon">🎤 (Listening)</i>';
    micBtn.classList.add("active");

    let finalTranscript = "";
    let silenceTimeout; // Track user's silence

    speechRecognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
    
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
    
            if (event.results[i].isFinal) {
                finalTranscript += transcript + ' ';
            } else {
                interimTranscript += transcript;
            }
        }
    
        // ✅ If in the coding phase (decision-making scenario), update `codeArea`
        if (!codingContainer.classList.contains('hidden')) {
            codeArea.value = finalTranscript.trim();
        } else {
            userInput.value = finalTranscript.trim();
        }
    
        // ✅ Display real-time interim text for better user experience
        if (interimTranscript !== '') {
            if (!document.body.contains(tempTextElement)) {
                chatMessages.appendChild(tempTextElement);
            }
            tempTextElement.textContent = finalTranscript + interimTranscript;
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    
        // ✅ Detect when user is silent for 3 seconds
        clearTimeout(silenceTimeout);
        silenceTimeout = setTimeout(() => {
            if (finalTranscript.trim() !== "") {
                if (!codingContainer.classList.contains('hidden')) {
                    // ✅ If in decision-making phase, do not auto-submit, allow manual submission
                    codeArea.value = finalTranscript.trim();
                } else {
                    // ✅ In normal interview, auto-submit answer after silence
                    submitUserAnswer(finalTranscript.trim());
                    finalTranscript = "";
                    userInput.value = "";
                }
    
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
        console.error("Speech recognition error:", event.error);
        micBtn.innerHTML = '<i class="mic-icon">🎤</i>';
        micBtn.classList.remove("active");

        // ✅ Restart speech recognition if the interview is ongoing
        if (remainingTime > 0 && !isProcessingAnswer) {
            setTimeout(() => speechRecognition.start(), 1000);
        }
    };
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

    // Event listeners
    codingQuizBtn.addEventListener('click', startCodingQuiz);
    submitCodeBtn.addEventListener('click', submitCodingSolution);
    returnInterviewBtn.addEventListener('click', () => {
        codingContainer.classList.add('hidden');
        interviewContainer.classList.remove('hidden');
        startTimer();
    });

    initSpeechRecognition();
});
    
    // Start interview
    function startInterview() {
        welcomeContainer.classList.add('hidden');
        interviewContainer.classList.remove('hidden');
    
        // Extract skills from resume
        extractedSkills = extractSkillsFromResume(resumeContent);
    
        // Generate questions based on skills
        questions = generateMBAQuestions();
    
        if (!questions || questions.length === 0) {
            console.error("No questions generated.");
            addBotMessage("Oops! No questions were generated. Please check your resume and try again.", 0, true);
            return;
        }
    
        // ✅ Initialize camera, voice visualization, and speech recognition (but don't start listening yet)
        initCamera();
        initSpeechRecognition();
        initVoiceVisualization();
    
        const welcomeMessages = [
            `Hello ${username}! Welcome to your MBA interview simulation. Let's get started!`,
            `Hi ${username}, great to have you here! Let's begin your business interview practice.`,
            `Welcome ${username}! Get ready for an engaging interview experience on business topics.`,
            `Hey ${username}! Ready to sharpen your business and management skills? Let's go!`,
            `Hello ${username}! This interview simulation is designed to challenge and improve you. Let's start!`,
            `Hi there, ${username}! Let's dive into your MBA interview preparation!`,
            `Welcome, ${username}! Excited to test your knowledge in business strategy today? Let's begin!`,
            `Hey ${username}! You're in the right place for some insightful business questions. Let's start!`,
            `Hello ${username}! Let's make this a valuable MBA interview practice session. Ready?`,
            `Hi ${username}! Get ready for an interactive business case discussion!`
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
                "I notice you have experience in ${skills}. That's impressive!",
                "Your knowledge in ${skills} really stands out in the business world!",
                "Having expertise in ${skills} is a great asset for management roles!",
                "I see you’re skilled in ${skills}. That’s fantastic for leadership positions!",
                "Your proficiency in ${skills} is truly remarkable!",
                "Wow! ${skills} is a strong skill set to have in the corporate world!",
                "It's great that you have experience in ${skills}!",
                "I like that you're well-versed in ${skills}.",
                "Your background in ${skills} is quite valuable for strategic decision-making.",
                "I'm impressed by your skills in ${skills}!"
            ];
            const randomIndex = Math.floor(Math.random() * skillMessages.length);
            const selectedMessage = skillMessages[randomIndex];
            const formattedMessage = selectedMessage.replace("${skills}", extractedSkills.join(', '));
    
            addBotMessage(formattedMessage, 0, false);
        }, 4000); // ✅ Wait for welcome message to finish
    
        // ✅ Step 3: Speak a transition message before the first question
        setTimeout(() => {
            const transitionSentences = [
                "These are the business skills we noticed you have. Now, let's move to the first question.",
                "We've analyzed your management skills. Let's begin with a strategic question.",
                "Now that we know your expertise, let's dive into your first business case question.",
                "Your skills are impressive! Let's see how you apply them to real-world business problems.",
                "Great! Based on your skills, here's your first managerial challenge.",
                "Now that we've reviewed your expertise, it's time for a business decision-making scenario.",
                "I see you're skilled in many areas. Let's begin with a leadership-focused question.",
                "Now that we've covered your skills, let's test your problem-solving ability with the first question.",
                "Let's put your business acumen to the test with this first case study question.",
                "You're off to a great start! Now, let's discuss a key business challenge."
            ];
        
            // ✅ Select a random transition sentence
            const randomSentence = transitionSentences[Math.floor(Math.random() * transitionSentences.length)];
        
            // ✅ Speak the selected transition sentence
            speakText(randomSentence);
        
        }, 7000); // ✅ Wait for skills message to finish
    
        // ✅ Step 4: Speak and display the first question
        setTimeout(() => {
            const firstQuestion = questions[0].question;
    
            addBotMessage(firstQuestion, 0, true);
    
            // ✅ Step 5: Enable mic 1 second after the question is spoken
            setTimeout(() => {
                startListening(); // ✅ Start listening instead of reinitializing speech recognition
            }, 1000);
    
        }, 10000); // ✅ Wait for transition message to finish
    
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
    
    // Submit code button
    submitCodeBtn.addEventListener('click', submitCodingSolution);
    
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