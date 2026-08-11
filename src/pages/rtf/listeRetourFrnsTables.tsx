import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import RetourFrnsTable from "./retourFrnsTable";

export default function RetourFrnsListeTables() {
  return (
    <>
      <PageBreadcrumb pageTitle="Retour fournisseurs" />
      <div className="space-y-6">
        <ComponentCard title="">
          <RetourFrnsTable />
        </ComponentCard>
      </div>
    </>
  );
}
