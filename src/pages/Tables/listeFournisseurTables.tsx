import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import FournisseurTable from "../../components/tables/BasicTables/fournisseurTable";

export default function ListFournisseurTables() {
  return (
    <>
      
      <PageBreadcrumb pageTitle="Fournisseurs"  />
      <div  className="space-y-6">
        <ComponentCard title="">
          <FournisseurTable />
        </ComponentCard>
      </div>
    </>
  );
}
