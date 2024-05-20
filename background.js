let currentTabId = null;
let startTime = null;
let userE='';
async function fetchRestrictedSites() {
  console.log("fetchrestrccited");
  const response = await fetch('http://localhost:3000/api/restricted-sites');
  const restrictedSites = await response.json();
  return restrictedSites;
}
async function checkRestrictedSite(tabId) {
  const restrictedSites = await fetchRestrictedSites();
  
  chrome.tabs.get(tabId, (tab) => {
    const currentURL = new URL(tab.url).hostname;
    console.log(currentURL);
    if (restrictedSites.some(site => currentURL.includes(new URL(site.url).hostname))) {
      chrome.windows.create({
        url:'pop.html',
        type:'popup',
        width: 400,
        height: 300
      
        });
      // chrome.scripting.executeScript({
      //   target: {tabId: tabId},
      //   func: showWarning
      // });
    }
  });
}
// function showWarning() {
//   console.log("showing warning");
//   // alert('Warning: You are visiting a restricted site!');
// }

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({restricted_time:30});
  chrome.windows.create({
    url: 'popup.html',
    type: 'popup',
    width: 400,
    height: 300
  });
  
});

// console.log("hello");
chrome.tabs.onActivated.addListener(activeInfo => {
  
  console.log(activeInfo.tabId);
  if (currentTabId) {
    recordTimeSpent(currentTabId, startTime);
  }
  currentTabId = activeInfo.tabId;
  startTime = new Date().getTime();
  // checkRestrictedSite(activeInfo.tabId);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // console.log(tab.url)

  // handleRestricted(tab)

  if (tabId === currentTabId && changeInfo.status === 'complete') {
    recordTimeSpent(currentTabId, startTime);
    startTime = new Date().getTime();
    console.log("domain:",tabId.url);
    checkTime(tabId.url);
    // checkRestrictedSite(activeInfo.tabId);
  }
  // checkRestrictedSite(activeInfo.tabId);
});
function checkTime(domain) {
  console.log("time exceeded");
  chrome.storage.local.get(['userEmail','restricted_time'], function(data) {
    console.log("time exceeded2");
    const restricted_time=data.restricted_time;
    const email = data.userEmail;
    
    if (email) {
      console.log("time exceeded3");
      const todayDate= new Date().toISOString().split('T')[0];
      fetch(`http://localhost:3000/api/time_spent/${email}/${domain}/${todayDate}`)
      .then(response => response.json())
      .then(data1 => {
          if (data1.time_spent > restricted_time) {
              // showNotification(domain);
              console.log("time exceeded result");
          }
      })
      .catch(error => {
          console.error('Error fetching time spent:', error);
      });
    }
  });
 
}

function recordTimeSpent(tabId, startTime) {
  const todayDate= new Date().toISOString().split('T')[0];
  const endTime = new Date().getTime();
  const timeSpent = Math.round((endTime - startTime)/1000);
  chrome.tabs.get(tabId, tab => {
    const url = new URL(tab.url);
    const domain = url.hostname;
    chrome.storage.local.get('userEmail', function(data) {
      const userEmail = data.userEmail;
      if (userEmail) {
        
        sendTimeToServer(domain, timeSpent,userEmail, todayDate);
        console.log('User email:', userEmail);}
        console.log(todayDate);
     
    });
   
  });
}

function sendTimeToServer(domain, timeSpent,userEmail, todayDate) {
  fetch('http://localhost:3000/api/data', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ domain, timeSpent ,userEmail,todayDate})
  });
}


function handleRestricted(tab) {
  console.log(tab)
  chrome.scripting.executeScript({
    target: {tabId: tab.id},
    files: ['content.js']
  });
}