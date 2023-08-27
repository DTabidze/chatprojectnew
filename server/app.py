from flask import (
    Flask,
    jsonify,
    flash,
    render_template,
    request,
    redirect,
    url_for,
    session as flask_session,
)
from flask_socketio import SocketIO, send, emit
from flask_cors import CORS
import json
import os
from config import (
    app,
    db,
    socketio,
    UPLOAD_FOLDER,
    ALLOWED_EXTENSIONS,
)  # Import from config.py
from models import User, Message, Contact
from random import randrange
from sqlalchemy import and_, or_
from sqlalchemy.exc import IntegrityError
from werkzeug.utils import secure_filename
import uuid
from datetime import datetime

# import eventlet

# eventlet.monkey_patch()

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
            "recipient": msg["recipient"],
            "message_type": msg["message_type"],
            "date": msg["date"],
            "id": msg["id"],
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

    if "image" in msg:
        image_data = {
            "image": msg["image"],
            "timestamp": msg["timestamp"],
            "sender": sender_username,
        }
        print("IMAGE SENT: ", image_data)
        recipient_sid = next(
            (sid for sid, username in users.items() if username == msg["recipient"]),
            None,
        )
        if recipient_sid:
            emit(
                "message", json.dumps(image_data), room=recipient_sid
            )  # Emit as JSON string
        emit("message", json.dumps(image_data), room=request.sid)  # Emit as JSON string


@socketio.on("message_updated")
def handle_message_updated(updated_message, recipient_username):
    recipient_sid = next(
        (sid for sid, username in users.items() if username == recipient_username),
        None,
    )
    if recipient_sid:
        emit("update_message", updated_message, room=recipient_sid)


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
            "-contacts_sent.user_first_obj.-sent_messages",
            "-contacts_sent.user_first_obj.recieved_massages",
            "-contacts_sent.user_second_obj.-sent_messages",
            "-contacts_sent.user_second_obj.recieved_massages",
            "-contacts_received.user_first_obj.-sent_messages",
            "-contacts_received.user_first_obj.recieved_massages",
            "-contacts_received.user_second_obj.-sent_messages",
            "-contacts_received.user_second_obj.recieved_massages",
            "-sent_messages",
            "-recieved_massages",
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
            "-contacts_sent.user_first_obj.-sent_messages",
            "-contacts_sent.user_first_obj.recieved_massages",
            "-contacts_sent.user_second_obj.-sent_messages",
            "-contacts_sent.user_second_obj.recieved_massages",
            "-contacts_received.user_first_obj.-sent_messages",
            "-contacts_received.user_first_obj.recieved_massages",
            "-contacts_received.user_second_obj.-sent_messages",
            "-contacts_received.user_second_obj.recieved_massages",
            "-sent_messages",
            "-recieved_massages",
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
                    "-contacts_sent.user_first_obj.-sent_messages",
                    "-contacts_sent.user_first_obj.recieved_massages",
                    "-contacts_sent.user_second_obj.-sent_messages",
                    "-contacts_sent.user_second_obj.recieved_massages",
                    "-contacts_received.user_first_obj.-sent_messages",
                    "-contacts_received.user_first_obj.recieved_massages",
                    "-contacts_received.user_second_obj.-sent_messages",
                    "-contacts_received.user_second_obj.recieved_massages",
                    "-sent_messages",
                    "-recieved_massages",
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
                        "-contacts_sent.user_first_obj.-sent_messages",
                        "-contacts_sent.user_first_obj.recieved_massages",
                        "-contacts_sent.user_second_obj.-sent_messages",
                        "-contacts_sent.user_second_obj.recieved_massages",
                        "-contacts_received.user_first_obj.-sent_messages",
                        "-contacts_received.user_first_obj.recieved_massages",
                        "-contacts_received.user_second_obj.-sent_messages",
                        "-contacts_received.user_second_obj.recieved_massages",
                        "-sent_messages",
                        "-recieved_massages",
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
                        "-contacts_sent.user_first_obj.-sent_messages",
                        "-contacts_sent.user_first_obj.recieved_massages",
                        "-contacts_sent.user_second_obj.-sent_messages",
                        "-contacts_sent.user_second_obj.recieved_massages",
                        "-contacts_received.user_first_obj.-sent_messages",
                        "-contacts_received.user_first_obj.recieved_massages",
                        "-contacts_received.user_second_obj.-sent_messages",
                        "-contacts_received.user_second_obj.recieved_massages",
                        "-sent_messages",
                        "-recieved_massages",
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
                        "-contacts_sent.user_first_obj.-sent_messages",
                        "-contacts_sent.user_first_obj.recieved_massages",
                        "-contacts_sent.user_second_obj.-sent_messages",
                        "-contacts_sent.user_second_obj.recieved_massages",
                        "-contacts_received.user_first_obj.-sent_messages",
                        "-contacts_received.user_first_obj.recieved_massages",
                        "-contacts_received.user_second_obj.-sent_messages",
                        "-contacts_received.user_second_obj.recieved_massages",
                        "-sent_messages",
                        "-recieved_massages",
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
        sender_id = request.args.get("senderId")
        recipient_id = request.args.get("recipientId")
        print(sender_id, "  IDS    ", recipient_id)
        messages = Message.query.filter(
            or_(
                and_(Message.sender == sender_id, Message.recipient == recipient_id),
                and_(Message.sender == recipient_id, Message.recipient == sender_id),
            )
        ).all()
        print(messages)
        message_dicts = [
            message.to_dict(
                rules=(
                    "-user_sender",
                    "-user_reciver",
                )
            )
            for message in messages
        ]

        return message_dicts, 200
    if request.method == "POST":
        data = request.json
        message = Message()
        try:
            for key in data:
                setattr(message, key, data[key])
            db.session.add(message)
            db.session.commit()
            return (
                message.to_dict(
                    rules=(
                        "-user_sender",
                        "-user_reciver",
                    )
                ),
                201,
            )
        except (IntegrityError, ValueError) as ie:
            return {"error": ie.args}, 422


# EDIT OR DELETE MESSAGE
@app.route("/messages/<int:id>", methods=["PATCH", "DELETE"])
def message_edit_remove(id):
    message = Message.query.filter(Message.id == id).first()
    print("SHOULD BE EDITED: ", message)
    if not message:
        return {}, 404
    elif request.method == "PATCH":
        data = request.json
        print("PATCHING: ", data)
        try:
            for key in data:
                if key != "date" and key != "modified_date":
                    setattr(message, key, data[key])

            db.session.commit()
            return (
                message.to_dict(
                    rules=(
                        "-user_sender",
                        "-user_reciver",
                    )
                ),
                200,
            )
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
                        "-user_first_obj.-sent_messages",
                        "-user_first_obj.recieved_massages",
                        "-user_second_obj.-sent_messages",
                        "-user_second_obj.recieved_massages",
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
                        "-user_first_obj.-sent_messages",
                        "-user_first_obj.recieved_massages",
                        "-user_second_obj.-sent_messages",
                        "-user_second_obj.recieved_massages",
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


# UPLOAD IMAGE FILE


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route("/uploadimage", methods=["GET", "POST"])
def upload_file():
    if request.method == "POST":
        print(request.files)
        # check if the post request has the file part
        if "file" not in request.files:
            flash("No file part")
            return redirect(request.url)
        file = request.files["file"]
        print(file)
        # if user does not select file, browser also
        # submit an empty part without filename
        if file.filename == "":
            flash("No selected file")
            return redirect(request.url)
        if file and allowed_file(file.filename):
            # Generate a unique filename using UUID
            unique_filename = str(uuid.uuid4()) + "_" + secure_filename(file.filename)
            print(unique_filename)
            file.save(os.path.join(UPLOAD_FOLDER, unique_filename))
            print("DONE")
            # return redirect(url_for("uploaded_file", filename=unique_filename))
            return {"filename": unique_filename}
    return {}


# UPLOAD AUDIO


# def allowed_file(filename):
#     return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


# @app.route("/uploadaudio", methods=["POST"])
# def upload_audio():
#     if request.method == "POST":
#         print(request.files)
#         # check if the post request has the file part
#         if "file" not in request.files:
#             flash("No file part")
#             return {"error": "No file part"}
#         file = request.files["file"]
#         print(file)
#         # if user does not select file, browser also
#         # submit an empty part without filename
#         if file.filename == "":
#             flash("No selected file")
#             return {"error": "No selected file"}
#         if file and allowed_file(file.filename):
#             # Generate a unique filename using UUID
#             unique_filename = str(uuid.uuid4()) + "_" + secure_filename(file.filename)
#             print(unique_filename)
#             file.save(os.path.join(UPLOAD_FOLDER, unique_filename))
#             print("DONE")
#             return {"filename": unique_filename}
#         else:
#             return {"error": "Invalid file format"}
#     return {"error": "Invalid request method"}


if __name__ == "__main__":
    # app.run(port=5555, debug=True)
    # socketio.run(app, host="192.168.1.162", port=8080, debug=True)
    socketio.run(app, port=8080, host="10.1.50.53", debug=True, log_output=True)
