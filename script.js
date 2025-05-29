
        let selectedSlot = '';
        let parcelData = {};

        // Tab switching functionality
        function switchTab(tabName) {
            // Hide all sections
            document.querySelectorAll('.booking-section, .tracking-section, .staff-section').forEach(section => {
                section.classList.remove('active');
            });
            
            // Remove active class from all tabs
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Show selected section and activate tab
            document.getElementById(tabName).classList.add('active');
            event.target.classList.add('active');
        }

        // Slot selection functionality
        function selectSlot(element, slot) {
            // Remove selection from all slots
            document.querySelectorAll('.slot-card').forEach(card => {
                card.classList.remove('selected');
            });
            
            // Select current slot
            element.classList.add('selected');
            selectedSlot = slot;
        }

        // Form submission
        
    selectedSlot = ''; // Declare globally if not already

    function selectSlot(element, slot) {
        // Deselect all cards
        document.querySelectorAll('.slot-card').forEach(card => card.classList.remove('selected'));
        // Select the clicked one
        element.classList.add('selected');
        selectedSlot = slot;
    }

    document.getElementById('bookingForm').addEventListener('submit', function(e) {
        e.preventDefault();

        if (!selectedSlot) {
            showNotification('Please select a delivery slot', 'error');
            return;
        }

        const formData = new FormData(this);
        const parcelData = {
            senderName: formData.get('senderName'),
            senderAddress: formData.get('senderAddress'),
            recipientName: formData.get('recipientName'),
            recipientAddress: formData.get('recipientAddress'),
            recipientPhone: formData.get('recipientPhone'),
            parcelWeight: parseFloat(formData.get('parcelWeight')),
            selectedSlot: selectedSlot
        };

        fetch('http://localhost:3000/api/book', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(parcelData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showConfetti(); // Optional animation
                showNotification(`Parcel booked successfully! Tracking ID: ${data.trackingId}`, 'success');

                // Reset form
                document.getElementById('bookingForm').reset();
                document.querySelectorAll('.slot-card').forEach(card => card.classList.remove('selected'));
                selectedSlot = '';
            } else {
                showNotification(data.message || 'Booking failed', 'error');
            }
        })
        .catch(error => {
            console.error('Booking error:', error);
            showNotification('Booking failed. Try again later.', 'error');
        });
    });

    function showNotification(message, type) {
        alert(`[${type.toUpperCase()}] ${message}`); // Replace with custom UI if needed
    }

    function showConfetti() {
        // Optional: add confetti animation if you have one
        console.log("🎉 Confetti!");
    }

        // Tracking functionality
        function trackParcel() {
            const trackingId = document.getElementById('trackingId').value.trim();
            
            if (!trackingId) {
                showNotification('Please enter a tracking ID', 'error');
                return;
            }
            
            // Simulate API call
            setTimeout(() => {
                document.getElementById('trackingResult').style.display = 'block';
                showNotification('Parcel found! Tracking information updated.', 'success');
            }, 500);
        }

        // Notification system
        function showNotification(message, type = 'success') {
            const notification = document.createElement('div');
            notification.className = 'notification';
            notification.style.background = type === 'error' ? 
                'linear-gradient(135deg, #ef4444, #dc2626)' : 
                'linear-gradient(135deg, #10b981, #059669)';
            notification.textContent = message;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.remove();
            }, 4000);
        }

        // Confetti animation
        function showConfetti() {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            
            for (let i = 0; i < 50; i++) {
                const piece = document.createElement('div');
                piece.className = 'confetti-piece';
                piece.style.left = Math.random() * 100 + '%';
                piece.style.backgroundColor = ['#2563eb', '#f97316', '#10b981', '#eab308'][Math.floor(Math.random() * 4)];
                piece.style.animationDelay = Math.random() * 2 + 's';
                confetti.appendChild(piece);
            }
            
            document.body.appendChild(confetti);
            
            setTimeout(() => {
                confetti.remove();
            }, 3000);
        }

        // Real-time updates simulation
        setInterval(() => {
            const statusElements = document.querySelectorAll('.status-badge');
            statusElements.forEach(element => {
                if (Math.random() > 0.95) {
                    if (element.textContent === 'Pending') {
                        element.textContent = 'Out for Delivery';
                        element.className = 'status-badge status-out';
                    }
                }
            });
        }, 5000);

        // Speech synthesis for accessibility
        function speakText(text) {
            if ('speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance(text);
                speechSynthesis.speak(utterance);
            }
        }

        // Add click listeners for accessibility
        document.querySelectorAll('.slot-card').forEach(card => {
            card.addEventListener('click', () => {
                const timeText = card.querySelector('.slot-time').textContent;
                const successText = card.querySelector('.slot-success').textContent;
                speakText(`Selected ${timeText}, ${successText}`);
            });
        });