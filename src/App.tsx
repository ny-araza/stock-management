import { BrowserRouter as Router, Routes, Route } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import ListClientsTables from "./pages/Clients/listeClientsTables";
import ListArticlesTables from "./pages/Articles/listeArticlesTables";
import ListVentesTables from "./pages/Ventes/listeVentesTables";
import ListBcTables from "./pages/Bc/listeBcTables";
import ListFournisseurTables from "./pages/Fournisseurs/listeFournisseurTables";
import Accueil from "./pages/Home/accueil";
import ExempleUtilisation from "./pages/etatStock/ExempleUtilisation";
import EntreeListeTables from "./pages/stock/entree/listeEntreeTables";

export default function App() {
  return (
    <>
      <Router>
        <ScrollToTop />
        <Routes>
          <Route index path="/" element={<SignIn />} />
          <Route element={<AppLayout />}>
            <Route path="/accueil" element={<Accueil />} />
            <Route path="/clients" element={<ListClientsTables />} />
            <Route path="/articles" element={<ListArticlesTables />} />
            <Route path="ventes" element={<ListVentesTables />} />
            <Route path="/bc" element={<ListBcTables />} />
            <Route path="/fournisseurs" element={<ListFournisseurTables />} />
            <Route path="/stock" element={<ExempleUtilisation />} />
            <Route path="/entree" element={<EntreeListeTables />} />
          </Route>
          <Route path="/signin" element={<SignIn />} />
        </Routes>
      </Router>
    </>
  );
}
