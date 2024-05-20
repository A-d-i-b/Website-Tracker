window.onload = function() {
  var restrictedSites = document.querySelectorAll('#restrictedList li');
  var currentURL = window.location.hostname;
  console.log("this is url:");
  console.log(currentURL);
  for (var i = 0; i < restrictedSites.length; i++) {
    var site = restrictedSites[i].textContent;
    if (currentURL.includes(site)) {
      document.getElementById('overlay').style.display = 'block';
      break;
    }
  }

  document.getElementById('closePopup').addEventListener('click', function() {
    document.getElementById('overlay').style.display = 'none';
  });
};
document.addEventListener('DOMContentLoaded', function() {
  if (chrome && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get('userEmail', function(data) {
      const userEmail = data.userEmail;
      if (userEmail) {
        console.log('User email from dashboard script:', userEmail);
        const datePicker = document.getElementById('datePicker');
        datePicker.addEventListener('change', function() {
          const selectedDate = datePicker.value;
          fetchData(userEmail, selectedDate);
        });
        // fetchData(userEmail);

        var now = new Date();
        fetchData(userEmail, today);

        var day = ("0" + now.getDate()).slice(-2);
        var month = ("0" + (now.getMonth() + 1)).slice(-2);
        var today = now.getFullYear()+"-"+(month)+"-"+(day) ;

        datePicker.value = today;
      } else {
        console.error('User email address not found in local storage');
      }
    });
  } else {
    console.error('chrome.storage.local is not available');
  }
});

function fetchData(userEmail, selectedDate) {
  let url = `http://localhost:3000/api/data/${userEmail}`;
    let formattedDate = new Date().toISOString().split('T')[0];
    if (selectedDate) {
      formattedDate = new Date(selectedDate).toISOString().split('T')[0];
    }
    url += `?date=${formattedDate}`;

    console.log(url)

  fetch(url)
    .then(response => response.json())
    .then(data => {
      const activityList = document.getElementById('activityList');
      activityList.innerHTML = ''; 

      data.forEach(activity => {
        const item = document.createElement('div');
        item.classList.add('activity-item');
        item.innerHTML = `<span class="domain">${activity.domain}</span> - <span class="time-spent">${activity.time_spent} minutes</span>`;
        activityList.appendChild(item);
      });

      const domains = data.map(activity => activity.domain);
      const timesSpent = data.map(activity => activity.time_spent);

      renderChart(domains, timesSpent);
    })
    .catch(error => {
      console.error('Error fetching data:', error);
    });
}
let myhart;
function renderChart(domains, timesSpent) {
  if (myhart) {
    myhart.destroy(); 
  }
  const ctx = document.getElementById('activityChart').getContext('2d');
  myhart=new Chart(ctx, {
    type: 'bar',
    data: {
      labels: domains,
      datasets: [{
        label: 'Time Spent (minutes)',
        data: timesSpent,
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}
document.addEventListener('DOMContentLoaded', function(){
    const addButton= document.getElementById("addSiteForm");
    const siteUrl= document.getElementById("siteUrlInput");
    // const restricted= document.getElementById("restrictedList");
    chrome.storage.local.get('userEmail', function(data) {
      const userEmail = data.userEmail;
      if (userEmail) {
        addButton.addEventListener('submit', function(event){
          event.preventDefault();
          const url=siteUrl.value.trim();
          if(url){
            addSiteToRestrictedList(url,userEmail);
          }
        });
        fetchRestrictedSites(userEmail);
        
        console.log(userEmail)
        // fetchData(userEmail, null)
      }
        // console.log(todayDate);
    });
});


function fetchRestrictedSites(userEmail) {
  let url=`http://localhost:3000/api/restricted-sites/${userEmail}`;
  fetch(url)
    .then(response => response.json())
    .then(data => {
      const restrictedList = document.getElementById('restrictedList');
      restrictedList.innerHTML = '';
      data.forEach(site => {
        const listItem = document.createElement('li');
        listItem.textContent = site.url;
        
        // Create remove button
        const removeButton = document.createElement('button');
        removeButton.textContent = 'Remove';
        removeButton.addEventListener('click', function() {
          removeSiteFromRestrictedList(site.url,userEmail);
        });

        // Append remove button to list item
        listItem.appendChild(removeButton);
        
        // Append list item to restricted list
        restrictedList.appendChild(listItem);
      });
    })
    .catch(error => {
      console.error('Error fetching restricted sites:', error);
    });
}
function addSiteToRestrictedList(siteUrl,userEmail) {
  fetch('http://localhost:3000/api/restricted-sites', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ siteUrl,userEmail })
  })
  .then(response => {
    if (response.ok) {
      fetchRestrictedSites(userEmail);
      siteUrlInput.value = '';
    } else {
      console.error('Failed to add site to restricted list');
    }
  })
  .catch(error => {
    console.error('Error adding site to restricted list:', error);
  });
}
function removeSiteFromRestrictedList(siteUrl,userEmail) {
  let url=`http://localhost:3000/api/restricted-sites`;
  fetch(url, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ siteUrl ,userEmail})
  })
  .then(response => {
    if (response.ok) {
      fetchRestrictedSites(userEmail);
    } else {
      console.error('Failed to remove site from restricted list');
    }
  })
  .catch(error => {
    console.error('Error removing site from restricted list:', error);
  });
}
