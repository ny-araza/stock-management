import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../ui/table";

import { useEffect, useState } from "react";
import { apiFetch } from "../../../services/api";
import { Client } from "../../../interfaces/user";
import Button from "../../ui/button/Button";


export default function BasicTableOne() {

  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);

  const [hasNext, setHasNext] = useState<boolean>(false);
  const [hasPrevious, setHasPrevious] = useState<boolean>(false);
  const [totalCount, setTotalCount] = useState<number>(0);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        const res = await apiFetch(`/api/clients/?page=${page}`);

        if (res.status) {
          setClients(res.clients);
          setHasNext(res.next !== null);
          setHasPrevious(res.previous !== null);
          setTotalCount(res.count);
        } else {
          throw new Error(res.message || "Une erreur est survenue");
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        console.error("Erreur lors de la récupération :", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, [page]);

  const handleNextPage = () => {
    if (hasNext) setPage((prev) => prev + 1)
  }

  const handlePreviousPage = () => {
    if (hasPrevious) setPage((prev) => prev - 1)
  }

  if (loading) return <div className="p-5">Chargement des clients...</div>;
  if (error) return <div className="p-5 text-red-500">Erreur : {error}</div>;

  return (
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
                  {client.cli_datecre}
                </TableCell>
                <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  {client.cli_datemdf}
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
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Page <strong>{page}</strong> (Total : {totalCount} clients)
        </span>
        <div className="flex gap-2">
          <Button
            onClick={handlePreviousPage}
            disabled={!hasPrevious}
            className="disabled:opacity-50"
          >
            Précédent
          </Button>
          <Button
            onClick={handleNextPage}
            disabled={!hasNext}
            className="disabled:opacity-50"
          >
            Suivant
          </Button>
        </div>
      </div>
    </div>
  );
}
