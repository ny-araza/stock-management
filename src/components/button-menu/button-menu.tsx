import "./button-menu.css"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faHome, type IconDefinition } from "@fortawesome/free-solid-svg-icons"
import { faChevronCircleDown } from "@fortawesome/free-solid-svg-icons"

function ButtonMenu(props: { children: string, icon: IconDefinition }) {
    return (
        <>
            <button className="button-list-main">
                <span className="icon">
                    <FontAwesomeIcon icon={props.icon ? props.icon : faHome} />
                </span>
                <div className="content">
                    <span className="text-content">{props.children}</span>
                </div>
                <span className="toogle-view">
                    <FontAwesomeIcon icon={faChevronCircleDown} />
                </span>
            </button>
        </>
    )
}

export default ButtonMenu
