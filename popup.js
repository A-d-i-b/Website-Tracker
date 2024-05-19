function formatTime(ms) {
    return (ms / 1000).toFixed(1);
  }
function sendEmail(email) {
    fetch('http://localhost:3000/api/user/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({email})
    });
  }
  
  

  document.addEventListener('DOMContentLoaded', function() {
    const saveEmailButton = document.getElementById('saveEmail');
    const openDashboardButton = document.getElementById('openDashboard');
    const status = document.getElementById('status');
  
    
    chrome.storage.local.get('userEmail', function(data) {
      const userEmail = data.userEmail;
      if (userEmail) {
        document.getElementById('email').value = userEmail;
      }
    });
  
    saveEmailButton.addEventListener('click', function() {
      const email = document.getElementById('email').value.trim();
  
      if (email) {
        chrome.storage.local.set({ userEmail: email }, () => {
          status.textContent = 'Email saved successfully!';
          console.log('Email saved:', email);
          sendEmail(email);
          
          window.close();
        });
      } else {
        status.textContent = 'Please enter a valid email address.';
        console.error('User email not provided');
      }
    });
    openDashboardButton.addEventListener('click', function() {
        chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') });
      });
  });
  // Fetch restricted sites from the server
// fetch('/api/restricted-sites')
// .then(response => response.json())
// .then(restrictedSites => {
//   // Get current site hostname
//   const currentSite = window.location.hostname;
//   console.log("this url");
//   console.log(currentSite);
//   // Check if current site matches any restricted sites
//   const isRestricted = restrictedSites.some(site => currentSite.includes(site));

//   // Display warning if current site is restricted
//   if (isRestricted) {
//     alert('Warning: You are visiting a restricted site!');
//   }
// })
// .catch(error => {
//   console.error('Error fetching restricted sites:', error);
// });
