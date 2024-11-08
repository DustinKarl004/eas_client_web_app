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

    // Step 5: Assessment
    const assessmentStatus = await checkAssessmentStatus(userId, documentUploadStatus);
    const assessmentStep = createStepBox('5. Assessment', assessmentStatus);
    stepContainer.appendChild(assessmentStep);

    // Step 6: NSTP Confirmation
    const nstpStatus = await checkNSTPStatus(userEmail);
    const nstpStep = createStepBox('6. NSTP Confirmation', nstpStatus);
    stepContainer.appendChild(nstpStep);

    // Step 7: Enrollment
    const enrollmentStatus = await checkEnrollmentStatus(userId, nstpStatus);
    const enrollmentStep = createStepBox('7. Enrollment', enrollmentStatus);
    stepContainer.appendChild(enrollmentStep);

    // Step 8: Medical and Hardcopy Submission
    const medicalStatus = await checkMedicalStatus(userId, enrollmentStatus);
    const medicalStep = createStepBox('8. Medical and Hardcopy Submission', medicalStatus);
    stepContainer.appendChild(medicalStep);

    // Step 9: Temporary ID
    const temporaryIdStatus = medicalStatus.color === 'green' ? 
        { color: 'green', text: 'Temporary ID Generated', action: generateTemporaryId, newTab: false } :
        medicalStatus.color === 'yellow' ? 
        { color: 'yellow', text: 'Click here to view your temporary ID', action: generateTemporaryId, newTab: false } :
        { color: 'orange', text: 'Complete the previous step first' };
    const temporaryIdStep = createStepBox('9. Temporary ID', temporaryIdStatus);
    stepContainer.appendChild(temporaryIdStep);

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

    if (freshmenUploadDocSnap.exists() || transfereeUploadDocSnap.exists()) {
        return { color: 'green', text: 'Documents uploaded successfully' };
    } else {
        return { color: 'red', text: 'Documents not uploaded, Upload it on Mobile App.' };
    }
}

async function checkAssessmentStatus(userId, documentUploadStatus) {
    const freshmenAssessmentRef = doc(db, 'freshmen_assessment', userId);
    const transfereeAssessmentRef = doc(db, 'transferee_assessment', userId);
    const freshmenAssessmentSnap = await getDoc(freshmenAssessmentRef);
    const transfereeAssessmentSnap = await getDoc(transfereeAssessmentRef);

    if (freshmenAssessmentSnap.exists() || transfereeAssessmentSnap.exists()) {
        return { color: 'green', text: 'Assessment completed' };
    } else if (documentUploadStatus.color === 'green') {
        return { color: 'yellow', text: 'Documents uploaded, assessment pending' };
    } else {
        return { color: 'orange', text: 'Complete the previous step first' };
    }
}

async function checkNSTPStatus(userEmail) {
    const freshmenNstpRef = doc(db, 'freshmen_nstp_confirmation', userEmail);
    const transfereeNstpRef = doc(db, 'transferee_nstp_confirmation', userEmail);
    const freshmenNstpSnap = await getDoc(freshmenNstpRef);
    const transfereeNstpSnap = await getDoc(transfereeNstpRef);

    if (freshmenNstpSnap.exists()) {
        const data = freshmenNstpSnap.data();
        return { color: 'green', text: `NSTP Program (Freshmen): ${data.selected_nstp}` };
    } else if (transfereeNstpSnap.exists()) {
        const data = transfereeNstpSnap.data();
        return { color: 'green', text: `NSTP Program (Transferee): ${data.selected_nstp}` };
    } else {
        return { color: 'red', text: 'NSTP not confirmed, Confirm it on Mobile App, After the confirmation of assessment.' };
    }
}

async function checkEnrollmentStatus(userId, nstpStatus) {
    const freshmenEnrollmentRef = doc(db, 'freshmen_enrollment', userId);
    const transfereeEnrollmentRef = doc(db, 'transferee_enrollment', userId);
    const freshmenEnrollmentSnap = await getDoc(freshmenEnrollmentRef);
    const transfereeEnrollmentSnap = await getDoc(transfereeEnrollmentRef);

    if (freshmenEnrollmentSnap.exists() || transfereeEnrollmentSnap.exists()) {
        return { color: 'green', text: 'Enrollment completed' };
    } else if (nstpStatus.color === 'green') {
        return { color: 'yellow', text: 'NSTP confirmed, enrollment pending' };
    } else {
        return { color: 'orange', text: 'Complete the previous step first' };
    }
}

async function checkMedicalStatus(userId, enrollmentStatus) {
    const freshmenMedicalRef = doc(db, 'freshmen_medical_completion', userId);
    const transfereeMedicalRef = doc(db, 'transferee_medical_completion', userId);
    const freshmenMedicalSnap = await getDoc(freshmenMedicalRef);
    const transfereeMedicalSnap = await getDoc(transfereeMedicalRef);

    if (freshmenMedicalSnap.exists() || transfereeMedicalSnap.exists()) {
        return { color: 'green', text: 'Medical requirements completed' };
    } else if (enrollmentStatus.color === 'green') {
        return { color: 'yellow', text: 'Click here to access medical requirements.', action: 'https://drive.google.com/drive/folders/1fErkNTraFiQ56IYzRhcXPfiROgdCKfvq', newTab: true };
    } else {
        return { color: 'orange', text: 'Complete the previous step first' };
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

async function generateTemporaryId() {
    const user = auth.currentUser;
    if (!user) {
        console.error('User not authenticated');
        return;
    }

    try {
        const freshmenExamineesRef = doc(db, 'freshmen_examinees', user.uid);
        const transfereeExamineesRef = doc(db, 'transferee_examinees', user.uid);
        const freshmenExamineesSnap = await getDoc(freshmenExamineesRef);
        const transfereeExamineesSnap = await getDoc(transfereeExamineesRef);

        let entranceId, fullName, email, course;

        if (freshmenExamineesSnap.exists()) {
            const data = freshmenExamineesSnap.data();
            entranceId = data.entranceId;
            fullName = data.fullName;
            email = data.email;
            course = (await getDoc(doc(db, 'freshmen_examinees_result', user.uid))).data().course;
        } else if (transfereeExamineesSnap.exists()) {
            const data = transfereeExamineesSnap.data();
            entranceId = data.entranceId;
            fullName = data.fullName;
            email = data.email;
            course = (await getDoc(doc(db, 'transferee_examinees_result', user.uid))).data().course;
        } else {
            console.error('Examinee data not found');
            return;
        }

        const lastFourDigits = entranceId.slice(-4);
        const schoolStudentNumber = `25-0${lastFourDigits}`;

        // Store in Firebase
        await setDoc(doc(db, 'School_Student_Number', user.uid), {
            fullName: fullName,
            email: email,
            course: course,
            School_Student_Number: schoolStudentNumber
        });

        // Redirect to temporary ID page
        window.location.href = `temporary_id.html?id=${schoolStudentNumber}`;
    } catch (error) {
        console.error('Error generating temporary ID:', error);
    }
}