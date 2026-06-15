import "./sidebar.css"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import Button from "@mui/material/Button"
import {
    faChevronDown,
    faBoxArchive,
    faUsers, 
    faShop, 
    faMoneyBill, 
    faFile,
    faChartBar,
    faCircleNodes,
    faBoxOpen,
    faCashRegister

} from "@fortawesome/free-solid-svg-icons"

function SideBar() {
    return (
        <>
            <div className="main-side-bar">
                <div className="header-side-bar">
                    <img className="logo-sidebar" src="logo-stock.png" alt="logo" />
                    <span>Stock</span>
                </div>
                <div className="list-menu-side-bar">
                    <div className="bloc">
                        <span className="sub-tittle">MENU</span>
                    </div>
                    <div className="list">
                        <div className="button-list-menu">
                            <Button variant="text">
                                <div className="left">
                                    <FontAwesomeIcon icon={faChartBar}></FontAwesomeIcon>
                                    <span>Tableau de bord</span>
                                </div>
                                <FontAwesomeIcon icon={faChevronDown}></FontAwesomeIcon>
                            </Button>
                        </div>
                        <div className="button-list-menu">
                            <Button variant="text">
                                <div className="left">
                                    <FontAwesomeIcon icon={faBoxArchive}></FontAwesomeIcon>
                                    <span>Articles</span>
                                </div>
                                <FontAwesomeIcon icon={faChevronDown}></FontAwesomeIcon>
                            </Button>
                        </div>
                        <div className="button-list-menu">
                            <Button variant="text">
                                <div className="left">
                                    <FontAwesomeIcon icon={faUsers}></FontAwesomeIcon>
                                    <span>Clients</span>
                                </div>
                                <FontAwesomeIcon icon={faChevronDown}></FontAwesomeIcon>
                            </Button>
                        </div>
                        <div className="button-list-menu">
                            <Button variant="text">
                                <div className="left">
                                    <FontAwesomeIcon icon={faShop}></FontAwesomeIcon>
                                    <span>Fournisseurs</span>
                                </div>
                                <FontAwesomeIcon icon={faChevronDown}></FontAwesomeIcon>
                            </Button>
                        </div>
                        <div className="button-list-menu">
                            <Button variant="text">
                                <div className="left">
                                    <FontAwesomeIcon icon={faMoneyBill}></FontAwesomeIcon>
                                    <span>Ventes</span>
                                </div>
                                <FontAwesomeIcon icon={faChevronDown}></FontAwesomeIcon>
                            </Button>
                        </div>
                        <div className="button-list-menu">
                            <Button variant="text">
                                <div className="left">
                                    <FontAwesomeIcon icon={faFile}></FontAwesomeIcon>
                                    <span>BC/PROFORMA</span>
                                </div>
                                <FontAwesomeIcon icon={faChevronDown}></FontAwesomeIcon>
                            </Button>
                        </div>
                        <div className="button-list-menu">
                            <Button variant="text">
                                <div className="left">
                                    <FontAwesomeIcon icon={faCircleNodes}></FontAwesomeIcon>
                                    <span>Parametrage</span>
                                </div>
                                <FontAwesomeIcon icon={faChevronDown}></FontAwesomeIcon>
                            </Button>
                        </div>
                        <div className="button-list-menu">
                            <Button variant="text">
                                <div className="left">
                                    <FontAwesomeIcon icon={faBoxOpen}></FontAwesomeIcon>
                                    <span>Stock</span>
                                </div>
                                <FontAwesomeIcon icon={faChevronDown}></FontAwesomeIcon>
                            </Button>
                        </div>
                        <div className="button-list-menu">
                            <Button variant="text">
                                <div className="left">
                                    <FontAwesomeIcon icon={faCashRegister}></FontAwesomeIcon>
                                    <span>Caisse</span>
                                </div>
                                <FontAwesomeIcon icon={faChevronDown}></FontAwesomeIcon>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default SideBar
