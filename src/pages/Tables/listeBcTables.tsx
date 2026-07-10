import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import BcTable from "../../components/tables/BasicTables/bcTable";

export default function ListBcTables() {
  return (
    <>
      
      <PageBreadcrumb pageTitle="Liste des Bond de Commande des fournisseurs"  />
      <div  className="space-y-6">
        <ComponentCard title="">
          <BcTable />
        </ComponentCard>
      </div>
    </>
  );
}
