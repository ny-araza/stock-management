import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import ListeArticles from "./listeArtciles";

export default function ListArticlesTables() {
  return (
    <>
      <PageBreadcrumb pageTitle="Articles" />
      <div className="space-y-6">
        <ComponentCard title="">
          <ListeArticles />
        </ComponentCard>
      </div>
    </>
  );
}
