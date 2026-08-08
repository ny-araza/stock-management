import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import LivFrnsTable from "./livFrnsTable";

export default function LivFrnsListeTables() {
  return (
    <>
      <PageBreadcrumb pageTitle="Livraison fournisseurs" />
      <div className="space-y-6">
        <ComponentCard title="">
          <LivFrnsTable />
        </ComponentCard>
      </div>
    </>
  );
}
