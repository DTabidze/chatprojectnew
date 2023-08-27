import SERVER_BASE_URL from "./config";
import {
  ListItem,
  ListItemPrefix,
  Avatar,
  Typography,
} from "@material-tailwind/react";
const Contact = ({ contact, handleSelectedContact }) => {
  return (
    <div onClick={() => handleSelectedContact(contact)}>
      <ListItem>
        <ListItemPrefix>
          <Avatar
            variant="circular"
            alt="candice"
            withBorder={true}
            color="green"
            className="p-0.5"
            src={`${SERVER_BASE_URL}/static/${contact.profile_pic}`}
          />
        </ListItemPrefix>
        <div>
          <Typography variant="h6" color="blue-gray">
            {contact.fname + " " + contact.lname}
          </Typography>
          <Typography variant="small" color="gray" className="font-normal">
            {contact.status}
          </Typography>
        </div>
      </ListItem>
      {/* <li className="flex justify-between gap-x-6 py-5">
        <div className="flex min-w-0 gap-x-4">
          <img
            className="h-12 w-12 flex-none rounded-full bg-gray-50"
            src={`${SERVER_BASE_URL}/static/${contact.profile_pic}`}
            alt=""
          />
          <div className="min-w-0 flex-auto">
            <p className="text-sm font-semibold leading-6 text-gray-900">
              {contact.fname + " " + contact.lname}
            </p>
            <p className="mt-1 truncate text-xs leading-5 text-gray-500">
              {contact.status}
            </p>
          </div>
        </div>
      </li> */}
    </div>
  );
};

export default Contact;
