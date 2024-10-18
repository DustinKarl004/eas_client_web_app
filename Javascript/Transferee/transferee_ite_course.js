import { db } from '../firebase_config.js';
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
// Variables
let students = [];
let currentSort = { field: null, direction: 'asc' };
let selectedCourse = '';

        async function fetchCourseResults(searchTerm = '') {
            try {
                document.getElementById('loadingIndicator').style.display = 'block';
                document.getElementById('studentsTableBody').innerHTML = '';
                document.getElementById('totalStudentsCount').textContent = 'Loading...';

                // Get the selected course from URL parameters
                const urlParams = new URLSearchParams(window.location.search);
                selectedCourse = urlParams.get('course');

                if (!selectedCourse || !['BSEd-Sci', 'BEEd-G', 'BECEd', 'BTLEd-ICT', 'TCP'].includes(selectedCourse)) {
                    throw new Error('Invalid course selected');
                }

                document.getElementById('course-title').textContent = `${selectedCourse} Results`;
                document.title = `${selectedCourse} Results`;

                const resultsQuery = query(collection(db, 'transferee_examinees_result'), where('course', '==', selectedCourse));
                const resultsSnapshot = await getDocs(resultsQuery);
                students = resultsSnapshot.docs.map(doc => ({
                    fullName: doc.data().fullName,
                    course: doc.data().course
                }));

                // Filter students based on the search term
                if (searchTerm) {
                    students = students.filter(student =>
                        student.fullName.toLowerCase().includes(searchTerm.toLowerCase())
                    );
                }

                sortStudents(currentSort.field, currentSort.direction);
                renderStudentsTable();
            } catch (error) {
                console.error("Error fetching results:", error);
                document.getElementById('results-table-container').innerHTML = '<p class="text-center text-danger">Error loading results. Please try again later.</p>';
            } finally {
                document.getElementById('loadingIndicator').style.display = 'none';
            }
        }

        function renderStudentsTable() {
            const studentsTableBody = document.getElementById('studentsTableBody');
            studentsTableBody.innerHTML = '';

            students.forEach((student, index) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td data-label="Full Name">${student.fullName}</td>
                `;
                studentsTableBody.appendChild(row);
            });

            document.getElementById('totalStudentsCount').textContent = students.length;
        }

        // Search students
        document.getElementById('search-input').addEventListener('input', (event) => {
            fetchCourseResults(event.target.value);
        });

        // Sort students
        function sortStudents(field, direction) {
            students.sort((a, b) => {
                if (a[field] < b[field]) return direction === 'asc' ? -1 : 1;
                if (a[field] > b[field]) return direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        // Handle sorting
        document.querySelectorAll('th[data-sort]').forEach(th => {
            th.addEventListener('click', () => {
                const field = th.dataset.sort;
                if (currentSort.field === field) {
                    currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
                } else {
                    currentSort.field = field;
                    currentSort.direction = 'asc';
                }
                sortStudents(currentSort.field, currentSort.direction);
                renderStudentsTable();
                updateSortIcons();
            });
        });

        // Update sort icons
        function updateSortIcons() {
            document.querySelectorAll('th[data-sort] i.fas:not(.fa-user)').forEach(icon => {
                icon.className = 'fas fa-sort';
            });
            if (currentSort.field) {
                const th = document.querySelector(`th[data-sort="${currentSort.field}"]`);
                const icon = th.querySelector('i.fas:not(.fa-user)');
                icon.className = `fas fa-sort-${currentSort.direction === 'asc' ? 'up' : 'down'}`;
            }
        }

        // Display the alert
        document.getElementById('studentResultAlert').style.display = 'block';

        // Fetch and display course results when the page loads
fetchCourseResults();
