import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import RetourClientPages from "./retourClientPage";

export default function RetourClientListeTables() {
  return (
    <>
      <PageBreadcrumb pageTitle="Retour client" />
      <div className="space-y-6">
        <ComponentCard title="">
          <RetourClientPages />
        </ComponentCard>
      </div>
    </>
  );
}
