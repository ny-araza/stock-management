export default function NewRtfPage() {
  return (
    <>
      <div className="no-scrollbar relative w-full overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
        <div className="px-2 pr-14 flex justify-between">
          <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
            Ajout retour Fournisseur
          </h4>
          <span className="dark:text-white/90">
            {Date().split(" ")[2]}/{Date().split(" ")[1]}/{Date().split(" ")[3]}
          </span>
        </div>
      </div>
    </>
  );
}
