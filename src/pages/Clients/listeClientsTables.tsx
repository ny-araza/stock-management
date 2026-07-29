import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import ClientsTable from "./clientsTable";

export default function ListClientsTables() {
  return (
    <>
      
      <PageBreadcrumb pageTitle="Clients"  />
      <div className="space-y-6">
        <ComponentCard title="">
          <ClientsTable />
        </ComponentCard>
      </div>
    </>
  );
}
