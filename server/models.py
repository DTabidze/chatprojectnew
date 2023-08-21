from config import db, flask_bcrypt
from sqlalchemy_serializer import SerializerMixin
from sqlalchemy.ext.associationproxy import association_proxy
from sqlalchemy.orm import validates
from sqlalchemy import DateTime
import re
from sqlalchemy.ext.hybrid import hybrid_property


class User(db.Model, SerializerMixin):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String, nullable=False, unique=True)
    _password_hash = db.Column(db.String, nullable=False)
    fname = db.Column(db.String, nullable=False)
    lname = db.Column(db.String, nullable=False)
    email = db.Column(db.String, nullable=False)
    status = db.Column(db.String, default="offline", nullable=False)
    date = db.Column(db.DateTime, default=db.func.now())

    # RELATIONSHIPS
    # Establish relationship to Contact model (user_first)
    contacts_sent = db.relationship(
        "Contact",
        foreign_keys="Contact.user_first",
        back_populates="user_first_obj",
    )

    # Establish relationship to Contact model (user_second)
    contacts_received = db.relationship(
        "Contact",
        foreign_keys="Contact.user_second",
        back_populates="user_second_obj",
    )
    # Establish relationship to Message model (sender)
    sent_messages = db.relationship(
        "Message", foreign_keys="Message.sender", back_populates="user_sender"
    )

    recieved_massages = db.relationship(
        "Message", foreign_keys="Message.reciever", back_populates="user_reciver"
    )

    # RULES
    serilizer_rules = (
        "-contacts_sent.user_first_obj.contacts_received",
        "-contacts_sent.user_first_obj.contacts_sent",
        "-contacts_sent.user_second_obj.contacts_sent",
        "-contacts_sent.user_second_obj.contacts_received",
        "-contacts_received.user_first_obj.contacts_sent",
        "-contacts_received.user_first_obj.contacts_received",
        "-contacts_received.user_second_obj.contacts_sent",
        "-contacts_received.user_second_obj.contacts_received",
    )

    @hybrid_property
    def password_hash(self):
        raise ValueError("Password hash is private")

    @password_hash.setter
    def password_hash(self, password):
        self._password_hash = flask_bcrypt.generate_password_hash(password).decode(
            "utf-8"
        )

    def authenticate(self, password):
        return flask_bcrypt.check_password_hash(self._password_hash, password)

    serialize_rules = ("-_password_hash",)


class Message(db.Model, SerializerMixin):
    __tablename__ = "messages"

    id = db.Column(db.Integer, primary_key=True)
    sender = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    reciever = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    message_type = db.Column(db.Integer, nullable=False)
    date = db.Column(db.DateTime, default=db.func.now())
    body = db.Column(db.String, nullable=False)
    seen = db.Column(db.String, default="False", nullable=False)
    reaction_emoji = db.Column(db.String, default=None)
    modified_date = db.Column(db.DateTime, default=None)
    previous_body = db.Column(db.String, default=None)

    # Relationships
    user_sender = db.relationship(
        "User", foreign_keys="Message.sender", back_populates="sent_messages"
    )

    user_reciver = db.relationship(
        "User", foreign_keys="Message.reciever", back_populates="recieved_massages"
    )

    # Rules

    serialize_rules = (
        "-user_sender.sent_messages.user_sender",
        "-user_sender.sent_messages.user_reciver",
        "-user_reciver.recieved_massages.user_reciver",
        "-user_reciver.recieved_massages.user_sender",
    )


class Contact(db.Model, SerializerMixin):
    __tablename__ = "contacts"

    id = db.Column(db.Integer, primary_key=True)
    user_first = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    user_second = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    status = db.Column(db.String, default="pending", nullable=False)
    date = db.Column(db.DateTime, default=db.func.now())

    # RELATIONSHIPS
    # Establish relationship to User model (user_first)
    user_first_obj = db.relationship(
        "User",
        foreign_keys="Contact.user_first",
        back_populates="contacts_sent",
    )
    # Establish relationship to User model (user_second)
    user_second_obj = db.relationship(
        "User",
        foreign_keys="Contact.user_second",
        back_populates="contacts_received",
    )

    serialize_rules = (
        "-user_first_obj.contacts_sent",
        "-user_second_obj.contacts_received",
    )
