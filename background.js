let currentTabId = null;
let startTime = null;
let userE='';
async function fetchRestrictedSites() {
  console.log("hello1");
  const response = await fetch('http://localhost:3000/api/restricted-sites');
  const restrictedSites = await response.json();
  return restrictedSites;
}
async function checkRestrictedSite(tabId) {
  const restrictedSites = await fetchRestrictedSites();
  
  chrome.tabs.get(tabId, (tab) => {
    const currentURL = new URL(tab.url).hostname;
    if (restrictedSites.some(site => currentURL.includes(new URL(site.url).hostname))) {
      chrome.scripting.executeScript({
        target: {tabId: tabId},
        func: showWarning
      });
    }
  });
}
function showWarning() {
  console.log("hello");
  alert('Warning: You are visiting a restricted site!');
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.windows.create({
    url: 'popup.html',
    type: 'popup',
    width: 400,
    height: 300
  });
});


chrome.tabs.onActivated.addListener(activeInfo => {
  checkRestrictedSite(activeInfo.tabId);
  if (currentTabId) {
    recordTimeSpent(currentTabId, startTime);
  }
  currentTabId = activeInfo.tabId;
  startTime = new Date().getTime();
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tabId === currentTabId && changeInfo.status === 'complete') {
    checkRestrictedSite(tabId);
    recordTimeSpent(currentTabId, startTime);
    startTime = new Date().getTime();
  }
  if (changeInfo.status === 'complete') {
    checkRestrictedSite(tabId);
  }
});

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
