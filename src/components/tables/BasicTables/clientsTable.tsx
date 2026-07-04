import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../ui/table";

import { CSSProperties, useEffect, useState } from "react";
import { apiFetch } from "../../../services/api";
import { Client } from "../../../interfaces/interfaces";
import Button from "../../ui/button/Button";
import { PlusIcon } from "../../../icons";
import Input from "../../form/input/InputField";
import Label from "../../form/Label";
import { Modal } from "../../ui/modal";
import { useModal } from "../../../hooks/useModal";
import Select, { Option } from "../../form/Select"
import Pagination from "../../ui/pagination/Pagination";

export default function ClientsTable() {
  const { isOpen, openModal, closeModal } = useModal();
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [hasNext, setHasNext] = useState<boolean>(false);
  const [hasPrevious, setHasPrevious] = useState<boolean>(false);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [search, setSearch] = useState("")
  const [totalPages, setTotalPages] = useState(1)


  const typeOptions: Option[] = [
    {
      value: "test1",
      label: "type1"
    },
    {
      value: "test2",
      label: "type2"
    }
  ]

  const paiementOption: Option[] = [
    {
      value: "mobile_money",
      label: "Mobile Money"
    },
    {
      value: "virements",
      label: "Virements"
    },
    {
      value: "espece",
      label: "Espèce"
    }
  ]

  const onChangeOption = () => {
    console.log("ceci est un handler")
  }

  const fetchClients = async (pageNumber = page, keyword = search) => {
    try {
      setLoading(true);
      const res = await apiFetch(`/api/clients/?page=${page}&search=${encodeURIComponent(keyword)}`);

      if (res.status) {
        setClients(res.clients);
        setHasNext(res.next !== null);
        setHasPrevious(res.previous !== null);
        setTotalCount(res.count);
        setTotalPages(res.total_pages)
      } else {
        throw new Error(res.message || "Une erreur est survenue");
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  //fonction de recherche
  const handleSearch = async () => {
    setPage(1);

    await fetchClients(1, search)
  }

  if (loading) return <div className="p-5">Chargement des clients...</div>;
  if (error) return <div className="p-5 text-red-500">Erreur : {error}</div>;

  function formatDate(date: string): string {
    if (!date) {
      return "Pas de date"
    }
    const temp = date.split('T')
    const heure = temp[1].replace('Z', '')
    return `${temp[0]} à ${heure}`
  }


  const styleForm: CSSProperties = {
    display: "flex",
    justifyContent: "center",
    width: "100%",
  }

  const styleMenu: CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    width: "100%",
    marginTop: "10px"
  }


  return (
    <>
      <div style={styleMenu}>
        <Button onClick={openModal}>
          <PlusIcon></PlusIcon>
        </Button>
        <form action="" method="POST">
          <div className="flex relative">
            <input
              type="text"
              placeholder="Search client ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-200 bg-transparent py-2.5 pl-12 pr-14 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:bg-white/[0.03] dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 xl:w-[430px]"
            />
            <Button onClick={handleSearch}>
              <span>search</span>
            </Button>
          </div>
        </form>
      </div>
      <div className="overflow-hidden border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <Table>
            {/* Table Header */}
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Code
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Clients
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Date de creation
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Modifié le
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Crée par
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Modifier par
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Adresse
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Email
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Status
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Paiements
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Type
                </TableCell>
              </TableRow>
            </TableHeader>

            {/* Table Body */}
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {clients.map((client) => (
                <TableRow key={client.cli_id}>
                  <TableCell className="px-5 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    {client.cli_code}
                  </TableCell>
                  <TableCell className="px-5 py-4 sm:px-6 text-start">
                    <div className="flex items-center gap-3">
                      <div>
                        <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                          {client.cli_nom}
                        </span>
                        <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                          {client.cli_tel1}
                        </span>
                        <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                          {client.cli_tel2}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    {formatDate(client.cli_datecre)}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    {formatDate(client.cli_datemdf)}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    {client.cli_usercre}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    {client.cli_usermdf}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    {client.cli_adresse}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    {client.cli_email}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    {client.cli_stat}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    {client.cli_modepay}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    {client.cli_type}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between p-4 border-t border-gray-100 dark:border-white/[0.05]">
          <Pagination
            page={page}
            totalPages={totalPages}
            totalCount={totalCount}
            hasNext={hasNext}
            hasPrevious={hasPrevious}
            onPageChange={setPage}
          />
        </div>
      </div>
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Entrer un nouveau client
            </h4>

          </div>
          <form className="flex flex-col">
            <div className="custom-scrollbar h-[450px] overflow-y-auto px-2 pb-3">
              <div>

                <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">

                  <div>
                    <Label>Dénomination</Label>
                    <Input type="text" placeholder="Nom du client" />
                  </div>
                  <div style={styleForm} className="insert-num-client">
                    <div>
                      <Label>Contact 1</Label>
                      <Input
                        type="text"
                        placeholder="Numéro de tel"
                      />
                    </div>
                    <div>
                      <Label>Contact 2</Label>
                      <Input
                        type="text"
                        placeholder="Numéro de tel"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Adresse</Label>
                    <Input type="text"
                      placeholder="Adresse du client"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-7">
                <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                  <div className="col-span-2 lg:col-span-1">
                    <Label>Email</Label>
                    <Input type="email" placeholder="Client@gmail.com" />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>NIF</Label>
                    <Input type="text" />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>STAT</Label>
                    <Input type="text" />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>RCS</Label>
                    <Input type="text" />
                  </div>
                  <div style={styleForm}>
                    <div className="col-span-2 w-100">
                      <Label>Type de client</Label>
                      <Select options={typeOptions} onChange={onChangeOption}>
                      </Select>
                    </div>
                    <div className="col-span-2 w-100">
                      <Label>Paiments</Label>
                      <Select options={paiementOption} onChange={onChangeOption}></Select>
                    </div>

                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" onClick={closeModal}>
                Close
              </Button>
              <Button size="sm" type="submit" >
                Save
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}
