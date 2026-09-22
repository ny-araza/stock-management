import { useEffect, useRef, useState } from "react";
import { Bell, CalendarClock, ChevronRight, Loader2, ClosedCaptionIcon } from "lucide-react";

interface NotificationPaiementItem {
  ent_id: number;
  ent_code: string | null;
  ent_date: string | null;
  ent_facture: string | null;
  ent_datepay: string | null;
  ent_dateecheance: string | null;
  ent_modepaye: string;
  ent_montant_ht: string;
  ent_montant_ttc: string;
  ent_fou_code: string | null;
}

interface NotificationResponse {
  status: boolean;
  message: string;
  date_aujourd_hui: string;
  date_limite: string;
  count: number;
  total_pages?: number;
  current_page?: number;
  next?: string | null;
  previous?: string | null;
  notifications: NotificationPaiementItem[];
}

interface NotificationPaiementProps {
  apiFetch: (url: string, options?: RequestInit) => Promise<any>;
}

export default function NotificationPaiement({
  apiFetch,
}: NotificationPaiementProps) {
  const [notifications, setNotifications] = useState<
    NotificationPaiementItem[]
  >([]);

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [nextUrl, setNextUrl] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  /**
   * Chargement de la première page
   */
  const loadNotifications = async () => {
    try {
      setLoading(true);

      const response: NotificationResponse = await apiFetch(
        "/api/new_liv_not_paye/",
      );

      if (response?.status) {
        console.log(response.notifications);
        setNotifications(response.notifications || []);
        setNextUrl(response.next || null);
      } else {
        setNotifications([]);
        setNextUrl(null);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des notifications :", error);

      setNotifications([]);
      setNextUrl(null);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Charger la page suivante
   */
  const loadMore = async () => {
    if (!nextUrl || loadingMore) return;

    try {
      setLoadingMore(true);

      /**
       * nextUrl peut être une URL complète :
       * http://localhost:8000/api/notifications/paiements/?page=2
       *
       * Si ton apiFetch attend uniquement le chemin,
       * on récupère seulement /api/...
       */
      const url = nextUrl.startsWith("http")
        ? new URL(nextUrl).pathname + new URL(nextUrl).search
        : nextUrl;

      const response: NotificationResponse = await apiFetch(url);

      if (response?.status) {
        setNotifications((prev) => [
          ...prev,
          ...(response.notifications || []),
        ]);

        setNextUrl(response.next || null);
      }
    } catch (error) {
      console.error(
        "Erreur lors du chargement des notifications supplémentaires :",
        error,
      );
    } finally {
      setLoadingMore(false);
    }
  };

  /**
   * Chargement initial + actualisation toutes les 5 minutes
   */
  useEffect(() => {
    loadNotifications();

    const interval = setInterval(loadNotifications, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  /**
   * Fermer le dropdown lorsqu'on clique à l'extérieur
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  /**
   * Format montant
   */
  const formatMoney = (value: string) => {
    const number = Number(value);

    if (Number.isNaN(number)) {
      return "0 Ar";
    }

    return (
      number.toLocaleString("fr-FR", {
        maximumFractionDigits: 2,
      }) + " Ar"
    );
  };

  /**
   * Format date
   */
  const formatDate = (date: string | null) => {
    if (!date) return "-";

    return new Date(date + "T00:00:00").toLocaleDateString("fr-FR");
  };

  /**
   * Détermine si le paiement est en retard
   */
  const isOverdue = (date: string | null) => {
    if (!date) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const paymentDate = new Date(date + "T00:00:00");

    return paymentDate < today;
  };

  const renderNotifications = () => {
    if (loading) {
      return (
        <div
          className="
            flex
            items-center
            justify-center
            gap-2
            p-8
            text-sm
            text-gray-500
          "
        >
          <Loader2 size={18} className="animate-spin" />
          Chargement...
        </div>
      );
    }

    if (notifications.length === 0) {
      return (
        <div className="p-8 text-center">
          <div
            className="
              mx-auto
              mb-3
              flex
              h-12
              w-12
              items-center
              justify-center
              rounded-full
              bg-gray-100
              dark:bg-gray-800
            "
          >
            <Bell size={22} className="text-gray-400" />
          </div>

          <p
            className="
              text-sm
              font-medium
              text-gray-700
              dark:text-gray-300
            "
          >
            Aucune notification
          </p>

          <p className="mt-1 text-xs text-gray-500">
            Aucun paiement à effectuer prochainement.
          </p>
        </div>
      );
    }

    return (
      <>
        {notifications.map((item) => {
          const overdue = isOverdue(item.ent_datepay);

          return (
            <button
              key={item.ent_id}
              type="button"
              className="
                w-full
                text-left

                flex
                gap-3

                px-4
                py-4

                border-b
                border-gray-100
                dark:border-gray-800

                hover:bg-gray-50
                dark:hover:bg-gray-800/60

                transition
              "
            >
              {/* ICÔNE */}
              <div
                className={`
                  flex
                  shrink-0
                  items-center
                  justify-center

                  w-10
                  h-10

                  rounded-full

                  ${
                    overdue
                      ? "bg-red-100 dark:bg-brand-900/30"
                      : "bg-orange-100 dark:bg-brand-900/30"
                  }
                `}
              >
                <CalendarClock
                  size={19}
                  className={overdue ? "text-brand-500" : "text-orange-500"}
                />
              </div>

              {/* INFORMATIONS */}
              <div className="min-w-0 flex-1">
                <div
                  className="
                    flex
                    items-start
                    justify-between
                    gap-2
                  "
                >
                  <p
                    className="
                      text-sm
                      font-semibold
                      text-gray-900
                      dark:text-white
                    "
                  >
                    {overdue ? "Paiement en retard" : "Paiement à effectuer"}
                  </p>

                  <ChevronRight size={16} className="shrink-0 text-gray-400" />
                </div>

                <p
                  className="
                    mt-0.5
                    text-xs
                    text-gray-500
                    dark:text-gray-400
                  "
                >
                  Bon de livraison :{" "}
                  <span className="font-medium">
                    {item.ent_facture || item.ent_code || "-"}
                  </span>
                </p>

                <div
                  className="
                    mt-2
                    flex
                    flex-wrap
                    gap-x-3
                    gap-y-1
                  "
                >
                  <span
                    className={`
                      text-xs
                      ${
                        overdue ? "font-semibold text-brand-500" : "text-gray-500"
                      }
                    `}
                  >
                    📅 {formatDate(item.ent_datepay)}
                  </span>

                  <span
                    className="
                      text-xs
                      font-semibold
                      text-gray-700
                      dark:text-gray-300
                    "
                  >
                    {formatMoney(item.ent_montant_ttc)}
                  </span>
                </div>

                {item.ent_fou_code && (
                  <p className="mt-1 text-[11px] text-gray-400">
                    Fournisseur : {item.ent_fou_code}
                  </p>
                )}
              </div>
            </button>
          );
        })}

        {/* VOIR PLUS */}
        {nextUrl && (
          <button
            type="button"
            onClick={loadMore}
            disabled={loadingMore}
            className="
              w-full
              flex
              items-center
              justify-center
              gap-2

              px-4
              py-4

              text-sm
              font-medium

              text-brand-600

              hover:bg-gray-50
              dark:hover:bg-gray-800

              disabled:opacity-50
            "
          >
            {loadingMore ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Chargement...
              </>
            ) : (
              "Voir plus"
            )}
          </button>
        )}
      </>
    );
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* =====================================================
          BOUTON NOTIFICATION
      ====================================================== */}

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="
          relative
          flex
          items-center
          justify-center
          w-10
          h-10
          rounded-full
          hover:bg-gray-100
          dark:hover:bg-gray-800
          dark:text-gray-25/50
          transition
        "
        aria-label="Notifications"
      >
        <Bell size={21} strokeWidth={2} />

        {/* Badge */}

        {notifications.length > 0 && (
          <span
            className="
              absolute
              -top-0.5
              -right-0.5
              min-w-[18px]
              h-[18px]
              px-1
              flex
              items-center
              justify-center
              rounded-full
              bg-red-500
              text-white
              text-[10px]
              font-bold
              border-2
              border-white
              dark:border-gray-900
            "
          >
            {notifications.length > 99 ? "99+" : notifications.length}
          </span>
        )}
      </button>

      {/* =====================================================
          DROPDOWN
      ====================================================== */}

      {open && (
        <>
          {/* =========================================================
              VERSION DESKTOP / TABLETTE
              Visible à partir de 481px
          ========================================================== */}
          <div
            className="
              hidden
              min-[481px]:block

              absolute
              top-12
              right-0

              max-[1004px]:left-0
              max-[1004px]:right-auto

              z-50

              w-[400px]
              max-w-[calc(100vw-16px)]

              max-h-[calc(100vh-70px)]

              overflow-hidden

              rounded-2xl
              border
              border-gray-200
              dark:border-gray-700

              bg-white
              dark:bg-gray-900

              shadow-2xl
            "
          >
            {/* HEADER */}
            <div
              className="
                flex
                items-center
                justify-between
                px-4
                py-3
                border-b
                border-gray-200
                dark:border-gray-700
              "
            >
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Notifications
                </h3>

                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Paiements à effectuer
                </p>
              </div>

              {notifications.length > 0 && (
                <span
                  className="
                    rounded-full
                    bg-red-100
                    dark:bg-red-900/30
                    px-2
                    py-1
                    text-xs
                    font-medium
                    text-red-600
                    dark:text-red-400
                  "
                >
                  {notifications.length}
                </span>
              )}
            </div>

            {/* CONTENU */}
            <div className="max-h-[430px] overflow-y-auto">
              {renderNotifications()}
            </div>
          </div>

          {/* =========================================================
              VERSION MOBILE
              < 480px
              Prend tout l'écran
          ========================================================== */}
          <div
            className="
              min-[481px]:hidden

              fixed
              inset-0
              z-[9999]

              w-screen
              h-screen

              bg-white
              dark:bg-gray-900
            "
          >
            {/* HEADER MOBILE */}
            <div
              className="
                sticky
                top-0
                z-10

                flex
                items-center
                justify-between

                h-16
                px-4

                border-b
                border-gray-200
                dark:border-gray-700

                bg-white
                dark:bg-gray-900
              "
            >
              <div className="flex items-center gap-3">
                <div
                  className="
                    flex
                    items-center
                    justify-center

                    w-9
                    h-9

                    rounded-full

                    bg-red-100
                    dark:bg-red-900/30
                  "
                >
                  <Bell size={19} className="text-red-500 dark:text-red-400" />
                </div>

                <div>
                  <h3
                    className="
                      text-base
                      font-semibold
                      text-gray-900
                      dark:text-white
                    "
                  >
                    Notifications
                  </h3>

                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Paiements à effectuer
                  </p>
                </div>
              </div>

              {/* BOUTON X */}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fermer les notifications"
                className="
                  flex
                  items-center
                  justify-center

                  w-10
                  h-10
                  text-4xl
                  font-bold
                  rounded-full

                  text-gray-500
                  dark:text-gray-400

                  hover:bg-gray-100
                  dark:hover:bg-gray-800

                  active:scale-95

                  transition
                "
              >
                X
              </button>
            </div>

            {/* CONTENU MOBILE */}
            <div
              className="
                h-[calc(100vh-64px)]
                overflow-y-auto
              "
            >
              {renderNotifications()}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
