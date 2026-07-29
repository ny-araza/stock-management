import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import BcTable from "./bcTable";

export default function ListBcTables() {
  return (
    <>
      
      <PageBreadcrumb pageTitle="Bond de Commande"  />
      <div  className="space-y-6">
        <ComponentCard title="">
          <BcTable />
        </ComponentCard>
      </div>
    </>
  );
}
