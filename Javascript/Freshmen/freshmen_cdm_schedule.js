import { db } from '../firebase_config.js';
import {collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Variables
let examinees = [];
let currentSort = { field: null, direction: 'asc' };

async function fetchExamSchedule(searchTerm = '') {
    try {
        document.getElementById('loadingIndicator').style.display = 'block';
        document.getElementById('examineesTableBody').innerHTML = '';
        document.getElementById('totalExamineesCount').textContent = 'Loading...';

        const urlParams = new URLSearchParams(window.location.search);
        const batchNo = urlParams.get('batch_no');

        if (!batchNo) {
            throw new Error('Batch number not provided');
        }

        const examineesQuery = query(collection(db, 'freshmen_examinees'), where('batchNumber', '==', batchNo));
        const examineesSnapshot = await getDocs(examineesQuery);
        examinees = examineesSnapshot.docs.map(doc => doc.data());

        // Filter examinees based on the search term
        if (searchTerm) {
            examinees = examinees.filter(examinee =>
                examinee.fullName.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        sortExaminees(currentSort.field, currentSort.direction);
        renderExamineesTable();
    } catch (error) {
        console.error("Error fetching exam schedule:", error);
        document.getElementById('schedule-table-container').innerHTML = '<p class="text-center text-danger">Error loading exam schedule. Please try again later.</p>';
    } finally {
        document.getElementById('loadingIndicator').style.display = 'none';
    }
}

function renderExamineesTable() {
    const examineesTableBody = document.getElementById('examineesTableBody');
    examineesTableBody.innerHTML = '';

    examinees.forEach(examinee => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td data-label="Full Name">${examinee.fullName}</td>
            <td data-label="Date">${formatDate(examinee.examDate)}</td>
            <td data-label="Time">${formatTime(examinee.examStartTime)} - ${formatTime(examinee.examEndTime)}</td>
            <td data-label="Room">${examinee.room}</td>
        `;
        examineesTableBody.appendChild(row);
    });

    document.getElementById('totalExamineesCount').textContent = examinees.length;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function formatTime(timeString) {
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours));
    date.setMinutes(parseInt(minutes));
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

// Search examinees
document.getElementById('search-input').addEventListener('input', (event) => {
    fetchExamSchedule(event.target.value);
});

// Sort examinees
function sortExaminees(field, direction) {
    examinees.sort((a, b) => {
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
        sortExaminees(currentSort.field, currentSort.direction);
        renderExamineesTable();
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

// Fetch and display exam schedule when the page loads
fetchExamSchedule();
