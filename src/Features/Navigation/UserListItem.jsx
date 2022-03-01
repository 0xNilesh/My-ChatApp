import {
    Avatar,
    ListItem,
    ListItemIcon,
    ListItemText,
    Typography,
} from "@material-ui/core";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { auth } from "../../App/Config/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { withStyles } from "@material-ui/core/styles";
import {
    getDatabase,
    ref,
    onValue,
    push,
    update,
    get,
    child,
    remove,
    set,
} from "firebase/database";

const CustomTextTypography = withStyles({
    root: {
        color: "#DEE0E3",
    },
})(Typography);

const UserListItem = (props) => {
    const [online, setonline] = useState(false);
    const { user } = props;
    const [userq] = useAuthState(auth);

    // On component mount set the user status & check for messages.
    useEffect(() => {
        const db = getDatabase();
        const userConnectionsRef = ref(db, `users/${user.id}/connections`);
        onValue(userConnectionsRef, async (userSnap) => {
            const numberOfConnections = userSnap.hasChildren();

            if (numberOfConnections) {
                // Check if there are newMsgs
                const newMsgRef = ref(db, `users/${user.id}/newMsg/`);
                const response = await get(newMsgRef);
                if (response.val()) {
                    const newMsgs = Object.values(response.val());

                    // Foreach newMsg report the sender that this user got the message.
                    // Set the doubleTick true in message body of the user who sent the message.
                    newMsgs.forEach(async (el) => {
                        const msgRef = ref(
                            db,
                            `users/${el.from}/chats/${user.id}/${el.key}`
                        );
                        await update(msgRef, {
                            doubleTick: true,
                        });

                        // As now this user received the messages
                        // These received messages will be stored in this users recMsgs
                        const unreadMsgRef = ref(
                            db,
                            `users/${user.id}/unreadMsg/`
                        );
                        const unreadMsgRefKey = push(unreadMsgRef).key;
                        await set(child(unreadMsgRef, unreadMsgRefKey), {
                            id: unreadMsgRefKey,
                            from: el.from,
                            key: el.key,
                        });
                    });
                    await remove(newMsgRef);
                }
                setonline(true);
            } else setonline(false);
        });
    });

    return (
        <div>
            <Link to={"/chats/" + userq.uid + "_" + user.id}>
                <ListItem button>
                    <ListItemIcon>
                        <Avatar alt={user.displayName} src={user.photoURL} />
                    </ListItemIcon>
                    <ListItemText>
                        <CustomTextTypography variant="body1">
                            <strong>{user.displayName}</strong>
                        </CustomTextTypography>
                        {online && (
                            <Typography variant="body2" color="secondary">
                                Online
                            </Typography>
                        )}
                        {!online && (
                            <Typography variant="body2" color="secondary">
                                Offline
                            </Typography>
                        )}
                    </ListItemText>
                </ListItem>
            </Link>
        </div>
    );
};

export default UserListItem;
