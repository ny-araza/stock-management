import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import EntreeTable from "./entreeTable";

export default function EntreeListeTables() {
  return (
    <>
      <PageBreadcrumb pageTitle="Entree" />
      <div className="space-y-6">
        <ComponentCard title="">
          <EntreeTable />
        </ComponentCard>
      </div>
    </>
  );
}
