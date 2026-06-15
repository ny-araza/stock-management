import "./header.css"
import Input from '@mui/material/Input'
import Button from '@mui/material/Button'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faBars, faMoon, faBell, faChevronDown } from "@fortawesome/free-solid-svg-icons"
import IconButton from "@mui/material/IconButton"


function Header() {

    return (
        <>
            <div className="main-header">
                <div className="left">
                    <div className="icon-button">
                        <IconButton aria-label="bars">
                            <FontAwesomeIcon icon={faBars} />
                        </IconButton>
                    </div>
                    <div className="input-header">
                        <Input className="input-header" placeholder="Search type command"></Input>
                    </div>
                </div>
                <div className="right">
                    <IconButton className="icon-button" aria-label="moon">
                        <FontAwesomeIcon icon={faMoon}></FontAwesomeIcon>
                    </IconButton>
                    <IconButton  className="icon-button" aria-label="bell">
                        <FontAwesomeIcon icon={faBell}></FontAwesomeIcon>
                    </IconButton>
                    <div className="profile-header">
                        <Button variant="text">
                            <img className="logo-header" src="logo-stock.png" alt="logo" />
                            <span >Jhon Doe</span>
                            <FontAwesomeIcon className="icon-header" icon={faChevronDown}></FontAwesomeIcon>
                        </Button>
                    </div>
                </div>
            </div>
        </>
    )
}

export default Header
