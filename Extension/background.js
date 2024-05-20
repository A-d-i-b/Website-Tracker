// tab timing activity: onUpdate, onActivate

let RESTRICTED_TIME = 10;


let currentTabId = 0;
let startTime = 0;
let userE = '';

function getDate() {
  var now = new Date();

  var day = ("0" + now.getDate()).slice(-2);
  var month = ("0" + (now.getMonth() + 1)).slice(-2);
  var today = now.getFullYear() + "-" + (month) + "-" + (day);

  return today
}

function recordTimeSpent(tabId, startTime) {
  const todayDate = getDate()
  const endTime = new Date().getTime();
  const timeSpent = Math.round((endTime - startTime ?? endTime) / 1000);
  console.log(timeSpent)
  chrome.tabs.get(tabId, (tab) => {
    if (!tab || !tab.url) return
    console.log(tab.url)
    const url = new URL(tab.url);
    const domain = url.hostname;
    chrome.storage.local.get('userEmail', function (data) {
      const userEmail = data.userEmail;
      if (userEmail) {

        sendTimeToServer(domain, timeSpent, userEmail, todayDate);
        console.log('User email:', userEmail);
      }
      console.log(todayDate);

    });

  });
}


async function checkRestrictedSite(tabId) {
  const restrictedSites = await fetchRestrictedSites();

  chrome.tabs.get(tabId, (tab) => {
    const currentURL = new URL(tab.url).hostname;
    console.log(currentURL);
    if (restrictedSites.some(site => currentURL.includes(new URL(site.url).hostname))) {
      chrome.windows.create({
        url: 'pop.html',
        type: 'popup',
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
  chrome.storage.local.set({ restricted_time: RESTRICTED_TIME });
  chrome.windows.create({
    url: 'popup.html',
    type: 'popup',
    width: 400,
    height: 300
  });

});

// console.log("hello");
chrome.tabs.onActivated.addListener(activeInfo => {

  if (!activeInfo) return
  // console.log(activeInfo.tabId);
  currentTabId = activeInfo.tabId;
  if (currentTabId) {
    recordTimeSpent(currentTabId, startTime);
  }

  startTime = new Date().getTime();
  // checkRestrictedSite(activeInfo.tabId);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // console.log(tab.url)

  // handleRestricted(tab)

  if (tabId === currentTabId && changeInfo.status === 'complete') {
    recordTimeSpent(currentTabId, startTime);
    startTime = new Date().getTime();
    console.log("domain:", tabId.url);
    // checkTime(tabId.url);
    // checkRestrictedSite(activeInfo.tabId);
  }
  // checkRestrictedSite(activeInfo.tabId);
});
// function checkTime(domain) { // minutes
//   console.log("time exceeded");
//   chrome.storage.local.get(['userEmail', 'restricted_time'], function (data) {
//     console.log("time exceeded2");
//     const restricted_time = data.restricted_time;
//     const email = data.userEmail;

//     if (email) {
//       console.log("time exceeded3");
//       const todayDate = getDate()
//       
//     }
//   });

// }


function sendTimeToServer(domain, timeSpent, userEmail, todayDate) {
  fetch('http://localhost:3000/api/data', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ domain, timeSpent, userEmail, todayDate })
  });
}



chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // cons
  if (message.action === 'fetchWebsiteData') {
    let url = message.url;

    getUserEmail()
      .then(email => {
        return fetchTimeSpent(email, url).then(minutesSpent => {
          return { email, minutesSpent };
        });
      })
      .then(({ email, minutesSpent }) => {
        return isWebsiteRestricted(url).then(isRestricted => {
          return { email, minutesSpent, isRestricted };
        });
      })
      .then(({ minutesSpent, isRestricted }) => {
        console.log({ minutesSpent })
        let minutesLeft = RESTRICTED_TIME * 60 - minutesSpent;

        let resp = {
          isRestricted,
          'remainingTime': minutesLeft * 1000
        };

        console.log(resp);

        sendResponse(resp);
      })
      .catch(error => {
        console.error('An error occurred:', error);
      });

    return true
  } else if (message.action === 'updateRestrictedTimeout') {
    let restrictedTime = message.restrictedTime;
    RESTRICTED_TIME = restrictedTime;

    console.log(RESTRICTED_TIME)

    sendResponse({"Message": "Success"});
    return true
  }
});


async function fetchTimeSpent(email, domain) {
  const todayDate = getDate();
  let resp = await fetch(`http://localhost:3000/api/time_spent/${email}/${domain}/${todayDate}`)
  if (resp.status == 200) {
    let data = await resp.json();
    return data.time_spent;
  } else {
    console.error('Error fetching time spent:', error);
    return null
  }
}

async function getUserEmail() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get('userEmail', function (data) {
      const userEmail = data.userEmail;

      // console.log({userEmail})

      if (userEmail) {
        resolve(userEmail);
      }
    });
  })

}

async function isWebsiteRestricted(domain) {
  let email = await getUserEmail();

  const response = await fetch('http://localhost:3000/api/restricted-sites/' + email);
  const restrictedSites = await response.json();

  return restrictedSites.find(x => x.url === domain) != null;
}
