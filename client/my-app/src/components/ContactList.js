import React, { useState } from "react";
import { Link } from "react-router-dom";
import Contact from "./Contact";
import SERVER_BASE_URL from "./config";
function ContactList({ loggedInUser, myContacts, handleSelectedContact }) {
  const [isSearchVisible, setSearchVisible] = useState(false);

  function handleSearchVisbility() {
    setSearchVisible(!isSearchVisible);
  }

  console.log("MYCONTACTS CHECK: ", myContacts);

  return (
    <div className="flex-grow overflow-y-hidden">
      <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
        Contact List
        {/* <SVGIcon className="ml-2 cursor-pointer inline-block" /> */}
      </h2>
      <Link
        to="/addnewcontact"
        type="button"
        className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm p-2.5 text-center inline-flex items-center mr-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
      >
        Add Contact
      </Link>
      <div>
        <label className="relative block">
          <span className="sr-only">Search</span>
          <span className="absolute inset-y-0 left-0 flex items-center pl-2">
            <svg className="h-5 w-5 fill-slate-300" viewBox="0 0 20 20">
              whatever
            </svg>
          </span>
          <input
            className="placeholder:italic placeholder:text-slate-400 block bg-white w-full border border-slate-300 rounded-md py-2 pl-9 pr-3 shadow-sm focus:outline-none focus:border-sky-500 focus:ring-sky-500 focus:ring-1 sm:text-sm"
            placeholder="Search for New Contact..."
            type="text"
            name="search"
          />
        </label>
      </div>
      <ul
        role="list"
        className="divide-gray-100 flex-grow overflow-y-auto max-h-[calc(100vh-300px)]"
      >
        {myContacts && myContacts.length > 0 ? (
          myContacts.map((contact) => (
            <Contact
              key={contact.username}
              contact={contact}
              handleSelectedContact={handleSelectedContact}
            />
          ))
        ) : (
          <p>No contacts available.</p>
        )}
      </ul>
    </div>
  );
}

export default ContactList;
