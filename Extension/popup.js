function formatTime(ms) {
  return (ms / 1000).toFixed(1);
}
function sendEmail(email) {
  fetch('http://localhost:3000/api/user/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email })
  });
}



document.addEventListener('DOMContentLoaded', function () {
  const saveEmailButton = document.getElementById('saveEmail');
  const openDashboardButton = document.getElementById('openDashboard');
  const status = document.getElementById('status');
  const inputTime = document.getElementById('time');
  const setButton = document.getElementById('inputTime');
  chrome.storage.local.get('restricted_time', function (data) {
    if (data.restricted_time) {
      inputTime.value = data.restricted_time;
    }
  });
  setButton.addEventListener('click', function () {
    if (inputTime.value) {
      chrome.storage.local.set({ restricted_time: inputTime.value }, () => {
        status.textContent = "Timer got set";
        console.log('timer of:', inputTime.value);
      })

      chrome.runtime.sendMessage({ action: 'updateRestrictedTimeout', restrictedTime: Number(inputTime.value) }, function (response) {
        console.log(response)
      })
    } else {
      status.textContent = 'Please enter a time';
      console.error('User timer not provided');
    }
  })


  chrome.storage.local.get('userEmail', function (data) {
    const userEmail = data.userEmail;
    if (userEmail) {
      document.getElementById('email').value = userEmail;
    }
  });

  saveEmailButton.addEventListener('click', function () {
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
  openDashboardButton.addEventListener('click', function () {
    chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') });
  });
});