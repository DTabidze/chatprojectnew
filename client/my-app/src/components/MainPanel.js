import React, { useState, useEffect } from "react";
import ContactList from "./ContactList";
import ChatPanel from "./ChatPanel";
import io from "socket.io-client";
import { useOutletContext } from "react-router-dom";

function MainPanel() {
  const socket = io("http://10.129.3.117:8080");
  const { loggedInUser, setLoggedInUser } = useOutletContext();
  const [myContacts, setMyContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  function handleSelectedContact(contact) {
    setSelectedContact(contact);
    console.log("SELECTED CONTACT: ", selectedContact);
  }
  console.log("LOGGED IN USER MAINPANEL: ", loggedInUser);

  useEffect(() => {
    if (
      loggedInUser &&
      (loggedInUser.contacts_received || loggedInUser.contacts_sent)
    ) {
      let combinedContacts = [];
      for (let i = 0; i < loggedInUser.contacts_received.length; i++) {
        combinedContacts.push(loggedInUser.contacts_received[i].user_first_obj);
      }

      for (let i = 0; i < loggedInUser.contacts_sent.length; i++) {
        combinedContacts.push(loggedInUser.contacts_sent[i].user_second_obj);
      }
      setMyContacts(combinedContacts);
    }
  }, [loggedInUser]);

  return (
    <>
      {Object.keys(loggedInUser).length > 0 && (
        <div className="flex h-screen">
          <div className="w-1/4 bg-gray-200">
            <div className="flex min-w-0 gap-x-4">
              <img
                className="h-12 w-12 flex-none rounded-full bg-gray-50"
                // src={contact.imageUrl}
                alt=""
              />
              <div className="min-w-0 flex-auto">
                <p className="text-sm font-semibold leading-6 text-gray-900">
                  {loggedInUser.fname + " " + loggedInUser.lname}
                </p>
              </div>
            </div>
            <ContactList
              loggedInUser={loggedInUser}
              myContacts={myContacts}
              handleSelectedContact={handleSelectedContact}
            />
          </div>
          {selectedContact !== null && (
            <div className="flex-1 bg-gray-100">
              <ChatPanel
                loggedInUser={loggedInUser}
                selectedContact={selectedContact}
                socket={socket}
              />
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default MainPanel;
