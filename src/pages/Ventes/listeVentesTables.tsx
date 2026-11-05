import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import VentesPage from "./VentesPage";

export default function ListVentesTables() {
  return (
    <>
      <PageBreadcrumb pageTitle="Ventes" />
      <div className="space-y-6">
        <ComponentCard title="">
          <VentesPage />
        </ComponentCard>
      </div>
    </>
  );
}
