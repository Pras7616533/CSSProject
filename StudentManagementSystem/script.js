const storageKey = "sms_students";

const studentForm = document.getElementById("studentForm");
const studentTable = document.getElementById("studentTable");
const totalStudents = document.getElementById("totalStudents");
const avgMarks = document.getElementById("avgMarks");
const searchInput = document.getElementById("searchInput");
const filterCourse = document.getElementById("filterCourse");
const submitBtn = document.getElementById("submitBtn");
const resetBtn = document.getElementById("resetBtn");
const formTitle = document.getElementById("formTitle");
const modal = document.getElementById("confirmModal");
const confirmDeleteBtn = document.getElementById("confirmDelete");
const cancelDeleteBtn = document.getElementById("cancelDelete");
const toastContainer = document.getElementById("toastContainer");

const inputs = {
  id: document.getElementById("studentId"),
  name: document.getElementById("studentName"),
  email: document.getElementById("studentEmail"),
  course: document.getElementById("studentCourse"),
  marks: document.getElementById("studentMarks"),
};

let students = JSON.parse(localStorage.getItem(storageKey)) || [];
let editingId = null;
let deleteTargetId = null;

const saveStudents = () => {
  localStorage.setItem(storageKey, JSON.stringify(students));
};

const showToast = (message, type = "success") => {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 2600);
};

const resetForm = () => {
  studentForm.reset();
  editingId = null;
  submitBtn.textContent = "Add Student";
  formTitle.textContent = "Add Student";
};

const updateDashboard = (list = students) => {
  totalStudents.textContent = list.length.toString();
  const totalMarks = list.reduce((sum, student) => sum + Number(student.marks || 0), 0);
  const average = list.length ? (totalMarks / list.length).toFixed(1) : "0";
  avgMarks.textContent = average;
};

const renderStudents = (list = students) => {
  if (!list.length) {
    studentTable.innerHTML = `<tr><td colspan="6">No students found.</td></tr>`;
    updateDashboard(list);
    return;
  }

  studentTable.innerHTML = list
    .map(
      (student) => `
      <tr>
        <td>${student.id}</td>
        <td>${student.name}</td>
        <td>${student.email}</td>
        <td>${student.course}</td>
        <td>${student.marks}</td>
        <td>
          <div class="action-btns">
            <button type="button" data-action="edit" data-id="${student.id}">Edit</button>
            <button type="button" class="danger" data-action="delete" data-id="${student.id}">Delete</button>
          </div>
        </td>
      </tr>
    `
    )
    .join("");

  updateDashboard(list);
};

const getFilteredStudents = () => {
  const term = searchInput.value.trim().toLowerCase();
  const course = filterCourse.value;

  return students.filter((student) => {
    const matchesCourse = course === "All" || student.course === course;
    const matchesSearch =
      student.name.toLowerCase().includes(term) ||
      student.id.toLowerCase().includes(term) ||
      student.email.toLowerCase().includes(term);
    return matchesCourse && matchesSearch;
  });
};

const openDeleteModal = (id) => {
  deleteTargetId = id;
  modal.classList.add("show");
  modal.setAttribute("aria-hidden", "false");
};

const closeDeleteModal = () => {
  deleteTargetId = null;
  modal.classList.remove("show");
  modal.setAttribute("aria-hidden", "true");
};

studentForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const studentData = {
    id: inputs.id.value.trim(),
    name: inputs.name.value.trim(),
    email: inputs.email.value.trim(),
    course: inputs.course.value,
    marks: Number(inputs.marks.value),
  };

  if (!studentData.id || !studentData.name || !studentData.email || !studentData.course) {
    showToast("Please fill in all fields.", "error");
    return;
  }

  const exists = students.some(
    (student) => student.id.toLowerCase() === studentData.id.toLowerCase()
  );

  if (editingId) {
    const index = students.findIndex((student) => student.id === editingId);
    if (index === -1) {
      showToast("Student not found.", "error");
      return;
    }

    if (studentData.id !== editingId && exists) {
      showToast("Student ID already exists.", "error");
      return;
    }

    students[index] = studentData;
    showToast("Student updated.");
  } else {
    if (exists) {
      showToast("Student ID already exists.", "error");
      return;
    }

    students.push(studentData);
    showToast("Student added.");
  }

  saveStudents();
  resetForm();
  renderStudents(getFilteredStudents());
});

resetBtn.addEventListener("click", () => {
  resetForm();
});

studentTable.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  const action = target.dataset.action;
  const id = target.dataset.id;

  if (!action || !id) return;

  if (action === "edit") {
    const student = students.find((item) => item.id === id);
    if (!student) return;
    inputs.id.value = student.id;
    inputs.name.value = student.name;
    inputs.email.value = student.email;
    inputs.course.value = student.course;
    inputs.marks.value = student.marks;
    editingId = student.id;
    submitBtn.textContent = "Update Student";
    formTitle.textContent = "Edit Student";
    showToast("Editing student...");
    document.getElementById("student-form").scrollIntoView({ behavior: "smooth" });
  }

  if (action === "delete") {
    openDeleteModal(id);
  }
});

confirmDeleteBtn.addEventListener("click", () => {
  if (!deleteTargetId) return;
  students = students.filter((student) => student.id !== deleteTargetId);
  saveStudents();
  closeDeleteModal();
  renderStudents(getFilteredStudents());
  showToast("Student deleted.");
});

cancelDeleteBtn.addEventListener("click", closeDeleteModal);
modal.addEventListener("click", (event) => {
  if (event.target === modal) {
    closeDeleteModal();
  }
});

searchInput.addEventListener("input", () => {
  renderStudents(getFilteredStudents());
});

filterCourse.addEventListener("change", () => {
  renderStudents(getFilteredStudents());
});

renderStudents(getFilteredStudents());
