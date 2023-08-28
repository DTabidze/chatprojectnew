import React, { useState } from "react";
import { Link } from "react-router-dom";
import Contact from "./Contact";
import SERVER_BASE_URL from "./config";
import { List, Card } from "@material-tailwind/react";
function ContactList({ loggedInUser, myContacts, handleSelectedContact }) {
  const [isSearchVisible, setSearchVisible] = useState(false);

  function handleSearchVisbility() {
    setSearchVisible(!isSearchVisible);
  }

  console.log("MYCONTACTS CHECK: ", myContacts);

  return (
    <div className="flex-grow overflow-y-hidden">
      <h2 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
        Contact List
        {/* <SVGIcon className="ml-2 cursor-pointer inline-block" /> */}
      </h2>
      {/* <Link
        to="/addnewcontact"
        type="button"
        className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm p-2.5 text-center inline-flex items-center mr-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
      >
        Add Contact
      </Link> */}

      <Card className="w-90">
        <List>
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
        </List>
      </Card>

      {/* <ul
        role="list"
        className="divide-gray-100 max-h-[calc(115vh-320px)] overflow-y-auto"
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
      </ul> */}
    </div>
  );
}

export default ContactList;

{
  /* <Card className="w-96">
  <List>
    <ListItem>
      <ListItemPrefix>
        <Avatar variant="circular" alt="candice" src="/img/face-1.jpg" />
      </ListItemPrefix>
      <div>
        <Typography variant="h6" color="blue-gray">
          Tania Andrew
        </Typography>
        <Typography variant="small" color="gray" className="font-normal">
          Software Engineer @ Material Tailwind
        </Typography>
      </div>
    </ListItem>
  </List>
</Card>;

<ListItem>
  <ListItemPrefix>
    <Avatar variant="circular" alt="candice" src="/img/face-1.jpg" />
  </ListItemPrefix>
  <div>
    <Typography variant="h6" color="blue-gray">
      Tania Andrew
    </Typography>
    <Typography variant="small" color="gray" className="font-normal">
      Software Engineer @ Material Tailwind
    </Typography>
  </div>
</ListItem>; */
}
