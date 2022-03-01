import React from "react";
import UserList from "./UserList";
import "./Sidebar.css";
import { Avatar, Box, Button } from "@material-ui/core";
import useAsyncEffect from "use-async-effect";
import { auth, logout } from "../../App/Config/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import {
    getDatabase,
    ref,
    onValue,
    push,
    onDisconnect,
    set,
    serverTimestamp,
} from "firebase/database";

const Sidebar = (props) => {
    const [user] = useAuthState(auth);
    // Setting the status of the user connections in fireabase realtime DB.
    const setStatus = () => {
        const userId = user.uid;
        const db = getDatabase();
        const myConnectionsRef = ref(db, `users/${userId}/connections`);
        const lastOnlineRef = ref(db, `users/${userId}/lastOnline`);

        const connectedRef = ref(db, ".info/connected");
        onValue(connectedRef, (snap) => {
            if (snap.val() === true) {
                // We're connected (or reconnected)! Do anything here that should happen only if online (or on reconnect)
                const con = push(myConnectionsRef);

                // When I disconnect, remove this device
                onDisconnect(con).remove();

                // Add this device to my connections list
                // this value could contain info about the device or a timestamp too
                set(con, true);

                // When I disconnect, update the last time I was seen online.
                onDisconnect(lastOnlineRef).set(serverTimestamp());
            }
        });
    };

    // Calling setStatus methods on component mount
    useAsyncEffect(async (isMounted) => {
        if (!isMounted()) return;

        setStatus();
    }, []);

    // Logout user out of the application and remove all connections
    const handleLogout = async () => {
        const db = getDatabase();
        const myConnectionsRef = ref(db, `users/${user.uid}/connections`);

        onDisconnect(myConnectionsRef).remove();

        const lastOnlineRef = ref(db, `users/${user.uid}/lastOnline`);
        // When LogOut, update the last time I was seen online.
        set(lastOnlineRef, serverTimestamp());

        // logout
        logout();
    };

    return (
        <div className="sidebar">
            <div
                className="sidebar_header"
                style={{ backgroundColor: "#2B2E32" }}
            >
                <Avatar src={auth?.photoURL} />
                <div className="sidebar_headerRight">
                    <Box p="1rem" style={{ color: "#DEE0E3" }}>
                        <strong>{user.displayName}</strong>
                    </Box>
                    <Button
                        variant="contained"
                        size="small"
                        color="primary"
                        onClick={handleLogout}
                    >
                        LogOut
                    </Button>
                </div>
            </div>
            <div className="sidebar_chats">
                <UserList />
            </div>
        </div>
    );
};

export default Sidebar;
