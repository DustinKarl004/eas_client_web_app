import { db, auth } from '../firebase_config.js';
import { collection, getDocs, query, where, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

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

        const examineesQuery = query(collection(db, 'transferee_examinees'), where('batchNumber', '==', batchNo));
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
            <td data-label="QR Code">
                <button class="btn btn-sm btn-info" onclick="showQRCodeModal('${examinee.email}', '${examinee.fullName}', '${examinee.entranceId}')">
                    <i class="fas fa-qrcode me-2"></i>Show QR
                </button>
            </td>
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

// QR Code Modal
window.showQRCodeModal = function(email, fullName, entranceId) {
    const modal = new bootstrap.Modal(document.getElementById('qrCodeModal'));
    modal.show();

    document.getElementById('credentialForm').onsubmit = async function(e) {
        e.preventDefault();
        const enteredEmail = document.getElementById('email').value;
        const enteredPassword = document.getElementById('password').value;

        try {
            // Authenticate user
            await signInWithEmailAndPassword(auth, enteredEmail, enteredPassword);

            // Check if authenticated user's email matches the examinee's email
            if (enteredEmail === email) {
                // Generate QR code with URL
                const qrCodeUrl = `https://eas-client-web-app.vercel.app/client_transferee_qrcode.html?entranceId=${entranceId}`;
                const qr = qrcode(0, 'L');
                qr.addData(qrCodeUrl);
                qr.make();
                document.getElementById('qrCodeDisplay').innerHTML = qr.createImgTag(5);
                document.getElementById('qrCodeDisplay').style.display = 'block';
            } else {
                alert('Email does not match the examinee.');
            }
        } catch (error) {
            console.error('Authentication error:', error);
            alert('Authentication failed. Please check your credentials.');
        }
    };

    // Clear input fields when modal is closed
    document.getElementById('qrCodeModal').addEventListener('hidden.bs.modal', function () {
        document.getElementById('email').value = '';
        document.getElementById('password').value = '';
        document.getElementById('qrCodeDisplay').style.display = 'none';
        document.getElementById('qrCodeDisplay').innerHTML = '';
    });
};

// Fetch and display exam schedule when the page loads
fetchExamSchedule();
