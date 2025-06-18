document.addEventListener('DOMContentLoaded', () => {
    const semestersContainer = document.getElementById('semesters-container');
    const addSemesterBtn = document.getElementById('addSemesterBtn');
    const resetAllBtn = document.getElementById('resetAllBtn');
    const overallCGPADisplay = document.getElementById('overallCGPA');

    // NEW: Custom Alert Modal elements
    const customAlertOverlay = document.getElementById('custom-alert-overlay');
    const customAlertMessage = document.getElementById('custom-alert-message');
    const customAlertOkBtn = document.getElementById('custom-alert-ok-btn');
    let inputToClearAndFocus = null; // Variable to store which input caused the alert

    let semesterCount = 0;
    let lastEnterTime = 0;
    const doubleEnterThreshold = 300;
    const creditsPerCourse = 3;

    function roundGPA(gpaValue) {
        if (isNaN(gpaValue)) return 'N/A';
        return parseFloat(gpaValue.toFixed(2));
    }

    // NEW: Custom showAlert function
    function showAlert(message, inputElement) {
        customAlertMessage.textContent = message;
        customAlertOverlay.classList.add('visible');
        inputToClearAndFocus = inputElement; // Store the element that triggered the alert
    }

    // NEW: Event listener for the custom alert's OK button
    customAlertOkBtn.addEventListener('click', () => {
        customAlertOverlay.classList.remove('visible');
        if (inputToClearAndFocus) {
            inputToClearAndFocus.value = ''; // Clear the input
            inputToClearAndFocus.focus(); // Focus back on it
            // Trigger a recalculation after clearing the input, to update locking state
            const semesterElement = inputToClearAndFocus.closest('.semester');
            if (semesterElement) {
                calculateSemesterGPA(semesterElement);
            }
            inputToClearAndFocus = null; // Reset for next alert
        }
    });

    function calculateSemesterGPA(semesterElement) {
        let totalGradePoints = 0;
        let totalCredits = 0;
        const semesterGpaOverrideInput = semesterElement.querySelector('.semester-gpa-override');
        const totalCoursesOverrideInput = semesterElement.querySelector('.total-courses-override');
        const semesterCGPADisplay = semesterElement.querySelector('.semester-cgpa-display');
        const semesterCreditsDisplay = semesterElement.querySelector('.semester-credits-display');
        const totalCoursesDisplaySpan = semesterElement.querySelector('.total-courses-display-span');
        const totalCoursesLabel = semesterElement.querySelector('.total-courses-label');
        const addCourseButton = semesterElement.querySelector('.add-course-btn');

        const overrideGPA = parseFloat(semesterGpaOverrideInput.value);
        const isEmptyOverrideGPA = semesterGpaOverrideInput.value.trim() === '';
        const isValidOverrideGPA = !isNaN(overrideGPA) && overrideGPA >= 0 && overrideGPA <= 4;

        const overrideTotalCourses = parseInt(totalCoursesOverrideInput.value);
        const isEmptyTotalCourses = totalCoursesOverrideInput.value.trim() === '';
        const isValidTotalCourses = !isNaN(overrideTotalCourses) && overrideTotalCourses >= 1;

        semesterGpaOverrideInput.classList.remove('highlight-error');
        totalCoursesOverrideInput.classList.remove('highlight-error');

        const shouldLockCourses = !isEmptyOverrideGPA;
        lockCourseInputs(semesterElement, shouldLockCourses);

        if (shouldLockCourses) {
            totalCoursesOverrideInput.style.display = 'inline-block';
            totalCoursesLabel.style.display = 'inline-block';
            totalCoursesDisplaySpan.style.display = 'none';
            addCourseButton.style.display = 'none';
        } else {
            totalCoursesOverrideInput.value = '';
            totalCoursesOverrideInput.style.display = 'none';
            totalCoursesLabel.style.display = 'none';
            totalCoursesDisplaySpan.style.display = 'none';
            addCourseButton.style.display = 'inline-block';
        }

        if (isEmptyOverrideGPA) {
            const courseInputs = semesterElement.querySelectorAll('.course-gpa-input');
            let allCoursesValid = true;

            courseInputs.forEach(input => {
                const courseGroup = input.closest('.course-input-group');
                courseGroup.classList.remove('highlight-error');

                const gpa = parseFloat(input.value);

                if (isNaN(gpa) || gpa < 0 || gpa > 4) {
                    allCoursesValid = false;
                    if (input.value !== '') {
                        courseGroup.classList.add('highlight-error');
                    }
                } else {
                    totalGradePoints += gpa * creditsPerCourse;
                    totalCredits += creditsPerCourse;
                }
            });

            if (totalCredits > 0 && allCoursesValid) {
                const semesterGPA = roundGPA(totalGradePoints / totalCredits);
                semesterCGPADisplay.textContent = semesterGPA.toFixed(2);
                semesterCreditsDisplay.textContent = totalCredits;
            } else if (totalCredits === 0 && allCoursesValid) {
                semesterCGPADisplay.textContent = '0.00';
                semesterCreditsDisplay.textContent = '0';
            } else {
                semesterCGPADisplay.textContent = 'N/A';
                semesterCreditsDisplay.textContent = 'N/A';
            }

        } else if (isValidOverrideGPA) {
            semesterCGPADisplay.textContent = roundGPA(overrideGPA).toFixed(2);

            if (isValidTotalCourses) {
                totalCredits = overrideTotalCourses * creditsPerCourse;
                semesterCreditsDisplay.textContent = totalCredits;
                totalCoursesDisplaySpan.textContent = `Total Courses: ${overrideTotalCourses}`;
            } else {
                totalCoursesOverrideInput.classList.add('highlight-error');
                semesterCreditsDisplay.textContent = 'N/A';
                totalCoursesDisplaySpan.textContent = 'Total Courses: N/A';
            }
            
        } else {
            semesterGpaOverrideInput.classList.add('highlight-error');
            semesterCGPADisplay.textContent = 'N/A';
            semesterCreditsDisplay.textContent = 'N/A';

            if (!isEmptyTotalCourses && !isValidTotalCourses) {
                 totalCoursesOverrideInput.classList.add('highlight-error');
            }
        }
        updateOverallCGPA();
    }

    function lockCourseInputs(semesterElement, lock) {
        const courseInputs = semesterElement.querySelectorAll('.course-input-group');
        const addCourseBtn = semesterElement.querySelector('.add-course-btn');
        courseInputs.forEach(group => {
            group.classList.toggle('locked', lock);
            group.querySelectorAll('input, button').forEach(input => {
                if (input.classList.contains('remove-course-btn')) {
                    input.style.display = lock ? 'none' : 'inline-block';
                } else {
                    input.disabled = lock;
                }
            });
            const nameInput = group.querySelector('.course-name-input');
            const label = group.querySelector('label[for^="course-"]');
            if (label && nameInput) {
                if (!lock && nameInput.value.trim() === '') {
                    label.textContent = `Course ${group.dataset.courseNum} Name:`;
                }
            }
        });

        if (addCourseBtn) {
            addCourseBtn.style.display = lock ? 'none' : 'inline-block';
        }
    }

    function updateOverallCGPA() {
        let overallTotalGradePoints = 0;
        let overallTotalCredits = 0;

        document.querySelectorAll('.semester').forEach(semesterElement => {
            const semesterCGPA = parseFloat(semesterElement.querySelector('.semester-cgpa-display').textContent);
            const semesterCredits = parseFloat(semesterElement.querySelector('.semester-credits-display').textContent);

            if (!isNaN(semesterCGPA) && !isNaN(semesterCredits) && semesterCredits > 0) {
                overallTotalGradePoints += semesterCGPA * semesterCredits;
                overallTotalCredits += semesterCredits;
            }
        });

        if (overallTotalCredits > 0) {
            overallCGPADisplay.textContent = roundGPA(overallTotalGradePoints / overallTotalCredits).toFixed(2);
        } else {
            overallCGPADisplay.textContent = '0.00';
        }
    }

    function createCourseInput(courseNum, semesterElement) {
        const courseId = `course-${semesterElement.dataset.semesterId}-${courseNum}`;

        const courseGroup = document.createElement('div');
        courseGroup.classList.add('course-input-group');
        courseGroup.dataset.courseNum = courseNum;
        courseGroup.innerHTML = `
            <label for="${courseId}-name">Course ${courseNum} Name:</label>
            <input type="text" id="${courseId}-name" class="course-name-input" placeholder="Optional Name">
            <label for="${courseId}-gpa">GPA (0-4):</label>
            <input type="number" id="${courseId}-gpa" class="course-gpa-input" min="0" max="4" step="0.01" required>
            <span class="lock-icon">🔒</span>
            <button type="button" class="remove-course-btn">X</button>
        `;

        const gpaInput = courseGroup.querySelector('.course-gpa-input');
        const courseNameInput = courseGroup.querySelector('.course-name-input');
        const removeCourseBtn = courseGroup.querySelector('.remove-course-btn');

        gpaInput.addEventListener('input', (event) => {
            const gpa = parseFloat(event.target.value);
            if (event.target.value.trim() !== '' && (isNaN(gpa) || gpa < 0 || gpa > 4)) {
                event.target.classList.add('highlight-error');
                // Use custom alert
                showAlert("Please enter a GPA between 0.00 and 4.00 for this course.", event.target);
            } else {
                event.target.classList.remove('highlight-error');
            }
            calculateSemesterGPA(semesterElement);
        });

        courseNameInput.addEventListener('input', (event) => {
            const label = courseGroup.querySelector('label[for^="course-"]');
            if (event.target.value.trim() !== '') {
                label.textContent = `${event.target.value.trim()} GPA:`;
            } else {
                label.textContent = `Course ${courseNum} Name:`;
            }
        });

        removeCourseBtn.addEventListener('click', () => {
            courseGroup.remove();
            calculateSemesterGPA(semesterElement);
            renumberCourses(semesterElement);
        });

        gpaInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                if (semesterElement.querySelector('.semester-gpa-override').value.trim() === '') {
                    const now = Date.now();
                    const gpa = parseFloat(gpaInput.value);
                    if (gpaInput.value.trim() !== '' && (isNaN(gpa) || gpa < 0 || gpa > 4)) {
                         // Alert already handled by 'input' event listener, just prevent further action
                         return;
                    }

                    if (now - lastEnterTime < doubleEnterThreshold) {
                        addSemester();
                    } else {
                        if (gpaInput.value.trim() !== '') {
                            addCourseToSemester(semesterElement);
                        }
                    }
                    lastEnterTime = now;
                }
            }
        });

        return courseGroup;
    }

    function addCourseToSemester(semesterElement) {
        const coursesContainer = semesterElement.querySelector('.courses-container');
        const existingCourses = coursesContainer.querySelectorAll('.course-input-group').length;

        if (semesterElement.querySelector('.semester-gpa-override').value.trim() !== '') {
            console.log("Cannot add courses when semester CGPA is overridden.");
            return;
        }

        if (existingCourses < 6) {
            const newCourseNum = existingCourses + 1;
            const newCourseInput = createCourseInput(newCourseNum, semesterElement);
            coursesContainer.appendChild(newCourseInput);
            newCourseInput.querySelector('.course-gpa-input').focus();
        } else {
            console.log("Maximum 6 courses per semester reached.");
        }
    }

    function renumberCourses(semesterElement) {
        const coursesContainer = semesterElement.querySelector('.courses-container');
        const courseGroups = coursesContainer.querySelectorAll('.course-input-group');
        courseGroups.forEach((group, index) => {
            const courseNum = index + 1;
            const nameInput = group.querySelector('.course-name-input');
            const label = group.querySelector('label[for^="course-"]');
            const gpaInput = group.querySelector('.course-gpa-input');

            const newCourseId = `course-${semesterElement.dataset.semesterId}-${courseNum}`;
            nameInput.id = `${newCourseId}-name`;
            gpaInput.id = `${newCourseId}-gpa`;
            label.setAttribute('for', `${newCourseId}-name`);

            if (nameInput.value.trim() === '') {
                label.textContent = `Course ${courseNum} Name:`;
            } else {
                 label.textContent = `${nameInput.value.trim()} GPA:`;
            }
            group.dataset.courseNum = courseNum;
        });
    }

    function addSemester() {
        semesterCount++;
        const semesterId = `semester-${semesterCount}`;
        const defaultSemesterName = `Semester ${semesterCount}`;

        const semesterDiv = document.createElement('div');
        semesterDiv.classList.add('semester');
        semesterDiv.dataset.semesterId = semesterId;
        semesterDiv.dataset.hasCustomName = 'false';

        semesterDiv.innerHTML = `
            <div class="semester-header">
                <label for="${semesterId}-name">Semester Name:</label>
                <input type="text" id="${semesterId}-name" class="semester-name-input" value="${defaultSemesterName}" placeholder="Optional Name">
                <label for="${semesterId}-gpa-override">GPA:</label>
                <input type="number" id="${semesterId}-gpa-override" class="semester-gpa-override" min="0" max="4" step="0.01" placeholder="Override GPA">
                <label for="${semesterId}-total-courses" class="total-courses-label" style="display: none;">Total Courses:</label>
                <input type="number" id="${semesterId}-total-courses" class="total-courses-override" min="1" step="1" placeholder="Num Courses" style="display: none;">
                <span class="total-courses-display-span"></span>
                <button type="button" class="remove-semester-btn">Remove Semester</button>
            </div>
            <div class="courses-container">
                
            </div>
            <button type="button" class="add-course-btn action-button">Add Course</button>
            <div class="semester-results">
                Semester CGPA: <span class="semester-cgpa-display">0.00</span> | Credits: <span class="semester-credits-display">0</span>
            </div>
        `;

        const semesterNameInput = semesterDiv.querySelector('.semester-name-input');
        const semesterGpaOverrideInput = semesterDiv.querySelector('.semester-gpa-override');
        const totalCoursesOverrideInput = semesterDiv.querySelector('.total-courses-override');
        const totalCoursesLabel = semesterDiv.querySelector('.total-courses-label');
        const totalCoursesDisplaySpan = semesterDiv.querySelector('.total-courses-display-span');
        const removeSemesterBtn = semesterDiv.querySelector('.remove-semester-btn');
        const addCourseButton = semesterDiv.querySelector('.add-course-btn');

        semesterNameInput.addEventListener('input', (event) => {
            const currentSemesterDiv = event.target.closest('.semester');
            if (event.target.value.trim() === '') {
                currentSemesterDiv.dataset.hasCustomName = 'false';
            } else {
                currentSemesterDiv.dataset.hasCustomName = 'true';
            }
        });

        semesterGpaOverrideInput.addEventListener('input', () => {
            const gpa = parseFloat(semesterGpaOverrideInput.value);
            if (semesterGpaOverrideInput.value.trim() !== '' && (isNaN(gpa) || gpa < 0 || gpa > 4)) {
                semesterGpaOverrideInput.classList.add('highlight-error');
                // Use custom alert
                showAlert("Please enter a GPA between 0.00 and 4.00 for the semester.", semesterGpaOverrideInput);
            } else {
                semesterGpaOverrideInput.classList.remove('highlight-error');
            }
            calculateSemesterGPA(semesterDiv); 
        });

        totalCoursesOverrideInput.addEventListener('input', () => {
            const numCourses = parseInt(totalCoursesOverrideInput.value);
            if (totalCoursesOverrideInput.value.trim() !== '' && (isNaN(numCourses) || numCourses < 1)) {
                totalCoursesOverrideInput.classList.add('highlight-error');
                // Use custom alert
                showAlert("Please enter a valid number of courses (1 or more).", totalCoursesOverrideInput);
            } else {
                totalCoursesOverrideInput.classList.remove('highlight-error');
            }
            calculateSemesterGPA(semesterDiv);
        });

        removeSemesterBtn.addEventListener('click', () => {
            semesterDiv.remove();
            updateOverallCGPA();
            renumberSemesters();
        });

        addCourseButton.addEventListener('click', () => {
            addCourseToSemester(semesterDiv);
        });

        semestersContainer.appendChild(semesterDiv);
        addCourseToSemester(semesterDiv);
        semesterNameInput.focus();

        semesterNameInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                const now = Date.now();
                const currentSemesterHasCustomName = semesterDiv.dataset.hasCustomName === 'true';

                if (now - lastEnterTime < doubleEnterThreshold) {
                    addSemester();
                } else {
                    if (semesterGpaOverrideInput.value.trim() !== '') {
                        
                    } else if (currentSemesterHasCustomName) {
                        
                    } else {
                        semesterDiv.querySelector('.course-gpa-input').focus();
                    }
                }
                lastEnterTime = now;
            }
        });

        semesterGpaOverrideInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                const overrideValue = parseFloat(semesterGpaOverrideInput.value);

                if (semesterGpaOverrideInput.value.trim() === '') {
                    addSemester();
                } else if (isNaN(overrideValue) || overrideValue < 0 || overrideValue > 4) {
                    return; 
                } else {
                    const now = Date.now();
                    if (now - lastEnterTime < doubleEnterThreshold) {
                        addSemester();
                    } else {
                        totalCoursesOverrideInput.focus();
                    }
                }
                lastEnterTime = now;
            }
        });

        totalCoursesOverrideInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                const now = Date.now();
                const overrideTotalCoursesValue = parseInt(totalCoursesOverrideInput.value);

                if (totalCoursesOverrideInput.value.trim() === '' || isNaN(overrideTotalCoursesValue) || overrideTotalCoursesValue < 1) {
                    return;
                }

                if (now - lastEnterTime < doubleEnterThreshold) {
                    addSemester();
                } else {
                    addSemester();
                }
                lastEnterTime = now;
            }
        });

        updateOverallCGPA();
    }

    function renumberSemesters() {
        document.querySelectorAll('.semester').forEach((semesterDiv, index) => {
            const newSemesterCount = index + 1;
            semesterDiv.dataset.semesterId = `semester-${newSemesterCount}`;
            const semesterNameInput = semesterDiv.querySelector('.semester-name-input');
            
            if (semesterDiv.dataset.hasCustomName === 'false') {
                 semesterNameInput.value = `Semester ${newSemesterCount}`;
            }
            renumberCourses(semesterDiv);
        });
        semesterCount = document.querySelectorAll('.semester').length;
    }

    addSemesterBtn.addEventListener('click', addSemester);
    resetAllBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to reset all data?')) {
            semestersContainer.innerHTML = '';
            semesterCount = 0;
            overallCGPADisplay.textContent = '0.00';
            addSemester();
        }
    });

    addSemester();
    updateOverallCGPA();
});