import { db, auth } from '../Javascript/firebase_config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            loadDashboard(user.uid, userData.email);
        } else {
            console.error('User document not found');
            window.location.href = 'login_portal.html';
        }
    } else {
        window.location.href = 'login_portal.html';
    }
});

// Wait for the DOM to be fully loaded before adding the event listener
document.addEventListener('DOMContentLoaded', () => {
    const confirmLogoutBtn = document.getElementById('confirmLogout');
    if (confirmLogoutBtn) {
        confirmLogoutBtn.addEventListener('click', () => {
            signOut(auth).then(() => {
                window.location.href = 'login_portal.html';
            }).catch((error) => {
                console.error('Logout Error:', error);
            });
        });
    } else {
        console.error('Confirm Logout button not found');
    }
});

async function loadDashboard(userId, userEmail) {
    const stepContainer = document.getElementById('stepContainer');
    stepContainer.innerHTML = ''; // Clear existing content

    // Step 1: Application Status
    const freshmenApprovedApplicantsRef = doc(db, 'freshmen_approved_applicants', userId);
    const transfereeApprovedApplicantsRef = doc(db, 'transferee_approved_applicants', userId);
    const freshmenApprovedApplicantsSnap = await getDoc(freshmenApprovedApplicantsRef);
    const transfereeApprovedApplicantsSnap = await getDoc(transfereeApprovedApplicantsRef);
    const isFreshmenApproved = freshmenApprovedApplicantsSnap.exists();
    const isTransfereeApproved = transfereeApprovedApplicantsSnap.exists();

    let applicationStatus = {};

    if (isFreshmenApproved) {
        const approvedData = freshmenApprovedApplicantsSnap.data();
        const fullName = approvedData.fullName;
        applicationStatus = {
            color: 'green',
            text: `Freshmen application approved. Name: ${fullName}`,
        };
    } else if (isTransfereeApproved) {
        const approvedData = transfereeApprovedApplicantsSnap.data();
        const fullName = approvedData.fullName;
        applicationStatus = {
            color: 'green',
            text: `Transferee application approved. Name: ${fullName}`,
        };
    } else {
        applicationStatus = {
            color: 'red',
            text: 'Application not submitted',
        };
    }

    const applicationStep = createStepBox('1. Application', applicationStatus);
    stepContainer.appendChild(applicationStep);

    // Step 2: Entrance Exam
    const examStatus = await checkEntranceExamStatus(userId);
    const examStep = createStepBox('2. Entrance Exam', examStatus);
    stepContainer.appendChild(examStep);

    // Step 3: Course
    const courseStatus = await checkCourseStatus(userId);
    const courseStep = createStepBox('3. Course', courseStatus);
    stepContainer.appendChild(courseStep);

    // Step 4: Required Document Upload
    const documentUploadStatus = await checkDocumentUploadStatus(userEmail);
    const documentUploadStep = createStepBox('4. Required Document Upload', documentUploadStatus);
    stepContainer.appendChild(documentUploadStep);

    // Hide loading screen and show content
    document.getElementById('loadingScreen').style.display = 'none';
    document.querySelector('.content').style.display = 'block';
}

async function checkEntranceExamStatus(userId) {
    const freshmenExamineesRef = doc(db, 'freshmen_examinees', userId);
    const freshmenResultsRef = doc(db, 'freshmen_examinees_result', userId);
    const transfereeExamineesRef = doc(db, 'transferee_examinees', userId);
    const transfereeResultsRef = doc(db, 'transferee_examinees_result', userId);
    
    const freshmenExamineesSnap = await getDoc(freshmenExamineesRef);
    const freshmenResultsSnap = await getDoc(freshmenResultsRef);
    const transfereeExamineesSnap = await getDoc(transfereeExamineesRef);
    const transfereeResultsSnap = await getDoc(transfereeResultsRef);

    if ((freshmenExamineesSnap.exists() && freshmenResultsSnap.exists()) || 
        (transfereeExamineesSnap.exists() && transfereeResultsSnap.exists())) {
        return { color: 'green', text: 'Entrance examination is finished' };
    } else if (freshmenExamineesSnap.exists() || transfereeExamineesSnap.exists()) {
        return { color: 'yellow', text: 'Exam scheduled, results pending' };
    } else {
        return { color: 'orange', text: 'Complete the previous step first' };
    }
}

async function checkCourseStatus(userId) {
    const freshmenResultsRef = doc(db, 'freshmen_examinees_result', userId);
    const transfereeResultsRef = doc(db, 'transferee_examinees_result', userId);
    const freshmenResultsSnap = await getDoc(freshmenResultsRef);
    const transfereeResultsSnap = await getDoc(transfereeResultsRef);

    if (freshmenResultsSnap.exists()) {
        const data = freshmenResultsSnap.data();
        return { color: 'green', text: `Your course (Freshmen): ${data.course}` };
    } else if (transfereeResultsSnap.exists()) {
        const data = transfereeResultsSnap.data();
        return { color: 'green', text: `Your course (Transferee): ${data.course}` };
    } else {
        return { color: 'orange', text: 'Complete the previous step first' };
    }
}

async function checkDocumentUploadStatus(userEmail) {
    const freshmenUploadDocRef = doc(db, 'freshmen_stepfour_upload_documents', userEmail);
    const transfereeUploadDocRef = doc(db, 'transferee_stepfour_upload_documents', userEmail);
    const freshmenUploadDocSnap = await getDoc(freshmenUploadDocRef);
    const transfereeUploadDocSnap = await getDoc(transfereeUploadDocRef);

    if (freshmenUploadDocSnap.exists()) {
        const data = freshmenUploadDocSnap.data();
        if (data.confirmed) {
            return { color: 'green', text: 'Documents uploaded and confirmed' };
        } else {
            return { color: 'yellow', text: 'Documents uploaded, pending confirmation' };
        }
    } else if (transfereeUploadDocSnap.exists()) {
        const data = transfereeUploadDocSnap.data();
        if (data.confirmed) {
            return { color: 'green', text: 'Documents uploaded and confirmed' };
        } else {
            return { color: 'yellow', text: 'Documents uploaded, pending confirmation' };
        }
    } else {
        return { color: 'red', text: 'Documents not uploaded, Upload it on Mobile App.' };
    }
}

function createStepBox(title, status) {
    const stepBox = document.createElement('div');
    stepBox.className = `step-box-wrapper`;
    stepBox.innerHTML = `
        <div class="step-box ${status.color}">
            <h3>${title}</h3>
            <i class="fas ${status.color === 'green' ? 'fa-check-circle text-success' : 
                            status.color === 'orange' ? 'fa-exclamation-circle text-warning' : 
                            status.color === 'red' ? 'fa-times-circle text-danger' :
                            'fa-spinner fa-spin text-warning'}"></i>
            ${status.text}
            ${status.action ? `<a href="#" class="step-link"><i class="fas fa-arrow-right arrow"></i></a>` : ''}
        </div>
    `;
    if (status.action) {
        stepBox.querySelector('.step-box').addEventListener('click', async (e) => {
            if (!e.target.closest('.step-link')) {
                if (typeof status.action === 'function') {
                    await status.action();
                } else if (status.newTab) {
                    window.open(status.action, '_blank', 'noopener,noreferrer');
                } else {
                    window.location.href = status.action;
                }
            }
        });
    }
    return stepBox;
}