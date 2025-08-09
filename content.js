console.log("Email Writer Extension - Content Script Loaded");

// creates function that creates the AI button
function createAIButton() {
    const button = document.createElement('div');

    button.className = 'T-I J-J5-Ji aoO v7 T-I-atl L3';
    button.style.marginRight = '8px';
    button.innerHTML = 'Draft Reply';
    button.setAttribute('role', 'button');
    button.setAttribute('data-tooltip', 'Generate AI Reply');

    return button;
}

// creates function that gets the email content
function getEmailContent() {
    const selectors = [
        '.h7',
        '.a3s.aiL',
        '.gmail_quote',
        '[role="presentation"]'
    ];

    // for every selector in selectors gets the content based on the selector
    for (const selector of selectors) {
        const content = document.querySelector(selector);
        if (content) {
            return content.innerText.trim();
        }

        return '';
    }
}

// creates function that finds the compose toolbar
function findComposeToolbar() {
    const selectors = [
        '.btC',
        '.aDh',
        '[role="toolbar"]',
        '.gU.Up'
    ];

    // for every selector in selectors gets the toolbar based on the selector
    for (const selector of selectors) {
        const toolbar = document.querySelector(selector);
        if (toolbar) {
            return toolbar;
        }

        return null;
    }
}

// creates function that injects the AI button
function injectButton() {
    const existingButton = document.querySelector('.ai-reply-button');
    if (existingButton) existingButton.remove();

    // calls the findComposeToolbar function to find the compose toolbar
    const toolbar = findComposeToolbar();
    if (!toolbar) {
        console.log("Toolbar not found");
        return;
    }

    console.log("Toolbar found, creating AI button");

    const button = createAIButton();
    button.classList.add('ai-reply-button');

    // adds the click event listener to the button that calls the generateReply function to generate the email reply
    button.addEventListener('click', async () => {
        try {
            button.innerHTML = 'Generating...';
            button.disabled = true;

            const emailContent = getEmailContent();
            // makes post request to api endpoint to generate the email reply

            const response = await fetch("https://draft-mate-server.vercel.app/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ emailContent })
            });


            // throws error if response is not ok
            if (!response.ok) {
                console.log(error);
                throw new Error('API Request Failed');
            }

            // gets the generated reply from the response
            const generatedReply = await response.json();
            const generatedReplyText = generatedReply.candidates[0].content.parts[0].text;

            // gets the compose box from the document using querySelector
            const composeBox = document.querySelector('[role="textbox"][g_editable="true"]');
            if (composeBox) {
                composeBox.focus();
                document.execCommand('insertText', false, generatedReplyText);
            } else {
                console.error('Compose box was not found');
            }
        } catch (error) {
            console.log(error);
            alert('Failed to generate reply');
        } finally {
            button.innerHTML = 'AI Reply';
            button.disabled = false;
        }
    });

    toolbar.insertBefore(button, toolbar.firstChild);
}

// creates observer that watches for changes in the document
const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
        const addedNodes = Array.from(mutation.addedNodes);

        const hasComposeElements = addedNodes.some(node =>
            node.nodeType === Node.ELEMENT_NODE &&
            (node.matches('.aDh, .btC, [role="dialog"]') || node.querySelector('.aDh, .btC, [role="dialog"]'))
        );

        if (hasComposeElements) {
            console.log("Compose Window Detected");
            setTimeout(injectButton, 500);
        }
    }
});

// starts observing the document body
observer.observe(document.body, {
    childList: true,
    subtree: true
});