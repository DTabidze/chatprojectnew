import React, { useState } from "react";
import { CardHeader } from "@material-tailwind/react";
import SERVER_BASE_URL from "./config";

export default function UserProfilePage({
  loggedInUser,
  selectedContact,
  onClose,
  myContacts,
  setMyContacts,
}) {
  console.log(myContacts);

  function handleDeleteContact() {
    console.log(selectedContact);
    console.log(loggedInUser);
    let matchingContactId = null;

    for (let i = 0; i < loggedInUser.contacts_received.length; i++) {
      if (
        loggedInUser.contacts_received[i].user_first_obj.id ===
        selectedContact.id
      ) {
        matchingContactId = loggedInUser.contacts_received[i].id;
        break;
      }
    }

    if (!matchingContactId) {
      for (let i = 0; i < loggedInUser.contacts_sent.length; i++) {
        if (
          loggedInUser.contacts_sent[i].user_second_obj.id ===
          selectedContact.id
        ) {
          matchingContactId = loggedInUser.contacts_sent[i].id;
          break;
        }
      }
    }
    console.log(matchingContactId);
    async function deleteContact(matchingContactId) {
      try {
        const response = await fetch(
          `${SERVER_BASE_URL}/contacts/${matchingContactId}`,
          {
            method: "DELETE",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          const result = await response.json();
          const updatedContacts = myContacts.filter(
            (contact) => contact.id !== selectedContact.id
          );
          setMyContacts(updatedContacts);
          onClose();
        } else {
          console.error("Failed to Delete Contact", response.statusText);
        }
      } catch (error) {
        console.error("Error Deleting Contact", error);
      }
    }
    deleteContact(matchingContactId);
  }

  return (
    <>
      <div className="justify-center items-center flex overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none">
        <div className="relative w-auto my-6 mx-auto max-w-3xl">
          <div className="border-0 rounded-lg shadow-lg relative flex flex-col w-full bg-white outline-none focus:outline-none">
            <CardHeader color="blue-gray" className="relative h-56">
              <label
                htmlFor="profileImage"
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 p-1 bg-blue-500 border-0 text-white opacity-5 text-3xl leading-none font-semibold outline-none focus:outline-none cursor-pointer"
              >
                <span className="bg-transparent text-white opacity-5 h-6 w-6 text-2xl block outline-none focus:outline-none">
                  📸
                </span>
                <input
                  type="file"
                  id="profileImage"
                  accept="image/*"
                  className="hidden"
                />
              </label>

              <img
                src={`${SERVER_BASE_URL}/static/${selectedContact.profile_pic}`}
                alt="Profile"
                className="object-cover w-full h-full"
              />
            </CardHeader>
            <div className="relative p-6 flex-auto">
              <p className="my-4 text-slate-500 text-lg leading-relaxed">
                Email: {selectedContact.email}
              </p>
              <p className="my-4 text-slate-500 text-lg leading-relaxed">
                Date Joined: {selectedContact.date}
              </p>
            </div>
            <div className="flex items-center justify-end p-6 border-t border-solid border-slate-200 rounded-b">
              <button
                className="text-red-500 background-transparent font-bold uppercase px-6 py-2 text-sm outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
                type="button"
                onClick={onClose}
              >
                Close
              </button>
              <button
                className="bg-blue-500 text-white active:bg-emerald-600 font-bold uppercase text-sm px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
                type="button"
                onClick={handleDeleteContact}
              >
                Delete Contact
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="opacity-25 fixed inset-0 z-40 bg-black"></div>
    </>
  );
}
