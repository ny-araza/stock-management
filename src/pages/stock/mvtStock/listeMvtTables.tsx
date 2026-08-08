import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import ComponentCard from "../../../components/common/ComponentCard";
import MvtStockTable from "./mvtTable";

export default function MvtListeTables() {
  return (
    <>
      <PageBreadcrumb pageTitle="Mouvement de stock" />
      <div className="space-y-6">
        <ComponentCard title="">
          <MvtStockTable />
        </ComponentCard>
      </div>
    </>
  );
}
