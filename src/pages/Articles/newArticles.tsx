import { useEffect, useState } from "react";
import { useParams } from "react-router";

import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";

import {
  Articles,
  Famille,
  FamilleOption,
  SousFamille,
  SousFamilleOption,
  Enumeration,
  PrixArticle,
} from "../../interfaces/interfaces";

import { SelectField } from "../../components/form/form-elements/inputSearch";
import Button from "../../components/ui/button/Button";
import { postData } from "../../services/sendDataService";
import { apiFetch } from "../../services/api";
import { Modal } from "../../components/ui/modal";
import Alert from "../../components/ui/alert/Alert";

import PrixUnitesSection from "./PrixUnitSection";
import { emptyPrixUnites, calculerPrix, PrixUnites } from "./articlesUtils";

interface ArticleAvecPrix extends Articles {
  prix: PrixArticle[];
}

export default function NewArticlePage() {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

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
    art_datecre: "",
    art_datemdf: "",
    art_usercre: "",
    art_usermdf: "",
  };

  const [article, setArticle] = useState<Articles>(emptyArticle);
  const [prixUnites, setPrixUnites] = useState<PrixUnites>(emptyPrixUnites);

  const [loadingArticle, setLoadingArticle] = useState(false);

  // FAMILLES
  const [famille, setFamille] = useState<Famille[]>([]);

  const familleOptions: FamilleOption[] = famille.map((item) => ({
    ...item,
    value: item.fam_id,
    label: item.fam_nom,
  }));

  const [selectedFamille, setSelectedFamille] = useState<FamilleOption | null>(
    null,
  );

  const [openModalFamille, setOpenModalFamille] = useState(false);

  const [newFamille, setNewFamille] = useState({
    code: "",
    nom: "",
  });

  // SOUS-FAMILLES
  const [openModalSousFamille, setOpenModalSousFamille] = useState(false);

  const [sousFamille, setSousFamille] = useState<SousFamille[]>([]);

  const sousFamilleOptions: SousFamilleOption[] = sousFamille.map((item) => ({
    ...item,
    value: item.sof_id,
    label: item.sof_nom,
  }));

  const [selectedSousFamille, setSelectedSousFamille] =
    useState<SousFamilleOption | null>(null);

  const [newSousFamille, setNewSousFamille] = useState({
    code: "",
    nom: "",
  });

  const [alert, setAlert] = useState({
    open: false,
    variant: "success" as "success" | "error" | "warning" | "info",
    title: "",
    message: "",
  });

  const [enumeration, setEnumeration] = useState<Enumeration[]>([]);

  // ALERTES
  const showAlert = (
    title: string,
    message: string,
    variant: "success" | "error" | "warning" | "info",
  ) => {
    setAlert({
      open: true,
      title,
      message,
      variant,
    });
  };

  // RECUPERATION DES FAMILLES
  const fetchFamille = async () => {
    try {
      const res = await apiFetch("/api/familles/");

      if (res.status) {
        setFamille(res.famille);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // RECUPERATION DES SOUS-FAMILLES
  const fetchSousFamille = async (
    id_famille: number | null | undefined,
  ): Promise<SousFamille[]> => {
    try {
      const query = new URLSearchParams();

      if (id_famille) {
        query.set("search", id_famille.toString());
      }

      const res = await apiFetch(`/api/sous-familles/?${query.toString()}`);

      if (res.status) {
        setSousFamille(res.sous_famille);
        return res.sous_famille;
      }

      return [];
    } catch (error) {
      console.error(error);
      return [];
    }
  };

  // RECUPERATION DES ENUMERATIONS
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
    } catch (error) {
      console.error(error);

      showAlert(
        "Erreur",
        "Erreur lors de la récupération de l'énumération",
        "error",
      );
    }
  };

  // PREPARER LES PRIX DES UNITES
  const remplirPrixUnites = (prixArticle: PrixArticle[]) => {
    const updated: PrixUnites = {
      PIECE: { ...emptyPrixUnites.PIECE },
      GROS: { ...emptyPrixUnites.GROS },
    };

    prixArticle.forEach((item) => {
      const unite = String(item.pri_unitevente).toLowerCase().trim();

      let typeUnite: "PIECE" | "GROS" | null = null;

      if (["pièce", "piece", "unité", "unite"].includes(unite)) {
        typeUnite = "PIECE";
      }

      if (["gros", "carton"].includes(unite)) {
        typeUnite = "GROS";
      }

      if (!typeUnite) return;

      const achat = Number(item.pri_achat) || 0;
      const vente = Number(item.pri_vte) || 0;

      const tauxMarge = achat > 0 ? ((vente - achat) / achat) * 100 : 0;

      updated[typeUnite] = {
        unite: typeUnite,
        actif: true,
        prix_achat: String(achat),
        taux_marge: tauxMarge.toFixed(2),
        tva: String(item.pri_tva ?? 0),
        colis: String(item.pri_nbcolis ?? ""),
      };
    });

    setPrixUnites(updated);
  };

  // RECUPERATION DE L'ARTICLE POUR MODIFICATION
  const fetchArticle = async () => {
    if (!id) return;

    setLoadingArticle(true);

    try {
      const res = await apiFetch(`/api/articles/${id}`);

      if (!res.status || !res.article) {
        throw new Error("Impossible de récupérer les articles");
      }

      const articles: ArticleAvecPrix = res.article;

      if (!articles) {
        throw new Error("Article introuvable");
      }

      // INFORMATIONS GENERALES
      setArticle({
        art_id: articles.art_id,
        art_code: articles.art_code,
        art_nom: articles.art_nom,
        art_datecre: articles.art_datecre,
        art_datemdf: articles.art_datemdf,
        art_usercre: articles.art_usercre,
        art_usermdf: articles.art_usermdf,
        art_poids: articles.art_poids ?? "",
        art_taille: articles.art_taille ?? "",
        art_stockmini: articles.art_stockmini,
        art_enabled: Boolean(articles.art_enabled),
        art_fam_id: articles.art_fam_id,
        art_sof_id: articles.art_sof_id,
        art_codebarre: articles.art_codebarre ?? "",
        art_lot_id: articles.art_lot_id,
        art_stockable: Boolean(articles.art_stockable),
        art_marque: articles.art_marque ?? "",
      });

      // PRIX
      remplirPrixUnites(articles.prix);

      // FAMILLES
      const familleRes = await apiFetch("/api/familles/");

      if (familleRes.status) {
        setFamille(familleRes.famille);

        const familleTrouvee = familleRes.famille.find(
          (f: Famille) => f.fam_id === articles.art_fam_id,
        );

        if (familleTrouvee) {
          setSelectedFamille({
            ...familleTrouvee,
            value: familleTrouvee.fam_id,
            label: familleTrouvee.fam_nom,
          });
        }
      }

      // SOUS-FAMILLES
      const sousFamilles = await fetchSousFamille(articles.art_fam_id);

      const sousFamilleTrouvee = sousFamilles.find(
        (sf) => sf.sof_id === articles.art_sof_id,
      );

      if (sousFamilleTrouvee) {
        setSelectedSousFamille({
          ...sousFamilleTrouvee,
          value: sousFamilleTrouvee.sof_id,
          label: sousFamilleTrouvee.sof_nom,
        });
      }
    } catch (error) {
      console.error("Erreur récupération article :", error);

      showAlert(
        "Erreur",
        "Impossible de charger les informations de cet article.",
        "error",
      );
    } finally {
      setLoadingArticle(false);
    }
  };

  // AJOUT FAMILLE
  const handleSubmitFamilly = async () => {
    try {
      if (!newFamille.code || !newFamille.nom) return;

      const res = await postData("/api/insert-database/", "t_famille", {
        fam_code: newFamille.code,
        fam_nom: newFamille.nom,
        fam_enabled: 1,
      });

      if (res.status) {
        showAlert("Notification", "Famille enregistrée avec succès", "success");

        setNewFamille({ code: "", nom: "" });
        setOpenModalFamille(false);
        await fetchFamille();
      } else {
        showAlert(
          "Erreur",
          res.error || "Erreur lors de l'enregistrement",
          "error",
        );
      }
    } catch (error) {
      console.error(error);
    }
  };

  // AJOUT SOUS-FAMILLE
  const handleSubmitSousFamilly = async () => {
    try {
      if (!selectedFamille) {
        showAlert(
          "Erreur",
          "Veuillez sélectionner la famille de la sous-famille",
          "error",
        );
        return;
      }

      if (!newSousFamille.code || !newSousFamille.nom) return;

      const res = await postData("/api/insert-database/", "t_sous_famille", {
        sof_code: newSousFamille.code,
        sof_nom: newSousFamille.nom,
        sof_fam_id: selectedFamille.fam_id,
        sof_enabled: 1,
      });

      if (res.status) {
        showAlert(
          "Notification",
          "Sous-famille enregistrée avec succès",
          "success",
        );

        setNewSousFamille({ code: "", nom: "" });
        setOpenModalSousFamille(false);

        await fetchSousFamille(selectedFamille.fam_id);
      } else {
        showAlert(
          "Erreur",
          res.error || "Erreur lors de l'enregistrement",
          "error",
        );
      }
    } catch (error) {
      console.error(error);
    }
  };

  // CONSTRUIRE LES LIGNES DE PRIX
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

  // VIDER LE FORMULAIRE
  const clear = () => {
    setArticle(emptyArticle);
    setSelectedFamille(null);
    setSelectedSousFamille(null);
    setPrixUnites(emptyPrixUnites);
  };

  // ENREGISTREMENT / MODIFICATION
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (
        !article.art_code ||
        !article.art_nom ||
        !selectedFamille ||
        !selectedSousFamille
      ) {
        showAlert(
          "Erreur",
          "Les champs Code, Désignation, Famille et Sous-famille sont requis.",
          "error",
        );
        return;
      }

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
        showAlert(
          "Champs obligatoires manquants",
          erreurs.join(" | "),
          "error",
        );
        return;
      }

      const lignesPrix = buildLignesPrix();

      if (lignesPrix.length === 0 || lignesPrix.some((l) => l.pri_achat <= 0)) {
        showAlert(
          "Erreur",
          "Veuillez saisir un prix d'achat valide pour chaque unité de vente.",
          "error",
        );
        return;
      }

      const articleData = {
        art_code: article.art_code,
        art_nom: article.art_nom,
        art_poids: parseFloat(article.art_poids) || 0,
        art_taille: parseFloat(article.art_taille) || 0,
        art_stockmini: Number(article.art_stockmini) || 0,
        art_enabled: article.art_enabled ? 1 : 0,
        art_fam_id: selectedFamille.fam_id,
        art_sof_id: selectedSousFamille.sof_id,
        art_codebarre: article.art_codebarre,
        art_lot_id: article.art_lot_id || 1,
        art_stockable: article.art_stockable ? 1 : 0,
        art_marque: article.art_marque,
      };

      if (isEditing) {
        const payload = {
          ...articleData,
          prix: lignesPrix.map((ligne) => ({
            ...ligne,
            pri_nbcolis: Number(ligne.pri_nbcolis) || 1,
          })),
        };

        const res = await apiFetch(`/api/articles/${id}/`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!res.status) {
          throw new Error(
            res.message ||
              res.error ||
              "Erreur lors de la modification de l'article",
          );
        }

        showAlert(
          "Modification réussie",
          `L'article ${article.art_code} a été modifié avec succès.`,
          "success",
        );

        return;
      }

      // CREATION ARTICLE
      const res = await postData(
        "/api/insert-database/",
        "t_article",
        articleData,
      );

      if (!res.status) {
        throw new Error(res.message || res.error || "Erreur création article");
      }

      // CREATION DES PRIX
      const resultatsPrix = await Promise.all(
        lignesPrix.map((l) =>
          postData("/api/insert-database/", "t_prix", {
            pri_enabled: 1,
            pri_art_code: article.art_code,
            ...l,
          }),
        ),
      );

      const erreurPrix = resultatsPrix.find((resultat) => !resultat.status);

      if (erreurPrix) {
        throw new Error(
          erreurPrix.error || "Erreur lors de l'enregistrement des prix",
        );
      }

      showAlert(
        "Notification",
        `Article ${article.art_code} enregistré avec succès`,
        "success",
      );

      clear();
    } catch (error) {
      console.error(error);

      showAlert(
        "Erreur",
        error instanceof Error ? error.message : "Une erreur est survenue",
        "error",
      );
    }
  };

  // CHARGEMENT INITIAL
  useEffect(() => {
    fetchEnumeration("UNITE_VENTE");

    if (isEditing) {
      fetchArticle();
    } else {
      fetchFamille();
      fetchSousFamille(undefined);
    }
  }, [id]);

  return (
    <>
      {/* MODAL FAMILLE */}
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
            setNewFamille((prev) => ({
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
            setNewFamille((prev) => ({
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

      {/* MODAL SOUS-FAMILLE */}
      <Modal
        isOpen={openModalSousFamille}
        onClose={() => setOpenModalSousFamille(false)}
        className="max-w-md p-6"
      >
        <Label>Ajouter sous-famille</Label>

        <Label>
          {selectedFamille ? `Pour ${selectedFamille.fam_nom}` : ""}
        </Label>

        <input
          type="text"
          placeholder="Code"
          value={newSousFamille.code}
          onChange={(e) =>
            setNewSousFamille((prev) => ({
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
            setNewSousFamille((prev) => ({
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
            {isEditing ? "Modifier un article" : "Ajouter un article"}
          </h4>
        </div>

        {loadingArticle ? (
          <div className="flex justify-center p-10">
            Chargement des informations de l'article...
          </div>
        ) : (
          <form className="flex flex-col" onSubmit={handleSubmit}>
            <div className="custom-scrollbar overflow-y-auto px-2 pb-3">
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                <div>
                  <Label>Code</Label>
                  <Input
                    name="code"
                    value={article.art_code}
                    type="text"
                    onChange={(e) =>
                      setArticle((prev) => ({
                        ...prev,
                        art_code: e.target.value,
                      }))
                    }
                    placeholder="Code de l'article"
                  />
                </div>

                <div>
                  <Label>Désignation</Label>
                  <Input
                    name="designation"
                    value={article.art_nom}
                    onChange={(e) =>
                      setArticle((prev) => ({
                        ...prev,
                        art_nom: e.target.value,
                      }))
                    }
                    type="text"
                    placeholder="Nom de l'article"
                  />
                </div>

                <div>
                  <Label>Marque</Label>
                  <Input
                    name="marque"
                    value={article.art_marque}
                    onChange={(e) =>
                      setArticle((prev) => ({
                        ...prev,
                        art_marque: e.target.value,
                      }))
                    }
                    placeholder="Marque de l'article"
                  />
                </div>

                <div>
                  <Label>Stock minimum</Label>
                  <Input
                    name="stockMini"
                    type="number"
                    value={String(article.art_stockmini)}
                    onChange={(e) =>
                      setArticle((prev) => ({
                        ...prev,
                        art_stockmini: Number(e.target.value),
                      }))
                    }
                    placeholder="Stock minimum"
                  />
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                <div>
                  <Label>Poids</Label>
                  <Input
                    type="number"
                    name="poids"
                    value={article.art_poids}
                    onChange={(e) =>
                      setArticle((prev) => ({
                        ...prev,
                        art_poids: e.target.value,
                      }))
                    }
                    placeholder="en gramme"
                    min="0"
                  />
                </div>

                <div>
                  <Label>Taille</Label>
                  <Input
                    name="taille"
                    type="number"
                    value={article.art_taille}
                    onChange={(e) =>
                      setArticle((prev) => ({
                        ...prev,
                        art_taille: e.target.value,
                      }))
                    }
                    placeholder="taille"
                    min="0"
                  />
                </div>

                <div className="flex">
                  <SelectField<FamilleOption>
                    label="Famille"
                    options={familleOptions}
                    value={selectedFamille}
                    onChange={(value) => {
                      setSelectedFamille(value);
                      setSelectedSousFamille(null);
                      fetchSousFamille(value?.fam_id);
                    }}
                    placeholder="Rechercher une famille..."
                    onAddClick={() => setOpenModalFamille(true)}
                  />
                </div>

                <div className="flex">
                  <SelectField<SousFamilleOption>
                    label="Sous-famille"
                    options={sousFamilleOptions}
                    value={selectedSousFamille}
                    onChange={setSelectedSousFamille}
                    placeholder="Sous-famille..."
                    onAddClick={() => setOpenModalSousFamille(true)}
                  />
                </div>
              </div>

              <PrixUnitesSection value={prixUnites} onChange={setPrixUnites} />
            </div>

            <div className="mt-5 flex justify-center">
              <Button className="mr-2" type="submit">
                {isEditing ? "Modifier Article" : "Créer Article"}
              </Button>

              <Button
                className="ml-2"
                type="button"
                onClick={clear}
                variant="outline"
              >
                Tout effacer
              </Button>
            </div>
          </form>
        )}
      </div>

      <Alert
        open={alert.open}
        variant={alert.variant}
        title={alert.title}
        message={alert.message}
        showLink={false}
        onClose={() =>
          setAlert((prev) => ({
            ...prev,
            open: false,
          }))
        }
      />
    </>
  );
}
