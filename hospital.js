// Global variables
let map;
let markers = [];
let currentInfoWindow = null;
let hospitals = [
    {
        id: 1,
        name: "AIIMS Delhi",
        position: [28.5672, 77.2100],
        address: "Sri Aurobindo Marg, Ansari Nagar",
        phone: "011-26588500",
        category: "government",
        rating: 4.8,
        reviews: 2000,
        image: "https://images.unsplash.com/photo-1632833239869-a37e3a5806d2",
        facilities: ["24/7", "Emergency", "Multi-Specialty"],
        stats: {
            beds: "2000+",
            doctors: "500+"
        }
    },
    {
        id: 2,
        name: "Safdarjung Hospital",
        position: [28.5679, 77.2090],
        address: "Ansari Nagar West, New Delhi",
        phone: "011-26707444",
        category: "government",
        rating: 4.5,
        reviews: 1500,
        image: "https://images.unsplash.com/photo-1586773860418-d37222d8fce3",
        facilities: ["24/7", "Trauma Center", "Teaching Hospital"],
        stats: {
            beds: "1500+",
            doctors: "300+"
        }
    },
    {
        id: 3,
        name: "Indraprastha Apollo",
        position: [28.5421, 77.2831],
        address: "Sarita Vihar, Delhi",
        phone: "011-71791090",
        category: "private",
        rating: 4.7,
        reviews: 1800,
        image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d",
        facilities: ["International", "Multi-Specialty", "Emergency"],
        stats: {
            beds: "1000+",
            doctors: "400+"
        }
    }
];

// Initialize page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeHeader();
    initializeMap();
    initializeHospitals();
    initializeSearch();
    initializeAnimations();
    initializeEmergencyFeatures();
    
    // Initialize AOS
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 800,
            offset: 100,
            once: true
        });
    }
});

// Initialize Map
function initializeMap() {
    // Create map centered on Delhi
    map = L.map('map').setView([28.6139, 77.2090], 12);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Create marker cluster group
    const markers = L.markerClusterGroup();
    
    // Add markers for each hospital
    hospitals.forEach(hospital => {
        const marker = L.marker(hospital.position);
        
        // Create popup content
        const popupContent = createMapPopup(hospital);
        marker.bindPopup(popupContent);
        markers.addLayer(marker);
        
        // Add to nearby hospitals list
        addToNearbyList(hospital);
    });
    
    map.addLayer(markers);
    
    // Add location control
    if (L.control.locate) {
        L.control.locate({
            position: 'topright',
            strings: {
                title: "Show my location"
            }
        }).addTo(map);
    }

    // Remove loader once map is loaded
    map.on('load', () => {
        const loader = document.querySelector('.map-loader');
        if (loader) {
            loader.style.display = 'none';
        }
    });

    // Get user location and center map
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const { latitude, longitude } = position.coords;
            map.setView([latitude, longitude], 12);
            loadNearbyHospitals(latitude, longitude);
        });
    }
}

// Mobile navigation toggle
const navToggle = document.getElementById('navToggle');
const navLinks = document.querySelector('.nav-links');

navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('active');
});

// View toggle functionality
const viewBtns = document.querySelectorAll('.view-btn');
const hospitalGrid = document.querySelector('.hospital-grid');

viewBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        viewBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const view = btn.dataset.view;
        hospitalGrid.className = `hospital-grid ${view}-view`;
    });
});

// Filter functionality
const filterButtons = document.querySelectorAll('.filter-btn');
const hospitalCards = document.querySelectorAll('.hospital-card');

filterButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Remove active class from all buttons
        filterButtons.forEach(btn => btn.classList.remove('active'));
        // Add active class to clicked button
        button.classList.add('active');

        const filter = button.getAttribute('data-filter');

        hospitalCards.forEach(card => {
            // Add fade out animation
            card.style.opacity = '0';
            card.style.transform = 'scale(0.95)';
            
            setTimeout(() => {
                if (filter === 'all' || card.getAttribute('data-category') === filter) {
                    card.style.display = 'block';
                    // Add fade in animation
                    setTimeout(() => {
                        card.style.opacity = '1';
                        card.style.transform = 'scale(1)';
                    }, 50);
                } else {
                    card.style.display = 'none';
                }
            }, 300);
        });
    });
});

// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Add smooth scrolling and animations
document.addEventListener('DOMContentLoaded', () => {
    // Animate elements on scroll
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('show');
            }
        });
    }, {
        threshold: 0.1
    });

    document.querySelectorAll('.hospital-card').forEach((card) => {
        observer.observe(card);
    });
});

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
    // Mobile menu functionality
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    
    mobileMenuBtn?.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        mobileMenuBtn.classList.toggle('active');
    });

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                // Close mobile menu if open
                navLinks.classList.remove('active');
                mobileMenuBtn?.classList.remove('active');
            }
        });
    });

    // Search functionality
    const searchInput = document.querySelector('.search-box input');
    const filterSelect = document.querySelector('.filter-select');
    const hospitalCards = document.querySelectorAll('.hospital-card');

    function filterHospitals() {
        const searchTerm = searchInput.value.toLowerCase();
        const filterValue = filterSelect.value;

        hospitalCards.forEach(card => {
            const hospitalName = card.querySelector('h3').textContent.toLowerCase();
            const hospitalCategory = card.dataset.category;
            const matchesSearch = hospitalName.includes(searchTerm);
            const matchesFilter = filterValue === 'all' || hospitalCategory === filterValue;

            if (matchesSearch && matchesFilter) {
                card.style.display = 'block';
                setTimeout(() => {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, 50);
            } else {
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                setTimeout(() => {
                    card.style.display = 'none';
                }, 300);
            }
        });
    }

    searchInput?.addEventListener('input', filterHospitals);
    filterSelect?.addEventListener('change', filterHospitals);

    // Animate elements on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('show');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe elements for animation
    document.querySelectorAll('.stat-item, .emergency-card, .hospital-card').forEach(el => {
        el.classList.add('animate');
        observer.observe(el);
    });

    // Emergency call buttons
    document.querySelectorAll('.call-btn').forEach(button => {
        button.addEventListener('click', function() {
            const phoneNumber = this.closest('.emergency-card').querySelector('.phone').textContent;
            window.location.href = `tel:${phoneNumber}`;
        });
    });

    // Header scroll effect
    let lastScroll = 0;
    const header = document.querySelector('.header');

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;

        if (currentScroll <= 0) {
            header.classList.remove('scroll-up');
            return;
        }

        if (currentScroll > lastScroll && !header.classList.contains('scroll-down')) {
            // Scroll down
            header.classList.remove('scroll-up');
            header.classList.add('scroll-down');
        } else if (currentScroll < lastScroll && header.classList.contains('scroll-down')) {
            // Scroll up
            header.classList.remove('scroll-down');
            header.classList.add('scroll-up');
        }
        lastScroll = currentScroll;
    });

    // Add loading animation for images
    document.querySelectorAll('img').forEach(img => {
        img.addEventListener('load', function() {
            this.classList.add('loaded');
        });
    });

    // Initialize tooltips
    const tooltips = document.querySelectorAll('[data-tooltip]');
    tooltips.forEach(tooltip => {
        tooltip.addEventListener('mouseenter', e => {
            const tip = document.createElement('div');
            tip.className = 'tooltip';
            tip.textContent = e.target.dataset.tooltip;
            document.body.appendChild(tip);

            const rect = e.target.getBoundingClientRect();
            tip.style.top = rect.top - tip.offsetHeight - 10 + 'px';
            tip.style.left = rect.left + (rect.width - tip.offsetWidth) / 2 + 'px';
        });

        tooltip.addEventListener('mouseleave', () => {
            const tip = document.querySelector('.tooltip');
            if (tip) tip.remove();
        });
    });

    // Initialize map
    const map = L.map('map').setView([28.6139, 77.2090], 12); // Delhi coordinates

    // Add Jawg Maps layer with your token
    L.tileLayer('https://tile.jawg.io/jawg-streets/{z}/{x}/{y}.png?access-token=Xn4GSI16rO7MiokT3lpre5bsRURYikF87lGVQQB7GtYBpVU5xeDc5I4QqUahPUTb', {
        attribution: '<a href="https://www.jawg.io" target="_blank">&copy; Jawg</a> - <a href="https://www.openstreetmap.org" target="_blank">&copy; OpenStreetMap</a>',
        minZoom: 0,
        maxZoom: 22
    }).addTo(map);

    // Sample hospital data - Replace with your actual data
    const hospitals = [
        {
            name: "AIIMS Delhi",
            position: [28.5672, 77.2100],
            address: "Sri Aurobindo Marg, Ansari Nagar",
            phone: "011-26588500"
        },
        {
            name: "Safdarjung Hospital",
            position: [28.5679, 77.2090],
            address: "Ansari Nagar West",
            phone: "011-26707444"
        },
        // Add more hospitals here
    ];

    // Add markers for each hospital
    hospitals.forEach(hospital => {
        const marker = L.marker(hospital.position).addTo(map);
        
        // Custom popup content
        const popupContent = `
            <div class="map-popup">
                <h3>${hospital.name}</h3>
                <p><i class="fas fa-map-marker-alt"></i> ${hospital.address}</p>
                <p><i class="fas fa-phone"></i> ${hospital.phone}</p>
                <a href="#" class="btn" onclick="showHospitalDetails('${hospital.name}')">View Details</a>
            </div>
        `;
        
        marker.bindPopup(popupContent);
    });

    // Function to show hospital details
    window.showHospitalDetails = function(hospitalName) {
        // Add your logic to show hospital details
        console.log(`Showing details for ${hospitalName}`);
    };

    // Add geolocation
    map.addControl(new L.Control.Locate({
        position: 'topright',
        strings: {
            title: "Show my location"
        }
    }));

    // Add zoom controls
    map.zoomControl.setPosition('topright');
});

// Header Scroll Effect
function initializeHeader() {
    const header = document.querySelector('.header');
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    // Header scroll effect
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
    
    // Mobile menu toggle
    menuToggle?.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        menuToggle.classList.toggle('active');
    });
}

// Add hospital to nearby list
function addToNearbyList(hospital) {
    const hospitalList = document.querySelector('.hospital-list');
    const listItem = document.createElement('div');
    listItem.className = 'nearby-hospital-item';
    listItem.innerHTML = `
        <h4>${hospital.name}</h4>
        <p>${hospital.address}</p>
        <div class="distance">
            <i class="fas fa-location-arrow"></i>
            <span>Calculating...</span>
        </div>
    `;
    hospitalList.appendChild(listItem);
}

// Initialize Hospitals Grid
function initializeHospitals() {
    const hospitalsGrid = document.querySelector('.hospitals-grid');
    
    hospitals.forEach(hospital => {
        const card = createHospitalCard(hospital);
        hospitalsGrid.appendChild(card);
    });
    
    // View toggle functionality
    const viewBtns = document.querySelectorAll('.view-btn');
    viewBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            viewBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            hospitalsGrid.className = `hospitals-grid ${btn.dataset.view}-view`;
        });
    });
}

// Create Hospital Card
function createHospitalCard(hospital) {
    const card = document.createElement('div');
    card.className = 'hospital-card animate-fade-in';
    card.dataset.category = hospital.category;
    card.dataset.rating = hospital.rating;
    
    card.innerHTML = `
        <div class="card-image">
            <img src="${hospital.image}" alt="${hospital.name}">
            <div class="card-badge">Featured</div>
        </div>
        <div class="card-content">
            <div class="rating">
                <span class="stars">${"★".repeat(Math.floor(hospital.rating))}${hospital.rating % 1 >= 0.5 ? "½" : ""}</span>
                <span class="rating-count">${hospital.rating} (${hospital.reviews}+ reviews)</span>
            </div>
            <h3>${hospital.name}</h3>
            <p class="location"><i class="fas fa-map-marker-alt"></i> ${hospital.address}</p>
            <div class="hospital-details">
                ${hospital.facilities.map(facility => 
                    `<span class="badge"><i class="fas fa-check-circle"></i> ${facility}</span>`
                ).join('')}
            </div>
            <div class="hospital-stats">
                <div class="stat">
                    <i class="fas fa-bed"></i>
                    <span>${hospital.stats.beds}</span>
                </div>
                <div class="stat">
                    <i class="fas fa-user-md"></i>
                    <span>${hospital.stats.doctors}</span>
                </div>
            </div>
            <div class="card-actions">
                <button onclick="bookAppointment(${hospital.id})" class="btn primary">
                    <i class="fas fa-calendar-alt"></i> Book Appointment
                </button>
                <button onclick="showHospitalDetails(${hospital.id})" class="btn secondary">
                    <i class="fas fa-info-circle"></i> View Details
                </button>
            </div>
        </div>
    `;
    
    return card;
}

// Initialize Search and Filters
function initializeSearch() {
    const searchInput = document.getElementById('hospitalSearch');
    const categoryFilter = document.getElementById('categoryFilter');
    const ratingFilter = document.getElementById('ratingFilter');
    
    function filterHospitals() {
        const searchTerm = searchInput.value.toLowerCase();
        const category = categoryFilter.value;
        const minRating = parseFloat(ratingFilter.value) || 0;
        
        const cards = document.querySelectorAll('.hospital-card');
        
        cards.forEach(card => {
            const hospitalName = card.querySelector('h3').textContent.toLowerCase();
            const hospitalCategory = card.dataset.category;
            const hospitalRating = parseFloat(card.dataset.rating);
            
            const matchesSearch = hospitalName.includes(searchTerm);
            const matchesCategory = category === 'all' || hospitalCategory === category;
            const matchesRating = hospitalRating >= minRating;
            
            if (matchesSearch && matchesCategory && matchesRating) {
                card.style.display = 'block';
                setTimeout(() => {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, 50);
            } else {
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                setTimeout(() => {
                    card.style.display = 'none';
                }, 300);
            }
        });
    }
    
    searchInput?.addEventListener('input', filterHospitals);
    categoryFilter?.addEventListener('change', filterHospitals);
    ratingFilter?.addEventListener('change', filterHospitals);
}

// Initialize Animations
function initializeAnimations() {
    // Smooth scroll for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Emergency call buttons
    document.querySelectorAll('.call-btn').forEach(button => {
        button.addEventListener('click', function() {
            const number = this.dataset.number;
            if (confirm(`Are you sure you want to call ${number}?`)) {
                window.location.href = `tel:${number}`;
            }
        });
    });
}

// Book Appointment
function bookAppointment(hospitalId) {
    const hospital = hospitals.find(h => h.id === hospitalId);
    // Implement appointment booking logic
    console.log(`Booking appointment at ${hospital.name}`);
}

// Show Hospital Details
function showHospitalDetails(hospitalId) {
    const hospital = hospitals.find(h => h.id === hospitalId);
    // Implement hospital details view
    console.log(`Showing details for ${hospital.name}`);
}

// Calculate distances when geolocation is available
if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(position => {
        const userLocation = [position.coords.latitude, position.coords.longitude];
        
        hospitals.forEach(hospital => {
            const distance = calculateDistance(userLocation, hospital.position);
            updateDistance(hospital.id, distance);
        });
    });
}

// Calculate distance between two points
function calculateDistance(point1, point2) {
    const R = 6371; // Earth's radius in km
    const lat1 = point1[0] * Math.PI / 180;
    const lat2 = point2[0] * Math.PI / 180;
    const deltaLat = (point2[0] - point1[0]) * Math.PI / 180;
    const deltaLon = (point2[1] - point1[1]) * Math.PI / 180;
    
    const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(deltaLon/2) * Math.sin(deltaLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    return (R * c).toFixed(1);
}

// Update distance in nearby hospitals list
function updateDistance(hospitalId, distance) {
    const hospitalItems = document.querySelectorAll('.nearby-hospital-item');
    const item = Array.from(hospitalItems).find(item => 
        item.querySelector('h4').textContent === hospitals.find(h => h.id === hospitalId).name
    );
    
    if (item) {
        const distanceSpan = item.querySelector('.distance span');
        distanceSpan.textContent = `${distance} km away`;
    }
}

// Header Interactions
document.addEventListener('DOMContentLoaded', () => {
    // Header scroll effect
    const header = document.querySelector('.header');
    let lastScroll = 0;
    
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll <= 0) {
            header.classList.remove('scrolled');
            return;
        }
        
        if (currentScroll > lastScroll && !header.classList.contains('scroll-down')) {
            // Scrolling down
            header.classList.remove('scroll-up');
            header.classList.add('scroll-down');
            header.classList.add('scrolled');
        } else if (currentScroll < lastScroll && header.classList.contains('scroll-down')) {
            // Scrolling up
            header.classList.remove('scroll-down');
            header.classList.add('scroll-up');
        }
        
        lastScroll = currentScroll;
    });

    // Mobile menu toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    menuToggle?.addEventListener('click', () => {
        menuToggle.classList.toggle('active');
        navLinks.classList.toggle('active');
        document.body.classList.toggle('menu-open');
    });

    // Emergency Alert
    const emergencyAlert = document.querySelector('.emergency-alert');
    const closeAlert = document.querySelector('.emergency-alert-close');
    
    if (closeAlert) {
        closeAlert.addEventListener('click', () => {
            emergencyAlert.style.transform = 'translateY(-100%)';
            setTimeout(() => {
                emergencyAlert.remove();
            }, 300);
        });
    }

    // Active link highlighting
    const navLinksItems = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section[id]');
    
    function highlightNavLink() {
        const scrollY = window.pageYOffset;
        
        sections.forEach(section => {
            const sectionHeight = section.offsetHeight;
            const sectionTop = section.offsetTop - 100;
            const sectionId = section.getAttribute('id');
            
            if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                navLinksItems.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }
    
    window.addEventListener('scroll', highlightNavLink);

    // Smooth scroll for navigation
    navLinksItems.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            
            if (href.startsWith('#')) {
                e.preventDefault();
                const targetSection = document.querySelector(href);
                
                if (targetSection) {
                    const headerHeight = header.offsetHeight;
                    const targetPosition = targetSection.offsetTop - headerHeight;
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                    
                    // Close mobile menu if open
                    menuToggle.classList.remove('active');
                    navLinks.classList.remove('active');
                    document.body.classList.remove('menu-open');
                }
            }
        });
    });
});

// Emergency Features
function initializeEmergencyFeatures() {
    // Close modal when clicking outside
    const modal = document.getElementById('emergencyModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeEmergencyModal();
            }
        });
        
        // Close modal with escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                closeEmergencyModal();
            }
        });
    }
    
    // Add smooth animations for emergency cards
    const cards = document.querySelectorAll('.emergency-card');
    cards.forEach(card => {
        const icon = card.querySelector('.card-icon i');
        if (icon) {
            card.addEventListener('mouseenter', () => {
                icon.style.transform = 'scale(1.1)';
            });
            
            card.addEventListener('mouseleave', () => {
                icon.style.transform = 'scale(1)';
            });
        }
    });

    // Initialize emergency call buttons
    document.querySelectorAll('.call-btn').forEach(button => {
        button.addEventListener('click', async function(e) {
            e.preventDefault();
            const number = this.dataset.number;
            const card = this.closest('.emergency-card');
            
            try {
                await checkEmergencyService(number);
                
                if (confirm(`Are you sure you want to call ${number}?`)) {
                    window.location.href = `tel:${number}`;
                }
            } catch (error) {
                showErrorMessage(card, error.message);
            }
        });
    });
}

// Helper function to show error message
function showErrorMessage(card, message) {
    card.classList.add('error');
    const errorMessage = document.createElement('p');
    errorMessage.className = 'error-message';
    errorMessage.textContent = message;
    card.appendChild(errorMessage);
    
    setTimeout(() => {
        card.classList.remove('error');
        errorMessage.remove();
    }, 3000);
}

// Load nearby hospitals
async function loadNearbyHospitals(lat, lng) {
    try {
        // Simulated API call - replace with actual API
        const hospitals = await fetchHospitals(lat, lng);
        displayHospitals(hospitals);
        addMapMarkers(hospitals);
    } catch (error) {
        console.error('Error loading hospitals:', error);
    }
}

// Display hospitals in sidebar
function displayHospitals(hospitals) {
    const hospitalList = document.querySelector('.hospital-list');
    hospitalList.innerHTML = '';
    
    hospitals.forEach(hospital => {
        const card = createHospitalCard(hospital);
        hospitalList.appendChild(card);
    });
}

// Create hospital card
function createHospitalCard(hospital) {
    const template = document.getElementById('hospital-card-template');
    const card = template.content.cloneNode(true);
    
    // Set hospital data
    card.querySelector('.hospital-name').textContent = hospital.name;
    card.querySelector('.hospital-location span').textContent = hospital.address;
    card.querySelector('.card-image img').src = hospital.image;
    card.querySelector('.card-image img').alt = hospital.name;
    
    // Set rating
    const ratingStars = card.querySelector('.rating-stars');
    const rating = parseFloat(hospital.rating);
    for (let i = 1; i <= 5; i++) {
        const star = document.createElement('i');
        star.classList.add('fas', 'fa-star');
        if (i <= rating) {
            star.classList.add('filled');
        } else if (i - 0.5 <= rating) {
            star.classList.add('half');
        }
        ratingStars.appendChild(star);
    }
    
    card.querySelector('.rating-number').textContent = rating.toFixed(1);
    card.querySelector('.rating-count').textContent = `(${hospital.ratingCount} reviews)`;
    
    // Set stats
    card.querySelector('.stat-value').textContent = hospital.availableBeds;
    card.querySelectorAll('.stat-value')[1].textContent = hospital.doctorCount;
    
    // Add event listeners
    card.querySelector('.card-btn.primary').addEventListener('click', () => {
        bookAppointment(hospital);
    });
    
    card.querySelector('.card-btn.secondary').addEventListener('click', () => {
        viewHospitalDetails(hospital);
    });
    
    return card.firstElementChild;
}

// Add map markers
function addMapMarkers(hospitals) {
    // Clear existing markers
    markers.forEach(marker => marker.remove());
    markers = [];
    
    hospitals.forEach(hospital => {
        const marker = L.marker([hospital.lat, hospital.lng])
            .addTo(map);
            
        const popup = createMapPopup(hospital);
        marker.bindPopup(popup);
        
        marker.on('click', () => {
            if (currentInfoWindow) {
                currentInfoWindow.close();
            }
            currentInfoWindow = popup;
        });
        
        markers.push(marker);
    });
}

// Create map popup
function createMapPopup(hospital) {
    const template = document.getElementById('map-popup-template');
    const popup = template.content.cloneNode(true);
    
    popup.querySelector('h3 span').textContent = hospital.name;
    popup.querySelector('.map-popup-image img').src = hospital.image;
    popup.querySelector('.map-popup-image img').alt = hospital.name;
    popup.querySelector('.address').textContent = hospital.address;
    popup.querySelector('.phone').textContent = hospital.phone;
    popup.querySelector('.rating').textContent = `${hospital.rating} (${hospital.ratingCount} reviews)`;
    
    popup.querySelector('.map-popup-btn.primary').addEventListener('click', () => {
        bookAppointment(hospital);
    });
    
    popup.querySelector('.map-popup-btn.secondary').addEventListener('click', () => {
        viewHospitalDetails(hospital);
    });
    
    return popup;
}

// Filter and sort functionality
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelector('.filter-btn.active').classList.remove('active');
        btn.classList.add('active');
        filterHospitals(btn.textContent.toLowerCase());
    });
});

document.querySelector('.sort-select').addEventListener('change', (e) => {
    sortHospitals(e.target.value);
});

// Placeholder functions - implement these based on your requirements
function fetchHospitals(lat, lng) {
    // Replace with actual API call
    return Promise.resolve([
        {
            name: 'City General Hospital',
            address: '123 Healthcare Ave',
            image: 'path/to/hospital1.jpg',
            rating: 4.5,
            ratingCount: 128,
            availableBeds: 45,
            doctorCount: 75,
            lat: lat + 0.01,
            lng: lng + 0.01,
            phone: '+1 234-567-8900'
        },
        // Add more sample data
    ]);
}

function bookAppointment(hospital) {
    // Implement booking functionality
    console.log('Booking appointment at:', hospital.name);
}

function viewHospitalDetails(hospital) {
    // Implement details view
    console.log('Viewing details for:', hospital.name);
}

function filterHospitals(filter) {
    // Implement filtering logic
    console.log('Filtering by:', filter);
}

function sortHospitals(sortBy) {
    // Implement sorting logic
    console.log('Sorting by:', sortBy);
}

function closeEmergencyModal() {
    const modal = document.getElementById('emergencyModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

function callEmergency(number) {
    if (confirm(`Are you sure you want to call ${number}?`)) {
        window.location.href = `tel:${number}`;
    }
}

function findNearbyHospitals(lat, lng) {
    const nearbyList = document.querySelector('.nearby-list');
    nearbyList.innerHTML = '<div class="loading-spinner"></div>';
    
    // Simulate API call - replace with actual API
    setTimeout(() => {
        const nearbyHospitals = hospitals
            .map(hospital => {
                const distance = calculateDistance([lat, lng], hospital.position);
                return { ...hospital, distance };
            })
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 3);
        
        displayNearbyHospitals(nearbyHospitals);
    }, 1000);
}

function displayNearbyHospitals(hospitals) {
    const nearbyList = document.querySelector('.nearby-list');
    nearbyList.innerHTML = '';
    
    hospitals.forEach(hospital => {
        const item = document.createElement('div');
        item.className = 'nearby-item';
        item.innerHTML = `
            <div class="nearby-info">
                <h5>${hospital.name}</h5>
                <p><i class="fas fa-map-marker-alt"></i> ${hospital.distance.toFixed(1)} km away</p>
                <p><i class="fas fa-phone"></i> ${hospital.phone}</p>
            </div>
            <button onclick="callEmergency('${hospital.phone.replace(/[^0-9]/g, '')}')">
                <i class="fas fa-phone"></i>
            </button>
        `;
        nearbyList.appendChild(item);
    });
}

// Simulate emergency service check
function checkEmergencyService(number) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (Math.random() > 0.1) { // 90% success rate
                resolve();
            } else {
                reject(new Error('Service temporarily unavailable. Please try again.'));
            }
        }, 500);
    });
} 