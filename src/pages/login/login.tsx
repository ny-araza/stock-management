import "./login.css"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faLock } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router";
import Input from "@mui/material/Input";

function Login() {
    const navigate = useNavigate()
    return (
        <>
            <div className="container">
                <div className="bloc-login">
                    <div className="logo-user">
                        <span className="fa-user">
                            <FontAwesomeIcon icon={faUser} />
                        </span>
                    </div>
                    <div className="input">
                        <Input placeholder="username" name="username" id="userame"></Input>
                        <span>
                            <FontAwesomeIcon icon={faUser} />
                        </span>
                    </div>
                    <div className="input">
                        <Input type="password" placeholder="password" name="password" id="password"></Input>
                        <span>
                            <FontAwesomeIcon icon={faLock} />
                        </span>
                    </div>
                    <div className="description">
                        <div className="left">
                            <input type="checkbox" name="remenber" id="" />
                            <span>
                                Remenber me</span>
                        </div>
                        <div className="right">
                            <span><a href="">Forgot password ?</a></span>
                        </div>
                    </div>
                    <div className="bloc-btn">
                        <button className="btn" onClick={() => navigate("/home")}>
                            Login
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}

export default Login;
