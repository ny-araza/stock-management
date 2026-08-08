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
        h-60
        w-full
        overflow-hidden
        rounded-xl
        border
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
            group-hover:-translate-y-5
            group-hover:scale-75
          "
        >
          {icon}
        </div>

        {/* Texte */}
        <span
          className="
            absolute
            bottom-8
            opacity-0
            translate-y-5
            text-lg
            font-semibold
            transition-all
            duration-300
            ease-out
            group-hover:opacity-100
            group-hover:translate-y-0
          "
        >
          {children}
        </span>
      </div>
    </Button>
  );
}
