import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import Chat from "../../Features/Chats/Chat";
import HomePage from "../../Features/Home/HomePage";
import Sidebar from "../../Features/Navigation/Sidebar";
import "./App.css";
import { auth } from "../Config/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { CssBaseline } from "@material-ui/core";

const App = () => {
	const [user] = useAuthState(auth);
	const isAuthenticated = user !== null;

	return (
		<div className="app">
			<CssBaseline />
			{!isAuthenticated ? (
				<HomePage />
			) : (
				<div className="app_body">
					<Router>
						<Sidebar />
						<Switch>
							<Route path="/chats/:chatsId">
								<Chat />
							</Route>
							<Route path="/chats">
								<Chat />
							</Route>
						</Switch>
					</Router>
				</div>
			)}
		</div>
	);
};

export default App;
