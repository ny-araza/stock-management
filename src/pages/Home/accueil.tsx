import PageMeta from "../../components/common/PageMeta";
import PageAccueil from "./page_accueil";

export default function Accueil() {
  return (
    <>
      <PageMeta
        title="Accueil"
        description="This is React.js Ecommerce Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 space-y-6 ">
          <PageAccueil />
        </div>
      </div>
    </>
  );
}
