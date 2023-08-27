import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import sendIcon from "../icons/icons8-send-96.png";
import emojiIcon from "../icons/card-image.svg";
import sendPic from "../icons/icons8-send-image-96.png";
import SERVER_BASE_URL from "./config";
import Picker from "emoji-picker-react";
import UserProfilePage from "./UserProfilePage";
import { AudioRecorder } from "react-audio-voice-recorder";
import {
  Menu,
  MenuHandler,
  MenuList,
  MenuItem,
  Button,
  Textarea,
  IconButton,
} from "@material-tailwind/react";

function ChatPanel({
  myContacts,
  setMyContacts,
  selectedContact,
  loggedInUser,
  socket,
}) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const inputRef = useRef(null);
  const [showPicker, setShowPicker] = useState(false);
  const [showUserProfilePage, setUserShowProfilePage] = useState(false);
  const [editedMessages, setEditedMessages] = useState({});
  const [editedMessageId, setEditedMessageId] = useState(null);
  const [editedMessageText, setEditedMessageText] = useState("");
  const chatContainerRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchChatHistory = async () => {
    if (!selectedContact) return;

    try {
      const response = await fetch(
        `${SERVER_BASE_URL}/messages?senderId=${loggedInUser.id}&recipientId=${selectedContact.id}`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-type": "application/json",
          },
        }
      );

      if (response.ok) {
        const chatHistory = await response.json();
        setMessages(chatHistory);
        console.log(messages);
      } else {
        console.log(`Error fetching chat history: ${response.statusText}`);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    // Fetch chat history when selectedContact changes
    fetchChatHistory();
  }, [selectedContact]);

  // message and message_update socket listeners
  useEffect(() => {
    if (!socket) return;
    const message_listener = (message) => {
      try {
        const parsedMessage = JSON.parse(message);
        console.log(
          `SENDER: ${parsedMessage.sender}`,
          `USER: ${loggedInUser.username}`
        );

        console.log("PARSED MSG: ", parsedMessage);
        console.log("LOGGED IN USER: ", loggedInUser.username);
        console.log("SELECTED USER: ", selectedContact.username);
        if (
          parsedMessage.sender !== loggedInUser.username &&
          parsedMessage.recipient === loggedInUser.username &&
          parsedMessage.sender === selectedContact.username
        ) {
          setMessages((prevMessages) => [...prevMessages, parsedMessage]);
        }
        // if (parsedMessage.sender !== loggedInUser.username) {
        //   setMessages((prevMessages) => [...prevMessages, parsedMessage]);
        // }
      } catch (error) {
        console.error("Error parsing JSON:", error);
      }
    };
    socket.on("message", message_listener);

    const update_message_listener = (updatedMessage) => {
      // Update the messages state to replace the existing message with the updated message
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === updatedMessage.id ? updatedMessage : msg
        )
      );
    };
    socket.on("update_message", update_message_listener);
    return () => {
      socket.off("message", message_listener);
      socket.off("update_message", update_message_listener);
    };
  }, [socket, loggedInUser, selectedContact]);

  // HANDLE SEARCH INTO MESSAGES
  const handleSearchQuery = (e) => {
    setSearchQuery(e.target.value);
  };
  const filteredMessages = messages.filter((message) =>
    searchQuery.length > 0
      ? message.message_type === "text" &&
        message.text.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  function handleInputText(e) {
    setNewMessage(e.target.value);
  }

  const handleChatSend = (text, message_type, e) => {
    const dbMessageObject = {
      text: text,
      recipient: selectedContact.id, //Add Reciver information
      sender: loggedInUser.id, // Add sender information
      message_type: message_type,
    };
    const messageObject = {
      text: text,
      recipient: selectedContact.username, //Add Reciver information
      sender: loggedInUser.username, // Add sender information
      message_type: message_type,
    };
    fetch(`${SERVER_BASE_URL}/messages`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify(dbMessageObject),
    })
      .then((res) => {
        if (res.ok) {
          // socket.emit("message", JSON.stringify(messageObject));
          return res.json();
        }
      })
      .then((msg) => {
        messageObject.id = msg.id;
        messageObject.date = msg.date;
        console.log("MSG: ", msg);
        console.log("MSG OBJ: ", messageObject);
        socket.emit("message", JSON.stringify(messageObject));
        setMessages((prevMessages) => [...prevMessages, msg]); // Append the message as an object
        setNewMessage(""); // Clear the new message input
        e.target.value = null;
      })
      .catch((error) => {
        console.log(error);
      });
  };

  // HANDLE SENDING MESSAGES
  const sendMessage = (e) => {
    if (newMessage.trim() === "" || selectedContact.username.trim() === "")
      return;
    console.log("MESSAGE TEXT: ", newMessage);
    handleChatSend(newMessage, "text", e);

    // socket.emit("message", JSON.stringify(messageObject)); // Send the message as a JSON string

    console.log(messages);
  };

  // HANDLE IMAGE SENDING
  const sendImage = async (e) => {
    const input = inputRef.current;

    if (input && input.files && input.files.length > 0) {
      const file = input.files[0];
      const formData = new FormData();
      formData.append("file", file);

      let response;

      try {
        response = await fetch(`${SERVER_BASE_URL}/uploadimage`, {
          method: "POST",
          credentials: "include",
          body: formData,
        });
      } catch (error) {
        console.error("Error uploading file:", error);
        return;
      }

      if (!response.ok) {
        console.error("Failed to upload file:", response.statusText);
        return;
      }

      const data = await response.json();
      handleChatSend(data.filename, "image", e);
    }
  };
  // ADD EMOJI IN INPUT
  const onEmojiClick = (emojiObject) => {
    setNewMessage((prevNewMessage) => prevNewMessage + emojiObject.emoji);
    setShowPicker(false);
  };
  // SHOW USER PROFILE
  function toggleUserProfileModal() {
    setUserShowProfilePage(!showUserProfilePage);
  }
  // HANDLE DELETING MESSAGE
  async function handleDeleteMessage(e, message, editedText) {
    console.log(message.text);
    message.previous_body = message.text;
    if (e.target.name === "saveButton") {
      if (editedText.length === 0) {
        return;
      }
      message.text = editedText;
    } else {
      message.text = "This message has been deleted...";
    }

    console.log(message);

    try {
      const response = await fetch(
        `${SERVER_BASE_URL}/messages/${message.id}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-type": "application/json",
          },
          body: JSON.stringify(message),
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("DELETED MESSAGE: ", data);

        // Update messages state by replacing the modified message
        const updatedMessages = messages.map((msg) =>
          msg.id === data.id ? data : msg
        );
        socket.emit("message_updated", data, selectedContact.username); //RERENDER SELECTED USER's CHAT THAT MESSAGE WAS EDITED
        setMessages(updatedMessages);
      } else {
        console.error("Failed to delete message:", response.statusText);
      }
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  }

  // Scroll to the bottom of the chat container when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages, filteredMessages]);

  // AUDIO TESTS
  // const [audioBlob, setAudioBlob] = useState(null);

  // const handleAudioUpload = () => {
  //   if (audioBlob) {
  //     const formData = new FormData();
  //     formData.append("file", audioBlob);

  //     fetch(`${SERVER_BASE_URL}/uploadaudio`, {
  //       method: "POST",
  //       credentials: "include",
  //       body: formData,
  //     })
  //       .then((response) => response.json())
  //       .then((data) => {
  //         console.log("Uploaded audio file:", data.filename);
  //         // Handle the response from the server if needed
  //       })
  //       .catch((error) => {
  //         console.error("Error uploading audio:", error);
  //         // Handle the error if upload fails
  //       });
  //   }
  // };

  return (
    <div className="flex flex-col h-full">
      {showUserProfilePage && (
        <UserProfilePage
          // setLoggedInUser={setLoggedInUser}
          selectedContact={selectedContact}
          loggedInUser={loggedInUser}
          myContacts={myContacts}
          setMyContacts={setMyContacts}
          onClose={toggleUserProfileModal}
        />
      )}
      <div
        className="flex min-w-0 gap-x-4 p-2 cursor-pointer ml-auto items-center" // Add items-center class
        onClick={toggleUserProfileModal}
      >
        <div className="min-w-0 flex-auto">
          <p className="text-lg font-semibold leading-6 text-gray-900">
            {selectedContact.fname + " " + selectedContact.lname}
          </p>
        </div>
        <img
          className="h-12 w-12 flex-none rounded-full bg-gray-50"
          src={`${SERVER_BASE_URL}/static/${selectedContact.profile_pic}`}
          alt=""
        />
      </div>
      <div>
        <label className="relative block p-2">
          <span className="sr-only">Search</span>
          <span className="absolute inset-y-0 left-0 flex items-center pl-2">
            <svg className="h-5 w-5 fill-slate-300" viewBox="0 0 20 20">
              whatever
            </svg>
          </span>
          <input
            className="placeholder:italic placeholder:text-slate-400 block bg-white w-full border border-slate-300 rounded-md py-2 pl-9 pr-3 shadow-sm focus:outline-none focus:border-sky-500 focus:ring-sky-500 focus:ring-1 sm:text-sm"
            placeholder="Search Messages..."
            type="text"
            name="search"
            value={searchQuery}
            onChange={handleSearchQuery}
          />
        </label>
      </div>
      <div
        className="flex-grow overflow-y-auto mb-0 border-1 rounded-lg border-blue-500"
        ref={chatContainerRef}
      >
        {filteredMessages.map((message, index) => {
          // const showDateSeparator =
          //   index === 0 ||
          //   messages[index].date.slice(0, 10) !==
          //     messages[index - 1].date.slice(0, 10);

          return (
            <div
              key={index}
              className={`flex ${
                message.sender === loggedInUser.username ||
                message.sender === loggedInUser.id
                  ? "justify-end pr-2"
                  : "justify-start pl-2"
              } mb-2 `}
            >
              {/* {showDateSeparator && (
                <div className="w-full text-center my-2">
                  <p className="text-xs text-gray-500">
                    {message.date.slice(0, 10)}
                  </p>
                  <hr className="border-t border-gray-300" />
                </div>
              )} */}
              <div
                className={`rounded-lg pb-1 ${
                  message.sender === loggedInUser.username ||
                  message.sender === loggedInUser.id
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200"
                }`}
                style={{
                  maxWidth: "48%",
                  wordWrap: "break-word",
                  marginTop: "33px",
                  // marginTop: showDateSeparator ? "33px" : "0",
                }}
              >
                {editedMessageId === message.id ? (
                  <div>
                    <input
                      type="text"
                      style={{ color: "black" }}
                      value={editedMessageText}
                      onChange={(e) => setEditedMessageText(e.target.value)}
                    />
                    <button
                      name="saveButton"
                      onClick={(e) => {
                        handleDeleteMessage(e, message, editedMessageText);
                        setEditedMessageId(null); // Reset edit state
                        setEditedMessageText(""); // Reset input value
                      }}
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditedMessageId(null); // Reset edit state
                        setEditedMessageText(""); // Reset input value
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="relative w-100 p-1 pb-2">
                    {message.message_type === "text" ? (
                      <p>{message.text}</p>
                    ) : (
                      <img
                        src={`${SERVER_BASE_URL}/static/${message.text}`}
                        alt={`${message.text}`}
                        style={{
                          maxWidth: "100%",
                          maxHeight: "300px",
                          alignSelf:
                            message.sender === loggedInUser.username ||
                            message.sender === loggedInUser.id
                              ? "flex-end"
                              : "flex-start",
                        }}
                      />
                    )}
                    <span className="absolute right-2 bottom-0 text-[11px]">
                      {message.modified_date
                        ? message.modified_date.slice(11, 16)
                        : message.date.slice(11, 16)}
                    </span>
                    {message.sender === loggedInUser.username ||
                    message.sender === loggedInUser.id ? (
                      <>
                        <Menu placement="bottom-end">
                          <MenuHandler>
                            <Button>...</Button>
                          </MenuHandler>
                          <MenuList>
                            {message.sender === loggedInUser.username ||
                            message.sender === loggedInUser.id ? (
                              <>
                                {message.message_type === "text" &&
                                  !message.modified_date && (
                                    <MenuItem
                                      onClick={() => {
                                        setEditedMessageId(message.id);
                                        setEditedMessageText(message.text);
                                      }}
                                    >
                                      Edit
                                    </MenuItem>
                                  )}
                                {!message.modified_date && (
                                  <MenuItem
                                    onClick={(e) =>
                                      handleDeleteMessage(e, message)
                                    }
                                  >
                                    Delete
                                  </MenuItem>
                                )}
                              </>
                            ) : null}
                          </MenuList>
                        </Menu>
                      </>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="InputContainer bg-gray-100 p-2 flex">
        <div className="relative flex-grow">
          <input
            type="text"
            value={newMessage}
            onChange={handleInputText}
            placeholder="Type your message..."
            className="flex-grow  py-1 rounded-lg border border-gray-300 w-full pl-14 pr-3"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                sendMessage();
              }
            }}
          />
          <img
            className="emoji-icon absolute left-3 top-1/2 transform -translate-y-1/2 cursor-pointer"
            src="https://icons.getbootstrap.com/assets/icons/emoji-smile.svg"
            onClick={() => setShowPicker((val) => !val)}
          />
          <label
            // className="relative"
            className="w-6 h-6 cursor-pointer absolute left-8 top-2.5 transform "
          >
            <input
              type="file"
              accept="image/*"
              ref={inputRef}
              style={{ display: "none" }}
              onChange={(e) => sendImage(e)}
            />
            <img
              src={emojiIcon}
              alt="Choose"
              // onClick={() => inputRef.current.click()}
            />
          </label>
        </div>
        {showPicker && (
          <div className="absolute left-25% bottom-12">
            <Picker
              pickerStyle={{ width: "100%" }}
              onEmojiClick={onEmojiClick}
            />
          </div>
        )}
        <button onClick={sendMessage}>
          <img src={sendIcon} alt="Send Message" className="w-6 h-6 pl-0.5" />
        </button>
      </div>

      {/* <div className="InputContainer bg-gray-100 p-4 flex">
        <input
          type="text"
          value={newMessage}
          onChange={handleInputText}
          placeholder="Type your message..."
          className="flex-grow px-2 py-1 rounded-lg border border-gray-300"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              sendMessage();
            }
          }}
        />

        <input
          type="file"
          accept="image/*"
          ref={inputRef}
          style={{ display: "none" }}
          onChange={(e) => sendImage(e)}
        />
        <img
          className="emoji-icon"
          src="https://icons.getbootstrap.com/assets/icons/emoji-smile.svg"
          onClick={() => setShowPicker((val) => !val)}
        /> */}
      {/* <AudioRecorder
          onStop={(blob) => {
            setAudioBlob(blob);
            handleAudioUpload(); // Upload audio immediately after recording stops
          }}
          render={({ onRecord, onStop }) => (
            <div>
              <button
                onMouseDown={onRecord}
                onMouseUp={onStop}
                onMouseLeave={onStop}
              >
                Hold to Record and Upload
              </button>
            </div>
          )}
        /> */}
      {/* {showPicker && (
          <div className="absolute bottom-12 right-0">
            <Picker
              pickerStyle={{ width: "100%" }}
              onEmojiClick={onEmojiClick}
            />
          </div>
        )}
        <button onClick={() => inputRef.current.click()}>
          <img src={sendPic} alt="Choose" className="w-6 h-6" />
        </button>

        <button onClick={sendMessage}>
          <img src={sendIcon} alt="Send Message" className="w-6 h-6" />
        </button>
      </div> */}
    </div>
  );
}

export default ChatPanel;
