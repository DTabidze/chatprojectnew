from flask import Flask, render_template, request, session as flask_session
from flask_socketio import SocketIO, send, emit
from flask_cors import CORS
import json
from config import app, db, socketio  # Import from config.py
from models import User, Message, Contact
from random import randrange
from sqlalchemy import and_
from sqlalchemy.exc import IntegrityError

# app = Flask(__name__)
# app.config["SECRET_KEY"] = "your_secret_key"
# socketio = SocketIO(app)
# CORS(
#     app,
#     supports_credentials=True,
# )
# resources={r"/*": {"origins": "http://192.168.1.162:3000"}},

users = {}
GLOBAL_SESSIONS = set()

# socketio.init_app(app, cors_allowed_origins="*")


@socketio.on("connect")
def handle_connect():
    print(f"Client connected SOCKET: {request.sid}")


@socketio.on("login")
def handle_login(data):
    username = data["username"]
    users[request.sid] = username
    print(f"SOCKET User {username} logged in")
    print("SOCKET USERS: ", users)


@socketio.on("message")
def handle_message(message):
    print("MESSAGE SOCKET: ", str(message)[:100])
    print("USERS SOCKET: ", users)
    sender_username = users[request.sid]
    msg = json.loads(message)

    if "text" in msg:
        message_data = {
            "text": msg["text"],
            "sender": sender_username,
        }
        recipient_sid = next(
            (sid for sid, username in users.items() if username == msg["recipient"]),
            None,
        )
        if recipient_sid:
            emit(
                "message", json.dumps(message_data), room=recipient_sid
            )  # Emit as JSON string
        emit(
            "message", json.dumps(message_data), room=request.sid
        )  # Emit as JSON string
        print(message_data)

    if "image" in msg:
        image_data = {
            "image": msg["image"],
            "timestamp": msg["timestamp"],
            "sender": sender_username,
        }
        recipient_sid = next(
            (sid for sid, username in users.items() if username == msg["recipient"]),
            None,
        )
        if recipient_sid:
            emit(
                "message", json.dumps(image_data), room=recipient_sid
            )  # Emit as JSON string
        emit("message", json.dumps(image_data), room=request.sid)  # Emit as JSON string


@socketio.on("disconnect")
def handle_disconnect():
    username = users.get(request.sid)
    if username:
        del users[request.sid]
        print(f"SOCKET User {username} disconnected")


@app.route("/session")
def session():
    user = User.query.filter(User.id == flask_session.get("user_id")).first()
    print(flask_session)
    print(GLOBAL_SESSIONS)
    if (
        "session_id" not in flask_session
        or flask_session["session_id"] not in GLOBAL_SESSIONS
    ):
        return {"error": "Please login"}, 401
    print(flask_session["user_id"])
    return user.to_dict(
        rules=(
            "-contacts_sent.user_first_obj.contacts_received",
            "-contacts_sent.user_first_obj.contacts_sent",
            "-contacts_sent.user_second_obj.contacts_sent",
            "-contacts_sent.user_second_obj.contacts_received",
            "-contacts_received.user_first_obj.contacts_sent",
            "-contacts_received.user_first_obj.contacts_received",
            "-contacts_received.user_second_obj.contacts_sent",
            "-contacts_received.user_second_obj.contacts_received",
        )
    )


@app.route("/login", methods=["POST"])
def login():
    print(request.json)
    errorMsg = {"error": "username/password not on file"}
    username = request.json.get("username")
    password = request.json.get("password_hash")
    user = User.query.filter(User.username == username).first()
    if not user:
        return errorMsg, 401
    if not user.authenticate(password):
        return errorMsg, 401
    flask_session["user_id"] = user.id
    flask_session["session_id"] = randrange(0, 1e18)
    print(flask_session)
    print(flask_session["user_id"], flask_session["session_id"])
    GLOBAL_SESSIONS.add(flask_session["session_id"])
    print(GLOBAL_SESSIONS)
    return user.to_dict(
        rules=(
            "-contacts_sent.user_first_obj.contacts_received",
            "-contacts_sent.user_first_obj.contacts_sent",
            "-contacts_sent.user_second_obj.contacts_sent",
            "-contacts_sent.user_second_obj.contacts_received",
            "-contacts_received.user_first_obj.contacts_sent",
            "-contacts_received.user_first_obj.contacts_received",
            "-contacts_received.user_second_obj.contacts_sent",
            "-contacts_received.user_second_obj.contacts_received",
        )
    )


@app.route("/logout", methods=["DELETE"])
def logout():
    flask_session["user_id"] = None
    print(flask_session["session_id"])
    GLOBAL_SESSIONS.remove(flask_session["session_id"])
    return {}, 204


@app.route("/users/<int:id>", methods=["GET", "PATCH"])
def get_user_by_id(id):
    user = User.query.filter(User.id == id).first()
    print(user)
    if not user:
        return {"error": "user not found"}, 404
    if request.method == "GET":
        return (
            user.to_dict(
                rules=(
                    "-contacts_sent.user_first_obj.contacts_received",
                    "-contacts_sent.user_first_obj.contacts_sent",
                    "-contacts_sent.user_second_obj.contacts_sent",
                    "-contacts_sent.user_second_obj.contacts_received",
                    "-contacts_received.user_first_obj.contacts_sent",
                    "-contacts_received.user_first_obj.contacts_received",
                    "-contacts_received.user_second_obj.contacts_sent",
                    "-contacts_received.user_second_obj.contacts_received",
                )
            ),
            200,
        )
    elif request.method == "PATCH":
        data = request.json
        try:
            for key in data:
                setattr(user, key, data[key])
            db.session.commit()
            return (
                user.to_dict(
                    rules=(
                        "-contacts_sent.user_first_obj.contacts_received",
                        "-contacts_sent.user_first_obj.contacts_sent",
                        "-contacts_sent.user_second_obj.contacts_sent",
                        "-contacts_sent.user_second_obj.contacts_received",
                        "-contacts_received.user_first_obj.contacts_sent",
                        "-contacts_received.user_first_obj.contacts_received",
                        "-contacts_received.user_second_obj.contacts_sent",
                        "-contacts_received.user_second_obj.contacts_received",
                    )
                ),
                200,
            )
        except (IntegrityError, ValueError) as ie:
            return {"error": ie.args}, 422


# GET USERS OR ADD NEW USER AFTER REGISTRATION
@app.route("/users", methods=["GET", "POST"])
def get_users():
    if request.method == "GET":
        # print(flask_session)
        # if flask_session["session_id"] not in GLOBAL_SESSIONS:
        #     # if not user:
        #     return {"error": "Please login"}, 401

        all = User.query.all()
        users = []
        for user in all:
            users.append(
                user.to_dict(
                    rules=(
                        "-contacts_sent.user_first_obj.contacts_received",
                        "-contacts_sent.user_first_obj.contacts_sent",
                        "-contacts_sent.user_second_obj.contacts_sent",
                        "-contacts_sent.user_second_obj.contacts_received",
                        "-contacts_received.user_first_obj.contacts_sent",
                        "-contacts_received.user_first_obj.contacts_received",
                        "-contacts_received.user_second_obj.contacts_sent",
                        "-contacts_received.user_second_obj.contacts_received",
                    )
                )
            )
        return users
    elif request.method == "POST":
        try:
            data = request.json
            user = User()
            for key in data:
                setattr(user, key, data[key])
            db.session.add(user)
            db.session.commit()
            return (
                user.to_dict(
                    rules=(
                        "-contacts_sent.user_first_obj.contacts_received",
                        "-contacts_sent.user_first_obj.contacts_sent",
                        "-contacts_sent.user_second_obj.contacts_sent",
                        "-contacts_sent.user_second_obj.contacts_received",
                        "-contacts_received.user_first_obj.contacts_sent",
                        "-contacts_received.user_first_obj.contacts_received",
                        "-contacts_received.user_second_obj.contacts_sent",
                        "-contacts_received.user_second_obj.contacts_received",
                    )
                ),
                201,
            )
        except (IntegrityError, ValueError) as ie:
            return {"error": ie.args}, 422


# GET ALL MESSAGES OR ADD A NEW ONE
@app.route("/messages", methods=["GET", "POST"])
def message_add_get():
    if request.method == "GET":
        all = Message.query.all()
        messages = []
        for message in all:
            messages.append(message.to_dict())
        return messages, 200
    if request.method == "POST":
        data = request.json
        message = Message()
        try:
            for key in data:
                setattr(message, key, data[key])
            db.session.add(message)
            db.session.commit()
            return message.to_dict(), 201
        except (IntegrityError, ValueError) as ie:
            return {"error": ie.args}, 422


# EDIT OR DELETE MESSAGE
@app.route("/messages/<int:id>", methods=["PATCH", "DELETE"])
def message_edit_remove(id):
    message = Message.query.filter(Message.id == id).first()
    if not message:
        return {}, 404
    elif request.method == "PATCH":
        data = request.json
        try:
            setattr(message, "previous_body", data["body"])
            setattr(message, "modified_date", db.Func.now())
            for key in data:
                setattr(message, key, data[key])
            db.session.commit()
            return message.to_dict(), 200
        except (IntegrityError, ValueError) as ie:
            return {"error": ie.args}, 422
    elif request.method == "DELETE":
        db.session.delete(message)
        db.session.commit()
        return {}, 200


# GET CONTACT LIST, OR ADD NEW
@app.route("/contacts", methods=["GET", "POST"])
def contact_list():
    if request.method == "GET":
        all = Contact.query.all()
        contacts = []
        for contact in all:
            contacts.append(
                contact.to_dict(
                    rules=(
                        "-user_first_obj.contacts_sent.user_first_obj",
                        "-user_first_obj.contacts_sent.user_second_obj",
                        "-user_second_obj.contacts_sent.user_first_obj",
                        "-user_second_obj.contacts_sent.user_second_obj",
                        "-user_first_obj.contacts_received.user_first_obj",
                        "-user_first_obj.contacts_received.user_second_obj",
                        "-user_second_obj.contacts_received.user_first_obj",
                        "-user_second_obj.contacts_received.user_second_obj",
                    )
                )
            )
        return contacts, 200
    elif request.method == "POST":
        try:
            data = request.json
            contact = Contact()
            for key in data:
                setattr(contact, key, data[key])
            db.session.add(contact)
            db.session.commit()
            return (
                contact.to_dict(
                    rules=(
                        "-user_first_obj.contacts_sent.user_first_obj",
                        "-user_first_obj.contacts_sent.user_second_obj",
                        "-user_second_obj.contacts_sent.user_first_obj",
                        "-user_second_obj.contacts_sent.user_second_obj",
                        "-user_first_obj.contacts_received.user_first_obj",
                        "-user_first_obj.contacts_received.user_second_obj",
                        "-user_second_obj.contacts_received.user_first_obj",
                        "-user_second_obj.contacts_received.user_second_obj",
                    )
                ),
                201,
            )
        except (IntegrityError, ValueError) as ie:
            return {"error": ie.args}, 422


# DELETE CONTACT
@app.route("/contacts/<int:id>", methods=["DELETE"])
def contact_delete(id):
    contact = Contact.query.filter(Contact.id == id).first()
    if not contact:
        return {}, 404
    else:
        db.session.delete(contact)
        db.session.commit()
        return {"message": "contact deleted"}, 200


if __name__ == "__main__":
    # app.run(port=5555, debug=True)
    # socketio.run(app, host="192.168.1.162", port=8080, debug=True)
    socketio.run(app, port=8080, host="10.129.3.117", debug=True)
