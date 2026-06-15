import Header from "../header/header"
import SideBar from "../sidebar/sidebar"
import "./main-layout.css"


function MainLayout() {
    return (
        <>
            <div className="container-bloc">
                <div className="side-bar">
                    <SideBar />
                </div>
                <div className="header-bloc">
                    <Header />
                </div>
            </div>
        </>
    )
}

export default MainLayout
