// DOM Elements

import questionBank from './questions.js';
const landingContainer = document.getElementById('landing-container');
const instructionsModal = document.getElementById('instructions-modal');
const welcomeContainer = document.getElementById('welcome-container');
const interviewContainer = document.getElementById('interview-container');
const reportContainer = document.getElementById('report-container');
const codingContainer = document.getElementById('coding-container');

const tryNowBtn = document.getElementById('try-now-btn');
const closeModalBtn = document.querySelector('.close-modal');
const continueToFormBtn = document.getElementById('continue-to-form-btn');
const userForm = document.getElementById('user-form');
const codingQuizBtn = document.getElementById('coding-quiz-btn');
const restartBtn = document.getElementById('restart-btn');
const returnInterviewBtn = document.getElementById('return-interview-btn');
const runCodeBtn = document.getElementById('run-code-btn');
const submitCodeBtn = document.getElementById('submit-code-btn');

const timerElement = document.getElementById('timer');
const progressBar = document.getElementById('progress');
const codingTimerElement = document.getElementById('coding-timer');
const chatMessages = document.getElementById('chat-messages');
const responseIndicator = document.getElementById('response-indicator');
const responseStatusText = document.getElementById('response-status-text');
const reportContent = document.getElementById('report-content');
const botAvatar = document.querySelector('.bot-avatar');

// Global Variables
let username = '';
let background = '';
let skills = [];
let resumeText = '';
let interviewTimer;
let codingTimer;
let totalTime = 8 * 60; // 8 minutes in seconds
let codingTime = 4 * 60; // 4 minutes in seconds
let timeRemaining = totalTime;
let codingTimeRemaining = codingTime;
let currentQuestion = 0;
let userAnswers = [];
let speechRecognition;
let isSpeaking = false;
let isListening = false;
let userScore = {
    technical: 0,
    communication: 0,
    grammar: 0,
    coding: 0
};

// Tech skills for recognition in resume
const techSkills = [
    'JavaScript', 'React', 'Angular', 'Vue', 'Node.js', 'Express', 'MongoDB', 
    'SQL', 'Python', 'Django', 'Flask', 'Java', 'Spring', 'C#', '.NET', 
    'PHP', 'Laravel', 'Ruby', 'Rails', 'AWS', 'Azure', 'Docker', 'Kubernetes',
    'HTML', 'CSS', 'SASS', 'LESS', 'Bootstrap', 'Tailwind', 'TypeScript',
    'Redux', 'GraphQL', 'REST API', 'JSON', 'XML', 'Git', 'CI/CD', 'Agile',
    'Scrum', 'DevOps', 'Machine Learning', 'Data Science', 'Blockchain'
];

// Sample questions for different skills and backgrounds
const questions = {
    general: [
        "Tell me about yourself and your background.",
        "What are your greatest strengths that make you suitable for this role?",
        "How do you handle stress and pressure in a work environment?",
        "Describe a challenging project you worked on and how you overcame obstacles.",
        "Where do you see yourself professionally in 5 years?",
        "Why are you interested in working with our company?",
        "How do you prioritize your work when dealing with multiple deadlines?",
        "Tell me about a time when you had to learn a new skill quickly.",
        "How do you approach working in a team environment?",
        "What accomplishment are you most proud of in your career so far?"
    ],
    CSE: [
        "What programming languages are you most comfortable with and why?",
        "Explain the difference between object-oriented and functional programming.",
        "How do you ensure your code is maintainable and scalable?",
        "Describe your experience with version control systems.",
        "How do you approach debugging a complex issue in your code?",
        "What's your experience with agile development methodologies?",
        "Explain how you would design a distributed system for high availability.",
        "How do you stay updated with the latest technologies and industry trends?",
        "Tell me about a time when you had to optimize code for better performance.",
        "How would you explain a complex technical concept to a non-technical person?"
    ],
    MBA: [
        "Describe your approach to project management and meeting deadlines.",
        "How do you analyze market trends to inform business decisions?",
        "Tell me about a time you had to make a difficult business decision with limited information.",
        "How do you measure the success of a project or initiative?",
        "What financial metrics do you consider most important when evaluating a business opportunity?",
        "Describe how you would develop and implement a marketing strategy for a new product.",
        "How do you motivate team members to achieve business objectives?",
        "What's your approach to risk management in business operations?",
        "How would you handle a situation where your team is resistant to necessary changes?",
        "Describe your experience with data-driven decision making."
    ],
    skills: {
        "JavaScript": [
            "Can you explain closure in JavaScript and why it's important?",
            "What's the difference between let, const, and var in JavaScript?",
            "How does prototypal inheritance work in JavaScript?",
            "Explain asynchronous programming in JavaScript and different ways to handle it.",
            "What are JavaScript promises and how do they work?"
        ],
        "React": [
            "Explain the Virtual DOM and its benefits in React.",
            "What are React hooks and how have they changed state management?",
            "Describe the component lifecycle in React.",
            "How do you handle state management in larger React applications?",
            "What are the key differences between class components and functional components?"
        ],
        "Node.js": [
            "How does the event loop work in Node.js?",
            "What are streams in Node.js and how would you use them?",
            "How would you handle authentication in a Node.js application?",
            "Explain the difference between blocking and non-blocking operations in Node.js.",
            "What strategies would you use to debug a Node.js application?"
        ],
        "Python": [
            "What are the differences between Python 2 and Python 3?",
            "Explain decorators in Python and give an example of their use.",
            "How does memory management work in Python?",
            "What are generators in Python and why would you use them?",
            "Discuss the GIL (Global Interpreter Lock) in Python and its implications."
        ],
        "Full Stack": [
            "Explain your approach to developing a full-stack application from scratch.",
            "How do you handle data flow between front-end and back-end components?",
            "What are some of the challenges in full-stack development and how do you address them?",
            "How would you optimize a full-stack application for performance?",
            "What modules or frameworks do you typically use in your full-stack projects?"
        ]
    },
    followup: {
        "Full Stack": [
            "Could you elaborate on your experience with RESTful APIs?",
            "What database technologies have you used in your full-stack applications?",
            "How do you handle authentication and security concerns across the stack?",
            "Explain how you implement responsive design in your front-end work."
        ]
    }
};

// Sample compliments to use after responses
const compliments = [
    "That's an excellent point.",
    "I appreciate your thoughtful response.",
    "Great explanation!",
    "You articulated that very well.",
    "That's a very insightful answer.",
    "Very clear and concise, thank you.",
    "You've clearly given this some thought.",
    "I like your approach to this topic.",
    "That's a unique perspective, thank you for sharing.",
    "You make some compelling points there."
];

// Coding problems
const codingProblems = [
    {
        title: "Two Sum Problem",
        description: "Write a function that finds two numbers in an array that add up to a specific target.",
        example: "Example:\nInput: nums = [2,7,11,15], target = 9\nOutput: [0,1]\nExplanation: Because nums[0] + nums[1] == 9, we return [0, 1].",
        template: "function twoSum(nums, target) {\n    // Write your solution here\n    \n}",
        testCases: [
            { input: { nums: [2,7,11,15], target: 9 }, expectedOutput: [0,1] },
            { input: { nums: [3,2,4], target: 6 }, expectedOutput: [1,2] }
        ],
        solution: "function twoSum(nums, target) {\n    const map = new Map();\n    \n    for (let i = 0; i < nums.length; i++) {\n        const complement = target - nums[i];\n        if (map.has(complement)) {\n            return [map.get(complement), i];\n        }\n        map.set(nums[i], i);\n    }\n    \n    return [];\n}"
    },
    {
        title: "Reverse String",
        description: "Write a function that reverses a string. The input string is given as an array of characters.",
        example: "Example:\nInput: ['h','e','l','l','o']\nOutput: ['o','l','l','e','h']",
        template: "function reverseString(s) {\n    // Write your solution here\n    \n}",
        testCases: [
            { input: { s: ['h','e','l','l','o'] }, expectedOutput: ['o','l','l','e','h'] },
            { input: { s: ['H','a','n','n','a','h'] }, expectedOutput: ['h','a','n','n','a','H'] }
        ],
        solution: "function reverseString(s) {\n    let left = 0;\n    let right = s.length - 1;\n    \n    while (left < right) {\n        const temp = s[left];\n        s[left] = s[right];\n        s[right] = temp;\n        left++;\n        right--;\n    }\n    \n    return s;\n}"
    }
];

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    tryNowBtn.addEventListener('click', showInstructions);
    closeModalBtn.addEventListener('click', hideInstructions);
    continueToFormBtn.addEventListener('click', showWelcomeForm);
    userForm.addEventListener('submit', handleFormSubmit);
    codingQuizBtn.addEventListener('click', startCodingQuiz);
    restartBtn.addEventListener('click', restartInterview);
    returnInterviewBtn.addEventListener('click', returnToInterview);
    runCodeBtn.addEventListener('click', runCode);
    submitCodeBtn.addEventListener('click', submitCode);

    // Setup speech recognition if available
    setupSpeechRecognition();
});

// Functions
function showInstructions() {
    instructionsModal.style.display = 'flex';
}

function hideInstructions() {
    instructionsModal.style.display = 'none';
}

function showWelcomeForm() {
    instructionsModal.style.display = 'none';
    landingContainer.classList.add('hidden');
    welcomeContainer.classList.remove('hidden');
}

function handleFormSubmit(e) {
    e.preventDefault();
    username = document.getElementById('username').value;
    background = document.getElementById('background').value;
    
    // Get skills
    const skillsInput = document.getElementById('skills').value;
    if (skillsInput.trim()) {
        skills = skillsInput.split(',').map(skill => skill.trim());
    }
    
    // Simulate reading resume
    const resumeFile = document.getElementById('resume').files[0];
    if (resumeFile) {
        // In a real app, you would parse the resume here
        // For demo, we'll simulate having extracted some text
        resumeText = "Experienced Full Stack Developer with expertise in JavaScript, React, Node.js, and Python. Developed multiple web applications with responsive design and RESTful APIs.";
    }
    
    startInterview();
}

function startInterview() {
    welcomeContainer.classList.add('hidden');
    interviewContainer.classList.remove('hidden');
    
    // Start camera
    startCamera();
    
    // Start timer
    startInterviewTimer();
    
    extractedSkills = extractSkillsFromResume(resumeContent);
    questions = generateTechnicalQuestions();
    if (!questions || questions.length === 0) {
        console.error("No questions generated.");
        addBotMessage("Oops! No questions were generated. Please check your resume and try again.", 0, true);
        return;
    }

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

    setTimeout(() => {
        const welcomeMessage = getRandomWelcomeMessage(username);
        addBotMessage(welcomeMessage);
    
        const skillMessages = [
            `I notice you have experience with ${skills}. That's impressive!`,
            `Your knowledge in ${skills} really stands out!`,
            `Having expertise in ${skills} is a great asset!`,
            `I see you’re skilled in ${skills}. That’s fantastic!`,
            `Your proficiency in ${skills} is truly remarkable!`,
            `Wow! ${skills} is a strong skill to have!`,
            `It's great that you have experience in ${skills}!`,
            `I like that you're experienced in ${skills}.`,
            `Your background in ${skills} is quite valuable.`,
            `I'm impressed by your skills in ${skills}!`
        ];
        
        const randomIndex = Math.floor(Math.random() * skillMessages.length);
        const selectedMessage = skillMessages[randomIndex];
        const formattedMessage = selectedMessage.replace("${skills}", extractedSkills.join(', '));
    
        setTimeout(() => {
            addBotMessage("Analyzing your resume... Please wait", true);
    
            setTimeout(() => {
                // Display skills message but **DO NOT** speak it
                addBotMessage(formattedMessage, 0, false);
    
                // Speak the summary **before** asking the first question
                speakText("These are the skills we noticed you have. Now, answer the first question.");
    
                setTimeout(() => {
                    // ✅ Display and speak the first question properly
                    const firstQuestion = `${questions[0].question}`;
                    addBotMessage(firstQuestion, 0, true);
    
                    // ✅ Start the timer after asking the first question
                    startTimer();
                }, 4000); // ⏳ Delay before asking the first question (was 3000, increased for clarity)
            }, 2500); // ⏳ Delay for skills message (was 3000, optimized)
        }, 2000); // ⏳ Delay for "Analyzing your resume..." (was 3000, optimized)
    }, 1200); // ⏳ Initial delay for the welcome message (was 1000, increased slightly)
}

function startCamera() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => {
                const video = document.getElementById('user-video');
                video.srcObject = stream;
            })
            .catch(err => {
                console.error("Error accessing camera: ", err);
                addBotMessage("I couldn't access your camera. Please ensure you've granted camera permissions.", true);
            });
    } else {
        addBotMessage("Your browser doesn't support camera access. Some features may not work correctly.", true);
    }
}

function startInterviewTimer() {
    interviewTimer = setInterval(() => {
        timeRemaining--;
        const minutes = Math.floor(timeRemaining / 60);
        const seconds = timeRemaining % 60;
        timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Update progress bar
        const progress = (timeRemaining / totalTime) * 100;
        progressBar.style.width = `${progress}%`;
        
        // Show coding quiz button at halfway point
        if (timeRemaining === totalTime / 2) {
            codingQuizBtn.classList.remove('hidden');
        }
        
        // End interview when time is up
        if (timeRemaining <= 0) {
            clearInterval(interviewTimer);
            endInterview();
        }
    }, 1000);
}

function startCodingQuiz() {
    // Pause the interview timer
    clearInterval(interviewTimer);
    
    // Switch to coding container
    interviewContainer.classList.add('hidden');
    codingContainer.classList.remove('hidden');
    
    // Set up coding problem
    const problem = codingProblems[Math.floor(Math.random() * codingProblems.length)];
    document.getElementById('problem-title').textContent = `Problem: ${problem.title}`;
    document.getElementById('problem-description').textContent = problem.description;
    document.getElementById('problem-example').textContent = problem.example;
    document.getElementById('code-area').value = problem.template;
    
    // Start coding timer
    startCodingTimer();
}

function startCodingTimer() {
    codingTimeRemaining = codingTime;
    codingTimer = setInterval(() => {
        codingTimeRemaining--;
        const minutes = Math.floor(codingTimeRemaining / 60);
        const seconds = codingTimeRemaining % 60;
        codingTimerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // End coding challenge when time is up
        if (codingTimeRemaining <= 0) {
            clearInterval(codingTimer);
            submitCode();
        }
    }, 1000);
}

function runCode() {
    const codeOutput = document.getElementById('code-output');
    const outputContent = document.getElementById('output-content');
    const codeArea = document.getElementById('code-area');
    
    codeOutput.classList.remove('hidden');
    
    try {
        // Very basic simulation of running code
        // In a real app, you would use a safer evaluation method or a sandbox
        const result = "Test output: Running test cases...\n";
        outputContent.textContent = result;
    } catch (error) {
        outputContent.textContent = `Error: ${error.message}`;
    }
}

function submitCode() {
    clearInterval(codingTimer);
    const codeArea = document.getElementById('code-area');
    const userCode = codeArea.value;
    
    // Basic evaluation of code quality
    // In a real app, you would use a more sophisticated method
    if (userCode.length > 50) {
        userScore.coding = Math.floor(Math.random() * 41) + 60; // Score between 60-100
    } else {
        userScore.coding = Math.floor(Math.random() * 31) + 30; // Score between 30-60
    }
    
    returnToInterview();
}

function returnToInterview() {
    codingContainer.classList.add('hidden');
    interviewContainer.classList.remove('hidden');
    
    // Resume interview timer with remaining time
    startInterviewTimer();
    
    // Continue with interview questions
    if (currentQuestion < questions.general.length) {
        askNextQuestion();
    }
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

function evaluateAnswer(answer) {
    // This is a simplified evaluation for demo purposes
    // In a real app, you would use more sophisticated NLP techniques
    
    // Check for technical knowledge
    const techKeywords = [
        'algorithm', 'framework', 'language', 'code', 'software', 'development', 
        'programming', 'database', 'API', 'architecture', 'design pattern', 
        'testing', 'deployment', 'version control', 'git', 'agile', 'scrum',
        'modules', 'libraries', 'components', 'functions', 'methods'
    ];
    
    const techScore = techKeywords.filter(keyword => 
        answer.toLowerCase().includes(keyword.toLowerCase())
    ).length;
    
    // Check for communication skills
    const communicationScore = Math.min(10, Math.floor(answer.split(' ').length / 15));
    
    // Check for grammar (very simplified)
    const grammarErrors = [
        'i ', ' i ', ' im ', ' ive ', ' id ', ' youre ', ' theyre ', ' weve ', 
        ' thats ', ' dont ', ' cant ', ' wont ', ' shouldnt ', ' couldnt ', ' wouldnt '
    ];
    
    let grammarScore = 10;
    grammarErrors.forEach(error => {
        if ((' ' + answer.toLowerCase() + ' ').includes(error)) {
            grammarScore -= 1;
        }
    });
    
    // Update the user's score
    userScore.technical += techScore;
    userScore.communication += communicationScore;
    userScore.grammar += Math.max(0, grammarScore);
    
    // Determine whether to ask a follow-up question or move on
    const isAnswerGood = techScore > 2 && communicationScore > 5;
    
    if (!isAnswerGood && currentQuestion === 2 && resumeText.includes("Full Stack")) {
        // If the answer wasn't good and this was the Full Stack question, ask a follow-up
        const followUpQuestion = questions.followup["Full Stack"][Math.floor(Math.random() * questions.followup["Full Stack"].length)];
        
        // First give a compliment
        const compliment = compliments[Math.floor(Math.random() * compliments.length)];
        speakBotMessage(compliment + " Let me ask you to elaborate a bit more. " + followUpQuestion);
        
        // Don't increment the question counter - this is a follow-up
        return;
    }
    
    // If we get here, move to the next question
    currentQuestion++;
    
    // Continue with next question or end if we've reached the limit
    if (currentQuestion < 6 && timeRemaining > 0) {
        // First give a compliment
        const compliment = compliments[Math.floor(Math.random() * compliments.length)];
        speakBotMessage(compliment);
        
        setTimeout(() => {
            askNextQuestion();
        }, 1500);
    } else if (timeRemaining > 0) {
        speakBotMessage("Thank you for your answers. Let's continue with some more general questions about your experience.");
        
        setTimeout(() => {
            askNextQuestion();
        }, 2000);
    }
}

function endInterview() {
    // Stop all active processes
    if (speechRecognition) {
        speechRecognition.stop();
    }
    
    // Final message
    addBotMessage("I am generating your report now! Please wait a moment...", true);
    
    // Switch to report view after a short delay
    setTimeout(() => {
        generateReport();
        interviewContainer.classList.add('hidden');
        reportContainer.classList.remove('hidden');
    }, 3000);
}

function generateReport() {
    // Normalize scores to 100 point scale
    const maxTechnical = 30; // Estimated max from evaluation
    const normalizedTechnical = Math.min(100, Math.floor((userScore.technical / maxTechnical) * 100));
    
    const maxCommunication = 40; // Estimated max from evaluation
    const normalizedCommunication = Math.min(100, Math.floor((userScore.communication / maxCommunication) * 100));
    
    const maxGrammar = 60; // Estimated max from evaluation
    const normalizedGrammar = Math.min(100, Math.floor((userScore.grammar / maxGrammar) * 100));
    
    // Average for overall score
    const overallScore = Math.floor((normalizedTechnical + normalizedCommunication + normalizedGrammar + userScore.coding) / 4);
    
    // Create report HTML
    let reportHTML = `
        <div class="report-section">
            <h3>Overall Performance</h3>
            <p>Score: ${overallScore}/100</p>
            <div class="score-bar">
                <div class="score-fill" style="width: ${overallScore}%"></div>
            </div>
        </div>

        <div class="report-section">
            <h3>Technical Knowledge</h3>
            <p>Score: ${normalizedTechnical}/100</p>
            <div class="score-bar">
                <div class="score-fill" style="width: ${normalizedTechnical}%"></div>
            </div>
            <p>${getTechnicalFeedback(normalizedTechnical)}</p>
        </div>

        <div class="report-section">
            <h3>Communication Skills</h3>
            <p>Score: ${normalizedCommunication}/100</p>
            <div class="score-bar">
                <div class="score-fill" style="width: ${normalizedCommunication}%"></div>
            </div>
            <p>${getCommunicationFeedback(normalizedCommunication)}</p>
        </div>

        <div class="report-section">
            <h3>Grammar and Expression</h3>
            <p>Score: ${normalizedGrammar}/100</p>
            <div class="score-bar">
                <div class="score-fill" style="width: ${normalizedGrammar}%"></div>
            </div>
            <p>${getGrammarFeedback(normalizedGrammar)}</p>
        </div>

        <div class="report-section">
            <h3>Coding Challenge</h3>
            <p>Score: ${userScore.coding}/100</p>
            <div class="score-bar">
                <div class="score-fill" style="width: ${userScore.coding}%"></div>
            </div>
            <p>${getCodingFeedback(userScore.coding)}</p>
        </div>

        <div class="report-section">
            <h3>Areas for Improvement</h3>
            <ul>
                ${getImprovementAreas(normalizedTechnical, normalizedCommunication, normalizedGrammar, userScore.coding)}
            </ul>
        </div>
    `;
    
    reportContent.innerHTML = reportHTML;
}

function getTechnicalFeedback(score) {
    if (score >= 80) {
        return "Excellent technical knowledge. You demonstrated strong understanding of concepts and technologies relevant to the position.";
    } else if (score >= 60) {
        return "Good technical knowledge. You have a solid foundation, but could benefit from deepening your expertise in certain areas.";
    } else {
        return "Basic technical knowledge demonstrated. Consider strengthening your understanding of core concepts and technologies.";
    }
}

function getCommunicationFeedback(score) {
    if (score >= 80) {
        return "Excellent communication skills. You expressed ideas clearly and concisely, and structured your responses well.";
    } else if (score >= 60) {
        return "Good communication skills. You conveyed most ideas effectively, though some responses could be more structured.";
    } else {
        return "Communication skills need improvement. Focus on articulating your thoughts more clearly and organizing your responses better.";
    }
}

function getGrammarFeedback(score) {
    if (score >= 80) {
        return "Excellent grammar and language usage. Your responses were professional and well-articulated.";
    } else if (score >= 60) {
        return "Good grammar overall. There were some minor issues, but they didn't significantly impact understanding.";
    } else {
        return "Several grammatical issues identified. Working on proper grammar and professional language would improve your interview performance.";
    }
}

function getCodingFeedback(score) {
    if (score >= 80) {
        return "Excellent coding skills. Your solution was efficient, well-structured, and demonstrated good problem-solving abilities.";
    } else if (score >= 60) {
        return "Good coding approach. Your solution worked but could benefit from optimizations or better structure.";
    } else {
        return "Basic coding solution provided. Focus on improving your problem-solving approach and code efficiency.";
    }
}

function getImprovementAreas(technical, communication, grammar, coding) {
    const areas = [];
    
    if (technical < 70) {
        areas.push("<li>Deepen knowledge of technical concepts and stay updated with industry trends.</li>");
    }
    
    if (communication < 70) {
        areas.push("<li>Practice structuring responses using the STAR method (Situation, Task, Action, Result).</li>");
    }
    
    if (grammar < 70) {
        areas.push("<li>Focus on professional communication and proper grammar in interview settings.</li>");
    }
    
    if (coding < 70) {
        areas.push("<li>Practice coding challenges regularly to improve problem-solving skills and code efficiency.</li>");
    }
    
    // Add general improvements
    areas.push("<li>Prepare concise examples of past experiences that demonstrate your skills.</li>");
    areas.push("<li>Research companies thoroughly before interviews to tailor your responses.</li>");
    
    return areas.join("");
}

function restartInterview() {
    // Reset all states
    currentQuestion = 0;
    userAnswers = [];
    userScore = {
        technical: 0,
        communication: 0,
        grammar: 0,
        coding: 0
    };
    timeRemaining = totalTime;
    codingTimeRemaining = codingTime;
    
    // Clear chat messages
    chatMessages.innerHTML = '';
    
    // Go back to welcome screen
    reportContainer.classList.add('hidden');
    welcomeContainer.classList.remove('hidden');
}

// Speech recognition setup
function setupSpeechRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        speechRecognition = new SpeechRecognition();
        
        speechRecognition.continuous = false;
        speechRecognition.interimResults = true;
        speechRecognition.lang = 'en-US';
        
        speechRecognition.onstart = () => {
            isListening = true;
            responseIndicator.classList.remove('listening-inactive');
            responseIndicator.classList.add('listening-active');
            responseStatusText.textContent = "Listening...";
        };
        
        speechRecognition.onresult = (event) => {
            const transcript = Array.from(event.results)
                .map(result => result[0])
                .map(result => result.transcript)
                .join('');
                
            if (event.results[0].isFinal) {
                isListening = false;
                responseIndicator.classList.remove('listening-active');
                responseIndicator.classList.add('listening-inactive');
                responseStatusText.textContent = "Processing your answer...";
                
                // Add user message to chat
                addUserMessage(transcript);
                
                // Evaluate the answer
                evaluateAnswer(transcript);
            }
        };
        
        speechRecognition.onend = () => {
            isListening = false;
            responseIndicator.classList.remove('listening-active');
            responseIndicator.classList.add('listening-inactive');
            responseStatusText.textContent = "Waiting for your answer...";
        };
        
        speechRecognition.onerror = (event) => {
            console.error('Speech recognition error', event.error);
            responseIndicator.classList.remove('listening-active');
            responseIndicator.classList.add('listening-inactive');
            responseStatusText.textContent = "Error with speech recognition. Please try again.";
        };
    } else {
        console.error('Speech recognition not supported');
    }
}

// Message handling
function addBotMessage(text, skipSpeech = false) {
    const messageEl = document.createElement('div');
    messageEl.className = 'message bot-message';
    
    if (skipSpeech) {
        messageEl.textContent = text;
    } else {
        // For typing effect
        messageEl.classList.add('typing-effect');
        
        let i = 0;
        const typingInterval = setInterval(() => {
            if (i < text.length) {
                messageEl.textContent += text.charAt(i);
                i++;
                
                // Auto scroll to bottom
                chatMessages.scrollTop = chatMessages.scrollHeight;
            } else {
                clearInterval(typingInterval);
                messageEl.classList.remove('typing-effect');
            }
        }, 30);
    }
    
    chatMessages.appendChild(messageEl);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addUserMessage(text) {
    const messageEl = document.createElement('div');
    messageEl.className = 'message user-message';
    messageEl.textContent = text;
    
    chatMessages.appendChild(messageEl);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function speakBotMessage(text) {
    addBotMessage(text);
    
    // Start listening after the bot speaks
    if (speechRecognition && !isListening) {
        setTimeout(() => {
            speechRecognition.start();
        }, 1000);
    }
}