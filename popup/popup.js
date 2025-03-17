document.addEventListener('DOMContentLoaded', function() {
  const saveButton = document.getElementById('saveSession');
  const loadButton = document.getElementById('loadSession');
  const sessionList = document.getElementById('sessionList');
  const statusMessage = document.getElementById('statusMessage');
  
  // Load saved sessions
  chrome.storage.local.get(null, function(items) {
    updateSessionList(items);
  });
  
  // Save current session
  saveButton.addEventListener('click', function() {
    chrome.tabs.query({}, function(tabs) {
      chrome.storage.local.get(['sessionCounter'], function(data) {
        const sessionCounter = data.sessionCounter || 0;
        
        const newSession = {
          id: sessionCounter + 1,
          timestamp: Date.now(),
          tabs: tabs.map(tab => ({
            url: tab.url,
            title: tab.title,
            active: tab.active,
            pinned: tab.pinned
          }))
        };
        
        chrome.storage.local.set({
          [`session_${newSession.id}`]: newSession,
          sessionCounter: sessionCounter + 1
        }, function() {
          showStatus('Session saved successfully!', 'success');
          
          // Update session list
          chrome.storage.local.get(null, function(items) {
            updateSessionList(items);
          });
        });
      });
    });
  });
  
  // Load selected session
  loadButton.addEventListener('click', function() {
    const selectedSessionId = sessionList.value;
    if (!selectedSessionId) return;
    
    chrome.storage.local.get([`session_${selectedSessionId}`], function(data) {
      const session = data[`session_${selectedSessionId}`];
      if (!session) {
        showStatus('Session not found!', 'error');
        return;
      }
      
      // Create new window and restore tabs
      chrome.windows.create({}, function(newWindow) {
        const promises = [];
        
        session.tabs.forEach(tab => {
          promises.push(
            chrome.tabs.create({
              windowId: newWindow.id,
              url: tab.url,
              active: tab.active,
              pinned: tab.pinned
            })
          );
        });
        
        Promise.all(promises).then(() => {
          showStatus('Session loaded successfully!', 'success');
        }).catch(error => {
          showStatus('Error loading session: ' + error, 'error');
        });
      });
    });
  });
  
  function updateSessionList(items) {
    sessionList.innerHTML = '';
    
    // Add option for selecting a session
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Select a session';
    defaultOption.disabled = true;
    defaultOption.selected = true;
    sessionList.appendChild(defaultOption);
    
    // Add saved sessions
    Object.keys(items).forEach(key => {
      if (key.startsWith('session_')) {
        const session = items[key];
        const option = document.createElement('option');
        option.value = session.id;
        option.textContent = `Session ${session.id} - ${new Date(session.timestamp).toLocaleString()}`;
        sessionList.appendChild(option);
      }
    });
  }
  
  function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = type;
    statusMessage.style.display = 'block';
    
    setTimeout(() => {
      statusMessage.style.display = 'none';
    }, 3000);
  }
});
