import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ArticlesTables from "./articlesTable";
import ComponentCard from "../../components/common/ComponentCard";

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
