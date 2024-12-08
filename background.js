// Initialize chat history
let chatHistory;

// Listen for when the extension is installed
// chrome.runtime.onInstalled.addListener(function () {
//     // Set default API model
//     let defaultModel = "gpt-4o";
//     chrome.storage.local.set({ apiModel: defaultModel });

//     // Set empty chat history
//     chrome.storage.local.set({ chatHistory: [] });

//     // Open the options page
//     chrome.runtime.openOptionsPage();
// });

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // Check if the page is fully loaded
    if (changeInfo.status === "complete") {
        // Inject the content script into the page
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ["content.js"],
        });
    }
});

// Listen for messages from the popup script
chrome.runtime.onMessage.addListener(async function (
    message,
    sender,
    sendResponse
) {
    if (message.userInput) {
        // get the chat history from local storage
        const result = await getStorageData(["chatHistory"]);

        if (!result.chatHistory || result.chatHistory.length === 0) {
            chatHistory = [
                {
                    role: "system",
                    content:
                        "I'm your helpful chat bot! I provide helpful and concise answers.",
                },
            ];
        } else {
            chatHistory = result.chatHistory;
        }

        chatHistory.push({
            role: "user",
            content: message.userInput,
        });

        // save message array to local storage
        chrome.storage.local.set({ chatHistory: chatHistory });
        chrome.runtime.sendMessage({ answer: message.userInput });
        chrome.runtime.sendMessage({ answer: "Loading...." });

        const response = await fetch_probability(message.userInput);

        // Get the assistant's response
        const reasoning = response["reasoning"];

        const yes = response["yes_probability"];
        const no = response["no_probability"];

        const assistantResponse = `${reasoning}`;

        // Add the assistant's response to the message array
        chatHistory.push({
            role: "assistant",
            content: assistantResponse,
        });

        chatHistory.push({
            role: "assistant",
            content: `Overall Yes: ${yes}%, No: ${no}%`,
        });

        // save message array to local storage
        chrome.storage.local.set({ chatHistory: chatHistory });

        // Send the assistant's response to the popup script
        chrome.runtime.sendMessage({ answer: assistantResponse });
        chrome.runtime.sendMessage({
            answer: `Overall Yes: ${yes}%, No: ${no}%`,
        });

        chrome.runtime.sendMessage({
            answer: `Would you like to place order?`,
        });

        console.log("Sent response to popup:", assistantResponse);
        return true; // Enable response callback
    }

    return true; // Enable response callback
});

// Fetch data from the OpenAI Chat Completion API
async function fetchChatCompletion(messages, apiKey, apiModel) {
    try {
        const response = await fetch(
            "https://api.openai.com/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    messages: messages,
                    model: apiModel,
                }),
            }
        );

        if (!response.ok) {
            if (response.status === 401) {
                // Unauthorized - Incorrect API key
                throw new Error(
                    "Looks like your API key is incorrect. Please check your API key and try again."
                );
            } else {
                throw new Error(
                    `Failed to fetch. Status code: ${response.status}`
                );
            }
        }

        return await response.json();
    } catch (error) {
        // Send a response to the popup script
        chrome.runtime.sendMessage({ error: error.message });

        console.error(error);
    }
}

async function fetch_probability(prompt) {
    try {
        const response = await fetch(
            `https://7mmjb0s6-8000.inc1.devtunnels.ms/predict/market?q=%22${prompt}%22`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );

        if (!response.ok) {
            if (response.status === 401) {
                // Unauthorized - Incorrect API key
                throw new Error(
                    "Looks like your API key is incorrect. Please check your API key and try again."
                );
            } else {
                throw new Error(
                    `Failed to fetch. Status code: ${response.status}`
                );
            }
        }

        let result = await response.json();
        return result;
    } catch (error) {
        // Send a response to the popup script
        chrome.runtime.sendMessage({ error: error.message });

        console.error(error);
    }
}

// Fetch Image from the OpenAI DALL-E API
async function fetchImage(prompt, apiKey, apiModel) {
    try {
        const response = await fetch(
            "https://api.openai.com/v1/images/generations",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    prompt: prompt,
                    model: apiModel,
                    n: 1,
                    size: "1024x1024",
                }),
            }
        );

        if (!response.ok) {
            if (response.status === 401) {
                // Unauthorized - Incorrect API key
                throw new Error(
                    "Looks like your API key is incorrect. Please check your API key and try again."
                );
            } else {
                throw new Error(
                    `Failed to fetch. Status code: ${response.status}`
                );
            }
        }

        return await response.json();
    } catch (error) {
        // Send a response to the popup script
        chrome.runtime.sendMessage({ error: error.message });

        console.error(error);
    }
}

// Get data from local storage
function getStorageData(keys) {
    return new Promise((resolve) => {
        chrome.storage.local.get(keys, (result) => resolve(result));
    });
}
