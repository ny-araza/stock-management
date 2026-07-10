import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import VentesTable from "../../components/tables/BasicTables/ventesTable";

export default function ListVentesTables() {
  return (
    <>
      
      <PageBreadcrumb pageTitle="Ventes"  />
      <div  className="space-y-6">
        <ComponentCard title="">
          <VentesTable />
        </ComponentCard>
      </div>
    </>
  );
}
