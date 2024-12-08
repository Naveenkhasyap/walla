// Function to extract meta image URL
function extractMetaImage() {
    const metaTag = document.querySelector('meta[property="fc:frame:image"]');
    return metaTag ? metaTag.getAttribute("content") : null;
}

// Function to extract event title from URL
function extractEventTitleFromURL() {
    const currentURL = window.location.href;
    const urlParts = currentURL.split("/event/");
    if (urlParts.length > 1) {
        const eventPart = urlParts[1].split("?")[0];
        return decodeURIComponent(eventPart);
    }
    return null;
}

// Send message to extension context
function sendExtensionMessage(messageType, data) {
    chrome.runtime.sendMessage({
        type: messageType,
        payload: data,
        userInput: data.eventTitle,
    });
}

function getHTML() {
    title = getMetaContentByProperty("og:title");
    console.log(`title: ${title}`);

    if (title === "Polymarket | The World's Largest Prediction Market") {
        return;
    }

    sendExtensionMessage("EVENT_TITLE_EXTRACTED", { eventTitle: title });
}

function getMetaContentByProperty(propertyName) {
    const metaTags = document.getElementsByTagName("meta");

    for (let i = 0; i < metaTags.length; i++) {
        const metaTag = metaTags[i];
        if (metaTag.getAttribute("property") === propertyName) {
            return metaTag.getAttribute("content");
        }
    }

    return null; // If no matching meta tag is found
}

getHTML();
