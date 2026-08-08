import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import ComponentCard from "../../../components/common/ComponentCard";
import SortitTable from "./sortitTable";

export default function SortitListeTables() {
  return (
    <>
      <PageBreadcrumb pageTitle="Entree" />
      <div className="space-y-6">
        <ComponentCard title="">
          <SortitTable />
        </ComponentCard>
      </div>
    </>
  );
}
