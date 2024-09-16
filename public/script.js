let events = JSON.parse(localStorage.getItem('events')) || [];
let goodThings = JSON.parse(localStorage.getItem('goodThings')) || [];
let meanThings = JSON.parse(localStorage.getItem('meanThings')) || [];
let archivedEvents = JSON.parse(localStorage.getItem('archivedEvents')) || [];
let editingIndex = null;
let editingType = '';
let alarmInterval = null;

function showPopup(message, callback) {
    const popup = document.getElementById('popup');
    const popupMessage = document.getElementById('popup-message');
    const popupConfirm = document.getElementById('popup-confirm');

    popupMessage.textContent = message;
    popup.style.display = 'flex';

    // Handle confirm button click
    popupConfirm.onclick = function() {
        popup.style.display = 'none';
        if (callback) callback();
    };
}

function closePopup() {
    const popup = document.getElementById('popup');
    popup.style.display = 'none';
}
function showConfirmationPopup(message, onConfirm, onCancel) {
    const popup = document.getElementById('confirmation-popup');
    const popupMessage = document.getElementById('confirmation-popup-message');
    const confirmButton = document.getElementById('confirmation-popup-confirm');
    const cancelButton = document.getElementById('confirmation-popup-cancel');
    const closeButton = document.getElementById('confirmation-popup-close'); // Updated ID

    popupMessage.textContent = message;
    popup.style.display = 'flex';

    confirmButton.onclick = function() {
        popup.style.display = 'none';
        if (onConfirm) onConfirm();
    };

    cancelButton.onclick = function() {
        popup.style.display = 'none';
        if (onCancel) onCancel();
    };

    closeButton.onclick = function() {
        popup.style.display = 'none';
    };
}

function showNotification(title, options) {
    if (Notification.permission === 'granted') {
        new Notification(title, options);
    } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                new Notification(title, options);
            }
        });
    }
}
function validatePasscode() {
    const passcodeInput = document.getElementById('passcode');
    const passcode = passcodeInput.value;

    if (passcode === '19962614') {
        // Hide the passcode screen and show the main screen
        document.getElementById('passcode-screen').style.display = 'none';
        document.getElementById('main-screen').style.display = 'block';

        // Display the home screen after successful login
        showScreen('home');
        setupTimer();

        // Clear the passcode field
        passcodeInput.value = '';
    } else {
        // Show an error message if the passcode is incorrect
        showPopup('Incorrect passcode. Please try again.');

        // Clear the passcode field
        passcodeInput.value = '';
    }
}
function toggleMenu() {
    const menu = document.getElementById('nav-menu');
    menu.classList.toggle('show');
}

document.addEventListener('DOMContentLoaded', function() {
    // Check if the app should be locked
    checkAppLock();

    // Initialize menu toggle functionality
    var menuToggle = document.getElementById('menu-toggle');
    var navMenu = document.getElementById('nav-menu');

    menuToggle.addEventListener('click', function(event) {
        event.stopPropagation();
        toggleMenu();
    });

    // Function to toggle the navigation menu
    function toggleMenu() {
        if (navMenu.classList.contains('show')) {
            navMenu.classList.remove('show');
        } else {
            navMenu.classList.add('show');
        }
    }

    // Function to check if the app should be locked
    function checkAppLock() {
      console.log('Checking app lock status...'); // Debugging line
        if (localStorage.getItem('appLocked') === 'true') {
            // Show the passcode screen and hide other screens
            document.getElementById('passcode-screen').style.display = 'block';
            document.querySelectorAll('.screen').forEach(screen => {
                if (screen.id !== 'passcode-screen') {
                    screen.style.display = 'none';
                }
            });
            // Clear the lock flag after showing the passcode screen
            localStorage.removeItem('appLocked');
        } else {
            // Show the home screen and other necessary screens
            document.getElementById('home').style.display = 'block';
        }
    }

    document.addEventListener('click', function(event) {
        if (!navMenu.contains(event.target) && !menuToggle.contains(event.target)) {
            navMenu.classList.remove('show');
        }
    });

    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            navMenu.classList.remove('show');
        }
    });

    viewGoodThings();
    viewMeanThings();
    viewEvents();
    viewArchivedEvents();
    updateAnniversaryCounter();
    setupDailyReminder();
});

function showScreen(screenId) {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => {
        screen.style.display = 'none';
    });
    document.getElementById(screenId).style.display = 'block';
    toggleMenu();
    if (screenId === 'gagans-good-vibes') {
        viewGoodThings();
    } else if (screenId === 'gagans-gripe-box') {
        viewMeanThings();
    } else if (screenId === 'date-night-diaries') {
        viewEvents();
    }
}

function addEvent() {
    const name = document.getElementById('event-name').value;
    const type = document.getElementById('event-type').value;
    const timestamp = new Date();

    if (name && type) {
        if (editingIndex !== null && editingType === 'event') {
            events[editingIndex] = { name, type, timestamp };
            editingIndex = null;
            editingType = '';
        } else {
            events.push({ name, type, timestamp });
        }
        localStorage.setItem('events', JSON.stringify(events));
        document.getElementById('event-name').value = '';
        document.getElementById('event-type').value = ''; // Clear the event type as well
        showPopup('Event saved!');
        viewEvents();
    } else {
        showPopup('Please enter both event name and type');
    }
}

function confirmAddGoodThing() {
    const thing = document.getElementById('good-thing').value;
    const timestamp = new Date();

    if (thing) {
        showConfirmationPopup(
            "You really like this one, huh?",
            function() { // On Confirm
                if (editingIndex !== null && editingType === 'good') {
                    goodThings[editingIndex] = { thing, timestamp };
                    editingIndex = null;
                    editingType = '';
                } else {
                    goodThings.push({ thing, timestamp });
                }
                localStorage.setItem('goodThings', JSON.stringify(goodThings));
                document.getElementById('good-thing').value = '';
                showPopup('Sweet nothing saved!');
                viewGoodThings();
            },
            function() { // On Cancel
                showPopup('Sweet nothing discarded');
                document.getElementById('good-thing').value = ''; // Clear the input field
                viewGoodThings();
            }
        );
    } else {
        showPopup('Please enter a sweet nothing');
    }
}

function confirmAddMeanThing() {
    const thing = document.getElementById('mean-thing').value;
    const timestamp = new Date();

    if (thing) {
        showConfirmationPopup(
            "Is that really an Appu quote?",
            function() { // On Confirm
                if (editingIndex !== null && editingType === 'mean') {
                    meanThings[editingIndex] = { thing, timestamp };
                    editingIndex = null;
                    editingType = '';
                } else {
                    meanThings.push({ thing, timestamp });
                }
                localStorage.setItem('meanThings', JSON.stringify(meanThings));
                document.getElementById('mean-thing').value = '';
                showPopup('Oops moment saved!');
                viewMeanThings();
            },
            function() { // On Cancel
                showPopup('Oops moment discarded');
                document.getElementById('mean-thing').value = ''; // Clear the input field
                viewMeanThings();
            }
        );
    } else {
        showPopup('Please enter an oops moment');
    }
}

function viewEvents() {
    const tableBody = document.getElementById('planned-dates-list');
    tableBody.innerHTML = ''; // Clear previous content
    events.forEach((item, index) => {
        const tr = document.createElement('tr');
        
        const tdText = document.createElement('td');
        tdText.textContent = `${item.name} (Type: ${item.type})`;
        
        const tdActions = document.createElement('td');
        tdActions.classList.add('actions');
        
        // Create edit button
        const editButton = document.createElement('button');
        editButton.textContent = 'Edit';
        editButton.onclick = () => editEvent(index);
        
        // Create delete button
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.onclick = () => deleteEvent(index);


        // Create mark as done button
        const doneButton = document.createElement('button');
        doneButton.textContent = 'Mark as Done';
        doneButton.onclick = () => markAsDone(index);

        
        // Append buttons to actions cell
        tdActions.appendChild(editButton);
        tdActions.appendChild(deleteButton);
        tdActions.appendChild(doneButton);
        
        // Append cells to row
        tr.appendChild(tdText);
        tr.appendChild(tdActions);
        
        // Append row to table body
        tableBody.appendChild(tr);
    });
}

function markAsDone(index) {
    const doneEvent = events.splice(index, 1)[0]; // Remove from planned dates
    archivedEvents.push(doneEvent); // Add to archived dates
    viewEvents(); // Refresh planned dates view
    viewArchivedEvents(); // Refresh archived dates view
}

function viewArchivedEvents() {
    console.log('Viewing archived events'); // Debugging line
    console.log('Archived Events:', archivedEvents); // Debugging line
    
    const tableBody = document.getElementById('archived-dates-list');
    if (!tableBody) {
        console.error('No element found with id "archived-dates-list"');
        return;
    }
    
    tableBody.innerHTML = ''; // Clear previous content

    if (archivedEvents.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="2">No archived events found.</td></tr>';
        return;
    }

    archivedEvents.forEach((item, index) => {
        const tr = document.createElement('tr');
        
        const tdText = document.createElement('td');
        tdText.textContent = `${item.name} (Type: ${item.type})`;
        
        const tdActions = document.createElement('td');
        tdActions.classList.add('actions');
        
        // Create remove from archive button
        const removeButton = document.createElement('button');
        removeButton.textContent = 'Remove';
        removeButton.onclick = () => removeFromArchive(index);
        
        // Create send back to planned button
        const sendBackButton = document.createElement('button');
        sendBackButton.textContent = 'Send Back';
        sendBackButton.onclick = () => sendBackToPlanned(index);
        
        // Append buttons to actions cell
        tdActions.appendChild(removeButton);
        tdActions.appendChild(sendBackButton);
        
        // Append cells to row
        tr.appendChild(tdText);
        tr.appendChild(tdActions);
        
        // Append row to table body
        tableBody.appendChild(tr);
    });
}

function removeFromArchive(index) {
    // Show the confirmation popup
    showConfirmationPopup(
        'Do you really want to delete this archived date?',
        function() {
            // Confirm action: Remove the item from archive and refresh the view
            archivedEvents.splice(index, 1);
            viewArchivedEvents();
        },
        function() {
            // Cancel action: Optionally, you can log or perform other actions
            console.log('Archive removal canceled.');
        }
    );
}

function sendBackToPlanned(index) {
    const eventToSendBack = archivedEvents.splice(index, 1)[0]; // Remove from archive
    events.push(eventToSendBack); // Add to planned dates
    viewEvents(); // Refresh planned dates view
    viewArchivedEvents(); // Refresh archived dates view
}

function showPlannedDates() {
    document.getElementById('planned-dates').style.display = 'block';
    document.getElementById('date-archive').style.display = 'none';
    viewEvents(); // Refresh planned dates view
}

function showDateArchive() {
    document.getElementById('planned-dates').style.display = 'none';
    document.getElementById('date-archive').style.display = 'block';
    viewArchivedEvents(); // Refresh archived dates view
}

function viewGoodThings() {
    const tableBody = document.getElementById('previously-good-vibes-list');
    tableBody.innerHTML = ''; // Clear previous content
    goodThings.forEach((item, index) => {
        const tr = document.createElement('tr');
        
        const tdText = document.createElement('td');
        tdText.textContent = `${item.thing} (Added on: ${item.timestamp.toLocaleString()})`;
        
        const tdActions = document.createElement('td');
        tdActions.classList.add('actions');
        
        // Create edit button
        const editButton = document.createElement('button');
        editButton.textContent = 'Edit';
        editButton.onclick = () => editGoodThing(index);
        
        // Create delete button
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.onclick = () => deleteGoodThing(index);
        
        // Append buttons to actions cell
        tdActions.appendChild(editButton);
        tdActions.appendChild(deleteButton);
        
        // Append cells to row
        tr.appendChild(tdText);
        tr.appendChild(tdActions);
        
        // Append row to table body
        tableBody.appendChild(tr);
    });
}

function viewMeanThings() {
    const tableBody = document.getElementById('previously-mean-things-list');
    tableBody.innerHTML = ''; // Clear previous content
    
    meanThings.forEach((item, index) => {
        const tr = document.createElement('tr');
        
        const tdText = document.createElement('td');
        
        // Check if timestamp exists and is valid
        const timestampText = item.timestamp ? item.timestamp.toLocaleString() : 'No timestamp available';
        
        tdText.textContent = `${item.thing} (Added on: ${timestampText})`;
        
        const tdActions = document.createElement('td');
        tdActions.classList.add('actions');
        
        // Create edit button
        const editButton = document.createElement('button');
        editButton.textContent = 'Edit';
        editButton.onclick = () => editMeanThing(index);
        
        // Create delete button
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.onclick = () => deleteMeanThing(index);
        
        // Append buttons to actions cell
        tdActions.appendChild(editButton);
        tdActions.appendChild(deleteButton);
        
        // Append cells to row
        tr.appendChild(tdText);
        tr.appendChild(tdActions);
        
        // Append row to table body
        tableBody.appendChild(tr);
    });
}

function editEvent(index) {
    const event = events[index];
    if (event) {
        document.getElementById('event-name').value = event.name;
        document.getElementById('event-type').value = event.type;
        editingIndex = index;
        editingType = 'event';
        showScreen('date-night-diaries'); // Ensure the correct screen ID
    } else {
        showPopup('Event not found');
    }
}

function editGoodThing(index) {
    const goodThing = goodThings[index];
    if (goodThing) {
        document.getElementById('good-thing').value = goodThing.thing;
        editingIndex = index;
        editingType = 'good';
        showScreen('gagans-good-vibes'); // Ensure the correct screen ID
    } 
  else {
        showPopup('Good thing not found');
    }
}

function editMeanThing(index) {
    const meanThing = meanThings[index];
    if (meanThing) {
        document.getElementById('mean-thing').value = meanThing.thing;
        editingIndex = index;
        editingType = 'mean';
        showScreen('gagans-gripe-box'); // Ensure the correct screen ID
    } else {
        showPopup('Mean thing not found');
    }
}

function deleteEvent(index) {
    showConfirmationPopup('Are you sure you want to delete this event?', function() {
        events.splice(index, 1);
        localStorage.setItem('events', JSON.stringify(events));
        viewEvents();
    });
}

function deleteGoodThing(index) {
    showConfirmationPopup('Are you sure you want to delete this good thing?', function() {
        goodThings.splice(index, 1);
        localStorage.setItem('goodThings', JSON.stringify(goodThings));
        viewGoodThings();
    });
}

function deleteMeanThing(index) {
    showConfirmationPopup('Are you sure you want to delete this mean thing?', function() {
        meanThings.splice(index, 1);
        localStorage.setItem('meanThings', JSON.stringify(meanThings));
        viewMeanThings();
    });
}
let alarmTimeout = null;

function calculateDaysUntilAnniversary(anniversaryDate) {
    const today = new Date();
    const nextAnniversary = new Date(anniversaryDate);
    nextAnniversary.setFullYear(today.getFullYear());

    // If the anniversary has already passed this year, move to next year
    if (today > nextAnniversary) {
        nextAnniversary.setFullYear(today.getFullYear() + 1);
    }

    const timeDiff = nextAnniversary - today;
    const daysUntilAnniversary = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

    return daysUntilAnniversary;
}

function updateAnniversaryCounter() {
    const anniversaryDate = '2021-09-04'; // Replace with your anniversary date (YYYY-MM-DD format)
    const daysUntilAnniversary = calculateDaysUntilAnniversary(anniversaryDate);
    document.getElementById('days-until-anniversary').textContent = `${daysUntilAnniversary} days`;
}

// Call the function directly
updateAnniversaryCounter();

        // Function to display the current time
        function displayCurrentTime() {
            const now = new Date();
            document.getElementById('current-time').innerText = now.toLocaleTimeString();
        }

        // Function to set up the timer for the alarm
        function setupTimer() {
            const now = new Date();
            const fourFiftyFive = new Date();
            fourFiftyFive.setHours(16, 45, 0, 0); // Set time to 16:45

            if (now.getTime() > fourFiftyFive.getTime()) {
                fourFiftyFive.setDate(fourFiftyFive.getDate() + 1); // Move to the next day if it's already past 16:45
            }

            const timeout = fourFiftyFive.getTime() - now.getTime();
            alarmTimeout = setTimeout(function() {
                startAlarm();
            }, timeout);
        }

        // Function to start the alarm
function startAlarm() {
    alarmInterval = setInterval(() => {
        const currentTime = new Date();
        const day = currentTime.getDay();
        if (day >= 1 && day <= 5 && currentTime.getHours() === 16 && currentTime.getMinutes() === 45) {
            navigator.vibrate(3000); // Vibrate for 3 seconds
            document.getElementById('alarm-status').textContent = 'Alarm triggered!';
        }
    }, 60000); // Check every minute

document.getElementById('alarm-status').innerText = 'Alarm status: Set';
                showPopup('Alarm started! Your phone will vibrate for 3 seconds at 4:45 PM.');
        }
        // Function to stop the alarm
        function stopAlarm() {
            if (alarmInterval !== null) {
                clearInterval(alarmInterval);
                alarmInterval = null;
                document.getElementById('start-alarm').innerText = 'Start Alarm';
                document.getElementById('alarm-status').innerText = 'Alarm status: Stopped';
                showPopup('Alarm stopped.');
            }
        }
        // Function to toggle the alarm on and off
        function toggleAlarm() {
            if (alarmInterval === null) {
                setupTimer();
                startAlarm();
            } else {
                stopAlarm();
            }
        }

        // Function to set up a daily reminder
function setupDailyReminder() {
    const now = new Date();
    const reminderTime = new Date();
    reminderTime.setHours(10, 30, 0, 0);

    if (now.getTime() > reminderTime.getTime()) {
        reminderTime.setDate(reminderTime.getDate() + 1);
    }

    const timeout = reminderTime.getTime() - now.getTime();

    setTimeout(function() {
        showNotification('Reminder', {
            body: 'Don\'t forget to set your alarm!',
            icon: 'images/notification-icon.png'
        });
    }, timeout);
}

        // Initialize the reminders and alarm
        setupDailyReminder();
        setInterval(displayCurrentTime, 1000); // Update current time every second
function LockApp() {
    // Set app as locked in localStorage
    localStorage.setItem('appLocked', 'true');
    // Show the passcode screen and hide other screens
    document.getElementById('passcode-screen').style.display = 'block';
    document.getElementById('main-screen').style.display = 'none';
}
function LockApp() {
    // Show the confirmation popup
    document.getElementById('lock-confirmation-popup').style.display = 'block';
}

function confirmLockApp() {
    // Set app as locked in localStorage
    localStorage.setItem('appLocked', 'true');
    // Show the passcode screen and hide other screens
    document.getElementById('passcode-screen').style.display = 'block';
    document.getElementById('main-screen').style.display = 'none';
    // Close the confirmation popup
    closeLockConfirmationPopup();
}

function closeLockConfirmationPopup() {
    document.getElementById('lock-confirmation-popup').style.display = 'none';
}

function checkAppLock() {
    if (localStorage.getItem('appLocked') === 'true') {
        // Show the passcode screen and hide other screens
        document.getElementById('passcode-screen').style.display = 'block';
        document.getElementById('main-screen').style.display = 'none';
        // Clear the lock flag after showing the passcode screen
        localStorage.removeItem('appLocked');
    } else {
        // Show the home screen and other necessary screens
        showScreen('home'); // Show the home screen after successful login
    }
}