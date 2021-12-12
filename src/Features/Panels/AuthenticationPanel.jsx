import React, { Component } from "react";
import OAuthPanel from "./OAuthPanel";
import { Typography } from "@material-ui/core";
import { googleLogin } from "../../App/Config/firebase";

class AuthenticationPanel extends Component {
	render() {
		return (
			<div style={{ margin: "2rem 0" }}>
				<Typography>Login/Register with Google</Typography>
				<OAuthPanel googleLogin={googleLogin} />
			</div>
		);
	}
}

export default AuthenticationPanel;
