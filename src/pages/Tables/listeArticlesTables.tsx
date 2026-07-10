import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import ArticlesTables from "../../components/tables/BasicTables/articlesTable";

export default function ListArticlesTables() {
  return (
    <>
      
      <PageBreadcrumb pageTitle="Articles"  />
      <div className="space-y-6">
        <ComponentCard title="">
          <ArticlesTables/>
        </ComponentCard>
      </div>
    </>
  );
}
