import React, { useState } from "react";
import { Avatar } from "@material-ui/core";
import "./Chat.css";
import { useParams } from "react-router-dom";
import { app as firebase, auth } from "../../App/Config/firebase";
import useAsyncEffect from "use-async-effect";
import DoneIcon from "@material-ui/icons/Done";
import DoneAllIcon from "@material-ui/icons/DoneAll";
import { useAuthState } from "react-firebase-hooks/auth";
import {
	getDatabase,
	ref,
	onValue,
	push,
	update,
	child,
	remove,
	set,
} from "firebase/database";

const Chat = (props) => {
	const [userq] = useAuthState(auth);
	const [online, setonline] = useState(false);
	const [oppUser, setoppuser] = useState(null);
	const [lastOnline, setlastOnline] = useState(null);
	const [input, setInput] = useState("");
	const [messages, setMessages] = useState([]);

	// Global Variables on the scope of this component.
	const { chatsId } = useParams();

	// There are various steps on component mount and change of the URL parameter chatsId.
	useAsyncEffect(
		async (isMounted) => {
			let oppuserdata = null;
			if (chatsId) {
				const db = getDatabase();
				const oppUserId = chatsId.split("_")[1];

				// Get the profile info of the opposite user.
				const userDocRef = firebase
					.firestore()
					.collection("users")
					.doc(oppUserId);
				const userDoc = await userDocRef.get();
				if (userDoc.exists) oppuserdata = userDoc.data();

				// Get the status of the opposite user.
				const userConnectionsRef = ref(
					db,
					`users/${oppUserId}/connections`
				);
				onValue(userConnectionsRef, async (userSnap) => {
					const numberOfConnections = userSnap.hasChildren();

					if (numberOfConnections) setonline(true);
					else {
						onValue(ref(db, `users/${oppUserId}`), (snap) => {
							setlastOnline(snap.val().lastOnline);
						});
						setonline(false);
					}
				});

				// Get all messages of chat.
				var msgsRef = ref(db, `users/${userq.uid}/chats/${oppUserId}`);

				onValue(msgsRef, async (snap) => {
					const msgsObj = await snap.val();
					let msgs = [];
					if (msgsObj) {
						msgs = Object.values(msgsObj);
					}
					setMessages(msgs);
				});

				// Set bluetick true if users loads the double tick messages in message body of the user who sent the message.
				// Remove the received msg from the unreadMsgs as user have seen the message.
				const unreadMsgRef = ref(db, `users/${userq.uid}/unreadMsg/`);
				onValue(unreadMsgRef, async (response) => {
					if (response.val()) {
						const unreadMsgs = Object.values(response.val());
						unreadMsgs.forEach(async (el) => {
							if (el.from === oppUserId) {
								const msgRef = ref(
									db,
									`users/${el.from}/chats/${userq.uid}/${el.key}`
								);
								await update(msgRef, {
									blueTick: true,
								});

								await remove(child(unreadMsgRef, el.id));
							}
						});
					}
				});
			}

			if (!isMounted()) return;

			setoppuser(oppuserdata);
		},
		[chatsId]
	);

	const sendMessage = async (e) => {
		e.preventDefault();

		// Opposite User with which chatting is going on.
		const oppUserId = chatsId.split("_")[1];
		const db = getDatabase();
		const chatsUserRef = ref(db, `users/${userq.uid}/chats/${oppUserId}`);
		const newSentMsgRefKey = await push(chatsUserRef).key;

		// Message sent by User itself.
		await set(child(chatsUserRef, newSentMsgRefKey), {
			msg: input,
			from: userq.uid,
			singleTick: true,
			doubleTick: false,
			blueTick: false,
			timestamp: new Date().getTime(),
		});

		// Message sent to the User.
		const chatsOppUserRef = ref(
			db,
			`users/${oppUserId}/chats/${userq.uid}`
		);
		const newMsgRefKey = push(chatsOppUserRef).key;
		await set(child(chatsOppUserRef, newMsgRefKey), {
			from: userq.uid,
			msg: input,
			timestamp: new Date().getTime(),
		});

		// If online, then true double tick at that instant.
		if (online) {
			await update(child(chatsUserRef, newSentMsgRefKey), {
				doubleTick: true,
			});

			// As now this opposite user unread the messages
			// These unread messages will be stored in this users unreadMsgs.
			const unreadMsgRef = ref(db, `users/${oppUserId}/unreadMsg/`);
			const unreadMsgRefKey = push(unreadMsgRef).key;
			await set(child(unreadMsgRef, unreadMsgRefKey), {
				id: unreadMsgRefKey,
				from: userq.uid,
				key: newSentMsgRefKey,
			});
		} else {
			// Store new msgs in oppposite user new msgs.
			const newMsgRef = ref(db, `users/${oppUserId}/newMsg/`);
			const newMsgRefKey = push(newMsgRef).key;
			await set(push(newMsgRef), {
				id: newMsgRefKey,
				from: userq.uid,
				key: newSentMsgRefKey,
			});
		}

		setInput("");
	};

	return (
		<div className="chat">
			{oppUser && (
				<div
					className="chat_header"
					style={{ backgroundColor: "#2B2E32" }}
				>
					<Avatar src={oppUser.photoURL} />
					<div
						className="chat_headerInfo"
						style={{ color: "#DEE0E3" }}
					>
						<h3 className="chat-opposite-user">
							{oppUser.displayName}
						</h3>
						{!online &&
							"Last Seen Online : " +
								new Date(lastOnline).toLocaleString()}
						{online && "Online"}
					</div>
				</div>
			)}
			<div className="chat_body">
				{messages.map((message) => (
					<p
						className={`chat_message ${
							message.from === userq.uid && "chat_receiver"
						}`}
						style={{ color: "#DEE0E3" }}
						key={message.timestamp}
					>
						{message.msg}
						<span className="chat_status">
							{message.blueTick && (
								<span style={{ color: "#34b7f1" }}>
									<DoneAllIcon />
								</span>
							)}
							{!message.blueTick && message.doubleTick && (
								<span>
									<DoneAllIcon />
								</span>
							)}
							{!message.blueTick &&
								!message.doubleTick &&
								message.singleTick && (
									<span>
										<DoneIcon />
									</span>
								)}
						</span>
					</p>
				))}
			</div>
			{oppUser && (
				<div className="chat_footer">
					<form>
						<input
							value={input}
							onChange={(e) => setInput(e.target.value)}
							type="text"
							placeholder="Type a message"
						/>
						<button type="submit" onClick={sendMessage}>
							Send a Message
						</button>
					</form>
				</div>
			)}
		</div>
	);
};

// const mapStateToProps = (state) => {
// 	return { userq: state.firebase.auth };
// };

export default Chat;
