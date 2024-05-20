

let url = window.location.host

chrome.runtime.sendMessage({ action: 'fetchWebsiteData', url }, function (response) {
    
    if (response) {

        console.log(response)

        if (response.isRestricted) {
            let { remainingTime } = response;
            console.log(remainingTime)
            if (remainingTime <= 0) {
                alert("You have Exceeded the Restricted Time");
            } else {
                setTimeout(() => {
                    alert("You have Exceeded the Restricted Time");
                }, remainingTime)
            }
    
            
            
        }
    }

});