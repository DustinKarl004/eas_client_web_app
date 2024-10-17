import { db } from '../firebase_config.js';
import {collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

async function fetchExamSchedule() {
    try {
        const examineesQuery = query(collection(db, 'freshmen_examinees'));
        const examineesSnapshot = await getDocs(examineesQuery);
        const examinees = examineesSnapshot.docs.map(doc => doc.data());
        
        const container = document.getElementById('examScheduleContainer');
        container.innerHTML = '';

        const batches = {};
        examinees.forEach(examinee => {
            if (!batches[examinee.batchNumber]) {
                batches[examinee.batchNumber] = examinee;
            }
        });

        if (Object.keys(batches).length > 0) {
            Object.entries(batches).forEach(([batchNumber, batchInfo]) => {
                const batchHtml = `
                    <div>
                        <h4>${batchNumber}${getOrdinalSuffix(batchNumber)} BATCH</h4>
                    </div>  
                    <div class="card mb-5">
                        <div class="card-header" style="background-color: #007200; color: white;">
                            <i class="fa-regular fa-calendar me-2"></i>
                            ${formatDate(batchInfo.examDate)}
                        </div>
                        <div class="card-body d-flex justify-content-between align-items-center" style="background-color: #fdc500; color: #000;">
                            <div>
                                <i class="fa-solid fa-clock"></i>
                                <span class="fw-bold">Time: ${formatTime(batchInfo.examStartTime)} - ${formatTime(batchInfo.examEndTime)}</span>
                            </div>
                            <a href="client_freshmen_cdm_Schedule.html?batch_no=${batchNumber}" class="btn" style="background-color: #212529; color: #fff;">View</a>
                        </div>
                    </div>
                `;
                container.innerHTML += batchHtml;
            });
        } else {
            container.innerHTML = '<p class="text-center">No exam schedules available.</p>';
        }

        // Hide loading spinner and show exam schedule
        document.getElementById('loadingSpinner').style.display = 'none';
        container.style.display = 'block';
    } catch (error) {
        console.error("Error fetching exam schedule:", error);
        // Hide loading spinner and show error message
        document.getElementById('loadingSpinner').style.display = 'none';
        document.getElementById('examScheduleContainer').innerHTML = '<div class="error-message"><p class="text-center text-danger">Error loading exam schedule. Please try again later.</p></div>';
        document.getElementById('examScheduleContainer').style.display = 'block';
    }
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

function getOrdinalSuffix(number) {
    const j = number % 10,
          k = number % 100;
    if (j == 1 && k != 11) {
        return "st";
    }
    if (j == 2 && k != 12) {
        return "nd";
    }
    if (j == 3 && k != 13) {
        return "rd";
    }
    return "th";
}

// Fetch and display exam schedule when the page loads
fetchExamSchedule();