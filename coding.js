// Select required elements
const configContainer = document.querySelector(".config-container");
const quizContainer = document.querySelector(".quiz-container");
let answerOptions = quizContainer.querySelector(".answer-options");
const nextQuestionBtn = quizContainer.querySelector(".next-question-btn");
const questionStatus = quizContainer.querySelector(".question-status");
const timerDisplay = quizContainer.querySelector(".timer-duration");
const resultContainer = document.querySelector(".result-container");

// Quiz Configuration Elements
const categoryButtons = document.querySelectorAll(".category-option");
const questionCountButtons = document.querySelectorAll(".question-option");
const startQuizBtn = document.querySelector(".start-quiz-btn");

// State Variables
const QUIZ_TIME_LIMIT = 15;
let currentTime = QUIZ_TIME_LIMIT;
let timer = null;
let quizCategory = "Coding";
let numberOfQuestions = 10;
let currentQuestion = null;
const questionsIndexHistory = [];
let correctAnswersCount = 0;
let selectedOption = null;
let disableSelection = false;

// Handle Category Selection
categoryButtons.forEach(button => {
    button.addEventListener("click", () => {
        categoryButtons.forEach(btn => btn.classList.remove("active"));
        button.classList.add("active");
        quizCategory = button.textContent;
    });
});

// Handle Number of Questions Selection
questionCountButtons.forEach(button => {
    button.addEventListener("click", () => {
        questionCountButtons.forEach(btn => btn.classList.remove("active"));
        button.classList.add("active");
        numberOfQuestions = parseInt(button.textContent, 10);
    });
});

// Display Quiz Result
const showQuizResult = () => {
    clearInterval(timer);
    document.querySelector(".quiz-popup").classList.remove("active");
    document.querySelector(".result-popup").classList.add("active");

    const resultText = `You answered <b>${correctAnswersCount}</b> out of <b>${numberOfQuestions}</b> questions correctly.`;
    resultContainer.querySelector(".result-message").innerHTML = resultText;
};

// Reset Timer
const resetTimer = () => {
    clearInterval(timer);
    currentTime = QUIZ_TIME_LIMIT;
    timerDisplay.textContent = `${currentTime}s`;
};

// Start Timer
// Start Timer
const startTimer = () => {
    timer = setInterval(() => {
        currentTime--;
        timerDisplay.textContent = `${currentTime}s`;

        if (currentTime <= 0) {
            clearInterval(timer);
            renderQuestion();  // Directly go to the next question after 15 secs
        }
    }, 1000);
};


// Get a Random Question
const getRandomQuestion = () => {
    const categoryQuestions = questions.find(cat => 
        cat.category.toLowerCase() === quizCategory.toLowerCase()
    )?.questions || [];

    if (questionsIndexHistory.length >= Math.min(numberOfQuestions, categoryQuestions.length)) {
        return showQuizResult();
    }

    const availableQuestions = categoryQuestions.filter((_, index) => !questionsIndexHistory.includes(index));
    if (availableQuestions.length === 0) return showQuizResult();

    const randomQuestion = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
    questionsIndexHistory.push(categoryQuestions.indexOf(randomQuestion));

    return randomQuestion;
};

// Highlight the Correct Answer
const highlightCorrectAnswer = () => {
    const correctOption = answerOptions.querySelectorAll(".answer-option")[currentQuestion.correctAnswer];
    if (correctOption) {
        correctOption.classList.add("correct");
        correctOption.insertAdjacentHTML("beforeend", `<span class="material-symbols-rounded"> check_circle </span>`);
    }
};

// Finalize Answer
// Finalize Answer
// Finalize Answer
// Finalize Answer
const finalizeAnswer = () => {
    if (selectedOption !== null) {
        const isCorrect = selectedOption.index === currentQuestion.correctAnswer;
        if (isCorrect) {
            correctAnswersCount++; // ✅ Increase score if correct
        }
    }

    // Disable all options
    answerOptions.querySelectorAll(".answer-option").forEach(option => {
        option.style.pointerEvents = "none";
        option.classList.add("disabled");
    });

    disableSelection = true; // Prevent multiple selections

    // Show "Next" button when user selects an option
    nextQuestionBtn.style.visibility = "visible";
};

// Automatically go to next question after 15 sec
const autoNextQuestion = () => {
    setTimeout(() => {
        if (disableSelection) {
            nextQuestionBtn.style.visibility = "hidden"; // Hide before loading new question
            renderQuestion();
        }
    }, QUIZ_TIME_LIMIT * 1000);
};




// Handle Answer Selection
// Handle Answer Selection
// Handle Answer Selection
// Handle Answer Selection
const handleAnswer = option => {
    if (disableSelection) return;

    answerOptions.querySelectorAll(".answer-option").forEach(opt => {
        opt.classList.remove("selected");
        opt.classList.add("disabled");
    });

    option.classList.add("selected");
    option.classList.remove("disabled");

    selectedOption = { index: [...answerOptions.children].indexOf(option) };

    finalizeAnswer(); // ✅ Process answer immediately
};




// Adjust Quiz Layout for Code Snippets
const adjustQuizLayout = () => {
    const questionText = document.querySelector(".question-text");
    if (questionText && questionText.innerHTML.includes("<code>")) {
        quizContainer.classList.add("expanded");
    } else {
        quizContainer.classList.remove("expanded");
    }
};

// Render a New Question
const renderQuestion = () => {
    currentQuestion = getRandomQuestion();
    if (!currentQuestion) return;

    disableSelection = false;
    selectedOption = null;
    resetTimer();
    startTimer();

    nextQuestionBtn.style.visibility = "hidden";
    quizContainer.querySelector(".quiz-timer").style.background = "#32313C";

    questionStatus.innerHTML = `<b>${questionsIndexHistory.length}</b> of <b>${numberOfQuestions}</b> Questions`;

    if (quizCategory === "Coding" && currentQuestion.code) {
        quizContainer.querySelector(".quiz-content").innerHTML = `
            <div class="coding-layout">
                <pre class="code-snippet">${currentQuestion.code}</pre>
                <div class="quiz-right">
                    <h1 class="question-text">${currentQuestion.question}</h1>
                    <ul class="answer-options">
                        ${currentQuestion.options.map(option => `<li class="answer-option">${option}</li>`).join("")}
                    </ul>
                </div>
            </div>
        `;
    } else {
        quizContainer.querySelector(".quiz-content").innerHTML = `
            <h1 class="question-text">${currentQuestion.question}</h1>
            <ul class="answer-options">
                ${currentQuestion.options.map(option => `<li class="answer-option">${option}</li>`).join("")}
            </ul>
        `;
    }

    answerOptions = quizContainer.querySelector(".answer-options");

    setTimeout(() => {
        answerOptions.querySelectorAll(".answer-option").forEach(option => {
            option.addEventListener("click", () => handleAnswer(option));
        });
    }, 0);

    adjustQuizLayout();
};

// Start Quiz
const startQuiz = () => {
    document.querySelector(".config-popup").classList.remove("active");
    document.querySelector(".quiz-popup").classList.add("active");

    quizCategory = document.querySelector(".category-option.active").textContent;
    numberOfQuestions = parseInt(document.querySelector(".question-option.active").textContent, 10);

    renderQuestion();
};

// Reset Quiz
const resetQuiz = () => {
    resetTimer();
    correctAnswersCount = 0;
    questionsIndexHistory.length = 0;
    document.querySelector(".config-popup").classList.add("active");
    document.querySelector(".result-popup").classList.remove("active");
};

// Event Listeners
// Event Listener for "Next Question" Button
nextQuestionBtn.addEventListener("click", () => {
    nextQuestionBtn.style.visibility = "hidden"; // Hide button for the next round
    renderQuestion();
});

resultContainer.querySelector(".try-again-btn").addEventListener("click", resetQuiz);
startQuizBtn.addEventListener("click", startQuiz);
