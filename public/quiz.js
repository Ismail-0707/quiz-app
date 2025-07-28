document.addEventListener("DOMContentLoaded", () => {
    const questionText = document.getElementById("question");
    const optionA = document.getElementById("optionA");
    const optionB = document.getElementById("optionB");
    const optionC = document.getElementById("optionC");
    const optionD = document.getElementById("optionD");
    const nextBtn = document.querySelector(".next-btn");
    const resultBox = document.getElementById("resultBox");
    const quizBox = document.getElementById("quizBox");
    const scoreDisplay = document.getElementById("score");

    let currentIndex = 0;
    let score = 0;
    let questions = [];
    let timeLeft = 30;
    let timerInterval;


    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get("category") || "python";

    document.querySelector("h1").textContent = `${category.charAt(0).toUpperCase() + category.slice(1)} Quiz`;

    function showResult() {
        quizBox.style.display = "none";
        resultBox.style.display = "block";
        scoreDisplay.textContent = `You scored ${score} out of ${questions.length}`;

        fetch("/api/save-score", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                category,
                score,
                total: questions.length
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                console.log("✅ Score saved to DB");
            } else {
                console.warn("❌ Failed to save score:", data.message);
            }
        })
        .catch(err => console.error("Server error:", err));
    }

    fetch(`/api/questions/${category}`)
        .then(res => res.json())
        .then(data => {
            console.log("Raw API response from backend:", data); // Check this carefully!

            if (data.length > 0) {
                questions = data.map(q => ({
                    question: q.question,
                    options: q.options, 
                    answer: q.answer // This is the value from your DB
                }));
                console.log("Formatted questions array (frontend):", questions); // Check this too!
                console.log("Number of questions loaded:", questions.length);
                showQuestion();
            } else {
                questionText.textContent = "No questions available.";
                showResult();
            }
        })
        .catch(err => {
            questionText.textContent = "Failed to load questions.";
            console.error("Error fetching questions:", err);
            showResult();
        });

        function autoSkipQuestion() 
        {
                        const selected = document.querySelector('input[name="answer"]:checked');
                        const selectedValue = selected ? selected.value : null;
                        const correct = questions[currentIndex].answer;

                        if (selectedValue === correct) {
                            score++;
                        }

                        currentIndex++;
                        if (currentIndex < questions.length) {
                            showQuestion();
                        } else {
                            showResult();
                        }
        }


        function startTimer() 
        {
            timeLeft = 30;
            document.getElementById("time").textContent = timeLeft;

            clearInterval(timerInterval); // clear previous timer
            timerInterval = setInterval(() => {
                timeLeft--;
                document.getElementById("time").textContent = timeLeft;

                if (timeLeft === 0) {
                clearInterval(timerInterval);
                autoSkipQuestion(); // move to next question automatically
                }
            }, 1000);
        }


    function showQuestion() 
    {
        if (currentIndex >= questions.length) {
            return showResult();
        }

        const current = questions[currentIndex];

        questionText.textContent = current.question;
        optionA.textContent = current.options[0];
        optionB.textContent = current.options[1];
        optionC.textContent = current.options[2];
        optionD.textContent = current.options[3];

        document.querySelectorAll('input[name="answer"]').forEach(r => r.checked = false);
        startTimer();

    }

    window.nextQuestion = function () {
        const selected = document.querySelector('input[name="answer"]:checked');
        if (!selected) return alert("Please select an answer");

        const selectedValue = selected.value; // This will be "A", "B", "C", or "D" from your HTML
        const correct = questions[currentIndex].answer; // This comes from the 'correctOption' column in your DB

        // --- DEBUGGING LOGS ---
        console.log("--- Checking Answer ---");
        console.log("Selected Radio Button Value:", selectedValue);
        console.log("Correct Answer from Database (questions array):", correct);
        console.log("Comparison Result (selectedValue === correct):", selectedValue === correct);
        console.log("Score BEFORE check:", score);
        // --- END DEBUGGING LOGS ---

        if (selectedValue === correct) {
            score++;
            console.log("Score incremented! New Score:", score);
        } else {
            console.log("Incorrect answer. Score remains:", score);
        }

        console.log("-----------------------");

        currentIndex++;

        if (currentIndex < questions.length) {
            showQuestion();
        } else {
            showResult();
        }
    };
});