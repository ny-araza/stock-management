/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import Input from "../../../components/form/input/InputField";
import Label from "../../../components/form/Label";
import { Modal } from "../../../components/ui/modal";
import TextArea from "../../../components/form/input/TextArea";
import React, { useCallback, useEffect, useRef, useState } from "react";
import Button from "../../../components/ui/button/Button";
import { apiFetch } from "../../../services/api";
import { useForm } from "../../../hooks/useForm";
import { Enumeration, EnumerationOption } from "../../../interfaces/interfaces";
import { postData } from "../../../services/sendDataService";
import Alert from "../../../components/ui/alert/Alert";
import Select from "../../../components/form/Select";

interface newEntryProps {
    isOpen: boolean,
    onClose: () => void,
    className?: string
}

const Entry: React.FC<newEntryProps> = ({
    isOpen,
    onClose,
    className
}) => {

    const prixArticle = {
        pri_id: "",
        pri_article: "",
        pri_quantite: "",
        pri_pu: "",
        pri_pht: "",
        pri_lot: "",
        pri_datePeremption: "",
    };

    const [alert, setAlert] = useState({
        open: false,
        variant: "success" as "success" | "error" | "warning" | "info",
        title: "",
        message: "",
    });
    const [ligneArticle, setLigneAticle] = useState<any[]>([])
    const [ligneEnCours, setLigneEnCours] = useState(prixArticle);
    const [enumeration, setEnumeration] = useState<Enumeration[]>([])
    const EnumerationOptions: EnumerationOption[] = enumeration.map((item: Enumeration) => ({
        ...item,
        value: item.enu_id.toString(),
        label: item.enu_nom,
    }));

    const { values, handleChange, reset, setField } = useForm({
        code: "",
        justificatif: "",
        designation: "",
    })
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [rowSuggestions, setRowSuggestions] = useState([]);
    const [showRowSuggestions, setShowRowSuggestions] = useState(false);
    const [editingRow, setEditingRow] = useState<number | null>(null);
    const articleRef = useRef<HTMLInputElement>(null);

    const handleLigneChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;

        setLigneEnCours((prev) => {
            const nouvelleLigne = {
                ...prev,
                [name]: value,
            };

            if (name === "pri_article") {
                rechercherArticle(value)
            }

            const quantite = Number(nouvelleLigne.pri_quantite) || 0;
            const pht = Number(nouvelleLigne.pri_pu) * quantite;

            nouvelleLigne.pri_pht = pht.toFixed(2);

            return nouvelleLigne;
        });
    };
    const ajouterLigne = () => {
        // évite d'ajouter une ligne totalement vide
        const estVide = Object.values(ligneEnCours).every((v) => v === "");
        if (estVide) return;
        setLigneAticle([...ligneArticle, ligneEnCours])
        setLigneEnCours(prixArticle);
        setTimeout(() => {
            articleRef.current?.focus();
        })
    };
    const handleLigneKeyDown = (e: any) => {
        if (e.key === "Enter") {
            e.preventDefault();
            ajouterLigne();
        }
    };
    const supprimerLigne = (index: number) => {
        const nouvelleListe = ligneArticle.filter((_, i) => i !== index);
        // setField("ligneArticles", nouvelleListe);
        setLigneAticle(nouvelleListe)
    };

    const modifierLigne = (
        index: number,
        field: keyof typeof ligneArticle[number],
        value: string
    ) => {
        setLigneAticle((prev: any) =>
            prev.map((ligne: any, i: any) =>
                i === index ? { ...ligne, [field]: value } : ligne
            )
        );

        if (field === "pri_article") {
            setEditingRow(index);
            rechercherArticle(value, "existante");
        }
    };

    //fetch api
    // 1 . code
    const fetchCode = async (table_name: string, isInsert: boolean) => {
        try {
            const query = new URLSearchParams()
            query.set("table_name", table_name)
            query.set("is_insert", isInsert ? "1" : "0")
            console.log(query.toString())
            const res = await apiFetch(`/api/generate-date-code/?${query.toString()}`)

            if (res.success) {
                setField('code', res.code)
            }
        } catch (error: any) {
          console.log(error)
        }
    }
    const fetchEnumeration = async (enu_code: string) => {
        try {
            const query = new URLSearchParams()
            query.set("enu_code", enu_code)
            const res = await apiFetch(`/api/generate-enumeration/?${query.toString()}`)

            if (res.success) {
                setEnumeration(res.nom_enumeration)
            }
        } catch (error: any) {
            console.log(error)
        }
    }

    const rechercherArticle = useCallback(async (code: string, cible: "nouvelle" | "existante" = "nouvelle") => {
        if (!code.trim()) {
            if (cible === "nouvelle") {
                setSuggestions([]);
                setShowSuggestions(false);
            } else {
                setRowSuggestions([]);
                setShowRowSuggestions(false);
            }
            return;
        }

        try {
            const query = new URLSearchParams();
            query.set("search", code);
            const res = await apiFetch(`/api/articles-autocomplete/?${query.toString()}`);

            if (res.status) {
                if (cible === "nouvelle") {
                    setSuggestions(res.articles);
                    setShowSuggestions(true);
                } else {
                    setRowSuggestions(res.articles);
                    setShowRowSuggestions(true);
                }
            }
        } catch (err) {
            console.error(err);
        }
    }, []);

    const choisirArticle = (article: any) => {
        setLigneEnCours((prev) => ({
            ...prev,
            pri_article: article.code,
            pri_id: article.id,
            pri_pu: article.prix_ht,
        }));

        setSuggestions([]);
        setShowSuggestions(false);
    };

    //ligne existante
    const choisirArticleLigne = (index: number, article: any) => {
        setLigneAticle((prev: any) =>
            prev.map((ligne: any, i: any) =>
                i === index
                    ? {
                        ...ligne,
                        pri_article: article.code,
                        pri_id: article.id,
                        pri_pu: article.prix_ht,
                    }
                    : ligne
            )
        );
        setRowSuggestions([]);
        setShowRowSuggestions(false);
        setEditingRow(null);
    };

    useEffect(() => {
        fetchCode('t_in_stock', false)
        fetchEnumeration('ENTREE_STK')
        setField('justificatif', "29")
    }, [isOpen])

    //send data
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {

            let cpt = 0
            const today = new Date().toISOString().split("T")[0];

            for (const item of ligneArticle) {
                if (item) {
                    const res = await postData("/api/insert-database/", "t_in_stock", {
                        in_code: values.code,
                        in_motif: EnumerationOptions.find(
                            (opt) => opt.enu_id == parseInt(values.justificatif)
                        )?.label,
                        in_art_code: item.pri_article,
                        in_lot_id: item.pri_lot,
                        in_lot_code: item.pri_datePeremption,
                        in_pri_id: item.pri_id,
                        in_quantite: item.pri_quantite,
                        in_date: today
                    });
                    if (res.status) {
                        cpt += 1
                    }
                }
                else break;
            }
            if (ligneArticle.length != 0 && cpt == ligneArticle.length) {
                fetchCode('t_in_stock', true)
                setAlert({
                    open: true,
                    variant: "success",
                    title: "Opération réussie",
                    message: "Entrer enregistrer avec succès"
                })
                reset()
                setLigneAticle([])
                return;
            }

            setAlert({
                open: true,
                message: "Vous avez laisser un champs vide",
                title: "Une erreur survenue",
                variant: "error"
            })
        } catch (error) {
            console.error(error)
        }
    }

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} className={className}>
                <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
                    <div className="px-2 pr-14 flex justify-between">
                        <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                            Entrée en stock
                        </h4>
                        <span className="text-white/90">{Date().split(" ")[2]}/{Date().split(" ")[1]}/{Date().split(" ")[3]}</span>
                    </div>
                    <form className="flex flex-col" onSubmit={handleSubmit}>
                        <div className="custom-scrollbar h-[600px] overflow-y-auto px-2 pb-3">
                            <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                                <div>
                                    <Label>Piece N°</Label>
                                    <Input
                                        name="code"
                                        disabled
                                        type="text"
                                        value={values.code}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div>
                                    <Label>Justificatif</Label>
                                    <Select options={EnumerationOptions} onChange={(value) => setField('justificatif', value)} defaultValue="29"></Select>
                                </div>
                            </div>
                            <div className="mt-5">
                                <Label>Designation</Label>
                                <TextArea name="designation" placeholder="Designation"
                                    value={values.designation}
                                    onChange={(value) => setField("designation", value)}>
                                </TextArea>
                            </div>
                            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800 mt-5 h-100">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-brand-500 text-white">
                                            <th className="p-2 text-left font-medium relative">
                                                <input
                                                    style={{ borderBottom: "1px solid gray" }}
                                                    name="pri_article"
                                                    ref={articleRef}
                                                    value={ligneEnCours.pri_article}
                                                    onChange={handleLigneChange}
                                                    onKeyDown={handleLigneKeyDown}
                                                    placeholder="code article"
                                                    className="w-full bg-transparent placeholder-white/70 outline-none"
                                                />
                                                {showSuggestions && suggestions.length > 0 && (
                                                    <div className="absolute z-100 w-full bg-white border rounded shadow max-h-60 overflow-y-auto dark:bg-gray-800">
                                                        {suggestions.map((article: any) => (
                                                            <div
                                                                key={article.id}
                                                                onClick={() => choisirArticle(article)}
                                                                className="cursor-pointer px-3 py-2"
                                                            >
                                                                <div className="text-xs text-gray-500">
                                                                    {article.code}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </th>
                                            <th className="p-2 text-left font-medium">
                                                <input
                                                    style={{ borderBottom: "1px solid gray" }}
                                                    name="pri_quantite"
                                                    value={ligneEnCours.pri_quantite}
                                                    onChange={handleLigneChange}
                                                    onKeyDown={handleLigneKeyDown}
                                                    placeholder=""
                                                    className="w-full bg-transparent placeholder-white/70 outline-none"
                                                />
                                            </th>
                                            <th className="p-2 text-left font-medium">
                                                <input
                                                    style={{ borderBottom: "1px solid gray" }}
                                                    name="pri_pu"
                                                    value={ligneEnCours.pri_pu}
                                                    onChange={handleLigneChange}
                                                    onKeyDown={handleLigneKeyDown}
                                                    placeholder="P.U"
                                                    className="w-full bg-transparent placeholder-white/70 outline-none"
                                                />
                                            </th>
                                            <th className="p-2 text-left font-medium">
                                                <input
                                                    style={{ borderBottom: "1px solid gray" }}
                                                    name="pri_pht"
                                                    value={ligneEnCours.pri_pht}
                                                    onChange={handleLigneChange}
                                                    onKeyDown={handleLigneKeyDown}
                                                    placeholder="Prix HT"
                                                    className="w-full bg-transparent placeholder-white/70 outline-none"
                                                />
                                            </th>
                                            <th className="p-2 text-left font-medium">
                                                <input
                                                    style={{ borderBottom: "1px solid gray" }}
                                                    name="pri_lot"
                                                    placeholder="Lot"
                                                    value={ligneEnCours.pri_lot}
                                                    onChange={handleLigneChange}
                                                    onKeyDown={handleLigneKeyDown}
                                                    className="w-full bg-transparent placeholder-white/70 outline-none"
                                                />
                                            </th>
                                            <th className="p-2 text-left font-medium">
                                                <input
                                                    style={{ borderBottom: "1px solid gray" }}
                                                    name="pri_datePeremption"
                                                    type="date"
                                                    value={ligneEnCours.pri_datePeremption}
                                                    onChange={handleLigneChange}
                                                    onKeyDown={handleLigneKeyDown}
                                                    placeholder="Date péremption"
                                                    className="w-full bg-transparent placeholder-white/70 outline-none"
                                                />
                                            </th>
                                            <th className="w-10 p-2 text-center">
                                                <button
                                                    type="button"
                                                    onClick={ajouterLigne}
                                                    className="text-white"
                                                    title="Ajouter la ligne"
                                                >
                                                    +
                                                </button>
                                            </th>
                                        </tr>
                                        <tr className="bg-brand-500 text-gray-400 text-xs">
                                            <th className="p-2 text-left">Article</th>
                                            <th className="p-2 text-left">Quantité</th>
                                            <th className="p-2 text-left">P.U</th>
                                            <th className="p-2 text-left">Prix HT</th>
                                            <th className="p-2 text-left">Lot</th>
                                            <th className="p-2 text-left">Date Péremption</th>
                                            <th className="p-2"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="dark:bg-gray-900">
                                        {ligneArticle.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan={8}
                                                    className="p-4 text-center text-gray-500 dark:text-gray-400"
                                                >
                                                    Aucune ligne n'a encore été crée
                                                </td>
                                            </tr>
                                        ) : (
                                            ligneArticle.map((ligne, index) => (
                                                <tr
                                                    key={index}
                                                    className="border-t border-gray-100 dark:border-gray-800 dark:text-white"
                                                >
                                                    <td className="p-2 relative">
                                                        <input
                                                            required
                                                            value={ligne.pri_article}
                                                            onChange={(e) => modifierLigne(index, "pri_article", e.target.value)}
                                                            onFocus={() => setEditingRow(index)}
                                                            className="w-full rounded border border-gray-300 dark:border-gray-700 dark:bg-gray-800 px-2 py-1"
                                                        />
                                                        {editingRow === index && showRowSuggestions && rowSuggestions.length > 0 && (
                                                            <div className="absolute z-100  w-full bg-white border rounded shadow max-h-60 overflow-y-auto dark:bg-gray-800">
                                                                {rowSuggestions.map((article: any) => (
                                                                    <div
                                                                        key={article.id}
                                                                        onClick={() => choisirArticleLigne(index, article)}
                                                                        className="cursor-pointer px-3 py-2"
                                                                    >
                                                                        <div className="text-xs text-gray-500">{article.code}</div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </td>

                                                    <td className="p-2">
                                                        <input
                                                            required
                                                            value={ligne.pri_quantite}
                                                            onChange={(e) =>
                                                                modifierLigne(index, "pri_quantite", e.target.value)
                                                            }
                                                            className="w-full rounded border border-gray-300 dark:border-gray-700 dark:bg-gray-800 px-2 py-1"
                                                        />
                                                    </td>

                                                    <td className="p-2">
                                                        <input
                                                            required
                                                            value={ligne.pri_pu}
                                                            onChange={(e) =>
                                                                modifierLigne(index, "pri_pu", e.target.value)
                                                            }
                                                            className="w-full rounded border border-gray-300 dark:border-gray-700 dark:bg-gray-800 px-2 py-1"
                                                        />
                                                    </td>

                                                    <td className="p-2">
                                                        <input
                                                            required
                                                            value={ligne.pri_pht}
                                                            onChange={(e) =>
                                                                modifierLigne(index, "pri_pht", e.target.value)
                                                            }
                                                            className="w-full rounded border border-gray-300 dark:border-gray-700 dark:bg-gray-800 px-2 py-1"
                                                        />
                                                    </td>

                                                    <td className="p-2">
                                                        <input
                                                            required
                                                            value={ligne.pri_lot}
                                                            onChange={(e) =>
                                                                modifierLigne(index, "pri_lot", e.target.value)
                                                            }
                                                            className="w-full rounded border border-gray-300 dark:border-gray-700 dark:bg-gray-800 px-2 py-1"
                                                        />
                                                    </td>

                                                    <td className="p-2">
                                                        <input
                                                            required
                                                            type="date"
                                                            value={ligne.pri_datePeremption}
                                                            onChange={(e) =>
                                                                modifierLigne(index, "pri_datePeremption", e.target.value)
                                                            }
                                                            className="w-full rounded border border-gray-300 dark:border-gray-700 dark:bg-gray-800 px-2 py-1"
                                                        />
                                                    </td>
                                                    <td className="p-2 text-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => supprimerLigne(index)}
                                                            className="text-red-500"
                                                            title="Supprimer la ligne"
                                                        >
                                                            −
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="flex justify-center w-full">
                            <Button className="md:w-50 sm:w-auto md:mr-3" variant="primary" type="submit">Valider</Button>
                            <Button variant="outline">Effacer tout</Button>
                        </div>
                    </form>
                </div>
                <Alert
                    open={alert.open}
                    variant={alert.variant}
                    title={alert.title}
                    message={alert.message}
                    showLink={false}
                    onClose={() => setAlert(
                        {
                            open: false,
                            variant: alert.variant,
                            message: alert.message,
                            title: alert.title
                        }
                    )}
                />
            </Modal>
        </>
    )
}

export default Entry;
