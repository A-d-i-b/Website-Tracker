function getDate(date) {
  var now = new Date();
  if (date) {
    now = new Date(date)
  }
  
  var day = ("0" + now.getDate()).slice(-2);
  var month = ("0" + (now.getMonth() + 1)).slice(-2);
  var today = now.getFullYear() + "-" + (month) + "-" + (day);

  return today
}

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

  // document.getElementById('closePopup').addEventListener('click', function() {
  //   document.getElementById('overlay').style.display = 'none';
  // });
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
    let formattedDate = getDate()
    if (selectedDate) {
      formattedDate = getDate(selectedDate)
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
        item.innerHTML = `<span class="domain">${activity.domain}</span> - <span class="time-spent">${(activity.time_spent/60).toFixed(0)} minutes</span>`;
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
      labels: domains.map(formatLabel),
      datasets: [{
        label: 'Time Spent (minutes)',
        data: timesSpent.map(x => (x / 60).toFixed(0)),
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
          const url=getDomainFromUrl(siteUrl.value.trim());
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
        const listItem = document.createElement('div');
        listItem.textContent = site.url;

        listItem.classList.add('--restricted-list-item')
        
        // Create remove button
        const removeButton = document.createElement('button');
        removeButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" width="8" height="8"><!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M376.6 84.5c11.3-13.6 9.5-33.8-4.1-45.1s-33.8-9.5-45.1 4.1L192 206 56.6 43.5C45.3 29.9 25.1 28.1 11.5 39.4S-3.9 70.9 7.4 84.5L150.3 256 7.4 427.5c-11.3 13.6-9.5 33.8 4.1 45.1s33.8 9.5 45.1-4.1L192 306 327.4 468.5c11.3 13.6 31.5 15.4 45.1 4.1s15.4-31.5 4.1-45.1L233.7 256 376.6 84.5z"/></svg>`;
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


function formatLabel(str, maxwidth){
  var sections = [];
  var words = str.split(" ");
  var temp = "";

  words.forEach(function(item, index){
    if(temp.length > 0)
    {
      var concat = temp + ' ' + item;

      if(concat.length > maxwidth){
        sections.push(temp);
        temp = "";
      }
      else{
        if(index == (words.length-1)) {
          sections.push(concat);
          return;
        }
        else {
          temp = concat;
          return;
        }
      }
    }

    if(index == (words.length-1)) {
      sections.push(item);
      return;
    }

    if(item.length < maxwidth) {
      temp = item;
    }
    else {
      sections.push(item);
    }

  });

  return sections;
}

function getDomainFromUrl(url) {
  
  let urlObj = new URL(url);
  
  return urlObj.hostname;
}
