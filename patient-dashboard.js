// Check if user is logged in
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const user = JSON.parse(sessionStorage.getItem('user'));
    if (!user || user.role !== 'patient') {
        window.location.replace('./login.html');
        return;
    }

    // Display user name and set greeting
    document.getElementById('userDisplay').textContent = user.name;
    setGreeting();
    
    // Initialize the dashboard
    loadDashboardData();
    
    // Add animation delays to elements
    document.querySelectorAll('[data-animate-delay]').forEach(element => {
        const delay = parseInt(element.getAttribute('data-animate-delay'));
        element.style.animationDelay = `${delay}ms`;
    });

    // Initialize appointment booking modal
    initializeAppointmentModal();

    // Add event listener for appointment form submission
    const appointmentForm = document.getElementById('appointmentForm');
    if (appointmentForm) {
        appointmentForm.addEventListener('submit', function(event) {
            event.preventDefault();
            bookAppointment();
        });
    }

    // Set up real-time dashboard updates
    setupDashboardUpdates();
});

function setGreeting() {
    const hour = new Date().getHours();
    const greetingText = document.getElementById('greetingText');
    
    if (hour < 12) {
        greetingText.textContent = 'Good Morning!';
    } else if (hour < 18) {
        greetingText.textContent = 'Good Afternoon!';
    } else {
        greetingText.textContent = 'Good Evening!';
    }
}

function loadDashboardData() {
    loadAppointments();
    loadDoctors();
    updateStatistics();
    updateHealthProgress();
    checkUpcomingAppointments();
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function formatTime(timeStr) {
    return new Date('2000-01-01 ' + timeStr).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function loadAppointments() {
    const appointments = JSON.parse(localStorage.getItem('appointments')) || [];
    const user = JSON.parse(sessionStorage.getItem('user'));
    
    // Filter appointments for this patient
    const userAppointments = appointments.filter(apt => 
        apt.patientId === user.id
    ).sort((a, b) => new Date(a.date + ' ' + a.time) - new Date(b.date + ' ' + b.time));

    const container = document.getElementById('appointmentsContainer');
    if (!container) return;

    if (userAppointments.length === 0) {
        container.innerHTML = `
            <div class="text-center py-4">
                <i class="bi bi-calendar-x text-muted" style="font-size: 3rem;"></i>
                <p class="mt-3">No upcoming appointments</p>
                <button class="btn btn-custom" onclick="showBookAppointmentModal()">
                    Book Your First Appointment
                </button>
            </div>
        `;
    } else {
        // Group appointments by date
        const appointmentsByDate = {};
        userAppointments.forEach(apt => {
            if (!appointmentsByDate[apt.date]) {
                appointmentsByDate[apt.date] = [];
            }
            appointmentsByDate[apt.date].push(apt);
        });

        // Sort dates
        const sortedDates = Object.keys(appointmentsByDate).sort((a, b) => new Date(a) - new Date(b));

        // Generate HTML for each date group
        let html = '';
        sortedDates.forEach(date => {
            const aptsForDate = appointmentsByDate[date];
            html += `
                <div class="date-group mb-3">
                    <h6 class="date-header">${formatDate(date)}</h6>
                    ${aptsForDate.map(apt => `
                        <div class="card mb-3 appointment-card ${apt.status.toLowerCase()}">
                            <div class="card-body">
                                <div class="row align-items-center">
                                    <div class="col-md-2">
                                        <div class="text-center">
                                            <h5 class="mb-0">${formatTime(apt.time)}</h5>
                                            <small class="text-muted">${apt.testType}</small>
                                        </div>
                                    </div>
                                    <div class="col-md-3">
                                        <h6 class="mb-0">${apt.doctor}</h6>
                                        <small class="text-muted">${getDepartmentForDoctor(apt.doctor)}</small>
                                    </div>
                                    <div class="col-md-3">
                                        <span class="badge ${getStatusBadgeClass(apt.status)}">
                                            ${apt.status}
                                        </span>
                                    </div>
                                    <div class="col-md-4 text-end">
                                        ${apt.status === 'Pending' ? `
                                            <button class="btn btn-sm btn-outline-danger me-2" onclick="cancelAppointment(event, '${apt.id}')">
                                                Cancel
                                            </button>
                                            <button class="btn btn-sm btn-outline-primary" onclick="rescheduleAppointment(event, '${apt.id}')">
                                                Reschedule
                                            </button>
                                        ` : `
                                            <button class="btn btn-sm btn-primary" onclick="viewAppointmentDetails('${apt.id}')">
                                                View Details
                                            </button>
                                        `}
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        });

        container.innerHTML = html;
    }
}

function getStatusBadgeClass(status) {
    switch(status) {
        case 'Confirmed': return 'bg-success';
        case 'Pending': return 'bg-warning';
        case 'Cancelled': return 'bg-danger';
        case 'Completed': return 'bg-info';
        default: return 'bg-secondary';
    }
}

function getDepartmentForDoctor(doctorName) {
    const doctors = window.healthTechUsers?.doctors || [];
    const doctor = doctors.find(d => d.name === doctorName);
    return doctor ? doctor.department : 'General';
}

function loadDoctors() {
    const doctors = window.healthTechUsers?.doctors || [];
    const container = document.getElementById('doctorsContainer');
    if (!container) return;

    container.innerHTML = doctors.map(doctor => `
        <div class="col-md-4 mb-4">
            <div class="card doctor-card" onclick="showBookAppointmentModal('${doctor.specialization}')">
                <div class="card-body">
                    <span class="doctor-specialization">${doctor.specialization}</span>
                    <h5 class="card-title mb-1">${doctor.name}</h5>
                    <p class="text-muted mb-2">${doctor.department}</p>
                    <p class="small mb-0">${doctor.description}</p>
                </div>
            </div>
        </div>
    `).join('');
}

function updateStatistics() {
    const appointments = JSON.parse(localStorage.getItem('appointments')) || [];
    const reports = JSON.parse(localStorage.getItem('reports')) || [];
    const user = JSON.parse(sessionStorage.getItem('user'));

    // Update appointments count
    const userAppointments = appointments.filter(apt => apt.patientId === user.id);
    document.getElementById('totalAppointments').textContent = userAppointments.length;

    // Update reports count
    const userReports = reports.filter(report => report.patientId === user.id);
    document.getElementById('totalReports').textContent = userReports.length;

    // Animate numbers
    animateNumbers();
}

function updateHealthProgress() {
    const appointments = JSON.parse(localStorage.getItem('appointments')) || [];
    const reports = JSON.parse(localStorage.getItem('reports')) || [];
    const user = JSON.parse(sessionStorage.getItem('user'));

    // Calculate appointment progress
    const userAppointments = appointments.filter(apt => apt.patientId === user.id);
    const completedAppointments = userAppointments.filter(apt => apt.status === 'Confirmed' || apt.status === 'Completed');
    const appointmentProgress = userAppointments.length ? 
        Math.round((completedAppointments.length / userAppointments.length) * 100) : 0;

    // Calculate reports progress
    const userReports = reports.filter(report => report.patientId === user.id);
    const completedReports = userReports.filter(report => report.status === 'Completed');
    const reportsProgress = userReports.length ? 
        Math.round((completedReports.length / userReports.length) * 100) : 0;

    // Update progress bars with animation
    const appointmentsBar = document.querySelector('.progress-bar-custom');
    const reportsBar = document.querySelectorAll('.progress-bar-custom')[1];
    
    setTimeout(() => {
        if (appointmentsBar) {
            appointmentsBar.style.width = `${appointmentProgress}%`;
            document.getElementById('appointmentsProgress').textContent = `${appointmentProgress}%`;
        }
        if (reportsBar) {
            reportsBar.style.width = `${reportsProgress}%`;
            document.getElementById('reportsProgress').textContent = `${reportsProgress}%`;
        }
    }, 500);
}

function animateNumbers() {
    document.querySelectorAll('.stats-number').forEach(element => {
        const target = parseInt(element.textContent);
        let current = 0;
        const increment = target / 30; // Animate over 30 steps
        const interval = setInterval(() => {
            current += increment;
            if (current >= target) {
                element.textContent = target;
                clearInterval(interval);
            } else {
                element.textContent = Math.round(current);
            }
        }, 50);
    });
}

function initializeAppointmentModal() {
    // Populate time slots
    const timeSelect = document.getElementById('appointmentTime');
    if (!timeSelect) return;

    // Clear existing options except the first one
    while (timeSelect.options.length > 1) {
        timeSelect.remove(1);
    }

    const startHour = 9; // 9 AM
    const endHour = 17; // 5 PM
    
    for (let hour = startHour; hour <= endHour; hour++) {
        for (let minute of ['00', '30']) {
            const time = `${hour.toString().padStart(2, '0')}:${minute}`;
            const option = document.createElement('option');
            option.value = time;
            option.textContent = new Date(`2000-01-01 ${time}`).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            });
            timeSelect.appendChild(option);
        }
    }

    // Set minimum date to today
    const dateInput = document.getElementById('appointmentDate');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.min = today;
        dateInput.value = today;
    }

    // Pre-select test type if provided
    const testTypeSelect = document.getElementById('testType');
    if (testTypeSelect && window.preSelectedTestType) {
        testTypeSelect.value = window.preSelectedTestType;
        window.preSelectedTestType = null;
    }
}

function handleFeatureCardClick(feature) {
    switch(feature) {
        case 'appointments':
            showBookAppointmentModal();
            break;
        case 'reports':
            window.location.href = 'patient-reports.html';
            break;
        case 'emergency':
            showEmergencyContact();
            break;
    }
}

function showEmergencyContact() {
    const emergencyInfo = `
        Emergency Contacts:
        - Emergency Hotline: 911
        - Hospital Reception: 1-800-HEALTH
        - Ambulance Service: 1-800-AMBULANCE
        
        Available 24/7 for immediate assistance.
    `;
    alert(emergencyInfo);
}

function showBookAppointmentModal(testType) {
    if (testType) {
        window.preSelectedTestType = testType;
    }
    
    // Reset form
    const form = document.getElementById('appointmentForm');
    if (form) form.reset();
    
    // Initialize modal with fresh data
    initializeAppointmentModal();
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('bookAppointmentModal'));
    modal.show();
}

function cancelAppointment(event, appointmentId) {
    event.preventDefault();
    if (confirm('Are you sure you want to cancel this appointment?')) {
        const appointments = JSON.parse(localStorage.getItem('appointments')) || [];
        const appointmentIndex = appointments.findIndex(apt => apt.id === appointmentId);
        
        if (appointmentIndex !== -1) {
            appointments[appointmentIndex].status = 'Cancelled';
            localStorage.setItem('appointments', JSON.stringify(appointments));
            
            // Refresh the dashboard
            loadDashboardData();
            
            // Show success message
            showToast('Appointment Cancelled', 'Your appointment has been cancelled successfully.');
        }
    }
}

function rescheduleAppointment(event, appointmentId) {
    event.preventDefault();
    const appointments = JSON.parse(localStorage.getItem('appointments')) || [];
    const appointment = appointments.find(apt => apt.id === appointmentId);
    
    if (appointment) {
        // Pre-fill the booking modal with current appointment details
        document.getElementById('testType').value = appointment.testType || '';
        document.getElementById('appointmentDate').value = appointment.date || '';
        document.getElementById('appointmentTime').value = appointment.time || '';
        document.getElementById('appointmentNotes').value = appointment.notes || '';
        
        // Store the appointment ID for rescheduling
        window.reschedulingAppointmentId = appointmentId;
        
        // Show the booking modal
        showBookAppointmentModal();
    }
}

function bookAppointment() {
    const testType = document.getElementById('testType').value;
    const date = document.getElementById('appointmentDate').value;
    const time = document.getElementById('appointmentTime').value;
    const notes = document.getElementById('appointmentNotes').value;
    
    if (!testType || !date || !time) {
        alert('Please fill in all required fields');
        return;
    }

    const user = JSON.parse(sessionStorage.getItem('user'));
    const doctor = getDoctorForTestType(testType);

    // Check if we're rescheduling
    if (window.reschedulingAppointmentId) {
        const appointments = JSON.parse(localStorage.getItem('appointments')) || [];
        const appointmentIndex = appointments.findIndex(apt => apt.id === window.reschedulingAppointmentId);
        
        if (appointmentIndex !== -1) {
            // Update the existing appointment
            appointments[appointmentIndex].testType = testType;
            appointments[appointmentIndex].date = date;
            appointments[appointmentIndex].time = time;
            appointments[appointmentIndex].notes = notes;
            appointments[appointmentIndex].doctor = doctor.name;
            appointments[appointmentIndex].doctorId = doctor.id;
            appointments[appointmentIndex].updatedAt = new Date().toISOString();
            
            localStorage.setItem('appointments', JSON.stringify(appointments));
            
            // Clear the rescheduling ID
            window.reschedulingAppointmentId = null;
            
            // Close modal and reload appointments
            const modal = bootstrap.Modal.getInstance(document.getElementById('bookAppointmentModal'));
            modal.hide();
            
            // Refresh the dashboard
            loadDashboardData();
            
            // Show success message
            showToast('Appointment Rescheduled', 'Your appointment has been rescheduled successfully.');
            return;
        }
    }

    // Create a new appointment
    const appointment = {
        id: 'APT' + Date.now(),
        patientId: user.id,
        patientName: user.name,
        doctor: doctor.name,
        doctorId: doctor.id,
        testType: testType,
        date: date,
        time: time,
        notes: notes,
        status: 'Pending',
        createdAt: new Date().toISOString()
    };

    const appointments = JSON.parse(localStorage.getItem('appointments')) || [];
    appointments.push(appointment);
    localStorage.setItem('appointments', JSON.stringify(appointments));

    // Close modal and reload appointments
    const modal = bootstrap.Modal.getInstance(document.getElementById('bookAppointmentModal'));
    modal.hide();
    
    // Refresh the dashboard
    loadDashboardData();
    
    // Show success message
    showToast('Appointment Booked', 'Your appointment has been booked successfully!');
}

function getDoctorForTestType(testType) {
    const doctors = window.healthTechUsers?.doctors || [];
    const doctor = doctors.find(d => d.specialization === testType);
    
    if (doctor) {
        return { id: doctor.id, name: doctor.name };
    }
    
    // Default doctor if no match found
    return { id: 'D001', name: 'Dr. Priya Sharma' };
}

function viewAppointmentDetails(appointmentId) {
    const appointments = JSON.parse(localStorage.getItem('appointments')) || [];
    const appointment = appointments.find(apt => apt.id === appointmentId);
    
    if (appointment) {
        // Create a modal to display appointment details
        const modalHTML = `
            <div class="modal fade" id="appointmentDetailsModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Appointment Details</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="appointment-details">
                                <div class="row mb-3">
                                    <div class="col-5 text-muted">Test Type:</div>
                                    <div class="col-7">${appointment.testType}</div>
                                </div>
                                <div class="row mb-3">
                                    <div class="col-5 text-muted">Doctor:</div>
                                    <div class="col-7">${appointment.doctor}</div>
                                </div>
                                <div class="row mb-3">
                                    <div class="col-5 text-muted">Date:</div>
                                    <div class="col-7">${formatDate(appointment.date)}</div>
                                </div>
                                <div class="row mb-3">
                                    <div class="col-5 text-muted">Time:</div>
                                    <div class="col-7">${formatTime(appointment.time)}</div>
                                </div>
                                <div class="row mb-3">
                                    <div class="col-5 text-muted">Status:</div>
                                    <div class="col-7">
                                        <span class="badge ${getStatusBadgeClass(appointment.status)}">
                                            ${appointment.status}
                                        </span>
                                    </div>
                                </div>
                                ${appointment.notes ? `
                                <div class="row mb-3">
                                    <div class="col-5 text-muted">Notes:</div>
                                    <div class="col-7">${appointment.notes}</div>
                                </div>
                                ` : ''}
                                <div class="row mb-3">
                                    <div class="col-5 text-muted">Booked On:</div>
                                    <div class="col-7">${new Date(appointment.createdAt).toLocaleString()}</div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                            ${appointment.status === 'Confirmed' ? `
                                <button type="button" class="btn btn-primary" onclick="prepareForAppointment('${appointment.id}')">
                                    Prepare for Appointment
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Remove any existing modal
        const existingModal = document.getElementById('appointmentDetailsModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Add the modal to the DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Show the modal
        const modal = new bootstrap.Modal(document.getElementById('appointmentDetailsModal'));
        modal.show();
    }
}

function prepareForAppointment(appointmentId) {
    const appointments = JSON.parse(localStorage.getItem('appointments')) || [];
    const appointment = appointments.find(apt => apt.id === appointmentId);
    
    if (appointment) {
        const preparationInfo = `
            Preparation for ${appointment.testType}:
            
            1. Please arrive 15 minutes before your scheduled time.
            2. Bring your ID and insurance card.
            3. Wear comfortable clothing.
            4. Follow any specific instructions for your test type.
            5. Stay hydrated but avoid heavy meals before the appointment.
            
            If you need to reschedule, please do so at least 24 hours in advance.
        `;
        alert(preparationInfo);
    }
}

// Logout function
function logout() {
    sessionStorage.removeItem('user');
    window.location.replace('./login.html');
}

// Function to show toast notifications
function showToast(title, message) {
    // Remove any existing toasts
    const existingToasts = document.querySelectorAll('.toast-container');
    existingToasts.forEach(toast => toast.remove());
    
    const toastHTML = `
        <div class="toast-container position-fixed bottom-0 end-0 p-3" style="z-index: 11">
            <div class="toast show" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="toast-header">
                    <strong class="me-auto">${title}</strong>
                    <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
                <div class="toast-body">
                    ${message}
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', toastHTML);
    
    // Auto-hide the toast after 5 seconds
    setTimeout(() => {
        const toastElement = document.querySelector('.toast');
        if (toastElement) {
            const toast = bootstrap.Toast.getInstance(toastElement);
            if (toast) toast.hide();
        }
    }, 5000);
}

// Check for upcoming appointments and show notifications
function checkUpcomingAppointments() {
    const appointments = JSON.parse(localStorage.getItem('appointments')) || [];
    const user = JSON.parse(sessionStorage.getItem('user'));
    
    // Filter appointments for this patient
    const userAppointments = appointments.filter(apt => 
        apt.patientId === user.id && 
        apt.status === 'Confirmed'
    );
    
    // Check for appointments today or tomorrow
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayStr = today.toISOString().split('T')[0];
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    const upcomingAppointments = userAppointments.filter(apt => 
        apt.date === todayStr || apt.date === tomorrowStr
    );
    
    if (upcomingAppointments.length > 0) {
        upcomingAppointments.forEach(apt => {
            const isToday = apt.date === todayStr;
            const message = isToday ? 
                `You have an appointment today at ${formatTime(apt.time)} with ${apt.doctor}` :
                `You have an appointment tomorrow at ${formatTime(apt.time)} with ${apt.doctor}`;
            
            showToast('Upcoming Appointment', message);
        });
    }
}

// Set up real-time dashboard updates
function setupDashboardUpdates() {
    // Check for updates every minute
    setInterval(() => {
        loadDashboardData();
    }, 60000); // 60000 ms = 1 minute
}

// Function to view all appointments
function viewAllAppointments() {
    window.location.href = 'patient-appointments-new.html';
}

// Function to view all reports
function viewAllReports() {
    window.location.href = 'patient-reports.html';
}
