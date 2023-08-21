const Contact = ({ contact, handleSelectedContact }) => {
  return (
    <div onClick={() => handleSelectedContact(contact)}>
      <li className="flex justify-between gap-x-6 py-5">
        <div className="flex min-w-0 gap-x-4">
          <img
            className="h-12 w-12 flex-none rounded-full bg-gray-50"
            // src={contact.imageUrl}
            alt=""
          />
          <div className="min-w-0 flex-auto">
            <p className="text-sm font-semibold leading-6 text-gray-900">
              {contact.fname + " " + contact.lname}
            </p>
            <p className="mt-1 truncate text-xs leading-5 text-gray-500">
              {contact.email}
            </p>
          </div>
        </div>
      </li>
    </div>
  );
};

export default Contact;
