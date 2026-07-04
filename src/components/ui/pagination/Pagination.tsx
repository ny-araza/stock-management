import Button from "../button/Button";

interface PaginationProps {
    page: number;
    totalPages: number;
    totalCount: number;
    hasPrevious: boolean;
    hasNext: boolean;
    onPageChange: (page: number) => void;
}

export default function Pagination({
    page,
    totalPages,
    totalCount,
    hasPrevious,
    hasNext,
    onPageChange,
}: PaginationProps) {
    const getVisiblePages = () => {
        const delta = 2;
        const pages: (number | string)[] = [];

        const start = Math.max(1, page - delta);
        const end = Math.min(totalPages, page + delta);

        if (start > 1) {
            pages.push(1);

            if (start > 2) {
                pages.push("...");
            }
        }

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }

        if (end < totalPages) {
            if (end < totalPages - 1) {
                pages.push("...");
            }

            pages.push(totalPages);
        }

        return pages;
    };

    return (
        <div className="w-full flex items-center justify-between p-4 border-t border-gray-100 dark:border-white/[0.05]">
            <span className="text-sm text-gray-500 dark:text-gray-400">
                Page <strong>{page}</strong> sur <strong>{totalPages}</strong>
                {" "}({totalCount} éléments)
            </span>

            <div className="flex items-center gap-2 flex-wrap">
                <Button
                    onClick={() => onPageChange(page - 1)}
                    disabled={!hasPrevious}
                >
                    Précédent
                </Button>

                {getVisiblePages().map((item, index) =>
                    item === "..." ? (
                        <span
                            key={index}
                            className="px-2 text-gray-500"
                        >
                            ...
                        </span>
                    ) : (
                        <span
                            key={item}
                            onClick={() => onPageChange(item as number)}
                            className={
                                page === item
                                    ? "bg-blue-600 text-white hover:bg-blue-700 rounded-full"
                                    : "text-sm text-gray-500 dark:text-gray-400 cursor-pointer"
                            }
                        >
                            {item}
                        </span>
                    )
                )}

                <Button
                    onClick={() => onPageChange(page + 1)}
                    disabled={!hasNext}
                >
                    Suivant
                </Button>
            </div>
        </div>
    );
}