import { useEffect, useState } from "react";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import {
  Articles,
  Enumeration,
  Famille,
  FamilleOption,
  SousFamille,
  SousFamilleOption,
} from "../../interfaces/interfaces";
import { SelectField } from "../../components/form/form-elements/inputSearch";
import { Dropdown } from "../../components/ui/dropdown/Dropdown";
import Button from "../../components/ui/button/Button";
import { postData } from "../../services/sendDataService";
import { apiFetch } from "../../services/api";
import { Modal } from "../../components/ui/modal";
import Alert from "../../components/ui/alert/Alert";
import PrixUnitesSection from "./PrixUnitSection";
import { emptyPrixUnites, calculerPrix, PrixUnites } from "./articlesUtils";

export default function NewArticlePage() {
  const emptyArticle: Articles = {
    art_code: "",
    art_codebarre: "",
    art_enabled: true,
    art_fam_id: 0,
    art_id: 0,
    art_lot_id: 0,
    art_marque: "",
    art_nom: "",
    art_poids: "",
    art_sof_id: 0,
    art_stockable: true,
    art_stockmini: 0,
    art_taille: "",
  };

  const [article, setArticle] = useState(emptyArticle);
  const [prixUnites, setPrixUnites] = useState<PrixUnites>(emptyPrixUnites);

  //dropdonwn famille
  const [famille, setFamille] = useState<Famille[]>([]);
  const familleOptions: FamilleOption[] = famille.map((item: Famille) => ({
    ...item,
    value: item.fam_id,
    label: item.fam_nom,
  }));
  const [selectedFamille, setSelectedFamille] = useState<FamilleOption | null>(
    null,
  );
  const [isDropdownOpen_1, setIsDropdownOpen_1] = useState(false);
  function toggleDropdown_1() {
    setIsDropdownOpen_1(!isDropdownOpen_1);
  }
  function closeDropdown_1() {
    setIsDropdownOpen_1(false);
  }
  const [newFamille, setnewFamille] = useState({
    code: "",
    nom: "",
  });
  const [openModalFamille, setOpenModalFamille] = useState(false);
  //end dropdown famille

  // dropdown sous famille
  const [openModalSousFamille, setOpenModalSousFamille] = useState(false);
  const [sousFamille, setSousFamille] = useState<SousFamille[]>([]);
  const sousFamilleOptions: SousFamilleOption[] = sousFamille.map(
    (item: SousFamille) => ({
      ...item,
      value: item.sof_id, // Requis par react-select (ID unique informatique)
      label: item.sof_nom, // Requis par react-select (Le texte affiché à l'écran)
    }),
  );
  const [selectedSousFamille, setSelectedSousFamille] =
    useState<SousFamilleOption | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  function toggleDropdown() {
    setIsDropdownOpen(!isDropdownOpen);
  }
  function closeDropdown() {
    setIsDropdownOpen(false);
  }
  const [newSousFamille, setnewSousFamille] = useState({
    code: "",
    nom: "",
  });
  //end dropdown sous famille

  const [alert, setAlert] = useState({
    open: false,
    variant: "success" as "success" | "error" | "warning" | "info",
    title: "",
    message: "",
  });

  const handleSubmitFamilly = async () => {
    try {
      if (!newFamille.code && !newFamille.nom) return;
      const res = await postData("/api/insert-database/", "t_famille", {
        fam_code: newFamille.code,
        fam_nom: newFamille.nom,
        fam_enabled: 1,
      });
      if (res.status) {
        setAlert({
          open: true,
          title: "Notification",
          message: "Article enregistrer avec succès",
          variant: "success",
        });
      } else {
        setAlert({
          open: true,
          message: res.error,
          title: "Une erreur survenue",
          variant: "error",
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmitSousFamilly = async () => {
    try {
      if (!selectedSousFamille) {
        setAlert({
          open: true,
          title: "Error",
          message: "Veuillez selectionner la famille du sous famille",
          variant: "error",
        });
        return;
      }
      if (!newSousFamille.nom && !newSousFamille.nom) return;
      const res = await postData("/api/insert-database/", "t_sous_famille", {
        sof_code: newSousFamille.code,
        sof_nom: newSousFamille.nom,
        sof_fam_id: selectedFamille?.fam_id,
        sof_enabled: 1,
      });
      if (res.status) {
        setAlert({
          open: true,
          title: "Notification",
          message: `${res.error}`,
          variant: "success",
        });
      } else {
        setAlert({
          open: true,
          message: res.error,
          title: "Une erreur survenue",
          variant: "error",
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchFamille = async () => {
    try {
      const res = await apiFetch(`/api/familles/`);
      if (res.status) {
        setFamille(res.famille);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchSousFamille = async (id_famille: number | null | undefined) => {
    try {
      const query = new URLSearchParams();
      if (id_famille) query.set("search", id_famille.toString());
      const res = await apiFetch(`/api/sous-familles/?${query.toString()}`);
      if (res.status) {
        setSousFamille(res.sous_famille);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const [enumeration, setEnumeration] = useState<Enumeration[]>([]);

  const fetchEnumeration = async (enu_code: string) => {
    try {
      const query = new URLSearchParams();
      query.set("enu_code", enu_code);
      const res = await apiFetch(
        `/api/generate-enumeration/?${query.toString()}`,
      );

      if (res.success) {
        setEnumeration(res.nom_enumeration);
      }
    } catch (error: any) {
      setAlert({
        message: "Error lors du recuperation e l'enumeration",
        open: true,
        title: "Error",
        variant: "error",
      });
    }
  };

  const buildLignesPrix = () =>
    Object.values(prixUnites)
      .filter((u) => u.actif)
      .map((u) => {
        const { marge, prixVente } = calculerPrix(u);
        return {
          pri_unitevente: u.unite === "GROS" ? "Gros" : "Pièce",
          pri_achat: parseFloat(u.prix_achat) || 0,
          pri_tauxmarge: parseFloat(u.taux_marge) || 0,
          pri_marge: marge,
          pri_vte: prixVente,
          pri_tva: parseFloat(u.tva) || 0,
          pri_nbcolis: u.colis || "1",
        };
      });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (
        !article.art_code ||
        !article.art_nom ||
        !selectedFamille ||
        !selectedSousFamille ||
        !article.art_stockmini
      ) {
        setAlert({
          open: true,
          message:
            "Les champs suivant sont requis: Code, designation, famille/sousfamille, stockmini",
          title: "Une erreur s'est produit",
          variant: "error",
        });
        return;
      }
      // Vérification des champs de prix (tous obligatoires sauf colis)
      const champsRequis: {
        key: "prix_achat" | "taux_marge" | "tva";
        label: string;
      }[] = [
        { key: "prix_achat", label: "Prix d'achat" },
        { key: "taux_marge", label: "Taux de marge" },
        { key: "tva", label: "TVA" },
      ];

      const unitesActives = Object.values(prixUnites).filter((u) => u.actif);

      const erreurs: string[] = [];
      unitesActives.forEach((u) => {
        const manquants = champsRequis
          .filter(({ key }) => String(u[key]).trim() === "")
          .map(({ label }) => label);
        if (manquants.length > 0) {
          erreurs.push(
            `${u.unite === "GROS" ? "Gros" : "Pièce"} : ${manquants.join(", ")}`,
          );
        }
      });

      if (erreurs.length > 0) {
        setAlert({
          open: true,
          title: "Champs obligatoires manquants",
          message: erreurs.join(" | "),
          variant: "error",
        });
        return; // aucun enregistrement n'est fait
      }

      const lignesPrix = buildLignesPrix();

      const res = await postData("/api/insert-database/", "t_article", {
        art_code: article.art_code,
        art_nom: article.art_nom,
        art_poids: parseFloat(article.art_poids),
        art_taille: parseFloat(article.art_taille),
        art_stockmini: parseInt(article.art_stockmini),
        art_enabled: article.art_enabled,
        art_fam_id: selectedFamille.fam_id,
        art_sof_id: selectedSousFamille.sof_id,
        art_codebarre: article.art_codebarre,
        art_lot_id: 1,
        art_stockable: article.art_stockable,
        art_marque: article.art_marque,
      });

      if (lignesPrix.some((l) => l.pri_achat <= 0)) {
        setAlert({
          open: true,
          title: "Une erreur s'est produit",
          message: "Veuillez saisir le prix d'achat pour chaque unité de vente",
          variant: "error",
        });
        return;
      }

      if (res.status) {
        // On enregistre les prix seulement si l'article est bien créé
        await Promise.all(
          lignesPrix.map((l) =>
            postData("/api/insert-database/", "t_prix", {
              pri_enabled: 1,
              pri_art_code: article.art_code,
              ...l,
            }),
          ),
        );

        setAlert({
          open: true,
          title: "Notification",
          message: `Article ${article.art_code} enregistré`,
          variant: "success",
        });
        setArticle(emptyArticle)
        setSelectedFamille(null);
        setSelectedSousFamille(null);
        setPrixUnites(emptyPrixUnites); // remplace la boucle supprimerLigne
      } else {
        setAlert({
          open: true,
          title: "Une erreur s'est produit",
          message: `${res.message}`,
          variant: "error",
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchFamille();
    fetchSousFamille(selectedFamille?.fam_id);
    fetchEnumeration("UNITE_VENTE");
  }, [selectedFamille]);

  return (
    <>
      <Modal
        isOpen={openModalFamille}
        onClose={() => setOpenModalFamille(false)}
        className="max-w-md p-6"
      >
        <Label>Ajouter famille</Label>

        <input
          type="text"
          placeholder="Code"
          value={newFamille.code}
          onChange={(e) =>
            setnewFamille((prev) => ({
              ...prev,
              code: e.target.value,
            }))
          }
          className="mb-3 w-full rounded border px-3 py-2 dark:bg-gray-800 dark:text-white"
        />

        <input
          type="text"
          placeholder="Nom"
          value={newFamille.nom}
          onChange={(e) =>
            setnewFamille((prev) => ({
              ...prev,
              nom: e.target.value,
            }))
          }
          className="mb-3 w-full rounded border px-3 py-2 dark:bg-gray-800 dark:text-white"
        />
        <div className="flex justify-center">
          <Button onClick={handleSubmitFamilly}>Valider</Button>
        </div>
      </Modal>

      <Modal
        isOpen={openModalSousFamille}
        onClose={() => setOpenModalSousFamille(false)}
        className="max-w-md p-6"
      >
        <Label>Ajouter sous famille</Label>

        <Label>
          {selectedFamille ? `Pour ${selectedFamille.fam_nom}` : ""}
        </Label>

        <input
          type="text"
          placeholder="Code"
          value={newSousFamille.code}
          onChange={(e) =>
            setnewSousFamille((prev) => ({
              ...prev,
              code: e.target.value,
            }))
          }
          className="mb-3 w-full rounded border px-3 py-2 dark:bg-gray-800 dark:text-white"
        />

        <input
          type="text"
          placeholder="Nom"
          value={newSousFamille.nom}
          onChange={(e) =>
            setnewSousFamille((prev) => ({
              ...prev,
              nom: e.target.value,
            }))
          }
          className="mb-3 w-full rounded border px-3 py-2 dark:bg-gray-800 dark:text-white"
        />
        <div className="flex justify-center">
          <Button onClick={handleSubmitSousFamilly}>Valider</Button>
        </div>
      </Modal>
      <div className="no-scrollbar relative w-full overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
        <div className="px-2 pr-14">
          <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
            Ajouter un article
          </h4>
        </div>
        <form className="flex flex-col" onSubmit={handleSubmit}>
          <div className="custom-scrollbar overflow-y-auto px-2 pb-3">
            <div>
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                <div>
                  <Label>Code</Label>
                  <Input
                    name="code"
                    value={article.art_code}
                    type="text"
                    onChange={(e) => {
                      setArticle((prev) => ({
                        ...prev,
                        art_code: e.target.value,
                      }));
                    }}
                    placeholder="Code de l'article"
                  />
                </div>
                <div>
                  <Label>Désignation</Label>
                  <Input
                    name="designation"
                    value={article.art_nom}
                    onChange={(e) => {
                      setArticle((prev) => ({
                        ...prev,
                        art_nom: e.target.value,
                      }));
                    }}
                    type="text"

                    placeholder="Nom de l'article"
                  />
                </div>
                <div>
                  <Label>Marque</Label>
                  <Input
                    name="marque"
                    value={article.art_marque}
                    onChange={(e) => {
                      setArticle((prev) => ({
                        ...prev,
                        art_marque: e.target.value,
                      }));
                    }}
                    placeholder="Marque de l'article"
                  />
                </div>
                <div>
                  <Label>Stock minimum</Label>
                  <Input
                    name="stockMini"
                    type="text"
                    value={article.art_stockmini}
                    onChange={(e) => {
                      setArticle((prev) => ({
                        ...prev,
                        art_stockmini: e.target.value,
                      }));
                    }}
                    placeholder="Stock minimum"
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
              <div className="col-span-2 lg:col-span-1">
                <Label>Poids</Label>
                <Input
                  type="number"
                  name="poids"
                  value={article.art_poids}
                  onChange={(e) => {
                    setArticle((prev) => ({
                      ...prev,
                      art_poids: e.target.value,
                    }));
                  }}
                  placeholder="en gramme"
                  min="0"
                />
              </div>

              <div className="col-span-2 lg:col-span-1">
                <Label>Taille</Label>
                <Input
                  name="taille"
                  type="number"
                  value={article.art_taille}
                  onChange={(e) => {
                    setArticle((prev) => ({
                      ...prev,
                      art_taille: e.target.value,
                    }));
                  }}
                  placeholder="taille"
                  min="0.00"
                />
              </div>
              <div className="col-span-2 lg:col-span-1 flex">
                <SelectField<FamilleOption>
                  label="Famille"
                  options={familleOptions}
                  value={selectedFamille}
                  onChange={setSelectedFamille}
                  placeholder="Rechercher une famille..."
                  onAddClick={() => setOpenModalFamille(true)}
                />
              </div>
              <div className="col-span-2 lg:col-span-1 flex">
                <SelectField<SousFamilleOption>
                  label="Sous-famille"
                  options={sousFamilleOptions}
                  value={selectedSousFamille}
                  onChange={setSelectedSousFamille}
                  placeholder="sous-famille..."
                  onAddClick={() => setOpenModalSousFamille(true)}
                />
              </div>
            </div>
          </div>
          <PrixUnitesSection value={prixUnites} onChange={setPrixUnites} />
          <div className="flex justify-center mt-5">
            <Button className="mr-2" type="submit">Creer Article</Button>
            <Button className="ml-2" variant="outline">
              Tout effacer
            </Button>
          </div>
        </form>
      </div>
      <Alert
        open={alert.open}
        variant={alert.variant}
        title={alert.title}
        message={alert.message}
        showLink={false}
        onClose={() =>
          setAlert({
            open: false,
            variant: alert.variant,
            message: alert.message,
            title: alert.title,
          })
        }
      />
    </>
  );
}
