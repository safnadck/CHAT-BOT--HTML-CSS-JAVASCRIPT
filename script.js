const typingForm = document.querySelector(".typing-form");
const chatList = document.querySelector(".chat-list");
const suggestions = document.querySelectorAll(".suggestion-list .suggestion");
const toggleThemeButton = document.querySelector("#toggle-theme-button");
const deleteChatButton = document.querySelector("#delete-chat-button");



let userMessage = null;
let isResponseGenerating = false;


const API_key = "AIzaSyBw0aBwlMAJBQ8vABjstCvoCc5-zBrabks";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_key}`;


const loadLocalStorage = () => {
  const savedChats = localStorage.getItem("saveChats");
  const isLightMode = (localStorage.getItem("themeColor") === "light_mode");
  

  // apply the stored theme
  document.body.classList.toggle("light_mode", isLightMode);
  toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";

  chatList.innerHTML = savedChats || "";

  document.body.classList.toggle("hide-header", savedChats);
  chatList.scrollTo(0, chatList.scrollHeight); // scroll to the bottom

}


  loadLocalStorage();


// create a new message element and return it
const createMessageElement = (content, ...classes) => {
    const div = document.createElement("div");
    div.classList.add("message", ...classes);
    div.innerHTML = content;
    return div;
}

const showTypingEffect = (text, textElement, incomingMessageDiv) => {
  const words = text.split(' ');
  let currentWordIndex= 0;

  const typingIntervel = setInterval(() => {
    textElement.innerText +=  (currentWordIndex === 0 ? '' : ' ') + words [currentWordIndex++];
    incomingMessageDiv.querySelector(".icon").classList.add("hide");

    if(currentWordIndex === words.length ) {
      clearInterval(typingIntervel);
      isResponseGenerating =false;
      incomingMessageDiv.querySelector(".icon").classList.remove("hide");
      localStorage.setItem("savedChats", chatList.innerHTML);
    }
      chatList.scrollTo(0, chatList.scrollHeight); // scroll to the bottom
  }, 75);
}

// fetxh response from the api on based on user message
const generateAPIResponse = async(incomingMessageDiv) => {

  const textElement = incomingMessageDiv.querySelector(".text")  // get text ellement

  // send a post request to the api with the users message
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {"Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          role: "user",
          parts: [{ text: userMessage}]
        }]
      })
    });

    const data = await response.json();

    if(!response.ok) throw new Error(data.error.message);

    // get the api  response and removee  asterrisks from it
    const apiResponse = data?.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*\*/g, '$1');
    showTypingEffect(apiResponse, textElement, incomingMessageDiv);
  
  } 
  catch (error) {
    isResponseGenerating = false;
    textElement.innerHTML = error.message;
    textElement.classList.add("error");
  }
  finally {
    incomingMessageDiv.classList.remove("loading");
  }

}


  // loading animation for waiting for api response
const showLoadingAnimation = ()  => {
    const html = `<div class="message-content">
                <img src="images/gemini.svg" alt="" class="avatar">
                <p class="text"></p>
                     <div class="loading-indicator">
                        <div class="loading-bar"></div>
                        <div class="loading-bar"></div>
                        <div class="loading-bar"></div>
                     </div>
            </div>
            <span onclick="copyMessage(this)" class="icon material-symbols-rounded">content_copy</span>`;

const incomingMessageDiv = createMessageElement(html, "incoming", "loading");
chatList.appendChild(incomingMessageDiv);
chatList.scrollTo(0, chatList.scrollHeight) // scroll to the bottom

  generateAPIResponse(incomingMessageDiv);
}


const copyMessage = (copyIcon) => {
  const messageText = copyIcon.parentElement.querySelector(".text").innerText;

  navigator.clipboard.writeText(messageText);
  copyIcon.innerText = "done"; // show tick icon
  setTimeout(() => copyIcon.innerText = "content_copy", 1000) // revert icon after 1 sec
}

const handleOutgoingChat = () => {
   userMessage = typingForm.querySelector(".typing-input").value.trim() || userMessage;
   if(!userMessage ||  isResponseGenerating) return; // exit if there is no message

   isResponseGenerating =true;


  const html = ` <div class="message-content">
                <img src="images/user.jpg" alt="" class="avatar">
                <p class="text"></p>
            </div>`;

  const outgoingMessageDiv = createMessageElement(html, "outgoing");
  outgoingMessageDiv.querySelector(".text").innerHTML = userMessage; 
  chatList.appendChild(outgoingMessageDiv);

  typingForm.reset(); // clear input field
  chatList.scrollTo(0, chatList.scrollHeight); // scroll to the bottom
  document.body.classList.add("hide-header"); // hide header  once chat started
  setTimeout(showLoadingAnimation, 500);  // show loading animation after a delay
}


// set usermessage and handle outgoing chat when a suggestion is clicked
suggestions.forEach(suggestion => {
  suggestion.addEventListener("click", () => {
    userMessage = suggestion.querySelector(".text").innerHTML;
    handleOutgoingChat();
  });
});



toggleThemeButton.addEventListener("click", () => {
  const isLightMode = document.body.classList.toggle("light_mode");
  localStorage.setItem("themeColor", isLightMode ? "light_mode" : "dark_mode");
  toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";
});

deleteChatButton.addEventListener("click", () => {
  if(confirm("ARE YOU SURE WANT TO DELETE ALL MESSAGES?")) {
    localStorage.removeItem("saveChats");;
    loadLocalStorage();
  }
})

typingForm.addEventListener("submit", (e) => {
    e.preventDefault();

    handleOutgoingChat();
});