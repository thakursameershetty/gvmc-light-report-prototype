// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {

    const reportForm = document.getElementById('reportForm');
    const successAlert = document.getElementById('successAlert');
    const errorAlert = document.getElementById('errorAlert');
    const getLocationBtn = document.getElementById('getLocation');
    const locationInput = document.getElementById('location');
    const latitudeInput = document.getElementById('latitude');
    const longitudeInput = document.getElementById('longitude');
    const mapContainer = document.getElementById('map');
    const submitButton = document.getElementById('submitButton');

    let map = null; // To hold the Leaflet map instance
    let marker = null; // To hold the Leaflet marker instance

    // --- Geolocation and Map Handling ---
    if (getLocationBtn) {
        getLocationBtn.addEventListener('click', function() {
            getLocationBtn.disabled = true; // Disable button while fetching
            getLocationBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Fetching...';

            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(showPosition, showError, { timeout: 10000 }); // Added timeout
            } else {
                alert("Geolocation is not supported by this browser.");
                resetLocationButton();
            }
        });
    }

    function showPosition(position) {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        if(latitudeInput) latitudeInput.value = lat;
        if(longitudeInput) longitudeInput.value = lon;

        mapContainer.style.display = 'block';

        if (!map) {
             map = L.map('map').setView([lat, lon], 16); // Slightly more zoom
             L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                 attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
             }).addTo(map);
             marker = L.marker([lat, lon], {draggable: true}).addTo(map); // Make marker draggable

             // Update hidden fields if marker is dragged
             marker.on('dragend', function(event){
                var marker = event.target;
                var position = marker.getLatLng();
                if(latitudeInput) latitudeInput.value = position.lat;
                if(longitudeInput) longitudeInput.value = position.lng;
                console.log("Marker dragged to:", position.lat, position.lng);
                // Optionally reverse geocode again on dragend
                reverseGeocode(position.lat, position.lng);
             });

        } else {
            map.setView([lat, lon], 16);
            marker.setLatLng([lat, lon]);
        }
        marker.bindPopup('Your approximate location. Drag marker to fine-tune.').openPopup();


        // Reverse Geocode
        reverseGeocode(lat, lon);
        resetLocationButton();
    }

    function reverseGeocode(lat, lon) {
         // Reverse Geocode using Nominatim
        fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`)
            .then(response => {
                if (!response.ok) { throw new Error('Nominatim request failed'); }
                return response.json();
                })
            .then(data => {
                if (data && data.display_name && locationInput) {
                    locationInput.value = data.display_name;
                } else {
                    locationInput.placeholder = "Could not fetch address, please enter manually.";
                }
            })
            .catch(error => {
                console.error('Error fetching reverse geocoding:', error);
                if(locationInput) locationInput.placeholder = "Address lookup failed, please enter manually.";
            });
    }

    function showError(error) {
        console.error("Geolocation error:", error);
        let message = "An unknown error occurred.";
         switch(error.code) {
            case error.PERMISSION_DENIED:
                message = "Location permission denied. Please enable location access in your browser settings.";
                break;
            case error.POSITION_UNAVAILABLE:
                message = "Location information is currently unavailable.";
                break;
            case error.TIMEOUT:
                message = "Request for location timed out. Please try again.";
                break;
        }
         alert(message); // Inform user
        resetLocationButton();
    }

     function resetLocationButton() {
        if (getLocationBtn) {
            getLocationBtn.disabled = false;
            getLocationBtn.innerHTML = '<i class="fas fa-map-marker-alt"></i> Use Current Location';
        }
    }


    // --- Form Submission - Calls Backend ---
    if (reportForm) {
        reportForm.addEventListener('submit', function(e) {
            e.preventDefault(); // Prevent default form submission
            hideAlerts(); // Hide previous alerts

            // Disable button to prevent multiple submissions
            if(submitButton) {
                 submitButton.disabled = true;
                 submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
            }


            // 1. Collect Form Data
            // Note: File input ('photo') is not included here as it requires FormData handling
            const formData = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                location: locationInput.value,
                latitude: latitudeInput.value,
                longitude: longitudeInput.value,
                issueType: document.getElementById('issueType').value,
                description: document.getElementById('description').value,
            };

            // 2. Send Data to Backend using fetch
            // Assumes backend is running on localhost:3000
            // Use '/api/report' directly if front-end is served by the same server
            fetch('/api/report', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            })
            .then(response => {
                // Check if response is ok (status in the range 200-299)
                if (!response.ok) {
                    // Try to parse error message from backend if available
                    return response.json().then(errData => {
                        throw new Error(errData.message || `HTTP error! Status: ${response.status}`);
                    }).catch(() => {
                         // Fallback if error response is not JSON
                         throw new Error(`HTTP error! Status: ${response.status}`);
                    });
                }
                 return response.json(); // Parse JSON response from backend
            })
            .then(data => {
                // 3. Handle Success Response from Backend
                console.log('Success:', data);
                showSuccessAlert(`Thank you! Your report has been submitted. Your reference ID is: <strong>${data.referenceId}</strong>`);
                reportForm.reset(); // Reset form
                 // Reset map/location fields
                 if(mapContainer) mapContainer.style.display = 'none';
                 if(map) { map.remove(); map = null; marker = null; }
                 if(latitudeInput) latitudeInput.value = '';
                 if(longitudeInput) longitudeInput.value = '';

            })
            .catch((error) => {
                // 4. Handle Errors (Network error, server error response)
                console.error('Error submitting report:', error);
                showErrorAlert(`Error submitting report: ${error.message}. Please try again later.`);
            })
            .finally(() => {
                 // Re-enable submit button regardless of success or failure
                 if(submitButton) {
                     submitButton.disabled = false;
                     submitButton.innerHTML = 'Submit Report';
                 }
            });
        });
    }

    // --- Alert Handling Functions ---
    function showSuccessAlert(message) {
        if (successAlert) {
            successAlert.innerHTML = message;
            successAlert.classList.remove('d-none');
            successAlert.scrollIntoView({ behavior: 'smooth', block: 'center' });

        }
         hideAlerts(errorAlert); // Hide error alert if success shown
    }

     function showErrorAlert(message) {
        if (errorAlert) {
            errorAlert.innerHTML = message;
            errorAlert.classList.remove('d-none');
             errorAlert.scrollIntoView({ behavior: 'smooth', block: 'center' });

        }
        hideAlerts(successAlert); // Hide success alert if error shown
    }

    function hideAlerts(alertElement = null) {
        if (alertElement) {
             alertElement.classList.add('d-none');
        } else {
             if (successAlert) successAlert.classList.add('d-none');
             if (errorAlert) errorAlert.classList.add('d-none');
        }
    }

}); // End DOMContentLoaded