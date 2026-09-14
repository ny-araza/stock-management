import { ReactNode } from "react";
import Button from "../../components/ui/button/Button";

interface AnimatedButtonProps {
  icon: ReactNode;
  children: ReactNode;
  onClick?: () => void;
}

export default function AnimatedButton({
  icon,
  children,
  onClick,
}: AnimatedButtonProps) {
  return (
    <Button
      onClick={onClick}
      variant="outline"
      className="
        group
        relative
        h-40
        sm:h-52
        md:h-60
        w-full
        overflow-hidden
        rounded-xl
        transition-all
        duration-100
        ease-out
        hover:-translate-y-1
      "
    >
      <div
        className="
          absolute
          inset-0
          flex
          flex-col
          items-center
          justify-center
        "
      >
        {/* Icône */}
        <div
          className="
            transition-all
            duration-300
            ease-out

            sm:group-hover:-translate-y-5
            sm:group-hover:scale-75
          "
        >
          {icon}
        </div>

        {/* Texte */}
        <span
          className="
            absolute
            bottom-6

            text-base
            font-semibold

            opacity-100
            translate-y-0

            sm:bottom-5
            sm:text-sm

            transition-all
            duration-300
            ease-out
          "
        >
          {children}
        </span>
      </div>
    </Button>
  );
}
