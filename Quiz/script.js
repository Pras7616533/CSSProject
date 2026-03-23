// ✅ Load CSS
const link = document.createElement("link");
link.rel = "stylesheet";
link.href = "style.css";
document.head.appendChild(link);

let quizData = [];

// ✅ Load Questions from JSON (LIKE CHATGPT DATA SYSTEM)
window.onload = async function () {
    const res = await fetch("questions.json");
    quizData = await res.json();

    loadQuiz();
};

// ✅ Generate UI
function loadQuiz() {
    const quizContainer = document.getElementById("quiz");

    quizData.forEach((q, index) => {
        const card = document.createElement("div");
        card.classList.add("card");

        let html = `<p>${index + 1}. ${q.question}</p>`;

        q.options.forEach((opt, i) => {
            html += `
                <label>
                    <input type="radio" name="q${index}" value="${i}">
                    ${opt}
                </label>
            `;
        });

        card.innerHTML = html;
        quizContainer.appendChild(card);
    });
}

// ✅ Check Answers
function checkAnswers() {
    let score = 0;

    quizData.forEach((q, index) => {
        const selected = document.querySelector(`input[name="q${index}"]:checked`);
        const card = document.querySelectorAll(".card")[index];

        if (selected) {
            if (parseInt(selected.value) === q.answer) {
                score++;
                card.classList.add("correct");
            } else {
                card.classList.add("wrong");
            }
        } else {
            card.classList.add("wrong");
        }
    });

    document.getElementById("score").innerText = `Your Score: ${score}/${quizData.length}`;
}