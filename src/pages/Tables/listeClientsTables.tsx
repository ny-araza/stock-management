import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import ClientsTable from "../../components/tables/BasicTables/clientsTable";

export default function ListClientsTables() {
  return (
    <>
      
      <PageBreadcrumb pageTitle="Listes clients"  />
      <div className="space-y-6">
        <ComponentCard title="">
          <ClientsTable />
        </ComponentCard>
      </div>
    </>
  );
}
