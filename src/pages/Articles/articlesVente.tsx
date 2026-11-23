import ListeArticles from "./listeArtciles";

export default function ClientPage() {

  return (
    <div className="p-6">
      <ListeArticles onRefresh={refresh} />
    </div>
  );
}
